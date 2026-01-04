import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(request: NextRequest) {
    try {
        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
        const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7).toISOString();

        // Obtener pedidos B2B de hoy
        const { data: todayOrders, error: todayError } = await supabase
            .from('b2b_orders')
            .select('id, total, status')
            .gte('created_at', todayStart);

        // Obtener pedidos B2B de la semana
        const { data: weekOrders, error: weekError } = await supabase
            .from('b2b_orders')
            .select('id, total, status')
            .gte('created_at', weekStart);

        // Obtener pedidos pendientes B2B
        const { data: pendingOrders, error: pendingError } = await supabase
            .from('b2b_orders')
            .select('id')
            .in('status', ['pending', 'pendiente', 'confirmed', 'confirmado']);

        // Obtener empresas
        const { data: companies, error: companiesError } = await supabase
            .from('b2b_companies')
            .select('id, status')
            .is('deleted_at', null);

        // Obtener pedidos recientes B2B
        const { data: recentOrders, error: recentError } = await supabase
            .from('b2b_orders')
            .select(`
        id,
        order_number,
        total,
        status,
        created_at,
        b2b_companies (
          company_name
        )
      `)
            .order('created_at', { ascending: false })
            .limit(5);

        // Obtener productos más vendidos B2B (últimos 30 días)
        const thirtyDaysAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30).toISOString();
        const { data: orderItems, error: itemsError } = await supabase
            .from('b2b_order_items')
            .select(`
        quantity,
        unit_price,
        product_name,
        b2b_orders!inner (
          created_at
        )
      `)
            .gte('b2b_orders.created_at', thirtyDaysAgo);

        // Calcular productos top
        const productStats: Record<string, { quantity: number; revenue: number }> = {};
        if (orderItems) {
            orderItems.forEach((item: any) => {
                const name = item.product_name || 'Producto';
                if (!productStats[name]) {
                    productStats[name] = { quantity: 0, revenue: 0 };
                }
                productStats[name].quantity += item.quantity || 0;
                productStats[name].revenue += (item.quantity || 0) * (item.unit_price || 0);
            });
        }

        const topProducts = Object.entries(productStats)
            .map(([name, stats]) => ({ name, ...stats }))
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 5);

        // Calcular métricas
        const todayRevenue = todayOrders?.reduce((sum, order) => sum + (order.total || 0), 0) || 0;
        const weekRevenue = weekOrders?.reduce((sum, order) => sum + (order.total || 0), 0) || 0;

        const activeCompanies = companies?.filter(c => c.status === 'active').length || 0;
        const pendingApprovalCompanies = companies?.filter(c => c.status === 'pending' || c.status === 'pending_verification').length || 0;

        // Formatear pedidos recientes
        const formattedRecentOrders = recentOrders?.map((order: any) => ({
            id: order.id,
            order_number: order.order_number,
            company_name: order.b2b_companies?.company_name || 'Empresa',
            total: order.total,
            status: order.status,
            created_at: order.created_at,
        })) || [];

        const metrics = {
            today: {
                orders: todayOrders?.length || 0,
                revenue: todayRevenue,
            },
            pending: {
                count: pendingOrders?.length || 0,
            },
            week: {
                orders: weekOrders?.length || 0,
                revenue: weekRevenue,
            },
            companies: {
                total: companies?.length || 0,
                active: activeCompanies,
                pendingApproval: pendingApprovalCompanies,
            },
            topProducts,
            recentOrders: formattedRecentOrders,
        };

        return NextResponse.json({ success: true, metrics });
    } catch (error) {
        console.error('Error fetching B2B metrics:', error);
        return NextResponse.json(
            { success: false, error: 'Error al obtener métricas B2B' },
            { status: 500 }
        );
    }
}
