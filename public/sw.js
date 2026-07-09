const CACHE_NAME = 'sudan-edu-offline-v2';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/logo.svg',
  '/data/curriculum.ts',
  '/src/main.tsx',
  '/src/App.tsx',
  '/src/index.css'
];

// Install Event
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Pre-caching offline skeleton assets');
      return cache.addAll(ASSETS_TO_CACHE).catch((err) => {
        console.warn('[Service Worker] Some initial pre-cache assets failed to load: ', err);
      });
    })
  );
});

// Activate Event
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('[Service Worker] Clearing old cache registry:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip web sockets, dev server hot-reload websocket, dynamic api routes, and Supabase real-time API
  if (
    url.pathname.includes('socket') ||
    url.pathname.includes('websocket') ||
    url.pathname.includes('/api/') ||
    url.hostname.includes('supabase') ||
    url.hostname.includes('supabase.co') ||
    request.method !== 'GET'
  ) {
    return;
  }

  // Caching Strategy: Network-First falling back to Cache
  // This ensures students get the latest updates immediately when online, but can access materials instantly offline.
  event.respondWith(
    fetch(request)
      .then((networkResponse) => {
        // If valid response, open cache and clone it
        if (networkResponse && networkResponse.status === 200) {
          const contentType = networkResponse.headers.get('content-type') || '';
          const isCacheable = 
            request.url.startsWith(self.location.origin) && (
              url.pathname === '/' || 
              url.pathname.endsWith('.html') ||
              url.pathname.endsWith('.js') ||
              url.pathname.endsWith('.css') ||
              url.pathname.endsWith('.json') ||
              url.pathname.endsWith('.pdf') ||
              url.pathname.endsWith('.png') ||
              url.pathname.endsWith('.jpg') ||
              url.pathname.endsWith('.svg') ||
              url.pathname.endsWith('.ico') ||
              contentType.includes('application/javascript') ||
              contentType.includes('text/css') ||
              contentType.includes('application/pdf') ||
              contentType.includes('image/')
            );

          if (isCacheable) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
        }
        return networkResponse;
      })
      .catch(() => {
        // Fallback to cache if offline
        console.log('[Service Worker] Offline detected. Serving resource from Cache Storage:', request.url);
        return caches.match(request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }

          // If PDF fails and isn't cached, return a offline PDF fallback notice
          if (url.pathname.endsWith('.pdf') || request.url.toLowerCase().includes('pdf')) {
            return new Response(
              JSON.stringify({ error: "Offline: Textbooks only accessible when previously opened online." }),
              { headers: { 'Content-Type': 'application/json' } }
            );
          }

          // Default fallback
          return new Response(
            `
            <div style="font-family: system-ui, sans-serif; text-align: center; padding: 40px; color: #cbd5e1; background-color: #020617; height: 100vh; display: flex; flex-direction: column; justify-content: center; align-items: center;">
              <span style="font-size: 48px;">🇸🇩 📡</span>
              <h2 style="color: #f8fafc; font-weight: 800; margin-top: 15px;">لا يوجد اتصال بالإنترنت!</h2>
              <p style="font-size: 14px; max-width: 400px; color: #94a3b8; line-height: 1.6;">هذه المادة أو الصفحة التعليمية لم يتم حفظها تلقائياً على جهازك بعد. يرجى تصفحها مرة واحدة على الأقل أثناء اتصالك بالشبكة لتصبح متوفرة بصورة كاملة بدون اتصال.</p>
              <button onclick="window.location.reload()" style="background-color: #10b981; color: white; border: none; padding: 10px 20px; font-weight: bold; border-radius: 8px; cursor: pointer; margin-top: 20px; outline: none;">إعادة المحاولة</button>
            </div>
            `,
            { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
          );
        });
      })
  );
});
