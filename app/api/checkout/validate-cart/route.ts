import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseClient } from '@/lib/auth-admin';

export const dynamic = 'force-dynamic';

interface CartItemInput {
  productId?: string;
  variantId?: string | null;
  price?: number;
  quantity?: number;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const items: CartItemInput[] = Array.isArray(body?.items) ? body.items : [];

    if (items.length === 0) {
      return NextResponse.json({ valid: false, error: 'El carrito está vacío.' }, { status: 400 });
    }

    const productIds = [...new Set(items.map(item => item.productId).filter(Boolean))] as string[];
    const variantIds = [...new Set(items.map(item => item.variantId).filter(Boolean))] as string[];
    const supabase = createSupabaseClient();

    const [{ data: products, error: productsError }, { data: variants, error: variantsError }] = await Promise.all([
      supabase
        .from('products')
        .select('id,name,price,discount_price,is_active')
        .in('id', productIds),
      variantIds.length > 0
        ? supabase
            .from('product_variants')
            .select('id,product_id,variant_value,price,is_active')
            .in('id', variantIds)
        : Promise.resolve({ data: [], error: null }),
    ]);

    if (productsError || variantsError) {
      console.error('❌ Validación de carrito falló:', productsError || variantsError);
      return NextResponse.json({ valid: false, error: 'No pudimos verificar los productos. Intenta de nuevo.' }, { status: 503 });
    }

    const productMap = new Map((products || []).map(product => [product.id, product]));
    const variantMap = new Map((variants || []).map(variant => [variant.id, variant]));
    const invalidItems: Array<{ productId?: string; variantId?: string | null; name: string; reason: string; currentPrice?: number }> = [];

    for (const item of items) {
      const product = item.productId ? productMap.get(item.productId) : undefined;
      const name = product?.name || 'Producto no identificado';

      if (!product) {
        invalidItems.push({ productId: item.productId, variantId: item.variantId, name, reason: 'ya no existe' });
        continue;
      }

      if (!product.is_active) {
        invalidItems.push({ productId: product.id, variantId: item.variantId, name: product.name, reason: 'ya no está disponible' });
        continue;
      }

      let currentPrice = Number(product.discount_price || product.price || 0);
      if (item.variantId) {
        const variant = variantMap.get(item.variantId);
        if (!variant || variant.product_id !== product.id) {
          invalidItems.push({ productId: product.id, variantId: item.variantId, name: product.name, reason: 'esa presentación ya no existe' });
          continue;
        }
        if (!variant.is_active) {
          invalidItems.push({ productId: product.id, variantId: item.variantId, name: product.name, reason: `la presentación ${variant.variant_value || ''} ya no está disponible`.trim() });
          continue;
        }
        currentPrice = Number(variant.price || 0);
      }

      const submittedPrice = Number(item.price || 0);
      if (Math.round(submittedPrice) !== Math.round(currentPrice)) {
        invalidItems.push({ productId: product.id, variantId: item.variantId, name: product.name, reason: 'cambió de precio', currentPrice });
      }
    }

    if (invalidItems.length > 0) {
      return NextResponse.json({
        valid: false,
        code: 'CART_OUTDATED',
        error: 'Tu carrito tiene productos o precios desactualizados. Revísalo antes de continuar.',
        invalidItems,
      }, { status: 409 });
    }

    return NextResponse.json({ valid: true });
  } catch (error) {
    console.error('❌ Error validando carrito:', error);
    return NextResponse.json({ valid: false, error: 'No pudimos verificar el carrito. Intenta de nuevo.' }, { status: 500 });
  }
}
