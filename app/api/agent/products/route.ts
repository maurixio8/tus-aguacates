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

// Normalize accents: áéíóúüñ -> aeioun
function normalizeAccents(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .replace(/ü/g, 'u')
    .replace(/ñ/g, 'n');
}

// Check if product matches search term (accent-insensitive)
// Supports multi-word: "aceite coco" matches "Aceite de coco" (all words must be present)
function productMatchesSearch(product: { name: string; description?: string | null; sku?: string | null }, searchTerm: string): boolean {
  const normalizedName = normalizeAccents(product.name);
  const normalizedDesc = product.description ? normalizeAccents(product.description) : '';
  const normalizedSku = product.sku ? normalizeAccents(product.sku) : '';

  // Try exact phrase first
  const normalizedSearch = normalizeAccents(searchTerm);
  if (normalizedName.includes(normalizedSearch) || normalizedDesc.includes(normalizedSearch) || normalizedSku.includes(normalizedSearch)) {
    return true;
  }

  // Multi-word: all individual words must appear in name or description
  const words = normalizedSearch.split(/\s+/).filter(w => w.length > 1);
  if (words.length > 1) {
    const allWordsInName = words.every(w => normalizedName.includes(w));
    const allWordsInDesc = words.every(w => normalizedDesc.includes(w));
    if (allWordsInName || allWordsInDesc) {
      return true;
    }
  }

  return false;
}

// Calculate search relevance score
function calculateSearchScore(product: { name: string; description?: string | null; sku?: string | null }, searchTerm: string): number {
  const normalizedSearch = normalizeAccents(searchTerm);
  const normalizedName = normalizeAccents(product.name);
  const normalizedDesc = product.description ? normalizeAccents(product.description) : '';
  const normalizedSku = product.sku ? normalizeAccents(product.sku) : '';

  // Exact match (case + accent insensitive) = 100
  if (normalizedName === normalizedSearch) {
    return 100;
  }

  // Starts with = 85
  if (normalizedName.startsWith(normalizedSearch)) {
    return 85;
  }

  // Word boundary match (product name contains search as a whole word) = 75
  const wordBoundaryRegex = new RegExp(`\\b${escapeRegex(normalizedSearch)}\\b`, 'i');
  if (wordBoundaryRegex.test(normalizedName)) {
    return 75;
  }

  // Contains in name = 60
  if (normalizedName.includes(normalizedSearch)) {
    return 60;
  }

  // Multi-word: all words in name = 55
  const searchWords = normalizedSearch.split(/\s+/).filter(w => w.length > 1);
  if (searchWords.length > 1 && searchWords.every(w => normalizedName.includes(w))) {
    return 55;
  }

  // SKU match = 50
  if (normalizedSku && normalizedSku.includes(normalizedSearch)) {
    return 50;
  }

  // Contains in description = 20
  if (normalizedDesc && normalizedDesc.includes(normalizedSearch)) {
    return 20;
  }

  return 0;
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
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

    // When searching, fetch ALL products and filter in JavaScript for accent-insensitive matching
    // This is necessary because Supabase/PostgreSQL ilike doesn't handle accents properly
    const fetchLimit = search ? 500 : limit;

    let query = supabase
      .from('products')
      .select(`
        id, name, sku, price, discount_price, stock, unit, is_active, description, main_image_url,
        categories:category_id ( id, name ),
        product_variants ( id, variant_name, variant_value, price, stock_quantity, is_active )
      `)
      .order('created_at', { ascending: false })
      .limit(fetchLimit);

    if (activeOnly) {
      query = query.eq('is_active', true);
    }

    const { data, error } = await query;

    if (error && error.message?.includes('product_variants')) {
      // Fallback without variants
      let fallbackQuery = supabase
        .from('products')
        .select(`
          id, name, sku, price, discount_price, stock, unit, is_active, description, main_image_url,
          categories:category_id ( id, name )
        `)
        .order('created_at', { ascending: false })
        .limit(fetchLimit);

      if (activeOnly) {
        fallbackQuery = fallbackQuery.eq('is_active', true);
      }

      const fallbackResult = await fallbackQuery;

      if (fallbackResult.error) {
        console.error('Error fetching products:', fallbackResult.error);
        return NextResponse.json(
          { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch products' } },
          { status: 500 }
        );
      }

      let products: Product[] = (fallbackResult.data || []).map((item) => {
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
          category: { id: category?.id || '', name: category?.name || 'Uncategorized' },
          image: item.main_image_url,
          description: item.description,
          has_variants: false,
          variants: [],
        };
      });

      // Apply accent-insensitive search filtering and relevance ranking
      if (search) {
        products = products
          .filter(p => productMatchesSearch(p, search))
          .map(p => ({ ...p, _searchScore: calculateSearchScore(p, search) }))
          .sort((a, b) => (b._searchScore! - a._searchScore!) || a.name.localeCompare(b.name))
          .slice(0, limit);
      }

      return NextResponse.json({
        success: true,
        data: products,
        meta: { query: search, count: products.length },
      });
    }

    if (error) {
      console.error('Error fetching products:', error);
      return NextResponse.json(
        { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch products' } },
        { status: 500 }
      );
    }

    let products: Product[] = (data || []).map((item) => {
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

    // Apply accent-insensitive search filtering and relevance ranking
    if (search) {
      products = products
        .filter(p => productMatchesSearch(p, search))
        .map(p => ({ ...p, _searchScore: calculateSearchScore(p, search) }))
        .sort((a, b) => (b._searchScore! - a._searchScore!) || a.name.localeCompare(b.name))
        .slice(0, limit);
    }

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
