/**
 * API Routes para Órdenes B2B
 * "Tus Aguacates" - E-commerce Platform
 */

import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * GET /api/b2b/orders
 * Obtiene órdenes B2B (para empresas o admin)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Obtener parámetros
    const searchParams = request.nextUrl.searchParams;
    const company_id = searchParams.get('company_id');
    const status = searchParams.get('status');
    const payment_status = searchParams.get('payment_status');
    const date_from = searchParams.get('date_from');
    const date_to = searchParams.get('date_to');
    const page = parseInt(searchParams.get('page') || '1');
    const page_size = parseInt(searchParams.get('page_size') || '20');

    // Construir query
    let query = supabase
      .from('b2b_orders')
      .select(`
        *,
        company:b2b_companies(*),
        items:b2b_order_items(*)
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

    if (date_from) {
      query = query.gte('created_at', date_from);
    }

    if (date_to) {
      query = query.lte('created_at', date_to);
    }

    // Excluir borrados
    query = query.is('deleted_at', null);

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

    const total_pages = count ? Math.ceil(count / page_size) : 0;

    return NextResponse.json({
      success: true,
      data: orders || [],
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
    console.error('Error in B2B orders GET API:', error);
    return NextResponse.json(
      { success: false, error: { message: 'Error interno del servidor', code: 'INTERNAL_ERROR' } },
      { status: 500 }
    );
  }
}

/**
 * POST /api/b2b/orders
 * Crea una nueva orden B2B (usualmente ya se crea en checkout)
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = await request.json();

    // TODO: Validar y crear orden
    // Nota: La creación de órdenes se hace principalmente en /api/b2b/checkout
    // Este endpoint puede servir para crear órdenes desde el admin

    return NextResponse.json(
      { success: false, error: { message: 'Usa /api/b2b/checkout para crear órdenes', code: 'USE_CHECKOUT' } },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error in B2B orders POST API:', error);
    return NextResponse.json(
      { success: false, error: { message: 'Error interno del servidor', code: 'INTERNAL_ERROR' } },
      { status: 500 }
    );
  }
}
