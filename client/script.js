// =====================================================================
// THEME DEFINITIONS  (must match theme-loader.js)
// =====================================================================

const THEMES = {
  default:   { label: "Default",    preview: ["#f5f7fb","#ffffff","#3b82f6"], vars: {} },
  slate:     { label: "Blue Slate", preview: ["#f0f4ff","#ffffff","#2563eb"],
    vars: { "--dash-bg":"#f0f4ff","--card-bg":"#ffffff","--card-border":"#c7d7f9",
      "--text-primary":"#0f172a","--text-secondary":"#334155","--text-muted":"#64748b",
      "--page-bg":"#f0f4ff","--sidebar-bg":"#ffffff","--input-bg":"#ffffff","--btn-bg":"#ffffff","--btn-border":"#c7d7f9",
      "--card-accent-classes":"#2563eb","--card-accent-assignments":"#10b981",
      "--card-accent-drive":"#8b5cf6","--card-accent-calendar":"#f59e0b","--accent-left-border":"1" } },
  warm:      { label: "Warm Sand",  preview: ["#faf6ef","#fffdf7","#b8955a"],
    vars: { "--dash-bg":"#faf6ef","--card-bg":"#fffdf7","--card-border":"#e0d8c4",
      "--text-primary":"#3a3020","--text-secondary":"#5a4e38","--text-muted":"#7a6a50",
      "--page-bg":"#faf6ef","--sidebar-bg":"#fffdf7","--input-bg":"#fffdf7","--btn-bg":"#fffdf7","--btn-border":"#e0d8c4",
      "--card-accent-classes":"#b8955a","--card-accent-assignments":"#7a9e60",
      "--card-accent-drive":"#9e6a7a","--card-accent-calendar":"#6a7a9e","--accent-left-border":"1" } },
  forest:    { label: "Forest",     preview: ["#f0f7f2","#ffffff","#2d6a4f"],
    vars: { "--dash-bg":"#f0f7f2","--card-bg":"#ffffff","--card-border":"#b7dfc8",
      "--text-primary":"#1a3328","--text-secondary":"#2d5a45","--text-muted":"#52796f",
      "--page-bg":"#f0f7f2","--sidebar-bg":"#ffffff","--input-bg":"#ffffff","--btn-bg":"#ffffff","--btn-border":"#b7dfc8",
      "--card-accent-classes":"#2d6a4f","--card-accent-assignments":"#52b788",
      "--card-accent-drive":"#74c69d","--card-accent-calendar":"#1b4332","--accent-left-border":"1" } },
  midnight:  { label: "Midnight",   preview: ["#1a1f2e","#252b3b","#4a7cf0"],
    vars: { "--dash-bg":"#1a1f2e","--card-bg":"#252b3b","--card-border":"#2e3650",
      "--text-primary":"#e8ecf4","--text-secondary":"#8892aa","--text-muted":"#6b7899",
      "--page-bg":"#1a1f2e","--sidebar-bg":"#1e2538","--input-bg":"#2d3548","--btn-bg":"#2d3548","--btn-border":"#3d4560",
      "--card-accent-classes":"#4a7cf0","--card-accent-assignments":"#3ac97a",
      "--card-accent-drive":"#c084fc","--card-accent-calendar":"#f0a040","--accent-left-border":"1" } },
  rose:      { label: "Rose",       preview: ["#fff5f7","#ffffff","#e11d48"],
    vars: { "--dash-bg":"#fff5f7","--card-bg":"#ffffff","--card-border":"#fecdd3",
      "--text-primary":"#1c0a0e","--text-secondary":"#4c1d28","--text-muted":"#9f5060",
      "--page-bg":"#fff5f7","--sidebar-bg":"#ffffff","--input-bg":"#ffffff","--btn-bg":"#ffffff","--btn-border":"#fecdd3",
      "--card-accent-classes":"#e11d48","--card-accent-assignments":"#f43f5e",
      "--card-accent-drive":"#fb7185","--card-accent-calendar":"#fda4af","--accent-left-border":"1" } },
  ocean:     { label: "Ocean",      preview: ["#f0f9ff","#ffffff","#0284c7"],
    vars: { "--dash-bg":"#f0f9ff","--card-bg":"#ffffff","--card-border":"#bae6fd",
      "--text-primary":"#0c2a3f","--text-secondary":"#155e75","--text-muted":"#0e7490",
      "--page-bg":"#f0f9ff","--sidebar-bg":"#ffffff","--input-bg":"#ffffff","--btn-bg":"#ffffff","--btn-border":"#bae6fd",
      "--card-accent-classes":"#0284c7","--card-accent-assignments":"#06b6d4",
      "--card-accent-drive":"#0ea5e9","--card-accent-calendar":"#38bdf8","--accent-left-border":"1" } },
  charcoal:  { label: "Charcoal",   preview: ["#1c1c1e","#2c2c2e","#0a84ff"],
    vars: { "--dash-bg":"#1c1c1e","--card-bg":"#2c2c2e","--card-border":"#3a3a3c",
      "--text-primary":"#f5f5f7","--text-secondary":"#aeaeb2","--text-muted":"#8e8e93",
      "--page-bg":"#1c1c1e","--sidebar-bg":"#232325","--input-bg":"#3a3a3c","--btn-bg":"#3a3a3c","--btn-border":"#48484a",
      "--card-accent-classes":"#0a84ff","--card-accent-assignments":"#32d74b",
      "--card-accent-drive":"#bf5af2","--card-accent-calendar":"#ff9f0a","--accent-left-border":"1" } },
  lavender:  { label: "Lavender",   preview: ["#f5f3ff","#ffffff","#7c3aed"],
    vars: { "--dash-bg":"#f5f3ff","--card-bg":"#ffffff","--card-border":"#ddd6fe",
      "--text-primary":"#1e1b4b","--text-secondary":"#3730a3","--text-muted":"#6d28d9",
      "--page-bg":"#f5f3ff","--sidebar-bg":"#ffffff","--input-bg":"#ffffff","--btn-bg":"#ffffff","--btn-border":"#ddd6fe",
      "--card-accent-classes":"#7c3aed","--card-accent-assignments":"#8b5cf6",
      "--card-accent-drive":"#a78bfa","--card-accent-calendar":"#c4b5fd","--accent-left-border":"1" } },
  paper:     { label: "Paper",      preview: ["#f9f7f4","#fefefe","#92400e"],
    vars: { "--dash-bg":"#f9f7f4","--card-bg":"#fefefe","--card-border":"#ddd8d0",
      "--text-primary":"#1a1814","--text-secondary":"#4a4540","--text-muted":"#7a7068",
      "--page-bg":"#f9f7f4","--sidebar-bg":"#fefefe","--input-bg":"#fefefe","--btn-bg":"#fefefe","--btn-border":"#ddd8d0",
      "--card-accent-classes":"#92400e","--card-accent-assignments":"#065f46",
      "--card-accent-drive":"#1e3a5f","--card-accent-calendar":"#3b1f5e","--accent-left-border":"1",
      "--font-family":"Georgia, 'Times New Roman', serif" } },
};

