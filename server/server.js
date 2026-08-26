import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { google } from "googleapis";
import path from "path";
import crypto from "crypto";
import dns from "dns";
import net from "net";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(process.cwd(), "../client")));

app.get("/", (req, res) => {
  res.sendFile(path.join(process.cwd(), "../client/index.html"));
});

const CLIENT_ID     = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT_URI  = process.env.REDIRECT_URI;

const SCOPES = [
  "https://www.googleapis.com/auth/classroom.courses.readonly",
  "https://www.googleapis.com/auth/classroom.coursework.me.readonly",
  "https://www.googleapis.com/auth/classroom.student-submissions.me.readonly",
  "https://www.googleapis.com/auth/calendar.readonly",
  "https://www.googleapis.com/auth/drive"
];

const GOOGLE_API_SERVICES = [
  {
    key: "oauth",
    name: "Google OAuth",
    description: "Signs users in and grants the dashboard access to Google APIs.",
    scopes: SCOPES,
    requiresToken: false,
  },
  {
    key: "classroom",
    name: "Google Classroom API",
    description: "Loads classes, assignments, submissions, and grades.",
    scopes: SCOPES.filter(scope => scope.includes("classroom")),
    requiresToken: true,
  },
  {
    key: "calendar",
    name: "Google Calendar API",
    description: "Loads upcoming events from calendars the user can read.",
    scopes: ["https://www.googleapis.com/auth/calendar.readonly"],
    requiresToken: true,
  },
  {
    key: "drive",
    name: "Google Drive API",
    description: "Searches recent and starred Drive files and updates starred state.",
    scopes: ["https://www.googleapis.com/auth/drive"],
    requiresToken: true,
  },
  {
    key: "gemini",
    name: "Gemini API",
    description: "Enhances citation metadata from the server-side AI citation endpoint.",
    scopes: [],
    requiresToken: false,
  },
];

function hasConfigValue(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function maskConfigValue(value) {
  if (!hasConfigValue(value)) return null;
  if (value.length <= 10) return `${value.slice(0, 2)}…${value.slice(-2)}`;
  return `${value.slice(0, 6)}…${value.slice(-4)}`;
}

function getEnvStatus() {
  return {
    clientId:     { configured: hasConfigValue(CLIENT_ID),                masked: maskConfigValue(CLIENT_ID) },
    clientSecret: { configured: hasConfigValue(CLIENT_SECRET) },
    redirectUri:  { configured: hasConfigValue(REDIRECT_URI),             value: REDIRECT_URI || null },
    geminiApiKey: { configured: hasConfigValue(process.env.GEMINI_API_KEY) },
  };
}

function getErrorDebug(err) {
  return {
    message:                  err?.message || "Unknown error",
    code:                     err?.code || err?.response?.status || null,
    status:                   err?.response?.status || null,
    statusText:               err?.response?.statusText || null,
    googleError:              err?.response?.data?.error || null,
    googleErrorDescription:   err?.response?.data?.error_description || null,
    errors:                   err?.response?.data?.error?.errors || null,
    details:                  err?.details || null,
  };
}

async function runGoogleApiCheck(key, label, fn) {
  const started = Date.now();
  try {
    const data = await fn();
    return { key, label, status: "ok", latencyMs: Date.now() - started, checkedAt: new Date().toISOString(), data };
  } catch (err) {
    return { key, label, status: "error", latencyMs: Date.now() - started, checkedAt: new Date().toISOString(), error: getErrorDebug(err) };
  }
}

async function checkGeminiApi() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!hasConfigValue(apiKey)) {
    throw new Error("GEMINI_API_KEY is not configured.");
  }
  const model = "gemini-3.1-flash-lite"; //was gemini-2.0-flash-lite
  const geminiResp = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: "Reply with exactly: ok" }] }],
        generationConfig: { temperature: 0, maxOutputTokens: 8 },
      }),
    }
  );
  const geminiData = await geminiResp.json().catch(() => ({}));
  if (!geminiResp.ok) {
    const err = new Error(geminiData?.error?.message || `Gemini API responded with HTTP ${geminiResp.status}`);
    err.response = { status: geminiResp.status, statusText: geminiResp.statusText, data: geminiData };
    throw err;
  }
  return {
    model,
    responded: true,
    responseText: geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || "",
    finishReason: geminiData?.candidates?.[0]?.finishReason || null,
  };
}

