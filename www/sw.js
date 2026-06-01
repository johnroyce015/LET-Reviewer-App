const CACHE_NAME = 'let-reviewer-student-v5';

// Only essential files that MUST exist for the student side
const ASSETS_TO_CACHE = [
    '/',
    '/index.html',
    '/login.html',
    '/register.html',
    '/manifest.json',

    '/student/dashboard.html',
    '/student/exams.html',
    '/student/quiz.html',
    '/student/results.html',
    '/student/review.html',
    '/student/insights.html',

    '/assets/js/supabase.js',

    '/assets/js/student/dashboard.js',
    '/assets/js/student/exams.js',
    '/assets/js/student/quiz.js',
    '/assets/js/student/results.js',
    '/assets/js/student/review.js',
    '/assets/js/student/insights.js',

    '/assets/js/offline-sync.js'
];

self.addEventListener('install', (event) => {
    event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_TO_CACHE)));
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