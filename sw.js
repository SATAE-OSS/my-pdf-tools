const CACHE_NAME = 'pdf-magic-v1';
const urlsToCache = [
  './',
  './index.html',
  './style.css',
  './script.js'
];

// บันทึกไฟล์ลง Cache เมื่อติดตั้งแอป
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

// เรียกใช้ไฟล์จาก Cache เพื่อให้แอปโหลดไวขึ้น
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
});