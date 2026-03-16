import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAdminRole } from '@/lib/auth-admin';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(request: NextRequest) {
    try {
        const adminAccess = await requireAdminRole(request, 'viewer');
        if (adminAccess.response) {
            return adminAccess.response;
        }

        const { searchParams } = new URL(request.url);
        const period = searchParams.get('period') || 'month';

        const now = new Date();
        let startDate: Date;

        switch (period) {
            case 'week':
                startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
                break;
            case 'year':
                startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
                break;
            default: // month
                startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        }

        // Obtener pedidos B2B del período
        const { data: orders } = await supabase
            .from('b2b_orders')
            .select(`
        id,
        total,
        company_id,
        created_at,
        b2b_companies (
          company_name
        )
      `)
            .gte('created_at', startDate.toISOString())
            .neq('status', 'cancelled');

        // Obtener empresas activas
        const { data: companies } = await supabase
            .from('b2b_companies')
            .select('id')
            .eq('status', 'active')
            .is('deleted_at', null);

        // Obtener items de pedidos para productos top
        const { data: orderItems } = await supabase
            .from('b2b_order_items')
            .select(`
        product_name,
        quantity,
        unit_price,
        b2b_orders!inner (
          created_at
        )
      `)
            .gte('b2b_orders.created_at', startDate.toISOString());

        // Calcular resumen
        const totalRevenue = orders?.reduce((sum, o) => sum + (o.total || 0), 0) || 0;
        const totalOrders = orders?.length || 0;
        const totalCompanies = companies?.length || 0;
        const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

        // Calcular empresas top
        const companyStats: Record<string, { name: string; orders: number; revenue: number }> = {};
        orders?.forEach((order: any) => {
            const companyId = order.company_id;
            const companyName = order.b2b_companies?.company_name || 'Empresa';
            if (!companyStats[companyId]) {
                companyStats[companyId] = { name: companyName, orders: 0, revenue: 0 };
            }
            companyStats[companyId].orders += 1;
            companyStats[companyId].revenue += order.total || 0;
        });

        const topCompanies = Object.values(companyStats)
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 5);

        // Calcular productos top
        const productStats: Record<string, { name: string; quantity: number; revenue: number }> = {};
        orderItems?.forEach((item: any) => {
            const name = item.product_name || 'Producto';
            if (!productStats[name]) {
                productStats[name] = { name, quantity: 0, revenue: 0 };
            }
            productStats[name].quantity += item.quantity || 0;
            productStats[name].revenue += (item.quantity || 0) * (item.unit_price || 0);
        });

        const topProducts = Object.values(productStats)
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 5);

        // Calcular tendencia mensual (últimos 6 meses)
        const monthlyRevenue: Array<{ month: string; revenue: number; orders: number }> = [];
        for (let i = 5; i >= 0; i--) {
            const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
            const monthName = monthDate.toLocaleDateString('es-CO', { month: 'short' });

            const monthOrders = orders?.filter((o: any) => {
                const orderDate = new Date(o.created_at);
                return orderDate >= monthDate && orderDate <= monthEnd;
            }) || [];

            monthlyRevenue.push({
                month: monthName,
                revenue: monthOrders.reduce((sum: number, o: any) => sum + (o.total || 0), 0),
                orders: monthOrders.length,
            });
        }

        return NextResponse.json({
            success: true,
            data: {
                summary: {
                    totalRevenue,
                    totalOrders,
                    totalCompanies,
                    avgOrderValue,
                },
                topCompanies,
                topProducts,
                monthlyRevenue,
            },
        });
    } catch (error) {
        console.error('Error in B2B reports API:', error);
        return NextResponse.json(
            { success: false, error: 'Error interno del servidor' },
            { status: 500 }
        );
    }
}
