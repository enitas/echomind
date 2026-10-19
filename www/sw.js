const CACHE_NAME = 'echomind-core-v8.12';
const AI_WEIGHTS_CACHE = 'echomind-ai-weights-v8.12';

const ASSETS_TO_CACHE = [
  './index.html',
  './manifest.json',
  'https://cdn.tailwindcss.com',
  'https://unpkg.com/3d-force-graph@1.73.3/dist/3d-force-graph.min.js',
  'https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.0.2',
  'https://esm.run/@mlc-ai/web-llm'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_TO_CACHE))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME && key !== AI_WEIGHTS_CACHE) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  const isAIAsset = url.hostname.includes('huggingface.co') || url.hostname.includes('mlc.ai') || url.hostname.includes('esm.run') || url.pathname.includes('onnx');

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) return cachedResponse;

      return fetch(event.request).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200 && networkResponse.type !== 'opaque') {
          return networkResponse;
        }

        const responseToCache = networkResponse.clone();
        const targetCacheName = isAIAsset ? AI_WEIGHTS_CACHE : CACHE_NAME;

        caches.open(targetCacheName).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return networkResponse;
      }).catch(() => {
        if (event.request.headers.get('accept').includes('text/html')) {
          return caches.match('./index.html');
        }
      });
    })
  );
});