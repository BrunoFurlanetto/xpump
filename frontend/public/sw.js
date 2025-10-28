const CACHE_NAME = "xpump-v1";
const OFFLINE_URL = "/offline.html";

// Assets para pré-cache (instalação do SW)
const PRECACHE_ASSETS = [
  "/",
  "/offline.html",
  "/logo/x192x192.png",
  "/logo/x512x512.png",
];

// Instalar Service Worker e fazer pré-cache
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS).catch((error) => {
        console.error("Failed to cache assets during install:", error);
      });
    }),
  );
  self.skipWaiting();
});

// Ativar e limpar caches antigos
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        }),
      );
    }),
  );
  self.clients.claim();
});

// Estratégia de Fetch: Network First, fallback para Cache
self.addEventListener("fetch", (event) => {
  // Ignorar requisições não-GET
  if (event.request.method !== "GET") return;

  // Ignorar requisições para API (sempre tentar network)
  if (event.request.url.includes("/api/")) {
    event.respondWith(fetch(event.request));
    return;
  }

  // Ignorar chrome extensions
  if (event.request.url.startsWith("chrome-extension://")) return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Clonar response antes de cachear
        const responseToCache = response.clone();

        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return response;
      })
      .catch(() => {
        // Se network falhar, tentar cache
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }

          // Se não houver cache, retornar página offline
          if (event.request.mode === "navigate") {
            return caches.match(OFFLINE_URL);
          }
        });
      }),
  );
});

// Push Notifications
self.addEventListener("push", (event) => {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: data.icon || "/logo/x.png",
      badge: "/logo/x192x192.png",
      vibrate: [100, 50, 100],
      data: {
        dateOfArrival: Date.now(),
        primaryKey: data.id || "1",
        url: data.url || "/",
      },
      actions: data.actions || [],
    };
    event.waitUntil(self.registration.showNotification(data.title, options));
  }
});

// Clique em Notificação
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const urlToOpen = event.notification.data?.url || "/";

  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        // Tentar focar em janela existente
        for (const client of clientList) {
          if (client.url === urlToOpen && "focus" in client) {
            return client.focus();
          }
        }
        // Se não houver janela, abrir nova
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      }),
  );
});
