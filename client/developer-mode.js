/* Developer Mode client helper */
(function () {
  const isDeveloperMode = () => localStorage.getItem("developer_mode") === "1";

  function syncDeveloperModeAccess() {
    if (isDeveloperMode()) {
      // The dashboard and full schedule already know how to stay open in
      // demo mode. Developer Mode uses that existing bypass without changing
      // the normal login flow or exposing any secret.
      localStorage.setItem("demo_mode", "1");
      localStorage.setItem("developer_mode_demo_bypass", "1");
    } else if (localStorage.getItem("developer_mode_demo_bypass") === "1") {
      localStorage.removeItem("demo_mode");
      localStorage.removeItem("developer_mode_demo_bypass");
    }
  }

  syncDeveloperModeAccess();
  window.isDeveloperMode = isDeveloperMode;

  window.enableDeveloperMode = function () {
    localStorage.setItem("developer_mode", "1");
    syncDeveloperModeAccess();
  };

  window.disableDeveloperMode = function () {
    localStorage.removeItem("developer_mode");
    syncDeveloperModeAccess();
  };
})();
