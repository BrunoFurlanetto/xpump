const CACHE_NAME = "start-v2";
const OFFLINE_URL = "/offline.html";

// Assets para pré-cache (instalação do SW)
const PRECACHE_ASSETS = [
  "/",
  "/offline.html",
  "/logo/x192x192.png",
  "/logo/x512x512.png",
  "/logo/x.png",
];

// Configurações de cache por tipo
const CACHE_CONFIG = {
  images: {
    name: "start-images-v2",
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 dias
    maxEntries: 60,
  },
  api: {
    name: "start-api-v2",
    maxAge: 5 * 60 * 1000, // 5 minutos
    maxEntries: 50,
  },
  static: {
    name: "start-static-v2",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 dias
    maxEntries: 100,
  },
};

// Instalar Service Worker e fazer pré-cache
self.addEventListener("install", (event) => {
  console.log("[SW] Installing Service Worker...");
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("[SW] Precaching assets");
      return cache.addAll(PRECACHE_ASSETS).catch((error) => {
        console.error("[SW] Failed to cache assets during install:", error);
      });
    }),
  );
  self.skipWaiting();
});

// Ativar e limpar caches antigos
self.addEventListener("activate", (event) => {
  console.log("[SW] Activating Service Worker...");
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // Deletar todos os caches que não são da versão atual
          if (
            cacheName !== CACHE_NAME &&
            cacheName !== CACHE_CONFIG.images.name &&
            cacheName !== CACHE_CONFIG.api.name &&
            cacheName !== CACHE_CONFIG.static.name
          ) {
            console.log("[SW] Deleting old cache:", cacheName);
            return caches.delete(cacheName);
          }
        }),
      );
    }),
  );
  self.clients.claim();
});

// Função para limpar cache antigo
async function cleanExpiredCache(cacheName, maxAge, maxEntries) {
  const cache = await caches.open(cacheName);
  const requests = await cache.keys();
  const now = Date.now();

  // Remover entradas expiradas
  for (const request of requests) {
    const response = await cache.match(request);
    const dateHeader = response?.headers.get("date");
    if (dateHeader) {
      const responseDate = new Date(dateHeader).getTime();
      if (now - responseDate > maxAge) {
        await cache.delete(request);
      }
    }
  }

  // Limitar número de entradas
  const remainingRequests = await cache.keys();
  if (remainingRequests.length > maxEntries) {
    const toDelete = remainingRequests.slice(0, remainingRequests.length - maxEntries);
    await Promise.all(toDelete.map((request) => cache.delete(request)));
  }
}

// Estratégia de cache por tipo de requisição
function getCacheStrategy(request) {
  const url = new URL(request.url);

  // Imagens: Cache First com fallback
  if (
    request.destination === "image" ||
    /\.(png|jpg|jpeg|gif|svg|webp|ico)$/i.test(url.pathname)
  ) {
    return "cache-first-images";
  }

  // API: Network First com cache curto
  if (url.pathname.includes("/api/") || url.origin.includes("localhost:8000")) {
    return "network-first-api";
  }

  // Arquivos estáticos do Next.js: Cache First
  if (url.pathname.startsWith("/_next/static/")) {
    return "cache-first-static";
  }

  // Páginas HTML: Network First
  if (request.mode === "navigate" || request.headers.get("accept")?.includes("text/html")) {
    return "network-first";
  }

  // Outros recursos: Stale While Revalidate
  return "stale-while-revalidate";
}

// Estratégia: Cache First (para imagens)
async function cacheFirstImages(request) {
  const cache = await caches.open(CACHE_CONFIG.images.name);
  const cachedResponse = await cache.match(request);

  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.error("[SW] Cache First (Images) failed:", error);
    return new Response("Image not available", { status: 503 });
  }
}

// Estratégia: Network First (para API)
async function networkFirstApi(request) {
  const cache = await caches.open(CACHE_CONFIG.api.name);

  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.log("[SW] Network failed, trying cache for:", request.url);
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    throw error;
  }
}

// Estratégia: Cache First (para estáticos)
async function cacheFirstStatic(request) {
  const cache = await caches.open(CACHE_CONFIG.static.name);
  const cachedResponse = await cache.match(request);

  if (cachedResponse) {
    // Revalidar em background
    fetch(request).then((networkResponse) => {
      if (networkResponse.ok) {
        cache.put(request, networkResponse);
      }
    });
    return cachedResponse;
  }

  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.error("[SW] Cache First (Static) failed:", error);
    throw error;
  }
}

// Estratégia: Network First (padrão)
async function networkFirst(request) {
  const cache = await caches.open(CACHE_NAME);

  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    // Se for navegação, retornar página offline
    if (request.mode === "navigate") {
      return caches.match(OFFLINE_URL);
    }
    throw error;
  }
}

// Estratégia: Stale While Revalidate
async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE_NAME);
  const cachedResponse = await cache.match(request);

  const fetchPromise = fetch(request).then((networkResponse) => {
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  });

  return cachedResponse || fetchPromise;
}

// Fetch handler principal
self.addEventListener("fetch", (event) => {
  // Ignorar requisições não-GET
  if (event.request.method !== "GET") return;

  // Ignorar chrome extensions
  if (event.request.url.startsWith("chrome-extension://")) return;

  const strategy = getCacheStrategy(event.request);

  switch (strategy) {
    case "cache-first-images":
      event.respondWith(cacheFirstImages(event.request));
      break;
    case "network-first-api":
      event.respondWith(networkFirstApi(event.request));
      break;
    case "cache-first-static":
      event.respondWith(cacheFirstStatic(event.request));
      break;
    case "network-first":
      event.respondWith(networkFirst(event.request));
      break;
    case "stale-while-revalidate":
      event.respondWith(staleWhileRevalidate(event.request));
      break;
    default:
      event.respondWith(fetch(event.request));
  }
});

// Limpar cache periodicamente
self.addEventListener("message", (event) => {
  if (event.data === "CLEAN_CACHE") {
    Promise.all([
      cleanExpiredCache(
        CACHE_CONFIG.images.name,
        CACHE_CONFIG.images.maxAge,
        CACHE_CONFIG.images.maxEntries,
      ),
      cleanExpiredCache(
        CACHE_CONFIG.api.name,
        CACHE_CONFIG.api.maxAge,
        CACHE_CONFIG.api.maxEntries,
      ),
      cleanExpiredCache(
        CACHE_CONFIG.static.name,
        CACHE_CONFIG.static.maxAge,
        CACHE_CONFIG.static.maxEntries,
      ),
    ]).then(() => {
      console.log("[SW] Cache cleaned");
    });
  }

  // Handler para atualização forçada
  if (event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
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
