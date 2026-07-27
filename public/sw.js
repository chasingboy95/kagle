const CACHE_NAME = 'kagle-pwa-v4';
const APP_SHELL = [
  '/kagle/',
  '/kagle/index.html',
  '/kagle/manifest.webmanifest',
  '/kagle/favicon.svg',
  '/kagle/icon-192.png',
  '/kagle/icon-512.png',
  '/kagle/apple-touch-icon.png',
];

const VOICE_FILES = [
  'ready.mp3',
  'contraction-start.mp3',
  'contraction-sustain.mp3',
  'release-start.mp3',
  'complete.mp3',
  'paused.mp3',
  'resumed.mp3',
];

const VOICE_ASSETS = ['zh-CN', 'en-US'].flatMap((language) =>
  VOICE_FILES.map((filename) => `/kagle/audio/${language}/${filename}`),
);

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      await cache.addAll(APP_SHELL);
      await Promise.allSettled(
        VOICE_ASSETS.map((asset) => cache.add(asset)),
      );
    }).then(() => self.skipWaiting()),
  );
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key)),
      ))
      .then(() => self.clients.claim())
      .then(() => {
        return self.clients.matchAll().then((clients) => {
          clients.forEach((client) => {
            client.postMessage({ type: 'SW_UPDATED' });
          });
        });
      }),
  );
});

async function cacheResponse(request, response) {
  if (!response || !response.ok || response.type === 'opaque') return;
  const copy = response.clone();
  const cache = await caches.open(CACHE_NAME);
  await cache.put(request, copy);
}

async function networkFirst(request) {
  try {
    const response = await fetch(request, { cache: 'no-store' });
    await cacheResponse(request, response);
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;
    return caches.match('/kagle/index.html');
  }
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  const response = await fetch(request);
  await cacheResponse(request, response);
  return response;
}

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  if (event.request.mode === 'navigate') {
    event.respondWith(networkFirst(event.request));
    return;
  }

  if (url.pathname.includes('/assets/') || url.pathname.includes('/audio/')) {
    event.respondWith(cacheFirst(event.request));
    return;
  }

  event.respondWith(networkFirst(event.request));
});
