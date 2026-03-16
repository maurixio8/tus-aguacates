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
        if (body.company_name) updateData.company_name = body.company_name;
        if (body.contact_name) updateData.contact_name = body.contact_name;
        if (body.contact_email) updateData.contact_email = body.contact_email;
        if (body.contact_phone) updateData.contact_phone = body.contact_phone;

        updateData.updated_at = new Date().toISOString();

        const { data: company, error } = await supabase
            .from('b2b_companies')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Error updating B2B company:', error);
            return NextResponse.json(
                { success: false, error: 'Error al actualizar empresa' },
                { status: 500 }
            );
        }

        return NextResponse.json({ success: true, company });
    } catch (error) {
        console.error('Error in B2B company PATCH:', error);
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

        const { data: company, error } = await supabase
            .from('b2b_companies')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            console.error('Error fetching B2B company:', error);
            return NextResponse.json(
                { success: false, error: 'Empresa no encontrada' },
                { status: 404 }
            );
        }

        return NextResponse.json({ success: true, company });
    } catch (error) {
        console.error('Error in B2B company GET:', error);
        return NextResponse.json(
            { success: false, error: 'Error interno del servidor' },
            { status: 500 }
        );
    }
}
