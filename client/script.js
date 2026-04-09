const params = new URLSearchParams(window.location.search);
const token = params.get("token");

async function loadData() {
  const classroom = await fetch(`http://localhost:3000/api/classroom?token=${token}`);
  const classroomData = await classroom.json();

  const calendar = await fetch(`http://localhost:3000/api/calendar?token=${token}`);
  const calendarData = await calendar.json();

  document.getElementById("classroom").textContent =
    JSON.stringify(classroomData, null, 2);

  document.getElementById("calendar").textContent =
    JSON.stringify(calendarData, null, 2);
}

loadData();
