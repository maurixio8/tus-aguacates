/**
 * API Routes para gestión admin de Órdenes B2B
 * "Tus Aguacates" - Panel de Administración
 */

import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * GET /api/admin/b2b/orders
 * Obtiene lista de órdenes B2B con filtros admin y paginación
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');
    const company_id = searchParams.get('company_id');
    const status = searchParams.get('status');
    const payment_status = searchParams.get('payment_status');
    const order_number = searchParams.get('order_number');
    const date_from = searchParams.get('date_from');
    const date_to = searchParams.get('date_to');
    const page = parseInt(searchParams.get('page') || '1');
    const page_size = parseInt(searchParams.get('page_size') || '20');

    // Si se pide una orden por ID, retornarla directamente
    if (id) {
      const { data: order, error } = await supabase
        .from('b2b_orders')
        .select(`
          *,
          company:b2b_companies(*),
          items:b2b_order_items(*)
        `)
        .eq('id', id)
        .maybeSingle();

      if (error) {
        return NextResponse.json(
          { success: false, error: { message: error.message, code: 'DB_ERROR' } },
          { status: 500 }
        );
      }

      if (!order) {
        return NextResponse.json(
          { success: false, error: { message: 'Orden no encontrada', code: 'NOT_FOUND' } },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        data: order,
      });
    }

    // Construir query
    let query = supabase
      .from('b2b_orders')
      .select(`
        *,
        company:b2b_companies(*)
      `, { count: 'exact' });

    // Aplicar filtros
    if (company_id) {
      query = query.eq('company_id', company_id);
    }

    if (status) {
      query = query.eq('status', status);
    }

    if (payment_status) {
      query = query.eq('payment_status', payment_status);
    }

    if (order_number) {
      query = query.ilike('order_number', `%${order_number}%`);
    }

    if (date_from) {
      query = query.gte('created_at', date_from);
    }

    if (date_to) {
      query = query.lte('created_at', date_to);
    }

    // No excluir órdenes borradas para admin

    // Ordenamiento
    query = query.order('created_at', { ascending: false });

    // Paginación
    const from = (page - 1) * page_size;
    const to = from + page_size - 1;
    query = query.range(from, to);

    const { data: orders, error, count } = await query;

    if (error) {
      console.error('Error fetching B2B orders:', error);
      return NextResponse.json(
        { success: false, error: { message: 'Error al obtener órdenes', code: 'DB_ERROR' } },
        { status: 500 }
      );
    }

    // Obtener items para todas las órdenes
    const orderIds = orders?.map((o: any) => o.id) || [];
    let ordersWithItems = orders || [];

    if (orderIds.length > 0) {
      const { data: items } = await supabase
        .from('b2b_order_items')
        .select('*')
        .in('order_id', orderIds);

      ordersWithItems = ordersWithItems.map((order: any) => ({
        ...order,
        items: items?.filter((item: any) => item.order_id === order.id) || [],
      }));
    }

    const total_pages = count ? Math.ceil(count / page_size) : 0;

    return NextResponse.json({
      success: true,
      data: ordersWithItems,
      meta: {
        pagination: {
          total: count || 0,
          page,
          page_size,
          total_pages,
          has_next: page < total_pages,
          has_previous: page > 1,
        },
      },
    });
  } catch (error) {
    console.error('Error in admin B2B orders GET API:', error);
    return NextResponse.json(
      { success: false, error: { message: 'Error interno del servidor', code: 'INTERNAL_ERROR' } },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/b2b/orders
 * Actualiza una orden B2B (estado, notas, etc)
 */
export async function PATCH(request: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: { message: 'ID de la orden es requerido', code: 'VALIDATION_ERROR' } },
        { status: 400 }
      );
    }

    const body = await request.json();

    // Campos permitidos para actualizar
    const allowedFields = [
      'status', 'payment_status', 'notes', 'internal_notes',
      'requested_delivery_date', 'customer_purchase_order'
    ];

    const updateData: any = {};
    allowedFields.forEach(field => {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    });

    const { data: order, error } = await supabase
      .from('b2b_orders')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating B2B order:', error);
      return NextResponse.json(
        { success: false, error: { message: error.message, code: 'DB_ERROR' } },
        { status: 400 }
      );
    }

    if (!order) {
      return NextResponse.json(
        { success: false, error: { message: 'Orden no encontrada', code: 'NOT_FOUND' } },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: order,
    });
  } catch (error) {
    console.error('Error in admin B2B orders PATCH API:', error);
    return NextResponse.json(
      { success: false, error: { message: 'Error interno del servidor', code: 'INTERNAL_ERROR' } },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/b2b/orders
 * Soft delete de una orden B2B
 */
export async function DELETE(request: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: { message: 'ID de la orden es requerido', code: 'VALIDATION_ERROR' } },
        { status: 400 }
      );
    }

    const { data: order, error } = await supabase
      .from('b2b_orders')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error deleting B2B order:', error);
      return NextResponse.json(
        { success: false, error: { message: error.message, code: 'DB_ERROR' } },
        { status: 400 }
      );
    }

    if (!order) {
      return NextResponse.json(
        { success: false, error: { message: 'Orden no encontrada', code: 'NOT_FOUND' } },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { message: 'Orden eliminada correctamente' },
    });
  } catch (error) {
    console.error('Error in admin B2B orders DELETE API:', error);
    return NextResponse.json(
      { success: false, error: { message: 'Error interno del servidor', code: 'INTERNAL_ERROR' } },
      { status: 500 }
    );
  }
}
