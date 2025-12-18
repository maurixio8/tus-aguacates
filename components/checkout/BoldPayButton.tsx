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
    const [buttonInjected, setButtonInjected] = useState(false);

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

    // Inyectar el botón de Bold cuando tengamos el hash (una sola vez)
    useEffect(() => {
        if (!containerRef.current || !integrityHash || isLoading || buttonInjected) return;

        // URL de redirección
        const baseUrl = window.location.origin;
        const finalRedirectUrl = redirectUrl || `${baseUrl}/checkout/success`;

        // Construir datos del cliente
        let customerDataAttr = '';
        if (customerEmail || customerName || customerPhone) {
            const customerData = {
                email: customerEmail || '',
                fullName: customerName || '',
                phone: customerPhone || '',
                dialCode: '+57',
            };
            customerDataAttr = `data-customer-data='${JSON.stringify(customerData)}'`;
        }

        // Construir dirección de facturación
        let billingAddressAttr = '';
        if (customerAddress) {
            const billingAddress = {
                address: customerAddress,
                city: 'Bogotá',
                country: 'CO',
            };
            billingAddressAttr = `data-billing-address='${JSON.stringify(billingAddress)}'`;
        }

        // Inyectar el script directamente usando innerHTML para evitar conflictos con React
        // Este enfoque evita que React intente reconciliar el DOM modificado por Bold
        containerRef.current.innerHTML = `
            <script
                src="https://checkout.bold.co/library/boldPaymentButton.js"
                data-bold-button="dark-L"
                data-api-key="${BOLD_IDENTITY_KEY}"
                data-order-id="${orderId}"
                data-currency="COP"
                data-amount="${amount}"
                data-integrity-signature="${integrityHash}"
                data-description="${description}"
                data-redirection-url="${finalRedirectUrl}"
                data-render-mode="embedded"
                ${customerDataAttr}
                ${billingAddressAttr}
            ></script>
        `;

        // Marcar como inyectado para no repetir
        setButtonInjected(true);
        console.log('[Bold] Button injected using innerHTML');

    }, [integrityHash, isLoading, buttonInjected, orderId, amount, description, customerEmail, customerName, customerPhone, customerAddress, redirectUrl]);

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
    // IMPORTANTE: No rendericemos nada dentro del div ref después de que Bold lo modifique
    return (
        <div className={className}>
            <div
                ref={containerRef}
                className="bold-button-container flex justify-center min-h-[60px]"
                style={{ opacity: disabled ? 0.5 : 1, pointerEvents: disabled ? 'none' : 'auto' }}
                // Indicar a React que no toque este contenedor
                suppressHydrationWarning={true}
            />
            <p className="text-xs text-gray-500 text-center mt-2">
                🔒 Pago seguro procesado por Bold
            </p>
        </div>
    );
}

export default BoldPayButton;
