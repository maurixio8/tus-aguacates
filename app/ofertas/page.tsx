'use client';

import { useEffect, useState, Suspense } from 'react';
import { supabase, Product } from '@/lib/supabase';
import { ProductCard } from '@/components/product/ProductCard';
import { Tag } from 'lucide-react';
import CategoryScroll from '@/components/categories/CategoryScroll';

interface ProductWithCategory extends Product {
  categories: { name: string; slug: string } | null;
}

function OfertasContent() {
  const [products, setProducts] = useState<ProductWithCategory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDeals() {
      try {
        setLoading(true);

        // Get products with discounts (has discount_price lower than price)
        const { data, error } = await supabase
          .from('products')
          .select(`
            *,
            categories (name, slug)
          `)
          .eq('is_active', true)
          .not('discount_price', 'is', null)
          .lt('discount_price', 'price')  // discount_price must be less than price
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching deals:', error);
          setProducts([]);
        } else {
          setProducts(data || []);
        }
      } catch (error) {
        console.error('Error fetching deals:', error);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    }

    fetchDeals();
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-verde-bosque"></div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Categories Scroll */}
      <CategoryScroll
        showProductCount={false}
        onCategoryChange={(slug) => {
          if (slug === 'todos') {
            window.location.href = '/productos';
          } else {
            window.location.href = `/productos?categoria=${slug}`;
          }
        }}
      />

      {/* Header */}
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="font-display font-bold text-3xl md:text-4xl mb-2 flex items-center gap-3">
            <Tag className="w-8 h-8 text-naranja-frutal" />
            Ofertas Especiales
          </h1>
          <p className="text-gray-600">
            {products.length} producto{products.length !== 1 ? 's' : ''} en oferta{products.length !== 1 ? 's' : ''}
          </p>
          <p className="text-sm text-gray-500 mt-2">
            ¡Aprovecha estos descuentos por tiempo limitado!
          </p>
        </div>

        {/* Products Grid */}
        {products.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => (
              <div key={product.id} className="relative">
                {/* Discount Badge */}
                <div className="absolute -top-2 -right-2 z-10 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                  -{Math.round(((product.price - (product.discount_price || product.price)) / product.price) * 100)}%
                </div>
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <Tag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="font-semibold text-xl mb-2">No hay ofertas activas</h3>
            <p className="text-gray-600 mb-6">
              No hay productos con descuento en este momento
            </p>
            <button
              onClick={() => window.location.href = '/productos'}
              className="inline-block bg-gradient-to-r from-yellow-400 to-yellow-600 hover:from-yellow-500 hover:to-yellow-700 text-verde-bosque-700 font-bold px-8 py-3 rounded-lg transition-all transform hover:scale-105 shadow-lg hover:shadow-xl border-2 border-verde-aguacate"
            >
              Ver todos los productos
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function OfertasPage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-verde-bosque"></div>
        </div>
      </div>
    }>
      <OfertasContent />
    </Suspense>
  );
}