/**
 * sidebar.js
 * Single source of truth for navigation.
 *
 * NAV structure supports three item types:
 *   { type: "link",     label, href, size }   — plain link; size: "large"|"normal"
 *   { type: "category", label, href, items }  — expandable group; label links to href,
 *                                               chevron toggles the dropdown
 *
 * To add a page: add an entry here. Nothing else needs to change.
 */

const NAV = [
  {
    type:  "link",
    label: "Dashboard",
    href:  "/dashboard",
    size:  "large",
  },
  {
    type:  "link",
    label: "Full Schedule",
    href:  "/full-schedule",
    size:  "normal",
  },
  {
    type:  "category",
    label: "Tools",
    href:  "/tools",
    items: [
      { label: "Source Citation", href: "/placeholder-page-1" },
      { label: "Placeholder Page 2", href: "/placeholder-page-2" },
    ],
  },
];

(function () {
  const currentPath = window.location.pathname;

  // ── 1. Hamburger button ─────────────────────────────────────────────
  const toggleBtn = document.createElement("button");
  toggleBtn.id = "menu-toggle";
  toggleBtn.className = "menu-toggle";
  toggleBtn.setAttribute("aria-label", "Open menu");
  toggleBtn.textContent = "☰";
  document.body.prepend(toggleBtn);

  // ── 2. Sidebar <aside> ──────────────────────────────────────────────
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

  // ── 3. Build nav items ──────────────────────────────────────────────
  NAV.forEach(function (item) {
    if (item.type === "link") {
      const a = document.createElement("a");
      a.href = item.href;
      a.textContent = item.label;
      a.className = "sidebar-link" + (item.size === "large" ? " sidebar-link-large" : "");
      if (currentPath === item.href) a.classList.add("sidebar-active");
      aside.appendChild(a);

    } else if (item.type === "category") {

      // Wrapper row: [label link] [chevron toggle]
      const row = document.createElement("div");
      row.className = "sidebar-category-row";

      const labelLink = document.createElement("a");
      labelLink.href = item.href;
      labelLink.textContent = item.label;
      labelLink.className = "sidebar-category-label";
      // Mark active if we're on the category page OR any child page
      const childActive = item.items.some(function (c) { return currentPath === c.href; });
      if (currentPath === item.href || childActive) {
        labelLink.classList.add("sidebar-active");
      }

      const chevron = document.createElement("button");
      chevron.className = "sidebar-chevron";
      chevron.setAttribute("aria-label", "Toggle " + item.label);
      chevron.setAttribute("aria-expanded", "false");
      chevron.innerHTML = "&#9656;"; // ▶ right-pointing triangle

      row.appendChild(labelLink);
      row.appendChild(chevron);
      aside.appendChild(row);

      // Dropdown list
      const dropdown = document.createElement("div");
      dropdown.className = "sidebar-dropdown";
      // Auto-expand if a child is the current page
      if (childActive) {
        dropdown.classList.add("open");
        chevron.classList.add("open");
        chevron.setAttribute("aria-expanded", "true");
      }

      item.items.forEach(function (child) {
        const a = document.createElement("a");
        a.href = child.href;
        a.textContent = child.label;
        a.className = "sidebar-dropdown-link";
        if (currentPath === child.href) a.classList.add("sidebar-active");
        dropdown.appendChild(a);
      });

      aside.appendChild(dropdown);

      // Toggle on chevron click
      chevron.addEventListener("click", function () {
        const isOpen = dropdown.classList.toggle("open");
        chevron.classList.toggle("open", isOpen);
        chevron.setAttribute("aria-expanded", String(isOpen));
      });
    }
  });

  document.body.insertBefore(aside, toggleBtn.nextSibling);

  // ── 4. Overlay ──────────────────────────────────────────────────────
  const overlay = document.createElement("div");
  overlay.id = "menu-overlay";
  overlay.className = "menu-overlay";
  document.body.insertBefore(overlay, aside.nextSibling);

  // ── 5. Open / close ─────────────────────────────────────────────────
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