const ALL_THEME_VAR_KEYS = new Set();
Object.values(THEMES).forEach(t => Object.keys(t.vars).forEach(k => ALL_THEME_VAR_KEYS.add(k)));

const DEFAULT_CARD_ORDER = ["classes", "assignments", "drive", "calendar"];

let userPrefs = JSON.parse(localStorage.getItem("dashboard_prefs") || "{}");
function savePrefs() { localStorage.setItem("dashboard_prefs", JSON.stringify(userPrefs)); }

// =====================================================================
// THEME APPLICATION
// =====================================================================

function applyTheme(themeKey) {
  const theme = THEMES[themeKey] || THEMES.default;
  const root = document.documentElement;
  ALL_THEME_VAR_KEYS.forEach(k => root.style.removeProperty(k));
  Object.entries(theme.vars).forEach(([k, v]) => root.style.setProperty(k, v));

  // Accent left borders on dashboard cards
  const grid = document.getElementById("dashboard-grid");
  if (grid) {
    grid.querySelectorAll(".card[data-card]").forEach(card => {
      const cardKey = card.dataset.card;
      const customBg = userPrefs.cardCustom?.[cardKey]?.bg;
      if (!customBg) {
        const accent = theme.vars["--card-accent-" + cardKey];
        if (accent && theme.vars["--accent-left-border"]) {
          card.style.borderLeft = "3px solid " + accent;
          card.style.borderRadius = "0 16px 16px 0";
        } else {
          card.style.borderLeft = "";
          card.style.borderRadius = "";
        }
      }
    });
  }

  document.querySelectorAll(".theme-swatch").forEach(s =>
    s.classList.toggle("active", s.dataset.theme === themeKey)
  );
}

function applyCardCustom() {
  const custom = userPrefs.cardCustom || {};
  Object.entries(custom).forEach(([cardId, opts]) => {
    const card = document.querySelector(`.card[data-card="${cardId}"]`);
    if (!card) return;
    if (opts.bg) { card.style.background = opts.bg; card.style.borderLeft = "none"; card.style.borderRadius = "16px"; }
    if (opts.headerText) {
      const h2 = card.querySelector("h2");
      if (h2) { const emoji = h2.textContent.match(/^\S+\s/)?.[0] || ""; h2.textContent = emoji + opts.headerText; }
    }
    if (opts.headerSize) {
      const h2 = card.querySelector("h2");
      if (h2) h2.style.fontSize = opts.headerSize + "px";
    }
    if (opts.wide !== undefined) card.classList.toggle("card-wide", opts.wide);
    if (opts.hidden) card.classList.add("card-hidden");
    if (opts.minHeight) card.style.minHeight = opts.minHeight + "px";
  });
}

function applyAllPrefs() {
  applyTheme(userPrefs.theme || "default");
  if (userPrefs.customBg) {
    document.documentElement.style.setProperty("--dash-bg", userPrefs.customBg);
    document.documentElement.style.setProperty("--page-bg", userPrefs.customBg);
  }
  if (userPrefs.cardOrder) applyCardOrder(userPrefs.cardOrder);
  applyCardCustom();
}
  const grid = document.getElementById("dashboard-grid");
  if (!grid) return;
  const cards = Array.from(grid.querySelectorAll(".card[data-card]"));
  const orderMap = {};
  order.forEach((id, i) => orderMap[id] = i);
  cards.sort((a, b) => (orderMap[a.dataset.card] ?? 99) - (orderMap[b.dataset.card] ?? 99));
  cards.forEach(c => grid.appendChild(c));
}

function applyAllPrefs() {
  applyTheme(userPrefs.theme || "default");
  if (userPrefs.cardOrder) applyCardOrder(userPrefs.cardOrder);
  applyCardCustom();
}

// =====================================================================
// SETTINGS PANEL
// =====================================================================

