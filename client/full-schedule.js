const params = new URLSearchParams(window.location.search);
const urlToken = params.get("token");
const savedToken = localStorage.getItem("access_token");
const token = urlToken || savedToken;

if (urlToken) {
  localStorage.setItem("access_token", urlToken);
  window.history.replaceState({}, "", "/full-schedule");
}

const monthTitle = document.getElementById("month-title");
const monthGrid = document.getElementById("month-grid");
const loader = document.getElementById("full-schedule-loader");
let currentDate = new Date();
let allEvents = [];
const eventModal = document.getElementById("event-modal");
const eventModalContent = document.getElementById("event-modal-content");
const eventModalTitle = document.getElementById("event-modal-title");

// Keep modal closed on load
if (eventModal) {
  eventModal.style.display = "none";
}

function setupSidebar() {
  const menuToggle = document.getElementById("menu-toggle");
  const sideMenu = document.getElementById("side-menu");
  const menuClose = document.getElementById("menu-close");
  const menuOverlay = document.getElementById("menu-overlay");
  if (!menuToggle || !sideMenu || !menuClose || !menuOverlay) {
    return;
  }

  function openMenu() {
    sideMenu.classList.add("open");
    menuOverlay.classList.add("open");
  }

  function closeMenu() {
    sideMenu.classList.remove("open");
    menuOverlay.classList.remove("open");
  }

  menuToggle.addEventListener("click", openMenu);
  menuClose.addEventListener("click", closeMenu);
  menuOverlay.addEventListener("click", closeMenu);
}

function escapeHtml(value) {
  return String(value || "").replace(/[&<>'"]/g, ch => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[ch]));
}

function openEventModal(event) {
  if (!eventModal || !eventModalContent || !eventModalTitle) return;

  eventModalTitle.textContent = event.summary || "No title";
  const details = [
    ["Start", event.start?.dateTime || event.start?.date || "N/A"],
    ["End", event.end?.dateTime || event.end?.date || "N/A"],
    ["Calendar", event.sourceCalendarSummary || "Primary"],
    ["Location", event.location || "N/A"],
    ["Description", event.description || "N/A"],
    ["Status", event.status || "N/A"],
    ["Creator", event.creator?.email || event.creator?.displayName || "N/A"],
    ["Organizer", event.organizer?.email || event.organizer?.displayName || "N/A"],
    ["Meet Link", event.hangoutLink || "N/A"],
    ["Event Link", event.htmlLink || "N/A"]
  ];

  eventModalContent.innerHTML = details.map(([k, v]) => `<p><strong>${escapeHtml(k)}:</strong> ${escapeHtml(v)}</p>`).join("");
  eventModal.style.display = "flex";
}

function closeEventModal() {
  if (eventModal) eventModal.style.display = "none";
}

function eventStartDate(event) {
  return new Date(event.start?.dateTime || event.start?.date || Date.now());
}

function formatMonthTitle(date) {
  return date.toLocaleString(undefined, { month: "long", year: "numeric" });
}

function eventsForDay(year, month, day) {
  return allEvents.filter(event => {
    const start = eventStartDate(event);
    return start.getFullYear() === year && start.getMonth() === month && start.getDate() === day;
  });
}

function renderMonth() {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  monthTitle.textContent = formatMonthTitle(currentDate);
  monthGrid.innerHTML = "";

  const firstDay = new Date(year, month, 1);
  const startWeekday = firstDay.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  for (let i = 0; i < startWeekday; i++) {
    const blank = document.createElement("div");
    blank.className = "day-cell day-cell-empty";
    monthGrid.appendChild(blank);
  }

  const today = new Date();

  for (let day = 1; day <= daysInMonth; day++) {
    const cell = document.createElement("div");
    cell.className = "day-cell";

    const dayLabel = document.createElement("div");
    dayLabel.className = "day-number";
    dayLabel.textContent = String(day);

    if (today.getFullYear() === year && today.getMonth() === month && today.getDate() === day) {
      dayLabel.classList.add("day-number-today");
    }

    cell.appendChild(dayLabel);

    const dayEvents = eventsForDay(year, month, day).slice(0, 4);

    dayEvents.forEach(event => {
      const eventLine = document.createElement("div");
      eventLine.className = "day-event";
      eventLine.textContent = event.summary || "No title";
      eventLine.addEventListener("click", function () { openEventModal(event); });
      cell.appendChild(eventLine);
    });

    if (eventsForDay(year, month, day).length > 4) {
      const more = document.createElement("div");
      more.className = "day-more";
      more.textContent = `+${eventsForDay(year, month, day).length - 4} more`;
      cell.appendChild(more);
    }

    monthGrid.appendChild(cell);
  }
}

async function loadCalendarEvents() {
  if (loader) loader.classList.remove("hidden");

  try {
    const response = await fetch(`/api/calendar?token=${encodeURIComponent(token)}`);

    if (!response.ok) {
      throw new Error(`Server returned ${response.status}`);
    }

    const data = await response.json();
    allEvents = data.items || [];
  } catch (err) {
    console.error("Failed to load calendar events:", err);
    allEvents = [];

    if (monthGrid) {
      monthGrid.innerHTML = `<div style="grid-column:1/-1;padding:20px;color:#d92d20;">
        Could not load calendar events. Please try refreshing or re-logging in.
      </div>`;
    }
  } finally {
    if (loader) loader.classList.add("hidden");
    renderMonth();
  }
}

function setupMonthControls() {
  document.getElementById("prev-month").addEventListener("click", function () {
    currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
    renderMonth();
  });

  document.getElementById("next-month").addEventListener("click", function () {
    currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
    renderMonth();
  });

  document.getElementById("today-btn").addEventListener("click", function () {
    const now = new Date();
    currentDate = new Date(now.getFullYear(), now.getMonth(), 1);
    renderMonth();
  });
}

if (!token) {
  window.location.href = "/";
} else {
  setupSidebar();
  setupMonthControls();
  loadCalendarEvents();
}

// Close modal when clicking the backdrop
if (eventModal) {
  eventModal.addEventListener("click", function (e) {
    if (e.target === eventModal) closeEventModal();
  });
}

// Close modal with the X button
const eventModalClose = document.getElementById("event-modal-close");
if (eventModalClose) eventModalClose.addEventListener("click", closeEventModal);

// Close modal with Escape key
document.addEventListener("keydown", function (e) {
  if (e.key === "Escape" && eventModal && eventModal.style.display !== "none") {
    closeEventModal();
  }
});
