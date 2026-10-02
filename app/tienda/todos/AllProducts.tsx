'use client';

import { useEffect, useState } from 'react';
import { ProductCard } from '@/components/product/ProductCard';
import { supabase } from '@/lib/supabase';
import type { UnifiedProduct } from '@/lib/types';

export default function AllProducts() {
  const [products, setProducts] = useState<UnifiedProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProducts() {
      const { data, error } = await supabase
        .from('products')
        .select('*, variants:product_variants(*)')
        .eq('is_active', true)
        .order('name', { ascending: true });
      if (!error) setProducts(data || []);
      setLoading(false);
    }
    loadProducts();
  }, []);

  if (loading) {
    return <p className="py-16 text-center text-gray-500">Cargando productos disponibles...</p>;
  }

  if (!products.length) {
    return <p className="py-16 text-center text-gray-500">No hay productos disponibles en este momento.</p>;
  }

  return (
    <>
      <p className="mb-5 text-sm text-gray-600">
        Mostrando <strong className="text-green-700">{products.length}</strong> productos activos
      </p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-3 md:gap-6 lg:grid-cols-4">
        {products.map((product) => <ProductCard key={product.id} product={product} />)}
      </div>
    </>
  );
}