function setupSettings() {
  const settingsBtn    = document.getElementById("settings-btn");
  const settingsPanel  = document.getElementById("settings-panel");
  const settingsOverlay= document.getElementById("settings-overlay");
  const settingsClose  = document.getElementById("settings-close");
  const mainView       = document.getElementById("settings-main");
  const customiseView  = document.getElementById("settings-customise");
  const openCustomise  = document.getElementById("open-customise");
  const customiseBack  = document.getElementById("customise-back");
  const logoutBtn      = document.getElementById("logout-btn");
  const resetLayoutBtn = document.getElementById("reset-layout-btn");
  const editLayoutBtn  = document.getElementById("edit-layout-btn");

  if (!settingsBtn) return;

  const open  = () => { settingsPanel.classList.remove("hidden"); settingsOverlay.classList.remove("hidden"); showMain(); };
  const close = () => { settingsPanel.classList.add("hidden");    settingsOverlay.classList.add("hidden"); };
  const showMain = () => { mainView.classList.remove("hidden"); customiseView.classList.add("hidden"); };
  const showCustomise = () => { mainView.classList.add("hidden"); customiseView.classList.remove("hidden"); renderThemeGrid(); };

  settingsBtn.addEventListener("click", open);
  settingsClose.addEventListener("click", close);
  settingsOverlay.addEventListener("click", close);
  openCustomise.addEventListener("click", showCustomise);
  customiseBack.addEventListener("click", showMain);
  document.addEventListener("keydown", e => { if (e.key === "Escape") close(); });

  logoutBtn.addEventListener("click", () => { localStorage.removeItem("access_token"); window.location.href = "/"; });

  editLayoutBtn && editLayoutBtn.addEventListener("click", () => { close(); enterEditMode(); });

  resetLayoutBtn && resetLayoutBtn.addEventListener("click", () => {
    resetLayoutOnly();
    resetLayoutBtn.textContent = "Reset ✓";
    setTimeout(() => resetLayoutBtn.textContent = "Reset layout to default", 1500);
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

    const preview = document.createElement("div");
    preview.className = "theme-preview";
    preview.style.background = theme.preview[0];
    const inner = document.createElement("div");
    inner.className = "theme-preview-card";
    inner.style.background = theme.preview[1];
    inner.style.borderLeft = "3px solid " + theme.preview[2];
    preview.appendChild(inner);

    const label = document.createElement("span");
    label.className = "theme-label";
    label.textContent = theme.label;

    swatch.appendChild(preview);
    swatch.appendChild(label);
    swatch.addEventListener("click", () => {
      userPrefs.theme = key;
      savePrefs();
      applyTheme(key);
    });
    grid.appendChild(swatch);
  });

  // Background colour override (rendered below the swatches)
  const container = grid.parentElement;
  let bgSection = container.querySelector(".custom-bg-section");
  if (!bgSection) {
    bgSection = document.createElement("div");
    bgSection.className = "custom-bg-section";

    const title = document.createElement("div");
    title.className = "settings-section-title";
    title.textContent = "Background colour";
    bgSection.appendChild(title);

    const row = document.createElement("div");
    row.style.cssText = "display:flex;align-items:center;gap:10px;padding:0 16px 12px;";

    const picker = document.createElement("input");
    picker.type = "color";
    picker.className = "edit-color-picker";
    picker.value = userPrefs.customBg || rgbToHex(getComputedStyle(document.body).backgroundColor) || "#f5f7fb";

    picker.addEventListener("input", () => {
      userPrefs.customBg = picker.value;
      savePrefs();
      document.documentElement.style.setProperty("--dash-bg", picker.value);
      document.documentElement.style.setProperty("--page-bg", picker.value);
    });

    const resetBg = document.createElement("button");
    resetBg.className = "edit-ctrl-btn";
    resetBg.textContent = "↺ Reset";
    resetBg.addEventListener("click", () => {
      delete userPrefs.customBg;
      savePrefs();
      applyTheme(userPrefs.theme || "default");
      picker.value = rgbToHex(getComputedStyle(document.body).backgroundColor) || "#f5f7fb";
    });

    row.appendChild(picker);
    row.appendChild(resetBg);
    bgSection.appendChild(row);
    container.appendChild(bgSection);
  }
}

// =====================================================================
// EDIT MODE
// =====================================================================

let editModeActive = false;

// --- Drag state ---
let editDragging = null;       // the card being dragged
let editDragClone = null;      // floating visual clone following cursor
let editPlaceholder = null;    // slot left in the grid
let editDragOffsetX = 0;
let editDragOffsetY = 0;

// --- Resize state ---
let editResizing = null;
let editResizeStartX = 0, editResizeStartY = 0;
let editResizeStartW = 0, editResizeStartH = 0;

function enterEditMode() {
  if (editModeActive) return;
  editModeActive = true;
  document.body.classList.add("edit-mode");
  const bar = document.getElementById("edit-mode-bar");
  if (bar) bar.classList.remove("hidden");
  const grid = document.getElementById("dashboard-grid");
  if (!grid) return;
  grid.querySelectorAll(".card[data-card]").forEach(card => attachEditOverlay(card));
}

function exitEditMode() {
  if (!editModeActive) return;
  editModeActive = false;
  document.body.classList.remove("edit-mode");
  const bar = document.getElementById("edit-mode-bar");
  if (bar) bar.classList.add("hidden");
  document.querySelectorAll(".card-edit-overlay").forEach(el => el.remove());
  document.querySelectorAll(".card-drag-handle-edit").forEach(el => el.remove());
  document.querySelectorAll(".card-resize-handle-edit").forEach(el => el.remove());
}

function resetLayoutOnly() {
  delete userPrefs.cardOrder;
  // Reset wide/hidden/size but keep card colours & title customisations
  const custom = userPrefs.cardCustom || {};
  Object.keys(custom).forEach(id => {
    delete custom[id].wide;
    delete custom[id].hidden;
    delete custom[id].minHeight;
  });
  userPrefs.cardCustom = custom;
  savePrefs();

  applyCardOrder(DEFAULT_CARD_ORDER);
  ["drive","calendar"].forEach(id => {
    const c = document.querySelector(`.card[data-card="${id}"]`);
    if (c) { c.classList.add("card-wide"); c.style.minHeight = ""; c.classList.remove("card-hidden"); }
  });
  ["classes","assignments"].forEach(id => {
    const c = document.querySelector(`.card[data-card="${id}"]`);
    if (c) { c.classList.remove("card-wide"); c.style.minHeight = ""; c.classList.remove("card-hidden"); }
  });
  applyTheme(userPrefs.theme || "default");
}

