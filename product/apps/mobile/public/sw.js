/* OTTIMO Staff service worker (ADR-005, SR-PWA-02).
 * Caches ONLY the static app shell (index.html + hashed /assets/* + manifest) so the app opens offline.
 * API responses are never cached here: the offline copy of tasks / room status / checklist lives in
 * IndexedDB with the SR-PWA-01 allow-list (src/data/cache.ts). Anything under /v1/ goes to the network.
 * The build id placeholder below is replaced at build time (vite.config.ts) – a deploy gets a new cache,
 * old ones are dropped.
 */
const CACHE = 'ottimo-staff-__BUILD_ID__';
const SHELL = ['/', '/manifest.webmanifest'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((c) => c.addAll(SHELL))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => k.startsWith('ottimo-staff-') && k !== CACHE)
            .map((k) => caches.delete(k)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

/** Static files only: same origin, GET, not the API, not the MSW dev worker. */
function isShellRequest(url, request) {
  if (request.method !== 'GET' || url.origin !== self.location.origin) return false;
  if (url.pathname.startsWith('/v1/') || url.pathname.startsWith('/health')) return false;
  return (
    request.mode === 'navigate' ||
    url.pathname.startsWith('/assets/') ||
    url.pathname === '/manifest.webmanifest'
  );
}

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (!isShellRequest(url, event.request)) return; // network as usual (API, cross-origin)

  if (event.request.mode === 'navigate') {
    // Network first so a deploy shows up at once; offline → the cached shell.
    event.respondWith(
      fetch(event.request)
        .then((res) => {
          if (res.ok && !/no-store/i.test(res.headers.get('cache-control') || '')) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put('/', copy));
          }
          return res;
        })
        .catch(() => caches.match('/')),
    );
    return;
  }

  // Hashed assets never change: cache first.
  event.respondWith(
    caches.match(event.request).then(
      (hit) =>
        hit ||
        fetch(event.request).then((res) => {
          if (res.ok && !/no-store/i.test(res.headers.get('cache-control') || '')) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(event.request, copy));
          }
          return res;
        }),
    ),
  );
});

/* Background Sync (Chrome Android): the queue lives in the page (it needs the CSRF token kept in memory),
 * so the worker only wakes an open page to send. Safari has no Background Sync – the page also sends on
 * `online` and when the app opens (ADR-005 mục 3). */
self.addEventListener('sync', (event) => {
  if (event.tag !== 'ottimo-queue') return;
  event.waitUntil(
    self.clients
      .matchAll({ type: 'window' })
      .then((list) => list.forEach((c) => c.postMessage({ type: 'ottimo-queue-flush' }))),
  );
});
