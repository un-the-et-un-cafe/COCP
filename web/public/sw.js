/* COCP directory service worker — stale-while-revalidate, no third-party. */
const CACHE = 'cocp-dir-v1';
const PRECACHE = ['/fr/', '/en/', '/ar/', '/card/', '/exports/listings.json', '/enhance.js', '/manifest.webmanifest', '/favicon.svg'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then(async (cache) => {
      const saveData = self.registration && false;
      const urls = PRECACHE.slice();
      try {
        await cache.addAll(urls);
      } catch (_) {
        for (const u of urls) {
          try { await cache.add(u); } catch (_) {}
        }
      }
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

async function networkFirst(request, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(request, { signal: controller.signal });
    clearTimeout(timer);
    if (response && response.ok) {
      const copy = response.clone();
      caches.open(CACHE).then((c) => c.put(request, copy)).catch(() => {});
    }
    return response;
  } catch (_) {
    clearTimeout(timer);
    const cached = await caches.match(request);
    if (cached) {
      const headers = new Headers(cached.headers);
      headers.set('X-COCP-Offline', '1');
      return new Response(cached.body, { status: cached.status, statusText: cached.statusText, headers });
    }
    throw _;
  }
}

async function staleWhileRevalidate(request) {
  const cached = await caches.match(request);
  const network = fetch(request).then((response) => {
    if (response && response.ok) {
      const copy = response.clone();
      caches.open(CACHE).then((c) => c.put(request, copy)).catch(() => {});
    }
    return response;
  }).catch(() => cached);
  return cached || network;
}

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.origin !== self.location.origin) return;
  if (url.pathname.startsWith('/api/')) return;

  if (event.request.mode === 'navigate' || url.pathname.endsWith('/') || url.pathname.endsWith('.html')) {
    event.respondWith(networkFirst(event.request, 3000));
    return;
  }
  if (PRECACHE.some((p) => url.pathname === p) || url.pathname.startsWith('/exports/')) {
    event.respondWith(staleWhileRevalidate(event.request));
  }
});
