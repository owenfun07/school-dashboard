const params = new URLSearchParams(window.location.search);
const token = params.get("token");

async function loadData() {
  // CLASSROOM
  const classroomRes = await fetch(`/api/classroom?token=${token}`);
  const classroomData = await classroomRes.json();

  const classesList = document.getElementById("classes");

  if (classroomData.courses) {
    classroomData.courses.forEach(course => {
      const li = document.createElement("li");
      li.textContent = course.name;
      classesList.appendChild(li);
    });
  }

  // CALENDAR
  const calendarRes = await fetch(`/api/calendar?token=${token}`);
  const calendarData = await calendarRes.json();

  const eventsList = document.getElementById("events");

  if (calendarData.items) {
    calendarData.items.forEach(event => {
      const li = document.createElement("li");
      li.textContent = event.summary || "No title";
      eventsList.appendChild(li);
    });
  }
}

loadData();
