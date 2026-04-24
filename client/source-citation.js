const params = new URLSearchParams(window.location.search);
const urlToken = params.get("token");
const savedToken = localStorage.getItem("access_token");

if (urlToken) {
  localStorage.setItem("access_token", urlToken);
  window.history.replaceState({}, "", "/source-citation");
}

function setupSidebar() {
  const menuToggle = document.getElementById("menu-toggle");
  const sideMenu = document.getElementById("side-menu");
  const menuClose = document.getElementById("menu-close");
  const menuOverlay = document.getElementById("menu-overlay");
  const toolsToggle = document.getElementById("tools-toggle");
  const toolsDropdown = document.getElementById("tools-dropdown");

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

  if (toolsToggle && toolsDropdown) {
    toolsToggle.addEventListener("click", function () {
      const isExpanded = toolsToggle.getAttribute("aria-expanded") === "true";
      toolsToggle.setAttribute("aria-expanded", String(!isExpanded));
      toolsDropdown.classList.toggle("hidden", isExpanded);
      toolsToggle.textContent = isExpanded ? "Tools ▾" : "Tools ▴";
    });
  }
}

let citationStyle = "mla";

function formatDate(rawDate) {
  if (!rawDate) return "n.d.";
  const date = new Date(rawDate);
  return date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function generateMLA(author, title, site, date, url) {
  return `${author}. "${title}." ${site}, ${date}, ${url}.`;
}

function generateAPA(author, title, site, date, url) {
  return `${author}. (${date}). ${title}. ${site}. ${url}`;
}

function setupCitationTool() {
  const output = document.getElementById("citation-output");
  const authorInput = document.getElementById("citation-author");
  const titleInput = document.getElementById("citation-title");
  const siteInput = document.getElementById("citation-site");
  const urlInput = document.getElementById("citation-url");
  const dateInput = document.getElementById("citation-date");
  const mlaButton = document.getElementById("citation-mla");
  const apaButton = document.getElementById("citation-apa");

  mlaButton.addEventListener("click", function () {
    citationStyle = "mla";
    mlaButton.classList.add("active");
    apaButton.classList.remove("active");
  });

  apaButton.addEventListener("click", function () {
    citationStyle = "apa";
    apaButton.classList.add("active");
    mlaButton.classList.remove("active");
  });

  document.getElementById("citation-generate").addEventListener("click", function () {
    const author = authorInput.value.trim() || "Unknown author";
    const title = titleInput.value.trim() || "Untitled page";
    const site = siteInput.value.trim() || "Unknown site";
    const url = urlInput.value.trim() || "No URL";
    const date = formatDate(dateInput.value);

    output.textContent = citationStyle === "mla"
      ? generateMLA(author, title, site, date, url)
      : generateAPA(author, title, site, date, url);
  });
}

setupSidebar();
setupCitationTool();
