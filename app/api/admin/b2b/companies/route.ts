import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(request: NextRequest) {
    try {
        // Obtener todas las empresas B2B
        const { data: companies, error } = await supabase
            .from('b2b_companies')
            .select(`
        id,
        company_name,
        nit,
        contact_name,
        contact_email,
        contact_phone,
        status,
        created_at
      `)
            .is('deleted_at', null)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching B2B companies:', error);
            return NextResponse.json(
                { success: false, error: 'Error al obtener empresas' },
                { status: 500 }
            );
        }

        // Obtener conteo de pedidos por empresa
        const { data: orderCounts } = await supabase
            .from('b2b_orders')
            .select('company_id');

        const ordersByCompany: Record<string, number> = {};
        orderCounts?.forEach((order: any) => {
            if (order.company_id) {
                ordersByCompany[order.company_id] = (ordersByCompany[order.company_id] || 0) + 1;
            }
        });

        // Agregar conteo de pedidos a cada empresa
        const companiesWithStats = companies?.map(company => ({
            ...company,
            total_orders: ordersByCompany[company.id] || 0,
        })) || [];

        return NextResponse.json({ success: true, companies: companiesWithStats });
    } catch (error) {
        console.error('Error in B2B companies API:', error);
        return NextResponse.json(
            { success: false, error: 'Error interno del servidor' },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        const { data: company, error } = await supabase
            .from('b2b_companies')
            .insert([{
                company_name: body.company_name,
                nit: body.nit,
                contact_name: body.contact_name,
                contact_email: body.contact_email,
                contact_phone: body.contact_phone,
                status: 'pending',
            }])
            .select()
            .single();

        if (error) {
            console.error('Error creating B2B company:', error);
            return NextResponse.json(
                { success: false, error: 'Error al crear empresa' },
                { status: 500 }
            );
        }

        return NextResponse.json({ success: true, company });
    } catch (error) {
        console.error('Error in B2B companies POST:', error);
        return NextResponse.json(
            { success: false, error: 'Error interno del servidor' },
            { status: 500 }
        );
    }
}
