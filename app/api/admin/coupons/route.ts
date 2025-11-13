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

// GET - List coupons with pagination and filters
export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication
    const auth = await verifyAdminAuth(request);
    if (!auth.success) {
      return NextResponse.json(
        { error: auth.error },
        { status: 401 }
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || 'all';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    console.log('🔍 API: Fetching coupons with params:', { search, status, page, limit });

    const supabase = createSupabaseClient();

    let query = supabase
      .from('coupons')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    // Apply search filter
    if (search) {
      query = query.or(`code.ilike.%${search}%,description.ilike.%${search}%`);
    }

    // Apply status filter
    if (status !== 'all') {
      if (status === 'active') {
        query = query.eq('is_active', true);
      } else if (status === 'inactive') {
        query = query.eq('is_active', false);
      } else if (status === 'expired') {
        query = query.lt('valid_until', new Date().toISOString());
      }
    }

    const { data, error, count } = await query;

    console.log('📊 API: Coupons response:', {
      data: data?.length || 0,
      error,
      count,
      success: !error
    });

    if (error) {
      console.error('❌ API: Error fetching coupons:', error);
      return NextResponse.json(
        { error: 'Error al cargar cupones' },
        { status: 500 }
      );
    }

    // Calculate usage statistics for each coupon
    const couponsWithStats = data?.map(coupon => ({
      ...coupon,
      is_expired: coupon.valid_until && new Date(coupon.valid_until) < new Date(),
      remaining_uses: coupon.usage_limit ? coupon.usage_limit - coupon.times_used : null
    })) || [];

    return NextResponse.json({
      success: true,
      data: couponsWithStats,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    });

  } catch (error) {
    console.error('❌ API: Unexpected error:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// POST - Create new coupon
export async function POST(request: NextRequest) {
  try {
    // Verify admin authentication
    const auth = await verifyAdminAuth(request);
    if (!auth.success) {
      return NextResponse.json(
        { error: auth.error },
        { status: 401 }
      );
    }

    const body = await request.json();
    console.log('📝 API: Creating coupon:', body);

    // Validate required fields
    const requiredFields = ['code', 'description', 'discount_type', 'discount_value'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `El campo ${field} es requerido` },
          { status: 400 }
        );
      }
    }

    // Validate discount_type
    if (!['percentage', 'fixed'].includes(body.discount_type)) {
      return NextResponse.json(
        { error: 'Tipo de descuento inválido. Debe ser "percentage" o "fixed"' },
        { status: 400 }
      );
    }

    // Validate discount_value
    if (typeof body.discount_value !== 'number' || body.discount_value <= 0) {
      return NextResponse.json(
        { error: 'El valor del descuento debe ser un número mayor que 0' },
        { status: 400 }
      );
    }

    // Validate percentage discount
    if (body.discount_type === 'percentage' && body.discount_value > 100) {
      return NextResponse.json(
        { error: 'El descuento porcentual no puede ser mayor a 100%' },
        { status: 400 }
      );
    }

    // Validate dates
    if (body.valid_from && body.valid_until && new Date(body.valid_from) >= new Date(body.valid_until)) {
      return NextResponse.json(
        { error: 'La fecha de inicio debe ser anterior a la fecha de fin' },
        { status: 400 }
      );
    }

    // Check if coupon code already exists
    const supabase = createSupabaseClient();
    const { data: existingCoupon } = await supabase
      .from('coupons')
      .select('id')
      .eq('code', body.code.toUpperCase())
      .single();

    if (existingCoupon) {
      return NextResponse.json(
        { error: 'Ya existe un cupón con ese código' },
        { status: 409 }
      );
    }

    // Create the coupon
    const { data, error } = await supabase
      .from('coupons')
      .insert({
        code: body.code.toUpperCase(),
        description: body.description,
        discount_type: body.discount_type,
        discount_value: body.discount_value,
        min_purchase: body.min_purchase || 0,
        max_discount: body.max_discount || null,
        valid_from: body.valid_from || new Date().toISOString(),
        valid_until: body.valid_until || null,
        usage_limit: body.usage_limit || null,
        is_welcome_coupon: body.is_welcome_coupon || false,
        free_shipping: body.free_shipping || false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    console.log('💾 API: Coupon creation response:', { data, error });

    if (error) {
      console.error('❌ API: Error creating coupon:', error);
      return NextResponse.json(
        { error: 'Error al crear el cupón' },
        { status: 500 }
      );
    }

    console.log('✅ API: Coupon created successfully:', data);

    return NextResponse.json({
      success: true,
      data,
      message: 'Cupón creado exitosamente'
    }, { status: 201 });

  } catch (error) {
    console.error('❌ API: Unexpected error creating coupon:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}