function attachEditOverlay(card) {
  const cardId = card.dataset.card;

  // ---- Drag handle (top-left of card) ----
  const handle = document.createElement("div");
  handle.className = "card-drag-handle-edit";
  handle.innerHTML = "⠿";
  handle.title = "Drag to reorder";
  card.appendChild(handle);

  handle.addEventListener("mousedown", function (e) {
    if (!editModeActive) return;
    e.preventDefault();
    e.stopPropagation();

    const rect = card.getBoundingClientRect();
    editDragOffsetX = e.clientX - rect.left;
    editDragOffsetY = e.clientY - rect.top;

    // Create a visual clone that follows the cursor
    editDragClone = card.cloneNode(true);
    editDragClone.classList.add("card-drag-clone");
    editDragClone.style.width  = rect.width  + "px";
    editDragClone.style.height = rect.height + "px";
    editDragClone.style.left   = rect.left   + "px";
    editDragClone.style.top    = rect.top    + "px";
    document.body.appendChild(editDragClone);

    // Leave a placeholder in the grid
    editPlaceholder = document.createElement("div");
    editPlaceholder.className = "card-placeholder" + (card.classList.contains("card-wide") ? " card-wide" : "");
    editPlaceholder.style.minHeight = rect.height + "px";
    const grid = document.getElementById("dashboard-grid");
    grid.insertBefore(editPlaceholder, card);
    card.classList.add("card-dragging"); // hide original while dragging
    editDragging = card;
  });

  // ---- Resize handle (bottom-right corner) ----
  const resizeHandle = document.createElement("div");
  resizeHandle.className = "card-resize-handle-edit";
  resizeHandle.title = "Drag to resize";
  card.appendChild(resizeHandle);

  resizeHandle.addEventListener("mousedown", function (e) {
    if (!editModeActive) return;
    e.preventDefault();
    e.stopPropagation();
    editResizing = card;
    editResizeStartX = e.clientX;
    editResizeStartY = e.clientY;
    editResizeStartW = card.offsetWidth;
    editResizeStartH = card.offsetHeight;
  });

  // ---- Toolbar overlay ----
  const overlay = document.createElement("div");
  overlay.className = "card-edit-overlay";

  // Position it smartly: check if card is in right half of screen
  // CSS handles this via a class we toggle after DOM insertion
  card.appendChild(overlay);

  // After inserting, check if it overflows right edge and flip left
  requestAnimationFrame(() => {
    const cardRect = card.getBoundingClientRect();
    const overlayWidth = 232;
    if (cardRect.right + overlayWidth > window.innerWidth - 16) {
      overlay.classList.add("overlay-flip-left");
    }
  });

  // Helper to build a labelled row
  function ctrl(labelText, inputEl) {
    const wrap = document.createElement("div");
    wrap.className = "edit-ctrl-wrap";
    const lbl = document.createElement("span");
    lbl.className = "edit-ctrl-label";
    lbl.textContent = labelText;
    wrap.appendChild(lbl);
    wrap.appendChild(inputEl);
    return wrap;
  }

  // Card background colour
  const bgPicker = document.createElement("input");
  bgPicker.type = "color";
  bgPicker.className = "edit-color-picker";
  bgPicker.value = userPrefs.cardCustom?.[cardId]?.bg
    ? userPrefs.cardCustom[cardId].bg
    : rgbToHex(getComputedStyle(card).backgroundColor) || "#ffffff";
  bgPicker.addEventListener("input", () => {
    setCardPref(cardId, "bg", bgPicker.value);
    card.style.background = bgPicker.value;
    card.style.borderLeft = "none";
    card.style.borderRadius = "16px";
  });

  const bgResetBtn = document.createElement("button");
  bgResetBtn.className = "edit-ctrl-btn";
  bgResetBtn.textContent = "↺ Reset";
  bgResetBtn.addEventListener("click", () => {
    setCardPref(cardId, "bg", null);
    card.style.background = "";
    card.style.borderLeft = "";
    card.style.borderRadius = "";
    applyTheme(userPrefs.theme || "default");
    bgPicker.value = rgbToHex(getComputedStyle(card).backgroundColor) || "#ffffff";
  });

  const bgRow = document.createElement("div");
  bgRow.className = "edit-ctrl-wrap";
  const bgLbl = document.createElement("span"); bgLbl.className = "edit-ctrl-label"; bgLbl.textContent = "Card colour";
  bgRow.appendChild(bgLbl); bgRow.appendChild(bgPicker); bgRow.appendChild(bgResetBtn);

  // Title text
  const h2 = card.querySelector("h2");
  const emojiPrefix = h2 ? (h2.textContent.match(/^(\S+\s)/)?.[1] || "") : "";
  const currentText = h2 ? h2.textContent.replace(emojiPrefix, "").trim() : "";
  const titleInput = document.createElement("input");
  titleInput.type = "text";
  titleInput.className = "edit-ctrl-input";
  titleInput.value = userPrefs.cardCustom?.[cardId]?.headerText || currentText;
  titleInput.placeholder = currentText;
  titleInput.addEventListener("input", () => {
    setCardPref(cardId, "headerText", titleInput.value);
    if (h2) h2.textContent = emojiPrefix + titleInput.value;
  });

  // Title size
  const sizeVal = document.createElement("span");
  sizeVal.textContent = (userPrefs.cardCustom?.[cardId]?.headerSize || 18) + "px";
  sizeVal.className = "edit-ctrl-size-val";
  const sizeInput = document.createElement("input");
  sizeInput.type = "range"; sizeInput.min = "12"; sizeInput.max = "32"; sizeInput.step = "1";
  sizeInput.className = "edit-ctrl-range";
  sizeInput.value = userPrefs.cardCustom?.[cardId]?.headerSize || 18;
  sizeInput.addEventListener("input", () => {
    setCardPref(cardId, "headerSize", parseInt(sizeInput.value));
    if (h2) h2.style.fontSize = sizeInput.value + "px";
    sizeVal.textContent = sizeInput.value + "px";
  });
  const sizeRow = document.createElement("div");
  sizeRow.className = "edit-ctrl-wrap";
  const sizeLbl = document.createElement("span"); sizeLbl.className = "edit-ctrl-label"; sizeLbl.textContent = "Title size";
  sizeRow.appendChild(sizeLbl); sizeRow.appendChild(sizeInput); sizeRow.appendChild(sizeVal);

  // Full width toggle
  const wideToggle = makeToggleRow("Full width", card.classList.contains("card-wide"), (val) => {
    setCardPref(cardId, "wide", val);
    card.classList.toggle("card-wide", val);
  });

  // Hide card toggle
  const isHidden = userPrefs.cardCustom?.[cardId]?.hidden || false;
  const hideToggle = makeToggleRow("Hide card", isHidden, (val) => {
    setCardPref(cardId, "hidden", val);
    card.classList.toggle("card-hidden", val);
  });

  overlay.appendChild(bgRow);
  overlay.appendChild(ctrl("Title", titleInput));
  overlay.appendChild(sizeRow);
  overlay.appendChild(wideToggle);
  overlay.appendChild(hideToggle);
}

function makeToggleRow(labelText, initialValue, onChange) {
  const row = document.createElement("div");
  row.className = "edit-ctrl-wrap edit-ctrl-row";
  const lbl = document.createElement("span");
  lbl.className = "edit-ctrl-label"; lbl.textContent = labelText;

  const toggle = document.createElement("button");
  toggle.className = "edit-toggle-btn" + (initialValue ? " active" : "");
  toggle.textContent = initialValue ? "On" : "Off";
  let val = initialValue;
  toggle.addEventListener("click", () => {
    val = !val;
    toggle.textContent = val ? "On" : "Off";
    toggle.classList.toggle("active", val);
    onChange(val);
  });

  row.appendChild(lbl);
  row.appendChild(toggle);
  return row;
}

