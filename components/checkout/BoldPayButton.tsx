'use client';

import { useEffect, useRef, useState } from 'react';
import Script from 'next/script';

interface BoldPayButtonProps {
    /** ID único del pedido */
    orderId: string;
    /** Monto total en pesos colombianos (sin decimales) */
    amount: number;
    /** Descripción del pedido */
    description?: string;
    /** Email del cliente (opcional, pre-llena el formulario) */
    customerEmail?: string;
    /** Nombre del cliente */
    customerName?: string;
    /** Teléfono del cliente */
    customerPhone?: string;
    /** Dirección del cliente */
    customerAddress?: string;
    /** URL de redirección tras el pago */
    redirectUrl?: string;
    /** Callback cuando el pago es exitoso */
    onSuccess?: () => void;
    /** Callback cuando hay un error */
    onError?: (error: string) => void;
    /** Estilo del botón: dark o light */
    buttonStyle?: 'dark' | 'light';
    /** Tamaño del botón: S, M, L */
    buttonSize?: 'S' | 'M' | 'L';
    /** Usar Embedded Checkout (sin salir de la página) */
    embedded?: boolean;
    /** Deshabilitar el botón */
    disabled?: boolean;
    /** Clase CSS adicional para el contenedor */
    className?: string;
}

// Llave de identidad de Bold (pública, segura para frontend)
const BOLD_IDENTITY_KEY = process.env.NEXT_PUBLIC_BOLD_IDENTITY_KEY || '';

export function BoldPayButton({
    orderId,
    amount,
    description = 'Pedido Tus Aguacates',
    customerEmail,
    customerName,
    customerPhone,
    customerAddress,
    redirectUrl,
    onSuccess,
    onError,
    buttonStyle = 'dark',
    buttonSize = 'L',
    embedded = true,
    disabled = false,
    className = '',
}: BoldPayButtonProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [integrityHash, setIntegrityHash] = useState<string>('');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string>('');
    const [scriptLoaded, setScriptLoaded] = useState(false);

    // Generar hash de integridad desde el backend
    useEffect(() => {
        async function fetchHash() {
            if (!orderId || !amount) return;

            try {
                setIsLoading(true);
                setError('');

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
                    throw new Error('Error generando hash de seguridad');
                }

                const data = await response.json();
                setIntegrityHash(data.hash);
            } catch (err: any) {
                console.error('[BoldPayButton] Error fetching hash:', err);
                setError(err.message || 'Error de configuración');
                onError?.(err.message);
            } finally {
                setIsLoading(false);
            }
        }

        fetchHash();
    }, [orderId, amount, onError]);

    // Inyectar el script del botón cuando tenemos el hash
    useEffect(() => {
        if (!scriptLoaded || !integrityHash || !containerRef.current || isLoading) return;

        // Limpiar contenedor
        containerRef.current.innerHTML = '';

        // Crear el script del botón de Bold
        const script = document.createElement('script');
        script.setAttribute('data-bold-button', `${buttonStyle}-${buttonSize}`);
        script.setAttribute('data-api-key', BOLD_IDENTITY_KEY);
        script.setAttribute('data-order-id', orderId);
        script.setAttribute('data-currency', 'COP');
        script.setAttribute('data-amount', amount.toString());
        script.setAttribute('data-integrity-signature', integrityHash);
        script.setAttribute('data-description', description);

        // URL de redirección
        const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
        const finalRedirectUrl = redirectUrl || `${baseUrl}/checkout/success`;
        script.setAttribute('data-redirection-url', finalRedirectUrl);

        // Embedded checkout (sin salir de la página)
        if (embedded) {
            script.setAttribute('data-render-mode', 'embedded');
        }

        // Datos del cliente (pre-llenar formulario de Bold)
        if (customerEmail || customerName || customerPhone) {
            const customerData = {
                email: customerEmail || '',
                fullName: customerName || '',
                phone: customerPhone || '',
                dialCode: '+57',
            };
            script.setAttribute('data-customer-data', JSON.stringify(customerData));
        }

        // Datos de ubicación
        if (customerAddress) {
            const billingAddress = {
                address: customerAddress,
                city: 'Bogotá',
                country: 'CO',
            };
            script.setAttribute('data-billing-address', JSON.stringify(billingAddress));
        }

        containerRef.current.appendChild(script);

        // Bold renderiza automáticamente el botón cuando se detecta el script
        // No es necesario llamar a ninguna función adicional
    }, [
        scriptLoaded,
        integrityHash,
        isLoading,
        orderId,
        amount,
        description,
        customerEmail,
        customerName,
        customerPhone,
        customerAddress,
        redirectUrl,
        buttonStyle,
        buttonSize,
        embedded,
    ]);

    // Mostrar estado de carga
    if (isLoading) {
        return (
            <div className={`flex items-center justify-center py-4 ${className}`}>
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                <span className="ml-3 text-gray-600">Preparando pago seguro...</span>
            </div>
        );
    }

    // Mostrar error
    if (error || !BOLD_IDENTITY_KEY) {
        return (
            <div className={`p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 ${className}`}>
                <p className="font-medium">Error de configuración de pago</p>
                <p className="text-sm mt-1">{error || 'Bold no está configurado correctamente'}</p>
            </div>
        );
    }

    return (
        <>
            {/* Script de Bold */}
            <Script
                src="https://checkout.bold.co/library/boldPaymentButton.js"
                strategy="lazyOnload"
                onLoad={() => setScriptLoaded(true)}
                onError={() => {
                    setError('Error cargando pasarela de pagos');
                    onError?.('Error cargando pasarela de pagos');
                }}
            />

            {/* Contenedor del botón */}
            <div
                ref={containerRef}
                className={`bold-pay-button-container ${className}`}
                style={{ opacity: disabled ? 0.5 : 1, pointerEvents: disabled ? 'none' : 'auto' }}
            />

            {/* Indicador de seguridad */}
            <p className="text-xs text-gray-500 text-center mt-2">
                🔒 Pago seguro procesado por Bold
            </p>
        </>
    );
}

export default BoldPayButton;
