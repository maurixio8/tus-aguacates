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

        // Inicializar valores por defecto
        let todayOrders: any[] = [];
        let weekOrders: any[] = [];
        let pendingOrders: any[] = [];
        let companies: any[] = [];
        let recentOrders: any[] = [];
        let topProducts: any[] = [];

        // Obtener pedidos B2B de hoy (con manejo de error)
        try {
            const { data } = await supabase
                .from('b2b_orders')
                .select('id, total, status')
                .gte('created_at', todayStart);
            todayOrders = data || [];
        } catch (e) { /* tabla no existe */ }

        // Obtener pedidos B2B de la semana
        try {
            const { data } = await supabase
                .from('b2b_orders')
                .select('id, total, status')
                .gte('created_at', weekStart);
            weekOrders = data || [];
        } catch (e) { /* tabla no existe */ }

        // Obtener pedidos pendientes B2B
        try {
            const { data } = await supabase
                .from('b2b_orders')
                .select('id')
                .in('status', ['pending', 'pendiente', 'confirmed', 'confirmado']);
            pendingOrders = data || [];
        } catch (e) { /* tabla no existe */ }

        // Obtener empresas
        try {
            const { data } = await supabase
                .from('b2b_companies')
                .select('id, status')
                .is('deleted_at', null);
            companies = data || [];
        } catch (e) { /* tabla no existe */ }

        // Obtener pedidos recientes B2B
        try {
            const { data } = await supabase
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
            recentOrders = data || [];
        } catch (e) { /* tabla no existe */ }

        // Calcular métricas
        const todayRevenue = todayOrders.reduce((sum, order) => sum + (order.total || 0), 0);
        const weekRevenue = weekOrders.reduce((sum, order) => sum + (order.total || 0), 0);

        const activeCompanies = companies.filter(c => c.status === 'active').length;
        const pendingApprovalCompanies = companies.filter(c => c.status === 'pending' || c.status === 'pending_verification').length;

        // Formatear pedidos recientes
        const formattedRecentOrders = recentOrders.map((order: any) => ({
            id: order.id,
            order_number: order.order_number,
            company_name: order.b2b_companies?.company_name || 'Empresa',
            total: order.total,
            status: order.status,
            created_at: order.created_at,
        }));

        const metrics = {
            today: {
                orders: todayOrders.length,
                revenue: todayRevenue,
            },
            pending: {
                count: pendingOrders.length,
            },
            week: {
                orders: weekOrders.length,
                revenue: weekRevenue,
            },
            companies: {
                total: companies.length,
                active: activeCompanies,
                pendingApproval: pendingApprovalCompanies,
            },
            topProducts,
            recentOrders: formattedRecentOrders,
        };

        return NextResponse.json({ success: true, metrics });
    } catch (error) {
        console.error('Error fetching B2B metrics:', error);
        // Devolver métricas vacías en lugar de error
        return NextResponse.json({
            success: true,
            metrics: {
                today: { orders: 0, revenue: 0 },
                pending: { count: 0 },
                week: { orders: 0, revenue: 0 },
                companies: { total: 0, active: 0, pendingApproval: 0 },
                topProducts: [],
                recentOrders: [],
            }
        });
    }
}
