/**
 * Bold Payments - Tipos TypeScript
 * Documentación: https://developers.bold.co/pagos-en-linea/link-de-pagos/integracion-api
 */

// ============================================
// ENUMS Y TIPOS BASE
// ============================================

/**
 * Estados posibles de una transacción Bold
 */
export type BoldPaymentStatus =
    | 'PENDING'      // Link creado, esperando pago
    | 'APPROVED'     // Pago aprobado exitosamente
    | 'REJECTED'     // Pago rechazado
    | 'CANCELLED'    // Pago cancelado
    | 'EXPIRED'      // Link expirado sin pago
    | 'VOIDED';      // Transacción anulada

/**
 * Métodos de pago disponibles en Bold
 */
export type BoldPaymentMethod =
    | 'CARD'         // Tarjeta crédito/débito
    | 'PSE'          // PSE (Pagos Seguros en Línea)
    | 'NEQUI'        // Billetera digital Nequi
    | 'DAVIPLATA';   // Billetera digital Daviplata

/**
 * Tipo de monto para el link de pago
 */
export type BoldAmountType =
    | 'OPEN'         // El cliente decide el monto
    | 'CLOSE';       // Monto fijo definido por el comercio

// ============================================
// REQUEST TYPES
// ============================================

/**
 * Payload para crear un link de pago en Bold
 * POST /online/link/v1
 */
export interface BoldPaymentLinkRequest {
    /** Monto del pago en centavos (ej: 100000 = $1,000 COP) */
    amount_in_cents: number;

    /** Moneda del pago (por defecto COP para Colombia) */
    currency?: 'COP';

    /** Descripción del producto o servicio */
    description: string;

    /** Referencia única del pedido (order_id, invoice_number, etc.) */
    order_id: string;

    /** Tipo de monto: OPEN (cliente decide) o CLOSE (monto fijo) */
    amount_type?: BoldAmountType;

    /** URL a la que redirigir después del pago */
    redirect_url?: string;

    /** Fecha de expiración del link (ISO 8601) */
    expiration_date?: string;

    /** Métodos de pago permitidos (si no se especifica, todos los habilitados) */
    payment_methods?: BoldPaymentMethod[];

    /** Email del cliente para notificaciones */
    customer_email?: string;

    /** Nombre del cliente */
    customer_name?: string;

    /** Teléfono del cliente */
    customer_phone?: string;

    /** Datos adicionales personalizados */
    metadata?: Record<string, string>;
}

/**
 * Respuesta al crear un link de pago exitosamente
 */
export interface BoldPaymentLinkResponse {
    /** ID único del link de pago */
    payment_link_id: string;

    /** URL del link de pago para compartir con el cliente */
    payment_link_url: string;

    /** Estado actual del link */
    status: BoldPaymentStatus;

    /** Monto en centavos */
    amount_in_cents: number;

    /** Referencia del pedido */
    order_id: string;

    /** Fecha de creación */
    created_at: string;

    /** Fecha de expiración */
    expires_at?: string;
}

/**
 * Respuesta de error de la API de Bold
 */
export interface BoldApiError {
    /** Código del error */
    error_code: string;

    /** Mensaje descriptivo del error */
    error_message: string;

    /** Detalles adicionales */
    details?: Record<string, unknown>;
}

// ============================================
// WEBHOOK TYPES
// ============================================

/**
 * Tipos de eventos de webhook de Bold
 */
export type BoldWebhookEventType =
    | 'payment.approved'     // Venta aprobada
    | 'payment.rejected'     // Venta rechazada
    | 'void.approved'        // Anulación aprobada
    | 'void.rejected';       // Anulación rechazada

/**
 * Información del pago en el webhook
 */
export interface BoldWebhookPaymentInfo {
    /** ID de la transacción */
    transaction_id: string;

    /** ID del link de pago */
    payment_link_id: string;

    /** Referencia del pedido original */
    order_id: string;

    /** Monto pagado en centavos */
    amount_in_cents: number;

    /** Método de pago utilizado */
    payment_method: BoldPaymentMethod;

    /** Estado del pago */
    status: BoldPaymentStatus;

    /** Últimos 4 dígitos de la tarjeta (si aplica) */
    card_last_four?: string;

    /** Franquicia de la tarjeta (VISA, MASTERCARD, etc.) */
    card_brand?: string;

    /** Fecha de la transacción */
    transaction_date: string;
}

/**
 * Información del cliente en el webhook
 */
export interface BoldWebhookCustomerInfo {
    email?: string;
    name?: string;
    phone?: string;
}

/**
 * Payload completo del webhook de Bold
 */
export interface BoldWebhookPayload {
    /** Tipo de evento */
    event_type: BoldWebhookEventType;

    /** ID único del evento */
    event_id: string;

    /** Timestamp del evento */
    timestamp: string;

    /** Información del pago */
    payment: BoldWebhookPaymentInfo;

    /** Información del cliente */
    customer?: BoldWebhookCustomerInfo;

    /** Datos adicionales (metadata enviada al crear el link) */
    metadata?: Record<string, string>;
}

// ============================================
// INTERNAL TYPES
// ============================================

/**
 * Resultado de la verificación del webhook
 */
export interface BoldWebhookVerificationResult {
    /** Si la firma es válida */
    is_valid: boolean;

    /** Mensaje de error si no es válido */
    error_message?: string;
}

/**
 * Configuración del cliente de Bold
 */
export interface BoldClientConfig {
    /** API Key de Bold */
    api_key: string;

    /** Secret Key para verificar webhooks */
    secret_key?: string;

    /** Ambiente: sandbox o production */
    environment: 'sandbox' | 'production';

    /** URL de redirección después del pago */
    default_redirect_url?: string;
}
