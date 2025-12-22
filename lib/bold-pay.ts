/**
 * Bold Payments Service - Esqueleto de Integración
 * 
 * Este servicio maneja la integración con Bold Colombia para procesamiento de pagos.
 * NOTA: Este es un esqueleto - la implementación real requiere credenciales de Bold.
 * 
 * Documentación: https://developers.bold.co/pagos-en-linea/link-de-pagos/integracion-api
 */

import type {
    BoldPaymentLinkRequest,
    BoldPaymentLinkResponse,
    BoldWebhookPayload,
    BoldWebhookVerificationResult,
    BoldClientConfig,
    BoldApiError,
    BoldPaymentStatus,
} from './bold-types';

// ============================================
// CONFIGURATION
// ============================================

/**
 * URL base de la API de Bold
 */
const BOLD_API_BASE_URL = 'https://integrations.api.bold.co';

/**
 * Obtener configuración desde variables de entorno
 */
function getBoldConfig(): BoldClientConfig {
    const apiKey = process.env.BOLD_API_KEY;
    const secretKey = process.env.BOLD_SECRET_KEY;
    const environment = process.env.BOLD_ENVIRONMENT as 'sandbox' | 'production' || 'sandbox';
    const defaultRedirectUrl = process.env.BOLD_REDIRECT_URL || process.env.NEXT_PUBLIC_BASE_URL;

    if (!apiKey) {
        throw new Error('BOLD_API_KEY no está configurado en las variables de entorno');
    }

    return {
        api_key: apiKey,
        secret_key: secretKey,
        environment,
        default_redirect_url: defaultRedirectUrl,
    };
}

// ============================================
// API CLIENT
// ============================================

/**
 * Crear los headers de autenticación para Bold
 */
function getAuthHeaders(): HeadersInit {
    const config = getBoldConfig();

    return {
        'Authorization': `x-api-key ${config.api_key}`,
        'Content-Type': 'application/json',
    };
}

/**
 * Crear un link de pago en Bold
 * 
 * @param orderId - ID único del pedido
 * @param amountInCents - Monto total en centavos (ej: 50000 = $500 COP)
 * @param description - Descripción del pedido
 * @param options - Opciones adicionales
 * @returns Promise con la respuesta del link de pago
 * 
 * @example
 * const link = await createPaymentLink(
 *   'order-123',
 *   5000000, // $50,000 COP
 *   'Pedido de frutas y verduras'
 * );
 * console.log(link.payment_link_url); // URL para enviar al cliente
 */
export async function createPaymentLink(
    orderId: string,
    amountInCents: number,
    description: string,
    options?: {
        customerEmail?: string;
        customerName?: string;
        customerPhone?: string;
        redirectUrl?: string;
        expirationMinutes?: number;
        metadata?: Record<string, string>;
    }
): Promise<BoldPaymentLinkResponse> {
    const config = getBoldConfig();

    // Calcular fecha de expiración (por defecto 24 horas)
    const expirationDate = new Date();
    expirationDate.setMinutes(expirationDate.getMinutes() + (options?.expirationMinutes || 1440));

    const requestBody: BoldPaymentLinkRequest = {
        amount_in_cents: amountInCents,
        currency: 'COP',
        description,
        order_id: orderId,
        amount_type: 'CLOSE', // Monto fijo
        redirect_url: options?.redirectUrl || config.default_redirect_url,
        expiration_date: expirationDate.toISOString(),
        customer_email: options?.customerEmail,
        customer_name: options?.customerName,
        customer_phone: options?.customerPhone,
        metadata: options?.metadata,
    };

    // TODO: Implementar llamada real cuando tengamos credenciales
    // const response = await fetch(`${BOLD_API_BASE_URL}/online/link/v1`, {
    //   method: 'POST',
    //   headers: getAuthHeaders(),
    //   body: JSON.stringify(requestBody),
    // });

    // if (!response.ok) {
    //   const error: BoldApiError = await response.json();
    //   throw new Error(`Bold API Error: ${error.error_message}`);
    // }

    // return response.json();

    // Respuesta mock para desarrollo
    console.warn('[Bold Pay] createPaymentLink called in development mode');
    return {
        payment_link_id: `mock-${orderId}`,
        payment_link_url: `https://checkout.bold.co/mock/${orderId}`,
        status: 'PENDING',
        amount_in_cents: amountInCents,
        order_id: orderId,
        created_at: new Date().toISOString(),
        expires_at: expirationDate.toISOString(),
    };
}

/**
 * Consultar el estado de un link de pago
 * 
 * @param linkId - ID del link de pago
 * @returns Promise con el estado actual del link
 */
