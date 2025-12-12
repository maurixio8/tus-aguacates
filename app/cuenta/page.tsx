'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { useWishlistStore } from '@/lib/wishlist-store';
import { supabase, Profile, Order } from '@/lib/supabase';
import { User, Mail, Phone, LogOut, ShoppingBag, MapPin, Loader2, Heart } from 'lucide-react';
import { ProductCard } from '@/components/product/ProductCard';

export default function CuentaPage() {
  const router = useRouter();
  const { user, loading: authLoading, signOut } = useAuth();
  const { loadWishlist, getWishlistCount } = useWishlistStore();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [featuredProducts, setFeaturedProducts] = useState<any[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [wishlistCount, setWishlistCount] = useState(0);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      loadUserData();
      loadWishlist(user.id);
    }
  }, [user, loadWishlist]);

  // Actualizar contador de favoritos
  useEffect(() => {
    setWishlistCount(getWishlistCount());
  }, [getWishlistCount]);

  // Load featured products for empty state
  useEffect(() => {
    async function loadFeaturedProducts() {
      try {
        setProductsLoading(true);

        // First try featured products
        const { data: featuredData, error: featuredError } = await supabase
          .from('products')
          .select('*')
          .eq('is_active', true)
          .eq('is_featured', true)
          .order('created_at', { ascending: false })
          .limit(4); // Only 4 products for the empty state

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
            .limit(4);

          if (recentError) {
            console.error('Error fetching recent products:', recentError);
          } else {
            setFeaturedProducts(recentData || []);
          }
        } else {
          setFeaturedProducts(featuredData);
        }

      } catch (error) {
        console.error('Error loading featured products:', error);
        setFeaturedProducts([]);
      } finally {
        setProductsLoading(false);
      }
    }

    loadFeaturedProducts();
  }, []);

  async function loadUserData() {
    try {
      // Cargar perfil
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user!.id)
        .single();
      
      if (profileData) {
        setProfile(profileData);
      }

      // Cargar pedidos
      const { data: ordersData } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (ordersData) {
        setOrders(ordersData);
      }
    } catch (error) {
      console.error('Error cargando datos:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSignOut() {
    try {
      await signOut();
      router.push('/');
    } catch (error) {
      console.error('Error cerrando sesión:', error);
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-verde-bosque animate-spin mx-auto mb-4" />
          <p className="text-verde-bosque font-medium animate-pulse">
            Cargando tu información...
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="container mx-auto">
        {/* Header with fade-in animation */}
        <div className="mb-12 animate-fade-in">
          <h1 className="font-display font-bold text-4xl md:text-5xl mb-4 text-verde-bosque">
            Mi Cuenta
          </h1>
          <p className="text-gray-600 text-lg">
            Gestiona tu información personal y pedidos
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Sidebar - Info del Usuario */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg p-8 sticky top-6 transition-all duration-300 hover:shadow-xl animate-slide-in">
              {/* Avatar */}
              <div className="flex flex-col items-center mb-8">
                <div className="w-32 h-32 bg-gradient-to-br from-verde-bosque to-green-600 rounded-full flex items-center justify-center mb-4 shadow-lg">
                  <User className="w-16 h-16 text-white" />
                </div>
                <h2 className="font-display font-bold text-2xl text-center text-verde-bosque">
                  {profile?.full_name || 'Usuario'}
                </h2>
                <span className="text-sm text-gray-500 mt-2 bg-verde-bosque-100 px-3 py-1 rounded-full font-medium">
                  Cliente Premium
                </span>
              </div>

              {/* Información de Contacto */}
              <div className="space-y-5 mb-8 border-t border-gray-100 pt-8">
                <div className="flex items-center gap-4 text-base">
                  <Mail className="w-6 h-6 text-verde-bosque" />
                  <span className="text-gray-800 font-medium">{user.email}</span>
                </div>
                {profile?.phone && (
                  <div className="flex items-center gap-4 text-base">
                    <Phone className="w-6 h-6 text-verde-bosque" />
                    <span className="text-gray-800 font-medium">{profile.phone}</span>
                  </div>
                )}
              </div>

              {/* Botón Cerrar Sesión */}
              <button
                onClick={handleSignOut}
                className="w-full bg-red-50 hover:bg-red-100 text-red-600 font-semibold py-4 rounded-xl transition-all duration-200 flex items-center justify-center gap-3 hover:scale-105 transform"
              >
                <LogOut className="w-6 h-6" />
                <span className="font-bold">Cerrar Sesión</span>
              </button>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8 animate-scale-in">
            {/* Mis Favoritos */}
            <div className="bg-white rounded-2xl shadow-lg p-8 transition-all duration-300 hover:shadow-xl">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <Heart className="w-8 h-8 text-red-500" />
                  <div>
                    <h3 className="font-display font-bold text-2xl text-verde-bosque">
                      Mis Favoritos
                    </h3>
                    <p className="text-sm text-gray-600">
                      {wishlistCount === 0
                        ? 'No tienes productos favoritos'
                        : `${wishlistCount} producto${wishlistCount !== 1 ? 's' : ''} guardado${wishlistCount !== 1 ? 's' : ''}`
                      }
                    </p>
                  </div>
                </div>
                <Link
                  href="/perfil/favoritos"
                  className="inline-flex items-center gap-2 bg-verde-bosque hover:bg-verde-bosque-600 text-white font-semibold px-6 py-3 rounded-xl transition-all duration-200 hover:scale-105 transform"
                >
                  <Heart className="w-5 h-5" />
                  Ver Favoritos
                </Link>
              </div>
              
              {wishlistCount === 0 ? (
                <div className="text-center py-8">
                  <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600 mb-4 max-w-md mx-auto">
                    Guarda tus productos favoritos para acceder rápidamente a ellos
                  </p>
                  <Link
                    href="/tienda"
                    className="inline-flex items-center gap-2 text-verde-bosque hover:text-verde-bosque-600 font-medium"
                  >
                    Explorar productos
                  </Link>
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-gray-600">
                    Tienes {wishlistCount} producto{wishlistCount !== 1 ? 's' : ''} en tu lista de favoritos
                  </p>
                </div>
              )}
            </div>

            {/* Historial de Pedidos */}
            <div className="bg-white rounded-2xl shadow-lg p-8 transition-all duration-300 hover:shadow-xl">
              <div className="flex items-center gap-4 mb-8">
                <ShoppingBag className="w-8 h-8 text-verde-bosque" />
                <h3 className="font-display font-bold text-2xl text-verde-bosque">
                  Historial de Pedidos
                </h3>
              </div>

              {orders.length > 0 ? (
                <div className="space-y-6">
                  {orders.map((order) => (
                    <div
                      key={order.id}
                      className="border border-gray-100 rounded-2xl p-6 hover:shadow-md transition-all duration-300 hover:border-verde-bosque-200"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <p className="font-bold text-xl text-verde-bosque mb-1">
                            Pedido #{order.order_number}
                          </p>
                          <p className="text-sm text-gray-500">
                            {new Date(order.created_at).toLocaleDateString('es-CO', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </p>
                        </div>
                        <span className={`px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 ${
                          order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                          order.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                          order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {order.status === 'delivered' ? (
                            <>
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                              Entregado
                            </>
                          ) : order.status === 'confirmed' ? (
                            <>
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                              Confirmado
                            </>
                          ) : order.status === 'cancelled' ? (
                            <>
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                              </svg>
                              Cancelado
                            </>
                          ) : (
                            <>
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                              Pendiente
                            </>
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between items-center border-t border-gray-100 pt-4">
                        <p className="text-base text-gray-700 font-medium">
                          Total: <span className="font-bold text-verde-bosque text-lg">
                            ${order.total.toLocaleString('es-CO')}
                          </span>
                        </p>
                        <button className="text-verde-bosque hover:bg-verde-bosque-50 px-4 py-2 rounded-lg transition-colors font-medium">
                          Ver detalles
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="mb-8">
                    <svg className="w-24 h-24 text-verde-bosque mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                    <h3 className="text-2xl font-bold text-verde-bosque mb-2">¡Tu historial está vacío!</h3>
                    <p className="text-gray-600 mb-8 max-w-md mx-auto">
                      Cuando realices tu primer pedido, aparecerá aquí para que puedas hacer seguimiento
                    </p>
                  </div>

                  {/* Productos Destacados */}
                  <div className="bg-gray-50 rounded-2xl p-8">
                    <div className="text-center mb-8">
                      <h3 className="text-2xl font-bold text-verde-bosque mb-2">Productos que podrían interesarte</h3>
                      <p className="text-gray-600 max-w-2xl mx-auto">
                        Descubre nuestros productos más populares y frescos
                      </p>
                    </div>

                    {productsLoading ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[...Array(4)].map((_, i) => (
                          <div key={i} className="animate-pulse">
                            <div className="bg-gray-200 rounded-xl h-48 mb-4"></div>
                            <div className="h-4 bg-gray-200 rounded mb-2"></div>
                            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                          </div>
                        ))}
                      </div>
                    ) : featuredProducts.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {featuredProducts.slice(0, 4).map((product) => (
                          <ProductCard key={product.id} product={product} />
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-gray-500">No hay productos destacados disponibles en este momento</p>
                      </div>
                    )}

                    <div className="mt-10">
                      <a
                        href="/tienda"
                        className="inline-flex items-center gap-2 bg-gradient-to-r from-verde-bosque to-emerald-600 hover:from-verde-bosque-600 hover:to-emerald-700 text-white font-semibold px-8 py-4 rounded-xl transition-all duration-200 hover:scale-105 transform shadow-lg hover:shadow-xl"
                      >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                        </svg>
                        Explorar Todos los Productos
                      </a>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Direcciones */}
            <div className="bg-white rounded-2xl shadow-lg p-8 transition-all duration-300 hover:shadow-xl">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  <MapPin className="w-8 h-8 text-verde-bosque" />
                  <h3 className="font-display font-bold text-2xl text-verde-bosque">
                    Direcciones de Envío
                  </h3>
                </div>
                <button className="inline-flex items-center gap-2 bg-verde-bosque hover:bg-verde-bosque-600 text-white font-semibold px-6 py-3 rounded-xl transition-all duration-200 hover:scale-105 transform">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                  </svg>
                  Agregar Dirección
                </button>
              </div>

              <div className="text-center py-16">
                <MapPin className="w-20 h-20 text-gray-300 mx-auto mb-6" />
                <p className="text-gray-600 mb-6 text-lg">
                  No tienes direcciones guardadas
                </p>
                <p className="text-gray-500 text-sm max-w-md mx-auto">
                  Agrega direcciones para facilitar tus compras y recibir tus pedidos más rápido
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