// ── Server-side citation webpage retrieval ───────────────────────────────
const CITATION_FETCH_TIMEOUT_MS = 12000;
const CITATION_MAX_HTML_BYTES = 2 * 1024 * 1024;
const CITATION_MAX_EXCERPT_CHARS = 8000;
const CITATION_MAX_REDIRECTS = 5;

function decodeBasicHtmlEntities(value = "") {
  return String(value)
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">");
}

function cleanHtmlText(value = "") {
  return decodeBasicHtmlEntities(value)
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeCitationUrl(value) {
  try {
    const url = new URL(value);
    if (!["http:", "https:"].includes(url.protocol)) throw new Error("Only HTTP and HTTPS URLs are supported.");
    url.username = "";
    url.password = "";
    return url;
  } catch {
    throw new Error("Please provide a valid HTTP or HTTPS URL.");
  }
}

function isPrivateIpv4(address) {
  const parts = address.split(".").map(Number);
  if (parts.length !== 4 || parts.some(n => !Number.isInteger(n) || n < 0 || n > 255)) return false;
  const [a, b] = parts;
  return a === 10 || a === 127 || a === 0 || (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168);
}

function isPrivateIp(address) {
  if (net.isIPv4(address)) return isPrivateIpv4(address);
  if (!net.isIPv6(address)) return false;
  const normalized = address.toLowerCase();
  return normalized === "::1" || normalized === "::" || normalized.startsWith("fc") || normalized.startsWith("fd") || normalized.startsWith("fe8") || normalized.startsWith("fe9") || normalized.startsWith("fea") || normalized.startsWith("feb") || normalized.startsWith("::ffff:127.") || normalized.startsWith("::ffff:10.") || normalized.startsWith("::ffff:192.168.");
}

async function validateCitationFetchUrl(rawUrl) {
  const url = normalizeCitationUrl(rawUrl);
  const hostname = url.hostname.toLowerCase();
  if (hostname === "localhost" || hostname.endsWith(".localhost") || hostname === "metadata.google.internal" || hostname.endsWith(".internal")) {
    throw new Error("This URL is not allowed.");
  }
  const addresses = await dns.promises.lookup(hostname, { all: true, verbatim: true });
  if (!addresses.length || addresses.some(entry => isPrivateIp(entry.address))) {
    throw new Error("This URL points to a private or local network address and cannot be fetched.");
  }
  return url;
}

async function fetchCitationHtml(rawUrl) {
  let currentUrl = rawUrl;
  let redirectCount = 0;
  while (true) {
    const url = await validateCitationFetchUrl(currentUrl);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), CITATION_FETCH_TIMEOUT_MS);
    try {
      const response = await fetch(url, {
        method: "GET",
        redirect: "manual",
        signal: controller.signal,
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; SchoolDashboardCitationBot/1.0; +https://school-dashboard-yabz.onrender.com/)",
          "Accept": "text/html,application/xhtml+xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.8",
        },
      });
      if ([301, 302, 303, 307, 308].includes(response.status)) {
        if (++redirectCount > CITATION_MAX_REDIRECTS) throw new Error("Too many redirects while fetching the webpage.");
        const location = response.headers.get("location");
        if (!location) throw new Error("The webpage returned a redirect without a destination.");
        currentUrl = new URL(location, url).toString();
        continue;
      }
      if (!response.ok) throw new Error(`The webpage returned HTTP ${response.status}.`);
      const contentType = response.headers.get("content-type") || "";
      if (!/text\/html|application\/xhtml\+xml/i.test(contentType)) throw new Error("The URL did not return an HTML webpage.");
      const contentLength = Number(response.headers.get("content-length"));
      if (Number.isFinite(contentLength) && contentLength > CITATION_MAX_HTML_BYTES) throw new Error("The webpage is too large to analyze safely.");
      const reader = response.body?.getReader();
      if (!reader) throw new Error("The webpage response could not be read.");
      const chunks = [];
      let total = 0;
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        total += value.byteLength;
        if (total > CITATION_MAX_HTML_BYTES) {
          await reader.cancel();
          throw new Error("The webpage is too large to analyze safely.");
        }
        chunks.push(value);
      }
      const bytes = new Uint8Array(total);
      let offset = 0;
      for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
      return { html: new TextDecoder("utf-8", { fatal: false }).decode(bytes), finalUrl: url.toString(), contentType };
    } catch (err) {
      if (err?.name === "AbortError") throw new Error("The webpage took too long to respond.");
      throw err;
    } finally {
      clearTimeout(timeout);
    }
  }
}

