'use client';

import Image from 'next/image';
import { formatPrice } from '@/lib/utils';
import type { Product } from '@/lib/supabase';

interface ProductCardSliderProps {
  product: Product;
  onProductClick?: (product: Product) => void;
}

export function ProductCardSlider({ product, onProductClick }: ProductCardSliderProps) {
  const price = product.discount_price || product.price;
  const hasDiscount = product.discount_price && product.discount_price < product.price;

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (onProductClick) {
      onProductClick(product);
    }
  };

  return (
    <div
      onClick={handleClick}
      className="block bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all group cursor-pointer"
    >
      {/* Imagen del producto */}
      <div className="relative aspect-square bg-gray-100">
        {product.main_image_url ? (
          <Image
            src={product.main_image_url}
            alt={product.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-gray-400">
            <span className="text-5xl">🥑</span>
          </div>
        )}

        {/* Badge de descuento */}
        {hasDiscount && (
          <div className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-lg">
            OFERTA
          </div>
        )}
      </div>

      {/* Información del producto */}
      <div className="p-3">
        {/* Nombre */}
        <h3 className="font-semibold text-gray-800 mb-2 line-clamp-2 group-hover:text-green-600 transition-colors">
          {product.name}
        </h3>

        {/* Precio */}
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-green-600">
            {formatPrice(price)}
          </span>

          {hasDiscount && (
            <span className="text-sm text-gray-400 line-through">
              {formatPrice(product.price)}
            </span>
          )}
        </div>

        {/* Indicador de clic */}
        <p className="text-xs text-gray-500 mt-2">
          Toca para ver detalles →
        </p>
      </div>
    </div>
  );
}