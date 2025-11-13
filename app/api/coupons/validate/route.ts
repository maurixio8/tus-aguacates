import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

// GET - Validate coupon code
export async function GET(request: NextRequest) {
  try {
    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const cartTotal = parseFloat(searchParams.get('cartTotal') || '0');
    const userEmail = searchParams.get('userEmail');

    console.log('🔍 API: Validating coupon:', { code, cartTotal, userEmail });

    if (!code) {
      return NextResponse.json(
        { success: false, error: 'Código de cupón requerido' },
        { status: 400 }
      );
    }

    if (cartTotal < 0) {
      return NextResponse.json(
        { success: false, error: 'El total del carrito no puede ser negativo' },
        { status: 400 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Find the coupon
    const { data: coupon, error: fetchError } = await supabase
      .from('coupons')
      .select('*')
      .eq('code', code.toUpperCase())
      .eq('is_active', true)
      .single();

    if (fetchError || !coupon) {
      console.log('❌ Coupon not found or inactive:', { code, fetchError });
      return NextResponse.json({
        success: false,
        error: 'Cupón no encontrado o inválido'
      });
    }

    console.log('📋 Found coupon:', {
      id: coupon.id,
      code: coupon.code,
      discount_type: coupon.discount_type,
      discount_value: coupon.discount_value,
      min_purchase: coupon.min_purchase,
      usage_limit: coupon.times_used,
      times_used: coupon.times_used,
      valid_until: coupon.valid_until,
      free_shipping: coupon.free_shipping
    });

    // Check if coupon is expired
    if (coupon.valid_until && new Date(coupon.valid_until) < new Date()) {
      console.log('❌ Coupon expired:', { valid_until: coupon.valid_until, current: new Date() });
      return NextResponse.json({
        success: false,
        error: 'Cupón expirado'
      });
    }

    // Check if coupon has started
    if (coupon.valid_from && new Date(coupon.valid_from) > new Date()) {
      console.log('❌ Coupon not yet valid:', { valid_from: coupon.valid_from, current: new Date() });
      return NextResponse.json({
        success: false,
        error: 'Cupón no válido aún'
      });
    }

    // Check minimum purchase requirement
    if (cartTotal < coupon.min_purchase) {
      console.log('❌ Minimum purchase not met:', { cartTotal, min_purchase: coupon.min_purchase });
      return NextResponse.json({
        success: false,
        error: `El pedido mínimo para usar este cupón es de $${coupon.min_purchase.toLocaleString('es-CO')}`
      });
    }

    // Check usage limit
    if (coupon.usage_limit && coupon.times_used >= coupon.usage_limit) {
      console.log('❌ Usage limit exceeded:', { times_used: coupon.times_used, usage_limit: coupon.usage_limit });
      return NextResponse.json({
        success: false,
        error: 'Este cupón ha alcanzado su límite de uso'
      });
    }

    // Check if user has already used this coupon (if email provided)
    if (userEmail) {
      const { data: existingUsage, error: usageError } = await supabase
        .from('coupon_usage')
        .select('id')
        .eq('coupon_id', coupon.id)
        .eq('user_email', userEmail.toLowerCase().trim())
        .single();

      if (!usageError && existingUsage) {
        console.log('❌ User already used this coupon:', { userEmail });
        return NextResponse.json({
          success: false,
          error: 'Ya has usado este cupón anteriormente'
        });
      }
    }

    // Calculate discount amount
    let discountAmount = 0;

    if (coupon.discount_type === 'percentage') {
      discountAmount = (cartTotal * coupon.discount_value) / 100;
      // Apply max discount limit if specified
      if (coupon.max_discount && discountAmount > coupon.max_discount) {
        discountAmount = coupon.max_discount;
      }
    } else if (coupon.discount_type === 'fixed') {
      discountAmount = coupon.discount_value;
      // Ensure discount doesn't exceed cart total
      if (discountAmount > cartTotal) {
        discountAmount = cartTotal;
      }
    }

    // Calculate if free shipping applies
    const hasFreeShipping = coupon.free_shipping || discountAmount >= cartTotal;

    console.log('💰 Discount calculation:', {
      discount_type: coupon.discount_type,
      discount_value: coupon.discount_value,
      cartTotal,
      discountAmount,
      hasFreeShipping,
      max_discount: coupon.max_discount
    });

    const response = {
      success: true,
      coupon: {
        id: coupon.id,
        code: coupon.code,
        description: coupon.description,
        discount_type: coupon.discount_type,
        discount_value: coupon.discount_value,
        discount_amount: discountAmount,
        min_purchase: coupon.min_purchase,
        free_shipping: coupon.free_shipping,
        hasFreeShipping
      },
      message: 'Cupón válido'
    };

    console.log('✅ Coupon validation successful:', response);

    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ API: Unexpected error validating coupon:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}