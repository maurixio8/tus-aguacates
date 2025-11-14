'use client';

import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { ProductCard } from '@/components/product/ProductCard';
import { SearchTrigger } from '@/components/tienda/SearchTrigger';
import { useState, useEffect } from 'react';

// Estado para manejar refresh de productos
let productsCache: any[] | null = null;
let lastFetchTime = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

export default function TiendaPage() {
  const [featuredProducts, setFeaturedProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProducts() {
      try {
        setLoading(true);

        // Cache duration check
        const now = Date.now();
        const cachedValid = productsCache && (now - lastFetchTime) < CACHE_DURATION;

        if (cachedValid && productsCache && productsCache.length > 0) {
          setFeaturedProducts(productsCache);
          setLoading(false);
          return;
        }

        // Fetch real products
        let products: any[] = [];

        // First try featured products
        const { data: featuredData, error: featuredError } = await supabase
          .from('products')
          .select('*')
          .eq('is_active', true)
          .eq('is_featured', true)
          .order('created_at', { ascending: false })
          .limit(12);

        if (featuredError) {
          console.error('Error fetching featured products:', featuredError);
        }

        // If no featured products, get most recent
        if (!featuredData || featuredData.length === 0) {
          const { data: recentData, error: recentError } = await supabase
            .from('products')
            .select('*')
            .eq('is_active', true)
            .order('created_at', { ascending: false })
            .limit(12);

          if (recentError) {
            console.error('Error fetching recent products:', recentError);
          } else {
            products = recentData || [];
          }
        } else {
          products = featuredData;
        }

        // Update cache
        productsCache = products;
        lastFetchTime = now;
        setFeaturedProducts(products);

      } catch (error) {
        console.error('Error loading products:', error);
        setFeaturedProducts([]);
      } finally {
        setLoading(false);
      }
    }

    loadProducts();
  }, []);

  const categories = [
    { name: 'Frutas', emoji: '🍓', slug: 'frutas', color: 'from-red-500 to-pink-600' },
    { name: 'Verduras', emoji: '🥬', slug: 'verduras', color: 'from-lime-500 to-green-600' },
    { name: 'Aguacates', emoji: '🥑', slug: 'aguacates', color: 'from-green-500 to-green-700' },
    { name: 'Especias', emoji: '🌶️', slug: 'especias', color: 'from-yellow-500 to-orange-600' },
    { name: 'Hierbas Aromáticas', emoji: '🌿', slug: 'hierbas-aromaticas', color: 'from-emerald-500 to-teal-600' },
    { name: 'Combos', emoji: '📦', slug: 'combos', color: 'from-purple-500 to-indigo-600' },
    { name: 'Saludables', emoji: '🥗', slug: 'saludables', color: 'from-emerald-500 to-teal-600' },
  ];

  return (
    <div className="container mx-auto px-4 py-12">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold mb-4 text-gray-800">
          Explora Nuestras Categorías
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Descubre la frescura y calidad de nuestros productos cultivados con amor en Colombia
        </p>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mb-8">
        {categories.map((category) => (
          <Link
            key={category.slug}
            href={`/tienda/${category.slug}`}
            className="group relative aspect-square rounded-2xl overflow-hidden hover:scale-105 transition-transform duration-300 shadow-lg hover:shadow-xl"
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${category.color} opacity-90`} />
            <div className="relative h-full flex flex-col items-center justify-center text-white">
              <span className="text-6xl mb-4 transform group-hover:scale-110 transition-transform duration-300">
                {category.emoji}
              </span>
              <h3 className="text-2xl font-bold text-center px-4">
                {category.name}
              </h3>
            </div>
          </Link>
        ))}
      </div>

      {/* Mobile Search Section - Added between categories and featured products */}
      <div className="mb-12 md:hidden">
        <SearchTrigger />
      </div>

      {/* Featured Products Section */}
      <div className="mb-16">
        <div className="text-center mb-8">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-800">
            Productos Destacados
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Los productos más frescos y populares seleccionados especialmente para ti
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-gray-200 rounded-xl h-48 mb-4"></div>
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}

        {!loading && featuredProducts.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No hay productos destacados disponibles en este momento.</p>
          </div>
        )}
      </div>

      {/* CTA Section */}
      <div className="text-center py-12 bg-gradient-to-r from-green-50 to-emerald-50 rounded-3xl">
        <h2 className="text-3xl font-bold mb-4 text-gray-800">
          ¿Listo para disfrutar de productos frescos?
        </h2>
        <p className="text-lg text-gray-600 mb-6 max-w-2xl mx-auto">
          Explora nuestro catálogo completo y descubre la calidad que nos caracteriza
        </p>
        <Link
          href="/tienda/todos"
          className="inline-block bg-green-600 hover:bg-green-700 text-white font-bold px-8 py-4 rounded-xl transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
        >
          Ver Todos los Productos
        </Link>
      </div>
    </div>
  );
}