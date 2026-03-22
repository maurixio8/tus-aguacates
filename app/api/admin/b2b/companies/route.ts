/**
 * API Routes para gestión admin de Empresas B2B
 * "Tus Aguacates" - Panel de Administración
 */

import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { requireAdminRole } from '@/lib/auth-admin';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * GET /api/admin/b2b/companies
 * Obtiene lista de empresas B2B con filtros y paginación
 */
export async function GET(request: NextRequest) {
  try {
    const adminAccess = await requireAdminRole(request, 'viewer');
    if (adminAccess.response) {
      return adminAccess.response;
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');
    const status = searchParams.get('status');
    const business_type = searchParams.get('business_type');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const page_size = parseInt(searchParams.get('page_size') || '20');

    // Si se pide una empresa por ID, retornarla directamente con usuarios
    if (id) {
      const { data: company, error } = await supabase
        .from('b2b_companies')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) {
        return NextResponse.json(
          { success: false, error: { message: error.message, code: 'DB_ERROR' } },
          { status: 500 }
        );
      }

      if (!company) {
        return NextResponse.json(
          { success: false, error: { message: 'Empresa no encontrada', code: 'NOT_FOUND' } },
          { status: 404 }
        );
      }

      // Obtener usuarios de la empresa
      const { data: users } = await supabase
        .from('b2b_company_users')
        .select('*')
        .eq('company_id', id);

      // Obtener pedidos de la empresa
      const { data: orders } = await supabase
        .from('b2b_orders')
        .select('id, total, status, created_at')
        .eq('company_id', id)
        .order('created_at', { ascending: false })
        .limit(10);

      return NextResponse.json({
        success: true,
        data: { ...company, users: users || [], recent_orders: orders || [] },
      });
    }

    // Construir query
    let query = supabase
      .from('b2b_companies')
      .select('*', { count: 'exact' });

    // Aplicar filtros
    if (status) {
      query = query.eq('status', status);
    }

    if (business_type) {
      query = query.eq('business_type', business_type);
    }

    if (search) {
      query = query.or(`company_name.ilike.%${search}%,nit.ilike.%${search}%,contact_name.ilike.%${search}%,contact_email.ilike.%${search}%`);
    }

    // Ordenamiento
    query = query.order('created_at', { ascending: false });

    // Paginación
    const from = (page - 1) * page_size;
    const to = from + page_size - 1;
    query = query.range(from, to);

    const { data: companies, error, count } = await query;

    if (error) {
      console.error('Error fetching B2B companies:', error);
      return NextResponse.json(
        { success: false, error: { message: 'Error al obtener empresas', code: 'DB_ERROR' } },
        { status: 500 }
      );
    }

    // Obtener conteo de usuarios para cada empresa
    const companyIds = companies?.map((c: any) => c.id) || [];
    let companiesWithUserCount = companies || [];

    if (companyIds.length > 0) {
      const { data: users } = await supabase
        .from('b2b_company_users')
        .select('company_id')
        .in('company_id', companyIds);

      // Contar usuarios por empresa
      const userCountMap = new Map<string, number>();
      users?.forEach((user: any) => {
        const current = userCountMap.get(user.company_id) || 0;
        userCountMap.set(user.company_id, current + 1);
      });

      companiesWithUserCount = companiesWithUserCount.map((company: any) => ({
        ...company,
        user_count: userCountMap.get(company.id) || 0,
      }));
    }

    const total_pages = count ? Math.ceil(count / page_size) : 0;

    return NextResponse.json({
      success: true,
      data: companiesWithUserCount,
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
    console.error('Error in admin B2B companies GET API:', error);
    return NextResponse.json(
      { success: false, error: { message: 'Error interno del servidor', code: 'INTERNAL_ERROR' } },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/b2b/companies
 * Crea una nueva empresa B2B
 */
export async function POST(request: NextRequest) {
  try {
    const adminAccess = await requireAdminRole(request, 'admin');
    if (adminAccess.response) {
      return adminAccess.response;
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = await request.json();

    // Validar campos requeridos
    if (!body.company_name || !body.nit || !body.contact_name || !body.contact_email) {
      return NextResponse.json(
        { success: false, error: { message: 'Nombre de empresa, NIT, nombre de contacto y email son requeridos', code: 'VALIDATION_ERROR' } },
        { status: 400 }
      );
    }

    // Crear empresa
    const { data: company, error } = await supabase
      .from('b2b_companies')
      .insert({
        company_name: body.company_name,
        nit: body.nit,
        business_type: body.business_type || 'other',
        contact_name: body.contact_name,
        contact_email: body.contact_email,
        contact_phone: body.contact_phone || null,
        business_address: body.business_address || null,
        shipping_address: body.shipping_address || null,
        billing_address: body.billing_address || null,
        minimum_order_amount: body.minimum_order_amount || 0,
        status: body.status || 'pending',
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating B2B company:', error);
      return NextResponse.json(
        { success: false, error: { message: error.message, code: 'DB_ERROR' } },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: company,
    }, { status: 201 });
  } catch (error) {
    console.error('Error in admin B2B companies POST API:', error);
    return NextResponse.json(
      { success: false, error: { message: 'Error interno del servidor', code: 'INTERNAL_ERROR' } },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/b2b/companies
 * Actualiza una empresa B2B
 */
export async function PATCH(request: NextRequest) {
  try {
    const adminAccess = await requireAdminRole(request, 'admin');
    if (adminAccess.response) {
      return adminAccess.response;
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: { message: 'ID de la empresa es requerido', code: 'VALIDATION_ERROR' } },
        { status: 400 }
      );
    }

    const body = await request.json();

    // Campos permitidos para actualizar
    const allowedFields = [
      'company_name', 'nit', 'business_type', 'contact_name', 'contact_email', 'contact_phone',
      'business_address', 'shipping_address', 'billing_address', 'minimum_order_amount', 'status'
    ];

    const updateData: any = {};
    allowedFields.forEach(field => {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    });

    const { data: company, error } = await supabase
      .from('b2b_companies')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating B2B company:', error);
      return NextResponse.json(
        { success: false, error: { message: error.message, code: 'DB_ERROR' } },
        { status: 400 }
      );
    }

    if (!company) {
      return NextResponse.json(
        { success: false, error: { message: 'Empresa no encontrada', code: 'NOT_FOUND' } },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: company,
    });
  } catch (error) {
    console.error('Error in admin B2B companies PATCH API:', error);
    return NextResponse.json(
      { success: false, error: { message: 'Error interno del servidor', code: 'INTERNAL_ERROR' } },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/b2b/companies
 * Soft delete de una empresa B2B
 */
export async function DELETE(request: NextRequest) {
  try {
    const adminAccess = await requireAdminRole(request, 'super_admin');
    if (adminAccess.response) {
      return adminAccess.response;
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: { message: 'ID de la empresa es requerido', code: 'VALIDATION_ERROR' } },
        { status: 400 }
      );
    }

    // Soft delete
    const { data: company, error } = await supabase
      .from('b2b_companies')
      .update({ status: 'inactive', deleted_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error deleting B2B company:', error);
      return NextResponse.json(
        { success: false, error: { message: error.message, code: 'DB_ERROR' } },
        { status: 400 }
      );
    }

    if (!company) {
      return NextResponse.json(
        { success: false, error: { message: 'Empresa no encontrada', code: 'NOT_FOUND' } },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { message: 'Empresa eliminada correctamente' },
    });
  } catch (error) {
    console.error('Error in admin B2B companies DELETE API:', error);
    return NextResponse.json(
      { success: false, error: { message: 'Error interno del servidor', code: 'INTERNAL_ERROR' } },
      { status: 500 }
    );
  }
}
