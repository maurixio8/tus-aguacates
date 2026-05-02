import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

// Crear cliente de Supabase
function createSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://gxqkmaaqoehydulksudj.supabase.co';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd4cWttYWFxb2VoeWR1bGtzdWRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI0NDI5NDQsImV4cCI6MjA3ODAxODk0NH0.XAR-ysQgt0ZkRZfIZx_DvpYMzmEMFsdAYK3EP1tc0mw';
  
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });
}

// GET - List all active products with variants
export async function GET(request: NextRequest) {
  try {
    const supabase = createSupabaseClient();
    
    // Obtener todos los productos activos con sus variantes
    const { data: products, error } = await supabase
      .from('products')
      .select(`
        *,
        variants:product_variants(*)
      `)
      .eq('is_active', true)
      .order('name');

    if (error) {
      console.error('❌ Error fetching products:', error);
      return NextResponse.json(
        { error: 'Error fetching products', details: error.message },
        { status: 500 }
      );
    }

    // Formatear respuesta para el bot
    const formattedProducts = products?.map(p => ({
      id: p.id,
      name: p.name,
      description: p.description || '',
      price: p.price || 0,
      category: p.category_name || '',
      image: p.main_image_url || '',
      stock: p.stock || 0,
      unit: p.unit || 'unidad',
      is_active: p.is_active,
      variants: (p.variants || []).map((v: any) => ({
        id: v.id,
        name: v.variant_name,
        price: v.price || p.price || 0,
        price_adjustment: v.price_adjustment || 0,
        stock: v.stock_quantity || 0,
        is_active: v.is_active !== false
      }))
    })) || [];

    return NextResponse.json({
      products: formattedProducts,
      total: formattedProducts.length,
      timestamp: new Date().toISOString()
    });

  } catch (err: any) {
    console.error('❌ Unexpected error:', err);
    return NextResponse.json(
      { error: 'Internal server error', details: err.message },
      { status: 500 }
    );
  }
}
