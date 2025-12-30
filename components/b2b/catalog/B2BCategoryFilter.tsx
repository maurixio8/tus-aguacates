/**
 * Filtro de Categorías B2B
 * "Tus Aguacates" - E-commerce Platform
 */
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Category {
  id: string;
  name: string;
  slug: string;
  sort_order: number;
}

interface B2BCategoryFilterProps {
  selectedCategory?: string;
}

export function B2BCategoryFilter({ selectedCategory }: B2BCategoryFilterProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCategories() {
      try {
        const { data, error } = await supabase
          .from('b2b_categories')
          .select('*')
          .order('sort_order', { ascending: true });

        if (error) {
          console.error('[B2BCategoryFilter] Error loading categories:', error);
          setCategories([]);
        } else {
          console.log('[B2BCategoryFilter] Loaded categories:', data);
          setCategories(data || []);
        }
      } catch (err) {
        console.error('[B2BCategoryFilter] Error:', err);
        setCategories([]);
      } finally {
        setLoading(false);
      }
    }

    loadCategories();
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="font-semibold text-gray-800 mb-4">Categorías</h3>
        <div className="animate-pulse space-y-2">
          <div className="h-10 bg-gray-200 rounded"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="font-semibold text-gray-800 mb-4">Categorías</h3>

      <nav className="space-y-2">
        {/* Todas las categorías */}
        <Link
          href="/empresas/catalogo"
          className={`block py-2 px-3 rounded-lg transition ${
            !selectedCategory
              ? 'bg-green-600 text-white font-semibold'
              : 'text-gray-700 hover:bg-gray-100'
          }`}
        >
          Todas las categorías
        </Link>

        {/* Lista de categorías */}
        {categories.map((category) => (
          <Link
            key={category.id}
            href={`/empresas/catalogo?category=${category.id}`}
            className={`block py-2 px-3 rounded-lg transition ${
              selectedCategory === category.id
                ? 'bg-green-600 text-white font-semibold'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            {category.name}
          </Link>
        ))}
      </nav>
    </div>
  );
}
