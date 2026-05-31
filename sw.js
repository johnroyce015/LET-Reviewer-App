const CACHE_NAME = 'let-reviewer-student-v1';

// We ONLY cache the files students need to take quizzes offline.
// Notice we are ignoring the /admin/ folder completely!
const ASSETS_TO_CACHE = [
    '/',
    '/index.html',
    '/login.html',
    '/register.html',
    '/manifest.json',
    '/student/dashboard.html',
    '/student/quiz.html',
    '/student/results.html',
    '/assets/css/global.css',
    '/assets/css/student/dashboard.css',
    '/assets/css/student/quiz.css',
    '/assets/js/supabase.js',
    '/assets/js/offline-sync.js',
    '/assets/js/student/dashboard.js',
    '/assets/js/student/quiz.js'
];

// 1. INSTALL EVENT: Download all student UI files to the phone
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('📦 [Service Worker] Caching App Shell');
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
    self.skipWaiting();
});

// 2. ACTIVATE EVENT: Clean up old versions if you update the app
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cache) => {
                    if (cache !== CACHE_NAME) {
                        console.log('🧹 [Service Worker] Clearing old cache');
                        return caches.delete(cache);
                    }
                })
            );
        })
    );
});

// 3. FETCH EVENT: Intercept requests and serve from cache if offline
self.addEventListener('fetch', (event) => {
    // Only intercept basic GET requests (ignore Supabase API calls for now)
    if (event.request.method !== 'GET') return;

    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            // Return the cached file if it exists, otherwise fetch from the internet
            return cachedResponse || fetch(event.request);
        })
    );
});