import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// PATCH - Actualizar producto B2B
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const updateData: Record<string, any> = {
      updated_at: new Date().toISOString()
    };

    // Mapear campos del frontend a la estructura de la tabla
    if (body.tier1_price !== undefined) {
      updateData.tier1_price = body.tier1_price;
    }

    if (body.tier2_price !== undefined) {
      updateData.tier2_price = body.tier2_price;
    }

    if (body.tier3_price !== undefined) {
      updateData.tier3_price = body.tier3_price;
    }

    if (body.min_quantity !== undefined) {
      updateData.min_quantity = body.min_quantity;
    }

    if (body.max_quantity !== undefined) {
      updateData.max_quantity = body.max_quantity;
    }

    if (body.is_active !== undefined) {
      updateData.b2b_enabled = body.is_active;
    }

    if (body.image_url !== undefined) {
      updateData.image_url = body.image_url;
    }

    if (body.display_name !== undefined) {
      updateData.display_name = body.display_name;
    }

    if (body.description !== undefined) {
      updateData.description = body.description;
    }

    const { data, error } = await supabase
      .from('product_b2b_config')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating B2B product:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data });

  } catch (error) {
    console.error('Error in PATCH B2B product:', error);
    return NextResponse.json(
      { success: false, error: 'Error del servidor' },
      { status: 500 }
    );
  }
}
