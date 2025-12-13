'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { supabase, Profile, Order, Product as SupabaseProduct } from '@/lib/supabase';
import { useWishlistStore } from '@/lib/wishlist-store';
import { useCartStore } from '@/lib/cart-store';
import { ProductImagePlaceholder } from '@/components/ui/ProductImagePlaceholder';
import type { Product, ProductVariant } from '@/lib/productStorage';
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
  Package,
  Calendar,
  Copy,
  Gift,
  ShoppingCart
} from 'lucide-react';

interface OrderItem {
  id: string;
  product_id: string;
  product_snapshot: {
    name: string;
    price: number;
    main_image_url?: string;
    unit?: string;
  };
  quantity: number;
  unit_price: number;
  subtotal: number;
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

export default function CuentaPage() {
  const router = useRouter();
  const { user, loading: authLoading, signOut } = useAuth();
  const { items: wishlistItems, isLoading: wishlistLoading, loadWishlist, getWishlistProducts, getWishlistCount, removeFromWishlist } = useWishlistStore();
  const { addItem } = useCartStore();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [availableCoupons, setAvailableCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'pedidos' | 'favoritos' | 'cupones'>('favoritos');
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [copiedCoupon, setCopiedCoupon] = useState<string | null>(null);

  // Edit profile state
  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState({ full_name: '', preferred_name: '', phone: '' });
  const [savingProfile, setSavingProfile] = useState(false);

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
        setEditedProfile({
          full_name: profileData.full_name || '',
          preferred_name: profileData.preferred_name || '',
          phone: profileData.phone || '',
        });
      }

      // Load orders with items
      const { data: ordersData } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (ordersData) {
        // Load items for each order
        const ordersWithItems = await Promise.all(
          ordersData.map(async (order) => {
            const { data: items } = await supabase
              .from('order_items')
              .select('*')
              .eq('order_id', order.id);
            return { ...order, items: items || [] };
          })
        );
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

  async function handleSaveProfile() {
    if (!user) return;

    setSavingProfile(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: editedProfile.full_name,
          preferred_name: editedProfile.preferred_name,
          phone: editedProfile.phone,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (!error) {
        setProfile((prev) => prev ? { ...prev, ...editedProfile } : null);
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Error guardando perfil:', error);
    } finally {
      setSavingProfile(false);
    }
  }

  function handleRepeatOrder(order: OrderWithItems) {
    if (!order.items || order.items.length === 0) return;

    order.items.forEach((item) => {
      if (item.product_snapshot) {
        const productForCart = {
          id: item.product_id,
          name: item.product_snapshot.name,
          price: item.product_snapshot.price,
          main_image_url: item.product_snapshot.main_image_url,
          unit: item.product_snapshot.unit || 'unidad',
          slug: item.product_id,
          stock: 100,
          is_active: true,
          is_featured: false,
          rating: 0,
          review_count: 0,
          min_quantity: 1,
          reserved_stock: 0,
          category_id: '',
          description: '',
          created_at: '',
          updated_at: '',
        };
        addItem(productForCart, item.quantity);
      }
    });

    router.push('/cart');
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

  // Interfaz local para variante con precio calculado
  interface ProductVariantWithPrice extends ProductVariant {
    price: number;
  }

  // Componente para tarjeta de producto en favoritos
  function FavoriteProductCard({ product, onRemove, onAddToCart }: {
    product: Product;
    onRemove: () => void;
    onAddToCart: (product: Product, variant: ProductVariant | null) => void;
  }) {
    const [selectedVariant, setSelectedVariant] = useState<ProductVariantWithPrice | null>(null);
    const [showToast, setShowToast] = useState(false);

    // Cargar variantes del producto
    useEffect(() => {
      if (product.variants && product.variants.length > 0) {
        const variantsWithPrice = product.variants.map(v => ({
          ...v,
          price: (product.discount_price || product.price) + v.price_adjustment
        }));
        setSelectedVariant(variantsWithPrice[0]);
      }
    }, [product]);

    const handleAddToCart = () => {
      onAddToCart(product, selectedVariant);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 2000);
    };

    const displayPrice = selectedVariant
      ? selectedVariant.price
      : (product.discount_price || product.price);

    const hasVariants = product.variants && product.variants.length > 0;

    return (
      <div className="group bg-white rounded-lg overflow-hidden border border-gray-200 hover:shadow-lg transition-all">
        {/* Toast de éxito */}
        {showToast && (
          <div className="fixed bottom-4 right-4 bg-verde-bosque text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center gap-2">
            <Check className="w-5 h-5" />
            Agregado al carrito
          </div>
        )}

        <Link href={`/productos/${product.id}`} className="block">
          <div className="aspect-square relative overflow-hidden">
            <ProductImagePlaceholder
              productName={product.name}
              price={displayPrice}
              category={product.category_id || 'productos'}
              imageUrl={product.main_image_url}
              showPrice={false}
              className="w-full h-full"
            />
          </div>
          <div className="p-3">
            <h4 className="font-semibold text-gray-900 text-sm line-clamp-2 mb-2">
              {product.name}
            </h4>
            <p className="text-verde-bosque font-bold text-lg">
              {formatCurrency(displayPrice)}
            </p>
          </div>
        </Link>

        {/* Selector de variantes si existen */}
        {hasVariants && (
          <div className="px-3 pb-2">
            <select
              value={selectedVariant?.id || ''}
              onChange={(e) => {
                const variant = product.variants?.find(v => v.id === e.target.value);
                if (variant) {
                  setSelectedVariant({
                    ...variant,
                    price: (product.discount_price || product.price) + variant.price_adjustment
                  });
                }
              }}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-verde-bosque focus:border-transparent"
              onClick={(e) => e.stopPropagation()}
            >
              {product.variants?.map((variant) => (
                <option key={variant.id} value={variant.id}>
                  {variant.variant_name || variant.variant_value}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Botones de acción */}
        <div className="px-3 pb-3 space-y-2">
          <button
            onClick={(e) => {
              e.preventDefault();
              handleAddToCart();
            }}
            className="w-full flex items-center justify-center gap-2 bg-verde-bosque hover:bg-verde-bosque/90 text-white py-2.5 rounded-lg transition-colors text-sm font-medium"
          >
            <ShoppingCart className="w-4 h-4" />
            Agregar al carrito
          </button>
          <button
            onClick={(e) => {
              e.preventDefault();
              onRemove();
            }}
            className="w-full flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 py-2 rounded-lg transition-colors text-sm font-medium"
          >
            <X className="w-4 h-4" />
            Eliminar
          </button>
        </div>
      </div>
    );
  }

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
    <div className="min-h-screen bg-gray-50 py-8 md:py-12">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-display font-bold text-3xl md:text-4xl mb-2">Mi Cuenta</h1>
          <p className="text-gray-600">Gestiona tu información personal y pedidos</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Sidebar - Info del Usuario */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm p-6 sticky top-6">
              {/* Avatar */}
              <div className="flex flex-col items-center mb-6">
                <div className="w-20 h-20 bg-verde-bosque rounded-full flex items-center justify-center mb-3">
                  <User className="w-10 h-10 text-white" />
                </div>
                {isEditing ? (
                  <div className="w-full space-y-2">
                    <input
                      type="text"
                      value={editedProfile.preferred_name}
                      onChange={(e) => setEditedProfile({ ...editedProfile, preferred_name: e.target.value })}
                      className="w-full text-center font-display font-bold text-xl border-b border-gray-300 focus:border-verde-bosque outline-none pb-1"
                      placeholder="Nombre preferido (cómo te gustas que te llamemos)"
                    />
                    <input
                      type="text"
                      value={editedProfile.full_name}
                      onChange={(e) => setEditedProfile({ ...editedProfile, full_name: e.target.value })}
                      className="w-full text-center text-sm border-b border-gray-300 focus:border-verde-bosque outline-none pb-1"
                      placeholder="Nombre completo"
                    />
                  </div>
                ) : (
                  <div className="text-center">
                    <h2 className="font-display font-bold text-xl">
                      {profile?.preferred_name || profile?.full_name || 'Usuario'}
                    </h2>
                    {profile?.preferred_name && profile?.full_name && (
                      <p className="text-sm text-gray-500 mt-1">{profile.full_name}</p>
                    )}
                  </div>
                )}
                <span className="text-sm text-gray-500 mt-1">Cliente</span>
              </div>

              {/* Información de Contacto */}
              <div className="space-y-3 mb-6 border-t border-gray-100 pt-6">
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  <span className="text-gray-700 truncate">{user.email}</span>
                </div>
                {isEditing ? (
                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5 text-gray-400 flex-shrink-0" />
                    <input
                      type="tel"
                      value={editedProfile.phone}
                      onChange={(e) => setEditedProfile({ ...editedProfile, phone: e.target.value })}
                      className="flex-1 text-sm border-b border-gray-300 focus:border-verde-bosque outline-none pb-1"
                      placeholder="Tu teléfono"
                    />
                  </div>
                ) : (
                  profile?.phone && (
                    <div className="flex items-center gap-3 text-sm">
                      <Phone className="w-5 h-5 text-gray-400 flex-shrink-0" />
                      <span className="text-gray-700">{profile.phone}</span>
                    </div>
                  )
                )}
              </div>

              {/* Edit/Save buttons */}
              {isEditing ? (
                <div className="flex gap-2 mb-4">
                  <button
                    onClick={handleSaveProfile}
                    disabled={savingProfile}
                    className="flex-1 flex items-center justify-center gap-2 bg-verde-bosque text-white py-2 rounded-lg hover:bg-verde-bosque/90 transition-colors disabled:opacity-50"
                  >
                    {savingProfile ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Check className="w-4 h-4" />
                    )}
                    Guardar
                  </button>
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setEditedProfile({
                        full_name: profile?.full_name || '',
                        preferred_name: profile?.preferred_name || '',
                        phone: profile?.phone || '',
                      });
                    }}
                    className="flex-1 flex items-center justify-center gap-2 bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    <X className="w-4 h-4" />
                    Cancelar
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setIsEditing(true)}
                  className="w-full flex items-center justify-center gap-2 bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200 transition-colors mb-4"
                >
                  <Edit className="w-4 h-4" />
                  Editar Perfil
                </button>
              )}

              {/* Logout button */}
              <button
                onClick={handleSignOut}
                className="w-full bg-red-50 hover:bg-red-100 text-red-600 font-semibold py-3 rounded-lg transition-all flex items-center justify-center gap-2"
              >
                <LogOut className="w-5 h-5" />
                Cerrar Sesión
              </button>

              {/* Quick Stats */}
              <div className="grid grid-cols-3 gap-3 mt-6 pt-6 border-t border-gray-100">
                <div className="text-center">
                  <p className="text-2xl font-bold text-verde-bosque">{orders.length}</p>
                  <p className="text-xs text-gray-500">Pedidos</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-red-500">{getWishlistCount()}</p>
                  <p className="text-xs text-gray-500">Favoritos</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-purple-500">{availableCoupons.length}</p>
                  <p className="text-xs text-gray-500">Cupones</p>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Tabs */}
            <div className="bg-white rounded-xl shadow-sm p-1 flex">
              <button
                onClick={() => setActiveTab('pedidos')}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-medium transition-colors ${
                  activeTab === 'pedidos'
                    ? 'bg-verde-bosque text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <ShoppingBag className="w-5 h-5" />
                <span className="hidden sm:inline">Pedidos</span>
              </button>
              <button
                onClick={() => setActiveTab('favoritos')}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-medium transition-colors ${
                  activeTab === 'favoritos'
                    ? 'bg-verde-bosque text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Heart className="w-5 h-5" />
                <span className="hidden sm:inline">Favoritos</span>
                {getWishlistCount() > 0 && (
                  <span className={`px-2 py-0.5 text-xs rounded-full ${
                    activeTab === 'favoritos' ? 'bg-white/20' : 'bg-red-100 text-red-600'
                  }`}>
                    {getWishlistCount()}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('cupones')}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-medium transition-colors ${
                  activeTab === 'cupones'
                    ? 'bg-verde-bosque text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Ticket className="w-5 h-5" />
                <span className="hidden sm:inline">Cupones</span>
                {availableCoupons.length > 0 && (
                  <span className={`px-2 py-0.5 text-xs rounded-full ${
                    activeTab === 'cupones' ? 'bg-white/20' : 'bg-purple-100 text-purple-600'
                  }`}>
                    {availableCoupons.length}
                  </span>
                )}
              </button>
            </div>

            {/* Tab Content: Pedidos */}
            {activeTab === 'pedidos' && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center gap-3 mb-6">
                  <ShoppingBag className="w-6 h-6 text-verde-bosque" />
                  <h3 className="font-display font-bold text-xl">Historial de Pedidos</h3>
                </div>

                {orders.length > 0 ? (
                  <div className="space-y-4">
                    {orders.map((order) => (
                      <div
                        key={order.id}
                        className="border border-gray-200 rounded-lg overflow-hidden hover:border-verde-bosque/50 transition-colors"
                      >
                        {/* Order Header */}
                        <div
                          className="p-4 cursor-pointer"
                          onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                        >
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <p className="font-semibold text-gray-900">
                                Pedido #{order.order_number}
                              </p>
                              <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                                <Calendar className="w-4 h-4" />
                                {formatDate(order.created_at)}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(order.status)}`}>
                                {getStatusLabel(order.status)}
                              </span>
                              <ChevronRight
                                className={`w-5 h-5 text-gray-400 transition-transform ${
                                  expandedOrder === order.id ? 'rotate-90' : ''
                                }`}
                              />
                            </div>
                          </div>
                          <div className="flex justify-between items-center">
                            <p className="text-sm text-gray-600">
                              {order.items?.length || 0} productos
                            </p>
                            <p className="font-bold text-verde-bosque">
                              {formatCurrency(order.total)}
                            </p>
                          </div>
                        </div>

                        {/* Expanded Order Details */}
                        {expandedOrder === order.id && order.items && (
                          <div className="border-t border-gray-200 bg-gray-50 p-4">
                            <div className="space-y-3 mb-4">
                              {order.items.map((item) => (
                                <div key={item.id} className="flex items-center gap-3">
                                  <div className="w-12 h-12 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                                    {item.product_snapshot?.main_image_url ? (
                                      <img
                                        src={item.product_snapshot.main_image_url}
                                        alt={item.product_snapshot.name}
                                        className="w-full h-full object-cover"
                                      />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center">
                                        <Package className="w-6 h-6 text-gray-400" />
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="font-medium text-gray-900 truncate">
                                      {item.product_snapshot?.name || 'Producto'}
                                    </p>
                                    <p className="text-sm text-gray-500">
                                      {item.quantity} x {formatCurrency(item.unit_price)}
                                    </p>
                                  </div>
                                  <p className="font-medium text-gray-900">
                                    {formatCurrency(item.subtotal)}
                                  </p>
                                </div>
                              ))}
                            </div>

                            {/* Repeat Order Button */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRepeatOrder(order);
                              }}
                              className="w-full flex items-center justify-center gap-2 bg-verde-bosque text-white py-3 rounded-lg hover:bg-verde-bosque/90 transition-colors font-medium"
                            >
                              <RefreshCw className="w-5 h-5" />
                              Repetir este pedido
                            </button>
                          </div>
                        )}
                      </div>
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
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center gap-3 mb-6">
                  <Heart className="w-6 h-6 text-red-500" />
                  <h3 className="font-display font-bold text-xl">Mis Favoritos</h3>
                </div>

                {wishlistLoading ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="w-8 h-8 text-verde-bosque animate-spin" />
                  </div>
                ) : getWishlistProducts().length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {getWishlistProducts().map((product) => (
                      <FavoriteProductCard
                        key={product.id}
                        product={product}
                        onRemove={() => user && removeFromWishlist(product.id, user.id)}
                        onAddToCart={(product, variant) => {
                          const itemToAdd = {
                            ...product,
                            category_id: product.category_id || 'general',
                            variant: variant ?? undefined
                          };
                          addItem(itemToAdd as any, 1);
                        }}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-600 mb-4">No tienes productos favoritos</p>
                    <Link
                      href="/tienda"
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
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center gap-3 mb-6">
                  <Ticket className="w-6 h-6 text-purple-500" />
                  <h3 className="font-display font-bold text-xl">Cupones Disponibles</h3>
                </div>

                {availableCoupons.length > 0 ? (
                  <div className="space-y-4">
                    {availableCoupons.map((coupon) => (
                      <div
                        key={coupon.id}
                        className="border-2 border-dashed border-purple-200 rounded-lg p-4 bg-purple-50/50"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-mono font-bold text-lg text-purple-700">
                                {coupon.code}
                              </span>
                              {coupon.is_welcome_coupon && (
                                <span className="px-2 py-0.5 text-xs bg-purple-200 text-purple-700 rounded-full flex items-center gap-1">
                                  <Gift className="w-3 h-3" />
                                  Bienvenida
                                </span>
                              )}
                            </div>
                            <p className="text-gray-600 text-sm mb-2">{coupon.description}</p>
                            <div className="flex flex-wrap gap-2 text-xs">
                              <span className="px-2 py-1 bg-white rounded-full text-gray-600">
                                {coupon.discount_type === 'percentage'
                                  ? `${coupon.discount_value}% de descuento`
                                  : `${formatCurrency(coupon.discount_value)} de descuento`}
                              </span>
                              {coupon.min_purchase > 0 && (
                                <span className="px-2 py-1 bg-white rounded-full text-gray-600">
                                  Mín: {formatCurrency(coupon.min_purchase)}
                                </span>
                              )}
                              {coupon.free_shipping && (
                                <span className="px-2 py-1 bg-green-100 rounded-full text-green-700">
                                  + Envío gratis
                                </span>
                              )}
                              {coupon.valid_until && (
                                <span className="px-2 py-1 bg-white rounded-full text-gray-600">
                                  Hasta: {formatDate(coupon.valid_until)}
                                </span>
                              )}
                            </div>
                          </div>
                          <button
                            onClick={() => copyCouponCode(coupon.code)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                              copiedCoupon === coupon.code
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
                                Copiar
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
          </div>
        </div>
      </div>
    </div>
  );
}