function extractHtmlMeta(html, key) {
  const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const first = new RegExp(`<meta\\b[^>]*(?:name|property)=["']${escaped}["'][^>]*content=["']([^"']*)["'][^>]*>`, "i");
  const second = new RegExp(`<meta\\b[^>]*content=["']([^"']*)["'][^>]*(?:name|property)=["']${escaped}["'][^>]*>`, "i");
  return decodeBasicHtmlEntities((html.match(first)?.[1] || html.match(second)?.[1] || "").trim());
}

function extractJsonLdObjects(html) {
  const objects = [];
  const scripts = html.match(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>/gi) || [];
  for (const script of scripts) {
    const raw = script.replace(/^.*?>/s, "").replace(/<\/script>\s*$/i, "").trim();
    if (!raw) continue;
    try {
      const parsed = JSON.parse(raw.replace(/<!--[\s\S]*?-->/g, "").trim());
      if (Array.isArray(parsed)) objects.push(...parsed); else objects.push(parsed);
    } catch { /* Ignore malformed JSON-LD. */ }
  }
  return objects;
}

function findJsonLdArticle(objects) {
  const queue = [...objects];
  while (queue.length) {
    const value = queue.shift();
    if (!value || typeof value !== "object") continue;
    if (Array.isArray(value)) { queue.push(...value); continue; }
    if (Array.isArray(value["@graph"])) queue.push(...value["@graph"]);
    const types = Array.isArray(value["@type"]) ? value["@type"] : [value["@type"]];
    if (types.some(type => /article|newsarticle|report|webpage|blogposting/i.test(String(type)))) return value;
  }
  return objects.find(value => value && typeof value === "object") || null;
}

function extractCitationMetadata(html, finalUrl) {
  const jsonLd = findJsonLdArticle(extractJsonLdObjects(html));
  const authorValue = jsonLd?.author?.name || jsonLd?.author?.[0]?.name || jsonLd?.creator?.name || jsonLd?.creator;
  const publisherValue = jsonLd?.publisher?.name || jsonLd?.isPartOf?.name;
  const title = jsonLd?.headline || jsonLd?.name || extractHtmlMeta(html, "og:title") || extractHtmlMeta(html, "twitter:title") || cleanHtmlText(html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)?.[1] || "");
  const author = (typeof authorValue === "string" ? authorValue : "") || extractHtmlMeta(html, "author") || extractHtmlMeta(html, "article:author");
  const publisher = (typeof publisherValue === "string" ? publisherValue : "") || extractHtmlMeta(html, "og:site_name") || new URL(finalUrl).hostname.replace(/^www\./i, "");
  const publishDate = jsonLd?.datePublished || jsonLd?.dateCreated || extractHtmlMeta(html, "article:published_time") || extractHtmlMeta(html, "date") || extractHtmlMeta(html, "pubdate");
  const parsedDate = publishDate ? new Date(publishDate) : null;
  const cleanDate = parsedDate && !Number.isNaN(parsedDate.getTime()) ? parsedDate.toISOString().slice(0, 10) : "";
  const bodyText = cleanHtmlText(html.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " "));
  return {
    url: finalUrl,
    title: cleanHtmlText(title),
    author: cleanHtmlText(author),
    publisher: cleanHtmlText(publisher),
    publishDate: cleanDate,
    evidence: {
      jsonLdFound: Boolean(jsonLd),
      openGraphFound: Boolean(extractHtmlMeta(html, "og:title") || extractHtmlMeta(html, "og:site_name")),
      metaAuthorFound: Boolean(extractHtmlMeta(html, "author") || extractHtmlMeta(html, "article:author")),
      metaDateFound: Boolean(extractHtmlMeta(html, "article:published_time") || extractHtmlMeta(html, "date") || extractHtmlMeta(html, "pubdate")),
      excerpt: bodyText.slice(0, CITATION_MAX_EXCERPT_CHARS),
    },
  };
}

// ── Citation AI helpers ─────────────────────────────────────────────────
const CITATION_AI_MODEL = "gemini-3.1-flash-lite";
const CITATION_FIELDS   = ["title", "author", "publisher", "publishDate"];

function cleanCitationValue(value) { return typeof value === "string" ? value.trim() : ""; }

function normalizeCitationInput(values = {}) {
  return {
    url:         cleanCitationValue(values.url),
    title:       cleanCitationValue(values.title),
    author:      cleanCitationValue(values.author),
    publisher:   cleanCitationValue(values.publisher),
    publishDate: cleanCitationValue(values.publishDate),
  };
}

