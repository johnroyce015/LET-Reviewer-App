const CACHE_NAME = 'let-reviewer-v3';

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

// 🟢 SMART FETCH: If it's not in the cache, just fetch from network. 
// Do NOT crash if the file is missing!
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            return cachedResponse || fetch(event.request).catch(() => {
                console.log("⚠️ Could not fetch:", event.request.url);
                return new Response(); // Return empty response instead of crashing
            });
        })
    );
});