// =====================================================================
// SETTINGS & THEME SYSTEM
// =====================================================================

const THEMES = {
  default: {
    label: "Default",
    preview: ["#f5f7fb", "#ffffff", "#3b82f6"],
    vars: {}
  },
  slate: {
    label: "Blue Slate",
    preview: ["#f0f4ff", "#ffffff", "#2563eb"],
    vars: {
      "--dash-bg": "#f0f4ff",
      "--card-bg": "#ffffff",
      "--card-border": "#c7d7f9",
      "--card-accent-classes": "#2563eb",
      "--card-accent-assignments": "#10b981",
      "--card-accent-drive": "#8b5cf6",
      "--card-accent-calendar": "#f59e0b",
      "--accent-left-border": "1",
    }
  },
  warm: {
    label: "Warm Sand",
    preview: ["#faf6ef", "#fffdf7", "#b8955a"],
    vars: {
      "--dash-bg": "#faf6ef",
      "--card-bg": "#fffdf7",
      "--card-border": "#e0d8c4",
      "--card-accent-classes": "#b8955a",
      "--card-accent-assignments": "#7a9e60",
      "--card-accent-drive": "#9e6a7a",
      "--card-accent-calendar": "#6a7a9e",
      "--accent-left-border": "1",
    }
  },
  forest: {
    label: "Forest",
    preview: ["#f0f7f2", "#ffffff", "#2d6a4f"],
    vars: {
      "--dash-bg": "#f0f7f2",
      "--card-bg": "#ffffff",
      "--card-border": "#b7dfc8",
      "--card-accent-classes": "#2d6a4f",
      "--card-accent-assignments": "#52b788",
      "--card-accent-drive": "#74c69d",
      "--card-accent-calendar": "#1b4332",
      "--accent-left-border": "1",
    }
  },
  midnight: {
    label: "Midnight",
    preview: ["#1a1f2e", "#252b3b", "#4a7cf0"],
    vars: {
      "--dash-bg": "#1a1f2e",
      "--card-bg": "#252b3b",
      "--card-border": "#2e3650",
      "--text-primary": "#e8ecf4",
      "--text-secondary": "#8892aa",
      "--text-muted": "#6b7899",
      "--card-accent-classes": "#4a7cf0",
      "--card-accent-assignments": "#3ac97a",
      "--card-accent-drive": "#c084fc",
      "--card-accent-calendar": "#f0a040",
      "--accent-left-border": "1",
    }
  }
};

const DEFAULT_CARD_ORDER = ["classes", "assignments", "drive", "calendar"];

let userPrefs = JSON.parse(localStorage.getItem("dashboard_prefs") || "{}");

function savePrefs() {
  localStorage.setItem("dashboard_prefs", JSON.stringify(userPrefs));
}

function applyTheme(themeKey) {
  const theme = THEMES[themeKey] || THEMES.default;
  const root = document.documentElement;

  // Clear all theme vars first
  const allVarKeys = new Set();
  Object.values(THEMES).forEach(t => Object.keys(t.vars).forEach(k => allVarKeys.add(k)));
  allVarKeys.forEach(k => root.style.removeProperty(k));

  // Apply selected theme vars
  Object.entries(theme.vars).forEach(([k, v]) => root.style.setProperty(k, v));

  // Apply accent left borders per card if theme uses them
  const grid = document.getElementById("dashboard-grid");
  if (!grid) return;
  grid.querySelectorAll(".card[data-card]").forEach(card => {
    const cardKey = card.dataset.card;
    const accentVar = theme.vars["--card-accent-" + cardKey];
    if (accentVar && theme.vars["--accent-left-border"]) {
      card.style.borderLeft = "3px solid " + accentVar;
      card.style.borderRadius = "0 16px 16px 0";
    } else {
      card.style.borderLeft = "";
      card.style.borderRadius = "";
    }
  });

  // Mark active in theme grid
  document.querySelectorAll(".theme-swatch").forEach(s => {
    s.classList.toggle("active", s.dataset.theme === themeKey);
  });
}

function applyCardOrder(order) {
  const grid = document.getElementById("dashboard-grid");
  if (!grid) return;
  const cards = Array.from(grid.querySelectorAll(".card[data-card]"));
  const orderMap = {};
  order.forEach((id, i) => orderMap[id] = i);
  cards.sort((a, b) => {
    const ai = orderMap[a.dataset.card] ?? 99;
    const bi = orderMap[b.dataset.card] ?? 99;
    return ai - bi;
  });
  cards.forEach(c => grid.appendChild(c));
}

