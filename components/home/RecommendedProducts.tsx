'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { getRecommendedProducts } from '@/lib/recommendations';
import type { Product } from '@/lib/supabase';
import Link from 'next/link';
import { ProductCard } from '@/components/product/ProductCard';

export function RecommendedProducts() {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadRecommendations() {
      if (!user) return;

      setLoading(true);
      try {
        const recommended = await getRecommendedProducts(user.id, 6);
        setProducts(recommended);
      } catch (error) {
        console.error('Error loading recommendations:', error);
      } finally {
        setLoading(false);
      }
    }

    loadRecommendations();
  }, [user]);

  if (!user || products.length === 0) {
    return null;
  }

  if (loading) {
    return (
      <section className="py-12 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-display font-bold text-verde-bosque-700 mb-8 text-center">
            Recomendados para ti
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 md:gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-gray-200 rounded-xl aspect-square mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-12 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-display font-bold text-verde-bosque-700 mb-2">
            Recomendados para ti
          </h2>
          <p className="text-gray-600">
            Basado en tus compras anteriores
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 md:gap-6">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        <div className="text-center mt-8">
          <Link
            href="/productos"
            className="inline-block bg-white text-verde-bosque-700 hover:bg-gray-50 font-bold px-8 py-3 rounded-xl transition-all shadow-md hover:shadow-lg border-2 border-verde-aguacate"
          >
            Ver Todos los Productos
          </Link>
        </div>
      </div>
    </section>
  );
}
