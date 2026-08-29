/**
 * sidebar.js
 * Single source of truth for navigation.
 *
 * NAV structure supports three item types:
 *   { type: "link",     label, href, size, requiresAuth }
 *   { type: "category", label, href, items }
 *
 * requiresAuth: true  — blocked in demo mode, shows a login prompt instead
 *
 * To add a page: edit NAV_LINKS below. Nothing else needs to change.
 */

const NAV = [
  {
    type:        "link",
    label:       "Dashboard",
    href:        "/dashboard",
    size:        "large",
    requiresAuth: true,
  },
  {
    type:        "link",
    label:       "Full Schedule",
    href:        "/full-schedule",
    size:        "normal",
    requiresAuth: true,
  },
  {
    type:  "category",
    label: "Organisation",
    href:  "/organisation",
    items: [
      { label: "Assignment Tracker", href: "/assignment-tracker" },
      { label: "Grade Calculator",   href: "/grade-calculator"   },
      { label: "Schedule Builder",   href: "/schedule-builder"   },
    ],
  },
  {
    type:  "category",
    label: "Tools",
    href:  "/tools",
    items: [
      { label: "Source Citation",    href: "/source-citation.html" },
      { label: "Calculators",        href: "/calculators"        },
    ],
  },
];

(function () {
  const currentPath = window.location.pathname;
  const isDemo      = localStorage.getItem("demo_mode") === "1";
  const isDeveloper = localStorage.getItem("developer_mode") === "1";
  const hasAuth     = !!localStorage.getItem("access_token");

  // Developer Mode intentionally bypasses the normal navigation restrictions.
  // The flag is only set after the server verifies DEV_API_CODE.
  const bypassAuth = isDeveloper || hasAuth;

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

  // ── Mode banner ─────────────────────────────────────────────────────
  if (isDeveloper && !hasAuth) {
    const banner = document.createElement("div");
    banner.className = "sidebar-demo-banner";
    banner.innerHTML = `
      <span>🛠️ You're in developer mode.</span>
      <a href="/" class="sidebar-demo-login-link">Exit developer mode →</a>
    `;
    banner.querySelector("a").addEventListener("click", function (e) {
      e.preventDefault();
      localStorage.removeItem("developer_mode");
      window.location.href = "/";
    });
    aside.appendChild(banner);
  } else if (isDemo && !hasAuth && !isDeveloper) {
    const banner = document.createElement("div");
    banner.className = "sidebar-demo-banner";
    banner.innerHTML = `
      <span>👋 You're in demo mode.</span>
      <a href="/" class="sidebar-demo-login-link">Log in for full access →</a>
    `;
    aside.appendChild(banner);
  }

  // ── Auth-blocked message (hidden by default, shown on click) ────────
  const authMsg = document.createElement("div");
  authMsg.className = "sidebar-auth-msg hidden";
  authMsg.innerHTML = `
    <p>This page requires a Google account to load your data.</p>
    <a href="/" class="sidebar-auth-login-link">Log in here →</a>
  `;

  // ── 3. Build nav items ──────────────────────────────────────────────
  NAV.forEach(function (item) {
    if (item.type === "link") {
      const blocked = isDemo && !bypassAuth && item.requiresAuth;

      const a = document.createElement("a");
      a.textContent = item.label;
      a.className = "sidebar-link" + (item.size === "large" ? " sidebar-link-large" : "");
      if (blocked) a.classList.add("sidebar-link-locked");

      if (!blocked) {
        a.href = item.href;
        if (currentPath === item.href) a.classList.add("sidebar-active");
      } else {
        a.href = "#";
        a.setAttribute("aria-disabled", "true");
        a.addEventListener("click", function (e) {
          e.preventDefault();
          const showing = !authMsg.classList.contains("hidden");
          authMsg.classList.toggle("hidden", showing);
          if (!showing) {
            if (authMsg.previousElementSibling !== a) {
              a.insertAdjacentElement("afterend", authMsg);
            }
          }
        });
      }

      aside.appendChild(a);

    } else if (item.type === "category") {
      const row = document.createElement("div");
      row.className = "sidebar-category-row";

      const labelLink = document.createElement("a");
      labelLink.href = item.href;
      labelLink.textContent = item.label;
      labelLink.className = "sidebar-category-label";

      const childActive = item.items.some(function (c) { return currentPath === c.href; });
      if (currentPath === item.href || childActive) labelLink.classList.add("sidebar-active");

      const chevron = document.createElement("button");
      chevron.className = "sidebar-chevron";
      chevron.setAttribute("aria-label", "Toggle " + item.label);
      chevron.setAttribute("aria-expanded", "false");
      chevron.innerHTML = "&#9656;";

      row.appendChild(labelLink);
      row.appendChild(chevron);
      aside.appendChild(row);

      const dropdown = document.createElement("div");
      dropdown.className = "sidebar-dropdown";

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

      chevron.addEventListener("click", function () {
        const isOpen = dropdown.classList.toggle("open");
        chevron.classList.toggle("open", isOpen);
        chevron.setAttribute("aria-expanded", String(isOpen));
      });
    }
  });

  aside.appendChild(authMsg);

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
    authMsg.classList.add("hidden");
  }

  toggleBtn.addEventListener("click", openMenu);
  closeBtn.addEventListener("click", closeMenu);
  overlay.addEventListener("click", closeMenu);
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") closeMenu();
  });
})();