function applyCardSizes(sizes) {
  if (!sizes) return;
  Object.entries(sizes).forEach(([cardId, size]) => {
    const card = document.querySelector(`.card[data-card="${cardId}"]`);
    if (!card) return;
    if (size.wide !== undefined) {
      card.classList.toggle("card-wide", size.wide);
    }
  });
}

function applyAllPrefs() {
  applyTheme(userPrefs.theme || "default");
  if (userPrefs.cardOrder) applyCardOrder(userPrefs.cardOrder);
  if (userPrefs.cardSizes) applyCardSizes(userPrefs.cardSizes);
}

// =====================================================================
// SETTINGS PANEL
// =====================================================================

function setupSettings() {
  const settingsBtn = document.getElementById("settings-btn");
  const settingsPanel = document.getElementById("settings-panel");
  const settingsOverlay = document.getElementById("settings-overlay");
  const settingsClose = document.getElementById("settings-close");
  const mainView = document.getElementById("settings-main");
  const customiseView = document.getElementById("settings-customise");
  const openCustomise = document.getElementById("open-customise");
  const customiseBack = document.getElementById("customise-back");
  const logoutBtn = document.getElementById("logout-btn");
  const resetLayoutBtn = document.getElementById("reset-layout-btn");

  function openSettings() {
    settingsPanel.classList.remove("hidden");
    settingsOverlay.classList.remove("hidden");
    showMainView();
  }

  function closeSettings() {
    settingsPanel.classList.add("hidden");
    settingsOverlay.classList.add("hidden");
  }

  function showMainView() {
    mainView.classList.remove("hidden");
    customiseView.classList.add("hidden");
  }

  function showCustomiseView() {
    mainView.classList.add("hidden");
    customiseView.classList.remove("hidden");
    renderThemeGrid();
  }

  settingsBtn.addEventListener("click", openSettings);
  settingsClose.addEventListener("click", closeSettings);
  settingsOverlay.addEventListener("click", closeSettings);
  openCustomise.addEventListener("click", showCustomiseView);
  customiseBack.addEventListener("click", showMainView);

  logoutBtn.addEventListener("click", function () {
    localStorage.removeItem("access_token");
    window.location.href = "/";
  });

  resetLayoutBtn.addEventListener("click", function () {
    delete userPrefs.cardOrder;
    delete userPrefs.cardSizes;
    savePrefs();
    applyCardOrder(DEFAULT_CARD_ORDER);
    // Restore wide classes to default
    document.querySelector('.card[data-card="drive"]').classList.add("card-wide");
    document.querySelector('.card[data-card="calendar"]').classList.add("card-wide");
    document.querySelector('.card[data-card="classes"]').classList.remove("card-wide");
    document.querySelector('.card[data-card="assignments"]').classList.remove("card-wide");
    // Re-apply theme accents after DOM reorder
    applyTheme(userPrefs.theme || "default");
    resetLayoutBtn.textContent = "Reset ✓";
    setTimeout(() => resetLayoutBtn.textContent = "Reset layout to default", 1500);
  });

  // Escape key closes panel
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") closeSettings();
  });
}

// =====================================================================
// THEME GRID
// =====================================================================

function renderThemeGrid() {
  const grid = document.getElementById("theme-grid");
  if (!grid) return;
  grid.innerHTML = "";

  Object.entries(THEMES).forEach(([key, theme]) => {
    const swatch = document.createElement("button");
    swatch.className = "theme-swatch" + ((userPrefs.theme || "default") === key ? " active" : "");
    swatch.dataset.theme = key;
    swatch.title = theme.label;

    const preview = document.createElement("div");
    preview.className = "theme-preview";
    preview.style.background = theme.preview[0];

    const inner = document.createElement("div");
    inner.className = "theme-preview-card";
    inner.style.background = theme.preview[1];
    inner.style.borderLeft = "3px solid " + theme.preview[2];

    preview.appendChild(inner);
    swatch.appendChild(preview);

    const label = document.createElement("span");
    label.className = "theme-label";
    label.textContent = theme.label;
    swatch.appendChild(label);

    swatch.addEventListener("click", function () {
      userPrefs.theme = key;
      savePrefs();
      applyTheme(key);
      document.querySelectorAll(".theme-swatch").forEach(s => s.classList.remove("active"));
      swatch.classList.add("active");
    });

    grid.appendChild(swatch);
  });
}

