/**
 * API Route: Bold Webhook Handler
 * 
 * Recibe notificaciones de Bold sobre el estado de las transacciones.
 * Configurar en: Panel Bold → Integraciones → Webhooks
 * URL: https://tus-aguacates.vercel.app/api/webhooks/bold
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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
        const payload: BoldWebhookPayload = await request.json();

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
