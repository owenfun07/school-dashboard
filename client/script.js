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

let selectedCourseId = null;
let selectedCourseName = null;
let assignmentCache = [];
let activeAssignmentFilter = "all";

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

  const response = await fetch(`/api/coursework?token=${encodeURIComponent(token)}&courseId=${encodeURIComponent(courseId)}`);
  const data = await response.json();

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
  setLoader(assignmentLoader, false);
  renderAssignments();
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
        li.innerHTML = `<strong>${event.summary || "No title"}</strong><br><span>${formatDate(eventStartDate(event))}</span>`;
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

  const calendarRes = await fetch(`/api/calendar?token=${encodeURIComponent(token)}`);
  const calendarData = await calendarRes.json();
  const events = (calendarData.items || []).sort((a, b) => eventStartDate(a) - eventStartDate(b));

  setLoader(calendarLoader, false);
  renderEventGroups(events);
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
  const classroomRes = await fetch(`/api/classroom?token=${encodeURIComponent(token)}`);
  const classroomData = await classroomRes.json();

  classesList.innerHTML = "";

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
}

function setupRefreshButtons() {
  document.getElementById("assignment-refresh").addEventListener("click", function () {
    if (selectedCourseId) {
      loadAssignments(selectedCourseId, selectedCourseName, true);
    }
  });

  document.getElementById("calendar-refresh").addEventListener("click", function () {
    loadCalendar(true);
  });
}

async function loadData() {
  setupAssignmentTabs();
  setupRefreshButtons();
  await loadClasses();
  await loadCalendar();
}

if (!token) {
  window.location.href = "/";
} else {
  loadData();
}
