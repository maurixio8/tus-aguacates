/**
 * Helper functions para gestionar categorías de recetas desde Supabase
 */

import { supabase } from './supabase';

export interface RecipeCategoryDB {
  id: string;
  slug: string;
  name: string;
  description?: string;
  icon: string;
  color: string;
  image_url?: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

/**
 * Obtiene todas las categorías de recetas activas
 */
export async function getRecipeCategories(): Promise<RecipeCategoryDB[]> {
  try {
    const { data, error } = await supabase
      .from('recipe_categories')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('Error fetching recipe categories:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error:', error);
    return [];
  }
}

/**
 * Obtiene todas las categorías de recetas (incluyendo inactivas)
 */
export async function getAllRecipeCategories(): Promise<RecipeCategoryDB[]> {
  try {
    const { data, error } = await supabase
      .from('recipe_categories')
      .select('*')
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('Error fetching all recipe categories:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error:', error);
    return [];
  }
}

/**
 * Obtiene una categoría de receta por slug
 */
export async function getRecipeCategoryBySlug(slug: string): Promise<RecipeCategoryDB | null> {
  try {
    const { data, error } = await supabase
      .from('recipe_categories')
      .select('*')
      .eq('slug', slug)
      .eq('is_active', true)
      .single();

    if (error) {
      console.error('Error fetching recipe category by slug:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error:', error);
    return null;
  }
}

/**
 * Obtiene una categoría de receta por ID
 */
export async function getRecipeCategoryById(id: string): Promise<RecipeCategoryDB | null> {
  try {
    const { data, error } = await supabase
      .from('recipe_categories')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching recipe category by id:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error:', error);
    return null;
  }
}

/**
 * Obtiene la imagen de una categoría de receta con fallback
 */
export function getRecipeCategoryImage(category: RecipeCategoryDB): string | null {
  if (category.image_url) return category.image_url;
  return null;
}
