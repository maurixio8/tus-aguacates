/**
 * SERVICIO SUPABASE PARA PRODUCTOS B2B
 *
 * Conecta con la tabla product_b2b_config en Supabase
 * para obtener precios actualizados semanalmente.
 */

import { supabase } from './supabase';
import { BusinessProduct, BusinessProductVariant } from './business-products';

// Tipo que coincide con la tabla Supabase
export interface B2BConfigRow {
  id: string;
  product_slug: string;
  b2b_enabled: boolean;
  unit: string;
  min_quantity: number;
  max_quantity: number;
  base_price: number;
  tier1_min: number;
  tier1_max: number;
  tier1_price: number;
  tier2_min: number;
  tier2_max: number;
  tier2_price: number;
  tier3_min: number;
  tier3_max: number;
  tier3_price: number;
  avocado_variety: string | null;
  ripeness_state: string | null;
  b2b_category: string;
  display_order: number;
  notes: string | null;
  updated_at: string;
  // Nuevos campos opcionales
  image_url?: string | null;
  display_name?: string | null;
  description?: string | null;
}

// Mapeo de categorías para nombres bonitos
const CATEGORY_NAMES: Record<string, string> = {
  'aguacates': 'Aguacates',
  'frutas-tropicales': 'Frutas Tropicales',
  'frutos-rojos': 'Frutos Rojos',
  'gourmet': 'Gourmet',
  'aromaticas': 'Aromáticas',
  'saludables': 'Saludables',
  'desgranados': 'Desgranados',
};

// Mapeo de variedades de aguacate para nombres bonitos
const AVOCADO_VARIETY_NAMES: Record<string, string> = {
  'hass': 'Hass',
  'papelillo': 'Papelillo (Lorena)',
  'semil': 'Semil',
  'choquette': 'Choquette',
};

// Mapeo de estados de madurez
const RIPENESS_NAMES: Record<string, { name: string; description: string; days: string }> = {
  'verde': { name: 'Verde', description: 'Madura en 4-7 días', days: '4-7 días' },
  'pinton': { name: 'Pintón', description: 'Listo en 1-3 días', days: '1-3 días' },
  'maduro': { name: 'Maduro', description: 'Consumo inmediato', days: '0-2 días' },
};

/**
 * Transforma un row de Supabase a BusinessProduct
 */
function transformToBusinessProduct(row: B2BConfigRow): BusinessProduct {
  const isAvocado = row.b2b_category === 'aguacates' && row.avocado_variety;
  const ripeness = row.ripeness_state as 'verde' | 'pinton' | 'maduro' | undefined;

  // Usar display_name de Supabase si existe, sino construir nombre
  let productName = row.display_name || '';
  if (!productName) {
    if (isAvocado && row.avocado_variety) {
      const varietyName = AVOCADO_VARIETY_NAMES[row.avocado_variety] || row.avocado_variety;
      const ripenessName = ripeness ? RIPENESS_NAMES[ripeness]?.name || ripeness : '';
      productName = `Aguacate ${varietyName} ${ripenessName}`.trim();
    } else {
      // Para otros productos, extraer nombre del slug
      productName = row.product_slug
        .replace('-b2b', '')
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    }
  }

  // Usar descripción de Supabase si existe, sino construir una
  let description = row.description || '';
  if (!description) {
    if (isAvocado && ripeness) {
      const ripenessInfo = RIPENESS_NAMES[ripeness];
      description = `Aguacate ${AVOCADO_VARIETY_NAMES[row.avocado_variety!] || row.avocado_variety} en estado ${ripenessInfo?.name.toLowerCase() || ripeness}. ${ripenessInfo?.description || ''}`;
    } else {
      description = `${productName} para empresas - pedido mínimo ${row.min_quantity} ${row.unit}`;
    }
  }

  // Crear variantes de precio
  const variants: BusinessProductVariant[] = [
    {
      id: `${row.product_slug}-t1`,
      name: `${row.tier1_min}-${row.tier1_max} ${row.unit}`,
      price: row.tier1_price * row.tier1_min,
      minKg: row.tier1_min,
      maxKg: row.tier1_max,
      pricePerKg: row.tier1_price,
      tier: 'tier1',
    },
    {
      id: `${row.product_slug}-t2`,
      name: `${row.tier2_min}-${row.tier2_max} ${row.unit}`,
      price: row.tier2_price * row.tier2_min,
      minKg: row.tier2_min,
      maxKg: row.tier2_max,
      pricePerKg: row.tier2_price,
      tier: 'tier2',
    },
    {
      id: `${row.product_slug}-t3`,
      name: `${row.tier3_min}-${row.tier3_max} ${row.unit}`,
      price: row.tier3_price * row.tier3_min,
      minKg: row.tier3_min,
      maxKg: row.tier3_max,
      pricePerKg: row.tier3_price,
      tier: 'tier3',
    },
  ];

  return {
    id: row.product_slug,
    name: productName,
    description,
    category: CATEGORY_NAMES[row.b2b_category] || row.b2b_category,
    categorySlug: row.b2b_category,
    unit: row.unit,
    image: row.image_url || undefined,
    variants,
    available_for: 'business',
    is_active: row.b2b_enabled,
    ...(ripeness && {
      ripeness,
      ripenessDescription: RIPENESS_NAMES[ripeness]?.description,
      daysToRipen: RIPENESS_NAMES[ripeness]?.days,
    }),
  };
}

