'use client';

import { useEffect, useState } from 'react';

interface BoldPayButtonProps {
    /** ID único del pedido */
    orderId: string;
    /** Monto total en pesos colombianos (sin decimales) */
    amount: number;
    /** Descripción del pedido */
    description?: string;
    /** Email del cliente */
    customerEmail?: string;
    /** Nombre del cliente */
    customerName?: string;
    /** Teléfono del cliente */
    customerPhone?: string;
    /** Dirección del cliente */
    customerAddress?: string;
    /** URL de redirección tras el pago */
    redirectUrl?: string;
    /** Deshabilitar el botón */
    disabled?: boolean;
    /** Clase CSS adicional */
    className?: string;
}

// Llave de identidad de Bold (pública, segura para frontend)
const BOLD_IDENTITY_KEY = process.env.NEXT_PUBLIC_BOLD_IDENTITY_KEY || '';

// Declarar el tipo global para BoldCheckout
declare global {
    interface Window {
        BoldCheckout?: {
            open: (config: any) => void;
        };
    }
}

export function BoldPayButton({
    orderId,
    amount,
    description = 'Pedido Tus Aguacates',
    customerEmail,
    customerName,
    customerPhone,
    customerAddress,
    redirectUrl,
    disabled = false,
    className = '',
}: BoldPayButtonProps) {
    const [integrityHash, setIntegrityHash] = useState<string>('');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string>('');
    const [scriptLoaded, setScriptLoaded] = useState(false);
    const [processingPayment, setProcessingPayment] = useState(false);

    // Cargar el script de Bold
    useEffect(() => {
        // Verificar si ya está cargado
        if (window.BoldCheckout) {
            setScriptLoaded(true);
            return;
        }

        // Verificar si el script ya existe
        const existingScript = document.querySelector('script[src="https://checkout.bold.co/library/boldPaymentButton.js"]');
        if (existingScript) {
            // Esperar a que cargue
            const checkLoaded = setInterval(() => {
                if (window.BoldCheckout) {
                    setScriptLoaded(true);
                    clearInterval(checkLoaded);
                }
            }, 100);
            return () => clearInterval(checkLoaded);
        }

        // Cargar el script
        const script = document.createElement('script');
        script.src = 'https://checkout.bold.co/library/boldPaymentButton.js';
        script.async = true;
        script.onload = () => {
            console.log('[Bold] Script loaded successfully');
            setScriptLoaded(true);
        };
        script.onerror = () => {
            console.error('[Bold] Failed to load script');
            setError('Error cargando pasarela de pagos');
        };
        document.head.appendChild(script);

        return () => {
            // No remover el script al desmontar para evitar problemas de recarga
        };
    }, []);

    // Generar hash de integridad desde el backend
    useEffect(() => {
        async function fetchHash() {
            if (!orderId || !amount) {
                console.log('[Bold] Missing orderId or amount');
                return;
            }

            try {
                setIsLoading(true);
                setError('');

                console.log('[Bold] Fetching hash for order:', orderId, 'amount:', amount);

                const response = await fetch('/api/bold/generate-hash', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        orderId,
                        amount,
                        currency: 'COP',
                    }),
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Error generando hash de seguridad');
                }

                const data = await response.json();
                console.log('[Bold] Hash received:', data.hash?.substring(0, 20) + '...');
                setIntegrityHash(data.hash);
            } catch (err: any) {
                console.error('[Bold] Error fetching hash:', err);
                setError(err.message || 'Error de configuración');
            } finally {
                setIsLoading(false);
            }
        }

        fetchHash();
    }, [orderId, amount]);

    // Función para abrir el checkout de Bold
    const handlePayClick = () => {
        if (!window.BoldCheckout) {
            setError('La pasarela de pagos no se ha cargado. Por favor recarga la página.');
            console.error('[Bold] BoldCheckout not available');
            return;
        }

        if (!integrityHash) {
            setError('Error de seguridad. Por favor recarga la página.');
            console.error('[Bold] No integrity hash');
            return;
        }

        if (!BOLD_IDENTITY_KEY) {
            setError('Bold no está configurado correctamente');
            console.error('[Bold] No identity key');
            return;
        }

        setProcessingPayment(true);

        // Configuración para BoldCheckout.open()
        const baseUrl = window.location.origin;
        const finalRedirectUrl = redirectUrl || `${baseUrl}/checkout/success`;

        const config: any = {
            apiKey: BOLD_IDENTITY_KEY,
            orderId: orderId,
            currency: 'COP',
            amount: amount,
            integritySignature: integrityHash,
            description: description,
            redirectionUrl: finalRedirectUrl,
            renderMode: 'embedded', // Modal sin salir de la página
        };

        // Datos del cliente
        if (customerEmail || customerName || customerPhone) {
            config.customerData = {
                email: customerEmail || '',
                fullName: customerName || '',
                phone: customerPhone || '',
                dialCode: '+57',
            };
        }

        // Dirección de facturación
        if (customerAddress) {
            config.billingAddress = {
                address: customerAddress,
                city: 'Bogotá',
                country: 'CO',
            };
        }

        console.log('[Bold] Opening checkout with config:', {
            orderId: config.orderId,
            amount: config.amount,
            hasHash: !!config.integritySignature
        });

        try {
            window.BoldCheckout.open(config);
        } catch (err: any) {
            console.error('[Bold] Error opening checkout:', err);
            setError('Error al abrir la pasarela de pagos');
            setProcessingPayment(false);
        }
    };

    // Estado de carga
    if (isLoading) {
        return (
            <div className={`flex items-center justify-center py-4 ${className}`}>
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-3 text-gray-600">Preparando pago seguro...</span>
            </div>
        );
    }

    // Estado de error
    if (error || !BOLD_IDENTITY_KEY) {
        return (
            <div className={`p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 ${className}`}>
                <p className="font-medium">⚠️ Error de configuración de pago</p>
                <p className="text-sm mt-1">{error || 'Bold no está configurado correctamente'}</p>
                <button
                    onClick={() => window.location.reload()}
                    className="mt-2 text-sm underline hover:no-underline"
                >
                    Recargar página
                </button>
            </div>
        );
    }

    // Script no cargado todavía
    if (!scriptLoaded) {
        return (
            <div className={`flex items-center justify-center py-4 ${className}`}>
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-3 text-gray-600">Cargando pasarela de pagos...</span>
            </div>
        );
    }

    // Botón de pago
    return (
        <div className={className}>
            <button
                onClick={handlePayClick}
                disabled={disabled || processingPayment || !integrityHash}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed text-white font-bold py-4 px-6 rounded-lg transition-all transform hover:scale-[1.02] shadow-lg hover:shadow-xl flex items-center justify-center gap-3"
            >
                {processingPayment ? (
                    <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        <span>Abriendo pasarela...</span>
                    </>
                ) : (
                    <>
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                        </svg>
                        <span>Pagar con Tarjeta o PSE</span>
                    </>
                )}
            </button>
            <p className="text-xs text-gray-500 text-center mt-2">
                🔒 Pago seguro procesado por Bold
            </p>
        </div>
    );
}

export default BoldPayButton;
