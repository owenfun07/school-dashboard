// Developer mode unlock helper.
// The actual secret is NEVER placed in client-side code. Verification is
// performed by the server using the DEV_API_CODE environment variable.
(function () {
  const button = document.getElementById("dev-mode-btn");
  if (!button) return;

  button.addEventListener("click", async () => {
    const code = prompt("Enter the developer access code:");
    if (code === null) return;

    try {
      const response = await fetch("/api/dev-mode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.trim() })
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        alert(data.error || "Incorrect developer code.");
        return;
      }

      sessionStorage.setItem("developer_mode", "1");
      window.location.reload();
    } catch (error) {
      console.error("Developer mode verification failed:", error);
      alert("Could not verify developer mode. Please try again.");
    }
  });
})();
