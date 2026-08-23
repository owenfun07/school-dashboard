import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { google } from "googleapis";
import path from "path";
import crypto from "crypto";

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
  const model = "gemini-3.5-flash-lite"; //was gemini-2.0-flash-lite
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

// ── Citation AI helpers ─────────────────────────────────────────────────
const CITATION_AI_MODEL = "gemini-3.5-flash-lite";
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

function buildCitationPrompt(input, { grounded = false } = {}) {
  const evidenceInstruction = grounded
    ? "Use Google Search grounding to verify the exact webpage and fill only fields supported by search results."
    : "Use only the provided URL and metadata context. Do not guess if the evidence is not strong.";
  return `You are a citation metadata expert. A user wants to cite this webpage:

URL: ${input.url}
Currently known fields:
- Title: ${input.title || "(missing)"}
- Author: ${input.author || "(missing)"}
- Publisher / Site name: ${input.publisher || "(missing)"}
- Publish date: ${input.publishDate || "(missing)"}

Your job: fill in any missing or incomplete fields. ${evidenceInstruction}
Rules:
- Only return a JSON object, no markdown, no explanation, no backticks.
- Use exactly these keys: title, author, publisher, publishDate
- publishDate must be in YYYY-MM-DD format, or empty string if unknown
- author should be "Last, First" format if possible, or the organisation name
- publisher should be the website/organisation name, not the full URL
- If you genuinely cannot determine a field, use empty string ""
- Do not invent specific people's names or publication dates if not confident

Respond with only valid JSON like:
{"title":"...","author":"...","publisher":"...","publishDate":"..."}`;
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

async function callGeminiCitation({ apiKey, input, grounded = false }) {
  const requestBody = {
    contents: [{ parts: [{ text: buildCitationPrompt(input, { grounded }) }] }],
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

// ── Citation AI ─────────────────────────────────────────────────────────
app.post("/api/ai/enhance-citation", async (req, res) => {
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  if (!GEMINI_API_KEY) return res.status(503).json({ error: "AI enhancement is not configured on this server." });

  const input = normalizeCitationInput(req.body || {});
  if (!input.url) return res.status(400).json({ error: "url is required" });

  const originallyMissing = getRemainingMissingFields(input);
  if (originallyMissing.length === 0) {
    return res.json({ success: true, data: normalizeCitationData(input), ai: { mode: "not_needed", missingFields: [], sources: [] } });
  }

  let standardResult = null;
  let standardError  = null;

  try {
    standardResult = await callGeminiCitation({ apiKey: GEMINI_API_KEY, input, grounded: false });
    if (getRemainingMissingFields(input, standardResult.data).length === 0) {
      return res.json({ success: true, data: standardResult.data, ai: { mode: "standard", attemptedGrounding: false, missingFields: [], sources: [] } });
    }
  } catch (err) { standardError = err; console.error("Gemini standard error:", err); }

  try {
    const groundedResult = await callGeminiCitation({ apiKey: GEMINI_API_KEY, input, grounded: true });
    const mergedData = mergeCitationData(standardResult?.data, groundedResult.data);
    return res.json({ success: true, data: mergedData, ai: { mode: "grounded", attemptedGrounding: true, missingFields: getRemainingMissingFields(input, mergedData), sources: groundedResult.sources } });
  } catch (groundedError) {
    console.error("Gemini grounded error:", groundedError);
    if (standardResult) {
      return res.json({ success: true, data: standardResult.data, ai: { mode: "standard", attemptedGrounding: true, missingFields: getRemainingMissingFields(input, standardResult.data), sources: [], warning: "google_search_grounding_unavailable" } });
    }
    const status = groundedError?.response?.status || standardError?.response?.status || 500;
    return res.status(status).json({ error: status === 429 ? "quota_exceeded" : "ai_unavailable" });
  }
});

// ── Developer Mode ─────────────────────────────────────────────────────
// The secret code is server-side only. It is never sent to the browser.
app.post("/api/dev-mode/verify", (req, res) => {
  const expected = process.env.DEV_API_CODE;
  const provided = typeof req.body?.code === "string" ? req.body.code : "";

  if (!hasConfigValue(expected)) {
    return res.status(503).json({ success: false, error: "Developer mode is not configured." });
  }

  const expectedBuffer = Buffer.from(expected);
  const providedBuffer = Buffer.from(provided);
  const valid = expectedBuffer.length === providedBuffer.length &&
    crypto.timingSafeEqual(expectedBuffer, providedBuffer);

  if (!valid) return res.status(401).json({ success: false, error: "Invalid developer code." });
  return res.json({ success: true });
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
