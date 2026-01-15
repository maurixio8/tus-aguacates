'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { ProductCard } from '@/components/product/ProductCard';
import { supabase } from '@/lib/supabase';
import type { UnifiedProduct } from '@/lib/types';

export function CategoryProducts({ categoria }: { categoria: string }) {
  const [products, setProducts] = useState<UnifiedProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
  }, [categoria]);

  async function fetchProducts() {
    try {
      setLoading(true);
      console.log(`🔍 Buscando productos activos para categoría: ${categoria}`);

      // ✅ Consultar directamente a Supabase con filtro is_active=true
      // Primero obtenemos el category_id desde el slug
      const { data: categoryData, error: categoryError } = await supabase
        .from('categories')
        .select('id')
        .eq('slug', categoria)
        .single();

      if (categoryError || !categoryData) {
        console.warn(`⚠️ No se encontró categoría con slug: ${categoria}`);
        setProducts([]);
        return;
      }

      // Ahora obtenemos los productos activos de esa categoría
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('*')
        .eq('category_id', categoryData.id)
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (productsError) {
        console.error('❌ Error obteniendo productos:', productsError);
        setProducts([]);
        return;
      }

      console.log(`✅ Encontrados ${productsData?.length || 0} productos activos para ${categoria}`);
      setProducts(productsData || []);

    } catch (error) {
      console.error('❌ Error in fetchProducts:', error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="text-center py-16">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
        <p className="text-gray-500">Cargando productos...</p>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500">No hay productos disponibles en esta categoría</p>
      </div>
    );
  }

  return (
    <>
      {/* Grid de todos los productos - SIN carousel */}
      <div>
        <div className="mb-4">
          <p className="text-gray-600 text-sm md:text-base">
            Mostrando <span className="font-bold text-green-600">{products.length}</span> producto{products.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Grid con todos los productos */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        {/* Botón Volver al final */}
        <div className="mt-12 flex justify-center">
          <Link
            href="/tienda"
            className="inline-flex items-center gap-2 bg-verde-aguacate-500 hover:bg-verde-aguacate-600 text-white font-semibold px-6 py-3 rounded-lg transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
          >
            <ChevronLeft className="w-5 h-5" />
            Volver a Categorías
          </Link>
        </div>
      </div>
    </>
  );
}
