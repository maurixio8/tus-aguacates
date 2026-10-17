import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAgentAuth, createUnauthorizedResponse } from '@/lib/agent-auth';
import {
  buildIlikeConditions,
  extractPresentationTerms,
  getSearchForms,
} from '@/lib/catalog-search';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface AgentVariant {
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
  category: { id: string; name: string };
  image: string | null;
  description: string;
  has_variants: boolean;
  variants: AgentVariant[];
  _searchScore?: number;
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
    console.error('Missing Supabase environment variables:', { hasUrl: !!supabaseUrl, hasKey: !!supabaseKey });
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
    const productId = searchParams.get('id') || '';
    const rawLimit = searchParams.get('limit');
    const rawActiveOnly = searchParams.get('active_only');

    const limit = Math.min(Math.max(parseInt(rawLimit || '50', 10), 1), 500);
    const activeOnly = rawActiveOnly === null ? true : rawActiveOnly !== 'false';

    // Fast path: lookup by exact product UUID (no search needed)
    if (productId) {
      let supabase;
      try {
        supabase = getSupabaseClient();
      } catch (configError) {
        console.error('Supabase configuration error:', configError);
        return NextResponse.json(
          { success: false, error: { code: 'INTERNAL_ERROR', message: 'Server configuration error' } },
          { status: 500 }
        );
      }

      const { data, error } = await supabase
        .from('products')
        .select(`
          id, name, sku, price, discount_price, stock, unit, is_active, description, main_image_url,
          categories:category_id ( id, name ),
          product_variants ( id, variant_name, variant_value, price, stock_quantity, is_active )
        `)
        .eq('id', productId)
        .single();

      if (error || !data) {
        // Try without variants
        const fallback = await supabase
          .from('products')
          .select(`
            id, name, sku, price, discount_price, stock, unit, is_active, description, main_image_url,
            categories:category_id ( id, name )
          `)
          .eq('id', productId)
          .single();

        if (fallback.error || !fallback.data) {
          return NextResponse.json(
            { success: false, error: { code: 'NOT_FOUND', message: 'Product not found' } },
            { status: 404 }
          );
        }

        const item = fallback.data;
        const category = getCategoryValue(item.categories);
        return NextResponse.json({
          success: true,
          data: [{
            id: item.id, name: item.name, sku: item.sku, price: item.price,
            discount_price: item.discount_price, stock: item.stock, unit: item.unit,
            is_active: item.is_active,
            category: { id: category?.id || '', name: category?.name || 'Uncategorized' },
            image: item.main_image_url, description: item.description,
            has_variants: false, variants: [],
          }],
          meta: { query: '', id: productId, count: 1 },
        });
      }

      const item = data;
      const variants = Array.isArray(item.product_variants) ? item.product_variants : [];
      const category = getCategoryValue(item.categories);
      return NextResponse.json({
        success: true,
        data: [{
          id: item.id, name: item.name, sku: item.sku, price: item.price,
          discount_price: item.discount_price, stock: item.stock, unit: item.unit,
          is_active: item.is_active,
          category: { id: category?.id || '', name: category?.name || 'Uncategorized' },
          image: item.main_image_url, description: item.description,
          has_variants: variants.length > 0,
          variants: variants.filter(v => v?.is_active).map(v => ({
            id: v.id, variant_name: v.variant_name, variant_value: v.variant_value,
            price: v.price, stock_quantity: v.stock_quantity, is_active: v.is_active,
          })),
        }],
        meta: { query: '', id: productId, count: 1 },
      });
    }

    let supabase;
    try {
      supabase = getSupabaseClient();
    } catch (configError) {
      console.error('Supabase configuration error:', configError);
      return NextResponse.json(
        { success: false, error: { code: 'INTERNAL_ERROR', message: 'Server configuration error' } },
        { status: 500 }
      );
    }

    const searchParts = extractPresentationTerms(search);
    const productForms = searchParts.productTerm
      ? getSearchForms(searchParts.productTerm)
      : [];

    let variantProductIds: string[] = [];
    if (searchParts.presentationTerms.length > 0) {
      const variantForms = searchParts.presentationTerms.flatMap(getSearchForms);
      const { data: matchingVariants, error: variantsError } = await supabase
        .from('product_variants')
        .select('product_id')
        .eq('is_active', true)
        .or(buildIlikeConditions(['variant_name', 'variant_value'], variantForms));

      if (variantsError) {
        console.error('Error searching product variants:', variantsError);
        return NextResponse.json(
          { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to search product variants' } },
          { status: 500 },
        );
      }

      variantProductIds = Array.from(
        new Set((matchingVariants || []).map((row) => row.product_id).filter(Boolean)),
      );
    }

    let query = supabase
      .from('products')
      .select(`
        id, name, sku, price, discount_price, stock, unit, is_active, description, main_image_url,
        categories:category_id ( id, name ),
        product_variants ( id, variant_name, variant_value, price, stock_quantity, is_active )
      `);

    if (activeOnly) query = query.eq('is_active', true);

    if (search) {
      if (productForms.length > 0) {
        query = query.or(buildIlikeConditions(['name', 'description', 'sku'], productForms));
      }
      if (searchParts.presentationTerms.length > 0) {
        if (variantProductIds.length > 0) {
          query = query.in('id', variantProductIds);
        } else {
          query = query.eq('id', '00000000-0000-0000-0000-000000000000');
        }
      }
    }

    const { data, error } = await query
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching products:', error);
      return NextResponse.json(
        { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch products' } },
        { status: 500 },
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
        category: { id: category?.id || '', name: category?.name || 'Uncategorized' },
        image: item.main_image_url,
        description: item.description,
        has_variants: hasVariants,
        variants: variants
          .filter((variant) => variant?.is_active)
          .map((variant) => ({
            id: variant.id,
            variant_name: variant.variant_name,
            variant_value: variant.variant_value,
            price: variant.price,
            stock_quantity: variant.stock_quantity,
            is_active: variant.is_active,
          })),
      };
    });

    return NextResponse.json({
      success: true,
      data: products,
      meta: { query: search, count: products.length },
    });

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}
