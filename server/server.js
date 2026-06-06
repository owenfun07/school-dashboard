import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { google } from "googleapis";
import path from "path";

dotenv.config();

const app = express();
app.use(cors());
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

// ── In-memory refresh token store ──────────────────────────────────────
// Maps access_token → refresh_token so we can silently get new access tokens
// when they expire (Google access tokens last ~1 hour).
const refreshTokenStore = new Map();

// Build a fresh OAuth client for each request using the provided access token.
// If the token is expired, silently refresh it and return the new one.
async function buildAuthClient(accessToken) {
  const client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);
  client.setCredentials({ access_token: accessToken });

  const refreshToken = refreshTokenStore.get(accessToken);
  if (refreshToken) {
    client.setCredentials({
      access_token: accessToken,
      refresh_token: refreshToken,
    });

    // Hook: when googleapis silently refreshes, capture the new access token
    client.on("tokens", (tokens) => {
      if (tokens.access_token && tokens.refresh_token) {
        refreshTokenStore.set(tokens.access_token, tokens.refresh_token);
      } else if (tokens.access_token && refreshToken) {
        refreshTokenStore.set(tokens.access_token, refreshToken);
      }
    });
  }

  return client;
}

// ── LOGIN ───────────────────────────────────────────────────────────────
app.get("/auth/google", (req, res) => {
  const client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);
  const isPopup = req.query.popup === "1";
  const url = client.generateAuthUrl({
    access_type: "offline",   // request refresh token
    prompt: "consent",        // always show consent so we get refresh_token every time
    scope: SCOPES,
    state: isPopup ? "popup" : "default",
  });
  res.redirect(url);
});

// ── CALLBACK ────────────────────────────────────────────────────────────
app.get("/auth/google/callback", async (req, res) => {
  try {
    const client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);
    const { tokens } = await client.getToken(req.query.code);

    const accessToken  = tokens.access_token;
    const refreshToken = tokens.refresh_token;

    // Store the refresh token against the access token
    if (accessToken && refreshToken) {
      refreshTokenStore.set(accessToken, refreshToken);
    }

    const isPopupFlow = req.query.state === "popup";

    if (isPopupFlow) {
      const safeToken = JSON.stringify(accessToken || "");
      res.send(`<!DOCTYPE html><html><body><script>
        if (window.opener) {
          window.opener.postMessage({ type: "google-auth-success", token: ${safeToken} }, window.location.origin);
        }
        window.close();
      <\/script></body></html>`);
      return;
    }

    res.redirect(`/dashboard?token=${accessToken}`);
  } catch (err) {
    console.error("Auth callback error:", err);
    res.send("Auth error");
  }
});

// ── CLASSROOM ───────────────────────────────────────────────────────────
app.get("/api/classroom", async (req, res) => {
  try {
    const auth      = await buildAuthClient(req.query.token);
    const classroom = google.classroom({ version: "v1", auth });
    const courses   = await classroom.courses.list();
    res.json(courses.data);
  } catch (err) {
    console.error("Classroom error:", err);
    res.status(401).json({ error: "Invalid credentials. Please re-login." });
  }
});

// ── COURSEWORK ──────────────────────────────────────────────────────────
app.get("/api/coursework", async (req, res) => {
  try {
    const { token, courseId } = req.query;
    if (!courseId) return res.status(400).json({ error: "courseId is required" });

    const auth      = await buildAuthClient(token);
    const classroom = google.classroom({ version: "v1", auth });

    const coursework = await classroom.courses.courseWork.list({
      courseId,
      pageSize: 50,
    });

    const courseWorkWithState = await Promise.all(
      (coursework.data.courseWork || []).map(async work => {
        try {
          const subs = await classroom.courses.courseWork.studentSubmissions.list({
            courseId, courseWorkId: work.id, userId: "me", pageSize: 1,
          });
          return { ...work, mySubmissionState: subs.data.studentSubmissions?.[0]?.state || "UNKNOWN" };
        } catch {
          return { ...work, mySubmissionState: "UNKNOWN" };
        }
      })
    );

    res.json({ ...coursework.data, courseWork: courseWorkWithState });
  } catch (err) {
    console.error("Coursework error:", err);
    res.status(401).json({ error: "Invalid credentials. Please re-login." });
  }
});

