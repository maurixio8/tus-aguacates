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

    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    if (body.b2b_price !== undefined) {
      updateData.b2b_price = body.b2b_price;
    }

    if (body.discount_percentage !== undefined) {
      updateData.discount_percentage = body.discount_percentage;
    }

    if (body.min_quantity !== undefined) {
      updateData.min_quantity = body.min_quantity;
    }

    if (body.is_active !== undefined) {
      updateData.is_b2b_active = body.is_active;
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
