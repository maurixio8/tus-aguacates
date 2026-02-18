'use client';

import { useEffect, useState, Suspense } from 'react';
import { supabase, Product } from '@/lib/supabase';
import { ProductCard } from '@/components/product/ProductCard';
import { Tag, Flame, Sparkles, Clock } from 'lucide-react';
import CategoryScroll from '@/components/categories/CategoryScroll';

interface ProductWithCategory extends Product {
  categories: { name: string; slug: string } | null;
}

function ProductSkeleton() {
  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-soft animate-pulse">
      <div className="aspect-square bg-gray-200" />
      <div className="p-4">
        <div className="h-5 bg-gray-200 rounded mb-3 mx-auto w-3/4" />
        <div className="h-4 bg-gray-200 rounded mb-4 w-1/2 mx-auto" />
        <div className="flex justify-between items-end mb-3">
          <div className="h-7 bg-gray-200 rounded w-24" />
          <div className="h-3 bg-gray-200 rounded w-16" />
        </div>
        <div className="h-11 bg-gray-200 rounded-lg" />
      </div>
    </div>
  );
}

function ProductsGridSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
      {[...Array(8)].map((_, i) => (
        <ProductSkeleton key={i} />
      ))}
    </div>
  );
}

function OfertasContent() {
  const [products, setProducts] = useState<ProductWithCategory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDeals() {
      try {
        setLoading(true);

        const { data, error } = await supabase
          .from('products')
          .select(`
            *,
            categories (name, slug)
          `)
          .eq('is_active', true)
          .not('discount_price', 'is', null)
          .lt('discount_price', 'price')
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Hero Section Premium */}
      <div className="relative overflow-hidden bg-gradient-to-r from-verde-bosque via-verde-bosque-700 to-verde-aguacate px-4 py-12 md:py-16">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-4 left-4 w-24 h-24 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-4 right-4 w-32 h-32 bg-yellow-300 rounded-full blur-3xl" />
        </div>
        
        <div className="container mx-auto relative z-10">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Flame className="w-6 h-6 text-yellow-400" />
            <span className="text-yellow-400 font-semibold text-sm uppercase tracking-wider">Ofertas Limitadas</span>
          </div>
          
          <h1 className="font-display font-bold text-4xl md:text-5xl lg:text-6xl text-white text-center mb-4">
            Ofertas <span className="text-yellow-400">Especiales</span>
          </h1>
          
          <p className="text-white/80 text-center text-lg md:text-xl max-w-2xl mx-auto mb-6">
            Descuentos exclusivos en productos seleccionados. ¡No te las pierdas!
          </p>
          
          <div className="flex items-center justify-center gap-6 text-white/70 text-sm">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              <span>Calidad Premium</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>Envío Rápido</span>
            </div>
          </div>
        </div>
      </div>

      {/* Categories Scroll */}
      <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm shadow-sm">
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
      </div>

      {/* Products Section */}
      <div className="container mx-auto px-4 py-8 md:py-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-naranja-frutal/10 p-2 rounded-xl">
              <Tag className="w-5 h-5 text-naranja-frutal" />
            </div>
            <div>
              <h2 className="font-bold text-xl md:text-2xl text-gray-900">
                {loading ? 'Cargando ofertas...' : `${products.length} producto${products.length !== 1 ? 's' : ''} en oferta`}
              </h2>
              {!loading && products.length > 0 && (
                <p className="text-sm text-gray-500">¡Hasta {Math.max(...products.map(p => Math.round(((p.price - (p.discount_price || p.price)) / p.price) * 100)))}% de descuento!</p>
              )}
            </div>
          </div>
        </div>

        {/* Products Grid or Skeleton */}
        {loading ? (
          <ProductsGridSkeleton />
        ) : products.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
            {products.map((product) => (
              <div key={product.id} className="relative group">
                <div className="absolute -top-2 -right-2 z-20 bg-gradient-to-r from-red-500 to-red-600 text-white px-3 py-1.5 rounded-full text-sm font-bold shadow-lg transform group-hover:scale-110 transition-transform">
                  -{Math.round(((product.price - (product.discount_price || product.price)) / product.price) * 100)}%
                </div>
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 px-4">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Tag className="w-10 h-10 text-gray-300" />
            </div>
            <h3 className="font-bold text-xl md:text-2xl text-gray-900 mb-3">No hay ofertas activas</h3>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              No hay productos con descuento en este momento. Vuelve pronto para nuevas ofertas.
            </p>
            <button
              onClick={() => window.location.href = '/tienda'}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-yellow-400 to-yellow-600 hover:from-yellow-500 hover:to-yellow-700 text-verde-bosque-700 font-bold px-8 py-4 rounded-xl transition-all transform hover:scale-105 shadow-lg hover:shadow-xl border-2 border-verde-aguacate"
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
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
        <div className="bg-gradient-to-r from-verde-bosque via-verde-bosque-700 to-verde-aguacate px-4 py-12">
          <div className="container mx-auto">
            <div className="h-12 bg-white/20 rounded w-64 mx-auto animate-pulse" />
          </div>
        </div>
        <div className="container mx-auto px-4 py-8">
          <ProductsGridSkeleton />
        </div>
      </div>
    }>
      <OfertasContent />
    </Suspense>
  );
}