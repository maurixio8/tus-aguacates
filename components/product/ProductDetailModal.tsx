'use client';

import { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Heart, ShoppingCart, Share2 } from 'lucide-react';
import type { Product } from '@/lib/productStorage';
import { formatPrice, calculateDiscount } from '@/lib/utils';
import { useCartStore } from '@/lib/cart-store';
import { useWishlistStore } from '@/lib/wishlist-store';
import { useAuth } from '@/lib/auth-context';
import { ProductImagePlaceholder } from '@/components/ui/ProductImagePlaceholder';

interface ProductVariant {
  id: string;
  variant_name: string;
  variant_value: string;
  price_adjustment: number;
  price: number;
}

interface ProductDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product;
}

export function ProductDetailModal({ isOpen, onClose, product }: ProductDetailModalProps) {
  const { addItem } = useCartStore();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlistStore();
  const { user } = useAuth();
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [showToast, setShowToast] = useState(false);
  const [isWishlistLoading, setIsWishlistLoading] = useState(false);

  const isWishlisted = isInWishlist(product.id);

  const hasDiscount = product.discount_price && product.discount_price < product.price;
  const discount = hasDiscount ? calculateDiscount(product.price, product.discount_price!) : 0;

  // Cargar variantes (del producto o desde Supabase)
  useEffect(() => {
    async function loadVariants() {
      // Si el producto ya tiene variantes cargadas
      if (product.variants && product.variants.length > 0) {
        // ✅ Usar el precio de la variante directamente si existe
        const variantsWithPrice = product.variants.map((v: any) => ({
          ...v,
          price: v.price || ((product.discount_price || product.price) + (v.price_adjustment || 0))
        }));
        setVariants(variantsWithPrice);
        setSelectedVariant(variantsWithPrice[0]);
        return;
      }

      // Si no, buscar en Supabase
      try {
        const { data } = await import('@/lib/supabase').then(m =>
          m.supabase
            .from('product_variants')
            .select('*')
            .eq('product_id', product.id)
            .eq('is_active', true)
            .order('price_adjustment', { ascending: true })
        );

        if (data && data.length > 0) {
          // ✅ Usar el precio de la variante directamente si existe
          const variantsWithPrice = data.map((v: any) => ({
            ...v,
            price: v.price || ((product.discount_price || product.price) + (v.price_adjustment || 0))
          }));
          setVariants(variantsWithPrice);
          setSelectedVariant(variantsWithPrice[0]);
        }
      } catch (error) {
        console.log('Error cargando variantes:', error);
      }
    }

    if (isOpen) {
      loadVariants();
    }
  }, [product, isOpen]);

  // Manejar clic en el botón de favoritos
  const handleWishlistClick = async () => {
    if (!user) {
      // Si no está logueado, redirigir a login
      window.location.href = '/auth/login';
      return;
    }

    setIsWishlistLoading(true);

    try {
      if (isWishlisted) {
        // Eliminar de favoritos
        const success = await removeFromWishlist(product.id, user.id);
        if (success) {
          console.log('✅ Producto eliminado de favoritos');
        }
      } else {
        // Agregar a favoritos
        const success = await addToWishlist(product, user.id);
        if (success) {
          console.log('✅ Producto agregado a favoritos');
        }
      }
    } catch (error) {
      console.error('❌ Error al gestionar favoritos:', error);
    } finally {
      setIsWishlistLoading(false);
    }
  };

  if (!isOpen) return null;

  const displayPrice = selectedVariant ? selectedVariant.price : (product.discount_price || product.price);

    const handleAddToCart = () => {
        // ✅ SOLUCIÓN: Si hay variantes pero no se ha seleccionado ninguna,
        // buscar la variante más económica.
        let finalVariant = selectedVariant;
        if (variants.length > 0 && !finalVariant) {
            console.log('⚠️ No variant selected in Modal, defaulting to cheapest');
            const cheapest = [...variants].sort((a, b) => a.price - b.price)[0];
            finalVariant = cheapest;
        }

        const itemToAdd = {
            ...product,
            category_id: product.category_id || product.category || 'general',
            variant: finalVariant ?? undefined
        };

        // Pasar quantity como segundo parámetro, no como propiedad del objeto
        addItem(itemToAdd as any, quantity);
        setShowToast(true);
        setTimeout(() => setShowToast(false), 2000);

        // Resetear cantidad
        setQuantity(1);
    };

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/productos/${product.id}`;
    const shareText = `Mira este producto: ${product.name} - ${formatPrice(displayPrice)}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: product.name,
          text: shareText,
          url: shareUrl
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      // Fallback: Copiar al portapapeles
      await navigator.clipboard.writeText(shareUrl);
      alert('Enlace copiado al portapapeles');
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40 transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Container - Responsive */}
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4 sm:p-6">
          {/* Modal Content */}
          <div
            className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-xl bg-white shadow-2xl animation-in fade-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header con botón cerrar */}
            <div className="flex justify-end p-4 border-b border-gray-200">
              <button
                onClick={onClose}
                className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-full shadow-lg transition-all transform hover:scale-110 font-bold"
                aria-label="Cerrar"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Content Grid - Responsive */}
            <div className="p-4 space-y-4">

              {/* Imagen - Lado Izquierdo */}
              <div className="flex flex-col gap-4">
                {/* Imagen Principal */}
                <div className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 max-h-48">
                  <ProductImagePlaceholder
                    productName={product.name}
                    price={displayPrice}
                    category={product.category || 'productos'}
                    imageUrl={product.main_image_url}
                    showPrice={false}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Acciones en imagen (Mobile-friendly) */}
                
              </div>

              {/* Información - Lado Derecho */}
              <div className="flex flex-col gap-6">

                {/* Categoría */}
                

                {/* Título y Descripción */}
                <div>
                  <h2 className="text-lg font-bold text-gray-900">
                    {product.name}
                  </h2>
                  <p className="text-gray-700 leading-relaxed text-sm md:text-base">
                    {product.description || 'Producto de alta calidad de Tus Aguacates'}
                  </p>
                </div>

                {/* Rating */}
                {(product.review_count ?? 0) > 0 && (
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <span className="text-yellow-500 text-lg">★</span>
                      <span className="font-semibold text-gray-900">
                        {(product.rating ?? 0).toFixed(1)}
                      </span>
                      <span className="text-gray-500 text-sm">
                        ({product.review_count ?? 0} opiniones)
                      </span>
                    </div>
                  </div>
                )}

                {/* Precio */}
                <div className="py-2 border-t border-gray-200">
                  <div className="flex items-baseline gap-3">
                    <span className="text-2xl font-bold text-verde-bosque font-mono">
                      {formatPrice(displayPrice)}
                    </span>
                    {hasDiscount && (
                      <>
                        <span className="text-lg text-gray-500 line-through">
                          {formatPrice(product.price)}
                        </span>
                        <span className="bg-naranja-frutal text-white px-3 py-1 rounded-full text-sm font-bold">
                          -{discount}%
                        </span>
                      </>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mt-2">Por {product.unit || 'unidad'}</p>
                </div>

                {/* Selector de Variantes */}
                {variants.length > 0 && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-3">
                      Presentación
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {variants.map((variant) => (
                        <button
                          key={variant.id}
                          onClick={() => setSelectedVariant(variant)}
                          className={`px-3 py-2 rounded-lg border-2 font-medium transition-all text-sm ${selectedVariant?.id === variant.id
                            ? 'bg-verde-bosque text-white border-verde-bosque'
                            : 'border-gray-300 text-gray-700 hover:border-verde-bosque'
                            }`}
                        >
                          <div className="font-semibold">{variant.variant_value}</div>
                          <div className="text-xs opacity-80">{formatPrice(variant.price)}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}



                {/* Selector de Cantidad */}
                {(product.stock || 0) > 0 && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-3">
                      Cantidad
                    </label>
                    <div className="flex items-center border border-gray-300 rounded-lg w-fit">
                      <button
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="px-4 py-2 text-gray-600 hover:bg-gray-100 transition"
                      >
                        −
                      </button>
                      <input
                        type="number"
                        min="1"
                        value={quantity}
                        onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-16 text-center font-semibold border-0 focus:outline-none"
                      />
                      <button
                        onClick={() => setQuantity(quantity + 1)}
                        className="px-4 py-2 text-gray-600 hover:bg-gray-100 transition"
                      >
                        +
                      </button>
                    </div>
                  </div>
                )}

                {/* Botón Agregar al Carrito */}
                <button
                  onClick={handleAddToCart}
                  disabled={(product.stock || 0) === 0}
                  className="w-full bg-gradient-to-r from-yellow-400 to-yellow-600 hover:from-yellow-500 hover:to-yellow-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-verde-bosque-700 font-bold py-4 rounded-lg transition-all transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center justify-center gap-2 border-2 border-verde-aguacate disabled:border-gray-500 text-lg"
                >
                  <ShoppingCart className="w-5 h-5" />
                  {(product.stock || 0) > 0 ? '🛒 Agregar al Carrito' : '❌ Agotado'}
                </button>

                {/* Garantía y Confianza */}
                
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      {showToast && (
        <div className="fixed top-4 right-4 bg-green-600 text-white px-4 py-3 rounded-lg shadow-lg z-50 flex items-center gap-2 animate-pulse">
          <span className="text-lg">🛒</span>
          <span className="font-medium">¡Agregado al carrito!</span>
        </div>
      )}
    </>
  );
}
