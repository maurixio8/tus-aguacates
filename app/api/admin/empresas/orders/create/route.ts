import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// POST - Crear pedido B2B desde admin
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      customer_name,
      customer_email,
      customer_phone,
      total_amount,
      status,
      payment_method,
      order_data
    } = body;

    if (!customer_name || !total_amount) {
      return NextResponse.json(
        { success: false, error: 'Faltan datos requeridos' },
        { status: 400 }
      );
    }

    // Asegurarse de que isB2B está en order_data
    const finalOrderData = {
      ...order_data,
      isB2B: true
    };

    const { data, error } = await supabase
      .from('guest_orders')
      .insert({
        customer_name,
        customer_email: customer_email || null,
        customer_phone: customer_phone || null,
        total_amount,
        status: status || 'pending',
        payment_method: payment_method || 'pending',
        order_data: finalOrderData,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating B2B order:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, order: data });

  } catch (error) {
    console.error('Error in create B2B order API:', error);
    return NextResponse.json(
      { success: false, error: 'Error del servidor' },
      { status: 500 }
    );
  }
}
