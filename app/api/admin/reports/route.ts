import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
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

// GET - Generate reports
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

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'sales';
    const dateFrom = searchParams.get('dateFrom') || '';
    const dateTo = searchParams.get('dateTo') || '';

    const supabase = createSupabaseClient();

    let reportData = {};

    switch (type) {
      case 'sales':
        // Sales report
        let salesQuery = supabase
          .from('orders')
          .select(`
            id,
            total_amount,
            order_status,
            created_at,
            customer_name,
            order_items (
              quantity,
              price,
              products:product_id (
                name
              )
            )
          `)
          .order('created_at', { ascending: false });

        if (dateFrom) {
          salesQuery = salesQuery.gte('created_at', dateFrom);
        }
        if (dateTo) {
          salesQuery = salesQuery.lte('created_at', dateTo + 'T23:59:59');
        }

        const { data: salesData, error: salesError } = await salesQuery;

        if (salesError) {
          console.error('❌ [Reports API] Error generating sales report:', salesError);
          return NextResponse.json(
            { error: 'Error al generar reporte de ventas' },
            { status: 500, headers: corsHeaders }
          );
        }

        // Calculate sales summary
        const totalSales = salesData?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0;
        const completedSales = salesData?.filter(order => order.order_status === 'completado') || [];
        const totalCompletedSales = completedSales.reduce((sum, order) => sum + (order.total_amount || 0), 0);

        reportData = {
          type: 'sales',
          summary: {
            totalOrders: salesData?.length || 0,
            totalSales,
            completedOrders: completedSales.length,
            totalCompletedSales,
            averageOrderValue: salesData?.length > 0 ? totalSales / salesData.length : 0
          },
          orders: salesData || []
        };
        break;

      case 'products':
        // Products report
        const { data: productsData, error: productsError } = await supabase
          .from('products')
          .select(`
            id,
            name,
            price,
            stock,
            is_active,
            category_id,
            categories:category_id (
              name
            )
          `)
          .order('created_at', { ascending: false });

        if (productsError) {
          console.error('❌ [Reports API] Error generating products report:', productsError);
          return NextResponse.json(
            { error: 'Error al generar reporte de productos' },
            { status: 500, headers: corsHeaders }
          );
        }

        // Calculate products summary
        const activeProducts = productsData?.filter(p => p.is_active) || [];
        const lowStockProducts = productsData?.filter(p => p.stock < 10 && p.is_active) || [];
        const totalStockValue = productsData?.reduce((sum, product) => sum + (product.price * product.stock), 0) || 0;

        reportData = {
          type: 'products',
          summary: {
            totalProducts: productsData?.length || 0,
            activeProducts: activeProducts.length,
            lowStockProducts: lowStockProducts.length,
            totalStockValue
          },
          products: productsData || []
        };
        break;

      case 'customers':
        // Customers report
        const { data: customersData, error: customersError } = await supabase
          .from('orders')
          .select(`
            customer_name,
            customer_email,
            customer_phone,
            total_amount,
            order_status,
            created_at
          `)
          .order('created_at', { ascending: false });

        if (customersError) {
          console.error('❌ [Reports API] Error generating customers report:', customersError);
          return NextResponse.json(
            { error: 'Error al generar reporte de clientes' },
            { status: 500, headers: corsHeaders }
          );
        }

        // Group by customer
        const customerMap = new Map();
        customersData?.forEach(order => {
          const key = order.customer_email || order.customer_phone;
          if (!customerMap.has(key)) {
            customerMap.set(key, {
              name: order.customer_name,
              email: order.customer_email,
              phone: order.customer_phone,
              totalOrders: 0,
              totalSpent: 0,
              lastOrder: order.created_at
            });
          }
          const customer = customerMap.get(key);
          customer.totalOrders += 1;
          customer.totalSpent += order.total_amount || 0;
          if (new Date(order.created_at) > new Date(customer.lastOrder)) {
            customer.lastOrder = order.created_at;
          }
        });

        const customersList = Array.from(customerMap.values());

        reportData = {
          type: 'customers',
          summary: {
            totalCustomers: customersList.length,
            totalOrders: customersData?.length || 0,
            averageOrdersPerCustomer: customersList.length > 0 ? (customersData?.length || 0) / customersList.length : 0
          },
          customers: customersList
        };
        break;

      default:
        return NextResponse.json(
          { error: 'Tipo de reporte no válido' },
          { status: 400, headers: corsHeaders }
        );
    }

    console.log(`📊 [Reports API] ${type} report generated successfully`);

    return NextResponse.json({
      success: true,
      data: reportData
    }, { headers: corsHeaders });

  } catch (error) {
    console.error('❌ [Reports API] Error generating report:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500, headers: corsHeaders }
    );
  }
}