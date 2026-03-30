import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAgentAuth, createUnauthorizedResponse } from '@/lib/agent-auth';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface ProductVariant {
  id: string;
  variant_name: string;
  variant_value: string;
  price: number;
  stock_quantity: number;
  is_active: boolean;
}

interface Product {
  id: string;
  name: string;
  sku: string;
  price: number;
  discount_price: number | null;
  stock: number;
  unit: string;
  is_active: boolean;
  category: {
    id: string;
    name: string;
  };
  image: string | null;
  description: string;
  has_variants: boolean;
}

function getCategoryValue(category: { id?: string; name?: string } | Array<{ id?: string; name?: string }> | null | undefined) {
  if (Array.isArray(category)) {
    return category[0] || null;
  }

  return category || null;
}

function getSupabaseClient() {
  const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').replace(/\\n/g, '').replace(/\\r/g, '').trim();
  const rawKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  const supabaseKey = rawKey.replace(/\\n/g, '').replace(/\\r/g, '').trim();

  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase environment variables:', {
      hasUrl: !!supabaseUrl,
      hasKey: !!supabaseKey
    });
    throw new Error('Missing Supabase configuration');
  }

  return createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export async function GET(request: NextRequest) {
  try {
    const authResult = requireAgentAuth(request);

    if (!authResult.success) {
      return createUnauthorizedResponse();
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const rawLimit = searchParams.get('limit');
    const rawActiveOnly = searchParams.get('active_only');

    const limit = Math.min(Math.max(parseInt(rawLimit || '5', 10), 1), 20);
    const activeOnly = rawActiveOnly === null ? true : rawActiveOnly !== 'false';

    let supabase;
    try {
      supabase = getSupabaseClient();
    } catch (configError) {
      console.error('Supabase configuration error:', configError);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Server configuration error',
          },
        },
        { status: 500 }
      );
    }

    let query = supabase
      .from('products')
      .select(`
        id,
        name,
        sku,
        price,
        discount_price,
        stock,
        unit,
        is_active,
        description,
        main_image_url,
        categories:category_id (
          id,
          name
        ),
        product_variants (
          id,
          variant_name,
          variant_value,
          price,
          stock_quantity,
          is_active
        )
      `)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%,sku.ilike.%${search}%`);
    }

    if (activeOnly) {
      query = query.eq('is_active', true);
    }

    const { data, error } = await query;

    if (error && error.message?.includes('product_variants')) {
      const fallbackQuery = supabase
        .from('products')
        .select(`
          id,
          name,
          sku,
          price,
          discount_price,
          stock,
          unit,
          is_active,
          description,
          main_image_url,
          categories:category_id (
            id,
            name
          )
        `)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (search) {
        fallbackQuery.or(`name.ilike.%${search}%,description.ilike.%${search}%,sku.ilike.%${search}%`);
      }

      if (activeOnly) {
        fallbackQuery.eq('is_active', true);
      }

      const fallbackResult = await fallbackQuery;

      if (fallbackResult.error) {
        console.error('Error fetching products:', fallbackResult.error);
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'INTERNAL_ERROR',
              message: 'Failed to fetch products',
            },
          },
          { status: 500 }
        );
      }

      const products: Product[] = (fallbackResult.data || []).map((item) => {
        const category = getCategoryValue(item.categories);

        return {
        id: item.id,
        name: item.name,
        sku: item.sku,
        price: item.price,
        discount_price: item.discount_price,
        stock: item.stock,
        unit: item.unit,
        is_active: item.is_active,
        category: {
          id: category?.id || '',
          name: category?.name || 'Uncategorized',
        },
        image: item.main_image_url,
        description: item.description,
        has_variants: false,
        };
      });

      return NextResponse.json({
        success: true,
        data: products,
        meta: {
          query: search,
          count: products.length,
        },
      });
    }

    if (error) {
      console.error('Error fetching products:', error);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Failed to fetch products',
          },
        },
        { status: 500 }
      );
    }

    const products: Product[] = (data || []).map((item) => {
      const variants = Array.isArray(item.product_variants) ? item.product_variants : [];
      const category = getCategoryValue(item.categories);
      const hasVariants = variants.length > 0;

      return {
        id: item.id,
        name: item.name,
        sku: item.sku,
        price: item.price,
        discount_price: item.discount_price,
        stock: item.stock,
        unit: item.unit,
        is_active: item.is_active,
        category: {
          id: category?.id || '',
          name: category?.name || 'Uncategorized',
        },
        image: item.main_image_url,
        description: item.description,
        has_variants: hasVariants,
      };
    });

    return NextResponse.json({
      success: true,
      data: products,
      meta: {
        query: search,
        count: products.length,
      },
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Internal server error',
        },
      },
      { status: 500 }
    );
  }
}
