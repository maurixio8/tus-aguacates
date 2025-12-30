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

    // Query productos B2B con join a productos base
    let query = supabase
      .from('product_b2b_config')
      .select(`
        *,
        products!inner (
          id,
          name,
          description,
          price,
          main_image_url,
          stock,
          is_active,
          categories (
            id,
            name,
            slug
          )
        )
      `, { count: 'exact' })
      .order('created_at', { ascending: false });

    // Filtro por estado B2B
    if (status === 'active') {
      query = query.eq('is_b2b_active', true);
    } else if (status === 'inactive') {
      query = query.eq('is_b2b_active', false);
    }

    // Paginación
    query = query.range(offset, offset + limit - 1);

    const { data: b2bProducts, error, count } = await query;

    if (error) {
      console.error('Error fetching B2B products:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    // Filtrar por búsqueda y categoría
    let filteredProducts = b2bProducts || [];

    if (search) {
      const searchLower = search.toLowerCase();
      filteredProducts = filteredProducts.filter(item =>
        item.products?.name?.toLowerCase().includes(searchLower)
      );
    }

    if (category) {
      filteredProducts = filteredProducts.filter(item =>
        item.products?.categories?.slug === category
      );
    }

    // Transformar datos
    const transformedProducts = filteredProducts.map(item => ({
      id: item.id,
      product_id: item.product_id,
      name: item.products?.name || 'Producto',
      description: item.products?.description,
      original_price: item.products?.price || 0,
      b2b_price: item.b2b_price || Math.round((item.products?.price || 0) * 0.8),
      discount_percentage: item.discount_percentage || 20,
      min_quantity: item.min_quantity || 10,
      stock: item.products?.stock || 0,
      is_active: item.is_b2b_active !== false,
      main_image_url: item.image_url || item.products?.main_image_url,
      category_name: item.products?.categories?.name,
      category_slug: item.products?.categories?.slug
    }));

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