// =====================================================================
// LAYOUT DRAG-TO-REORDER
// =====================================================================

function setupLayoutDrag() {
  const grid = document.getElementById("dashboard-grid");
  if (!grid) return;

  let dragging = null;
  let placeholder = null;

  grid.querySelectorAll(".card[data-card]").forEach(card => {
    const handle = document.createElement("div");
    handle.className = "card-drag-handle";
    handle.title = "Drag to reorder";
    handle.innerHTML = "⠿";
    card.prepend(handle);

    handle.addEventListener("mousedown", function (e) {
      e.preventDefault();
      dragging = card;
      card.classList.add("card-dragging");

      placeholder = document.createElement("div");
      placeholder.className = "card-placeholder";
      // Match wide class
      if (card.classList.contains("card-wide")) placeholder.classList.add("card-wide");
      grid.insertBefore(placeholder, card.nextSibling);
    });
  });

  document.addEventListener("mousemove", function (e) {
    if (!dragging) return;

    const cards = Array.from(grid.querySelectorAll(".card[data-card]:not(.card-dragging), .card-placeholder"));
    let closest = null;
    let closestDist = Infinity;

    cards.forEach(c => {
      const rect = c.getBoundingClientRect();
      const midY = rect.top + rect.height / 2;
      const midX = rect.left + rect.width / 2;
      const dist = Math.hypot(e.clientX - midX, e.clientY - midY);
      if (dist < closestDist) {
        closestDist = dist;
        closest = c;
      }
    });

    if (closest && closest !== placeholder) {
      const rect = closest.getBoundingClientRect();
      const after = e.clientY > rect.top + rect.height / 2;
      if (after) {
        grid.insertBefore(placeholder, closest.nextSibling);
      } else {
        grid.insertBefore(placeholder, closest);
      }
    }
  });

  document.addEventListener("mouseup", function () {
    if (!dragging) return;
    grid.insertBefore(dragging, placeholder);
    placeholder.remove();
    dragging.classList.remove("card-dragging");

    // Save new order
    const order = Array.from(grid.querySelectorAll(".card[data-card]")).map(c => c.dataset.card);
    userPrefs.cardOrder = order;
    savePrefs();

    // Re-apply theme accents after reorder
    applyTheme(userPrefs.theme || "default");

    dragging = null;
    placeholder = null;
  });
}

// =====================================================================
// NOTES SYSTEM
// =====================================================================

const notesLayer = document.getElementById("notes-layer");
const notesToggleBtn = document.getElementById("notes-toggle");
const addNoteBtn = document.getElementById("add-note");
const notesTray = document.getElementById("notes-tray");

let notesVisible = false;
let notes = JSON.parse(localStorage.getItem("dashboard_notes") || "[]");

function saveNotes() {
  localStorage.setItem("dashboard_notes", JSON.stringify(notes));
}

function getNoteById(id) {
  return notes.find(n => n.id === id);
}

function makeDraggable(el, handleEl, noteId) {
  let dragging = false;
  let offsetX = 0;
  let offsetY = 0;

  handleEl.addEventListener("mousedown", function (e) {
    if (e.target.closest("button") || e.target.closest("[contenteditable]")) return;
    dragging = true;
    offsetX = e.clientX - el.offsetLeft;
    offsetY = e.clientY - el.offsetTop;
    el.style.zIndex = 9999;
    e.preventDefault();
  });

  document.addEventListener("mousemove", function (e) {
    if (!dragging) return;
    const x = Math.max(0, Math.min(window.innerWidth - el.offsetWidth, e.clientX - offsetX));
    const y = Math.max(0, Math.min(window.innerHeight - el.offsetHeight, e.clientY - offsetY));
    el.style.left = x + "px";
    el.style.top = y + "px";
  });

  document.addEventListener("mouseup", function () {
    if (!dragging) return;
    dragging = false;
    el.style.zIndex = "";
    const note = getNoteById(noteId);
    if (note) {
      note.x = el.offsetLeft;
      note.y = el.offsetTop;
      saveNotes();
    }
  });
}

