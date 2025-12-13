'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { getRecommendedProducts } from '@/lib/recommendations';
import type { Product } from '@/lib/supabase';
import Link from 'next/link';
import Image from 'next/image';
import { ShoppingCart, Star } from 'lucide-react';
import { useCartStore } from '@/lib/cart-store';

export function RecommendedProducts() {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const { addItem } = useCartStore();

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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-gray-200 rounded-xl h-64 mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const handleAddToCart = (product: Product) => {
    addItem(product);
  };

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

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => (
            <div
              key={product.id}
              className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all overflow-hidden group"
            >
              <Link href={`/productos/${product.slug}`}>
                <div className="relative h-48 bg-gray-100 overflow-hidden">
                  {product.main_image_url ? (
                    <Image
                      src={product.main_image_url}
                      alt={product.name}
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-6xl">
                      🥑
                    </div>
                  )}
                  {product.discount_price && product.discount_price < product.price && (
                    <div className="absolute top-2 right-2 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                      -{Math.round(((product.price - product.discount_price) / product.price) * 100)}%
                    </div>
                  )}
                </div>
              </Link>

              <div className="p-4">
                <Link href={`/productos/${product.slug}`}>
                  <h3 className="font-semibold text-lg text-verde-bosque-700 mb-2 hover:text-verde-aguacate transition-colors">
                    {product.name}
                  </h3>
                </Link>

                {product.rating > 0 && (
                  <div className="flex items-center gap-1 mb-2">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span className="text-sm text-gray-600">
                      {product.rating.toFixed(1)} ({product.review_count})
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between mb-3">
                  <div>
                    {product.discount_price && product.discount_price < product.price ? (
                      <>
                        <span className="text-2xl font-bold text-verde-aguacate">
                          {formatPrice(product.discount_price)}
                        </span>
                        <span className="text-sm text-gray-400 line-through ml-2">
                          {formatPrice(product.price)}
                        </span>
                      </>
                    ) : (
                      <span className="text-2xl font-bold text-verde-aguacate">
                        {formatPrice(product.price)}
                      </span>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => handleAddToCart(product)}
                  className="w-full bg-gradient-to-r from-yellow-400 to-yellow-600 text-verde-bosque-700 hover:from-yellow-500 hover:to-yellow-700 font-bold py-2 px-4 rounded-lg transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
                >
                  <ShoppingCart className="w-5 h-5" />
                  Agregar al Carrito
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-8">
          <Link
            href="/tienda"
            prefetch={false}
            className="inline-block bg-white text-verde-bosque-700 hover:bg-gray-50 font-bold px-8 py-3 rounded-xl transition-all shadow-md hover:shadow-lg border-2 border-verde-aguacate"
          >
            Ver Todos los Productos
          </Link>
        </div>
      </div>
    </section>
  );
}
