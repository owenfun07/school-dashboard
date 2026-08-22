// =====================================================================
// RESIZE PERSISTENCE
// Keeps dashboard card resize changes in memory while dragging and
// saves the final width/height only when the mouse is released.
// =====================================================================

(function () {
  const originalSetCardPref = window.setCardPref;
  if (typeof originalSetCardPref !== "function") return;

  let resizingCard = null;

  // The existing resize handler calls setCardPref("minHeight", ...) on
  // every mousemove. Keep that change in memory, but don't write to
  // localStorage until mouseup.
  window.setCardPref = function (cardId, key, value) {
    if ((key === "minHeight" || key === "width") && resizingCard) {
      if (!window.userPrefs) return;
      if (!window.userPrefs.cardCustom) window.userPrefs.cardCustom = {};
      if (!window.userPrefs.cardCustom[cardId]) window.userPrefs.cardCustom[cardId] = {};
      if (value === null || value === undefined) delete window.userPrefs.cardCustom[cardId][key];
      else window.userPrefs.cardCustom[cardId][key] = value;
      return;
    }
    return originalSetCardPref(cardId, key, value);
  };

  // The original script declares userPrefs with let, so it isn't exposed
  // on window. Capture it from localStorage for the small persistence layer.
  const prefs = JSON.parse(localStorage.getItem("dashboard_prefs") || "{}");
  window.userPrefs = prefs;

  // Keep this object synchronized with the original preferences object.
  const originalSavePrefs = window.savePrefs;
  window.savePrefs = function () {
    if (typeof originalSavePrefs === "function") originalSavePrefs();
    else localStorage.setItem("dashboard_prefs", JSON.stringify(window.userPrefs));
  };

  // Restore saved custom widths after the main dashboard script has applied
  // its other preferences.
  function restoreWidths() {
    const custom = window.userPrefs.cardCustom || {};
    Object.entries(custom).forEach(([cardId, opts]) => {
      const card = document.querySelector(`.card[data-card="${cardId}"]`);
      if (!card || card.classList.contains("card-wide")) return;
      if (opts.width) card.style.width = opts.width + "px";
    });
  }

  function startResize(card) {
    resizingCard = card;
  }

  function finishResize() {
    if (!resizingCard) return;
    const card = resizingCard;
    const cardId = card.dataset.card;

    if (!window.userPrefs.cardCustom) window.userPrefs.cardCustom = {};
    if (!window.userPrefs.cardCustom[cardId]) window.userPrefs.cardCustom[cardId] = {};

    const opts = window.userPrefs.cardCustom[cardId];
    opts.minHeight = Math.round(card.getBoundingClientRect().height);

    if (!card.classList.contains("card-wide")) {
      opts.width = Math.round(card.getBoundingClientRect().width);
    } else {
      delete opts.width;
    }

    localStorage.setItem("dashboard_prefs", JSON.stringify(window.userPrefs));
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

  // Reset buttons should also remove the saved custom width.
  document.addEventListener("click", function (e) {
    const btn = e.target.closest("#reset-layout-btn, #edit-mode-reset");
    if (!btn) return;
    setTimeout(function () {
      const custom = window.userPrefs.cardCustom || {};
      Object.values(custom).forEach(opts => delete opts.width);
      localStorage.setItem("dashboard_prefs", JSON.stringify(window.userPrefs));
    }, 0);
  });

  // The dashboard script has already booted by the time this file is loaded.
  restoreWidths();
})();
