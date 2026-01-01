/**
 * Utilidades compartidas para fetching de categorías desde Supabase
 *
 * Esta utilidad unifica la fuente de imágenes entre B2C y B2B,
 * usando Supabase como fuente primaria con fallbacks locales.
 */

import { supabase } from './supabase';

// Interfaces para categorías
export interface CategoryWithImage {
  id: string;
  name: string;
  slug: string;
  image: string; // URL de imagen (Supabase o fallback)
  description?: string;
}

export interface SupabaseCategory {
  id: string;
  name: string;
  slug: string;
  image_url: string | null;
  description: string | null;
  sort_order: number;
  is_active: boolean;
}

// Fallback local para imágenes cuando Supabase falla o no tiene image_url
// Nota: Estas imágenes deberían ser reemplazadas con imágenes reales únicas
const CATEGORY_IMAGE_FALLBACKS: Record<string, string> = {
  'aguacates': '/categories/aguacates.jpg',
  'frutas-tropicales': '/categories/tropicales.jpg',
  'frutos-rojos': '/categories/frutos-rojos.jpg',
  'gourmet': '/categories/gourmet.jpg',
  'aromaticas': '/categories/aromaticas.jpg',
  'saludables': '/categories/saludables.jpg',
  'desgranados': '/categories/desgranados.jpg',
  'ofertas-combos': '/categories/gourmet.jpg',
  'especias': '/categories/especias.jpg',
  'productos-nuevos': '/categories/gourmet.jpg',
};

/**
 * Obtiene la URL de imagen para una categoría
 * Prioridad: Supabase image_url > Local fallback > undefined
 */
export function getCategoryImageUrl(
  slug: string,
  supabaseImageUrl: string | null
): string | undefined {
  // Primero intentar usar la imagen de Supabase
  if (supabaseImageUrl) {
    return supabaseImageUrl;
  }

  // Fallback a imagen local basada en slug
  return CATEGORY_IMAGE_FALLBACKS[slug];
}

/**
 * Fetch de categorías desde Supabase con filtros opcionales
 *
 * @param options - Opciones de filtrado
 * @param options.slugs - Array de slugs para filtrar (ej: B2B categories)
 * @returns Promise con categorías e imágenes
 */
export async function fetchCategoriesFromSupabase(options?: {
  slugs?: string[];
}): Promise<CategoryWithImage[]> {
  try {
    let query = supabase
      .from('categories')
      .select('id, name, slug, image_url, description, sort_order, is_active')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    // Aplicar filtro de slugs si se proporciona
    if (options?.slugs && options.slugs.length > 0) {
      query = query.in('slug', options.slugs);
    }

    const { data: supabaseCategories, error } = await query;

    if (error) {
      console.error('Error fetching categories from Supabase:', error);
      return [];
    }

    if (!supabaseCategories || supabaseCategories.length === 0) {
      console.log('⚠️ No active categories found in Supabase');
      return [];
    }

    // Convertir a formato CategoryWithImage con imágenes de Supabase o fallback
    const categories: CategoryWithImage[] = supabaseCategories.map((cat) => ({
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
      image: getCategoryImageUrl(cat.slug, cat.image_url) || '',
      description: cat.description || undefined,
    }));

    return categories;
  } catch (error) {
    console.error('Error in fetchCategoriesFromSupabase:', error);
    return [];
  }
}

/**
 * Fetch de categorías con fallback a datos estáticos
 * Útil cuando quieres garantizar que siempre haya categorías disponibles
 *
 * @param options - Opciones de filtrado
 * @param fallbackCategories - Categorías estáticas de fallback
 * @returns Promise con categorías (de Supabase o fallback)
 */
export async function fetchCategoriesWithFallback<T extends { slug: string; image?: string }>(
  options?: { slugs?: string[] },
  fallbackCategories?: T[]
): Promise<Array<CategoryWithImage & Partial<T>>> {
  // Intentar fetch desde Supabase
  const supabaseCategories = await fetchCategoriesFromSupabase(options);

  // Si obtuvimos resultados, usarlos
  if (supabaseCategories.length > 0) {
    // Combinar con datos adicionales del fallback si se proporcionan
    if (fallbackCategories) {
      return supabaseCategories.map((supabaseCat) => {
        const fallbackCat = fallbackCategories.find(fc => fc.slug === supabaseCat.slug);
        return {
          ...supabaseCat,
          ...(fallbackCat || {}),
        } as CategoryWithImage & Partial<T>;
      });
    }
    return supabaseCategories as Array<CategoryWithImage & Partial<T>>;
  }

  // Fallback a categorías estáticas si se proporcionan
  if (fallbackCategories) {
    console.log('⚠️ Using fallback categories');
    return fallbackCategories.map(cat => ({
      id: `fallback-${cat.slug}`,
      name: cat.slug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
      image: getCategoryImageUrl(cat.slug, null) || cat.image || '',
      ...cat,
    } as CategoryWithImage & Partial<T>));
  }

  return [];
}

/**
 * Obtiene una imagen de categoría por slug individual
 * Útil para páginas de categoría individual
 */
export async function getCategoryImageBySlug(slug: string): Promise<string | undefined> {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('image_url')
      .eq('slug', slug)
      .eq('is_active', true)
      .single();

    if (error || !data) {
      console.log(`⚠️ Category '${slug}' not found in Supabase, using fallback`);
      return getCategoryImageUrl(slug, null);
    }

    return getCategoryImageUrl(slug, data.image_url);
  } catch (error) {
    console.error(`Error fetching category image for '${slug}':`, error);
    return getCategoryImageUrl(slug, null);
  }
}
