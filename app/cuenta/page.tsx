'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { supabase, Profile, Order } from '@/lib/supabase';
import { UnifiedProduct, getProductImageUrl, normalizeProductForCart } from '@/lib/types';
import { useWishlistStore } from '@/lib/wishlist-store';
import { convertLegacyIdsToUuids } from '@/lib/legacyIdMapper';
import { useCartStore } from '@/lib/cart-store';
import { ProductCard } from '@/components/product/ProductCard';
import { OrderSummaryCard } from '@/components/account/OrderSummaryCard';
import { ReorderConfirmDialog } from '@/components/account/ReorderConfirmDialog';
import { ChefVirtualPromo } from '@/components/account/ChefVirtualPromo';
import { MyRecipesTab } from '@/components/account/MyRecipesTab';
import { EditProfileModal } from '@/components/account/EditProfileModal';
import {
  User,
  Mail,
  Phone,
  LogOut,
  ShoppingBag,
  MapPin,
  Loader2,
  Heart,
  Ticket,
  Edit,
  Check,
  X,
  RefreshCw,
  ChevronRight,
  ChevronDown,
  Package,
  Calendar,
  Copy,
  Gift,
  ShoppingCart,
  ChefHat
} from 'lucide-react';

interface OrderItem {
  id: string;
  product_id: string;
  product_snapshot: {
    name: string;
    price: number;
    main_image_url?: string;
    image?: string;
    unit?: string;
  };
  quantity: number;
  unit_price: number;
  subtotal: number;
  product?: {
    id: string;
    name: string;
    main_image_url?: string;
    image?: string;
    price: number;
    discount_price?: number;
    unit?: string;
    slug?: string;
    is_active?: boolean;
    stock?: number;
  };
}

interface OrderWithItems extends Order {
  items?: OrderItem[];
}

interface Coupon {
  id: string;
  code: string;
  description: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  min_purchase: number;
  valid_until: string | null;
  is_welcome_coupon: boolean;
  free_shipping: boolean;
}

// Función para generar iniciales y gradiente del avatar
function getAvatarInitials(name: string) {
  const initials = name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const gradients = [
    'from-verde-aguacate to-verde-bosque',
    'from-naranja-frutal to-rojo-natural',
    'from-blue-500 to-indigo-600',
    'from-purple-500 to-pink-600',
    'from-teal-500 to-emerald-600',
  ];

  const colorIndex = (name.charCodeAt(0) || 0) % gradients.length;
  return { initials, gradient: gradients[colorIndex] };
}

