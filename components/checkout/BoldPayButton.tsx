'use client';

import { useEffect, useState, useRef } from 'react';

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
    const containerRef = useRef<HTMLDivElement>(null);
    const [integrityHash, setIntegrityHash] = useState<string>('');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string>('');
    const scriptInjectedRef = useRef(false);

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
                console.log('[Bold] Hash received successfully');
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

    // Inyectar el botón de Bold cuando tengamos el hash
    useEffect(() => {
        if (!containerRef.current || !integrityHash || isLoading) return;
        if (scriptInjectedRef.current) return; // Evitar doble inyección

        // IMPORTANTE: Verificar que tenemos la API key antes de inyectar
        if (!BOLD_IDENTITY_KEY) {
            console.error('[Bold] NEXT_PUBLIC_BOLD_IDENTITY_KEY no está configurada');
            setError('Bold no está configurado correctamente. Por favor contacta al administrador.');
            return;
        }

        // URL de redirección
        const baseUrl = window.location.origin;
        const finalRedirectUrl = redirectUrl || `${baseUrl}/checkout/success`;

        // Limpiar contenedor
        containerRef.current.innerHTML = '';

        // IMPORTANTE: Crear el script con createElement para que se ejecute
        // innerHTML NO ejecuta scripts por seguridad del navegador
        const script = document.createElement('script');
        script.src = 'https://checkout.bold.co/library/boldPaymentButton.js';
        script.setAttribute('data-bold-button', 'dark-L');
        script.setAttribute('data-api-key', BOLD_IDENTITY_KEY);
        script.setAttribute('data-order-id', orderId);
        script.setAttribute('data-currency', 'COP');
        script.setAttribute('data-amount', amount.toString());
        script.setAttribute('data-integrity-signature', integrityHash);
        script.setAttribute('data-description', description);
        script.setAttribute('data-redirection-url', finalRedirectUrl);
        script.setAttribute('data-render-mode', 'embedded');

        // Datos del cliente
        if (customerEmail || customerName || customerPhone) {
            const customerData = {
                email: customerEmail || '',
                fullName: customerName || '',
                phone: customerPhone || '',
                dialCode: '+57',
            };
            script.setAttribute('data-customer-data', JSON.stringify(customerData));
        }

        // Dirección de facturación
        if (customerAddress) {
            const billingAddress = {
                address: customerAddress,
                city: 'Bogotá',
                country: 'CO',
            };
            script.setAttribute('data-billing-address', JSON.stringify(billingAddress));
        }

        script.onload = () => {
            console.log('[Bold] Button script executed successfully');
        };

        script.onerror = () => {
            console.error('[Bold] Failed to load button script');
            setError('Error cargando el botón de pago');
        };

        // Añadir script al contenedor - esto lo ejecutará
        containerRef.current.appendChild(script);
        scriptInjectedRef.current = true;
        console.log('[Bold] Script appended with createElement (will execute)');

    }, [integrityHash, isLoading, orderId, amount, description, customerEmail, customerName, customerPhone, customerAddress, redirectUrl]);

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

    // Contenedor para el botón de Bold
    return (
        <div className={className}>
            <div
                ref={containerRef}
                className="bold-button-container flex justify-center min-h-[60px]"
                style={{ opacity: disabled ? 0.5 : 1, pointerEvents: disabled ? 'none' : 'auto' }}
            />
            <p className="text-xs text-gray-500 text-center mt-2">
                🔒 Pago seguro procesado por Bold
            </p>
        </div>
    );
}

export default BoldPayButton;
