// Lokalny magazyn plików audio w IndexedDB.
// Pliki pobierane są raz (przy starcie) i odtwarzane z bloba — dzięki temu
// aplikacja działa offline, a przewijanie suwakiem działa (cały plik jest lokalnie).
const STORE = (function () {
  const DB_NAME = "odra-przewodnik";
  const STORE_NAME = "audio";
  const VERSION = 1;

  let dbPromise = null;
  const urlCache = new Map(); // path -> objectURL

  function openDB() {
    if (dbPromise) return dbPromise;
    dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    return dbPromise;
  }

  function withStore(mode, fn) {
    return openDB().then(db => new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, mode);
      const store = tx.objectStore(STORE_NAME);
      const req = fn(store);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    }));
  }

  function get(path) { return withStore("readonly", s => s.get(path)); }
  function put(path, blob) { return withStore("readwrite", s => s.put(blob, path)); }
  function has(path) { return get(path).then(v => v != null); }

  async function getURL(path) {
    if (urlCache.has(path)) return urlCache.get(path);
    const blob = await get(path);
    if (!blob) return null;
    const url = URL.createObjectURL(blob);
    urlCache.set(path, url);
    return url;
  }

  // Pobiera plik (z opcjonalnym postępem) i zapisuje pod kluczem `key`.
  // `url` może różnić się od klucza (np. zakodowane znaki w nazwie).
  async function fetchAndStore(key, url, onProgress) {
    const resp = await fetch(url || key, { cache: "no-store" });
    if (!resp.ok) throw new Error("HTTP " + resp.status);
    let blob;
    if (resp.body && resp.body.getReader) {
      const total = +resp.headers.get("Content-Length") || 0;
      const reader = resp.body.getReader();
      const chunks = [];
      let received = 0;
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
        received += value.length;
        if (onProgress) onProgress(received, total);
      }
      blob = new Blob(chunks, { type: resp.headers.get("Content-Type") || "audio/mpeg" });
    } else {
      blob = await resp.blob();
    }
    await put(key, blob);
    return blob;
  }

  return { get, put, has, getURL, fetchAndStore };
})();
