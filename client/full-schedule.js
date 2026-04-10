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

function setupSidebar() {
  const menuToggle = document.getElementById("menu-toggle");
  const sideMenu = document.getElementById("side-menu");
  const menuClose = document.getElementById("menu-close");
  const menuOverlay = document.getElementById("menu-overlay");

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

  for (let day = 1; day <= daysInMonth; day++) {
    const cell = document.createElement("div");
    cell.className = "day-cell";

    const dayLabel = document.createElement("div");
    dayLabel.className = "day-number";
    dayLabel.textContent = String(day);
    cell.appendChild(dayLabel);

    const dayEvents = eventsForDay(year, month, day).slice(0, 4);

    dayEvents.forEach(event => {
      const eventLine = document.createElement("div");
      eventLine.className = "day-event";
      eventLine.textContent = event.summary || "No title";
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
  loader.classList.remove("hidden");

  const response = await fetch(`/api/calendar?token=${encodeURIComponent(token)}`);
  const data = await response.json();
  allEvents = data.items || [];

  loader.classList.add("hidden");
  renderMonth();
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
}

if (!token) {
  window.location.href = "/";
} else {
  setupSidebar();
  setupMonthControls();
  loadCalendarEvents();
}
