// Service worker for Princess Day. The build fills in the version and file list below:
// every file is cached on first load, so the whole game then works offline.
const CACHE = 'princess-day-%%VERSION%%';
const FILES = %%FILES%%;

self.addEventListener('install', (e) => {
  // cache each file on its own so one failed download never blocks the install;
  // anything missed is cached the first time the game asks for it
  e.waitUntil(
    caches
      .open(CACHE)
      .then((c) => Promise.allSettled(FILES.map((f) => c.add(f))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  // pages: the network first (so updates arrive), the cached copy when offline
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).catch(() => caches.match("./index.html", { ignoreVary: true })));
    return;
  }
  // everything else: the cached copy first
  e.respondWith(
    caches.match(req, { ignoreSearch: true, ignoreVary: true }).then(
      (hit) =>
        hit ||
        fetch(req).then((res) => {
          if (res.ok) caches.open(CACHE).then((c) => c.put(req, res.clone()));
          return res;
        })
    )
  );
});
