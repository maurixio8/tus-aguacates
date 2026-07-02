/**
 * Helper functions para gestionar variantes de productos
 * Preparado para integración con catálogo JSON
 */

import { supabase } from './supabase';

function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

export function normalizeVariantValue(value?: string | null): string {
  const raw = normalizeText(value || '')
    .replace(/\(ahorro\)/g, '')
    .replace(/^x\s*/g, '')
    .replace(/\s+/g, '');

  if (/^(1kg|1kilo|1000gr|1000grs)$/.test(raw)) return '1000grs';
  if (/^(500gr|500grs)$/.test(raw)) return '500grs';
  if (/^(250gr|250grs)$/.test(raw)) return '250grs';
  if (/^(400gr|400grs)$/.test(raw)) return '400grs';
  if (/^(800gr|800grs)$/.test(raw)) return '800grs';

  return raw;
}

export function dedupeVariants<T extends { variant_name?: string | null; variant_value?: string | null }>(variants: T[]): T[] {
  const seen = new Set<string>();
  const deduped: T[] = [];

  for (const variant of variants) {
    const key = `${normalizeText(variant.variant_name || '')}:${normalizeVariantValue(variant.variant_value || variant.variant_name || '')}`;

    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(variant);
  }

  return deduped;
}

export interface ProductVariant {
  id: string;
  product_id: string;
  variant_name: string;
  variant_value: string;
  price: number;
  price_adjustment: number;
  stock_quantity: number;
  sku?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProductWithVariants {
  id: string;
  name: string;
  price: number;
  variants: ProductVariant[];
}

/**
 * Obtener todas las variantes activas de un producto
 */
export async function getProductVariants(productId: string): Promise<ProductVariant[]> {
  const { data, error } = await supabase
    .from('product_variants')
    .select('*')
    .eq('product_id', productId)
    .eq('is_active', true)
    .order('variant_name', { ascending: true })
    .order('price_adjustment', { ascending: true });

  if (error) {
    console.error('Error al obtener variantes:', error);
    return [];
  }

  return dedupeVariants(data || []);
}

/**
 * Calcular el precio final de un producto con variante seleccionada
 */
export function calculateVariantPrice(basePrice: number, priceAdjustment: number): number {
  return basePrice + priceAdjustment;
}

/**
 * Agrupar variantes por nombre (útil para selectores en UI)
 */
export function groupVariantsByName(variants: ProductVariant[]): Record<string, ProductVariant[]> {
  return variants.reduce((acc, variant) => {
    if (!acc[variant.variant_name]) {
      acc[variant.variant_name] = [];
    }
    acc[variant.variant_name].push(variant);
    return acc;
  }, {} as Record<string, ProductVariant[]>);
}

/**
 * Verificar si un producto tiene variantes disponibles
 */
export async function hasVariants(productId: string): Promise<boolean> {
  const variants = await getProductVariants(productId);
  return variants.length > 0;
}

/**
 * Insertar variantes desde catálogo JSON
 * Ejemplo de uso cuando llegue el catálogo del usuario
 */
export async function insertVariantsFromCatalog(
  productId: string,
  variants: Array<{
    name: string;
    value: string;
    priceAdjustment: number;
    stock: number;
    sku?: string;
  }>
) {
  const variantsToInsert = variants.map(v => ({
    product_id: productId,
    variant_name: v.name,
    variant_value: v.value,
    price_adjustment: v.priceAdjustment,
    stock_quantity: v.stock,
    sku: v.sku,
    is_active: true,
  }));

  const { data, error } = await supabase
    .from('product_variants')
    .insert(variantsToInsert)
    .select();

  if (error) {
    console.error('Error al insertar variantes:', error);
    throw error;
  }

  return data;
}

/**
 * Formatear variante para mostrar en UI
 * Ejemplo: "Tamaño: Grande (+$800)"
 */
export function formatVariantDisplay(variant: ProductVariant): string {
  const priceText = variant.price_adjustment !== 0
    ? ` (${variant.price_adjustment > 0 ? '+' : ''}$${variant.price_adjustment.toLocaleString('es-CO')})`
    : '';
  
  return `${variant.variant_name}: ${variant.variant_value}${priceText}`;
}

/**
 * Verificar disponibilidad de stock de una variante
 */
export function isVariantAvailable(variant: ProductVariant): boolean {
  return variant.is_active && variant.stock_quantity > 0;
}
