import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { google } from "googleapis";

dotenv.config();

const app = express();
app.use(cors());

const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT_URI = "http://localhost:3000/auth/google/callback";

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

// Step 1: Redirect to Google login
app.get("/auth/google", (req, res) => {
  const url = oAuth2Client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES
  });
  res.redirect(url);
});

// Step 2: Handle callback
app.get("/auth/google/callback", async (req, res) => {
  const { code } = req.query;

  const { tokens } = await oAuth2Client.getToken(code);
  oAuth2Client.setCredentials(tokens);

  res.redirect(`/dashboard.html?token=${tokens.access_token}`);
});

// Fetch Classroom data
app.get("/api/classroom", async (req, res) => {
  const token = req.query.token;
  oAuth2Client.setCredentials({ access_token: token });

  const classroom = google.classroom({ version: "v1", auth: oAuth2Client });

  const courses = await classroom.courses.list();
  res.json(courses.data);
});

// Fetch Calendar events
app.get("/api/calendar", async (req, res) => {
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
});

app.listen(3000, () => console.log("Server running on http://localhost:3000"));
