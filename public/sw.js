// Service Worker para Tus Aguacates PWA
// IMPORTANTE: Cambiar versión en cada deploy para forzar actualización
const CACHE_NAME = 'tus-aguacates-v2-20260419';
const STATIC_ASSETS = [
    '/favicon.png',
    '/manifest.json',
];

// Instalar: cachear recursos estáticos
self.addEventListener('install', (event) => {
    console.log('[SW] Installing version:', CACHE_NAME);
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('[SW] Caching static assets');
            return cache.addAll(STATIC_ASSETS);
        })
    );
    // Activar inmediatamente sin esperar
    self.skipWaiting();
});

// Activar: limpiar caches antiguos
self.addEventListener('activate', (event) => {
    console.log('[SW] Activating version:', CACHE_NAME);
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames
                    .filter((name) => name !== CACHE_NAME)
                    .map((name) => {
                        console.log('[SW] Deleting old cache:', name);
                        return caches.delete(name);
                    })
            );
        })
    );
    // Tomar control inmediatamente de TODAS las pestañas
    self.clients.claim();
});

// Fetch: estrategia inteligente
self.addEventListener('fetch', (event) => {
    // Solo manejar requests GET
    if (event.request.method !== 'GET') return;

    // Ignorar requests a APIs externas
    const url = new URL(event.request.url);
    if (url.origin !== self.location.origin) return;

    // ESTRATEGIA 1: HTML/Navegación → SIEMPRE desde red (sin cache)
    if (event.request.mode === 'navigate' || 
        event.request.headers.get('accept')?.includes('text/html')) {
        event.respondWith(
            fetch(event.request)
                .then((response) => {
                    // Cachear para offline pero SIEMPRE mostrar la versión nueva
                    const responseClone = response.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseClone);
                    });
                    return response;
                })
                .catch(() => {
                    // Solo usar cache si no hay red
                    return caches.match(event.request).then((cachedResponse) => {
                        return cachedResponse || caches.match('/');
                    });
                })
        );
        return;
    }

    // ESTRATEGIA 2: Assets estáticos (_next/static/*) → Cache First (inmutable)
    if (url.pathname.startsWith('/_next/static/')) {
        event.respondWith(
            caches.match(event.request).then((cachedResponse) => {
                if (cachedResponse) {
                    return cachedResponse;
                }
                return fetch(event.request).then((response) => {
                    if (response && response.status === 200) {
                        const responseClone = response.clone();
                        caches.open(CACHE_NAME).then((cache) => {
                            cache.put(event.request, responseClone);
                        });
                    }
                    return response;
                });
            })
        );
        return;
    }

    // ESTRATEGIA 3: Todo lo demás → Network First
    event.respondWith(
        fetch(event.request)
            .then((response) => {
                if (response && response.status === 200) {
                    const responseClone = response.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseClone);
                    });
                }
                return response;
            })
            .catch(() => {
                return caches.match(event.request).then((cachedResponse) => {
                    return cachedResponse || new Response('Offline', { status: 503 });
                });
            })
    );
});

// Push notifications (para futuro)
self.addEventListener('push', (event) => {
    if (!event.data) return;

    const data = event.data.json();
    const options = {
        body: data.body || 'Nueva notificación de Tus Aguacates',
        icon: '/favicon.png',
        badge: '/favicon.png',
        vibrate: [100, 50, 100],
        data: {
            url: data.url || '/',
        },
    };

    event.waitUntil(
        self.registration.showNotification(data.title || 'Tus Aguacates', options)
    );
});

// Click en notificación
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    event.waitUntil(
        clients.openWindow(event.notification.data.url || '/')
    );
});