export async function getPaymentLinkStatus(
    linkId: string
): Promise<BoldPaymentLinkResponse> {
    // TODO: Implementar llamada real cuando tengamos credenciales
    // const response = await fetch(`${BOLD_API_BASE_URL}/online/link/v1/${linkId}`, {
    //   method: 'GET',
    //   headers: getAuthHeaders(),
    // });

    // if (!response.ok) {
    //   const error: BoldApiError = await response.json();
    //   throw new Error(`Bold API Error: ${error.error_message}`);
    // }

    // return response.json();

    console.warn('[Bold Pay] getPaymentLinkStatus called in development mode');
    return {
        payment_link_id: linkId,
        payment_link_url: `https://checkout.bold.co/mock/${linkId}`,
        status: 'PENDING',
        amount_in_cents: 0,
        order_id: 'unknown',
        created_at: new Date().toISOString(),
    };
}

// ============================================
// WEBHOOK HANDLING
// ============================================

/**
 * Verificar la firma de un webhook de Bold
 * 
 * @param payload - Cuerpo del webhook (string raw)
 * @param signature - Firma del header (si aplica)
 * @returns Resultado de la verificación
 */
export function verifyWebhookSignature(
    payload: string,
    signature?: string
): BoldWebhookVerificationResult {
    const config = getBoldConfig();

    // TODO: Implementar verificación de firma cuando tengamos documentación
    // La verificación exacta depende de cómo Bold firma sus webhooks
    // Puede ser HMAC-SHA256, RSA, etc.

    if (!config.secret_key) {
        console.warn('[Bold Pay] No secret key configured for webhook verification');
        return {
            is_valid: true, // En desarrollo, aceptar todos
            error_message: 'No secret key configured - skipping verification',
        };
    }

    // TODO: Implementar verificación real
    // Example with HMAC-SHA256:
    // const crypto = require('crypto');
    // const expectedSignature = crypto
    //   .createHmac('sha256', config.secret_key)
    //   .update(payload)
    //   .digest('hex');
    // return { is_valid: expectedSignature === signature };

    console.warn('[Bold Pay] verifyWebhookSignature called in development mode');
    return {
        is_valid: true,
    };
}

/**
 * Procesar un evento de webhook de Bold
 * 
 * @param payload - Payload del webhook parseado
 * @returns Resultado del procesamiento
 */
export async function handleWebhookEvent(
    payload: BoldWebhookPayload
): Promise<{ success: boolean; message: string }> {
    const { event_type, payment, event_id } = payload;

    console.log(`[Bold Pay] Processing webhook event: ${event_type} (${event_id})`);

    switch (event_type) {
        case 'payment.approved':
            // TODO: Actualizar el estado del pedido a "pagado"
            // - Buscar pedido por payment.order_id
            // - Actualizar payment_status a 'completed'
            // - Enviar confirmación al cliente
            console.log(`[Bold Pay] Payment approved for order: ${payment.order_id}`);
            return {
                success: true,
                message: `Payment approved for order ${payment.order_id}`,
            };

        case 'payment.rejected':
            // TODO: Manejar pago rechazado
            // - Actualizar payment_status a 'failed'
            // - Notificar al cliente
            console.log(`[Bold Pay] Payment rejected for order: ${payment.order_id}`);
            return {
                success: true,
                message: `Payment rejected for order ${payment.order_id}`,
            };

        case 'void.approved':
            // TODO: Manejar anulación aprobada
            // - Actualizar estado del pedido
            // - Procesar reembolso si aplica
            console.log(`[Bold Pay] Void approved for order: ${payment.order_id}`);
            return {
                success: true,
                message: `Void approved for order ${payment.order_id}`,
            };

        case 'void.rejected':
            console.log(`[Bold Pay] Void rejected for order: ${payment.order_id}`);
            return {
                success: true,
                message: `Void rejected for order ${payment.order_id}`,
            };

        default:
            console.warn(`[Bold Pay] Unknown event type: ${event_type}`);
            return {
                success: false,
                message: `Unknown event type: ${event_type}`,
            };
    }
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Convertir pesos colombianos a centavos
 * @param pesos - Monto en pesos
 * @returns Monto en centavos
 */
export function pesosToCents(pesos: number): number {
    return Math.round(pesos * 100);
}

/**
 * Convertir centavos a pesos colombianos
 * @param cents - Monto en centavos
 * @returns Monto en pesos
 */
export function centsToPesos(cents: number): number {
    return cents / 100;
}

/**
 * Verificar si un estado de pago es exitoso
 * @param status - Estado del pago
 * @returns true si el pago fue exitoso
 */
export function isPaymentSuccessful(status: BoldPaymentStatus): boolean {
    return status === 'APPROVED';
}

/**
 * Verificar si un estado de pago es final (no cambiará)
 * @param status - Estado del pago
 * @returns true si el estado es final
 */
export function isPaymentFinal(status: BoldPaymentStatus): boolean {
    return ['APPROVED', 'REJECTED', 'CANCELLED', 'EXPIRED', 'VOIDED'].includes(status);
}
