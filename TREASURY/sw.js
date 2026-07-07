/* 百寶箱 Service Worker — 100% 離線核心 */
const VERSION = 'treasury-v1';
const RUNTIME = 'treasury-runtime-v1';
const SHELL = [
  './',
  './index.html',
  './manifest.json',
  './icon.png'
];

/* 安裝：把 App 外殼全部塞進快取 */
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(VERSION).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())
  );
});

/* 啟用：清掉舊版快取 */
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== VERSION && k !== RUNTIME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

/* 攔截請求：快取優先，字型類走「有網就順手更新」 */
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // Google Fonts：快取優先＋背景更新（第一次連網時存下，之後全離線可用）
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    e.respondWith(
      caches.open(RUNTIME).then(async cache => {
        const cached = await cache.match(e.request);
        const fetched = fetch(e.request).then(res => {
          if (res && res.status === 200) cache.put(e.request, res.clone());
          return res;
        }).catch(() => null);
        return cached || fetched || new Response('', { status: 408 });
      })
    );
    return;
  }

  // 導航請求：離線時一律回到 index.html
  if (e.request.mode === 'navigate') {
    e.respondWith(
      caches.match('./index.html').then(r => r || fetch(e.request))
    );
    return;
  }

  // 其餘：快取優先
  e.respondWith(
    caches.match(e.request).then(r => r || fetch(e.request).catch(() => new Response('', { status: 408 })))
  );
});
