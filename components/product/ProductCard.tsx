'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ShoppingCart, Heart } from 'lucide-react';
import type { UnifiedProduct } from '@/lib/types';
import { dedupeVariants } from '@/lib/product-variants';
import { formatPrice, calculateDiscount } from '@/lib/utils';
import { getProductImageUrl } from '@/lib/types';
import { useCartStore } from '@/lib/cart-store';
import { useWishlistStore } from '@/lib/wishlist-store';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { ProductImagePlaceholder } from '@/components/ui/ProductImagePlaceholder';
import { ProductDetailModal } from './ProductDetailModal';

interface ProductVariant {
  id: string;
  variant_name: string;
  variant_value: string;
  price_adjustment: number;
  price: number;
}

interface ProductCardProps {
  product: UnifiedProduct;
}

export function ProductCard({ product }: ProductCardProps) {
  const { addItem } = useCartStore();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlistStore();
  const { user } = useAuth();
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [isWishlistLoading, setIsWishlistLoading] = useState(false);

  const hasDiscount = product.discount_price && product.discount_price < product.price;
  const discount = hasDiscount ? calculateDiscount(product.price, product.discount_price!) : 0;
  const isProductInWishlist = isInWishlist(product.id);

  // Cargar variantes del producto (locales o Supabase)
  useEffect(() => {
    // ✅ USAR VARIANTES DEL OBJETO PRODUCTO
    if (product.variants && product.variants.length > 0) {
      console.log('📦 Usando variantes del producto:', product.name, product.variants);

      // ✅ Usar el precio de la variante directamente si existe, no recalcular
      const variantsWithPrice = dedupeVariants(product.variants).map(v => ({
        ...v,
        // Si la variante ya tiene precio, usarlo; si no, calcular con price_adjustment
        price: (v as any).price || ((product.discount_price || product.price) + ((v as any).price_adjustment || 0))
      }));
      setVariants(variantsWithPrice);
      setSelectedVariant(variantsWithPrice[0]); // Seleccionar primer variante por defecto
    } else {
      // Si no hay variantes locales, buscar en Supabase (fallback)
      async function loadVariantsFromSupabase() {
        try {
          const { data } = await supabase
            .from('product_variants')
            .select('*')
            .eq('product_id', product.id)
            .eq('is_active', true)
            .order('price_adjustment', { ascending: true });

          if (data && data.length > 0) {
            // ✅ Usar el precio de la variante directamente si existe
            const variantsWithPrice = dedupeVariants(data).map(v => ({
              ...v,
              price: v.price || ((product.discount_price || product.price) + (v.price_adjustment || 0))
            }));
            setVariants(variantsWithPrice);
            setSelectedVariant(variantsWithPrice[0]);
          }
        } catch (error) {
          console.log('⚠️ Error cargando variantes desde Supabase:', error);
        }
      }
      loadVariantsFromSupabase();
    }
  }, [product.id, product.price, product.discount_price, product.base_price, product.variants]);

  // Manejar clic en el botón de favoritos
  const handleWishlistClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      // Si no está logueado, redirigir a login
      window.location.href = '/auth/login';
      return;
    }

    setIsWishlistLoading(true);

    try {
      if (isProductInWishlist) {
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

    const handleAddToCart = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        // ✅ SOLUCIÓN: Si hay variantes pero no se ha seleccionado ninguna, 
        // buscar la variante más económica en lugar de retornar null.
        let finalVariant = selectedVariant;
        if (variants.length > 0 && !finalVariant) {
            console.log('⚠️ No variant selected, defaulting to the cheapest variant');
            const cheapest = [...variants].sort((a, b) => a.price - b.price)[0];
            finalVariant = cheapest;
        }

        const itemToAdd = {
            ...product,
            category_id: product.category_id || product.category || 'general',
            variant: finalVariant ?? undefined
        };

        console.log('🛒 Adding to cart:', itemToAdd);

        // Pasar quantity como segundo parámetro
        addItem(itemToAdd as any, 1);
        console.log('✅ Product added to cart successfully');

        // Mostrar toast de éxito
        setShowToast(true);
        setTimeout(() => setShowToast(false), 2000);
    };

  const handleImageClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsModalOpen(true);
  };

  // Precio a mostrar: variante seleccionada o precio base
  const displayPrice = selectedVariant
    ? selectedVariant.price
    : (product.discount_price || product.price);

  return (
    <>
      <div className="bg-white rounded-2xl overflow-hidden shadow-soft hover:shadow-medium transition-all duration-200 hover:-translate-y-1 flex flex-col h-full">
        {/* Imagen con ProductImagePlaceholder - Clickable */}
        <div
          className="relative aspect-square overflow-hidden cursor-pointer"
          onClick={handleImageClick}
        >
          <ProductImagePlaceholder
            productName={product.name}
            price={displayPrice}
            category="aguacates"
            imageUrl={getProductImageUrl(product)}
            showPrice={false} // El precio se mostrará en la sección de abajo
            className="w-full h-full"
          />

          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-2">
            {hasDiscount && (
              <span className="bg-naranja-frutal text-white px-2 py-1 text-xs font-bold rounded">
                -{discount}%
              </span>
            )}
          </div>

          {/* Botón Favorito */}
          <button
            className={`absolute top-3 right-3 bg-white/90 hover:bg-white p-2 rounded-full shadow-md transition-all pointer-events-auto z-10 ${isProductInWishlist ? 'text-red-500 hover:text-red-600' : 'text-gray-600 hover:text-red-500'
              } ${isWishlistLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              handleWishlistClick(e);
            }}
            disabled={isWishlistLoading}
          >
            <Heart className={`w-4 h-4 ${isProductInWishlist ? 'fill-current' : ''}`} />
          </button>

          {/* Hover overlay */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
            <div className="bg-white/90 px-3 py-1 rounded-full text-sm font-medium text-gray-700">
              Ver detalles
            </div>
          </div>
        </div>

        {/* Contenido - Se expande para llenar altura */}
        <div className="p-3 flex flex-col flex-1">
          {/* Nombre centrado debajo de la imagen */}
          <h3 className="font-semibold text-base text-gray-900 mb-2 line-clamp-2 text-center">
            {product.name}
          </h3>

          {/* Rating compacto */}
          {(product.review_count ?? 0) > 0 && (
            <div className="flex items-center justify-center gap-1 mb-2">
              <span className="text-yellow-500 text-sm">★</span>
              <span className="text-xs font-medium">{(product.rating ?? 0).toFixed(1)}</span>
              <span className="text-xs text-gray-500">({product.review_count ?? 0})</span>
            </div>
          )}

          {/* Botones Toggle de variantes - Rectangulares horizontales (anchos y bajos) */}
          {variants.length > 0 && (
            <div className="mb-2" onClick={(e) => e.preventDefault()}>
              <div className={`
                gap-1.5
                ${variants.length <= 2
                  ? 'grid grid-cols-2'
                  : 'flex md:grid overflow-x-auto md:overflow-x-visible snap-x snap-mandatory md:snap-none scrollbar-hide pb-1 md:pb-0 md:grid-cols-2'
                }
              `}>
                {variants.map((variant) => (
                  <button
                    key={variant.id}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setSelectedVariant(variant);
                    }}
                    className={`
                      ${variants.length > 2 ? 'min-w-[80px] md:min-w-[120px] snap-start' : ''}
                      flex items-center justify-center gap-1 md:gap-1.5 px-2 md:px-2.5 py-1.5 rounded-md border-2 transition-all
                      ${selectedVariant?.id === variant.id
                        ? 'border-verde-bosque bg-verde-bosque/10 shadow-sm'
                        : 'border-gray-300 bg-white hover:border-verde-bosque/50'
                      }
                    `}
                  >
                    {/* Valor de variante - siempre visible */}
                    <span className={`text-xs font-semibold truncate ${selectedVariant?.id === variant.id ? 'text-verde-bosque' : 'text-gray-900'
                      }`}>
                      {variant.variant_value}
                    </span>
                    {/* Precio - solo visible en desktop */}
                    <span className={`hidden md:inline text-xs font-mono whitespace-nowrap ${selectedVariant?.id === variant.id ? 'text-verde-bosque' : 'text-gray-600'
                      }`}>
                      {formatPrice(variant.price)}
                    </span>
                  </button>
                ))}
              </div>

              {/* Indicadores para scroll (solo móvil con 3+ variantes) */}
              {variants.length > 2 && (
                <div className="flex md:hidden justify-center gap-1 mt-1.5">
                  {variants.map((_, index) => (
                    <div
                      key={index}
                      className={`h-0.5 rounded-full transition-all ${index === 0 ? 'w-2 bg-verde-bosque' : 'w-1 bg-gray-300'
                        }`}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Precio compacto */}
          <div className="flex items-end justify-between mb-2">
            <div className="flex-1">
              {hasDiscount ? (
                <>
                  <div className="text-xl font-bold font-mono text-verde-bosque">
                    {formatPrice(product.discount_price!)}
                  </div>
                  <div className="text-xs text-gray-500 line-through">
                    {formatPrice(displayPrice)}
                  </div>
                </>
              ) : (
                <div className="text-xl font-bold font-mono text-verde-bosque">
                  {formatPrice(displayPrice)}
                </div>
              )}
              <div className="text-xs text-gray-500">Por {product.unit}</div>
            </div>
          </div>

          {/* Botón Agregar - Empujado al fondo */}
          <div className="mt-auto pt-2">
            <button
              onClick={handleAddToCart}
              disabled={(product.stock || 0) === 0}
              className="w-full bg-gradient-to-r from-yellow-400 to-yellow-600 hover:from-yellow-500 hover:to-yellow-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-verde-bosque-700 font-bold py-2 px-3 rounded-lg transition-all transform hover:scale-105 shadow-md hover:shadow-lg flex items-center justify-center gap-2 border-2 border-verde-aguacate disabled:border-gray-400 text-sm"
            >
              <ShoppingCart className="w-4 h-4" />
              {(product.stock || 0) > 0 ? 'Agregar' : 'Agotado'}
            </button>
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

      {/* Product Detail Modal */}
      <ProductDetailModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        product={product}
      />
    </>
  );
}