function normalizeCitationData(values = {}) {
  return {
    title:       cleanCitationValue(values.title),
    author:      cleanCitationValue(values.author),
    publisher:   cleanCitationValue(values.publisher),
    publishDate: cleanCitationValue(values.publishDate),
  };
}

function mergeCitationData(...sources) {
  const merged = normalizeCitationData();
  sources.forEach(source => {
    const n = normalizeCitationData(source);
    CITATION_FIELDS.forEach(f => { if (n[f]) merged[f] = n[f]; });
  });
  return merged;
}

function getRemainingMissingFields(original, aiData = {}) {
  const o = normalizeCitationInput(original);
  const a = normalizeCitationData(aiData);
  return CITATION_FIELDS.filter(f => !o[f] && !a[f]);
}

function buildCitationPrompt(input, { grounded = false, webpage = null } = {}) {
  const evidenceInstruction = grounded
    ? "Use Google Search grounding to verify the exact webpage and fill only fields supported by search results."
    : "Use only the provided URL and webpage evidence below. Do not guess if the evidence is not strong.";
  const pageEvidence = webpage ? `\nServer-retrieved webpage evidence:\n- Final URL: ${webpage.url}\n- Retrieved title: ${webpage.title || "(missing)"}\n- Retrieved author: ${webpage.author || "(missing)"}\n- Retrieved publisher: ${webpage.publisher || "(missing)"}\n- Retrieved publish date: ${webpage.publishDate || "(missing)"}\n- Structured metadata found: ${webpage.evidence?.jsonLdFound ? "JSON-LD" : "none"}; ${webpage.evidence?.openGraphFound ? "Open Graph" : "no Open Graph"}\n- Page excerpt:\n${webpage.evidence?.excerpt || "(none)"}\n` : "";
  return `You are a citation metadata expert. A user wants to cite this webpage:\n\nURL: ${input.url}\nCurrently known fields:\n- Title: ${input.title || "(missing)"}\n- Author: ${input.author || "(missing)"}\n- Publisher / Site name: ${input.publisher || "(missing)"}\n- Publish date: ${input.publishDate || "(missing)"}\n${pageEvidence}\nYour job: fill in any missing or incomplete fields. ${evidenceInstruction}\nRules:\n- Only return a JSON object, no markdown, no explanation, no backticks.\n- Use exactly these keys: title, author, publisher, publishDate\n- publishDate must be in YYYY-MM-DD format, or empty string if unknown\n- author should be "Last, First" format if possible, or the organisation name\n- publisher should be the website/organisation name, not the full URL\n- If you genuinely cannot determine a field, use empty string ""\n- Do not invent specific people's names or publication dates if not confident\n\nRespond with only valid JSON like:\n{"title":"...","author":"...","publisher":"...","publishDate":"..."}`;
}

function extractGeminiText(geminiData) {
  return geminiData?.candidates?.[0]?.content?.parts?.map(p => p.text || "").join("").trim() || "";
}

function parseCitationJson(raw) {
  const clean = raw.replace(/```json|```/g, "").trim();
  return normalizeCitationData(JSON.parse(clean));
}

function extractGroundingSources(geminiData) {
  return (geminiData?.candidates?.[0]?.groundingMetadata?.groundingChunks || [])
    .map(c => c.web).filter(w => w?.uri)
    .map(w => ({ title: w.title || w.uri, uri: w.uri }));
}

