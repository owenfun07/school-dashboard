const params = new URLSearchParams(window.location.search);
const urlToken = params.get("token");

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
let citationHistory = [];

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

async function copyText(value) {
  await navigator.clipboard.writeText(value);
}

function renderCitationHistory() {
  const list = document.getElementById("citation-history");
  list.innerHTML = "";

  citationHistory.forEach(item => {
    const li = document.createElement("li");
    li.className = "citation-history-item";

    const text = document.createElement("span");
    text.textContent = item;

    const copyButton = document.createElement("button");
    copyButton.className = "tab-btn";
    copyButton.textContent = "Copy";
    copyButton.addEventListener("click", async function () {
      await copyText(item);
      copyButton.textContent = "Copied";
      window.setTimeout(() => {
        copyButton.textContent = "Copy";
      }, 1200);
    });

    li.appendChild(text);
    li.appendChild(copyButton);
    list.appendChild(li);
  });
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

    const citation = citationStyle === "mla"
      ? generateMLA(author, title, site, date, url)
      : generateAPA(author, title, site, date, url);

    output.textContent = citation;
    citationHistory.unshift(citation);
    renderCitationHistory();
  });

  document.getElementById("citation-copy-all").addEventListener("click", async function () {
    if (!citationHistory.length) return;

    const joined = citationHistory.join("\n");
    await copyText(joined);
    this.textContent = "Copied all";
    window.setTimeout(() => {
      this.textContent = "Copy All";
    }, 1200);
  });
}

setupSidebar();
setupCitationTool();
