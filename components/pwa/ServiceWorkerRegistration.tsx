'use client';

import { useEffect } from 'react';

export function ServiceWorkerRegistration() {
    useEffect(() => {
        if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker
                    .register('/sw.js')
                    .then((registration) => {
                        console.log('[PWA] Service Worker registered:', registration.scope);

                        // Forzar verificación de actualización en CADA carga
                        registration.update().then(() => {
                            // Si hay un nuevo SW esperando, activarlo inmediatamente
                            if (registration.waiting) {
                                registration.waiting.postMessage({ type: 'SKIP_WAITING' });
                            }
                        });

                        // Escuchar cuando un nuevo SW toma control
                        let refreshing = false;
                        navigator.serviceWorker.addEventListener('controllerchange', () => {
                            if (!refreshing) {
                                refreshing = true;
                                window.location.reload();
                            }
                        });

                        // También verificar cada 5 minutos
                        setInterval(() => {
                            registration.update();
                        }, 5 * 60 * 1000);
                    })
                    .catch((error) => {
                        console.error('[PWA] Service Worker registration failed:', error);
                    });
            });
        }
    }, []);

    return null;
}
