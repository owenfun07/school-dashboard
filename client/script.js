const params = new URLSearchParams(window.location.search);
const urlToken = params.get("token");
const savedToken = localStorage.getItem("access_token");
const token = urlToken || savedToken;

if (urlToken) {
  localStorage.setItem("access_token", urlToken);
  window.history.replaceState({}, "", "/dashboard");
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

async function loadAssignments(courseId, courseName) {
  const assignmentsList = document.getElementById("assignments");
  const selectedCourse = document.getElementById("selected-course");

  assignmentsList.innerHTML = "";
  selectedCourse.textContent = `Loading assignments for ${courseName}...`;

  const response = await fetch(`/api/coursework?token=${encodeURIComponent(token)}&courseId=${encodeURIComponent(courseId)}`);
  const data = await response.json();

  const now = new Date();
  const upcoming = (data.courseWork || [])
    .map(work => ({
      ...work,
      due: courseWorkDueDate(work)
    }))
    .filter(work => work.due && work.due >= now)
    .sort((a, b) => a.due - b.due);

  selectedCourse.textContent = `Upcoming assignments for ${courseName}`;

  if (upcoming.length === 0) {
    const li = document.createElement("li");
    li.textContent = "No upcoming assignments found.";
    assignmentsList.appendChild(li);
    return;
  }

  upcoming.forEach(work => {
    const li = document.createElement("li");
    li.innerHTML = `<strong>${work.title || "Untitled assignment"}</strong><br><span>${formatDate(work.due)}</span>`;
    assignmentsList.appendChild(li);
  });
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

function renderEventGroups(events) {
  const groupsContainer = document.getElementById("event-groups");
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

async function loadData() {
  const classroomRes = await fetch(`/api/classroom?token=${encodeURIComponent(token)}`);
  const classroomData = await classroomRes.json();

  const classesList = document.getElementById("classes");

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

  const calendarRes = await fetch(`/api/calendar?token=${encodeURIComponent(token)}`);
  const calendarData = await calendarRes.json();
  const events = (calendarData.items || []).sort((a, b) => eventStartDate(a) - eventStartDate(b));

  renderEventGroups(events);
}

if (!token) {
  window.location.href = "/";
} else {
  loadData();
}
