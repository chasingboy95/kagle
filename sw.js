// CACHE_NAME 与 PRECACHE_ASSETS 在构建期由 vite 插件注入：
// - CACHE_NAME 以预缓存资源内容生成版本摘要，资源哈希变化时随之变化，
//   旧缓存在 activate 阶段被安全清理。
// - PRECACHE_ASSETS 为本次构建生成的哈希 JS/CSS/SVG，无需手工维护文件名。
const CACHE_NAME = 'kagle-pwa-v4-e8682dac';

const APP_SHELL = [
  '/kagle/',
  '/kagle/index.html',
  '/kagle/manifest.webmanifest',
  '/kagle/favicon.svg',
  '/kagle/icon-192.png',
  '/kagle/icon-512.png',
  '/kagle/apple-touch-icon.png',
];

// 构建期注入的哈希资源。
const PRECACHE_ASSETS = ["/kagle/assets/ConfigDrawer-CKEErqbh.js","/kagle/assets/MoreMenu-Bhc9xqz6.js","/kagle/assets/Onboarding-BRPtqaBc.js","/kagle/assets/ProgressiveSuggestion-CEYnm6Ad.js","/kagle/assets/SessionRecovery-vcWRz582.js","/kagle/assets/TrainingFeedback-BL8G73kr.js","/kagle/assets/TrainingHistory-DTqqW4sv.js","/kagle/assets/VoiceDrawer-DJ63UOMA.js","/kagle/assets/fascia-DCFoetpq.svg","/kagle/assets/fibers-CuhFGZmi.svg","/kagle/assets/index-9b6I10Zk.js","/kagle/assets/index-BEGre4Vv.css","/kagle/assets/jsx-runtime-CZcjcDnw.js","/kagle/assets/react-9A9D8-nk.js","/kagle/assets/timingWorker-DU-bSc-e.js","/kagle/assets/useModalFocus-CaFsfHZc.js"];

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

// Cache on install but do NOT auto-activate. The new worker stays in the
// "waiting" state until the page explicitly requests activation (SKIP_WAITING)
// so an in-progress training session is never interrupted by a reload.
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      // 预缓存应用外壳 + 构建期哈希资源，保证全新浏览器首次离线安装
      // 也能进入核心训练界面，不依赖运行时按需缓存。
      await cache.addAll([...APP_SHELL, ...PRECACHE_ASSETS]);
      await Promise.allSettled(
        VOICE_ASSETS.map((asset) => cache.add(asset)),
      );
    }),
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
