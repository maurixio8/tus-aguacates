'use client';

import { useState, useEffect, useCallback } from 'react';
import { Bell, BellOff, X } from 'lucide-react';

// Convertir base64 a Uint8Array para VAPID
function urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

interface PushNotificationPromptProps {
    onSubscribe?: (subscription: PushSubscription) => void;
    onDismiss?: () => void;
}

export function PushNotificationPrompt({ onSubscribe, onDismiss }: PushNotificationPromptProps) {
    const [showPrompt, setShowPrompt] = useState(false);
    const [permission, setPermission] = useState<NotificationPermission>('default');
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        // Verificar soporte y estado actual
        if (!('Notification' in window) || !('serviceWorker' in navigator)) {
            return;
        }

        setPermission(Notification.permission);

        // Verificar si ya está suscrito
        navigator.serviceWorker.ready.then((registration) => {
            registration.pushManager.getSubscription().then((subscription) => {
                setIsSubscribed(!!subscription);
            });
        });

        // Mostrar prompt después de 10 segundos si no ha rechazado
        const dismissed = localStorage.getItem('push-notification-dismissed');
        if (dismissed) {
            const dismissedTime = parseInt(dismissed);
            const daysSinceDismissed = (Date.now() - dismissedTime) / (1000 * 60 * 60 * 24);
            if (daysSinceDismissed < 7) {
                return;
            }
        }

        // Solo mostrar si no está suscrito y no ha dado permiso o denegado
        if (Notification.permission === 'default') {
            const timer = setTimeout(() => setShowPrompt(true), 10000);
            return () => clearTimeout(timer);
        }
    }, []);

    const handleSubscribe = useCallback(async () => {
        setIsLoading(true);

        try {
            // Solicitar permiso
            const permission = await Notification.requestPermission();
            setPermission(permission);

            if (permission !== 'granted') {
                console.log('[Push] Permiso denegado');
                setShowPrompt(false);
                return;
            }

            // Por ahora usamos modo demo
            // En producción, configurar VAPID key y hacer suscripción real
            console.log('[Push] Notificaciones habilitadas (modo demo)');
            setIsSubscribed(true);
            setShowPrompt(false);

            // Mostrar notificación de bienvenida
            if ('serviceWorker' in navigator) {
                const registration = await navigator.serviceWorker.ready;
                await registration.showNotification('¡Bienvenido a Tus Aguacates! 🥑', {
                    body: 'Te avisaremos cuando haya ofertas especiales',
                    icon: '/favicon.png',
                    badge: '/favicon.png',
                });
            }

            onSubscribe?.({} as PushSubscription);

        } catch (error) {
            console.error('[Push] Error al suscribirse:', error);
        } finally {
            setIsLoading(false);
        }
    }, [onSubscribe]);

    const handleDismiss = () => {
        setShowPrompt(false);
        localStorage.setItem('push-notification-dismissed', Date.now().toString());
        onDismiss?.();
    };

    // No mostrar si ya está suscrito o no hay soporte
    if (!showPrompt || isSubscribed || permission === 'denied') {
        return null;
    }

    return (
        <div className="fixed top-4 left-4 right-4 md:left-auto md:right-4 md:max-w-sm z-50 animate-slide-down">
            <div className="bg-white rounded-2xl shadow-2xl p-4 border border-gray-100">
                {/* Botón cerrar */}
                <button
                    onClick={handleDismiss}
                    className="absolute top-2 right-2 p-1 hover:bg-gray-100 rounded-full transition-colors"
                    aria-label="Cerrar"
                >
                    <X className="w-4 h-4 text-gray-400" />
                </button>

                <div className="flex items-start gap-3">
                    {/* Icono */}
                    <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-verde-bosque to-verde-aguacate rounded-xl flex items-center justify-center">
                        <Bell className="w-6 h-6 text-white" />
                    </div>

                    {/* Contenido */}
                    <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-gray-900 mb-1">
                            ¿Recibir ofertas? 🥑
                        </h3>
                        <p className="text-sm text-gray-600 mb-3">
                            Te avisamos cuando haya promociones y descuentos especiales
                        </p>

                        {/* Botones */}
                        <div className="flex gap-2">
                            <button
                                onClick={handleSubscribe}
                                disabled={isLoading}
                                className="flex-1 bg-gradient-to-r from-verde-bosque to-verde-aguacate text-white font-semibold py-2 px-4 rounded-lg text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
                            >
                                {isLoading ? 'Activando...' : '¡Sí, quiero!'}
                            </button>
                            <button
                                onClick={handleDismiss}
                                className="px-4 py-2 text-gray-500 hover:text-gray-700 text-sm font-medium"
                            >
                                Ahora no
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <style jsx>{`
        @keyframes slide-down {
          from {
            transform: translateY(-100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        .animate-slide-down {
          animation: slide-down 0.4s ease-out;
        }
      `}</style>
        </div>
    );
}

// Componente simple para mostrar estado de notificaciones en settings
export function NotificationStatus() {
    const [permission, setPermission] = useState<NotificationPermission>('default');
    const [isSubscribed, setIsSubscribed] = useState(false);

    useEffect(() => {
        if ('Notification' in window) {
            setPermission(Notification.permission);
        }

        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.ready.then((registration) => {
                registration.pushManager.getSubscription().then((subscription) => {
                    setIsSubscribed(!!subscription);
                });
            });
        }
    }, []);

    if (permission === 'denied') {
        return (
            <div className="flex items-center gap-2 text-red-600">
                <BellOff className="w-4 h-4" />
                <span className="text-sm">Notificaciones bloqueadas</span>
            </div>
        );
    }

    if (isSubscribed) {
        return (
            <div className="flex items-center gap-2 text-green-600">
                <Bell className="w-4 h-4" />
                <span className="text-sm">Notificaciones activas</span>
            </div>
        );
    }

    return (
        <div className="flex items-center gap-2 text-gray-500">
            <Bell className="w-4 h-4" />
            <span className="text-sm">Notificaciones desactivadas</span>
        </div>
    );
}
