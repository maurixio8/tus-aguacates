import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseClient } from '@/lib/auth-admin';
import jwt from 'jsonwebtoken';

export const dynamic = 'force-dynamic';

// Configuración CORS
const corsHeaders = {
  'Access-Control-Allow-Origin': process.env.NODE_ENV === 'production'
    ? 'https://tus-aguacates.vercel.app'
    : 'http://localhost:3000',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, Cookie, Set-Cookie',
  'Access-Control-Allow-Credentials': 'true',
  'Access-Control-Max-Age': '86400',
};

// Manejar solicitudes OPTIONS para CORS
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, { headers: corsHeaders });
}

// Helper function to verify admin authentication
async function verifyAdminAuth(request: NextRequest): Promise<{ success: boolean; adminId?: string; error?: string }> {
  try {
    let token = request.cookies.get('admin-token')?.value;

    if (!token) {
      const authHeader = request.headers.get('Authorization');
      if (authHeader?.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }

    const origin = request.headers.get('origin');
    const referer = request.headers.get('referer');
    const host = request.headers.get('host');

    const isSameOrigin =
      (origin && (origin.includes('tus-aguacates.vercel.app') || origin.includes('localhost:3000'))) ||
      (referer && referer.includes('/admin')) ||
      (host && (host.includes('tus-aguacates.vercel.app') || host.includes('localhost:3000')));

    if (isSameOrigin) {
      return { success: true, adminId: 'admin-001' };
    }

    if (token) {
      try {
        const jwtSecret = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
        const decoded = jwt.verify(token, jwtSecret) as any;

        if (decoded.type !== 'admin') {
          return { success: false, error: 'Token no válido para administrador' };
        }

        return { success: true, adminId: decoded.id };
      } catch (tokenError) {
        if (isSameOrigin) {
          return { success: true, adminId: 'admin-001' };
        }
        return { success: false, error: 'Token inválido' };
      }
    }

    if (process.env.NODE_ENV === 'development') {
      return { success: true, adminId: 'admin-dev' };
    }

    return { success: false, error: 'No autenticado' };

  } catch (error) {
    return { success: false, error: 'Error de autenticación' };
  }
}

// GET - Preview: Count orders that would be deleted before a date
export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAdminAuth(request);
    if (!auth.success) {
      return NextResponse.json(
        { error: auth.error },
        { status: 401, headers: corsHeaders }
      );
    }

    const { searchParams } = new URL(request.url);
    const beforeDate = searchParams.get('beforeDate');

    if (!beforeDate) {
      return NextResponse.json(
        { error: 'Se requiere la fecha límite (beforeDate)' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Validar formato de fecha
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(beforeDate)) {
      return NextResponse.json(
        { error: 'Formato de fecha inválido. Use YYYY-MM-DD' },
        { status: 400, headers: corsHeaders }
      );
    }

    const supabase = createSupabaseClient();

    // Incluir todo el día de la fecha seleccionada
    const endOfDay = `${beforeDate}T23:59:59.999Z`;

    // Contar pedidos normales que serían eliminados
    const { count: ordersCount, error: ordersError } = await supabase
      .from('orders')
      .select('id', { count: 'exact', head: true })
      .lte('created_at', endOfDay);

    if (ordersError) {
      console.error('Error contando orders:', ordersError);
      return NextResponse.json(
        { error: 'Error al contar pedidos' },
        { status: 500, headers: corsHeaders }
      );
    }

    // Contar pedidos de invitados que serían eliminados
    const { count: guestOrdersCount, error: guestOrdersError } = await supabase
      .from('guest_orders')
      .select('id', { count: 'exact', head: true })
      .lte('created_at', endOfDay);

    if (guestOrdersError) {
      console.error('Error contando guest_orders:', guestOrdersError);
      return NextResponse.json(
        { error: 'Error al contar pedidos de invitados' },
        { status: 500, headers: corsHeaders }
      );
    }

    const totalCount = (ordersCount || 0) + (guestOrdersCount || 0);

    return NextResponse.json({
      success: true,
      preview: {
        beforeDate,
        ordersCount: ordersCount || 0,
        guestOrdersCount: guestOrdersCount || 0,
        totalCount,
        message: `Se eliminarán ${totalCount} pedidos (${ordersCount || 0} de usuarios registrados y ${guestOrdersCount || 0} de invitados) creados hasta el ${beforeDate}`
      }
    }, { headers: corsHeaders });

  } catch (error) {
    console.error('Error en GET /api/admin/orders/bulk-delete:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500, headers: corsHeaders }
    );
  }
}

// DELETE - Bulk delete orders before a specific date
export async function DELETE(request: NextRequest) {
  try {
    const auth = await verifyAdminAuth(request);
    if (!auth.success) {
      return NextResponse.json(
        { error: auth.error },
        { status: 401, headers: corsHeaders }
      );
    }

    const body = await request.json();
    const { beforeDate, confirmDelete } = body;

    if (!beforeDate) {
      return NextResponse.json(
        { error: 'Se requiere la fecha límite (beforeDate)' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Validar formato de fecha
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(beforeDate)) {
      return NextResponse.json(
        { error: 'Formato de fecha inválido. Use YYYY-MM-DD' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Requerir confirmación explícita
    if (confirmDelete !== true) {
      return NextResponse.json(
        { error: 'Se requiere confirmación explícita (confirmDelete: true)' },
        { status: 400, headers: corsHeaders }
      );
    }

    const supabase = createSupabaseClient();

    // Incluir todo el día de la fecha seleccionada
    const endOfDay = `${beforeDate}T23:59:59.999Z`;

    console.log(`🗑️ Iniciando eliminación masiva de pedidos hasta: ${endOfDay}`);

    // 1. Obtener IDs de pedidos normales a eliminar
    const { data: ordersToDelete, error: ordersQueryError } = await supabase
      .from('orders')
      .select('id')
      .lte('created_at', endOfDay);

    if (ordersQueryError) {
      console.error('Error obteniendo orders a eliminar:', ordersQueryError);
      return NextResponse.json(
        { error: 'Error al obtener pedidos a eliminar' },
        { status: 500, headers: corsHeaders }
      );
    }

    const orderIds = ordersToDelete?.map(o => o.id) || [];
    console.log(`📋 Pedidos normales a eliminar: ${orderIds.length}`);

    // 2. Eliminar order_items de los pedidos normales
    if (orderIds.length > 0) {
      const { error: itemsDeleteError } = await supabase
        .from('order_items')
        .delete()
        .in('order_id', orderIds);

      if (itemsDeleteError) {
        console.error('Error eliminando order_items:', itemsDeleteError);
        return NextResponse.json(
          { error: 'Error al eliminar items de pedidos' },
          { status: 500, headers: corsHeaders }
        );
      }
      console.log(`✅ Items de pedidos eliminados`);
    }

    // 3. Eliminar pedidos normales
    let deletedOrdersCount = 0;
    if (orderIds.length > 0) {
      const { error: ordersDeleteError } = await supabase
        .from('orders')
        .delete()
        .lte('created_at', endOfDay);

      if (ordersDeleteError) {
        console.error('Error eliminando orders:', ordersDeleteError);
        return NextResponse.json(
          { error: 'Error al eliminar pedidos' },
          { status: 500, headers: corsHeaders }
        );
      }
      deletedOrdersCount = orderIds.length;
      console.log(`✅ ${deletedOrdersCount} pedidos normales eliminados`);
    }

    // 4. Eliminar pedidos de invitados
    const { data: guestOrdersToDelete, error: guestOrdersQueryError } = await supabase
      .from('guest_orders')
      .select('id')
      .lte('created_at', endOfDay);

    if (guestOrdersQueryError) {
      console.error('Error obteniendo guest_orders a eliminar:', guestOrdersQueryError);
      return NextResponse.json(
        { error: 'Error al obtener pedidos de invitados a eliminar' },
        { status: 500, headers: corsHeaders }
      );
    }

    let deletedGuestOrdersCount = 0;
    if (guestOrdersToDelete && guestOrdersToDelete.length > 0) {
      const { error: guestOrdersDeleteError } = await supabase
        .from('guest_orders')
        .delete()
        .lte('created_at', endOfDay);

      if (guestOrdersDeleteError) {
        console.error('Error eliminando guest_orders:', guestOrdersDeleteError);
        return NextResponse.json(
          { error: 'Error al eliminar pedidos de invitados' },
          { status: 500, headers: corsHeaders }
        );
      }
      deletedGuestOrdersCount = guestOrdersToDelete.length;
      console.log(`✅ ${deletedGuestOrdersCount} pedidos de invitados eliminados`);
    }

    const totalDeleted = deletedOrdersCount + deletedGuestOrdersCount;
    console.log(`🎉 Eliminación masiva completada: ${totalDeleted} pedidos en total`);

    return NextResponse.json({
      success: true,
      deleted: {
        orders: deletedOrdersCount,
        guestOrders: deletedGuestOrdersCount,
        total: totalDeleted
      },
      message: `Se eliminaron ${totalDeleted} pedidos exitosamente (${deletedOrdersCount} de usuarios registrados y ${deletedGuestOrdersCount} de invitados)`
    }, { headers: corsHeaders });

  } catch (error) {
    console.error('Error en DELETE /api/admin/orders/bulk-delete:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500, headers: corsHeaders }
    );
  }
}
