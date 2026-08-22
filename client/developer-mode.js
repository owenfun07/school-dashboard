/* Developer Mode client helper */
(function () {
  const isDeveloperMode = () => localStorage.getItem("developer_mode") === "1";

  window.isDeveloperMode = isDeveloperMode;

  window.enableDeveloperMode = function () {
    localStorage.setItem("developer_mode", "1");
    localStorage.removeItem("demo_mode");
  };

  window.disableDeveloperMode = function () {
    localStorage.removeItem("developer_mode");
  };
})();
