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
  "https://www.googleapis.com/auth/calendar.readonly"
];

// LOGIN ROUTE
app.get("/auth/google", (req, res) => {
  const url = oAuth2Client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES
  });
  res.redirect(url);
});

// CALLBACK ROUTE
app.get("/auth/google/callback", async (req, res) => {
  try {
    const { code } = req.query;

    const { tokens } = await oAuth2Client.getToken(code);
    oAuth2Client.setCredentials(tokens);

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

// CALENDAR
app.get("/api/calendar", async (req, res) => {
  try {
    const token = req.query.token;
    oAuth2Client.setCredentials({ access_token: token });

    const calendar = google.calendar({ version: "v3", auth: oAuth2Client });

    const events = await calendar.events.list({
      calendarId: "primary",
      maxResults: 10,
      singleEvents: true,
      orderBy: "startTime"
    });

    res.json(events.data);
  } catch (err) {
    console.error(err);
    res.send("Calendar error");
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