export default function CuentaPage() {
  const router = useRouter();
  const { user, loading: authLoading, signOut } = useAuth();
  const wishlistStore = useWishlistStore();
  const wishlist = wishlistStore.items;
  const { addItem } = useCartStore();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [favoriteProducts, setFavoriteProducts] = useState<UnifiedProduct[]>([]);
  const [availableCoupons, setAvailableCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'pedidos' | 'favoritos' | 'cupones' | 'mis-recetas'>('favoritos');
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [copiedCoupon, setCopiedCoupon] = useState<string | null>(null);

  // Reorder dialog state
  const [selectedOrder, setSelectedOrder] = useState<OrderWithItems | null>(null);
  const [isReorderDialogOpen, setIsReorderDialogOpen] = useState(false);
  const [isRepeatingOrder, setIsRepeatingOrder] = useState(false);

  // Edit profile modal state
  const [isEditProfileModalOpen, setIsEditProfileModalOpen] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      loadUserData();
    }
  }, [user]);

  useEffect(() => {
    if (wishlist.length > 0) {
      loadFavoriteProducts();
    } else {
      setFavoriteProducts([]);
    }
  }, [wishlist.length]);

  async function loadUserData() {
    try {
      // Load profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user!.id)
        .single();

      if (profileData) {
        setProfile(profileData);
      }

      // Load orders with their items
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            id,
            product_id,
            quantity,
            unit_price,
            subtotal,
            product_snapshot,
            created_at
          )
        `)
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (ordersError) {
        console.error('Error fetching orders:', ordersError);
      }

      if (ordersData) {

        // Función para extraer items de order_data si no hay order_items
        const extractOrderItems = (order: any) => {
          // Primero intentar con order_items
          if (order.order_items && order.order_items.length > 0) {
            return order.order_items;
          }

          // Luego extraer desde order_data
          if (order.order_data?.items) {
            return order.order_data.items.map((item: any, index: number) => ({
              id: `item-${index}`,
              product_id: item.productId,
              product_snapshot: {
                name: item.productName,
                price: item.price,
                main_image_url: null,
                unit: null
              },
              quantity: item.quantity,
              unit_price: item.price,
              subtotal: item.quantity * item.price
            }));
          }

          return [];
        };

        // Map order_items to items property con fallback a order_data
        const ordersWithItems: OrderWithItems[] = ordersData.map(order => ({
          ...order,
          items: extractOrderItems(order)
        }));
        setOrders(ordersWithItems);
      }

      // Load available coupons
      await loadAvailableCoupons();
    } catch (error) {
      console.error('Error cargando datos:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadFavoriteProducts() {
    try {
      // Convertir IDs legacy (product-N) a UUIDs reales
      const legacyIds = wishlist.map(item => item.product_id);
      console.log('🔍 [DEBUG] Legacy IDs from wishlist:', legacyIds);

      const { uuids, unmapped } = convertLegacyIdsToUuids(legacyIds);
      console.log('🔍 [DEBUG] Converted UUIDs:', uuids);
      console.log('⚠️ [DEBUG] Unmapped IDs:', unmapped);

      const { data: products } = await supabase
        .from('products')
        .select('*')
        .in('id', uuids)
        .eq('is_active', true);

      console.log('📊 [DEBUG] Products from Supabase:', products?.length || 0);

      if (products) {
        console.log('✅ [DEBUG] Raw products from DB:', products.map(p => ({
          id: p.id,
          name: p.name,
          image: p.image,
          main_image_url: p.main_image_url
        })));

        // Convertir a UnifiedProduct para asegurar compatibilidad
        const unifiedProducts: UnifiedProduct[] = products.map(product => ({
          ...product,
          // Asegurar que ambos campos de imagen estén presentes
          main_image_url: product.main_image_url || product.image,
          image: product.image || product.main_image_url,
        }));

        console.log('🎯 [DEBUG] Final unified products:', unifiedProducts.map(p => ({
          id: p.id,
          name: p.name,
          image: p.image,
          main_image_url: p.main_image_url,
          imageUrl: getProductImageUrl(p)
        })));

        setFavoriteProducts(unifiedProducts);
      }
    } catch (error) {
      console.error('Error cargando favoritos:', error);
    }
  }

  async function loadAvailableCoupons() {
    try {
      const { data: coupons } = await supabase
        .from('coupons')
        .select('*')
        .eq('is_active', true)
        .or(`valid_until.is.null,valid_until.gt.${new Date().toISOString()}`)
        .order('created_at', { ascending: false });

      if (coupons) {
        setAvailableCoupons(coupons);
      }
    } catch (error) {
      console.error('Error cargando cupones:', error);
    }
  }

  async function handleSaveProfile(data: { full_name: string; preferred_name: string; phone: string }) {
    if (!user) return;

    setSavingProfile(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: data.full_name,
          preferred_name: data.preferred_name,
          phone: data.phone,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (!error) {
        setProfile((prev) => prev ? { ...prev, ...data } : null);
      }
    } catch (error) {
      console.error('Error guardando perfil:', error);
      throw error;
    } finally {
      setSavingProfile(false);
    }
  }

  function handleRepeatOrderClick(order: OrderWithItems) {
    if (!order.items || order.items.length === 0) return;

    // Abrir diálogo de confirmación
    setSelectedOrder(order);
    setIsReorderDialogOpen(true);
  }

  async function confirmReorderOrder() {
    if (!selectedOrder || !selectedOrder.items) return;

    setIsRepeatingOrder(true);

    try {
      // Limpiar carrito primero
      const { clearCart } = useCartStore.getState();
      clearCart();

      // Agregar items del pedido al carrito
      selectedOrder.items.forEach((item) => {
        // Priorizar datos del producto del JOIN sobre el snapshot
        const productData = (item as any).product || item.product_snapshot;

        if (productData) {
          const productForCart = {
            id: item.product_id,
            name: productData.name,
            price: productData.price,
            main_image_url: productData.main_image_url || productData.image,
            image: productData.image || productData.main_image_url,
            unit: productData.unit || 'unidad',
            slug: productData.slug || item.product_id,
            stock: productData.stock || 100,
            is_active: productData.is_active ?? true,
            is_featured: false,
            rating: 0,
            review_count: 0,
            min_quantity: 1,
            reserved_stock: 0,
            category_id: '',
            description: productData.description || '',
            created_at: productData.created_at || new Date().toISOString(),
            updated_at: productData.updated_at || new Date().toISOString(),
          };
          addItem(productForCart, item.quantity);
        }
      });

      // Cerrar diálogo y redirigir al carrito
      setIsReorderDialogOpen(false);
      setSelectedOrder(null);
      router.push('/cart');
    } catch (error) {
      console.error('Error al repetir pedido:', error);
    } finally {
      setIsRepeatingOrder(false);
    }
  }

  function handleAddToFavorites(product: UnifiedProduct) {
    const normalizedProduct = normalizeProductForCart(product);
    addItem(normalizedProduct, 1);
  }

  function copyCouponCode(code: string) {
    navigator.clipboard.writeText(code);
    setCopiedCoupon(code);
    setTimeout(() => setCopiedCoupon(null), 2000);
  }

  async function handleSignOut() {
    try {
      await signOut();
      router.push('/');
    } catch (error) {
      console.error('Error cerrando sesión:', error);
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered':
      case 'entregado':
        return 'bg-green-100 text-green-700';
      case 'confirmed':
      case 'confirmado':
        return 'bg-blue-100 text-blue-700';
      case 'cancelled':
      case 'cancelado':
        return 'bg-red-100 text-red-700';
      case 'processing':
      case 'en_preparacion':
        return 'bg-purple-100 text-purple-700';
      case 'shipped':
      case 'en_camino':
        return 'bg-orange-100 text-orange-700';
      default:
        return 'bg-yellow-100 text-yellow-700';
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: 'Pendiente',
      pendiente: 'Pendiente',
      confirmed: 'Confirmado',
      confirmado: 'Confirmado',
      processing: 'En Preparación',
      en_preparacion: 'En Preparación',
      shipped: 'En Camino',
      en_camino: 'En Camino',
      delivered: 'Entregado',
      entregado: 'Entregado',
      cancelled: 'Cancelado',
      cancelado: 'Cancelado',
    };
    return labels[status] || status;
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-verde-bosque animate-spin" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-green-50/30 to-emerald-50/20 py-6 md:py-8 md:py-12">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-6 md:mb-8 flex items-center justify-between gap-4">
          <div>
            <h1 className="font-display font-bold text-2xl md:text-3xl lg:text-4xl mb-1 md:mb-2">Mi Cuenta</h1>
            <p className="text-sm md:text-base text-gray-600">Gestiona tu información personal y pedidos</p>
          </div>
          {/* Botón dorado de cuenta - visible en móvil */}
          <button
            onClick={() => setIsEditProfileModalOpen(true)}
            className="lg:hidden flex items-center gap-2 bg-gradient-to-r from-dorado to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-white px-3 py-2 rounded-full text-xs font-bold shadow-md border-2 border-yellow-300 transition-all"
          >
            <User className="w-3.5 h-3.5" />
            Mi Cuenta
          </button>
        </div>

        <div className="grid lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Sidebar - Info del Usuario */}
          <div className="lg:col-span-1 order-2 lg:order-1">
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border-2 border-verde-aguacate/20 p-4 sticky top-6">
              {/* Layout minimalista: Nombre + Correo + Botón editar */}
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h2 className="font-display font-bold text-base truncate text-gray-900">
                      {profile?.preferred_name || profile?.full_name || 'Usuario'}
                    </h2>
                    <p className="text-xs text-gray-500 truncate">{user.email}</p>
                  </div>
                  <button
                    onClick={() => setIsEditProfileModalOpen(true)}
                    className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                    aria-label="Editar perfil"
                  >
                    <Edit className="w-3.5 h-3.5 text-gray-400" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2 order-1 lg:order-2 space-y-6">
            {/* Chef Virtual Promo */}
            <ChefVirtualPromo />

            {/* Tabs - Desktop version */}
            <div className="hidden sm:block bg-white/90 backdrop-blur-sm rounded-2xl border-2 border-verde-aguacate/20 p-1 flex">
              <button
                onClick={() => setActiveTab('pedidos')}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-medium transition-all ${activeTab === 'pedidos'
                    ? 'bg-gradient-to-r from-verde-aguacate to-verde-bosque text-white shadow-md'
                    : 'text-gray-600 hover:bg-verde-aguacate/10'
                  }`}
              >
                <ShoppingBag className="w-5 h-5" />
                Pedidos
              </button>
              <button
                onClick={() => setActiveTab('favoritos')}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-medium transition-all ${activeTab === 'favoritos'
                    ? 'bg-gradient-to-r from-verde-aguacate to-verde-bosque text-white shadow-md'
                    : 'text-gray-600 hover:bg-verde-aguacate/10'
                  }`}
              >
                <Heart className="w-5 h-5" />
                Favoritos
                {wishlist.length > 0 && (
                  <span className="px-2 py-0.5 text-xs rounded-full bg-white/20">
                    {wishlist.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('mis-recetas')}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-medium transition-all ${activeTab === 'mis-recetas'
                    ? 'bg-gradient-to-r from-verde-aguacate to-verde-bosque text-white shadow-md'
                    : 'text-gray-600 hover:bg-verde-aguacate/10'
                  }`}
              >
                <ChefHat className="w-5 h-5" />
                Mis Recetas
              </button>
              <button
                onClick={() => setActiveTab('cupones')}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-medium transition-all ${activeTab === 'cupones'
                    ? 'bg-gradient-to-r from-verde-aguacate to-verde-bosque text-white shadow-md'
                    : 'text-gray-600 hover:bg-verde-aguacate/10'
                  }`}
              >
                <Ticket className="w-5 h-5" />
                Cupones
                {availableCoupons.length > 0 && (
                  <span className="px-2 py-0.5 text-xs rounded-full bg-white/20">
                    {availableCoupons.length}
                  </span>
                )}
              </button>
            </div>

            {/* Tabs - Mobile version (select dropdown) */}
            <div className="sm:hidden bg-white/90 backdrop-blur-sm rounded-2xl border-2 border-verde-aguacate/20 p-4">
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Selecciona una sección:
              </label>
              <div className="relative">
                <select
                  value={activeTab}
                  onChange={(e) => setActiveTab(e.target.value as any)}
                  className="w-full px-4 py-3 bg-white border-2 border-verde-aguacate/30 rounded-xl appearance-none font-medium text-gray-700 focus:border-verde-aguacate focus:ring-2 focus:ring-verde-aguacate/20 outline-none cursor-pointer"
                >
                  <option value="pedidos">🛒 Pedidos ({orders.length})</option>
                  <option value="favoritos">❤️ Favoritos ({wishlist.length})</option>
                  <option value="mis-recetas">👨‍🍳 Mis Recetas</option>
                  <option value="cupones">🎟️ Cupones ({availableCoupons.length})</option>
                </select>
                {/* Custom arrow icon */}
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-verde-aguacate pointer-events-none" />
              </div>

              {/* Quick preview cards */}
              <div className="mt-4 grid grid-cols-3 gap-2">
                <button
                  onClick={() => setActiveTab('pedidos')}
                  className={`p-2 rounded-lg text-center transition-all ${activeTab === 'pedidos' ? 'bg-verde-aguacate text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                >
                  <ShoppingBag className="w-5 h-5 mx-auto mb-1" />
                  <span className="text-xs">{orders.length}</span>
                </button>
                <button
                  onClick={() => setActiveTab('favoritos')}
                  className={`p-2 rounded-lg text-center transition-all ${activeTab === 'favoritos' ? 'bg-verde-aguacate text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                >
                  <Heart className="w-5 h-5 mx-auto mb-1" />
                  <span className="text-xs">{wishlist.length}</span>
                </button>
                <button
                  onClick={() => setActiveTab('mis-recetas')}
                  className={`p-2 rounded-lg text-center transition-all ${activeTab === 'mis-recetas' ? 'bg-verde-aguacate text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                >
                  <ChefHat className="w-5 h-5 mx-auto mb-1" />
                </button>
              </div>
            </div>

            {/* Tab Content: Pedidos */}
            {activeTab === 'pedidos' && (
              <div className="bg-white/90 backdrop-blur-sm rounded-2xl border-2 border-verde-aguacate/20 p-4 md:p-6 animate-in fade-in">
                <div className="flex items-center gap-2 md:gap-3 mb-4 md:mb-6">
                  <ShoppingBag className="w-5 h-5 md:w-6 md:h-6 text-verde-bosque" />
                  <h3 className="font-display font-bold text-lg md:text-xl">Historial de Pedidos</h3>
                </div>

                {orders.length > 0 ? (
                  <div className="space-y-4">
                    {orders.map((order) => (
                      <OrderSummaryCard
                        key={order.id}
                        order={order}
                        onRepeatOrder={handleRepeatOrderClick}
                        isRepeating={isRepeatingOrder && selectedOrder?.id === order.id}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-600 mb-4">Aún no has realizado ningún pedido</p>
                    <Link
                      href="/productos"
                      className="inline-block bg-verde-bosque hover:bg-verde-bosque/90 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
                    >
                      Explorar Productos
                    </Link>
                  </div>
                )}
              </div>
            )}

            {/* Tab Content: Favoritos */}
            {activeTab === 'favoritos' && (
              <div className="bg-white/90 backdrop-blur-sm rounded-2xl border-2 border-verde-aguacate/20 p-6 animate-in fade-in">
                <div className="flex items-center gap-3 mb-6">
                  <Heart className="w-6 h-6 text-red-500" />
                  <h3 className="font-display font-bold text-xl">Mis Favoritos</h3>
                </div>

                {favoriteProducts.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {favoriteProducts.map((product) => (
                      <ProductCard
                        key={product.id}
                        product={product}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-600 mb-4">No tienes productos favoritos</p>
                    <Link
                      href="/productos"
                      className="inline-block bg-verde-bosque hover:bg-verde-bosque/90 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
                    >
                      Explorar Productos
                    </Link>
                  </div>
                )}
              </div>
            )}

            {/* Tab Content: Cupones */}
            {activeTab === 'cupones' && (
              <div className="bg-white/90 backdrop-blur-sm rounded-2xl border-2 border-verde-aguacate/20 p-4 md:p-6 animate-in fade-in">
                <div className="flex items-center gap-2 md:gap-3 mb-4 md:mb-6">
                  <Ticket className="w-5 h-5 md:w-6 md:h-6 text-purple-500" />
                  <h3 className="font-display font-bold text-lg md:text-xl">Cupones Disponibles</h3>
                </div>

                {availableCoupons.length > 0 ? (
                  <div className="space-y-3 md:space-y-4">
                    {availableCoupons.map((coupon) => (
                      <div
                        key={coupon.id}
                        className="border-2 border-dashed border-purple-200 rounded-lg p-3 md:p-4 bg-purple-50/50"
                      >
                        {/* Layout: stack on mobile, row on desktop */}
                        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            {/* Código y badge */}
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                              <span className="font-mono font-bold text-base md:text-lg text-purple-700">
                                {coupon.code}
                              </span>
                              {coupon.is_welcome_coupon && (
                                <span className="px-2 py-0.5 text-[10px] md:text-xs bg-purple-200 text-purple-700 rounded-full flex items-center gap-1">
                                  <Gift className="w-3 h-3" />
                                  Bienvenida
                                </span>
                              )}
                            </div>
                            {/* Descripción */}
                            <p className="text-gray-600 text-xs md:text-sm mb-2 line-clamp-2">{coupon.description}</p>
                            {/* Tags */}
                            <div className="flex flex-wrap gap-1.5 md:gap-2 text-[10px] md:text-xs">
                              <span className="px-2 py-0.5 md:py-1 bg-white rounded-full text-gray-600">
                                {coupon.discount_type === 'percentage'
                                  ? `${coupon.discount_value}%`
                                  : formatCurrency(coupon.discount_value)}
                              </span>
                              {coupon.min_purchase > 0 && (
                                <span className="px-2 py-0.5 md:py-1 bg-white rounded-full text-gray-600">
                                  Mín: {formatCurrency(coupon.min_purchase)}
                                </span>
                              )}
                              {coupon.free_shipping && (
                                <span className="px-2 py-0.5 md:py-1 bg-green-100 rounded-full text-green-700">
                                  Envío gratis
                                </span>
                              )}
                              {coupon.valid_until && (
                                <span className="hidden md:inline-block px-2 py-1 bg-white rounded-full text-gray-600">
                                  Hasta: {formatDate(coupon.valid_until)}
                                </span>
                              )}
                            </div>
                          </div>
                          {/* Botón copiar - full width en móvil */}
                          <button
                            onClick={() => copyCouponCode(coupon.code)}
                            className={`w-full md:w-auto flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-colors flex-shrink-0 ${copiedCoupon === coupon.code
                                ? 'bg-green-500 text-white'
                                : 'bg-purple-600 text-white hover:bg-purple-700'
                              }`}
                          >
                            {copiedCoupon === coupon.code ? (
                              <>
                                <Check className="w-4 h-4" />
                                Copiado
                              </>
                            ) : (
                              <>
                                <Copy className="w-4 h-4" />
                                Copiar código
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Ticket className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-600 mb-2">No hay cupones disponibles</p>
                    <p className="text-sm text-gray-500">
                      ¡Estate atento a nuestras promociones!
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Tab Content: Mis Recetas */}
            {activeTab === 'mis-recetas' && (
              <div className="bg-white/90 backdrop-blur-sm rounded-2xl border-2 border-verde-aguacate/20 p-6 animate-in fade-in">
                <MyRecipesTab />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Diálogo de confirmación para repetir pedido */}
      {selectedOrder && (
        <ReorderConfirmDialog
          isOpen={isReorderDialogOpen}
          onClose={() => {
            setIsReorderDialogOpen(false);
            setSelectedOrder(null);
          }}
          onConfirm={confirmReorderOrder}
          order={selectedOrder}
          isProcessing={isRepeatingOrder}
        />
      )}

      {/* Modal para editar perfil */}
      <EditProfileModal
        isOpen={isEditProfileModalOpen}
        onClose={() => setIsEditProfileModalOpen(false)}
        profile={profile ? {
          full_name: profile.full_name || '',
          preferred_name: profile.preferred_name || '',
          phone: profile.phone || ''
        } : null}
        email={user.email || ''}
        onSave={handleSaveProfile}
      />
    </div>
  );
}
