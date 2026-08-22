// =====================================================================
// RESIZE PERSISTENCE
// Keeps dashboard card resize changes in memory while dragging and
// saves the final width/height only when the mouse is released.
// =====================================================================

(function () {
  let resizingCard = null;
  let resizing = false;

  // Block dashboard preference writes while a resize is in progress.
  // The existing dashboard resize handler can continue updating the card
  // visually without repeatedly writing to localStorage.
  const originalSetItem = Storage.prototype.setItem;
  Storage.prototype.setItem = function (key, value) {
    if (resizing && key === "dashboard_prefs") return;
    return originalSetItem.call(this, key, value);
  };

  function restoreWidths() {
    let prefs;
    try { prefs = JSON.parse(localStorage.getItem("dashboard_prefs") || "{}"); }
    catch (_) { prefs = {}; }

    const custom = prefs.cardCustom || {};
    Object.entries(custom).forEach(([cardId, opts]) => {
      const card = document.querySelector(`.card[data-card="${cardId}"]`);
      if (!card || card.classList.contains("card-wide")) return;
      if (opts.width) card.style.width = opts.width + "px";
    });
  }

  function startResize(card) {
    resizingCard = card;
    resizing = true;
  }

  function finishResize() {
    if (!resizingCard) return;

    const card = resizingCard;
    const cardId = card.dataset.card;

    let prefs;
    try { prefs = JSON.parse(localStorage.getItem("dashboard_prefs") || "{}"); }
    catch (_) { prefs = {}; }

    if (!prefs.cardCustom) prefs.cardCustom = {};
    if (!prefs.cardCustom[cardId]) prefs.cardCustom[cardId] = {};

    const opts = prefs.cardCustom[cardId];
    opts.minHeight = Math.round(card.getBoundingClientRect().height);

    if (!card.classList.contains("card-wide")) {
      opts.width = Math.round(card.getBoundingClientRect().width);
    } else {
      delete opts.width;
    }

    // Allow the final save through now that the resize is complete.
    resizing = false;
    localStorage.setItem("dashboard_prefs", JSON.stringify(prefs));
    resizingCard = null;
  }

  // Use the resize handle itself to know when the resize begins/ends.
  document.addEventListener("mousedown", function (e) {
    const handle = e.target.closest(".card-resize-handle-edit");
    if (!handle) return;
    const card = handle.closest(".card[data-card]");
    if (card) startResize(card);
  }, true);

  document.addEventListener("mouseup", finishResize, true);

  // Reset buttons should also remove any saved custom width.
  document.addEventListener("click", function (e) {
    const btn = e.target.closest("#reset-layout-btn, #edit-mode-reset");
    if (!btn) return;
    setTimeout(function () {
      let prefs;
      try { prefs = JSON.parse(localStorage.getItem("dashboard_prefs") || "{}"); }
      catch (_) { prefs = {}; }
      const custom = prefs.cardCustom || {};
      Object.values(custom).forEach(opts => delete opts.width);
      localStorage.setItem("dashboard_prefs", JSON.stringify(prefs));
    }, 0);
  });

  // The dashboard script has already booted by the time this file is loaded.
  restoreWidths();
})();
