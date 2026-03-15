/**
 * API Route: Bold Webhook Handler
 *
 * Recibe notificaciones de Bold sobre el estado de las transacciones.
 * Configurar en: Panel Bold → Integraciones → Webhooks
 * URL: https://tus-aguacates.vercel.app/api/webhooks/bold
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createHmac, timingSafeEqual } from 'crypto';

/**
 * Verify webhook signature from Bold
 * Bold signs webhooks using HMAC-SHA256
 */
function verifyWebhookSignature(payload: string, signature?: string): boolean {
    const signingSecret = process.env.BOLD_SIGNING_SECRET;

    if (!signingSecret) {
        console.warn('[Bold Webhook] ⚠️ BOLD_SIGNING_SECRET not configured - skipping signature verification');
        return false;
    }

    if (!signature) {
        console.warn('[Bold Webhook] ⚠️ No signature header found');
        return false;
    }

    try {
        const hmac = createHmac('sha256', signingSecret);
        hmac.update(payload);
        const expectedSignature = hmac.digest('hex');

        if (signature.length !== expectedSignature.length) {
            return false;
        }

        const isValid = timingSafeEqual(
            Buffer.from(signature),
            Buffer.from(expectedSignature)
        );

        if (!isValid) {
            console.error('[Bold Webhook] ❌ Invalid signature', {
                received: signature.substring(0, 20) + '...',
                expected: expectedSignature.substring(0, 20) + '...'
            });
        }

        return isValid;
    } catch (error) {
        console.error('[Bold Webhook] ❌ Error verifying signature:', error);
        return false;
    }
}

// Cliente de Supabase con service role para operaciones del servidor
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface BoldWebhookPayload {
    event_type: 'payment.approved' | 'payment.rejected' | 'void.approved' | 'void.rejected';
    event_id: string;
    timestamp: string;
    payment: {
        transaction_id: string;
        payment_link_id?: string;
        order_id: string;
        amount_in_cents: number;
        payment_method: string;
        status: string;
        card_last_four?: string;
        card_brand?: string;
        transaction_date: string;
    };
    customer?: {
        email?: string;
        name?: string;
        phone?: string;
    };
}

export async function POST(request: NextRequest) {
    try {
        // Get raw body for signature verification
        const rawBody = await request.text();
        const payload: BoldWebhookPayload = JSON.parse(rawBody);

        // Get signature from header (Bold uses x-signature or similar)
        const signature = request.headers.get('x-signature') || request.headers.get('x-bold-signature') || request.headers.get('bold-signature');

        // Verify webhook signature
        if (!verifyWebhookSignature(rawBody, signature ?? undefined)) {
            console.error('[Bold Webhook] ❌ Signature verification failed');
            return NextResponse.json(
                { error: 'Invalid signature' },
                { status: 401 }
            );
        }

        console.log('[Bold Webhook] ✅ Signature verified');
        console.log('[Bold Webhook] Received event:', payload.event_type, payload.event_id);
        console.log('[Bold Webhook] Order ID:', payload.payment.order_id);

        const { event_type, payment } = payload;
        const orderId = payment.order_id;

        // Determinar el nuevo estado según el evento
        let newStatus: string;
        let paymentStatus: string;
        let paidAt: string | null = null;

        switch (event_type) {
            case 'payment.approved':
                newStatus = 'pagado';
                paymentStatus = 'pagado';
                paidAt = new Date().toISOString();
                console.log('[Bold Webhook] Payment APPROVED for order:', orderId);
                break;

            case 'payment.rejected':
                newStatus = 'pago_fallido';
                paymentStatus = 'fallido';
                console.log('[Bold Webhook] Payment REJECTED for order:', orderId);
                break;

            case 'void.approved':
                newStatus = 'reembolsado';
                paymentStatus = 'reembolsado';
                console.log('[Bold Webhook] Void APPROVED for order:', orderId);
                break;

            case 'void.rejected':
                // No cambiar el estado si la anulación fue rechazada
                console.log('[Bold Webhook] Void REJECTED for order:', orderId);
                return NextResponse.json({ received: true, message: 'Void rejected, no action taken' });

            default:
                console.log('[Bold Webhook] Unknown event type:', event_type);
                return NextResponse.json({ received: true, message: 'Unknown event type' });
        }

        // Actualizar el pedido en guest_orders
        const { error: guestError } = await supabase
            .from('guest_orders')
            .update({
                status: newStatus,
                payment_status: paymentStatus,
                payment_method: 'bold',
                paid_at: paidAt,
                bold_transaction_id: payment.transaction_id,
                bold_payment_method: payment.payment_method,
                updated_at: new Date().toISOString(),
            })
            .eq('id', orderId);

        if (guestError) {
            console.error('[Bold Webhook] Error updating guest_orders:', guestError);

            // Intentar buscar en orders (pedidos de usuarios autenticados)
            const { error: orderError } = await supabase
                .from('orders')
                .update({
                    status: newStatus,
                    payment_status: paymentStatus,
                    payment_method: 'bold',
                    paid_at: paidAt,
                    bold_transaction_id: payment.transaction_id,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', orderId);

            if (orderError) {
                console.error('[Bold Webhook] Error updating orders:', orderError);
                // Aún respondemos 200 para que Bold no reintente
            }
        }

        console.log('[Bold Webhook] Successfully processed event for order:', orderId);

        // =====================================================
        // 🚀 NOTIFICAR A N8N PARA WHATSAPP
        // =====================================================
        // Enviamos la notificación a n8n solo si el pago fue aprobado
        if (event_type === 'payment.approved') {
            const n8nWebhookUrl = process.env.N8N_PAGO_BOLD_WEBHOOK_URL;
            
            if (n8nWebhookUrl) {
                try {
                    // Enviar datos del pago a n8n para notificación
                    await fetch(n8nWebhookUrl, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            event_type: payload.event_type,
                            event_id: payload.event_id,
                            timestamp: payload.timestamp,
                            payment: {
                                transaction_id: payment.transaction_id,
                                order_id: orderId,
                                amount_in_cents: payment.amount_in_cents,
                                amount: payment.amount_in_cents / 100,
                                payment_method: payment.payment_method,
                                status: payment.status,
                                card_last_four: payment.card_last_four,
                                card_brand: payment.card_brand,
                            },
                            customer: payload.customer
                        })
                    });
                    console.log('[Bold Webhook] ✅ Notificación enviada a n8n');
                } catch (n8nError) {
                    console.error('[Bold Webhook] ⚠️ Error enviando a n8n:', n8nError);
                }
            } else {
                console.warn('[Bold Webhook] ⚠️ N8N_PAGO_BOLD_WEBHOOK_URL no configurada - saltando notificación');
            }
        }

        return NextResponse.json({
            received: true,
            event_id: payload.event_id,
            order_id: orderId,
            status: newStatus,
        });

    } catch (error) {
        console.error('[Bold Webhook] Error processing webhook:', error);

        // Respondemos 200 para evitar reintentos innecesarios
        // Los errores se loguean para debugging
        return NextResponse.json({
            received: true,
            error: 'Internal processing error',
        });
    }
}

// Bold puede hacer una petición GET para verificar el endpoint
export async function GET(request: NextRequest) {
    return NextResponse.json({
        status: 'ok',
        service: 'Bold Webhook Handler',
        timestamp: new Date().toISOString(),
    });
}
