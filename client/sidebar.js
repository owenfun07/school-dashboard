/**
 * sidebar.js
 * Defines all nav links in one place and injects the sidebar into every page.
 * To add or rename a nav item, edit NAV_LINKS below — that's it.
 * Load this script in <body> on every page (before page-specific scripts).
 */

const NAV_LINKS = [
  { label: "Dashboard",          href: "/dashboard" },
  { label: "Full Schedule",      href: "/full-schedule" },
  { label: "Source Citation",    href: "/placeholder-page-1" },
  { label: "Placeholder Page 2", href: "/placeholder-page-2" },
];

(function () {
  // ── 1. Hamburger toggle button ──────────────────────────────────────
  const toggleBtn = document.createElement("button");
  toggleBtn.id = "menu-toggle";
  toggleBtn.className = "menu-toggle";
  toggleBtn.setAttribute("aria-label", "Open menu");
  toggleBtn.textContent = "☰";
  document.body.prepend(toggleBtn);

  // ── 2. Sidebar <aside> ───────────────────────────────────────────────
  const aside = document.createElement("aside");
  aside.id = "side-menu";
  aside.className = "side-menu";

  const closeBtn = document.createElement("button");
  closeBtn.id = "menu-close";
  closeBtn.className = "menu-close";
  closeBtn.setAttribute("aria-label", "Close menu");
  closeBtn.textContent = "×";
  aside.appendChild(closeBtn);

  const heading = document.createElement("h3");
  heading.textContent = "Menu";
  aside.appendChild(heading);

  // Highlight the current page
  const currentPath = window.location.pathname;

  NAV_LINKS.forEach(function (item) {
    const a = document.createElement("a");
    a.href = item.href;
    a.textContent = item.label;
    if (currentPath === item.href || currentPath.startsWith(item.href + "?")) {
      a.className = "sidebar-active";
    }
    aside.appendChild(a);
  });

  document.body.insertBefore(aside, toggleBtn.nextSibling);

  // ── 3. Overlay ───────────────────────────────────────────────────────
  const overlay = document.createElement("div");
  overlay.id = "menu-overlay";
  overlay.className = "menu-overlay";
  document.body.insertBefore(overlay, aside.nextSibling);

  // ── 4. Open / close logic ────────────────────────────────────────────
  function openMenu() {
    aside.classList.add("open");
    overlay.classList.add("open");
  }

  function closeMenu() {
    aside.classList.remove("open");
    overlay.classList.remove("open");
  }

  toggleBtn.addEventListener("click", openMenu);
  closeBtn.addEventListener("click", closeMenu);
  overlay.addEventListener("click", closeMenu);

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") closeMenu();
  });
})();
