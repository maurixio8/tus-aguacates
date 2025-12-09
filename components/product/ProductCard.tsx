'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ShoppingCart, Heart } from 'lucide-react';
import type { Product } from '@/lib/productStorage';
import { formatPrice, calculateDiscount } from '@/lib/utils';
import { useCartStore } from '@/lib/cart-store';
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
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { addItem } = useCartStore();
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showToast, setShowToast] = useState(false);
  
  const hasDiscount = product.discount_price && product.discount_price < product.price;
  const discount = hasDiscount ? calculateDiscount(product.price, product.discount_price!) : 0;

  // Cargar variantes del producto (locales o Supabase)
  useEffect(() => {
    // ✅ USAR VARIANTES DEL OBJETO PRODUCTO (vienen del JSON)
    if (product.variants && product.variants.length > 0) {
      console.log('📦 Usando variantes locales del producto:', product.name, product.variants);

      const variantsWithPrice = product.variants.map(v => ({
        ...v,
        price: (product.discount_price || product.base_price || product.price) + v.price_adjustment
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
            const variantsWithPrice = data.map(v => ({
              ...v,
              price: (product.discount_price || product.price) + v.price_adjustment
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

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const itemToAdd = {
      ...product,
      category_id: product.category_id || product.category || 'general',
      variant: selectedVariant ?? undefined
    };

    console.log('🛒 Adding to cart:', itemToAdd);

    if (variants.length > 0 && !selectedVariant) {
      console.log('⚠️ No variant selected, using first variant');
      return;
    }

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

  // Precio a mostrar (variante seleccionada o precio base con descuento)
  const displayPrice = selectedVariant ? selectedVariant.price : (product.discount_price || product.price);

  return (
    <>
      <div className="bg-white rounded-2xl overflow-hidden shadow-soft hover:shadow-medium transition-all duration-200 hover:-translate-y-1">
        {/* Imagen con ProductImagePlaceholder - Clickable */}
        <div
          className="relative aspect-square overflow-hidden cursor-pointer"
          onClick={handleImageClick}
        >
          <ProductImagePlaceholder
            productName={product.name}
            price={displayPrice}
            category="aguacates"
            imageUrl={product.main_image_url}
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
            className="absolute top-3 right-3 bg-white/90 hover:bg-white p-2 rounded-full shadow-md transition-all"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
          >
            <Heart className="w-4 h-4 text-gray-600" />
          </button>

          {/* Hover overlay */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
            <div className="bg-white/90 px-3 py-1 rounded-full text-sm font-medium text-gray-700">
              Ver detalles
            </div>
          </div>
        </div>

        {/* Contenido */}
        <div className="p-4">
          <h3 className="font-semibold text-lg text-gray-900 mb-3 line-clamp-2">
            {product.name}
          </h3>

          {/* Rating */}
          {(product.review_count ?? 0) > 0 && (
            <div className="flex items-center gap-1 mb-3">
              <span className="text-yellow-500">★</span>
              <span className="text-sm font-medium">{(product.rating ?? 0).toFixed(1)}</span>
              <span className="text-xs text-gray-500">({product.review_count ?? 0})</span>
            </div>
          )}

          {/* Botones Toggle de variantes - Diseño adaptativo */}
          {variants.length > 0 && (
            <div className="mb-3" onClick={(e) => e.preventDefault()}>
              {/* Grid para 2 variantes, Scroll horizontal para 3+ */}
              <div className={`
                ${variants.length <= 2
                  ? 'grid grid-cols-2 gap-2'
                  : 'flex gap-2 overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-1'
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
                      ${variants.length > 2 ? 'min-w-[140px] snap-start' : ''}
                      flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all
                      ${selectedVariant?.id === variant.id
                        ? 'border-verde-bosque bg-verde-bosque/10 shadow-md'
                        : 'border-gray-300 bg-white hover:border-verde-bosque/50 hover:shadow-sm'
                      }
                    `}
                  >
                    <span className={`text-sm font-semibold ${
                      selectedVariant?.id === variant.id ? 'text-verde-bosque' : 'text-gray-900'
                    }`}>
                      {variant.variant_value}
                    </span>
                    <span className={`text-xs mt-1 font-mono ${
                      selectedVariant?.id === variant.id ? 'text-verde-bosque' : 'text-gray-600'
                    }`}>
                      {formatPrice(variant.price)}
                    </span>
                  </button>
                ))}
              </div>

              {/* Indicadores para scroll (solo si hay 3+ variantes) */}
              {variants.length > 2 && (
                <div className="flex justify-center gap-1 mt-2">
                  {variants.map((_, index) => (
                    <div
                      key={index}
                      className={`h-1 rounded-full transition-all ${
                        index === 0 ? 'w-2 bg-verde-bosque' : 'w-1 bg-gray-300'
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Precio */}
          <div className="flex items-end justify-between mb-3">
            <div>
              {hasDiscount ? (
                <>
                  <div className="text-2xl font-bold font-mono text-verde-bosque">
                    {formatPrice(product.discount_price!)}
                  </div>
                  <div className="text-sm text-gray-500 line-through">
                    {formatPrice(displayPrice)}
                  </div>
                </>
              ) : (
                <div className="text-2xl font-bold font-mono text-verde-bosque">
                  {formatPrice(displayPrice)}
                </div>
              )}
              <div className="text-xs text-gray-500">Por {product.unit}</div>
            </div>
          </div>

          {/* Botón Agregar al Carrito */}
          <button
            onClick={handleAddToCart}
            disabled={(product.stock || 0) === 0}
            className="w-full bg-gradient-to-r from-yellow-400 to-yellow-600 hover:from-yellow-500 hover:to-yellow-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-verde-bosque-700 font-bold py-3 px-4 rounded-lg transition-all transform hover:scale-105 shadow-md hover:shadow-lg flex items-center justify-center gap-2 border-2 border-verde-aguacate disabled:border-gray-400"
          >
            <ShoppingCart className="w-4 h-4" />
            {(product.stock || 0) > 0 ? 'Agregar al Carrito' : 'Agotado'}
          </button>
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
