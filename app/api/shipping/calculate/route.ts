import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

// POST - Calculate shipping costs
export async function POST(request: NextRequest) {
  try {
    console.log('📦 API: Shipping request received');

    // Validate request body
    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      console.error('❌ API: JSON parse error:', parseError);
      return NextResponse.json(
        {
          success: false,
          error: 'Request body inválido',
          details: 'El formato JSON es incorrecto o vacío'
        },
        { status: 400 }
      );
    }

    const { subtotal, location = 'Bogotá' } = body;

    console.log('📦 API: Calculating shipping:', {
      subtotal,
      location,
      bodyKeys: Object.keys(body),
      subtotalType: typeof subtotal,
      locationType: typeof location
    });

    // Enhanced validation
    if (subtotal === undefined || subtotal === null) {
      return NextResponse.json(
        {
          success: false,
          error: 'Subtotal es requerido',
          details: 'El campo subtotal es obligatorio'
        },
        { status: 400 }
      );
    }

    if (typeof subtotal !== 'number' || isNaN(subtotal)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Subtotal debe ser un número',
          details: `Recibido: ${typeof subtotal} (${subtotal})`
        },
        { status: 400 }
      );
    }

    if (subtotal < 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Subtotal no puede ser negativo',
          details: `Subtotal mínimo: 0, recibido: ${subtotal}`
        },
        { status: 400 }
      );
    }

    if (subtotal > 999999999) {
      return NextResponse.json(
        {
          success: false,
          error: 'Subtotal excede el máximo permitido',
          details: `Máximo: 999,999,999, recibido: ${subtotal}`
        },
        { status: 400 }
      );
    }

    // Validate environment variables
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.error('❌ API: Missing Supabase environment variables');
      return NextResponse.json(
        { success: false, error: 'Configuración de base de datos incompleta' },
        { status: 500 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    // Get active shipping rules for the location
    let shippingRules: any[] | null = null;
    const { data: rulesData, error: rulesError } = await supabase
      .from('shipping_rules')
      .select('*')
      .eq('is_active', true)
      .eq('zone', location)
      .order('priority', { ascending: true });

    if (rulesError) {
      console.error('❌ API: Error fetching shipping rules:', rulesError);
      console.error('❌ API: Supabase error details:', {
        message: rulesError.message,
        details: rulesError.details,
        hint: rulesError.hint,
        code: rulesError.code
      });

      // Don't return 500 immediately, fallback to default rules
      console.log('📋 Using default shipping rules due to database error');
      shippingRules = null;
    } else {
      shippingRules = rulesData;
    }

    console.log('📋 Shipping rules found:', shippingRules?.length || 0);

    let shippingCost = 0;
    let freeShippingMin = 0;
    let freeShipping = false;

    // Always use default rule to ensure consistency
    // Ignore database rules to avoid configuration conflicts
    freeShippingMin = 68900; // $68.900
    shippingCost = 7400; // $7.400
    freeShipping = subtotal > freeShippingMin;

    console.log('🚚 Applied default shipping rule (hardcoded):', {
      freeShippingMin,
      shippingCost,
      subtotal,
      freeShipping,
      comparison: `subtotal (${subtotal}) > freeShippingMin (${freeShippingMin}) = ${subtotal > freeShippingMin}`,
      note: 'Database rules ignored to prevent configuration conflicts'
    });

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
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : 'No stack available';

    console.error('❌ API: Unexpected error calculating shipping:', {
      error: errorMessage,
      stack: errorStack,
      requestInfo: {
        body: 'Request body not available in error context',
        headers: Object.fromEntries(request.headers)
      }
    });

    // Handle specific error types
    if (errorMessage?.includes('invalid JSON')) {
      return NextResponse.json(
        {
          success: false,
          error: 'Request body inválido',
          details: 'El formato JSON es incorrecto'
        },
        { status: 400 }
      );
    }

    if (errorMessage?.includes('Supabase') || errorMessage?.includes('database')) {
      return NextResponse.json(
        {
          success: false,
          error: 'Error de base de datos temporal',
          details: 'Intente nuevamente en unos momentos'
        },
        { status: 503 }
      );
    }

    if (errorMessage?.includes('fetch') || errorMessage?.includes('network')) {
      return NextResponse.json(
        {
          success: false,
          error: 'Error de conexión con base de datos',
          details: 'Verifique su conexión y reintente'
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Error interno del servidor',
        details: process.env.NODE_ENV === 'development' ? errorMessage : 'Contacte al soporte'
      },
      { status: 500 }
    );
  }
}