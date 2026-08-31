/* Book citation UI enhancements. Loaded by sidebar.js only on /source-citation. */
(function () {
  function boot() {
    const bookTools = document.getElementById("bookTools");
    const bookResults = document.getElementById("bookResults");
    const bookSearchBtn = document.getElementById("bookSearchBtn");
    if (!bookTools || !bookResults || !bookSearchBtn) return;

    const style = document.createElement("style");
    style.textContent = `
      .book-search-help { margin: 0 0 10px; color: var(--text-secondary); font-size: 13px; line-height: 1.5; }
      .book-search-option { display: flex; align-items: center; gap: 8px; min-width: 0; }
      .book-search-option input { min-width: 0; flex: 1; }
      .book-search-or { flex: 0 0 auto; color: var(--text-muted); font-size: 12px; font-weight: 700; text-align: center; padding: 0 2px; }
      .book-isbn-row { display: flex; gap: 8px; flex: 1; min-width: 0; }
      .book-isbn-row input { flex: 1; min-width: 0; }
      #scanIsbnBtn { width: 42px; height: 42px; padding: 0; flex: 0 0 42px; display: inline-flex; align-items: center; justify-content: center; }
      #scanIsbnBtn svg { width: 20px; height: 20px; }
      .book-results { max-height: 285px; overflow-y: auto; padding-right: 4px; }
      .book-results.hidden-results { display: none; }
      .book-selected-note { margin-top: 10px; padding: 9px 12px; border-radius: 8px; background: var(--dash-bg); border: 1px solid var(--card-border); color: var(--text-secondary); font-size: 13px; }
      #bookTools .book-search-controls { display: flex; gap: 10px; align-items: stretch; flex-wrap: wrap; }
      #bookTools .book-search-option { flex: 1 1 300px; }
      #bookTools .book-search-action { flex: 0 0 auto; }
      #bookTools .book-search-action button { height: 42px; }
      #url.form-hidden-for-book, #accessDate.form-hidden-for-book { display: none !important; }
      .isbn-scanner-overlay { position: fixed; inset: 0; z-index: 100000; background: rgba(0,0,0,.72); display: none; align-items: center; justify-content: center; padding: 18px; }
      .isbn-scanner-overlay.open { display: flex; }
      .isbn-scanner-card { width: min(560px, 100%); background: var(--card-bg); color: var(--text-primary); border: 1px solid var(--card-border); border-radius: 18px; padding: 18px; box-shadow: 0 24px 70px rgba(0,0,0,.35); }
      .isbn-scanner-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 12px; }
      .isbn-scanner-head h3 { margin: 0; }
      .isbn-scanner-close { border: 0; background: transparent; color: var(--text-secondary); font-size: 25px; cursor: pointer; }
      .isbn-scanner-video-wrap { position: relative; aspect-ratio: 16 / 10; background: #050505; border-radius: 12px; overflow: hidden; }
      #isbnScannerVideo { width: 100%; height: 100%; object-fit: cover; display: block; }
      .isbn-scan-frame { position: absolute; left: 12%; right: 12%; top: 34%; height: 32%; border: 2px solid rgba(255,255,255,.9); border-radius: 8px; box-shadow: 0 0 0 999px rgba(0,0,0,.18); pointer-events: none; }
      .isbn-scanner-status { margin-top: 10px; font-size: 13px; color: var(--text-secondary); min-height: 20px; }
      .isbn-scanner-actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 12px; }
      @media (max-width: 700px) { #bookTools .book-search-controls { flex-direction: column; } #bookTools .book-search-action button { width: 100%; } .book-search-option { flex-basis: auto !important; } }
    `;
    document.head.appendChild(style);

    // Replace the original three-field book search with two clearly separated choices.
    const controls = bookTools.querySelector(".top-tools");
    if (controls) {
      controls.className = "book-search-controls";
      controls.innerHTML = `
        <div class="book-search-option">
          <input id="bookTextQuery" placeholder="Title or author">
        </div>
        <div class="book-search-or">OR</div>
        <div class="book-search-option">
          <div class="book-isbn-row">
            <input id="bookIsbnQuery" placeholder="ISBN-10 or ISBN-13">
            <button id="scanIsbnBtn" type="button" class="tab-btn" title="Scan ISBN barcode" aria-label="Scan ISBN barcode">
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 7V5a1 1 0 0 1 1-1h2M17 4h2a1 1 0 0 1 1 1v2M20 17v2a1 1 0 0 1-1 1h-2M7 20H5a1 1 0 0 1-1-1v-2" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><path d="M7 9v6M9 9v6M11 9v6M14 9v6M16 9v6M18 9v6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
            </button>
          </div>
        </div>
        <div class="book-search-action"><button id="bookSearchBtn" class="primary-btn" type="button">Search Books</button></div>
      `;
    }

    const textInput = document.getElementById("bookTextQuery");
    const isbnInput = document.getElementById("bookIsbnQuery");
    const searchButton = document.getElementById("bookSearchBtn");
    const scanButton = document.getElementById("scanIsbnBtn");
    if (!textInput || !isbnInput || !searchButton || !scanButton) return;

    // Books do not use the webpage URL/access-date fields.
    ["url", "accessDate"].forEach(id => document.getElementById(id)?.classList.add("form-hidden-for-book"));

    // Reuse the existing server endpoint but make the input semantics unambiguous.
    searchButton.onclick = async function () {
      const q = textInput.value.trim();
      const isbn = isbnInput.value.replace(/[\s-]/g, "").trim();
      if (!q && !isbn) {
        if (typeof showNotice === "function") showNotice("Enter a book title or author, or enter an ISBN. You only need one.", "warning", false);
        return;
      }
      if (q && isbn && typeof devLog === "function") {
        devLog("Book search: both fields supplied; using ISBN because it identifies a specific edition.", "info");
      }

      const loading = document.getElementById("bookLoading");
      const selectedNote = document.getElementById("book-selected-note");
      selectedNote?.remove();
      loading?.classList.remove("hidden");
      bookResults.classList.remove("hidden-results");
      bookResults.innerHTML = "";
      if (typeof hideNotice === "function") hideNotice();
      if (typeof devLog === "function") devLog(`Book search started — ${isbn ? `ISBN ${isbn}` : `query: ${q}`}`, "accent");

      try {
        const params = new URLSearchParams({ q: isbn ? "" : q, author: "", isbn });
        const response = await fetch(`/api/citation/books?${params.toString()}`);
        const payload = await response.json().catch(() => ({}));
        if (!response.ok || !payload.success) throw new Error(payload.error || `Book lookup failed (HTTP ${response.status}).`);

        const data = payload.data || {};
        if (typeof devLog === "function") devLog("Book lookup diagnostics", "accent", data.diagnostics || []);
        if (!data.results?.length) {
          if (typeof showNotice === "function") showNotice("No book result was found. Try the title/author or a different ISBN.", "warning", false);
          return;
        }

        bookResults.innerHTML = data.results.map((book, i) => {
          const meta = [book.author, book.publisher, book.publishDate, book.isbn13 || book.isbn10 ? `ISBN ${book.isbn13 || book.isbn10}` : ""].filter(Boolean).join(" • ");
          return `<div class="book-result">
            <img class="book-result-cover" src="${escapeHtml(book.cover || "")}" alt="" onerror="this.style.visibility='hidden'">
            <div class="book-result-info">
              <div class="book-result-title">${escapeHtml(book.title || "Untitled")}</div>
              <div class="book-result-meta">${escapeHtml(meta)}</div>
              <button type="button" class="add-btn" data-book-index="${i}">Use this book</button>
            </div>
          </div>`;
        }).join("");

        bookResults.querySelectorAll("[data-book-index]").forEach(button => {
          button.onclick = function () {
            const book = data.results[Number(button.dataset.bookIndex)];
            if (typeof fillBookResult === "function") fillBookResult(book);
            bookResults.classList.add("hidden-results");
            let note = document.getElementById("book-selected-note");
            if (!note) {
              note = document.createElement("div");
              note.id = "book-selected-note";
              note.className = "book-selected-note";
              bookResults.parentElement.appendChild(note);
            }
            note.textContent = `Selected: ${book.title || "Untitled"}${book.author ? ` — ${book.author}` : ""}. You can search again to choose a different edition.`;
            if (typeof devLog === "function") devLog("Book selected; search results hidden", "good", book);
          };
        });

        if (typeof showNotice === "function") showNotice(`✓ Found ${data.results.length} book result${data.results.length === 1 ? "" : "s"}. Select the correct edition.`, "success", false);
      } catch (err) {
        if (typeof devLog === "function") devLog("Book lookup failed", "bad", { error: err.message });
        if (typeof showNotice === "function") showNotice("⚠️ Could not search the book databases: " + err.message, "warning", false);
      } finally {
        loading?.classList.add("hidden");
      }
    };

    textInput.addEventListener("keydown", e => { if (e.key === "Enter") searchButton.click(); });
    isbnInput.addEventListener("keydown", e => { if (e.key === "Enter") searchButton.click(); });

    // Camera ISBN scanner. EAN-13 is the barcode format used by ISBN-13 books.
    let scannerOverlay = null;
    let scannerStream = null;
    let scannerReader = null;
    let scannerActive = false;

    function createScanner() {
      if (scannerOverlay) return scannerOverlay;
      scannerOverlay = document.createElement("div");
      scannerOverlay.className = "isbn-scanner-overlay";
      scannerOverlay.innerHTML = `
        <div class="isbn-scanner-card" role="dialog" aria-modal="true" aria-label="Scan ISBN">
          <div class="isbn-scanner-head"><h3>Scan ISBN</h3><button class="isbn-scanner-close" type="button" aria-label="Close scanner">×</button></div>
          <div class="isbn-scanner-video-wrap"><video id="isbnScannerVideo" playsinline muted></video><div class="isbn-scan-frame"></div></div>
          <div class="isbn-scanner-status" id="isbnScannerStatus">Point the camera at the ISBN barcode on the back of the book.</div>
          <div class="isbn-scanner-actions"><button id="isbnScannerCancel" type="button" class="tab-btn">Cancel</button></div>
        </div>`;
      document.body.appendChild(scannerOverlay);
      scannerOverlay.querySelector(".isbn-scanner-close").onclick = stopScanner;
      scannerOverlay.querySelector("#isbnScannerCancel").onclick = stopScanner;
      return scannerOverlay;
    }

    function stopScanner() {
      scannerActive = false;
      if (scannerReader?.reset) scannerReader.reset();
      scannerReader = null;
      if (scannerStream) scannerStream.getTracks().forEach(track => track.stop());
      scannerStream = null;
      scannerOverlay?.classList.remove("open");
    }

    async function loadZXing() {
      if (window.ZXingBrowser) return window.ZXingBrowser;
      await new Promise((resolve, reject) => {
        const script = document.createElement("script");
        script.src = "https://cdn.jsdelivr.net/npm/@zxing/browser@0.1.5/umd/index.min.js";
        script.onload = resolve;
        script.onerror = () => reject(new Error("The barcode scanner library could not be loaded."));
        document.head.appendChild(script);
      });
      return window.ZXingBrowser;
    }

    async function startScanner() {
      createScanner().classList.add("open");
      const status = document.getElementById("isbnScannerStatus");
      status.textContent = "Starting camera…";
      try {
        if (!navigator.mediaDevices?.getUserMedia) throw new Error("Camera access is not available in this browser.");
        const ZX = await loadZXing();
        scannerActive = true;
        scannerReader = new ZX.BrowserMultiFormatReader();
        status.textContent = "Point the camera at the ISBN barcode on the back of the book.";
        const video = document.getElementById("isbnScannerVideo");
        await scannerReader.decodeFromVideoDevice(undefined, video, (result) => {
          if (!scannerActive || !result) return;
          const raw = result.getText().replace(/\s/g, "");
          if (!/^(97[89])\d{10}$/.test(raw) && !/^\d{9}[\dXx]$/.test(raw)) return;
          isbnInput.value = raw.toUpperCase();
          if (typeof devLog === "function") devLog("ISBN barcode scanned", "good", { isbn: raw.toUpperCase(), format: result.getBarcodeFormat?.() || null });
          stopScanner();
          showNotice(`✓ ISBN scanned: ${raw.toUpperCase()}. Click Search Books to look it up.`, "success", false);
        });
      } catch (err) {
        status.textContent = err.message || "Could not start the camera.";
        if (typeof devLog === "function") devLog("ISBN scanner failed", "bad", { error: err.message });
      }
    }

    scanButton.onclick = startScanner;

    // Reapply field visibility whenever the source type changes.
    const websiteButton = document.getElementById("websiteModeBtn");
    const bookButton = document.getElementById("bookModeBtn");
    function syncBookFields() {
      const isBook = bookButton?.classList.contains("active");
      ["url", "accessDate"].forEach(id => document.getElementById(id)?.classList.toggle("form-hidden-for-book", isBook));
      if (!isBook) bookResults.classList.remove("hidden-results");
    }
    websiteButton?.addEventListener("click", syncBookFields);
    bookButton?.addEventListener("click", syncBookFields);
    syncBookFields();

    // Keep the existing clear-form behavior, while also clearing our new controls.
    document.getElementById("clearForm")?.addEventListener("click", () => {
      textInput.value = "";
      isbnInput.value = "";
      bookResults.innerHTML = "";
      bookResults.classList.remove("hidden-results");
      document.getElementById("book-selected-note")?.remove();
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot, { once: true });
  else boot();
})();
