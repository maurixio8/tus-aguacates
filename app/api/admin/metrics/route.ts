import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { createSupabaseClient } from '@/lib/auth-admin';

export const dynamic = 'force-dynamic';

// Configuración CORS para permitir el dashboard
const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://admin-dashboard-m9p6qyz27-mauricio-s-projects-2bf4b7a2.vercel.app',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
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
    // Get the admin-token from cookie OR Authorization header
    let token = request.cookies.get('admin-token')?.value;

    // If no cookie, check Authorization header
    if (!token) {
      const authHeader = request.headers.get('Authorization');
      if (authHeader?.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }

    // For same-origin requests from admin dashboard, check referer
    const referer = request.headers.get('referer');
    const isSameOrigin = referer?.includes('/admin');

    if (!token && isSameOrigin) {
      // Allow same-origin requests without token for dashboard
      return { success: true, adminId: 'admin-001' };
    }

    if (!token) {
      return { success: false, error: 'No autenticado' };
    }

    // Verify the JWT token
    const jwtSecret = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
    const decoded = jwt.verify(token, jwtSecret) as any;

    // Check if this is an admin token
    if (decoded.type !== 'admin') {
      return { success: false, error: 'Token no válido para administrador' };
    }

    return { success: true, adminId: decoded.id };

  } catch (error) {
    return { success: false, error: 'Error de autenticación' };
  }
}

// GET - Dashboard metrics
export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication
    const auth = await verifyAdminAuth(request);
    if (!auth.success) {
      return NextResponse.json(
        { error: auth.error },
        { status: 401, headers: corsHeaders }
      );
    }

    const supabase = createSupabaseClient();

    // Obtener fechas para filtros
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59).toISOString();

    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - 7);
    const weekStartISO = weekStart.toISOString();

    // ==================== VENTAS DE HOY ====================
    const { data: todayOrders, error: todayError } = await supabase
      .from('orders')
      .select(`
        id,
        total_amount,
        order_items (
          quantity,
          unit_price,
          subtotal,
          product_id,
          product_snapshot
        )
      `)
      .gte('created_at', todayStart)
      .lte('created_at', todayEnd);

    const todayRevenue = todayOrders?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0;
    const todayOrdersCount = todayOrders?.length || 0;

    // Calcular productos más vendidos hoy
    const productSales: Record<string, { name: string; quantity: number; revenue: number }> = {};
    todayOrders?.forEach(order => {
      order.order_items?.forEach((item: any) => {
        const productName = item.product_snapshot?.name || 'Producto';
        const productId = item.product_id;
        if (!productSales[productId]) {
          productSales[productId] = { name: productName, quantity: 0, revenue: 0 };
        }
        productSales[productId].quantity += item.quantity || 0;
        productSales[productId].revenue += item.subtotal || (item.unit_price * item.quantity) || 0;
      });
    });

    const topProducts = Object.values(productSales)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    // ==================== PEDIDOS PENDIENTES ====================
    const { count: pendingCount, error: pendingError } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('order_status', 'pendiente');

    // ==================== ENTREGAS PENDIENTES (próximas) ====================
    const { data: pendingOrders, error: pendingOrdersError } = await supabase
      .from('orders')
      .select(`
        id,
        order_items (
          quantity,
          product_snapshot
        )
      `)
      .eq('order_status', 'pendiente')
      .limit(10);

    // Agregar productos pendientes de entregar
    const pendingProducts: Record<string, { name: string; quantity: number }> = {};
    pendingOrders?.forEach(order => {
      order.order_items?.forEach((item: any) => {
        const productName = item.product_snapshot?.name || 'Producto';
        if (!pendingProducts[productName]) {
          pendingProducts[productName] = { name: productName, quantity: 0 };
        }
        pendingProducts[productName].quantity += item.quantity || 0;
      });
    });

    const pendingProductsList = Object.values(pendingProducts)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 8);

    // ==================== VENTAS DE LA SEMANA ====================
    const { data: weekOrders, error: weekError } = await supabase
      .from('orders')
      .select('id, total_amount, order_items(product_id, subtotal, product_snapshot)')
      .gte('created_at', weekStartISO);

    const weekRevenue = weekOrders?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0;
    const weekOrdersCount = weekOrders?.length || 0;

    // ==================== VENTAS POR CATEGORÍA (última semana) ====================
    const categoryStats: Record<string, number> = {};
    weekOrders?.forEach(order => {
      order.order_items?.forEach((item: any) => {
        const category = item.product_snapshot?.category || 'General';
        if (!categoryStats[category]) {
          categoryStats[category] = 0;
        }
        categoryStats[category] += item.subtotal || 0;
      });
    });

    // ==================== CONSTRUIR RESPUESTA ====================
    const metrics = {
      today: {
        orders: todayOrdersCount,
        revenue: todayRevenue,
        topProducts: topProducts
      },
      pending: {
        count: pendingCount || 0
      },
      tomorrow: {
        ordersCount: pendingOrders?.length || 0,
        products: pendingProductsList
      },
      week: {
        orders: weekOrdersCount,
        revenue: weekRevenue
      },
      categoryStats: categoryStats
    };

    console.log('📊 [Metrics API] Dashboard metrics loaded:', {
      todayOrders: todayOrdersCount,
      todayRevenue,
      pendingCount,
      weekOrders: weekOrdersCount
    });

    return NextResponse.json({
      success: true,
      metrics: metrics
    }, { headers: corsHeaders });

  } catch (error) {
    console.error('❌ [Metrics API] Error fetching metrics:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500, headers: corsHeaders }
    );
  }
}