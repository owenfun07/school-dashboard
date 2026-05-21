import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { google } from "googleapis";
import path from "path";

dotenv.config();

const app = express();
app.use(cors());

// Serve static frontend files
app.use(express.static(path.join(process.cwd(), "../client")));

// Root route
app.get("/", (req, res) => {
  res.sendFile(path.join(process.cwd(), "../client/index.html"));
});

// ENV VARIABLES
const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI;

// OAuth setup
const oAuth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI
);

// SCOPES
const SCOPES = [
  "https://www.googleapis.com/auth/classroom.courses.readonly",
  "https://www.googleapis.com/auth/classroom.coursework.me.readonly",
  "https://www.googleapis.com/auth/classroom.student-submissions.me.readonly",
  "https://www.googleapis.com/auth/calendar.readonly",
  "https://www.googleapis.com/auth/drive"
];

// LOGIN ROUTE
app.get("/auth/google", (req, res) => {
  const isPopup = req.query.popup === "1";

  const url = oAuth2Client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
    state: isPopup ? "popup" : "default"
  });

  res.redirect(url);
});

// CALLBACK ROUTE
app.get("/auth/google/callback", async (req, res) => {
  try {
    const { code } = req.query;

    const { tokens } = await oAuth2Client.getToken(code);
    oAuth2Client.setCredentials(tokens);

    const isPopupFlow = req.query.state === "popup";

    if (isPopupFlow) {
      const safeToken = JSON.stringify(tokens.access_token || "");
      res.send(`<!DOCTYPE html><html><body><script>
        if (window.opener) {
          window.opener.postMessage({ type: "google-auth-success", token: ${safeToken} }, window.location.origin);
        }
        window.close();
      </script></body></html>`);
      return;
    }

    // Redirect to CLEAN URL
    res.redirect(`/dashboard?token=${tokens.access_token}`);
  } catch (err) {
    console.error(err);
    res.send("Auth error");
  }
});

// ================= API ROUTES =================

// CLASSROOM
app.get("/api/classroom", async (req, res) => {
  try {
    const token = req.query.token;
    oAuth2Client.setCredentials({ access_token: token });

    const classroom = google.classroom({ version: "v1", auth: oAuth2Client });
    const courses = await classroom.courses.list();

    res.json(courses.data);
  } catch (err) {
    console.error(err);
    res.send("Classroom error");
  }
});


// COURSEWORK
app.get("/api/coursework", async (req, res) => {
  try {
    const token = req.query.token;
    const courseId = req.query.courseId;

    if (!courseId) {
      res.status(400).json({ error: "courseId is required" });
      return;
    }

    oAuth2Client.setCredentials({ access_token: token });

    const classroom = google.classroom({ version: "v1", auth: oAuth2Client });
    const coursework = await classroom.courses.courseWork.list({
      courseId,
      pageSize: 50
    });

    const courseWorkWithState = await Promise.all(
      (coursework.data.courseWork || []).map(async work => {
        try {
          const submissions = await classroom.courses.courseWork.studentSubmissions.list({
            courseId,
            courseWorkId: work.id,
            userId: "me",
            pageSize: 1
          });

          const mySubmission = submissions.data.studentSubmissions?.[0];
          return {
            ...work,
            mySubmissionState: mySubmission?.state || "UNKNOWN"
          };
        } catch (submissionErr) {
          console.error(submissionErr);
          return {
            ...work,
            mySubmissionState: "UNKNOWN"
          };
        }
      })
    );

    res.json({
      ...coursework.data,
      courseWork: courseWorkWithState
    });
  } catch (err) {
    console.error(err);
    res.send("Coursework error");
  }
});

// CALENDAR
app.get("/api/calendar", async (req, res) => {
  try {
    const token = req.query.token;
    oAuth2Client.setCredentials({ access_token: token });

    const calendar = google.calendar({ version: "v3", auth: oAuth2Client });
    const timeMin = new Date().toISOString();

    const calendarListResponse = await calendar.calendarList.list({
      minAccessRole: "reader",
      showHidden: false
    });

    const calendars = (calendarListResponse.data.items || []).filter(item => !item.deleted);

    const eventResponses = await Promise.all(
      calendars.map(async calendarItem => {
        try {
          const response = await calendar.events.list({
            calendarId: calendarItem.id,
            maxResults: 50,
            singleEvents: true,
            orderBy: "startTime",
            timeMin
          });

          return (response.data.items || []).map(event => ({
            ...event,
            sourceCalendarId: calendarItem.id,
            sourceCalendarSummary: calendarItem.summary || "Calendar"
          }));
        } catch (calendarErr) {
          console.error(calendarErr);
          return [];
        }
      })
    );

    const allEvents = eventResponses.flat().sort((a, b) => {
      const startA = new Date(a.start?.dateTime || a.start?.date || 0).getTime();
      const startB = new Date(b.start?.dateTime || b.start?.date || 0).getTime();
      return startA - startB;
    });

    res.json({
      items: allEvents
    });
  } catch (err) {
    console.error(err);
    res.send("Calendar error");
  }
});


// DRIVE FILE SEARCH
app.get("/api/drive", async (req, res) => {
  try {
    const token = req.query.token;
    const query = req.query.q || "";
    const starredOnly = req.query.starred === "1";

    oAuth2Client.setCredentials({ access_token: token });

    const drive = google.drive({ version: "v3", auth: oAuth2Client });

    const escapedQuery = String(query).replace(/'/g, "\\'");
    const queryParts = ["trashed = false"];

    if (escapedQuery) {
      queryParts.push(`name contains '${escapedQuery}'`);
    }

    if (starredOnly) {
      queryParts.push("starred = true");
    }

    const files = await drive.files.list({
      q: queryParts.join(" and "),
      pageSize: 30,
      fields: "files(id,name,webViewLink,starred,mimeType)",
      orderBy: "modifiedTime desc"
    });

    res.json({ files: files.data.files || [] });
  } catch (err) {
    console.error(err);
    res.send("Drive error");
  }
});

// DRIVE STAR TOGGLE
app.get("/api/drive/star", async (req, res) => {
  try {
    const token = req.query.token;
    const fileId = req.query.fileId;
    const starred = req.query.starred === "1";

    if (!fileId) {
      res.status(400).json({ error: "fileId is required" });
      return;
    }

    oAuth2Client.setCredentials({ access_token: token });

    const drive = google.drive({ version: "v3", auth: oAuth2Client });

    const updated = await drive.files.update({
      fileId,
      requestBody: { starred },
      fields: "id,name,starred"
    });

    res.json(updated.data);
  } catch (err) {
    console.error(err);
    res.send("Drive star error");
  }
});

// ================= PAGE ROUTES =================

// Clean URLs
app.get("/dashboard", (req, res) => {
  res.sendFile(path.join(process.cwd(), "../client/dashboard.html"));
});

app.get("/about", (req, res) => {
  res.sendFile(path.join(process.cwd(), "../client/about.html"));
});

// OPTIONAL: Auto-handle future pages
app.get("/:page", (req, res) => {
  const page = req.params.page;
  res.sendFile(path.join(process.cwd(), `../client/${page}.html`));
});

// START SERVER
app.listen(3000, () => {
  console.log("Server running on port 3000");
});