function makeResizable(el, noteId) {
  const handle = document.createElement("div");
  handle.className = "note-resize-handle";
  el.appendChild(handle);

  let resizing = false;
  let startX, startY, startW, startH;

  handle.addEventListener("mousedown", function (e) {
    resizing = true;
    startX = e.clientX;
    startY = e.clientY;
    startW = el.offsetWidth;
    startH = el.offsetHeight;
    el.style.zIndex = 9999;
    e.preventDefault();
    e.stopPropagation();
  });

  document.addEventListener("mousemove", function (e) {
    if (!resizing) return;
    const newW = Math.max(200, startW + (e.clientX - startX));
    const newH = Math.max(120, startH + (e.clientY - startY));
    el.style.width = newW + "px";
    el.style.height = newH + "px";
  });

  document.addEventListener("mouseup", function () {
    if (!resizing) return;
    resizing = false;
    el.style.zIndex = "";
    const note = getNoteById(noteId);
    if (note) {
      note.w = el.offsetWidth;
      note.h = el.offsetHeight;
      saveNotes();
    }
  });
}

function createNoteEl(note) {
  const el = document.createElement("div");
  el.className = "sticky-note";
  el.style.left = (note.x || 120) + "px";
  el.style.top = (note.y || 120) + "px";
  if (note.w) el.style.width = note.w + "px";
  if (note.h) el.style.height = note.h + "px";
  el.dataset.id = String(note.id);

  const head = document.createElement("div");
  head.className = "sticky-head";

  const title = document.createElement("span");
  title.className = "sticky-title";
  title.textContent = note.name || "Note";
  title.title = "Click to rename";
  title.setAttribute("contenteditable", "true");
  title.setAttribute("spellcheck", "false");

  title.addEventListener("keydown", function (e) {
    if (e.key === "Enter") { e.preventDefault(); title.blur(); }
  });

  title.addEventListener("blur", function () {
    const trimmed = title.textContent.trim();
    const n = getNoteById(note.id);
    if (n) {
      n.name = trimmed || "Note";
      title.textContent = n.name;
      saveNotes();
      updateTray();
    }
  });

  const minimizeBtn = document.createElement("button");
  minimizeBtn.className = "note-action-btn";
  minimizeBtn.title = "Minimize to tray";
  minimizeBtn.innerHTML = "&#8722;";
  minimizeBtn.addEventListener("click", function () {
    const n = getNoteById(note.id);
    if (!n) return;
    n.minimized = true;
    saveNotes();
    el.remove();
    updateTray();
  });

  const deleteBtn = document.createElement("button");
  deleteBtn.className = "note-action-btn note-delete-btn";
  deleteBtn.title = "Delete note";
  deleteBtn.innerHTML = "×";
  deleteBtn.addEventListener("click", function () {
    notes = notes.filter(n => n.id !== note.id);
    saveNotes();
    el.remove();
    updateTray();
  });

  head.appendChild(title);
  head.appendChild(minimizeBtn);
  head.appendChild(deleteBtn);

  const body = document.createElement("div");
  body.className = "sticky-body";

  const ta = document.createElement("textarea");
  ta.className = "sticky-text";
  ta.placeholder = "Write something...";
  ta.value = note.text || "";

  ta.addEventListener("input", function () {
    const n = getNoteById(note.id);
    if (n) { n.text = ta.value; saveNotes(); }
  });

  body.appendChild(ta);
  el.appendChild(head);
  el.appendChild(body);

  makeDraggable(el, head, note.id);
  makeResizable(el, note.id);

  return el;
}

function renderNotes() {
  if (!notesLayer) return;
  notesLayer.querySelectorAll(".sticky-note").forEach(el => el.remove());
  notes.filter(n => !n.minimized).forEach(note => {
    notesLayer.appendChild(createNoteEl(note));
  });
  updateTray();
}

function updateTray() {
  if (!notesTray) return;
  notesTray.innerHTML = "";
  const minimized = notes.filter(n => n.minimized);
  if (minimized.length === 0) { notesTray.style.display = "none"; return; }
  notesTray.style.display = "flex";
  minimized.forEach(note => {
    const chip = document.createElement("button");
    chip.className = "tray-chip";
    chip.textContent = note.name || "Note";
    chip.title = "Restore note";
    chip.addEventListener("click", function () {
      note.minimized = false;
      saveNotes();
      renderNotes();
    });
    notesTray.appendChild(chip);
  });
}

