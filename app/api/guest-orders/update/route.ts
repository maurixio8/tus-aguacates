import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

/**
 * POST - Update guest order status and payment information
 * This API route uses service_role to securely update guest_orders
 * while maintaining RLS security for other operations
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      orderId,
      status,
      payment_status,
      payment_method,
      paid_at,
      whatsapp_message,
      whatsapp_sent
    } = body;

    console.log('📝 API: Updating guest order:', { orderId, status, payment_status, payment_method });

    // Validation
    if (!orderId) {
      return NextResponse.json(
        { success: false, error: 'Order ID es requerido' },
        { status: 400 }
      );
    }

    // Validate environment variables
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('❌ API: Missing Supabase environment variables');
      return NextResponse.json(
        { success: false, error: 'Configuración del servidor incompleta' },
        { status: 500 }
      );
    }

    // Use service_role client to bypass RLS for this specific operation
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // First, verify the order exists and is recent (created in last 24 hours)
    // This prevents abuse of updating old orders
    const { data: existingOrder, error: fetchError } = await supabase
      .from('guest_orders')
      .select('id, created_at, status')
      .eq('id', orderId)
      .single();

    if (fetchError || !existingOrder) {
      console.error('❌ Order not found:', { orderId, error: fetchError });
      return NextResponse.json(
        { success: false, error: 'Pedido no encontrado' },
        { status: 404 }
      );
    }

    // Check if order was created in the last 24 hours
    const orderAge = Date.now() - new Date(existingOrder.created_at).getTime();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

    if (orderAge > maxAge) {
      console.error('❌ Order too old to update:', { orderId, orderAge, maxAge });
      return NextResponse.json(
        { success: false, error: 'Este pedido no puede ser actualizado (muy antiguo)' },
        { status: 403 }
      );
    }

    // Only allow updating these specific fields (security measure)
    const allowedUpdates: any = {};

    if (status !== undefined) allowedUpdates.status = status;
    if (payment_status !== undefined) allowedUpdates.payment_status = payment_status;
    if (payment_method !== undefined) allowedUpdates.payment_method = payment_method;
    if (paid_at !== undefined) allowedUpdates.paid_at = paid_at;
    if (whatsapp_message !== undefined) allowedUpdates.whatsapp_message = whatsapp_message;
    if (whatsapp_sent !== undefined) allowedUpdates.whatsapp_sent = whatsapp_sent;

    if (Object.keys(allowedUpdates).length === 0) {
      return NextResponse.json(
        { success: false, error: 'No hay campos para actualizar' },
        { status: 400 }
      );
    }

    // Update the order
    const { data: updatedOrder, error: updateError } = await supabase
      .from('guest_orders')
      .update(allowedUpdates)
      .eq('id', orderId)
      .select()
      .single();

    if (updateError) {
      console.error('❌ Error updating order:', updateError);
      return NextResponse.json(
        { success: false, error: 'Error al actualizar el pedido' },
        { status: 500 }
      );
    }

    console.log('✅ Order updated successfully:', { orderId, updates: allowedUpdates });

    // Also increment coupon usage if this is a payment confirmation
    // and we haven't counted this order yet
    if (payment_status === 'pagado' && existingOrder.status !== 'pagado') {
      // This is a new payment, not an update of an already paid order
      // Future implementation: Track coupon usage here
      console.log('💰 Payment confirmed for order:', orderId);
    }

    return NextResponse.json({
      success: true,
      order: updatedOrder,
      message: 'Pedido actualizado correctamente'
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('❌ API: Unexpected error updating guest order:', errorMessage);

    return NextResponse.json(
      {
        success: false,
        error: 'Error interno del servidor',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      },
      { status: 500 }
    );
  }
}
