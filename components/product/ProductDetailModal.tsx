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
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />

      {/* Modal Compacto */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3">
        <div
          className="w-full max-w-sm max-h-[85vh] overflow-y-auto rounded-2xl bg-white shadow-2xl relative"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Cerrar */}
          <button
            onClick={onClose}
            className="absolute top-2 right-2 z-10 bg-red-500 hover:bg-red-600 text-white w-8 h-8 rounded-full flex items-center justify-center shadow-lg"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Imagen */}
          <div className="w-full aspect-[4/3] bg-gray-100 rounded-t-2xl overflow-hidden">
            <ProductImagePlaceholder
              productName={product.name}
              price={displayPrice}
              category={product.category || 'productos'}
              imageUrl={product.main_image_url}
              showPrice={false}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Info */}
          <div className="p-3 space-y-2">
            {/* Nombre + Precio */}
            <div className="flex items-start justify-between gap-2">
              <h2 className="font-bold text-base text-gray-900 leading-tight flex-1">
                {product.name}
              </h2>
              <div className="text-right flex-shrink-0">
                <span className="text-lg font-bold text-verde-bosque font-mono">
                  {formatPrice(displayPrice)}
                </span>
                {hasDiscount && (
                  <span className="block text-xs text-gray-400 line-through">
                    {formatPrice(product.price)}
                  </span>
                )}
              </div>
            </div>

            {/* Descripción: expandida para combos */}
            {product.description ? (
              product.name.toLowerCase().includes('combo') || product.description.includes('Qué Incluye') || product.description.includes('Qué incluye') ? (
                <div className="text-xs text-gray-600 space-y-0.5">
                  {product.description.split('\n').filter((line: string) => line.trim()).map((line: string, i: number) => (
                    <p key={i} className={line.startsWith('⭐') || line.startsWith('Qué') || line.startsWith('Envío') || line.startsWith('✨') ? 'font-semibold text-gray-700' : ''}>
                      {line}
                    </p>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-500 line-clamp-2">{product.description}</p>
              )
            ) : (
              <p className="text-xs text-gray-500">Producto fresco de Tus Aguacates</p>
            )}

            <p className="text-xs text-gray-400">Por {product.unit || 'unidad'}</p>

            {/* Variantes */}
            {variants.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-700 mb-1">Presentación:</p>
                <div className="grid grid-cols-2 gap-1.5">
                  {variants.map((variant) => (
                    <button
                      key={variant.id}
                      onClick={() => setSelectedVariant(variant)}
                      className={`px-2 py-1.5 rounded-lg border text-xs font-medium transition-all
                        ${selectedVariant?.id === variant.id
                          ? 'bg-verde-bosque text-white border-verde-bosque'
                          : 'border-gray-200 text-gray-700 hover:border-verde-bosque'
                        }`}
                    >
                      <span className="font-semibold">{variant.variant_value}</span>
                      <span className="block opacity-70">{formatPrice(variant.price)}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Cantidad */}
            {(product.stock || 0) > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-gray-700">Cantidad:</span>
                <div className="flex items-center border border-gray-200 rounded-lg">
                  <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="px-3 py-1 text-gray-600 hover:bg-gray-100 text-sm">−</button>
                  <span className="px-3 py-1 font-semibold text-sm">{quantity}</span>
                  <button onClick={() => setQuantity(quantity + 1)} className="px-3 py-1 text-gray-600 hover:bg-gray-100 text-sm">+</button>
                </div>
              </div>
            )}

            {/* Botón Agregar */}
            <button
              onClick={handleAddToCart}
              disabled={(product.stock || 0) === 0}
              className="w-full bg-gradient-to-r from-yellow-400 to-yellow-600 hover:from-yellow-500 hover:to-yellow-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-verde-bosque-700 font-bold py-3 rounded-xl transition-all hover:scale-[1.02] shadow-lg flex items-center justify-center gap-2 border-2 border-verde-aguacate text-base"
            >
              <ShoppingCart className="w-5 h-5" />
              {(product.stock || 0) > 0 ? 'Agregar al Carrito' : 'Agotado'}
            </button>
          </div>
        </div>
      </div>

      {/* Toast */}
      {showToast && (
        <div className="fixed top-4 right-4 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg z-[60] flex items-center gap-2 text-sm">
          🛒 ¡Agregado al carrito!
        </div>
      )}
    </>
  );
}
