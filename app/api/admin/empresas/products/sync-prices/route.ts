import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// POST - Sincronizar precios B2B basados en descuento
export async function POST(request: NextRequest) {
  try {
    // Obtener todos los productos B2B con sus productos base
    const { data: b2bProducts, error: fetchError } = await supabase
      .from('product_b2b_config')
      .select(`
        id,
        product_id,
        discount_percentage,
        products (
          price
        )
      `);

    if (fetchError) {
      console.error('Error fetching B2B products for sync:', fetchError);
      return NextResponse.json({ success: false, error: fetchError.message }, { status: 500 });
    }

    let updated = 0;

    // Actualizar cada producto con el precio B2B calculado
    for (const item of b2bProducts || []) {
      const originalPrice = (item.products as any)?.price || 0;
      const discount = item.discount_percentage || 20;
      const newB2BPrice = Math.round(originalPrice * (1 - discount / 100));

      const { error: updateError } = await supabase
        .from('product_b2b_config')
        .update({
          b2b_price: newB2BPrice,
          updated_at: new Date().toISOString()
        })
        .eq('id', item.id);

      if (!updateError) {
        updated++;
      }
    }

    return NextResponse.json({
      success: true,
      updated,
      message: `${updated} productos actualizados con precios B2B sincronizados`
    });

  } catch (error) {
    console.error('Error syncing B2B prices:', error);
    return NextResponse.json({ success: false, error: 'Error del servidor' }, { status: 500 });
  }
}