/**
 * Obtiene todos los productos B2B habilitados desde Supabase
 */
export async function fetchB2BProducts(): Promise<BusinessProduct[]> {
  const { data, error } = await supabase
    .from('product_b2b_config')
    .select('*')
    .eq('b2b_enabled', true)
    .order('b2b_category')
    .order('display_order');

  if (error) {
    console.error('Error fetching B2B products from Supabase:', error);
    return [];
  }

  return (data as B2BConfigRow[]).map(transformToBusinessProduct);
}

/**
 * Obtiene productos B2B por categoría
 */
export async function fetchB2BProductsByCategory(categorySlug: string): Promise<BusinessProduct[]> {
  const { data, error } = await supabase
    .from('product_b2b_config')
    .select('*')
    .eq('b2b_enabled', true)
    .eq('b2b_category', categorySlug)
    .order('display_order');

  if (error) {
    console.error('Error fetching B2B products by category:', error);
    return [];
  }

  return (data as B2BConfigRow[]).map(transformToBusinessProduct);
}

/**
 * Obtiene un producto B2B por su slug
 */
export async function fetchB2BProductBySlug(slug: string): Promise<BusinessProduct | null> {
  const { data, error } = await supabase
    .from('product_b2b_config')
    .select('*')
    .eq('product_slug', slug)
    .eq('b2b_enabled', true)
    .single();

  if (error) {
    console.error('Error fetching B2B product by slug:', error);
    return null;
  }

  return transformToBusinessProduct(data as B2BConfigRow);
}

/**
 * Obtiene solo los aguacates B2B
 */
export async function fetchB2BAguacates(): Promise<BusinessProduct[]> {
  const { data, error } = await supabase
    .from('product_b2b_config')
    .select('*')
    .eq('b2b_enabled', true)
    .eq('b2b_category', 'aguacates')
    .not('avocado_variety', 'is', null)
    .order('avocado_variety')
    .order('ripeness_state');

  if (error) {
    console.error('Error fetching B2B aguacates:', error);
    return [];
  }

  return (data as B2BConfigRow[]).map(transformToBusinessProduct);
}

/**
 * Obtiene las categorías B2B disponibles
 */
export async function fetchB2BCategories(): Promise<{ slug: string; name: string; icon: string; count: number }[]> {
  const { data, error } = await supabase
    .from('product_b2b_config')
    .select('b2b_category')
    .eq('b2b_enabled', true);

  if (error) {
    console.error('Error fetching B2B categories:', error);
    return [];
  }

  // Contar productos por categoría
  const categoryCounts: Record<string, number> = {};
  (data as { b2b_category: string }[]).forEach(row => {
    categoryCounts[row.b2b_category] = (categoryCounts[row.b2b_category] || 0) + 1;
  });

  // Mapear iconos
  const CATEGORY_ICONS: Record<string, string> = {
    'aguacates': '🥑',
    'frutas-tropicales': '🍊',
    'frutos-rojos': '🍓',
    'gourmet': '🍅',
    'aromaticas': '🌿',
    'saludables': '🥗',
    'desgranados': '🌽',
  };

  return Object.entries(categoryCounts).map(([slug, count]) => ({
    slug,
    name: CATEGORY_NAMES[slug] || slug,
    icon: CATEGORY_ICONS[slug] || '📦',
    count,
  }));
}

/**
 * Hook helper: verifica si hay datos en Supabase
 */
export async function hasB2BDataInSupabase(): Promise<boolean> {
  const { count, error } = await supabase
    .from('product_b2b_config')
    .select('*', { count: 'exact', head: true })
    .eq('b2b_enabled', true);

  if (error) {
    console.error('Error checking B2B data:', error);
    return false;
  }

  return (count ?? 0) > 0;
}
