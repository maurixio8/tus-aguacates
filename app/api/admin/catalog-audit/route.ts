import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseClient, requireAdminRole } from '@/lib/auth-admin';

export const dynamic = 'force-dynamic';

const CANCELLED = new Set(['cancelled', 'cancelado', 'canceled']);

function normalize(value: unknown): string {
  return String(value || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ').trim();
}

function add(list: any[], severity: 'critical' | 'warning' | 'info', type: string, title: string, detail: string, context?: any) {
  list.push({ severity, type, title, detail, context: context || null });
}

export async function GET(request: NextRequest) {
  const access = await requireAdminRole(request, 'admin');
  if (access.response) return access.response;

  try {
    const supabase = createSupabaseClient();
    const [productsResult, variantsResult, ordersResult, guestsResult] = await Promise.all([
      supabase.from('products').select('*').limit(5000),
      supabase.from('product_variants').select('*').limit(10000),
      supabase.from('orders').select('id,order_number,created_at,status,order_status,order_data').order('created_at', { ascending: false }).limit(1000),
      supabase.from('guest_orders').select('id,created_at,status,order_status,order_data').order('created_at', { ascending: false }).limit(1000),
    ]);

    if (productsResult.error) throw productsResult.error;
    if (variantsResult.error) throw variantsResult.error;
    if (ordersResult.error) throw ordersResult.error;
    if (guestsResult.error) throw guestsResult.error;

    const products = productsResult.data || [];
    const variants = variantsResult.data || [];
    const findings: any[] = [];
    const productMap = new Map(products.map(p => [p.id, p]));
    const variantsByProduct = new Map<string, any[]>();
    for (const variant of variants) {
      const list = variantsByProduct.get(variant.product_id) || [];
      list.push(variant);
      variantsByProduct.set(variant.product_id, list);
      if (!productMap.has(variant.product_id)) add(findings, 'critical', 'orphan_variant', 'Variante sin producto', `La variante ${variant.variant_value || variant.id} apunta a un producto que no existe.`, { variantId: variant.id, productId: variant.product_id });
    }

    for (const product of products) {
      const activeVariants = (variantsByProduct.get(product.id) || []).filter(v => v.is_active !== false);
      if (!product.is_active && activeVariants.length > 0) {
        add(findings, 'critical', 'inactive_product_active_variant', 'Producto inactivo con variantes activas', `${product.name} está inactivo, pero tiene ${activeVariants.length} variante(s) activa(s).`, { productId: product.id, name: product.name, variants: activeVariants.map(v => v.variant_value) });
      }
      if (product.is_active && product.price == null && activeVariants.length === 0) {
        add(findings, 'critical', 'missing_price', 'Producto activo sin precio', `${product.name} está activo y no tiene precio ni variantes activas.`, { productId: product.id, name: product.name });
      }
      for (const variant of activeVariants) {
        if (Number(variant.price || 0) <= 0) add(findings, 'critical', 'variant_missing_price', 'Variante activa sin precio', `${product.name} / ${variant.variant_value || variant.variant_name} no tiene precio válido.`, { productId: product.id, variantId: variant.id });
      }
      if (activeVariants.length === 1 && Number(product.price || 0) !== Number(activeVariants[0].price || 0)) {
        add(findings, 'warning', 'price_desync', 'Precio base y variante desincronizados', `${product.name}: base $${product.price || 0} vs variante $${activeVariants[0].price || 0}.`, { productId: product.id, basePrice: product.price, variantPrice: activeVariants[0].price, variantId: activeVariants[0].id });
      }
    }

    const byName = new Map<string, any[]>();
    for (const product of products) {
      const key = normalize(product.name);
      const list = byName.get(key) || [];
      list.push(product);
      byName.set(key, list);
    }
    for (const [name, list] of byName) {
      if (list.length > 1) add(findings, 'warning', 'duplicate_name', 'Productos con nombre duplicado', `Hay ${list.length} productos con el nombre "${name}".`, { products: list.map(p => ({ id: p.id, name: p.name, price: p.price, active: p.is_active })) });
    }

    const referencedProducts = new Set<string>();
    const referencedVariants = new Set<string>();
    const allOrders = [...(ordersResult.data || []), ...(guestsResult.data || [])].filter(o => !CANCELLED.has(String(o.status || o.order_status || '').toLowerCase()));
    for (const order of allOrders as any[]) {
      let data = order.order_data;
      if (typeof data === 'string') { try { data = JSON.parse(data); } catch { data = null; } }
      const items = Array.isArray(order.order_items) && order.order_items.length > 0 ? order.order_items : (data?.items || []);
      for (const item of items) {
        const productId = item.product_id || item.productId;
        const variantId = item.variant_id || item.variantId;
        if (productId) referencedProducts.add(productId);
        if (variantId) referencedVariants.add(variantId);
        if (productId && !productMap.has(productId)) add(findings, 'critical', 'order_missing_product', 'Pedido referencia producto inexistente', `Un pedido reciente referencia el producto ${productId}, que no existe en el catálogo.`, { orderId: order.id, productId });
        if (variantId && !variants.some(v => v.id === variantId)) add(findings, 'critical', 'order_missing_variant', 'Pedido referencia variante inexistente', `Un pedido reciente referencia la variante ${variantId}, que no existe actualmente.`, { orderId: order.id, variantId, productId });
      }
    }

    const comboProducts = products.filter(p => normalize(p.name).includes('combo'));
    for (const combo of comboProducts) {
      if (!combo.description || String(combo.description).trim().length < 20) add(findings, 'warning', 'combo_missing_description', 'Combo sin descripción operativa', `${combo.name} no tiene una descripción suficientemente detallada de sus componentes.`, { productId: combo.id, name: combo.name });
    }

    const counts = { critical: findings.filter(f => f.severity === 'critical').length, warning: findings.filter(f => f.severity === 'warning').length, info: findings.filter(f => f.severity === 'info').length };
    return NextResponse.json({ success: true, generatedAt: new Date().toISOString(), summary: { products: products.length, variants: variants.length, ordersAudited: allOrders.length, referencedProducts: referencedProducts.size, referencedVariants: referencedVariants.size, ...counts }, findings });
  } catch (error) {
    console.error('Error en auditoría de catálogo:', error);
    return NextResponse.json({ success: false, error: 'No se pudo auditar el catálogo', details: error instanceof Error ? error.message : JSON.stringify(error) }, { status: 500 });
  }
}
