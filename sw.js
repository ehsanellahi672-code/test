/* HistoryOsis service worker: caches the app shell so the app opens offline.
   Cache-first. IMPORTANT: change CACHE_VERSION every time you upload any changed file (index.html, styles.css, a script or data.js),
   otherwise phones keep showing the old cached copy. */
const CACHE_VERSION = 'v15-1';
const CACHE = 'historyosis-' + CACHE_VERSION;
const SHELL = [
  './', 'index.html', 'styles.css', 'data.js', 'datacheck.js', 'a11y.js', 'app.js', 'appearance.js', 'backup.js', 'calc.js', 'carry.js', 'caselog.js', 'complaints.js', 'db.js', 'form.js', 'history.js', 'lock.js', 'notes.js', 'pickers.js', 'print.js', 'pwa.js', 'records.js', 'review.js', 'safety.js', 'schema.js', 'search.js', 'sections.js', 'settings.js', 'summary.js', 'templates.js', 'ui.js', 'util.js', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png', 'icon-maskable-512.png', 'apple-touch-icon.png'
];

self.addEventListener('install', (event) => {
  // Do not skip waiting here: the page shows "Update available" and the person decides when to reload.
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(SHELL)));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.indexOf('historyosis-') === 0 && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
  if (event.data && event.data.type === 'GET_VERSION' && event.source) event.source.postMessage({ type: 'VERSION', version: CACHE_VERSION });
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;           // never touch other sites
  event.respondWith(
    caches.match(req, { ignoreSearch: true }).then((hit) => {
      if (hit) return hit;
      return fetch(req).then((res) => {
        if (res && res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); }
        return res;
      }).catch(() => (req.mode === 'navigate' ? caches.match('index.html') : Response.error()));
    })
  );
});
