import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAdminRole } from '@/lib/auth-admin';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const adminAccess = await requireAdminRole(request, 'admin');
        if (adminAccess.response) {
            return adminAccess.response;
        }

        const { id } = await params;
        const body = await request.json();

        const updateData: any = {};
        if (body.status) updateData.status = body.status;
        if (body.payment_status) updateData.payment_status = body.payment_status;
        if (body.delivery_date) updateData.delivery_date = body.delivery_date;

        updateData.updated_at = new Date().toISOString();

        const { data: order, error } = await supabase
            .from('b2b_orders')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Error updating B2B order:', error);
            return NextResponse.json(
                { success: false, error: 'Error al actualizar pedido' },
                { status: 500 }
            );
        }

        return NextResponse.json({ success: true, order });
    } catch (error) {
        console.error('Error in B2B order PATCH:', error);
        return NextResponse.json(
            { success: false, error: 'Error interno del servidor' },
            { status: 500 }
        );
    }
}

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const adminAccess = await requireAdminRole(request, 'viewer');
        if (adminAccess.response) {
            return adminAccess.response;
        }

        const { id } = await params;

        const { data: order, error } = await supabase
            .from('b2b_orders')
            .select(`
        *,
        b2b_companies (
          company_name,
          contact_name,
          contact_email,
          contact_phone
        ),
        b2b_order_items (
          id,
          product_id,
          product_name,
          quantity,
          unit_price,
          subtotal
        )
      `)
            .eq('id', id)
            .single();

        if (error) {
            console.error('Error fetching B2B order:', error);
            return NextResponse.json(
                { success: false, error: 'Pedido no encontrado' },
                { status: 404 }
            );
        }

        return NextResponse.json({ success: true, order });
    } catch (error) {
        console.error('Error in B2B order GET:', error);
        return NextResponse.json(
            { success: false, error: 'Error interno del servidor' },
            { status: 500 }
        );
    }
}
