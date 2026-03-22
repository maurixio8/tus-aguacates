/**
 * API Routes para gestión admin de Cupones B2B
 * "Tus Aguacates" - Panel de Administración
 */

import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { requireAdminRole } from '@/lib/auth-admin';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * GET /api/admin/b2b/coupons
 * Obtiene lista de cupones B2B
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

    if (id) {
      const { data: coupon, error } = await supabase
        .from('b2b_coupons')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) {
        return NextResponse.json(
          { success: false, error: { message: error.message, code: 'DB_ERROR' } },
          { status: 500 }
        );
      }

      if (!coupon) {
        return NextResponse.json(
          { success: false, error: { message: 'Cupón no encontrado', code: 'NOT_FOUND' } },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        data: coupon,
      });
    }

    const { data: coupons, error } = await supabase
      .from('b2b_coupons')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching B2B coupons:', error);
      return NextResponse.json(
        { success: false, error: { message: 'Error al obtener cupones', code: 'DB_ERROR' } },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: coupons || [],
    });
  } catch (error) {
    console.error('Error in admin B2B coupons GET API:', error);
    return NextResponse.json(
      { success: false, error: { message: 'Error interno del servidor', code: 'INTERNAL_ERROR' } },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/b2b/coupons
 * Crea un nuevo cupón B2B
 */
export async function POST(request: NextRequest) {
  try {
    const adminAccess = await requireAdminRole(request, 'admin');
    if (adminAccess.response) {
      return adminAccess.response;
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = await request.json();

    if (!body.code || !body.discount_type || body.discount_value === undefined) {
      return NextResponse.json(
        { success: false, error: { message: 'Código, tipo de descuento y valor son requeridos', code: 'VALIDATION_ERROR' } },
        { status: 400 }
      );
    }

    const { data: coupon, error } = await supabase
      .from('b2b_coupons')
      .insert({
        code: body.code.toUpperCase(),
        description: body.description || null,
        discount_type: body.discount_type,
        discount_value: body.discount_value,
        min_purchase: body.min_purchase || 0,
        max_discount: body.max_discount || null,
        valid_from: body.valid_from,
        valid_until: body.valid_until || null,
        usage_limit: body.usage_limit || null,
        times_used: 0,
        is_active: body.is_active !== undefined ? body.is_active : true,
        applicable_to: body.applicable_to || 'all',
        company_ids: body.company_ids || null,
        category_ids: body.category_ids || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating B2B coupon:', error);
      return NextResponse.json(
        { success: false, error: { message: error.message, code: 'DB_ERROR' } },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: coupon,
    }, { status: 201 });
  } catch (error) {
    console.error('Error in admin B2B coupons POST API:', error);
    return NextResponse.json(
      { success: false, error: { message: 'Error interno del servidor', code: 'INTERNAL_ERROR' } },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/b2b/coupons
 * Actualiza un cupón B2B
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
        { success: false, error: { message: 'ID del cupón es requerido', code: 'VALIDATION_ERROR' } },
        { status: 400 }
      );
    }

    const body = await request.json();

    const allowedFields = [
      'code', 'description', 'discount_type', 'discount_value', 'min_purchase', 'max_discount',
      'valid_from', 'valid_until', 'usage_limit', 'is_active', 'applicable_to', 'company_ids', 'category_ids'
    ];

    const updateData: any = {};
    allowedFields.forEach(field => {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    });

    if (updateData.code) {
      updateData.code = updateData.code.toUpperCase();
    }

    const { data: coupon, error } = await supabase
      .from('b2b_coupons')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating B2B coupon:', error);
      return NextResponse.json(
        { success: false, error: { message: error.message, code: 'DB_ERROR' } },
        { status: 400 }
      );
    }

    if (!coupon) {
      return NextResponse.json(
        { success: false, error: { message: 'Cupón no encontrado', code: 'NOT_FOUND' } },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: coupon,
    });
  } catch (error) {
    console.error('Error in admin B2B coupons PATCH API:', error);
    return NextResponse.json(
      { success: false, error: { message: 'Error interno del servidor', code: 'INTERNAL_ERROR' } },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/b2b/coupons
 * Elimina un cupón B2B
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
        { success: false, error: { message: 'ID del cupón es requerido', code: 'VALIDATION_ERROR' } },
        { status: 400 }
      );
    }

    const { data: coupon, error } = await supabase
      .from('b2b_coupons')
      .delete()
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error deleting B2B coupon:', error);
      return NextResponse.json(
        { success: false, error: { message: error.message, code: 'DB_ERROR' } },
        { status: 400 }
      );
    }

    if (!coupon) {
      return NextResponse.json(
        { success: false, error: { message: 'Cupón no encontrado', code: 'NOT_FOUND' } },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { message: 'Cupón eliminado correctamente' },
    });
  } catch (error) {
    console.error('Error in admin B2B coupons DELETE API:', error);
    return NextResponse.json(
      { success: false, error: { message: 'Error interno del servidor', code: 'INTERNAL_ERROR' } },
      { status: 500 }
    );
  }
}
