import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET - Obtener productos B2B
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search');
    const category = searchParams.get('category');
    const status = searchParams.get('status');

    const offset = (page - 1) * limit;

    // Query productos B2B directamente de product_b2b_config
    let query = supabase
      .from('product_b2b_config')
      .select('*', { count: 'exact' })
      .order('b2b_category')
      .order('display_order');

    // Filtro por estado B2B
    if (status === 'active') {
      query = query.eq('b2b_enabled', true);
    } else if (status === 'inactive') {
      query = query.eq('b2b_enabled', false);
    }

    // Filtro por categoría
    if (category) {
      query = query.eq('b2b_category', category);
    }

    // Paginación
    query = query.range(offset, offset + limit - 1);

    const { data: b2bProducts, error, count } = await query;

    if (error) {
      console.error('Error fetching B2B products:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    // Filtrar por búsqueda
    let filteredProducts = b2bProducts || [];

    if (search) {
      const searchLower = search.toLowerCase();
      filteredProducts = filteredProducts.filter(item =>
        item.product_slug?.toLowerCase().includes(searchLower) ||
        item.display_name?.toLowerCase().includes(searchLower) ||
        item.b2b_category?.toLowerCase().includes(searchLower)
      );
    }

    // Transformar datos para el admin
    const transformedProducts = filteredProducts.map(item => {
      // Construir nombre si no existe display_name
      let productName = item.display_name || '';
      if (!productName) {
        productName = item.product_slug
          .replace('-b2b', '')
          .split('-')
          .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
      }

      // Calcular precio promedio de los tiers
      const avgPrice = Math.round((item.tier1_price + item.tier2_price + item.tier3_price) / 3);

      return {
        id: item.id,
        product_slug: item.product_slug,
        name: productName,
        description: item.description || item.notes,
        original_price: item.base_price || item.tier1_price,
        b2b_price: avgPrice,
        tier1_price: item.tier1_price,
        tier2_price: item.tier2_price,
        tier3_price: item.tier3_price,
        discount_percentage: item.base_price > 0
          ? Math.round((1 - avgPrice / item.base_price) * 100)
          : 0,
        min_quantity: item.min_quantity || 10,
        max_quantity: item.max_quantity || 1000,
        unit: item.unit || 'kg',
        is_active: item.b2b_enabled,
        main_image_url: item.image_url,
        category_name: item.b2b_category,
        category_slug: item.b2b_category,
        avocado_variety: item.avocado_variety,
        ripeness_state: item.ripeness_state
      };
    });

    return NextResponse.json({
      success: true,
      products: transformedProducts,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    });

  } catch (error) {
    console.error('Error in B2B products API:', error);
    return NextResponse.json({ success: false, error: 'Error del servidor' }, { status: 500 });
  }
}
