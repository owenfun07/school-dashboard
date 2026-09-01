/* ISBN scanner cleanup + visual scan animation. Loaded only on Source Citation. */
(function () {
  const style = document.createElement("style");
  style.textContent = `
    .isbn-scan-frame { overflow: hidden; }
    .isbn-scan-line {
      position: absolute;
      left: 5%;
      right: 5%;
      top: 4%;
      height: 2px;
      background: rgba(235, 55, 55, 0.95);
      box-shadow: 0 0 8px rgba(235, 55, 55, 0.8), 0 0 16px rgba(235, 55, 55, 0.35);
      animation: isbnScanLine 2s ease-in-out infinite alternate;
      pointer-events: none;
    }
    @keyframes isbnScanLine {
      from { top: 4%; }
      to { top: 96%; }
    }
  `;
  document.head.appendChild(style);

  function stopCameraTracks() {
    const video = document.getElementById("isbnScannerVideo");
    if (!video) return;
    const stream = video.srcObject;
    if (stream && typeof stream.getTracks === "function") {
      stream.getTracks().forEach(track => track.stop());
    }
    video.pause?.();
    video.srcObject = null;
  }

  function enhanceScanner(overlay) {
    if (!overlay || overlay.dataset.scannerEnhanced === "1") return;
    overlay.dataset.scannerEnhanced = "1";

    const frame = overlay.querySelector(".isbn-scan-frame");
    if (frame && !frame.querySelector(".isbn-scan-line")) {
      const line = document.createElement("div");
      line.className = "isbn-scan-line";
      line.setAttribute("aria-hidden", "true");
      frame.appendChild(line);
    }

    // The existing scanner closes its overlay, but its ZXing reader can leave
    // a camera track attached. Watch the overlay and explicitly stop every
    // video track whenever the scanner is closed or hidden.
    const observer = new MutationObserver(() => {
      if (!overlay.classList.contains("open")) stopCameraTracks();
    });
    observer.observe(overlay, { attributes: true, attributeFilter: ["class"] });

    // Also stop the camera if the scanner is removed from the DOM.
    const removalObserver = new MutationObserver(() => {
      if (!document.body.contains(overlay)) {
        stopCameraTracks();
        observer.disconnect();
        removalObserver.disconnect();
      }
    });
    removalObserver.observe(document.body, { childList: true, subtree: true });
  }

  function scanExistingAndWatch() {
    document.querySelectorAll(".isbn-scanner-overlay").forEach(enhanceScanner);
    const observer = new MutationObserver(mutations => {
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (node.nodeType !== 1) continue;
          if (node.matches?.(".isbn-scanner-overlay")) enhanceScanner(node);
          node.querySelectorAll?.(".isbn-scanner-overlay").forEach(enhanceScanner);
        }
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", scanExistingAndWatch, { once: true });
  } else {
    scanExistingAndWatch();
  }
})();
