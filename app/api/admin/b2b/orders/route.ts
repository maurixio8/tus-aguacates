import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(request: NextRequest) {
    try {
        // Obtener todos los pedidos B2B con información de la empresa
        const { data: orders, error } = await supabase
            .from('b2b_orders')
            .select(`
        id,
        order_number,
        company_id,
        subtotal,
        total,
        status,
        payment_status,
        delivery_date,
        created_at,
        b2b_companies (
          company_name
        )
      `)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching B2B orders:', error);
            return NextResponse.json(
                { success: false, error: 'Error al obtener pedidos' },
                { status: 500 }
            );
        }

        // Obtener conteo de items por pedido
        const { data: orderItems } = await supabase
            .from('b2b_order_items')
            .select('order_id');

        const itemsByOrder: Record<string, number> = {};
        orderItems?.forEach((item: any) => {
            if (item.order_id) {
                itemsByOrder[item.order_id] = (itemsByOrder[item.order_id] || 0) + 1;
            }
        });

        // Formatear respuesta
        const formattedOrders = orders?.map((order: any) => ({
            id: order.id,
            order_number: order.order_number,
            company_id: order.company_id,
            company_name: order.b2b_companies?.company_name || 'Empresa',
            subtotal: order.subtotal,
            total: order.total,
            status: order.status,
            payment_status: order.payment_status,
            delivery_date: order.delivery_date,
            created_at: order.created_at,
            items_count: itemsByOrder[order.id] || 0,
        })) || [];

        return NextResponse.json({ success: true, orders: formattedOrders });
    } catch (error) {
        console.error('Error in B2B orders API:', error);
        return NextResponse.json(
            { success: false, error: 'Error interno del servidor' },
            { status: 500 }
        );
    }
}