// ── CALENDAR ────────────────────────────────────────────────────────────
app.get("/api/calendar", async (req, res) => {
  try {
    const auth     = await buildAuthClient(req.query.token);
    const calendar = google.calendar({ version: "v3", auth });

    const calListResp = await calendar.calendarList.list({
      minAccessRole: "reader",
      showHidden: false,
    });

    const calendars = (calListResp.data.items || []).filter(c => !c.deleted);
    const timeMin   = new Date().toISOString();

    const eventResponses = await Promise.all(
      calendars.map(async cal => {
        try {
          const resp = await calendar.events.list({
            calendarId: cal.id,
            maxResults: 50,
            singleEvents: true,
            orderBy: "startTime",
            timeMin,
          });
          return (resp.data.items || []).map(ev => ({
            ...ev,
            sourceCalendarId:      cal.id,
            sourceCalendarSummary: cal.summary || "Calendar",
          }));
        } catch { return []; }
      })
    );

    const allEvents = eventResponses.flat().sort((a, b) => {
      const sa = new Date(a.start?.dateTime || a.start?.date || 0).getTime();
      const sb = new Date(b.start?.dateTime || b.start?.date || 0).getTime();
      return sa - sb;
    });

    res.json({ items: allEvents });
  } catch (err) {
    console.error("Calendar error:", err);
    res.status(401).json({ error: "Invalid credentials. Please re-login." });
  }
});

// ── DRIVE FILE LIST ─────────────────────────────────────────────────────
app.get("/api/drive", async (req, res) => {
  try {
    const { token, q = "", starred, recent } = req.query;
    const auth  = await buildAuthClient(token);
    const drive = google.drive({ version: "v3", auth });

    const escaped = String(q).replace(/'/g, "\\'");
    const parts   = ["trashed = false"];
    if (escaped)          parts.push(`name contains '${escaped}'`);
    if (starred === "1")  parts.push("starred = true");

    const files = await drive.files.list({
      q:       parts.join(" and "),
      pageSize: 30,
      fields:  "files(id,name,webViewLink,thumbnailLink,starred,mimeType,viewedByMeTime,modifiedTime)",
      orderBy: recent === "1" ? "viewedByMeTime desc" : "modifiedTime desc",
    });

    res.json({ files: files.data.files || [] });
  } catch (err) {
    console.error("Drive error:", err);
    res.status(401).json({ error: "Invalid credentials. Please re-login." });
  }
});

// ── DRIVE STAR TOGGLE ───────────────────────────────────────────────────
app.get("/api/drive/star", async (req, res) => {
  try {
    const { token, fileId, starred } = req.query;
    if (!fileId) return res.status(400).json({ error: "fileId is required" });

    const auth  = await buildAuthClient(token);
    const drive = google.drive({ version: "v3", auth });

    const updated = await drive.files.update({
      fileId,
      requestBody: { starred: starred === "1" },
      fields: "id,name,starred",
    });

    res.json(updated.data);
  } catch (err) {
    console.error("Drive star error:", err);
    res.status(401).json({ error: "Invalid credentials. Please re-login." });
  }
});

// ── PAGE ROUTES ─────────────────────────────────────────────────────────
app.get("/dashboard",  (req, res) => res.sendFile(path.join(process.cwd(), "../client/dashboard.html")));
app.get("/about",      (req, res) => res.sendFile(path.join(process.cwd(), "../client/about.html")));

app.get("/:page", (req, res) => {
  const file = path.join(process.cwd(), `../client/${req.params.page}.html`);
  res.sendFile(file, err => {
    if (err) res.status(404).send("Page not found");
  });
});

app.listen(3000, () => console.log("Server running on port 3000"));
