'use client';

import { useState, useEffect } from 'react';
import { X, Download, Smartphone } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function InstallPrompt() {
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [showPrompt, setShowPrompt] = useState(false);
    const [isInstalled, setIsInstalled] = useState(false);

    useEffect(() => {
        // Verificar si ya está instalada
        if (window.matchMedia('(display-mode: standalone)').matches) {
            setIsInstalled(true);
            return;
        }

        // También verificar con navigator.standalone para iOS
        if ((window.navigator as any).standalone === true) {
            setIsInstalled(true);
            return;
        }

        // Verificar si el usuario ya rechazó el prompt
        const dismissed = localStorage.getItem('pwa-install-dismissed');
        if (dismissed) {
            const dismissedTime = parseInt(dismissed);
            const daysSinceDismissed = (Date.now() - dismissedTime) / (1000 * 60 * 60 * 24);
            // No mostrar si fue rechazado en los últimos 7 días
            if (daysSinceDismissed < 7) {
                return;
            }
        }

        // Escuchar evento beforeinstallprompt
        const handleBeforeInstallPrompt = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e as BeforeInstallPromptEvent);
            // Mostrar prompt después de 2 minutos para no ser invasivo
            setTimeout(() => setShowPrompt(true), 120000);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        // Escuchar si se instala la app
        window.addEventListener('appinstalled', () => {
            setIsInstalled(true);
            setShowPrompt(false);
            setDeferredPrompt(null);
            console.log('[PWA] App installed');
        });

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        };
    }, []);

    const handleInstall = async () => {
        if (!deferredPrompt) return;

        try {
            await deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;

            if (outcome === 'accepted') {
                console.log('[PWA] User accepted install');
            } else {
                console.log('[PWA] User dismissed install');
                localStorage.setItem('pwa-install-dismissed', Date.now().toString());
            }
        } catch (error) {
            console.error('[PWA] Install error:', error);
        }

        setDeferredPrompt(null);
        setShowPrompt(false);
    };

    const handleDismiss = () => {
        setShowPrompt(false);
        localStorage.setItem('pwa-install-dismissed', Date.now().toString());
    };

    // No mostrar si ya está instalada o no hay prompt disponible
    if (isInstalled || !showPrompt || !deferredPrompt) {
        return null;
    }

    return (
        <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-sm z-50 animate-slide-up">
            <div className="bg-gradient-to-r from-verde-bosque to-verde-aguacate text-white rounded-2xl shadow-2xl p-4 relative overflow-hidden">
                {/* Decoración de fondo */}
                <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full blur-xl pointer-events-none" />
                <div className="absolute -left-8 -bottom-8 w-32 h-32 bg-white/5 rounded-full blur-xl pointer-events-none" />

                {/* Botón de cerrar */}
                <button
                    onClick={handleDismiss}
                    className="absolute top-2 right-2 p-1 hover:bg-white/20 rounded-full transition-colors"
                    aria-label="Cerrar"
                >
                    <X className="w-5 h-5" />
                </button>

                <div className="relative flex items-start gap-3">
                    {/* Icono */}
                    <div className="flex-shrink-0 w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                        <Smartphone className="w-6 h-6" />
                    </div>

                    {/* Contenido */}
                    <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-lg leading-tight mb-1">
                            ¡Instala Tus Aguacates!
                        </h3>
                        <p className="text-sm text-white/90 mb-3">
                            Accede más rápido y recibe notificaciones de ofertas 🥑
                        </p>

                        {/* Botón de instalar */}
                        <button
                            onClick={handleInstall}
                            className="w-full bg-gradient-to-r from-yellow-400 to-yellow-500 text-verde-bosque-700 font-bold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 hover:from-yellow-300 hover:to-yellow-400 transition-all shadow-lg"
                        >
                            <Download className="w-5 h-5" />
                            Instalar App
                        </button>
                    </div>
                </div>

                {/* Indicador de beneficios */}
                <div className="mt-3 pt-3 border-t border-white/20 flex items-center justify-center gap-4 text-xs text-white/80">
                    <span>✓ Sin anuncios</span>
                    <span>✓ Acceso offline</span>
                    <span>✓ Rápido</span>
                </div>
            </div>

            <style jsx>{`
        @keyframes slide-up {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        .animate-slide-up {
          animation: slide-up 0.5s ease-out;
        }
      `}</style>
        </div>
    );
}
