import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import {
  buildIlikeConditions,
  extractPresentationTerms,
  getSearchForms,
} from '@/lib/catalog-search';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function createSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase public configuration is missing');
  }
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

interface PublicVariantRow {
  id: string;
  variant_name: string | null;
  variant_value: string | null;
  price: number | null;
  stock_quantity: number | null;
  is_active: boolean | null;
}

interface PublicCategoryRow {
  id: string;
  name: string;
  slug: string;
}

interface PublicProductRow {
  id: string;
  name: string;
  slug: string | null;
  sku: string | null;
  description: string | null;
  price: number | null;
  discount_price: number | null;
  unit: string | null;
  weight: number | null;
  stock: number | null;
  is_active: boolean;
  is_featured: boolean;
  main_image_url: string | null;
  category: PublicCategoryRow | PublicCategoryRow[] | null;
  variants: PublicVariantRow[] | null;
}

function normalize(value: string) {
  return value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = normalize(searchParams.get('search')?.trim() || '');
    const category = normalize(searchParams.get('category')?.trim() || '');
    const requestedLimit = Number(searchParams.get('limit') || '100');
    const limit = Math.min(Math.max(Number.isFinite(requestedLimit) ? requestedLimit : 100, 1), 500);
    const supabase = createSupabaseClient();

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
        console.error('Error searching public variants:', variantsError);
        return NextResponse.json({ error: 'Error searching product variants' }, { status: 500 });
      }

      variantProductIds = Array.from(
        new Set((matchingVariants || []).map((row) => row.product_id).filter(Boolean)),
      );
    }

    let query = supabase
      .from('products')
      .select(`
        id, name, slug, sku, description, price, discount_price, unit, weight,
        stock, is_active, is_featured, main_image_url,
        category:categories!category_id ( id, name, slug ),
        variants:product_variants ( id, variant_name, variant_value, price, stock_quantity, is_active )
      `)
      .eq('is_active', true);

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

    const { data: products, error } = await query
      .order('name')
      .limit(limit);

    if (error) {
      console.error('Error fetching public catalog:', error);
      return NextResponse.json({ error: 'Error fetching products' }, { status: 500 });
    }

    const formattedProducts = (products || [])
      .map((product: PublicProductRow) => {
        const categoryData = Array.isArray(product.category) ? product.category[0] : product.category;
        const activeVariants = (product.variants || [])
          .filter((variant: PublicVariantRow) => variant.is_active !== false)
          .map((variant: PublicVariantRow) => ({
            id: variant.id,
            name: variant.variant_name || variant.variant_value || 'Presentación estándar',
            value: variant.variant_value || '',
            price: Number(variant.price ?? product.discount_price ?? product.price ?? 0),
            stock: Number(variant.stock_quantity ?? 0),
            availability: Number(variant.stock_quantity ?? 0) > 0 ? 'InStock' : 'OutOfStock',
          }));
        const currentPrice = Number(product.discount_price ?? product.price ?? 0);
        return {
          id: product.id,
          name: product.name,
          slug: product.slug || product.id,
          sku: product.sku || null,
          description: product.description || '',
          category: categoryData ? { id: categoryData.id, name: categoryData.name, slug: categoryData.slug } : null,
          price: currentPrice,
          regular_price: Number(product.price ?? 0),
          discount_price: product.discount_price ?? null,
          unit: product.unit || 'unidad',
          weight: product.weight ?? null,
          stock: Number(product.stock ?? 0),
          availability: Number(product.stock ?? 0) > 0 ? 'InStock' : 'OutOfStock',
          is_featured: product.is_featured === true,
          image: product.main_image_url || null,
          purchase_url: `https://tusaguacates.com/productos/${product.slug || product.id}`,
          variants: activeVariants,
        };
      })
      .filter((product) => {
        return !category || normalize(product.category?.slug || '').includes(category) || normalize(product.category?.name || '').includes(category);
      })
      .map((product) => product);

    return NextResponse.json(
      {
        name: 'Tus Aguacates catálogo público',
        description: 'Catálogo actual de productos activos para compra en línea.',
        currency: 'COP',
        delivery_area: ['Bogotá', 'Chía', 'Soacha'],
        products: formattedProducts,
        total: formattedProducts.length,
        timestamp: new Date().toISOString(),
      },
      {
        headers: {
          'Cache-Control': 'public, max-age=60, s-maxage=60, stale-while-revalidate=300',
          'Access-Control-Allow-Origin': '*',
        },
      },
    );
  } catch (error) {
    console.error('Unexpected public catalog error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}