function setCardPref(cardId, key, value) {
  if (!userPrefs.cardCustom) userPrefs.cardCustom = {};
  if (!userPrefs.cardCustom[cardId]) userPrefs.cardCustom[cardId] = {};
  if (value === null || value === undefined) {
    delete userPrefs.cardCustom[cardId][key];
  } else {
    userPrefs.cardCustom[cardId][key] = value;
  }
  savePrefs();
}

// ---- Global mousemove: handle both drag and resize ----
document.addEventListener("mousemove", function (e) {
  // Drag
  if (editDragClone && editDragging) {
    editDragClone.style.left = (e.clientX - editDragOffsetX) + "px";
    editDragClone.style.top  = (e.clientY - editDragOffsetY) + "px";

    const grid = document.getElementById("dashboard-grid");
    if (!grid) return;
    const candidates = Array.from(grid.querySelectorAll(".card[data-card]:not(.card-dragging), .card-placeholder"));
    let closest = null, closestDist = Infinity;
    candidates.forEach(c => {
      const r = c.getBoundingClientRect();
      const dist = Math.hypot(e.clientX - (r.left + r.width/2), e.clientY - (r.top + r.height/2));
      if (dist < closestDist) { closestDist = dist; closest = c; }
    });
    if (closest && closest !== editPlaceholder) {
      const r = closest.getBoundingClientRect();
      grid.insertBefore(editPlaceholder, e.clientY > r.top + r.height/2 ? closest.nextSibling : closest);
    }
  }

  // Resize
  if (editResizing) {
    const newW = Math.max(200, editResizeStartW + (e.clientX - editResizeStartX));
    const newH = Math.max(100, editResizeStartH + (e.clientY - editResizeStartY));
    editResizing.style.minHeight = newH + "px";
    // Only constrain width on non-wide cards
    if (!editResizing.classList.contains("card-wide")) {
      editResizing.style.width = newW + "px";
    }
    setCardPref(editResizing.dataset.card, "minHeight", newH);
  }
});

// ---- Global mouseup: finish drag or resize ----
document.addEventListener("mouseup", function () {
  if (editDragClone && editDragging) {
    editDragClone.remove();
    editDragClone = null;
    const grid = document.getElementById("dashboard-grid");
    if (grid && editPlaceholder && editPlaceholder.parentNode === grid) {
      grid.insertBefore(editDragging, editPlaceholder);
      editPlaceholder.remove();
    }
    editDragging.classList.remove("card-dragging");
    const order = Array.from(grid.querySelectorAll(".card[data-card]")).map(c => c.dataset.card);
    userPrefs.cardOrder = order;
    savePrefs();
    applyTheme(userPrefs.theme || "default");
    editDragging = null;
    editPlaceholder = null;
  }

  if (editResizing) {
    editResizing = null;
  }
});

// Helper: computed rgb → hex
function rgbToHex(rgb) {
  if (!rgb) return "#ffffff";
  const m = rgb.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
  if (!m) return "#ffffff";
  return "#" + [m[1],m[2],m[3]].map(x => parseInt(x).toString(16).padStart(2,"0")).join("");
}

// =====================================================================
// NOTES SYSTEM
// =====================================================================

const notesLayer    = document.getElementById("notes-layer");
const notesToggleBtn= document.getElementById("notes-toggle");
const addNoteBtn    = document.getElementById("add-note");
const notesTray     = document.getElementById("notes-tray");

let notesVisible = false;
let notes = JSON.parse(localStorage.getItem("dashboard_notes") || "[]");

function saveNotes() { localStorage.setItem("dashboard_notes", JSON.stringify(notes)); }
function getNoteById(id) { return notes.find(n => n.id === id); }

function makeDraggable(el, handleEl, noteId) {
  let dragging = false, offsetX = 0, offsetY = 0;
  handleEl.addEventListener("mousedown", function (e) {
    if (e.target.closest("button") || e.target.closest("[contenteditable]")) return;
    dragging = true; offsetX = e.clientX - el.offsetLeft; offsetY = e.clientY - el.offsetTop;
    el.style.zIndex = 9999; e.preventDefault();
  });
  document.addEventListener("mousemove", function (e) {
    if (!dragging) return;
    el.style.left = Math.max(0, Math.min(window.innerWidth  - el.offsetWidth,  e.clientX - offsetX)) + "px";
    el.style.top  = Math.max(0, Math.min(window.innerHeight - el.offsetHeight, e.clientY - offsetY)) + "px";
  });
  document.addEventListener("mouseup", function () {
    if (!dragging) return; dragging = false; el.style.zIndex = "";
    const n = getNoteById(noteId);
    if (n) { n.x = el.offsetLeft; n.y = el.offsetTop; saveNotes(); }
  });
}

function makeResizable(el, noteId) {
  const handle = document.createElement("div");
  handle.className = "note-resize-handle";
  el.appendChild(handle);
  let resizing = false, startX, startY, startW, startH;
  handle.addEventListener("mousedown", function (e) {
    resizing = true; startX = e.clientX; startY = e.clientY;
    startW = el.offsetWidth; startH = el.offsetHeight;
    el.style.zIndex = 9999; e.preventDefault(); e.stopPropagation();
  });
  document.addEventListener("mousemove", function (e) {
    if (!resizing) return;
    el.style.width  = Math.max(200, startW + (e.clientX - startX)) + "px";
    el.style.height = Math.max(120, startH + (e.clientY - startY)) + "px";
  });
  document.addEventListener("mouseup", function () {
    if (!resizing) return; resizing = false; el.style.zIndex = "";
    const n = getNoteById(noteId);
    if (n) { n.w = el.offsetWidth; n.h = el.offsetHeight; saveNotes(); }
  });
}

