/**
 * theme-loader.js
 * Load this in <head> on EVERY page (before style.css or after — doesn't matter).
 * Reads saved theme prefs from localStorage and applies CSS variables to <html>
 * immediately, before the page renders, so there's no flash of unstyled content.
 */
(function () {
  try {
    var prefs = JSON.parse(localStorage.getItem("dashboard_prefs") || "{}");
    var themeKey = prefs.theme || "default";

    var THEME_VARS = {
      default: {},
      slate: {
        "--dash-bg": "#f0f4ff", "--card-bg": "#ffffff", "--card-border": "#c7d7f9",
        "--text-primary": "#0f172a", "--text-secondary": "#334155", "--text-muted": "#64748b",
        "--page-bg": "#f0f4ff", "--sidebar-bg": "#ffffff", "--input-bg": "#ffffff",
        "--btn-bg": "#ffffff", "--btn-border": "#c7d7f9",
        "--card-accent-classes": "#2563eb", "--card-accent-assignments": "#10b981",
        "--card-accent-drive": "#8b5cf6", "--card-accent-calendar": "#f59e0b",
        "--accent-left-border": "1",
      },
      warm: {
        "--dash-bg": "#faf6ef", "--card-bg": "#fffdf7", "--card-border": "#e0d8c4",
        "--text-primary": "#3a3020", "--text-secondary": "#5a4e38", "--text-muted": "#7a6a50",
        "--page-bg": "#faf6ef", "--sidebar-bg": "#fffdf7", "--input-bg": "#fffdf7",
        "--btn-bg": "#fffdf7", "--btn-border": "#e0d8c4",
        "--card-accent-classes": "#b8955a", "--card-accent-assignments": "#7a9e60",
        "--card-accent-drive": "#9e6a7a", "--card-accent-calendar": "#6a7a9e",
        "--accent-left-border": "1",
      },
      forest: {
        "--dash-bg": "#f0f7f2", "--card-bg": "#ffffff", "--card-border": "#b7dfc8",
        "--text-primary": "#1a3328", "--text-secondary": "#2d5a45", "--text-muted": "#52796f",
        "--page-bg": "#f0f7f2", "--sidebar-bg": "#ffffff", "--input-bg": "#ffffff",
        "--btn-bg": "#ffffff", "--btn-border": "#b7dfc8",
        "--card-accent-classes": "#2d6a4f", "--card-accent-assignments": "#52b788",
        "--card-accent-drive": "#74c69d", "--card-accent-calendar": "#1b4332",
        "--accent-left-border": "1",
      },
      midnight: {
        "--dash-bg": "#1a1f2e", "--card-bg": "#252b3b", "--card-border": "#2e3650",
        "--text-primary": "#e8ecf4", "--text-secondary": "#8892aa", "--text-muted": "#6b7899",
        "--page-bg": "#1a1f2e", "--sidebar-bg": "#1e2538", "--input-bg": "#2d3548",
        "--btn-bg": "#2d3548", "--btn-border": "#3d4560",
        "--card-accent-classes": "#4a7cf0", "--card-accent-assignments": "#3ac97a",
        "--card-accent-drive": "#c084fc", "--card-accent-calendar": "#f0a040",
        "--accent-left-border": "1",
      },
      rose: {
        "--dash-bg": "#fff5f7", "--card-bg": "#ffffff", "--card-border": "#fecdd3",
        "--text-primary": "#1c0a0e", "--text-secondary": "#4c1d28", "--text-muted": "#9f5060",
        "--page-bg": "#fff5f7", "--sidebar-bg": "#ffffff", "--input-bg": "#ffffff",
        "--btn-bg": "#ffffff", "--btn-border": "#fecdd3",
        "--card-accent-classes": "#e11d48", "--card-accent-assignments": "#f43f5e",
        "--card-accent-drive": "#fb7185", "--card-accent-calendar": "#fda4af",
        "--accent-left-border": "1",
      },
      ocean: {
        "--dash-bg": "#f0f9ff", "--card-bg": "#ffffff", "--card-border": "#bae6fd",
        "--text-primary": "#0c2a3f", "--text-secondary": "#155e75", "--text-muted": "#0e7490",
        "--page-bg": "#f0f9ff", "--sidebar-bg": "#ffffff", "--input-bg": "#ffffff",
        "--btn-bg": "#ffffff", "--btn-border": "#bae6fd",
        "--card-accent-classes": "#0284c7", "--card-accent-assignments": "#06b6d4",
        "--card-accent-drive": "#0ea5e9", "--card-accent-calendar": "#38bdf8",
        "--accent-left-border": "1",
      },
      charcoal: {
        "--dash-bg": "#1c1c1e", "--card-bg": "#2c2c2e", "--card-border": "#3a3a3c",
        "--text-primary": "#f5f5f7", "--text-secondary": "#aeaeb2", "--text-muted": "#8e8e93",
        "--page-bg": "#1c1c1e", "--sidebar-bg": "#232325", "--input-bg": "#3a3a3c",
        "--btn-bg": "#3a3a3c", "--btn-border": "#48484a",
        "--card-accent-classes": "#0a84ff", "--card-accent-assignments": "#32d74b",
        "--card-accent-drive": "#bf5af2", "--card-accent-calendar": "#ff9f0a",
        "--accent-left-border": "1",
      },
      lavender: {
        "--dash-bg": "#f5f3ff", "--card-bg": "#ffffff", "--card-border": "#ddd6fe",
        "--text-primary": "#1e1b4b", "--text-secondary": "#3730a3", "--text-muted": "#6d28d9",
        "--page-bg": "#f5f3ff", "--sidebar-bg": "#ffffff", "--input-bg": "#ffffff",
        "--btn-bg": "#ffffff", "--btn-border": "#ddd6fe",
        "--card-accent-classes": "#7c3aed", "--card-accent-assignments": "#8b5cf6",
        "--card-accent-drive": "#a78bfa", "--card-accent-calendar": "#c4b5fd",
        "--accent-left-border": "1",
      },
      paper: {
        "--dash-bg": "#f9f7f4", "--card-bg": "#fefefe", "--card-border": "#ddd8d0",
        "--text-primary": "#1a1814", "--text-secondary": "#4a4540", "--text-muted": "#7a7068",
        "--page-bg": "#f9f7f4", "--sidebar-bg": "#fefefe", "--input-bg": "#fefefe",
        "--btn-bg": "#fefefe", "--btn-border": "#ddd8d0",
        "--card-accent-classes": "#92400e", "--card-accent-assignments": "#065f46",
        "--card-accent-drive": "#1e3a5f", "--card-accent-calendar": "#3b1f5e",
        "--accent-left-border": "1",
        "--font-family": "Georgia, 'Times New Roman', serif",
      },
    };

    var vars = THEME_VARS[themeKey] || {};
    var root = document.documentElement;
    // Clear old vars
    var allKeys = new Set();
    Object.values(THEME_VARS).forEach(function(t) { Object.keys(t).forEach(function(k) { allKeys.add(k); }); });
    allKeys.forEach(function(k) { root.style.removeProperty(k); });
    // Apply theme vars
    Object.keys(vars).forEach(function(k) { root.style.setProperty(k, vars[k]); });
    // Apply custom background override — set last so it always wins over the theme
    if (prefs.customBg) {
      root.style.setProperty("--dash-bg", prefs.customBg);
      root.style.setProperty("--page-bg", prefs.customBg);
    }
  } catch(e) {}
})();
