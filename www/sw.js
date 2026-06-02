const CACHE_NAME = 'let-reviewer';

const urlsToCache = [
    './',
    './index.html',
    './login.html',
    './register.html',
    './manifest.json',
    './assets/css/style.css',
    './assets/css/student/pages/dashboard.css',
    './assets/css/student/pages/quiz.css',
    './assets/css/student/pages/results.css',
    './assets/css/student/pages/layout.css',
    './assets/js/supabase.js',
    './assets/js/auth.js',
    './assets/js/offline-sync.js',
    './student/dashboard.html',
    './student/exams.html',
    './student/insights.html',
    './student/quiz.html',
    './student/results.html'
];
self.addEventListener('install', (event) => {
    event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache)));
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => 
            Promise.all(cacheNames.map((cache) => {
                if (cache !== CACHE_NAME) return caches.delete(cache);
            }))
        )
    );
});

// 🟢 SMART FETCH: Network-First, Fallback to Cache
self.addEventListener('fetch', (event) => {
    // Ignore Supabase database calls (POST requests cannot be cached)
    if (event.request.method !== 'GET') return;

    event.respondWith(
        fetch(event.request)
            .then((networkResponse) => {
                const clonedResponse = networkResponse.clone();
                caches.open(CACHE_NAME).then((cache) => {
                    cache.put(event.request, clonedResponse);
                });
                
                return networkResponse;
            })
            .catch(() => {
                return caches.match(event.request).then((cachedResponse) => {
                    return cachedResponse || new Response(); 
                });
            })
    );
});