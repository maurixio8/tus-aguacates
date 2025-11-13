import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

// POST - Calculate shipping costs
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { subtotal, location = 'Bogotá' } = body;

    console.log('📦 API: Calculating shipping:', { subtotal, location });

    if (typeof subtotal !== 'number' || subtotal < 0) {
      return NextResponse.json(
        { success: false, error: 'Subtotal inválido' },
        { status: 400 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Get active shipping rules for the location
    const { data: shippingRules, error: rulesError } = await supabase
      .from('shipping_rules')
      .select('*')
      .eq('is_active', true)
      .eq('zone', location)
      .order('priority', { ascending: true });

    if (rulesError) {
      console.error('❌ API: Error fetching shipping rules:', rulesError);
      return NextResponse.json(
        { success: false, error: 'Error al calcular envío' },
        { status: 500 }
      );
    }

    console.log('📋 Shipping rules found:', shippingRules?.length || 0);

    let shippingCost = 0;
    let freeShippingMin = 0;
    let freeShipping = false;

    // Apply shipping rules (use first matching rule, ordered by priority)
    if (shippingRules && shippingRules.length > 0) {
      const rule = shippingRules[0]; // Use highest priority rule
      freeShippingMin = rule.free_shipping_min;
      shippingCost = rule.shipping_cost;

      // Check if shipping is free
      freeShipping = subtotal > freeShippingMin;

      console.log('🚚 Applied shipping rule:', {
        rule: rule.name,
        freeShippingMin,
        shippingCost,
        subtotal,
        freeShipping,
        comparison: `subtotal (${subtotal}) > freeShippingMin (${freeShippingMin}) = ${subtotal > freeShippingMin}`
      });
    } else {
      // Default rule for Bogotá if no rules found
      freeShippingMin = 68900; // $68.900
      shippingCost = 7400; // $7.400
      freeShipping = subtotal > freeShippingMin;

      console.log('🚚 Applied default shipping rule:', {
        freeShippingMin,
        shippingCost,
        subtotal,
        freeShipping,
        comparison: `subtotal (${subtotal}) > freeShippingMin (${freeShippingMin}) = ${subtotal > freeShippingMin}`
      });
    }

    // Calculate amount needed for free shipping
    const amountForFreeShipping = freeShipping ? 0 : Math.max(0, freeShippingMin - subtotal);

    const response = {
      success: true,
      shipping: {
        cost: freeShipping ? 0 : shippingCost,
        freeShipping,
        freeShippingMin,
        amountForFreeShipping,
        location,
        estimatedDays: freeShipping ? 2 : 1, // Faster for free shipping
        message: freeShipping
          ? '¡Envío GRATIS en tu pedido!'
          : `Envío: $${shippingCost.toLocaleString('es-CO')}`
      }
    };

    console.log('✅ Shipping calculation successful:', response);

    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ API: Unexpected error calculating shipping:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}