function toggleNotes(force) {
  if (!notesLayer) return;
  notesVisible = typeof force === "boolean" ? force : !notesVisible;
  notesLayer.classList.toggle("hidden", !notesVisible);
  if (notesToggleBtn) {
    notesToggleBtn.textContent = notesVisible ? "On" : "Off";
    notesToggleBtn.setAttribute("aria-pressed", String(notesVisible));
    notesToggleBtn.classList.toggle("active", notesVisible);
  }
  if (notesVisible) renderNotes();
}

function addNote() {
  const id = Date.now();
  const col = notes.length % 4;
  notes.push({ id, name: "Note", text: "", x: 120 + col * 40, y: 120 + col * 40, w: null, h: null, minimized: false });
  saveNotes();
  renderNotes();
  window.setTimeout(function () {
    const el = notesLayer.querySelector(`.sticky-note[data-id="${id}"] .sticky-title`);
    if (el) {
      el.focus();
      const range = document.createRange();
      const sel = window.getSelection();
      range.selectNodeContents(el);
      sel.removeAllRanges();
      sel.addRange(range);
    }
  }, 50);
}

function setupNotes() {
  if (!notesLayer || !addNoteBtn) return;
  addNoteBtn.addEventListener("click", addNote);
  if (notesToggleBtn) {
    notesToggleBtn.addEventListener("click", () => toggleNotes());
  }
  document.addEventListener("keydown", function (e) {
    if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "n") {
      e.preventDefault();
      toggleNotes();
    }
  });
}

// =====================================================================
// REST OF DASHBOARD (unchanged)
// =====================================================================

const params = new URLSearchParams(window.location.search);
const urlToken = params.get("token");
const savedToken = localStorage.getItem("access_token");
const token = urlToken || savedToken;

if (urlToken) {
  localStorage.setItem("access_token", urlToken);
  window.history.replaceState({}, "", "/dashboard");
}

const classesList = document.getElementById("classes");
const assignmentsList = document.getElementById("assignments");
const selectedCourse = document.getElementById("selected-course");
const assignmentLoader = document.getElementById("assignment-loader");
const calendarLoader = document.getElementById("calendar-loader");
const groupsContainer = document.getElementById("event-groups");
const driveFilesList = document.getElementById("drive-files");
const driveSearchInput = document.getElementById("drive-search");
const driveLoader = document.getElementById("drive-loader");

let selectedCourseId = null;
let selectedCourseName = null;
let assignmentCache = [];
let activeAssignmentFilter = "all";
let activeDriveFilter = "recent";
let driveSearchQuery = "";
let driveHasSearched = false;
let driveViewMode = "list";

async function fetchJsonSafe(url) {
  const response = await fetch(url);
  const text = await response.text();
  try {
    const json = JSON.parse(text);
    if (!response.ok) throw new Error(json.error || `Request failed: ${response.status}`);
    return json;
  } catch (_err) {
    if (!response.ok) throw new Error(text || `Request failed: ${response.status}`);
    throw new Error("Invalid JSON response");
  }
}

function setupReloginListener() {
  window.addEventListener("message", function (event) {
    if (event.origin !== window.location.origin) return;
    if (!event.data || event.data.type !== "google-auth-success") return;
    if (!event.data.token) return;
    localStorage.setItem("access_token", event.data.token);
    window.location.reload();
  });
}

function createReloginButton() {
  const button = document.createElement("button");
  button.className = "tab-btn relogin-btn";
  button.textContent = "Re login";
  button.addEventListener("click", function () {
    const popupWidth = 500, popupHeight = 650;
    const left = window.screenX + (window.outerWidth - popupWidth) / 2;
    const top = window.screenY + (window.outerHeight - popupHeight) / 2;
    const popup = window.open("/auth/google?popup=1", "google-auth-popup", `width=${popupWidth},height=${popupHeight},left=${left},top=${top}`);
    if (!popup) window.location.href = "/auth/google";
  });
  return button;
}

function showReloginPrompt(container) {
  const wrapper = document.createElement("div");
  wrapper.className = "relogin-wrap";
  wrapper.appendChild(createReloginButton());
  container.appendChild(wrapper);
}

