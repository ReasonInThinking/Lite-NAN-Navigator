const CACHE_NAME = 'lite-nav-v2'; // Обновили версию для перезаписи старого кэша

const ASSETS = [
  './',
  './index.html',
  './image.png'
];

// Установка: кэшируем все файлы приложения в память телефона
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS).catch(err => {
        console.error('Ошибка предкэширования: проверьте пути к файлам', err);
      });
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

// Перехват запросов: если интернета нет — берем файлы из памяти телефона
self.addEventListener('fetch', (e) => {
  const url = e.request.url;

  // Исключения, которые всегда идут напрямую в сеть
  if (url.includes('speech') || url.includes('google.com') || url.startsWith('blob:')) {
    return e.respondWith(fetch(e.request)); 
  }

  e.respondWith(
    caches.match(e.request).then((cachedResponse) => {
      if (cachedResponse) return cachedResponse;
      
      return fetch(e.request).catch(() => {
        // ИСПРАВЛЕНО: Если сеть пропала во время навигации, берем то, что гарантированно есть в кэше
        if (e.request.mode === 'navigate') {
          return caches.match('./index.html') || caches.match('./');
        }
        // Возвращаем пустой ответ для картинок/скриптов, чтобы консоль не сыпала ошибками
        return new Response('', { status: 404, statusText: 'Offline' });
      });
    })
  );
});
