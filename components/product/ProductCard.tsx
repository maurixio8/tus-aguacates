'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ShoppingCart, Heart } from 'lucide-react';
import type { Product } from '@/lib/supabase';
import { formatPrice, calculateDiscount } from '@/lib/utils';
import { useCartStore } from '@/lib/cart-store';
import { supabase } from '@/lib/supabase';
import { ProductImagePlaceholder } from '@/components/ui/ProductImagePlaceholder';
// import ProductModal from './ProductModal'; // Temporarily disabled

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
  
  const hasDiscount = product.discount_price && product.discount_price < product.price;
  const discount = hasDiscount ? calculateDiscount(product.price, product.discount_price!) : 0;

  // Cargar variantes al montar el componente
  useEffect(() => {
    async function loadVariants() {
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
        setSelectedVariant(variantsWithPrice[0]); // Seleccionar primer variante por defecto
      }
    }
    loadVariants();
  }, [product.id, product.price, product.discount_price]);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    if (variants.length > 0) {
      // Si hay variantes, abrir el modal
      setIsModalOpen(true);
    } else {
      // Si no hay variantes, agregar directo al carrito
      addItem(product);
    }
  };

  const handleImageClick = (e: React.MouseEvent) => {
    e.preventDefault();
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
          <h3 className="font-semibold text-lg text-gray-900 mb-1 line-clamp-2">
            {product.name}
          </h3>

          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
            {product.description}
          </p>

          {/* Rating */}
          {product.review_count > 0 && (
            <div className="flex items-center gap-1 mb-3">
              <span className="text-yellow-500">★</span>
              <span className="text-sm font-medium">{product.rating.toFixed(1)}</span>
              <span className="text-xs text-gray-500">({product.review_count})</span>
            </div>
          )}

          {/* Selector de variantes */}
          {variants.length > 0 && (
            <div className="mb-3" onClick={(e) => e.preventDefault()}>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Presentación
              </label>
              <select
                value={selectedVariant?.id || ''}
                onChange={(e) => {
                  const variant = variants.find(v => v.id === e.target.value);
                  setSelectedVariant(variant || null);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 bg-white"
              >
                {variants.map((variant) => (
                  <option key={variant.id} value={variant.id}>
                    {variant.variant_value} - {formatPrice(variant.price)}
                  </option>
                ))}
              </select>
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
            disabled={product.stock === 0}
            className="w-full bg-gradient-to-r from-yellow-400 to-yellow-600 hover:from-yellow-500 hover:to-yellow-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-verde-bosque-700 font-bold py-3 px-4 rounded-lg transition-all transform hover:scale-105 shadow-md hover:shadow-lg flex items-center justify-center gap-2 border-2 border-verde-aguacate disabled:border-gray-400"
          >
            <ShoppingCart className="w-4 h-4" />
            {product.stock > 0 ? 'Agregar al Carrito' : 'Agotado'}
          </button>
        </div>
      </div>

      {/* Product Modal - Temporarily disabled */}
      {/* <ProductModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        product={product}
      /> */}
    </>
  );
}
