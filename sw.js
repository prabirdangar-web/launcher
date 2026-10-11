/* TFHS Portal service worker.
   Only caches the portal shell. Every other request (other tools on this
   domain, Firebase, Google Apps Script, etc.) passes straight through. */
const CACHE = "tfhs-portal-v2";
const SHELL = ["./", "./index.html", "./manifest.json", "./icon-192.png", "./icon-512.png", "./apple-touch-icon.png"];
const shellUrls = SHELL.map(p => new URL(p, self.location).href);

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET" || !shellUrls.includes(req.url)) return; // not ours: let browser handle
  // network first (so edits to TOOLS show up), cache as offline fallback
  e.respondWith(
    fetch(req).then(res => {
      const copy = res.clone();
      caches.open(CACHE).then(c => c.put(req, copy));
      return res;
    }).catch(() => caches.match(req).then(r => r || caches.match("./index.html")))
  );
});
