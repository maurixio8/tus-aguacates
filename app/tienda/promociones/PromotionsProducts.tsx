'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, Sparkles } from 'lucide-react';
import { ProductCard } from '@/components/product/ProductCard';
import { supabase } from '@/lib/supabase';
import type { UnifiedProduct } from '@/lib/types';

export default function PromotionsProducts() {
  const [products, setProducts] = useState<UnifiedProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadFeaturedProducts() {
      setLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select('*, variants:product_variants(*)')
        .eq('is_active', true)
        .eq('is_featured', true)
        .order('rating', { ascending: false })
        .order('review_count', { ascending: false })
        .order('name', { ascending: true });

      if (!cancelled) {
        if (error) {
          console.error('Error cargando promociones:', error);
          setProducts([]);
        } else {
          setProducts((data || []) as UnifiedProduct[]);
        }
        setLoading(false);
      }
    }

    loadFeaturedProducts();
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6">
        {[1, 2, 3, 4].map((item) => (
          <div key={item} className="animate-pulse rounded-2xl bg-gray-200 h-72" />
        ))}
      </div>
    );
  }

  if (!products.length) {
    return (
      <div className="rounded-2xl border border-dashed border-verde-aguacate/40 bg-verde-bosque/5 px-6 py-16 text-center">
        <Sparkles className="mx-auto mb-4 h-10 w-10 text-verde-aguacate" />
        <h2 className="text-xl font-bold text-verde-bosque">Estamos preparando nuevas promociones</h2>
        <p className="mt-2 text-gray-600">Vuelve pronto para descubrir los productos destacados.</p>
      </div>
    );
  }

  return (
    <>
      <p className="mb-4 text-sm text-gray-600">
        Mostrando <span className="font-bold text-verde-aguacate">{products.length}</span> productos destacados
      </p>
      <div className="grid grid-cols-2 sm:landscape:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6">
        {products.map((product) => <ProductCard key={product.id} product={product} />)}
      </div>
      <div className="mt-12 flex justify-center">
        <Link href="/tienda" className="inline-flex items-center gap-2 rounded-lg bg-verde-aguacate-500 px-6 py-3 font-semibold text-white shadow-md transition hover:bg-verde-aguacate-600">
          <ChevronLeft className="h-5 w-5" />
          Volver a categorías
        </Link>
      </div>
    </>
  );
}
