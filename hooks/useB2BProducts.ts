/**
 * HOOK PARA PRODUCTOS B2B
 *
 * Obtiene productos B2B desde Supabase con fallback a datos locales.
 * Incluye caché en memoria para evitar múltiples requests.
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  fetchB2BProducts,
  fetchB2BProductsByCategory,
  fetchB2BAguacates,
  fetchB2BCategories,
  hasB2BDataInSupabase,
} from '@/lib/b2b-supabase-service';
import {
  BusinessProduct,
  BUSINESS_PRODUCTS,
  BUSINESS_CATEGORIES,
  getBusinessProductsByCategory,
  getAguacatesB2B,
} from '@/lib/business-products';

// Caché en memoria
let cachedProducts: BusinessProduct[] | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

interface UseB2BProductsResult {
  products: BusinessProduct[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  source: 'supabase' | 'local';
}

/**
 * Hook para obtener todos los productos B2B
 */
export function useB2BProducts(): UseB2BProductsResult {
  const [products, setProducts] = useState<BusinessProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] = useState<'supabase' | 'local'>('local');

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);

    // Verificar caché
    if (cachedProducts && Date.now() - cacheTimestamp < CACHE_DURATION) {
      setProducts(cachedProducts);
      setSource('supabase');
      setLoading(false);
      return;
    }

    try {
      // Intentar obtener de Supabase
      const hasData = await hasB2BDataInSupabase();

      if (hasData) {
        const supabaseProducts = await fetchB2BProducts();
        if (supabaseProducts.length > 0) {
          cachedProducts = supabaseProducts;
          cacheTimestamp = Date.now();
          setProducts(supabaseProducts);
          setSource('supabase');
          setLoading(false);
          return;
        }
      }

      // Fallback a datos locales
      setProducts(BUSINESS_PRODUCTS);
      setSource('local');
    } catch (err) {
      console.error('Error fetching B2B products:', err);
      setError('Error al cargar productos');
      // Fallback a datos locales en caso de error
      setProducts(BUSINESS_PRODUCTS);
      setSource('local');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return { products, loading, error, refetch: fetchProducts, source };
}

/**
 * Hook para obtener productos B2B por categoría
 */
export function useB2BProductsByCategory(categorySlug: string): UseB2BProductsResult {
  const [products, setProducts] = useState<BusinessProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] = useState<'supabase' | 'local'>('local');

  const fetchProducts = useCallback(async () => {
    if (!categorySlug) {
      setProducts([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Intentar obtener de Supabase
      const hasData = await hasB2BDataInSupabase();

      if (hasData) {
        const supabaseProducts = await fetchB2BProductsByCategory(categorySlug);
        if (supabaseProducts.length > 0) {
          setProducts(supabaseProducts);
          setSource('supabase');
          setLoading(false);
          return;
        }
      }

      // Fallback a datos locales
      setProducts(getBusinessProductsByCategory(categorySlug));
      setSource('local');
    } catch (err) {
      console.error('Error fetching B2B products by category:', err);
      setError('Error al cargar productos');
      setProducts(getBusinessProductsByCategory(categorySlug));
      setSource('local');
    } finally {
      setLoading(false);
    }
  }, [categorySlug]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return { products, loading, error, refetch: fetchProducts, source };
}

/**
 * Hook para obtener aguacates B2B
 */
export function useB2BAguacates(): UseB2BProductsResult {
  const [products, setProducts] = useState<BusinessProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] = useState<'supabase' | 'local'>('local');

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const hasData = await hasB2BDataInSupabase();

      if (hasData) {
        const supabaseProducts = await fetchB2BAguacates();
        if (supabaseProducts.length > 0) {
          setProducts(supabaseProducts);
          setSource('supabase');
          setLoading(false);
          return;
        }
      }

      // Fallback a datos locales
      setProducts(getAguacatesB2B());
      setSource('local');
    } catch (err) {
      console.error('Error fetching B2B aguacates:', err);
      setError('Error al cargar aguacates');
      setProducts(getAguacatesB2B());
      setSource('local');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return { products, loading, error, refetch: fetchProducts, source };
}

interface UseB2BCategoriesResult {
  categories: { slug: string; name: string; icon: string; count?: number }[];
  loading: boolean;
  error: string | null;
  source: 'supabase' | 'local';
}

/**
 * Hook para obtener categorías B2B
 */
export function useB2BCategories(): UseB2BCategoriesResult {
  const [categories, setCategories] = useState<{ slug: string; name: string; icon: string; count?: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] = useState<'supabase' | 'local'>('local');

  useEffect(() => {
    async function loadCategories() {
      setLoading(true);
      setError(null);

      try {
        const hasData = await hasB2BDataInSupabase();

        if (hasData) {
          const supabaseCategories = await fetchB2BCategories();
          if (supabaseCategories.length > 0) {
            setCategories(supabaseCategories);
            setSource('supabase');
            setLoading(false);
            return;
          }
        }

        // Fallback a datos locales
        setCategories(BUSINESS_CATEGORIES);
        setSource('local');
      } catch (err) {
        console.error('Error fetching B2B categories:', err);
        setError('Error al cargar categorías');
        setCategories(BUSINESS_CATEGORIES);
        setSource('local');
      } finally {
        setLoading(false);
      }
    }

    loadCategories();
  }, []);

  return { categories, loading, error, source };
}

/**
 * Función para invalidar el caché (útil después de actualizar precios)
 */
export function invalidateB2BCache(): void {
  cachedProducts = null;
  cacheTimestamp = 0;
}
