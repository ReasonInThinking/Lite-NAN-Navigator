const CACHE_NAME = 'lite-nav-v1';
const ASSETS = [
  '/Lite-NAN-Navigator/',
  '/Lite-NAN-Navigator/index.html',
  '/Lite-NAN-Navigator/image.png' // Добавьте сюда другие ваши файлы (например, style.css), если они лежат отдельно
];

// Установка: кэшируем все файлы приложения в память телефона
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// Активация: чистим старый кэш при обновлениях
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) return caches.delete(key);
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Перехват запросов: если интернета нет — берем файлы из памяти телефона мгновенно!
self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((cachedResponse) => {
      if (cachedResponse) return cachedResponse;
      return fetch(e.request).catch(() => {
        // Оффлайн-заглушка для index.html
        if (e.request.mode === 'navigate') {
          return caches.match('/Lite-NAN-Navigator/index.html');
        }
      });
    })
  );
});
