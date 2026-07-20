const CACHE_NAME = 'pdf-magic-v21';
const urlsToCache = [
  './',
  './index.html',
  './style.css',
  './script.js',
  './cloud-drawings.js',
  './pwa-ui.js',
  './supabase-config.js',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './vendor/Sortable.min.js',
  './vendor/jspdf.umd.min.js',
  './vendor/pdf.min.js',
  './vendor/pdf.worker.min.js',
  './vendor/jszip.min.js',
  './vendor/supabase.js'
];

// บันทึกไฟล์ลง Cache เมื่อติดตั้งแอป
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
      .then(() => self.skipWaiting())
  );
});

// เรียกใช้ไฟล์จาก Cache เพื่อให้แอปโหลดไวขึ้น
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(names => Promise.all(
      names.filter(name => name !== CACHE_NAME).map(name => caches.delete(name))
    )).then(() => self.clients.claim())
  );
});
