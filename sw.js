// v2: bumping this forces every existing visitor's old cache to be
// wiped once (see 'activate' below) - this specifically fixes a real
// bug where index.html was stuck cache-first and never picked up
// deployed fixes, even though the JSON data files were always fresh.
const CACHE_NAME = 'flightchance-v2';
const SHELL_FILES = ['./', './index.html', './manifest.json'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_FILES))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Network-first for EVERYTHING now, not just JSON data files - always
// try to get the latest deployed version first; only fall back to the
// cached copy if the network request fails (e.g. genuinely offline).
// This is what actually prevents this staleness bug from recurring on
// every future update - bumping CACHE_NAME above only fixes it once,
// for existing visitors right now.
self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request)
      .then((res) => {
        const clone = res.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        return res;
      })
      .catch(() => caches.match(event.request))
  );
});