function formatDate(dateInput) {
  if (!dateInput) return "No due date";
  return new Date(dateInput).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

function courseWorkDueDate(work) {
  if (!work.dueDate) return null;
  const { year, month, day } = work.dueDate;
  return new Date(year, (month || 1) - 1, day || 1, work.dueTime?.hours || 0, work.dueTime?.minutes || 0);
}

function eventStartDate(event) {
  return new Date(event.start?.dateTime || event.start?.date || Date.now());
}

function startOfToday() { const n = new Date(); return new Date(n.getFullYear(), n.getMonth(), n.getDate()); }
function endOfToday() { const t = startOfToday(); return new Date(t.getFullYear(), t.getMonth(), t.getDate(), 23, 59, 59, 999); }
function endOfTomorrow() { const t = startOfToday(); return new Date(t.getFullYear(), t.getMonth(), t.getDate() + 1, 23, 59, 59, 999); }
function endOfWeek() { const t = startOfToday(); return new Date(t.getFullYear(), t.getMonth(), t.getDate() + (7 - t.getDay()), 23, 59, 59, 999); }
function endOfMonth() { const n = new Date(); return new Date(n.getFullYear(), n.getMonth() + 1, 0, 23, 59, 59, 999); }
function setLoader(loaderEl, isVisible) { loaderEl.classList.toggle("hidden", !isVisible); }
function isUnturnedIn(a) { return a.mySubmissionState !== "TURNED_IN" && a.mySubmissionState !== "RETURNED"; }

function getFilteredAssignments(assignments, filter) {
  const now = new Date();
  if (filter === "unturned") return assignments.filter(isUnturnedIn);
  if (filter === "upcoming") return assignments.filter(a => a.due && a.due >= now);
  return assignments;
}

function renderAssignments() {
  assignmentsList.innerHTML = "";
  const filtered = getFilteredAssignments(assignmentCache, activeAssignmentFilter);
  if (!filtered.length) {
    const li = document.createElement("li");
    li.textContent = "No assignments for this tab.";
    assignmentsList.appendChild(li);
    return;
  }
  filtered.forEach(work => {
    const li = document.createElement("li");
    const status = work.mySubmissionState || "UNKNOWN";
    li.innerHTML = `<strong>${work.title || "Untitled assignment"}</strong><br><span>${formatDate(work.due)}</span><br><span class="assignment-state">Status: ${status.replaceAll("_", " ")}</span>`;
    assignmentsList.appendChild(li);
  });
}

async function loadAssignments(courseId, courseName, forceRefresh = false) {
  selectedCourseId = courseId;
  selectedCourseName = courseName;
  selectedCourse.textContent = `Loading assignments for ${courseName}...`;
  setLoader(assignmentLoader, true);
  if (!forceRefresh) { assignmentCache = []; renderAssignments(); }
  try {
    const data = await fetchJsonSafe(`/api/coursework?token=${encodeURIComponent(token)}&courseId=${encodeURIComponent(courseId)}`);
    assignmentCache = (data.courseWork || []).map(work => ({ ...work, due: courseWorkDueDate(work) })).sort((a, b) => {
      if (!a.due && !b.due) return 0;
      if (!a.due) return 1;
      if (!b.due) return -1;
      return a.due - b.due;
    });
    selectedCourse.textContent = `Assignments for ${courseName}`;
    renderAssignments();
  } catch (err) {
    selectedCourse.textContent = `Could not load assignments: ${err.message}`;
    assignmentCache = [];
    renderAssignments();
    if (err.message.toLowerCase().includes("invalid") || err.message.toLowerCase().includes("auth")) showReloginPrompt(assignmentsList);
  } finally {
    setLoader(assignmentLoader, false);
  }
}

function renderEventGroups(events) {
  groupsContainer.innerHTML = "";
  const todayStart = startOfToday(), todayEnd = endOfToday(), tomorrowEnd = endOfTomorrow(), weekEnd = endOfWeek(), monthEnd = endOfMonth();
  const groups = {
    Today: events.filter(e => { const s = eventStartDate(e); return s >= todayStart && s <= todayEnd; }),
    Tomorrow: events.filter(e => { const s = eventStartDate(e); return s > todayEnd && s <= tomorrowEnd; }),
    "This Week": events.filter(e => { const s = eventStartDate(e); return s > tomorrowEnd && s <= weekEnd; }),
    "This Month": events.filter(e => { const s = eventStartDate(e); return s > weekEnd && s <= monthEnd; })
  };
  Object.entries(groups).forEach(([label, groupedEvents]) => {
    const section = document.createElement("div");
    section.className = "event-group";
    const heading = document.createElement("h3");
    heading.textContent = label;
    section.appendChild(heading);
    const list = document.createElement("ul");
    if (!groupedEvents.length) {
      const li = document.createElement("li"); li.textContent = "No events"; list.appendChild(li);
    } else {
      groupedEvents.forEach(event => {
        const li = document.createElement("li");
        li.innerHTML = `<strong>${event.summary || "No title"}</strong><br><span>${formatDate(eventStartDate(event))}</span><br><span class="event-calendar-name">${event.sourceCalendarSummary || "Primary"}</span>`;
        list.appendChild(li);
      });
    }
    section.appendChild(list);
    groupsContainer.appendChild(section);
  });
}

async function loadCalendar(forceRefresh = false) {
  if (!forceRefresh) groupsContainer.innerHTML = "";
  setLoader(calendarLoader, true);
  try {
    const data = await fetchJsonSafe(`/api/calendar?token=${encodeURIComponent(token)}`);
    renderEventGroups((data.items || []).sort((a, b) => eventStartDate(a) - eventStartDate(b)));
  } catch (err) {
    groupsContainer.innerHTML = `<div class="event-group"><h3>Error</h3><ul><li>Could not load calendar: ${err.message}</li></ul></div>`;
    if (err.message.toLowerCase().includes("invalid") || err.message.toLowerCase().includes("auth")) showReloginPrompt(groupsContainer);
  } finally {
    setLoader(calendarLoader, false);
  }
}

function setupAssignmentTabs() {
  document.querySelectorAll("[data-assignment-filter]").forEach(button => {
    button.addEventListener("click", function () {
      activeAssignmentFilter = button.dataset.assignmentFilter;
      document.querySelectorAll("[data-assignment-filter]").forEach(b => b.classList.remove("active"));
      button.classList.add("active");
      renderAssignments();
    });
  });
}

async function loadClasses() {
  classesList.innerHTML = "";
  try {
    const data = await fetchJsonSafe(`/api/classroom?token=${encodeURIComponent(token)}`);
    if (data.courses && data.courses.length > 0) {
      data.courses.forEach(course => {
        const li = document.createElement("li");
        const button = document.createElement("button");
        button.className = "class-btn";
        button.textContent = course.name;
        button.addEventListener("click", () => loadAssignments(course.id, course.name));
        li.appendChild(button);
        classesList.appendChild(li);
      });
    } else {
      const li = document.createElement("li"); li.textContent = "No classes found."; classesList.appendChild(li);
    }
  } catch (err) {
    const li = document.createElement("li"); li.textContent = `Could not load classes: ${err.message}`; classesList.appendChild(li);
    if (err.message.toLowerCase().includes("invalid") || err.message.toLowerCase().includes("auth")) showReloginPrompt(classesList);
  }
}

async function toggleDriveStar(fileId, starred) {
  await fetchJsonSafe(`/api/drive/star?token=${encodeURIComponent(token)}&fileId=${encodeURIComponent(fileId)}&starred=${starred ? "1" : "0"}`);
}

function renderDriveFiles(files) {
  driveFilesList.innerHTML = "";
  driveFilesList.classList.toggle("drive-grid", driveViewMode === "grid");
  if (!driveHasSearched && activeDriveFilter === "recent") {
    const li = document.createElement("li"); li.className = "drive-empty"; li.textContent = "Search something to get started."; driveFilesList.appendChild(li); return;
  }
  if (!files.length) {
    const li = document.createElement("li"); li.className = "drive-empty"; li.textContent = "No files found."; driveFilesList.appendChild(li); return;
  }
  files.forEach(file => {
    const li = document.createElement("li");
    li.className = "drive-file-item";
    const link = document.createElement("a");
    link.href = file.webViewLink || `https://drive.google.com/file/d/${file.id}/view`;
    link.target = "_blank"; link.rel = "noopener noreferrer"; link.className = "drive-file-link";
    if (driveViewMode === "grid") {
      const preview = document.createElement("div"); preview.className = "drive-preview";
      if (file.thumbnailLink) { const img = document.createElement("img"); img.src = file.thumbnailLink; img.alt = file.name || ""; preview.appendChild(img); }
      else preview.textContent = "No preview";
      link.appendChild(preview);
    }
    const name = document.createElement("span"); name.textContent = file.name || "Untitled file"; link.appendChild(name);
    const starButton = document.createElement("button");
    starButton.className = "star-btn"; starButton.textContent = file.starred ? "★" : "☆"; starButton.title = file.starred ? "Unstar" : "Star";
    starButton.addEventListener("click", async () => { starButton.disabled = true; await toggleDriveStar(file.id, !file.starred); await loadDriveFiles(true); });
    li.appendChild(link); li.appendChild(starButton); driveFilesList.appendChild(li);
  });
}

async function loadDriveFiles(forceRefresh = false) {
  if (!forceRefresh) driveFilesList.innerHTML = "";
  setLoader(driveLoader, true);
  try {
    const starred = activeDriveFilter === "starred" ? "1" : "0";
    const recent = activeDriveFilter === "recent" ? "1" : "0";
    const data = await fetchJsonSafe(`/api/drive?token=${encodeURIComponent(token)}&q=${encodeURIComponent(driveSearchQuery)}&starred=${starred}&recent=${recent}`);
    renderDriveFiles(data.files || []);
  } catch (err) {
    driveFilesList.innerHTML = `<li>Could not load Drive files: ${err.message}</li>`;
    if (err.message.toLowerCase().includes("invalid") || err.message.toLowerCase().includes("auth")) showReloginPrompt(driveFilesList);
  } finally {
    setLoader(driveLoader, false);
  }
}

function setupDriveControls() {
  if (!driveSearchInput || !driveFilesList) return;
  document.querySelectorAll("[data-drive-filter]").forEach(button => {
    button.addEventListener("click", function () {
      activeDriveFilter = button.dataset.driveFilter;
      document.querySelectorAll("[data-drive-filter]").forEach(b => b.classList.remove("active"));
      button.classList.add("active");
      loadDriveFiles();
    });
  });
  const driveViewToggle = document.getElementById("drive-view-toggle");
  if (driveViewToggle) {
    driveViewToggle.addEventListener("click", function () {
      driveViewMode = driveViewMode === "list" ? "grid" : "list";
      driveViewToggle.textContent = driveViewMode === "grid" ? "☰ List" : "▦ Grid";
      loadDriveFiles(true);
    });
  }
  document.getElementById("drive-search-btn").addEventListener("click", function () {
    driveSearchQuery = driveSearchInput.value.trim(); driveHasSearched = true; loadDriveFiles();
  });
  driveSearchInput.addEventListener("keydown", function (e) {
    if (e.key === "Enter") { driveSearchQuery = driveSearchInput.value.trim(); driveHasSearched = true; loadDriveFiles(); }
  });
}

function setupRefreshButtons() {
  const ar = document.getElementById("assignment-refresh");
  const cr = document.getElementById("calendar-refresh");
  if (ar) ar.addEventListener("click", () => { if (selectedCourseId) loadAssignments(selectedCourseId, selectedCourseName, true); });
  if (cr) cr.addEventListener("click", () => loadCalendar(true));
}

function setupSidebar() {
  const menuToggle = document.getElementById("menu-toggle");
  const sideMenu = document.getElementById("side-menu");
  const menuClose = document.getElementById("menu-close");
  const menuOverlay = document.getElementById("menu-overlay");
  if (!menuToggle || !sideMenu || !menuClose || !menuOverlay) return;
  const open = () => { sideMenu.classList.add("open"); menuOverlay.classList.add("open"); };
  const close = () => { sideMenu.classList.remove("open"); menuOverlay.classList.remove("open"); };
  menuToggle.addEventListener("click", open);
  menuClose.addEventListener("click", close);
  menuOverlay.addEventListener("click", close);
}

async function loadData() {
  if (!classesList || !assignmentsList || !groupsContainer) return;
  setupAssignmentTabs();
  setupDriveControls();
  setupRefreshButtons();
  if (!token) { window.location.href = "/"; return; }
  await Promise.allSettled([loadClasses(), loadCalendar(), loadDriveFiles()]);
}

// =====================================================================
// BOOT
// =====================================================================

setupReloginListener();
setupSidebar();
setupSettings();
setupNotes();
setupLayoutDrag();
applyAllPrefs();
loadData();
