const CACHE_NAME = 'lite-nav-v1';
const ASSETS = [
  './',             // Кэширует главную страницу (корневой запрос)
  './index.html',   // Кэширует сам файл страницы
  './image.png'     // Кэширует картинку в этой же папке
];


// Установка: кэшируем все файлы приложения в память телефона
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Заворачиваем в catch, чтобы один битый файл/картинка не ломали всю установку
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

  // ИСПРАВЛЕНО: Теперь запросы к микрофону, blob и Google отправляются напрямую в сеть, а не зависают
  if (url.includes('speech') || url.includes('google.com') || url.startsWith('blob:')) {
    return e.respondWith(fetch(e.request)); 
  }

  e.respondWith(
    caches.match(e.request).then((cachedResponse) => {
      if (cachedResponse) return cachedResponse;
      
      return fetch(e.request).catch(() => {
        // Оффлайн-заглушка для index.html
        if (e.request.mode === 'navigate') {
          return caches.match('/Lite-NAN-Navigator/index.html');
        }
        // Возвращаем пустой ответ для картинок/скриптов, чтобы консоль не сыпала ошибками
        return new Response('', { status: 404, statusText: 'Offline' });
      });
    })
  );
});
