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
let activeDriveFilter = "all";
let driveSearchQuery = "";

async function fetchJsonSafe(url) {
  const response = await fetch(url);
  const text = await response.text();

  try {
    const json = JSON.parse(text);
    if (!response.ok) {
      throw new Error(json.error || `Request failed: ${response.status}`);
    }
    return json;
  } catch (_err) {
    if (!response.ok) {
      throw new Error(text || `Request failed: ${response.status}`);
    }
    throw new Error("Invalid JSON response");
  }
}

function formatDate(dateInput) {
  if (!dateInput) return "No due date";
  const date = new Date(dateInput);

  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  });
}

function courseWorkDueDate(work) {
  if (!work.dueDate) return null;

  const year = work.dueDate.year;
  const month = (work.dueDate.month || 1) - 1;
  const day = work.dueDate.day || 1;
  const hour = work.dueTime?.hours || 0;
  const minute = work.dueTime?.minutes || 0;

  return new Date(year, month, day, hour, minute);
}

function eventStartDate(event) {
  return new Date(event.start?.dateTime || event.start?.date || Date.now());
}

function startOfToday() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function endOfToday() {
  const today = startOfToday();
  return new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);
}

function endOfTomorrow() {
  const today = startOfToday();
  return new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1, 23, 59, 59, 999);
}

function endOfWeek() {
  const today = startOfToday();
  const day = today.getDay();
  const daysUntilSunday = 7 - day;
  return new Date(today.getFullYear(), today.getMonth(), today.getDate() + daysUntilSunday, 23, 59, 59, 999);
}

function endOfMonth() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
}

function setLoader(loaderEl, isVisible) {
  loaderEl.classList.toggle("hidden", !isVisible);
}

function isUnturnedIn(assignment) {
  return assignment.mySubmissionState !== "TURNED_IN" && assignment.mySubmissionState !== "RETURNED";
}

function getFilteredAssignments(assignments, filter) {
  const now = new Date();

  if (filter === "unturned") {
    return assignments.filter(isUnturnedIn);
  }

  if (filter === "upcoming") {
    return assignments.filter(assignment => assignment.due && assignment.due >= now);
  }

  return assignments;
}

function renderAssignments() {
  assignmentsList.innerHTML = "";

  const filtered = getFilteredAssignments(assignmentCache, activeAssignmentFilter);

  if (filtered.length === 0) {
    const li = document.createElement("li");
    li.textContent = "No assignments for this tab.";
    assignmentsList.appendChild(li);
    return;
  }

  filtered.forEach(work => {
    const li = document.createElement("li");
    const status = work.mySubmissionState || "UNKNOWN";

    li.innerHTML = `<strong>${work.title || "Untitled assignment"}</strong>
      <br><span>${formatDate(work.due)}</span>
      <br><span class="assignment-state">Status: ${status.replaceAll("_", " ")}</span>`;
    assignmentsList.appendChild(li);
  });
}

