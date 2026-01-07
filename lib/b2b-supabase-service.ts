/**
 * SERVICIO SUPABASE PARA PRODUCTOS B2B
 *
 * Conecta con las nuevas tablas b2b_products, b2b_categories, b2b_pricing_tiers
 * para obtener productos B2B actualizados.
 */

import { supabase } from './supabase';
import { BusinessProduct, BusinessProductVariant } from './business-products';

// Tipos que coinciden con las tablas Supabase
export interface B2BProductRow {
  id: string;
  sku: string;
  name: string;
  description: string | null;
  category_id: string;
  base_price: number;
  unit: string;
  minimum_order_quantity: number;
  stock_quantity: number;
  main_image_url: string | null;
  is_active: boolean;
  is_featured: boolean | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface B2BCategoryRow {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  display_order: number | null;
  is_active: boolean;
}

export interface B2BPricingTierRow {
  id: string;
  product_id: string;
  min_quantity: number;
  max_quantity: number | null;
  price_per_unit: number;
  tier_name: string;
  discount_percentage: number;
}

// Resultado del join con pricing tiers
interface B2BProductWithTiers extends B2BProductRow {
  b2b_pricing_tiers: B2BPricingTierRow[];
  category: B2BCategoryRow | null;
}

/**
 * Transforma un row de Supabase (con tiers y category) a BusinessProduct
 */
function transformToBusinessProduct(product: B2BProductWithTiers): BusinessProduct {
  // Ordenar tiers por min_quantity
  const sortedTiers = product.b2b_pricing_tiers.sort((a, b) => a.min_quantity - b.min_quantity);

  // Crear variantes de precio - mapear a tier1, tier2, tier3 según el orden
  const tierNames: Array<'tier1' | 'tier2' | 'tier3'> = ['tier1', 'tier2', 'tier3'];
  const variants: BusinessProductVariant[] = sortedTiers.slice(0, 3).map((tier, index) => ({
    id: `${product.sku}-t${tier.min_quantity}`,
    name: tier.tier_name,
    price: tier.price_per_unit * tier.min_quantity,
    minKg: tier.min_quantity,
    maxKg: tier.max_quantity ?? tier.min_quantity * 10, // Default si es null
    pricePerKg: tier.price_per_unit,
    tier: tierNames[index] || 'tier3',
  }));

  // Obtener info de categoría
  const categoryName = product.category?.name || 'Sin categoría';
  const categorySlug = product.category?.slug || 'sin-categoria';

  return {
    id: product.id,
    name: product.name,
    description: product.description || `${product.name} para empresas - pedido mínimo ${product.minimum_order_quantity} ${product.unit}`,
    category: categoryName,
    categorySlug: categorySlug,
    unit: product.unit,
    variants,
    available_for: 'business',
    is_active: product.is_active,
    image: product.main_image_url || undefined,
  };
}

/**
 * Obtiene todos los productos B2B activos desde Supabase
 */
export async function fetchB2BProducts(): Promise<BusinessProduct[]> {
  const { data, error } = await supabase
    .from('b2b_products')
    .select(`
      *,
      b2b_pricing_tiers (
        id,
        product_id,
        min_quantity,
        max_quantity,
        price_per_unit,
        tier_name,
        discount_percentage
      ),
      category (
        id,
        name,
        slug,
        description,
        icon,
        display_order,
        is_active
      )
    `)
    .eq('is_active', true)
    .is('deleted_at', null)
    .order('sku');

  if (error) {
    console.error('Error fetching B2B products from Supabase:', error);
    return [];
  }

  const products = data as unknown as B2BProductWithTiers[];

  return products
    .filter(p => p.b2b_pricing_tiers && p.b2b_pricing_tiers.length > 0)
    .map(transformToBusinessProduct);
}

/**
 * Obtiene productos B2B por categoría slug
 */
export async function fetchB2BProductsByCategory(categorySlug: string): Promise<BusinessProduct[]> {
  // Primero obtener la categoría por slug
  const { data: category, error: categoryError } = await supabase
    .from('b2b_categories')
    .select('id')
    .eq('slug', categorySlug)
    .eq('is_active', true)
    .single();

  if (categoryError || !category) {
    console.error('Error fetching B2B category:', categoryError);
    return [];
  }

  // Luego obtener productos de esa categoría
  const { data, error } = await supabase
    .from('b2b_products')
    .select(`
      *,
      b2b_pricing_tiers (
        id,
        product_id,
        min_quantity,
        max_quantity,
        price_per_unit,
        tier_name,
        discount_percentage
      ),
      category (
        id,
        name,
        slug,
        description,
        icon,
        display_order,
        is_active
      )
    `)
    .eq('category_id', category.id)
    .eq('is_active', true)
    .is('deleted_at', null)
    .order('sku');

  if (error) {
    console.error('Error fetching B2B products by category:', error);
    return [];
  }

  const products = data as unknown as B2BProductWithTiers[];

  return products
    .filter(p => p.b2b_pricing_tiers && p.b2b_pricing_tiers.length > 0)
    .map(transformToBusinessProduct);
}

/**
 * Obtiene un producto B2B por su ID
 */
export async function fetchB2BProductById(id: string): Promise<BusinessProduct | null> {
  const { data, error } = await supabase
    .from('b2b_products')
    .select(`
      *,
      b2b_pricing_tiers (
        id,
        product_id,
        min_quantity,
        max_quantity,
        price_per_unit,
        tier_name,
        discount_percentage
      ),
      category (
        id,
        name,
        slug,
        description,
        icon,
        display_order,
        is_active
      )
    `)
    .eq('id', id)
    .eq('is_active', true)
    .is('deleted_at', null)
    .single();

  if (error || !data) {
    console.error('Error fetching B2B product by ID:', error);
    return null;
  }

  const product = data as unknown as B2BProductWithTiers;

  if (!product.b2b_pricing_tiers || product.b2b_pricing_tiers.length === 0) {
    return null;
  }

  return transformToBusinessProduct(product);
}

/**
 * Obtiene un producto B2B por su slug (SKU)
 */
export async function fetchB2BProductBySlug(slug: string): Promise<BusinessProduct | null> {
  const { data, error } = await supabase
    .from('b2b_products')
    .select(`
      *,
      b2b_pricing_tiers (
        id,
        product_id,
        min_quantity,
        max_quantity,
        price_per_unit,
        tier_name,
        discount_percentage
      ),
      category (
        id,
        name,
        slug,
        description,
        icon,
        display_order,
        is_active
      )
    `)
    .eq('sku', slug)
    .eq('is_active', true)
    .is('deleted_at', null)
    .single();

  if (error || !data) {
    console.error('Error fetching B2B product by slug:', error);
    return null;
  }

  const product = data as unknown as B2BProductWithTiers;

  if (!product.b2b_pricing_tiers || product.b2b_pricing_tiers.length === 0) {
    return null;
  }

  return transformToBusinessProduct(product);
}

/**
 * Obtiene solo los aguacates B2B
 */
export async function fetchB2BAguacates(): Promise<BusinessProduct[]> {
  // Obtener categoría aguacates
  const { data: category } = await supabase
    .from('b2b_categories')
    .select('id')
    .eq('slug', 'aguacates')
    .single();

  if (!category) {
    return [];
  }

  const { data, error } = await supabase
    .from('b2b_products')
    .select(`
      *,
      b2b_pricing_tiers (
        id,
        product_id,
        min_quantity,
        max_quantity,
        price_per_unit,
        tier_name,
        discount_percentage
      ),
      category (
        id,
        name,
        slug,
        description,
        icon,
        display_order,
        is_active
      )
    `)
    .eq('category_id', category.id)
    .eq('is_active', true)
    .is('deleted_at', null)
    .order('sku');

  if (error) {
    console.error('Error fetching B2B aguacates:', error);
    return [];
  }

  const products = data as unknown as B2BProductWithTiers[];

  return products
    .filter(p => p.b2b_pricing_tiers && p.b2b_pricing_tiers.length > 0)
    .map(transformToBusinessProduct);
}

/**
 * Obtiene las categorías B2B disponibles con conteo de productos
 */
export async function fetchB2BCategories(): Promise<{ slug: string; name: string; icon: string; count: number }[]> {
  const { data, error } = await supabase
    .from('b2b_categories')
    .select('id, slug, name, icon')
    .eq('is_active', true)
    .order('display_order');

  if (error) {
    console.error('Error fetching B2B categories:', error);
    return [];
  }

  // Para cada categoría, contar productos activos
  const categoriesWithCount = await Promise.all(
    (data as B2BCategoryRow[]).map(async (cat) => {
      const { count } = await supabase
        .from('b2b_products')
        .select('*', { count: 'exact', head: true })
        .eq('category_id', cat.id)
        .eq('is_active', true)
        .is('deleted_at', null);

      return {
        slug: cat.slug,
        name: cat.name,
        icon: cat.icon || '📦',
        count: count || 0,
      };
    })
  );

  return categoriesWithCount.filter(c => c.count > 0);
}

/**
 * Hook helper: verifica si hay datos en Supabase
 */
export async function hasB2BDataInSupabase(): Promise<boolean> {
  const { count, error } = await supabase
    .from('b2b_products')
    .select('*', { count: 'exact', head: true })
    .eq('is_active', true)
    .is('deleted_at', null);

  if (error) {
    console.error('Error checking B2B data:', error);
    return false;
  }

  return (count ?? 0) > 0;
}