function createNoteEl(note) {
  const el = document.createElement("div");
  el.className = "sticky-note";
  el.style.left = (note.x || 120) + "px";
  el.style.top  = (note.y || 120) + "px";
  if (note.w) el.style.width  = note.w + "px";
  if (note.h) el.style.height = note.h + "px";
  el.dataset.id = String(note.id);

  const head = document.createElement("div");
  head.className = "sticky-head";

  const title = document.createElement("span");
  title.className = "sticky-title";
  title.textContent = note.name || "Note";
  title.setAttribute("contenteditable","true");
  title.setAttribute("spellcheck","false");
  title.addEventListener("keydown", e => { if (e.key === "Enter") { e.preventDefault(); title.blur(); } });
  title.addEventListener("blur", function () {
    const n = getNoteById(note.id);
    if (n) { n.name = title.textContent.trim() || "Note"; title.textContent = n.name; saveNotes(); updateTray(); }
  });

  const minBtn = document.createElement("button");
  minBtn.className = "note-action-btn"; minBtn.title = "Minimize"; minBtn.innerHTML = "&#8722;";
  minBtn.addEventListener("click", () => {
    const n = getNoteById(note.id); if (!n) return;
    n.minimized = true; saveNotes(); el.remove(); updateTray();
  });

  const delBtn = document.createElement("button");
  delBtn.className = "note-action-btn note-delete-btn"; delBtn.title = "Delete"; delBtn.innerHTML = "×";
  delBtn.addEventListener("click", () => {
    notes = notes.filter(n => n.id !== note.id); saveNotes(); el.remove(); updateTray();
  });

  head.appendChild(title); head.appendChild(minBtn); head.appendChild(delBtn);

  const body = document.createElement("div"); body.className = "sticky-body";
  const ta = document.createElement("textarea");
  ta.className = "sticky-text"; ta.placeholder = "Write something..."; ta.value = note.text || "";
  ta.addEventListener("input", () => { const n = getNoteById(note.id); if (n) { n.text = ta.value; saveNotes(); } });
  body.appendChild(ta);

  el.appendChild(head); el.appendChild(body);
  makeDraggable(el, head, note.id);
  makeResizable(el, note.id);
  return el;
}

function renderNotes() {
  if (!notesLayer) return;
  notesLayer.querySelectorAll(".sticky-note").forEach(el => el.remove());
  notes.filter(n => !n.minimized).forEach(note => notesLayer.appendChild(createNoteEl(note)));
  updateTray();
}