async function loadAssignments(courseId, courseName, forceRefresh = false) {
  selectedCourseId = courseId;
  selectedCourseName = courseName;

  selectedCourse.textContent = `Loading assignments for ${courseName}...`;
  setLoader(assignmentLoader, true);

  if (!forceRefresh) {
    assignmentCache = [];
    renderAssignments();
  }

  try {
    const data = await fetchJsonSafe(`/api/coursework?token=${encodeURIComponent(token)}&courseId=${encodeURIComponent(courseId)}`);

    assignmentCache = (data.courseWork || [])
    .map(work => ({
      ...work,
      due: courseWorkDueDate(work)
    }))
    .sort((a, b) => {
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
  } finally {
    setLoader(assignmentLoader, false);
  }
}

function renderEventGroups(events) {
  groupsContainer.innerHTML = "";

  const todayStart = startOfToday();
  const todayEnd = endOfToday();
  const tomorrowEnd = endOfTomorrow();
  const weekEnd = endOfWeek();
  const monthEnd = endOfMonth();

  const groups = {
    Today: events.filter(event => {
      const start = eventStartDate(event);
      return start >= todayStart && start <= todayEnd;
    }),
    Tomorrow: events.filter(event => {
      const start = eventStartDate(event);
      return start > todayEnd && start <= tomorrowEnd;
    }),
    "This Week": events.filter(event => {
      const start = eventStartDate(event);
      return start > tomorrowEnd && start <= weekEnd;
    }),
    "This Month": events.filter(event => {
      const start = eventStartDate(event);
      return start > weekEnd && start <= monthEnd;
    })
  };

  Object.entries(groups).forEach(([label, groupedEvents]) => {
    const section = document.createElement("div");
    section.className = "event-group";

    const heading = document.createElement("h3");
    heading.textContent = label;
    section.appendChild(heading);

    const list = document.createElement("ul");

    if (groupedEvents.length === 0) {
      const li = document.createElement("li");
      li.textContent = "No events";
      list.appendChild(li);
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
  if (!forceRefresh) {
    groupsContainer.innerHTML = "";
  }

  setLoader(calendarLoader, true);

  try {
    const calendarData = await fetchJsonSafe(`/api/calendar?token=${encodeURIComponent(token)}`);
    const events = (calendarData.items || []).sort((a, b) => eventStartDate(a) - eventStartDate(b));
    renderEventGroups(events);
  } catch (err) {
    groupsContainer.innerHTML = `<div class="event-group"><h3>Error</h3><ul><li>Could not load calendar: ${err.message}</li></ul></div>`;
  } finally {
    setLoader(calendarLoader, false);
  }
}

function setupAssignmentTabs() {
  const tabButtons = document.querySelectorAll(".tab-btn");

  tabButtons.forEach(button => {
    button.addEventListener("click", function () {
      activeAssignmentFilter = button.dataset.assignmentFilter;

      tabButtons.forEach(btn => btn.classList.remove("active"));
      button.classList.add("active");

      renderAssignments();
    });
  });
}

async function loadClasses() {
  classesList.innerHTML = "";

  try {
    const classroomData = await fetchJsonSafe(`/api/classroom?token=${encodeURIComponent(token)}`);

    if (classroomData.courses && classroomData.courses.length > 0) {
    classroomData.courses.forEach(course => {
      const li = document.createElement("li");
      const button = document.createElement("button");
      button.className = "class-btn";
      button.textContent = course.name;
      button.addEventListener("click", () => loadAssignments(course.id, course.name));
      li.appendChild(button);
      classesList.appendChild(li);
    });
    } else {
      const li = document.createElement("li");
      li.textContent = "No classes found.";
      classesList.appendChild(li);
    }
  } catch (err) {
    const li = document.createElement("li");
    li.textContent = `Could not load classes: ${err.message}`;
    classesList.appendChild(li);
  }
}



async function toggleDriveStar(fileId, nextStarredValue) {
  await fetchJsonSafe(`/api/drive/star?token=${encodeURIComponent(token)}&fileId=${encodeURIComponent(fileId)}&starred=${nextStarredValue ? "1" : "0"}`);
}

function renderDriveFiles(files) {
  driveFilesList.innerHTML = "";

  if (!files.length) {
    const li = document.createElement("li");
    li.textContent = "No files found.";
    driveFilesList.appendChild(li);
    return;
  }

  files.forEach(file => {
    const li = document.createElement("li");
    li.className = "drive-file-item";

    const link = document.createElement("a");
    link.href = file.webViewLink || `https://drive.google.com/file/d/${file.id}/view`;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.className = "drive-file-link";
    link.textContent = file.name || "Untitled file";

    const starButton = document.createElement("button");
    starButton.className = "star-btn";
    starButton.textContent = file.starred ? "★" : "☆";
    starButton.title = file.starred ? "Unstar" : "Star";
    starButton.addEventListener("click", async () => {
      starButton.disabled = true;
      await toggleDriveStar(file.id, !file.starred);
      await loadDriveFiles(true);
    });

    li.appendChild(link);
    li.appendChild(starButton);
    driveFilesList.appendChild(li);
  });
}

async function loadDriveFiles(forceRefresh = false) {
  if (!forceRefresh) {
    driveFilesList.innerHTML = "";
  }

  setLoader(driveLoader, true);

  try {
    const starred = activeDriveFilter === "starred" ? "1" : "0";
    const data = await fetchJsonSafe(`/api/drive?token=${encodeURIComponent(token)}&q=${encodeURIComponent(driveSearchQuery)}&starred=${starred}`);
    renderDriveFiles(data.files || []);
  } catch (err) {
    driveFilesList.innerHTML = `<li>Could not load Drive files: ${err.message}</li>`;
  } finally {
    setLoader(driveLoader, false);
  }
}

function setupDriveControls() {
  const driveTabButtons = document.querySelectorAll("[data-drive-filter]");

  if (!driveSearchInput || !driveFilesList) {
    return;
  }

  driveTabButtons.forEach(button => {
    button.addEventListener("click", function () {
      activeDriveFilter = button.dataset.driveFilter;
      driveTabButtons.forEach(btn => btn.classList.remove("active"));
      button.classList.add("active");
      loadDriveFiles();
    });
  });

  document.getElementById("drive-search-btn").addEventListener("click", function () {
    driveSearchQuery = driveSearchInput.value.trim();
    loadDriveFiles();
  });

  driveSearchInput.addEventListener("keydown", function (event) {
    if (event.key === "Enter") {
      driveSearchQuery = driveSearchInput.value.trim();
      loadDriveFiles();
    }
  });
}

function setupRefreshButtons() {
  const assignmentRefresh = document.getElementById("assignment-refresh");
  const calendarRefresh = document.getElementById("calendar-refresh");

  if (assignmentRefresh) {
    assignmentRefresh.addEventListener("click", function () {
    if (selectedCourseId) {
      loadAssignments(selectedCourseId, selectedCourseName, true);
    }
    });
  }

  if (calendarRefresh) {
    calendarRefresh.addEventListener("click", function () {
      loadCalendar(true);
    });
  }
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

async function loadData() {
  if (!classesList || !assignmentsList || !groupsContainer) {
    return;
  }

  setupAssignmentTabs();
  setupDriveControls();
  setupRefreshButtons();

  if (!token) {
    classesList.innerHTML = "<li>Please sign in again to load dashboard data.</li>";
    assignmentsList.innerHTML = "<li>Please sign in again to load assignments.</li>";
    driveFilesList.innerHTML = "<li>Please sign in again to load Drive files.</li>";
    groupsContainer.innerHTML = `<div class="event-group"><h3>Not signed in</h3><ul><li>Please sign in again to load calendar.</li></ul></div>`;
    return;
  }

  await Promise.allSettled([loadClasses(), loadCalendar(), loadDriveFiles()]);
}

setupSidebar();
loadData();
