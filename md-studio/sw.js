const CACHE = 'mdstudio-v1';
const ASSETS = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './manifest.json',
  'https://cdn.jsdelivr.net/npm/marked@9/marked.min.js',
  'https://cdn.jsdelivr.net/npm/highlight.js@11/lib/core.min.js',
  'https://cdn.jsdelivr.net/npm/highlight.js@11/lib/languages/javascript.min.js',
  'https://cdn.jsdelivr.net/npm/highlight.js@11/lib/languages/typescript.min.js',
  'https://cdn.jsdelivr.net/npm/highlight.js@11/lib/languages/python.min.js',
  'https://cdn.jsdelivr.net/npm/highlight.js@11/lib/languages/bash.min.js',
  'https://cdn.jsdelivr.net/npm/highlight.js@11/lib/languages/css.min.js',
  'https://cdn.jsdelivr.net/npm/highlight.js@11/lib/languages/xml.min.js',
  'https://cdn.jsdelivr.net/npm/highlight.js@11/lib/languages/json.min.js',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(res => {
        if (!res || res.status !== 200 || res.type === 'opaque') return res;
        const clone = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone));
        return res;
      }).catch(() => caches.match('./index.html'));
    })
  );
});