function updateTray() {
  if (!notesTray) return;
  notesTray.innerHTML = "";
  const minimized = notes.filter(n => n.minimized);
  notesTray.style.display = minimized.length ? "flex" : "none";
  minimized.forEach(note => {
    const chip = document.createElement("button");
    chip.className = "tray-chip"; chip.textContent = note.name || "Note"; chip.title = "Restore";
    chip.addEventListener("click", () => { note.minimized = false; saveNotes(); renderNotes(); });
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
  const id = Date.now(), col = notes.length % 4;
  notes.push({ id, name: "Note", text: "", x: 120 + col*40, y: 120 + col*40, w: null, h: null, minimized: false });
  saveNotes(); renderNotes();
  setTimeout(() => {
    const el = notesLayer.querySelector(`.sticky-note[data-id="${id}"] .sticky-title`);
    if (el) { el.focus(); const r = document.createRange(), s = window.getSelection(); r.selectNodeContents(el); s.removeAllRanges(); s.addRange(r); }
  }, 50);
}

function setupNotes() {
  if (!notesLayer || !addNoteBtn) return;
  addNoteBtn.addEventListener("click", addNote);
  if (notesToggleBtn) notesToggleBtn.addEventListener("click", () => toggleNotes());
  document.addEventListener("keydown", e => {
    if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "n") { e.preventDefault(); toggleNotes(); }
  });
}

// =====================================================================
// DASHBOARD DATA
// =====================================================================

const params = new URLSearchParams(window.location.search);
const urlToken = params.get("token");
const savedToken = localStorage.getItem("access_token");
const token = urlToken || savedToken;

if (urlToken) { localStorage.setItem("access_token", urlToken); window.history.replaceState({}, "", "/dashboard"); }

const classesList     = document.getElementById("classes");
const assignmentsList = document.getElementById("assignments");
const selectedCourse  = document.getElementById("selected-course");
const assignmentLoader= document.getElementById("assignment-loader");
const calendarLoader  = document.getElementById("calendar-loader");
const groupsContainer = document.getElementById("event-groups");
const driveFilesList  = document.getElementById("drive-files");
const driveSearchInput= document.getElementById("drive-search");
const driveLoader     = document.getElementById("drive-loader");

let selectedCourseId = null, selectedCourseName = null;
let assignmentCache = [], activeAssignmentFilter = "all";
let activeDriveFilter = "recent", driveSearchQuery = "", driveHasSearched = false, driveViewMode = "list";

async function fetchJsonSafe(url) {
  const response = await fetch(url);
  const text = await response.text();
  try {
    const json = JSON.parse(text);
    if (!response.ok) throw new Error(json.error || `Request failed: ${response.status}`);
    return json;
  } catch(_) {
    if (!response.ok) throw new Error(text || `Request failed: ${response.status}`);
    throw new Error("Invalid JSON response");
  }
}

function setupReloginListener() {
  window.addEventListener("message", function (e) {
    if (e.origin !== window.location.origin) return;
    if (!e.data || e.data.type !== "google-auth-success" || !e.data.token) return;
    localStorage.setItem("access_token", e.data.token);
    window.location.reload();
  });
}

function createReloginButton() {
  const btn = document.createElement("button");
  btn.className = "tab-btn relogin-btn"; btn.textContent = "Re-login";
  btn.addEventListener("click", () => {
    const pw = 500, ph = 650;
    const popup = window.open("/auth/google?popup=1","google-auth-popup",`width=${pw},height=${ph},left=${window.screenX+(window.outerWidth-pw)/2},top=${window.screenY+(window.outerHeight-ph)/2}`);
    if (!popup) window.location.href = "/auth/google";
  });
  return btn;
}

function showReloginPrompt(container) {
  const w = document.createElement("div"); w.className = "relogin-wrap"; w.appendChild(createReloginButton()); container.appendChild(w);
}

function formatDate(d) {
  if (!d) return "No due date";
  return new Date(d).toLocaleString(undefined, { month:"short", day:"numeric", hour:"numeric", minute:"2-digit" });
}

function courseWorkDueDate(work) {
  if (!work.dueDate) return null;
  const { year, month, day } = work.dueDate;
  return new Date(year, (month||1)-1, day||1, work.dueTime?.hours||0, work.dueTime?.minutes||0);
}

function eventStartDate(e) { return new Date(e.start?.dateTime || e.start?.date || Date.now()); }
function startOfToday() { const n=new Date(); return new Date(n.getFullYear(),n.getMonth(),n.getDate()); }
function endOfToday()    { const t=startOfToday(); return new Date(t.getFullYear(),t.getMonth(),t.getDate(),23,59,59,999); }
function endOfTomorrow() { const t=startOfToday(); return new Date(t.getFullYear(),t.getMonth(),t.getDate()+1,23,59,59,999); }
function endOfWeek()     { const t=startOfToday(); return new Date(t.getFullYear(),t.getMonth(),t.getDate()+(7-t.getDay()),23,59,59,999); }
function endOfMonth()    { const n=new Date(); return new Date(n.getFullYear(),n.getMonth()+1,0,23,59,59,999); }
function setLoader(el,v) { el.classList.toggle("hidden",!v); }
function isUnturnedIn(a) { return a.mySubmissionState!=="TURNED_IN"&&a.mySubmissionState!=="RETURNED"; }

function getFilteredAssignments(list, filter) {
  const now = new Date();
  if (filter==="unturned") return list.filter(isUnturnedIn);
  if (filter==="upcoming") return list.filter(a => a.due && a.due>=now);
  return list;
}

function renderAssignments() {
  assignmentsList.innerHTML = "";
  const filtered = getFilteredAssignments(assignmentCache, activeAssignmentFilter);
  if (!filtered.length) { const li=document.createElement("li"); li.textContent="No assignments for this tab."; assignmentsList.appendChild(li); return; }
  filtered.forEach(work => {
    const li = document.createElement("li");
    li.innerHTML = `<strong>${work.title||"Untitled"}</strong><br><span>${formatDate(work.due)}</span><br><span class="assignment-state">Status: ${(work.mySubmissionState||"UNKNOWN").replaceAll("_"," ")}</span>`;
    assignmentsList.appendChild(li);
  });
}

async function loadAssignments(courseId, courseName, forceRefresh=false) {
  selectedCourseId=courseId; selectedCourseName=courseName;
  selectedCourse.textContent=`Loading assignments for ${courseName}...`;
  setLoader(assignmentLoader,true);
  if (!forceRefresh) { assignmentCache=[]; renderAssignments(); }
  try {
    const data = await fetchJsonSafe(`/api/coursework?token=${encodeURIComponent(token)}&courseId=${encodeURIComponent(courseId)}`);
    assignmentCache = (data.courseWork||[]).map(w=>({...w,due:courseWorkDueDate(w)})).sort((a,b)=>(!a.due&&!b.due)?0:!a.due?1:!b.due?-1:a.due-b.due);
    selectedCourse.textContent=`Assignments for ${courseName}`; renderAssignments();
  } catch(err) {
    selectedCourse.textContent=`Could not load: ${err.message}`; assignmentCache=[]; renderAssignments();
    if (err.message.toLowerCase().includes("invalid")||err.message.toLowerCase().includes("auth")) showReloginPrompt(assignmentsList);
  } finally { setLoader(assignmentLoader,false); }
}

function renderEventGroups(events) {
  groupsContainer.innerHTML = "";
  const [ts,te,tom,wk,mo] = [startOfToday(),endOfToday(),endOfTomorrow(),endOfWeek(),endOfMonth()];
  const groups = {
    Today:      events.filter(e=>{const s=eventStartDate(e);return s>=ts&&s<=te;}),
    Tomorrow:   events.filter(e=>{const s=eventStartDate(e);return s>te&&s<=tom;}),
    "This Week":events.filter(e=>{const s=eventStartDate(e);return s>tom&&s<=wk;}),
    "This Month":events.filter(e=>{const s=eventStartDate(e);return s>wk&&s<=mo;}),
  };
  Object.entries(groups).forEach(([label,ev])=>{
    const sec=document.createElement("div"); sec.className="event-group";
    const h=document.createElement("h3"); h.textContent=label; sec.appendChild(h);
    const ul=document.createElement("ul");
    if (!ev.length) { const li=document.createElement("li"); li.textContent="No events"; ul.appendChild(li); }
    else ev.forEach(event=>{
      const li=document.createElement("li");
      li.innerHTML=`<strong>${event.summary||"No title"}</strong><br><span>${formatDate(eventStartDate(event))}</span><br><span class="event-calendar-name">${event.sourceCalendarSummary||"Primary"}</span>`;
      ul.appendChild(li);
    });
    sec.appendChild(ul); groupsContainer.appendChild(sec);
  });
}

async function loadCalendar(forceRefresh=false) {
  if (!forceRefresh) groupsContainer.innerHTML="";
  setLoader(calendarLoader,true);
  try {
    const data=await fetchJsonSafe(`/api/calendar?token=${encodeURIComponent(token)}`);
    renderEventGroups((data.items||[]).sort((a,b)=>eventStartDate(a)-eventStartDate(b)));
  } catch(err) {
    groupsContainer.innerHTML=`<div class="event-group"><h3>Error</h3><ul><li>${err.message}</li></ul></div>`;
    if (err.message.toLowerCase().includes("auth")) showReloginPrompt(groupsContainer);
  } finally { setLoader(calendarLoader,false); }
}

function setupAssignmentTabs() {
  document.querySelectorAll("[data-assignment-filter]").forEach(btn=>{
    btn.addEventListener("click",()=>{
      activeAssignmentFilter=btn.dataset.assignmentFilter;
      document.querySelectorAll("[data-assignment-filter]").forEach(b=>b.classList.remove("active"));
      btn.classList.add("active"); renderAssignments();
    });
  });
}

async function loadClasses() {
  classesList.innerHTML="";
  try {
    const data=await fetchJsonSafe(`/api/classroom?token=${encodeURIComponent(token)}`);
    if (data.courses?.length) {
      data.courses.forEach(course=>{
        const li=document.createElement("li"),btn=document.createElement("button");
        btn.className="class-btn"; btn.textContent=course.name;
        btn.addEventListener("click",()=>loadAssignments(course.id,course.name));
        li.appendChild(btn); classesList.appendChild(li);
      });
    } else { const li=document.createElement("li"); li.textContent="No classes found."; classesList.appendChild(li); }
  } catch(err) {
    const li=document.createElement("li"); li.textContent=`Could not load: ${err.message}`; classesList.appendChild(li);
    if (err.message.toLowerCase().includes("auth")) showReloginPrompt(classesList);
  }
}

async function toggleDriveStar(fileId,starred) {
  await fetchJsonSafe(`/api/drive/star?token=${encodeURIComponent(token)}&fileId=${encodeURIComponent(fileId)}&starred=${starred?"1":"0"}`);
}

function renderDriveFiles(files) {
  driveFilesList.innerHTML="";
  driveFilesList.classList.toggle("drive-grid",driveViewMode==="grid");
  if (!driveHasSearched&&activeDriveFilter==="recent") {
    const li=document.createElement("li"); li.className="drive-empty"; li.textContent="Search something to get started."; driveFilesList.appendChild(li); return;
  }
  if (!files.length) {
    const li=document.createElement("li"); li.className="drive-empty"; li.textContent="No files found."; driveFilesList.appendChild(li); return;
  }
  files.forEach(file=>{
    const li=document.createElement("li"); li.className="drive-file-item";
    const link=document.createElement("a");
    link.href=file.webViewLink||`https://drive.google.com/file/d/${file.id}/view`;
    link.target="_blank"; link.rel="noopener noreferrer"; link.className="drive-file-link";
    if (driveViewMode==="grid") {
      const prev=document.createElement("div"); prev.className="drive-preview";
      if (file.thumbnailLink){const img=document.createElement("img");img.src=file.thumbnailLink;img.alt=file.name||"";prev.appendChild(img);}
      else prev.textContent="No preview";
      link.appendChild(prev);
    }
    const name=document.createElement("span"); name.textContent=file.name||"Untitled"; link.appendChild(name);
    const star=document.createElement("button"); star.className="star-btn"; star.textContent=file.starred?"★":"☆";
    star.addEventListener("click",async()=>{ star.disabled=true; await toggleDriveStar(file.id,!file.starred); await loadDriveFiles(true); });
    li.appendChild(link); li.appendChild(star); driveFilesList.appendChild(li);
  });
}

async function loadDriveFiles(forceRefresh=false) {
  if (!forceRefresh) driveFilesList.innerHTML="";
  setLoader(driveLoader,true);
  try {
    const data=await fetchJsonSafe(`/api/drive?token=${encodeURIComponent(token)}&q=${encodeURIComponent(driveSearchQuery)}&starred=${activeDriveFilter==="starred"?"1":"0"}&recent=${activeDriveFilter==="recent"?"1":"0"}`);
    renderDriveFiles(data.files||[]);
  } catch(err) {
    driveFilesList.innerHTML=`<li>Could not load Drive files: ${err.message}</li>`;
    if (err.message.toLowerCase().includes("auth")) showReloginPrompt(driveFilesList);
  } finally { setLoader(driveLoader,false); }
}

function setupDriveControls() {
  if (!driveSearchInput||!driveFilesList) return;
  document.querySelectorAll("[data-drive-filter]").forEach(btn=>{
    btn.addEventListener("click",()=>{
      activeDriveFilter=btn.dataset.driveFilter;
      document.querySelectorAll("[data-drive-filter]").forEach(b=>b.classList.remove("active"));
      btn.classList.add("active"); loadDriveFiles();
    });
  });
  const tog=document.getElementById("drive-view-toggle");
  if (tog) tog.addEventListener("click",()=>{ driveViewMode=driveViewMode==="list"?"grid":"list"; tog.textContent=driveViewMode==="grid"?"☰ List":"▦ Grid"; loadDriveFiles(true); });
  document.getElementById("drive-search-btn").addEventListener("click",()=>{ driveSearchQuery=driveSearchInput.value.trim(); driveHasSearched=true; loadDriveFiles(); });
  driveSearchInput.addEventListener("keydown",e=>{ if(e.key==="Enter"){driveSearchQuery=driveSearchInput.value.trim();driveHasSearched=true;loadDriveFiles();} });
}

function setupRefreshButtons() {
  const ar=document.getElementById("assignment-refresh"), cr=document.getElementById("calendar-refresh");
  if (ar) ar.addEventListener("click",()=>{ if(selectedCourseId) loadAssignments(selectedCourseId,selectedCourseName,true); });
  if (cr) cr.addEventListener("click",()=>loadCalendar(true));
}

function setupSidebar() {
  const tog=document.getElementById("menu-toggle"),menu=document.getElementById("side-menu"),
        cls=document.getElementById("menu-close"),ov=document.getElementById("menu-overlay");
  if (!tog||!menu||!cls||!ov) return;
  const open=()=>{menu.classList.add("open");ov.classList.add("open");};
  const close=()=>{menu.classList.remove("open");ov.classList.remove("open");};
  tog.addEventListener("click",open); cls.addEventListener("click",close); ov.addEventListener("click",close);
}

async function loadData() {
  if (!classesList||!assignmentsList||!groupsContainer) return;
  setupAssignmentTabs(); setupDriveControls(); setupRefreshButtons();
  if (!token) { window.location.href="/"; return; }
  await Promise.allSettled([loadClasses(), loadCalendar(), loadDriveFiles()]);
}

// =====================================================================
// EDIT MODE BAR — wire up Done and Reset buttons
// =====================================================================
document.addEventListener("DOMContentLoaded", function () {
  const doneBtn  = document.getElementById("edit-mode-done");
  const resetBtn = document.getElementById("edit-mode-reset");
  if (doneBtn)  doneBtn.addEventListener("click", exitEditMode);
  if (resetBtn) resetBtn.addEventListener("click", () => {
    resetLayoutOnly();
    // Re-attach overlays since DOM changed
    exitEditMode();
    enterEditMode();
    resetBtn.textContent = "Reset ✓";
    setTimeout(() => resetBtn.textContent = "Reset layout", 1500);
  });
});

// =====================================================================
// BOOT
// =====================================================================
setupReloginListener();
setupSidebar();
setupSettings();
setupNotes();
applyAllPrefs();
loadData();
