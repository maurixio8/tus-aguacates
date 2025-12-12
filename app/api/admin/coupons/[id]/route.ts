import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { createSupabaseClient } from '@/lib/auth-admin';

export const dynamic = 'force-dynamic';

// Helper function to verify admin authentication
async function verifyAdminAuth(request: NextRequest): Promise<{ success: boolean; adminId?: string; error?: string }> {
  try {
    // Get the admin-token cookie from the request
    const token = request.cookies.get('admin-token')?.value;

    if (!token) {
      return { success: false, error: 'No autenticado' };
    }

    // Verify the JWT token
    const jwtSecret = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
    let decoded;
    try {
      decoded = jwt.verify(token, jwtSecret) as any;
    } catch (jwtError) {
      console.error('JWT verification error:', jwtError);
      return { success: false, error: 'Token inválido' };
    }

    // Check if this is an admin token
    if (decoded.type !== 'admin') {
      return { success: false, error: 'Token no válido para administrador' };
    }

    return { success: true, adminId: decoded.id };

  } catch (error) {
    console.error('Authentication error:', error);
    return { success: false, error: 'Error de autenticación' };
  }
}

// GET - Get single coupon by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify admin authentication
    const auth = await verifyAdminAuth(request);
    if (!auth.success) {
      return NextResponse.json(
        { error: auth.error },
        { status: 401 }
      );
    }

    const { id } = await params;
    console.log('🔍 API: Fetching single coupon:', id);

    const supabase = createSupabaseClient();

    const { data, error } = await supabase
      .from('coupons')
      .select('*')
      .eq('id', id)
      .single();

    console.log('📊 API: Single coupon response:', { data: !!data, error });

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Cupón no encontrado' },
          { status: 404 }
        );
      }

      console.error('❌ API: Error fetching coupon:', error);
      return NextResponse.json(
        { error: 'Error al cargar el cupón' },
        { status: 500 }
      );
    }

    // Add computed fields
    const coupon = {
      ...data,
      is_expired: data.valid_until && new Date(data.valid_until) < new Date(),
      remaining_uses: data.usage_limit ? data.usage_limit - data.times_used : null
    };

    console.log('✅ API: Coupon fetched successfully');

    return NextResponse.json({
      success: true,
      data: coupon
    });

  } catch (error) {
    console.error('❌ API: Unexpected error:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// PUT/PATCH - Update coupon by ID
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify admin authentication
    const auth = await verifyAdminAuth(request);
    if (!auth.success) {
      return NextResponse.json(
        { error: auth.error },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await request.json();

    console.log('📝 API: Updating coupon:', { id, body });

    const supabase = createSupabaseClient();

    // First check if coupon exists
    const { data: existingCoupon, error: fetchError } = await supabase
      .from('coupons')
      .select('id, code, times_used')
      .eq('id', id)
      .single();

    if (fetchError || !existingCoupon) {
      return NextResponse.json(
        { error: 'Cupón no encontrado' },
        { status: 404 }
      );
    }

    // Validate data if provided
    if (body.discount_type && !['percentage', 'fixed'].includes(body.discount_type)) {
      return NextResponse.json(
        { error: 'Tipo de descuento inválido. Debe ser "percentage" o "fixed"' },
        { status: 400 }
      );
    }

    if (body.discount_value !== undefined && (typeof body.discount_value !== 'number' || body.discount_value <= 0)) {
      return NextResponse.json(
        { error: 'El valor del descuento debe ser un número mayor que 0' },
        { status: 400 }
      );
    }

    if (body.discount_type === 'percentage' && body.discount_value > 100) {
      return NextResponse.json(
        { error: 'El descuento porcentual no puede ser mayor a 100%' },
        { status: 400 }
      );
    }

    // Prepare update object
    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    // Add fields if provided
    const allowedFields = [
      'code', 'description', 'discount_type', 'discount_value',
      'min_purchase', 'max_discount', 'valid_from', 'valid_until',
      'usage_limit', 'is_active', 'is_welcome_coupon', 'free_shipping'
    ];

    allowedFields.forEach(field => {
      if (body[field] !== undefined) {
        // Convert code to uppercase
        if (field === 'code') {
          updateData[field] = body[field].toUpperCase();
        } else {
          updateData[field] = body[field];
        }
      }
    });

    // Check for duplicate code if updating code
    if (updateData.code && updateData.code !== existingCoupon.code) {
      const { data: duplicateCoupon } = await supabase
        .from('coupons')
        .select('id')
        .eq('code', updateData.code)
        .single();

      if (duplicateCoupon) {
        return NextResponse.json(
          { error: 'Ya existe un cupón con ese código' },
          { status: 409 }
        );
      }
    }

    const { data, error } = await supabase
      .from('coupons')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    console.log('💾 API: Coupon update response:', { data, error });

    if (error) {
      console.error('❌ API: Error updating coupon:', error);
      return NextResponse.json(
        { error: 'Error al actualizar el cupón' },
        { status: 500 }
      );
    }

    console.log('✅ API: Coupon updated successfully:', data);

    return NextResponse.json({
      success: true,
      data,
      message: 'Cupón actualizado exitosamente'
    });

  } catch (error) {
    console.error('❌ API: Unexpected error updating coupon:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// DELETE - Delete coupon by ID
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify admin authentication
    const auth = await verifyAdminAuth(request);
    if (!auth.success) {
      return NextResponse.json(
        { error: auth.error },
        { status: 401 }
      );
    }

    const { id } = await params;
    console.log('🗑️ API: Deleting coupon:', id);

    const supabase = createSupabaseClient();

    // First check if coupon exists
    const { data: existingCoupon, error: fetchError } = await supabase
      .from('coupons')
      .select('id, code, times_used')
      .eq('id', id)
      .single();

    if (fetchError || !existingCoupon) {
      return NextResponse.json(
        { error: 'Cupón no encontrado' },
        { status: 404 }
      );
    }

    // Check if coupon has been used
    if (existingCoupon.times_used > 0) {
      return NextResponse.json(
        { error: 'No se puede eliminar un cupón que ya ha sido utilizado' },
        { status: 400 }
      );
    }

    // Delete the coupon (this will also cascade delete related coupon_usage records)
    const { data, error } = await supabase
      .from('coupons')
      .delete()
      .eq('id', id)
      .select()
      .single();

    console.log('💾 API: Coupon delete response:', { data, error });

    if (error) {
      console.error('❌ API: Error deleting coupon:', error);
      return NextResponse.json(
        { error: 'Error al eliminar el cupón' },
        { status: 500 }
      );
    }

    console.log('✅ API: Coupon deleted successfully:', data);

    return NextResponse.json({
      success: true,
      data,
      message: 'Cupón eliminado exitosamente'
    });

  } catch (error) {
    console.error('❌ API: Unexpected error deleting coupon:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// PATCH - Also support PATCH for partial updates (same as PUT)
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  return PUT(request, context);
}