async function callGeminiCitation({ apiKey, input, grounded = false, webpage = null }) {
  const requestBody = {
    contents: [{ parts: [{ text: buildCitationPrompt(input, { grounded, webpage }) }] }],
    generationConfig: { temperature: grounded ? 0 : 0.1, maxOutputTokens: 256 },
  };
  if (grounded) requestBody.tools = [{ google_search: {} }];

  const geminiResp = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${CITATION_AI_MODEL}:generateContent?key=${apiKey}`,
    { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(requestBody) }
  );
  const geminiData = await geminiResp.json().catch(() => ({}));

  if (!geminiResp.ok) {
    const err = new Error(geminiData?.error?.message || `Gemini API responded with HTTP ${geminiResp.status}`);
    err.response = { status: geminiResp.status, statusText: geminiResp.statusText, data: geminiData };
    throw err;
  }

  return {
    data:    parseCitationJson(extractGeminiText(geminiData)),
    sources: grounded ? extractGroundingSources(geminiData) : [],
  };
}

// ── Refresh token store ─────────────────────────────────────────────────
const refreshTokenStore = new Map();

async function buildAuthClient(accessToken) {
  const client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);
  const refreshToken = refreshTokenStore.get(accessToken);
  client.setCredentials(refreshToken
    ? { access_token: accessToken, refresh_token: refreshToken }
    : { access_token: accessToken }
  );
  if (refreshToken) {
    client.on("tokens", (tokens) => {
      const newAccess   = tokens.access_token;
      const newRefresh  = tokens.refresh_token || refreshToken;
      if (newAccess) refreshTokenStore.set(newAccess, newRefresh);
    });
  }
  return client;
}

// ── Auth ────────────────────────────────────────────────────────────────
app.get("/auth/google", (req, res) => {
  const client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);
  const url = client.generateAuthUrl({
    access_type: "offline", prompt: "consent", scope: SCOPES,
    state: req.query.popup === "1" ? "popup" : "default",
  });
  res.redirect(url);
});

app.get("/auth/google/callback", async (req, res) => {
  try {
    const client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);
    const { tokens } = await client.getToken(req.query.code);
    if (tokens.access_token && tokens.refresh_token)
      refreshTokenStore.set(tokens.access_token, tokens.refresh_token);
    if (req.query.state === "popup") {
      const safeToken = JSON.stringify(tokens.access_token || "");
      res.send(`<!DOCTYPE html><html><body><script>
        if (window.opener) window.opener.postMessage({ type:"google-auth-success", token:${safeToken} }, window.location.origin);
        window.close();
      <\/script></body></html>`);
    } else {
      res.redirect(`/dashboard?token=${tokens.access_token}`);
    }
  } catch (err) { console.error("Auth callback error:", err); res.send("Auth error"); }
});

// ── Google APIs ─────────────────────────────────────────────────────────
app.get("/api/classroom", async (req, res) => {
  try {
    const auth = await buildAuthClient(req.query.token);
    const classroom = google.classroom({ version: "v1", auth });
    res.json((await classroom.courses.list()).data);
  } catch (err) { console.error(err); res.status(401).json({ error: "Invalid credentials. Please re-login." }); }
});

app.get("/api/coursework", async (req, res) => {
  try {
    const { token, courseId } = req.query;
    if (!courseId) return res.status(400).json({ error: "courseId is required" });
    const auth = await buildAuthClient(token);
    const classroom = google.classroom({ version: "v1", auth });
    const cw = await classroom.courses.courseWork.list({ courseId, pageSize: 50 });
    const courseWorkWithState = await Promise.all((cw.data.courseWork || []).map(async work => {
      try {
        const subs = await classroom.courses.courseWork.studentSubmissions.list({ courseId, courseWorkId: work.id, userId: "me", pageSize: 1 });
        return { ...work, mySubmissionState: subs.data.studentSubmissions?.[0]?.state || "UNKNOWN" };
      } catch { return { ...work, mySubmissionState: "UNKNOWN" }; }
    }));
    res.json({ ...cw.data, courseWork: courseWorkWithState });
  } catch (err) { console.error(err); res.status(401).json({ error: "Invalid credentials. Please re-login." }); }
});

app.get("/api/calendar", async (req, res) => {
  try {
    const auth = await buildAuthClient(req.query.token);
    const calendar = google.calendar({ version: "v3", auth });
    const calList = await calendar.calendarList.list({ minAccessRole: "reader", showHidden: false });
    const calendars = (calList.data.items || []).filter(c => !c.deleted);
    const timeMin = new Date().toISOString();
    const eventResponses = await Promise.all(calendars.map(async cal => {
      try {
        const resp = await calendar.events.list({ calendarId: cal.id, maxResults: 50, singleEvents: true, orderBy: "startTime", timeMin });
        return (resp.data.items || []).map(ev => ({ ...ev, sourceCalendarId: cal.id, sourceCalendarSummary: cal.summary || "Calendar" }));
      } catch { return []; }
    }));
    const allEvents = eventResponses.flat().sort((a, b) =>
      new Date(a.start?.dateTime || a.start?.date || 0) - new Date(b.start?.dateTime || b.start?.date || 0)
    );
    res.json({ items: allEvents });
  } catch (err) { console.error(err); res.status(401).json({ error: "Invalid credentials. Please re-login." }); }
});

app.get("/api/drive", async (req, res) => {
  try {
    const { token, q = "", starred, recent } = req.query;
    const auth = await buildAuthClient(token);
    const drive = google.drive({ version: "v3", auth });
    const parts = ["trashed = false"];
    const escaped = String(q).replace(/'/g, "\\'");
    if (escaped) parts.push(`name contains '${escaped}'`);
    if (starred === "1") parts.push("starred = true");
    const files = await drive.files.list({
      q: parts.join(" and "), pageSize: 30,
      fields: "files(id,name,webViewLink,thumbnailLink,starred,mimeType,viewedByMeTime,modifiedTime)",
      orderBy: recent === "1" ? "viewedByMeTime desc" : "modifiedTime desc",
    });
    res.json({ files: files.data.files || [] });
  } catch (err) { console.error(err); res.status(401).json({ error: "Invalid credentials. Please re-login." }); }
});

app.get("/api/drive/star", async (req, res) => {
  try {
    const { token, fileId, starred } = req.query;
    if (!fileId) return res.status(400).json({ error: "fileId is required" });
    const auth = await buildAuthClient(token);
    const drive = google.drive({ version: "v3", auth });
    const updated = await drive.files.update({ fileId, requestBody: { starred: starred === "1" }, fields: "id,name,starred" });
    res.json(updated.data);
  } catch (err) { console.error(err); res.status(401).json({ error: "Invalid credentials. Please re-login." }); }
});

app.get("/api/grades", async (req, res) => {
  try {
    const { token, courseId } = req.query;
    if (!courseId) return res.status(400).json({ error: "courseId is required" });
    const auth = await buildAuthClient(token);
    const classroom = google.classroom({ version: "v1", auth });
    const cwResp = await classroom.courses.courseWork.list({ courseId, pageSize: 100 });
    const withGrades = await Promise.all((cwResp.data.courseWork || []).map(async work => {
      try {
        const subResp = await classroom.courses.courseWork.studentSubmissions.list({ courseId, courseWorkId: work.id, userId: "me", pageSize: 1 });
        const sub = subResp.data.studentSubmissions?.[0] || {};
        return { id: work.id, title: work.title, maxPoints: work.maxPoints || null, assignedGrade: sub.assignedGrade ?? null, draftGrade: sub.draftGrade ?? null, state: sub.state || "UNKNOWN", dueDate: work.dueDate || null, workType: work.workType || "ASSIGNMENT" };
      } catch {
        return { id: work.id, title: work.title, maxPoints: work.maxPoints || null, assignedGrade: null, draftGrade: null, state: "UNKNOWN", dueDate: work.dueDate || null, workType: work.workType || "ASSIGNMENT" };
      }
    }));
    res.json({ courseWork: withGrades });
  } catch (err) { console.error(err); res.status(401).json({ error: "Invalid credentials. Please re-login." }); }
});

// ── Google API Status ───────────────────────────────────────────────────
app.get("/api/google/status", async (req, res) => {
  const token = req.query.token;
  const hasToken = hasConfigValue(token);
  const env = getEnvStatus();
  const oauthConfigured = env.clientId.configured && env.clientSecret.configured && env.redirectUri.configured;

  const status = {
    generatedAt: new Date().toISOString(),
    server: { nodeVersion: process.version, platform: process.platform, uptimeSeconds: Math.round(process.uptime()) },
    oauth: { configured: oauthConfigured, tokenProvided: hasToken, refreshTokensCached: refreshTokenStore.size, requestedScopes: SCOPES },
    environment: env,
    services: GOOGLE_API_SERVICES.map(service => ({
      ...service,
      status: service.key === "oauth"
        ? (oauthConfigured ? "configured" : "missing_config")
        : service.key === "gemini"
          ? (env.geminiApiKey.configured ? "configured" : "missing_config")
          : hasToken ? "pending" : "needs_token",
    })),
    checks: [],
  };

  if (!oauthConfigured) {
    status.checks.push({ key: "oauth-config", label: "OAuth environment variables", status: "error", checkedAt: new Date().toISOString(), error: { message: "CLIENT_ID, CLIENT_SECRET, and REDIRECT_URI must be configured." } });
  }

  const geminiCheck = await runGoogleApiCheck("gemini", "Gemini generateContent", checkGeminiApi);
  status.checks.push(geminiCheck);
  status.services = status.services.map(s => s.key === "gemini" ? { ...s, status: geminiCheck.status } : s);

  if (!hasToken) {
    status.checks.push({ key: "access-token", label: "Browser access token", status: "skipped", checkedAt: new Date().toISOString(), data: { message: "No access token provided. Log in then refresh." } });
    return res.json(status);
  }

  const auth = await buildAuthClient(token);

  status.checks.push(await runGoogleApiCheck("token-info", "OAuth token info", async () => {
    const info = await auth.getTokenInfo(token);
    return { audienceMatchesClient: info.aud === CLIENT_ID, expiresInSeconds: info.expiry_date ? Math.max(0, Math.round((info.expiry_date - Date.now()) / 1000)) : null, scopes: info.scopes || [], email: info.email || null };
  }));

  const classroom = google.classroom({ version: "v1", auth });
  const calendar  = google.calendar({ version: "v3", auth });
  const drive     = google.drive({ version: "v3", auth });

  const apiChecks = await Promise.all([
    runGoogleApiCheck("classroom", "Classroom courses.list", async () => {
      const resp = await classroom.courses.list({ pageSize: 1 });
      return { sampleCount: resp.data.courses?.length || 0 };
    }),
    runGoogleApiCheck("calendar", "Calendar calendarList.list", async () => {
      const resp = await calendar.calendarList.list({ maxResults: 1, showHidden: false });
      return { sampleCount: resp.data.items?.length || 0 };
    }),
    runGoogleApiCheck("drive", "Drive files.list", async () => {
      const resp = await drive.files.list({ pageSize: 1, q: "trashed = false", fields: "files(id,name,mimeType,modifiedTime)", orderBy: "modifiedTime desc" });
      return { sampleCount: resp.data.files?.length || 0, sampleFile: resp.data.files?.[0] ? { name: resp.data.files[0].name, mimeType: resp.data.files[0].mimeType } : null };
    }),
  ]);

  status.checks.push(...apiChecks);
  status.services = status.services.map(s => {
    if (s.key === "oauth" || s.key === "gemini") return s;
    const check = apiChecks.find(c => c.key === s.key);
    return { ...s, status: check?.status || s.status };
  });

  return res.json(status);
});

// ── Citation webpage metadata ────────────────────────────────────────────
app.post("/api/citation/fetch-metadata", async (req, res) => {
  const rawUrl = cleanCitationValue(req.body?.url);
  if (!rawUrl) return res.status(400).json({ success: false, error: "url is required" });
  try {
    const fetched = await fetchCitationHtml(rawUrl);
    const metadata = extractCitationMetadata(fetched.html, fetched.finalUrl);
    return res.json({ success: true, data: metadata });
  } catch (err) {
    console.error("Citation webpage fetch error:", err);
    return res.status(502).json({ success: false, error: err?.message || "Could not fetch webpage metadata." });
  }
});

// ── Citation AI ─────────────────────────────────────────────────────────
app.post("/api/ai/enhance-citation", async (req, res) => {
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  if (!GEMINI_API_KEY) return res.status(503).json({ error: "AI enhancement is not configured on this server." });

  const input = normalizeCitationInput(req.body || {});
  if (!input.url) return res.status(400).json({ error: "url is required" });

  let webpage = null;
  try {
    const fetched = await fetchCitationHtml(input.url);
    webpage = extractCitationMetadata(fetched.html, fetched.finalUrl);
  } catch (err) {
    console.warn("Citation webpage retrieval failed; continuing with supplied metadata:", err?.message || err);
  }

  const evidenceData = webpage ? normalizeCitationData(webpage) : normalizeCitationData();
  const enrichedInput = { ...input, ...mergeCitationData(input, evidenceData) };
  const missingAfterWebpage = getRemainingMissingFields(enrichedInput);
  if (missingAfterWebpage.length === 0) {
    return res.json({ success: true, data: normalizeCitationData(enrichedInput), ai: { mode: "webpage", attemptedGrounding: false, missingFields: [], sources: [], webpageRetrieved: Boolean(webpage) } });
  }

  let standardResult = null;
  let standardError  = null;

  try {
    standardResult = await callGeminiCitation({ apiKey: GEMINI_API_KEY, input: enrichedInput, grounded: false, webpage });
    const standardData = mergeCitationData(evidenceData, standardResult.data);
    standardResult = { ...standardResult, data: standardData };
    if (getRemainingMissingFields(enrichedInput, standardData).length === 0) {
      return res.json({ success: true, data: standardData, ai: { mode: "standard", attemptedGrounding: false, missingFields: [], sources: [], webpageRetrieved: Boolean(webpage) } });
    }
  } catch (err) { standardError = err; console.error("Gemini standard error:", err); }

  try {
    const groundedResult = await callGeminiCitation({ apiKey: GEMINI_API_KEY, input: enrichedInput, grounded: true, webpage });
    const mergedData = mergeCitationData(evidenceData, standardResult?.data, groundedResult.data);
    return res.json({ success: true, data: mergedData, ai: { mode: "grounded", attemptedGrounding: true, missingFields: getRemainingMissingFields(enrichedInput, mergedData), sources: groundedResult.sources, webpageRetrieved: Boolean(webpage) } });
  } catch (groundedError) {
    console.error("Gemini grounded error:", groundedError);
    if (standardResult) {
      return res.json({ success: true, data: standardResult.data, ai: { mode: "standard", attemptedGrounding: true, missingFields: getRemainingMissingFields(enrichedInput, standardResult.data), sources: [], warning: "google_search_grounding_unavailable", webpageRetrieved: Boolean(webpage) } });
    }
    const status = groundedError?.response?.status || standardError?.response?.status || 500;
    return res.status(status).json({ error: status === 429 ? "quota_exceeded" : "ai_unavailable" });
  }
});

// ── Developer Mode ─────────────────────────────────────────────────────
// DEV_API_CODE is the secret API key for the Google Apps Script.
// The current developer code is fetched server-side from that script.
const DEV_API_BASE_URL = "https://script.google.com/macros/s/AKfycbxMpC-m6NxcbTJg6KyHgB_TfHd57XPwvMQnNhVn5lwCSnaTe8mD3nk-HogVLYRYCYTS/exec";

app.post("/api/dev-mode/verify", async (req, res) => {
  const apiKey = typeof process.env.DEV_API_CODE === "string" ? process.env.DEV_API_CODE.trim() : "";
  const provided = typeof req.body?.code === "string" ? req.body.code.trim() : "";
  if (!hasConfigValue(apiKey)) return res.status(503).json({ success: false, error: "Developer mode is not configured." });
  if (!provided) return res.status(400).json({ success: false, error: "Developer code is required." });
  try {
    const apiUrl = `${DEV_API_BASE_URL}?key=${encodeURIComponent(apiKey)}`;
    const response = await fetch(apiUrl, { redirect: "follow" });
    const activeCode = (await response.text()).trim();
    if (!response.ok || !activeCode || activeCode.includes("Unauthorized")) {
      console.error("Developer code API fetch failed:", response.status);
      return res.status(503).json({ success: false, error: "Developer verification service unavailable." });
    }
    const expectedBuffer = Buffer.from(activeCode);
    const providedBuffer = Buffer.from(provided);
    const valid = expectedBuffer.length === providedBuffer.length && crypto.timingSafeEqual(expectedBuffer, providedBuffer);
    if (!valid) return res.status(401).json({ success: false, error: "Invalid developer code." });
    return res.json({ success: true });
  } catch (err) {
    console.error("Developer code API error:", err);
    return res.status(503).json({ success: false, error: "Developer verification service unavailable." });
  }
});

// ── Page routes ─────────────────────────────────────────────────────────
app.get("/dashboard",         (req, res) => res.sendFile(path.join(process.cwd(), "../client/dashboard.html")));
app.get("/calculators",       (req, res) => res.sendFile(path.join(process.cwd(), "../client/calculators.html")));
app.get("/calculator",        (req, res) => res.sendFile(path.join(process.cwd(), "../client/calculator.html")));
app.get("/tools",             (req, res) => res.sendFile(path.join(process.cwd(), "../client/tools.html")));
app.get("/google-api-status", (req, res) => res.sendFile(path.join(process.cwd(), "../client/google-api-status.html")));
app.get("/organisation",      (req, res) => res.sendFile(path.join(process.cwd(), "../client/organisation.html")));
app.get("/assignment-tracker",(req, res) => res.sendFile(path.join(process.cwd(), "../client/assignment-tracker.html")));
app.get("/grade-calculator",  (req, res) => res.sendFile(path.join(process.cwd(), "../client/grade-calculator.html")));
app.get("/schedule-builder",  (req, res) => res.sendFile(path.join(process.cwd(), "../client/schedule-builder.html")));
app.get("/about",             (req, res) => res.sendFile(path.join(process.cwd(), "../client/about.html")));

app.get("/:page", (req, res) => {
  const file = path.join(process.cwd(), `../client/${req.params.page}.html`);
  res.sendFile(file, err => { if (err) res.status(404).send("Page not found"); });
});

app.listen(3000, () => console.log("Server running on port 3000"));
