import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseClient } from '@/lib/auth-admin';

export const dynamic = 'force-dynamic';

interface QuoteItem {
  productId?: string;
  variantId?: string | null;
  quantity?: number;
}

const SHIPPING_COST = 7400;
const CHIA_SHIPPING_COST = 13000;
const FREE_SHIPPING_MIN = 68900;
const DELIVERY_AREAS = new Set(['bogota', 'bogotá', 'chia', 'chía', 'soacha']);

function normalize(value: string) {
  return value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function response(data: unknown, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: {
      'Cache-Control': 'no-store',
      'Access-Control-Allow-Origin': '*',
    },
  });
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const items: QuoteItem[] = Array.isArray(body?.items) ? body.items : [];
    const location = String(body?.location || 'Bogotá').trim();

    if (!items.length) return response({ valid: false, code: 'EMPTY_CART', error: 'El carrito está vacío.' }, 400);
    if (items.length > 100) return response({ valid: false, code: 'TOO_MANY_ITEMS', error: 'La cotización supera el límite de productos.' }, 400);
    if (!DELIVERY_AREAS.has(normalize(location))) {
      return response({ valid: false, code: 'OUT_OF_COVERAGE', error: 'Por ahora no tenemos cobertura en esa ciudad.', delivery_area: ['Bogotá', 'Chía', 'Soacha'] }, 422);
    }

    const productIds = [...new Set(items.map(item => item.productId).filter(Boolean))] as string[];
    const variantIds = [...new Set(items.map(item => item.variantId).filter(Boolean))] as string[];
    if (!productIds.length) return response({ valid: false, code: 'INVALID_ITEMS', error: 'La cotización no contiene productos válidos.' }, 400);

    const supabase = createSupabaseClient();
    const [{ data: products, error: productsError }, { data: variants, error: variantsError }] = await Promise.all([
      supabase.from('products').select('id,name,slug,description,price,discount_price,unit,weight,stock,is_active,main_image_url').in('id', productIds),
      variantIds.length
        ? supabase.from('product_variants').select('id,product_id,variant_name,variant_value,price,stock_quantity,is_active').in('id', variantIds)
        : Promise.resolve({ data: [], error: null }),
    ]);

    if (productsError || variantsError) return response({ valid: false, code: 'CATALOG_UNAVAILABLE', error: 'No pudimos consultar el catálogo. Intenta de nuevo.' }, 503);

    const productMap = new Map((products || []).map(product => [product.id, product]));
    const variantMap = new Map((variants || []).map(variant => [variant.id, variant]));
    const invalidItems: Array<{ productId?: string; variantId?: string | null; name: string; reason: string }> = [];
    const quotedItems: Array<Record<string, unknown>> = [];

    for (const item of items) {
      const quantity = Number(item.quantity);
      const product = item.productId ? productMap.get(item.productId) : undefined;
      if (!Number.isInteger(quantity) || quantity < 1 || quantity > 100) {
        invalidItems.push({ productId: item.productId, variantId: item.variantId, name: product?.name || 'Producto', reason: 'cantidad inválida' });
        continue;
      }
      if (!product) {
        invalidItems.push({ productId: item.productId, variantId: item.variantId, name: 'Producto no identificado', reason: 'ya no existe' });
        continue;
      }
      if (!product.is_active) {
        invalidItems.push({ productId: product.id, variantId: item.variantId, name: product.name, reason: 'ya no está disponible' });
        continue;
      }

      let price = Number(product.discount_price ?? product.price ?? 0);
      let presentation = product.unit || 'unidad';
      let stock = Number(product.stock ?? 0);
      if (item.variantId) {
        const variant = variantMap.get(item.variantId);
        if (!variant || variant.product_id !== product.id) {
          invalidItems.push({ productId: product.id, variantId: item.variantId, name: product.name, reason: 'esa presentación ya no existe' });
          continue;
        }
        if (!variant.is_active) {
          invalidItems.push({ productId: product.id, variantId: item.variantId, name: product.name, reason: 'esa presentación ya no está disponible' });
          continue;
        }
        price = Number(variant.price ?? 0);
        presentation = variant.variant_value || variant.variant_name || presentation;
        stock = Number(variant.stock_quantity ?? 0);
      }
      if (stock > 0 && quantity > stock) {
        invalidItems.push({ productId: product.id, variantId: item.variantId, name: product.name, reason: `solo hay ${stock} disponibles` });
        continue;
      }

      quotedItems.push({
        product_id: product.id,
        variant_id: item.variantId || null,
        name: product.name,
        presentation,
        quantity,
        unit_price: price,
        line_total: price * quantity,
        image: product.main_image_url || null,
        purchase_url: `https://tusaguacates.com/productos/${product.slug || product.id}`,
      });
    }

    if (invalidItems.length) {
      return response({ valid: false, code: 'CART_OUTDATED', error: 'Algunos productos o cantidades cambiaron.', invalidItems }, 409);
    }

    const subtotal = quotedItems.reduce((total, item) => total + Number(item.line_total), 0);
    const isChia = normalize(location) === 'chia';
    const freeShipping = !isChia && subtotal >= FREE_SHIPPING_MIN;
    const shipping = isChia ? CHIA_SHIPPING_COST : (freeShipping ? 0 : SHIPPING_COST);
    return response({
      valid: true,
      quote_type: 'preview_only',
      creates_order: false,
      currency: 'COP',
      location,
      delivery_area: ['Bogotá', 'Chía', 'Soacha'],
      items: quotedItems,
      subtotal,
      shipping,
      free_shipping: freeShipping,
      free_shipping_minimum: isChia ? null : FREE_SHIPPING_MIN,
      amount_for_free_shipping: isChia ? 0 : Math.max(0, FREE_SHIPPING_MIN - subtotal),
      discount: 0,
      total: subtotal + shipping,
      next_step: 'Confirma los datos y continúa al checkout para crear el pedido.',
      checkout_url: 'https://tusaguacates.com/checkout',
      generated_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error generating checkout quote:', error);
    return response({ valid: false, code: 'INVALID_REQUEST', error: 'La solicitud de cotización no es válida.' }, 400);
  }
}
