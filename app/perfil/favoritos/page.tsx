'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useWishlistStore } from '@/lib/wishlist-store';
import { ProductCard } from '@/components/product/ProductCard';
import { Heart, ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function FavoritosPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { 
    items, 
    isLoading, 
    error, 
    loadWishlist, 
    getWishlistProducts,
    getWishlistCount 
  } = useWishlistStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user && mounted) {
      loadWishlist(user.id);
    }
  }, [user, mounted, loadWishlist]);

  if (authLoading || !mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-verde-bosque animate-spin mx-auto mb-4" />
          <p className="text-verde-bosque font-medium animate-pulse">
            Cargando...
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const wishlistProducts = getWishlistProducts();
  const wishlistCount = getWishlistCount();

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="container mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <Link 
            href="/cuenta"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-verde-bosque mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver a Mi Cuenta
          </Link>
          
          <div className="flex items-center gap-4">
            <Heart className="w-8 h-8 text-red-500" />
            <div>
              <h1 className="font-display font-bold text-3xl md:text-4xl text-verde-bosque">
                Mis Favoritos
              </h1>
              <p className="text-gray-600 mt-1">
                {wishlistCount === 0 
                  ? 'No tienes productos favoritos aún' 
                  : `${wishlistCount} producto${wishlistCount !== 1 ? 's' : ''} guardado${wishlistCount !== 1 ? 's' : ''}`
                }
              </p>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 text-verde-bosque animate-spin" />
          </div>
        )}

        {/* Empty State */}
        {!isLoading && wishlistCount === 0 && (
          <div className="text-center py-16 bg-white rounded-2xl shadow-lg">
            <Heart className="w-20 h-20 text-gray-300 mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              ¡Tu lista de favoritos está vacía!
            </h2>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              Guarda tus productos favoritos para acceder rápidamente a ellos y recibir notificaciones cuando estén disponibles
            </p>
            <Link
              href="/tienda"
              className="inline-flex items-center gap-2 bg-verde-bosque hover:bg-verde-bosque-600 text-white font-semibold px-8 py-3 rounded-xl transition-all duration-200 hover:scale-105 transform"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
              </svg>
              Explorar Productos
            </Link>
          </div>
        )}

        {/* Products Grid */}
        {!isLoading && wishlistCount > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {wishlistProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}