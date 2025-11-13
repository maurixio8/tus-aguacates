'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import ProductSwiper from '@/components/product/ProductSwiper';
import { ProductCard } from '@/components/product/ProductCard';
import { ChevronLeft } from 'lucide-react';
import type { Product } from '@/lib/supabase';

export default function ProductsPage() {
  const [showAll, setShowAll] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
  }, []);

  async function fetchProducts() {
    const { data } = await supabase
      .from('products')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    setProducts(data || []);
    setLoading(false);
  }

  const first12 = products.slice(0, 12);

  return (
    <div className="min-h-screen bg-gray-50 pt-20 pb-24">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-display font-bold mb-2">
            Todos los Productos
          </h1>
          <p className="text-gray-600">
            {products.length} productos disponibles
          </p>
        </div>

        {/* Slider inicial - SIN botón agregar */}
        {!showAll && (
          <div className="mb-12">
            <h2 className="text-2xl font-display font-bold mb-6 px-4">
              Productos Destacados
            </h2>
            <ProductSwiper
              products={first12}
              title=""
            />

            {/* Botón Ver Más */}
            {products.length > 12 && (
              <div className="text-center mt-8">
                <button
                  onClick={() => setShowAll(true)}
                  className="bg-green-600 hover:bg-green-700 text-white font-bold px-8 py-3 rounded-xl transition-all shadow-lg hover:shadow-xl"
                >
                  Ver Más Productos ({products.length - 12} más)
                </button>
              </div>
            )}
          </div>
        )}

        {/* Vista GRID - CON botón agregar */}
        {showAll && (
          <div>
            {/* Botón para colapsar */}
            <div className="mb-8">
              <button
                onClick={() => setShowAll(false)}
                className="text-green-600 hover:text-green-700 font-semibold underline flex items-center gap-1"
              >
                <ChevronLeft className="w-4 h-4" />
                Volver a destacados
              </button>
            </div>

            {/* GRID 2x2 en móvil, 4 columnas desktop - CON ProductCard COMPLETO */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        )}

        {loading && (
          <div className="text-center py-16">
            <p className="text-gray-500">Cargando productos...</p>
          </div>
        )}

        {!loading && products.length === 0 && (
          <div className="text-center py-16">
            <p className="text-gray-500">No hay productos disponibles</p>
          </div>
        )}
      </div>
    </div>
  );
}