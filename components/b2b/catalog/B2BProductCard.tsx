/**
 * Tarjeta de Producto B2B
 * "Tus Aguacates" - E-commerce Platform
 */
'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import type { B2BProduct } from '@/lib/b2b/b2b-types';
import { formatPrice } from '@/lib/b2b/b2b-pricing';
import { VolumePricingCompact } from './VolumePricingDisplay';

interface B2BProductCardProps {
  product: B2BProduct;
  onAddToCart?: (product: B2BProduct, quantity: number) => void;
}

export function B2BProductCard({ product, onAddToCart }: B2BProductCardProps) {
  const [quantity, setQuantity] = useState(product.minimum_order_quantity);

  const handleQuantityChange = (newQuantity: number) => {
    const validated = Math.max(
      product.minimum_order_quantity,
      Math.min(product.stock_quantity, newQuantity)
    );
    setQuantity(validated);
  };

  const handleAddToCart = () => {
    if (onAddToCart) {
      onAddToCart(product, quantity);
    }
  };

  const imageUrl = product.main_image_url || product.images?.[0] || '/placeholder-product.jpg';
  const pricingTiers = product.pricing_tiers || [];
  const hasDiscount = pricingTiers.length > 0;
  const bestPrice = hasDiscount
    ? Math.min(...pricingTiers.map(t => t.price_per_unit))
    : product.base_price;

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition duration-300 flex flex-col h-full">
      {/* Imagen del producto */}
      <Link href={`/empresas/catalogo/${product.id}`} className="relative aspect-square bg-gray-100">
        {imageUrl && imageUrl !== '/placeholder-product.jpg' ? (
          <Image
            src={imageUrl}
            alt={product.name}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <svg className="w-24 h-24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}

        {/* Badge de destacado */}
        {product.is_featured && (
          <div className="absolute top-3 left-3 bg-green-600 text-white text-xs font-bold px-3 py-1 rounded-full">
            Destacado
          </div>
        )}

        {/* Badge de mejor precio */}
        {hasDiscount && bestPrice < product.base_price && (
          <div className="absolute top-3 right-3 bg-green-600 text-white text-xs font-bold px-3 py-1 rounded-full">
            Desde {formatPrice(bestPrice)}/{product.unit}
          </div>
        )}
      </Link>

      {/* Información del producto */}
      <div className="p-5 flex flex-col flex-grow">
        {/* Nombre */}
        <Link href={`/empresas/catalogo/${product.id}`}>
          <h3 className="text-lg font-bold text-gray-800 mb-2 hover:text-green-600 transition line-clamp-2">
            {product.name}
          </h3>
        </Link>

        {/* SKU */}
        <p className="text-xs text-gray-500 mb-2">SKU: {product.sku}</p>

        {/* Precios por volumen compacto */}
        <div className="mb-3">
          <VolumePricingCompact product={product} />
        </div>

        {/* Stock */}
        <div className="flex items-center gap-2 mb-3">
          <span className={`text-sm ${product.stock_quantity > 0 ? 'text-green-600' : 'text-red-600'}`}>
            {product.stock_quantity > 0 ? `${product.stock_quantity} disponibles` : 'Agotado'}
          </span>
          <span className="text-gray-400">•</span>
          <span className="text-sm text-gray-600">
            Min: {product.minimum_order_quantity} {product.unit}
          </span>
        </div>

        {/* Selector de cantidad */}
        {product.stock_quantity > 0 && (
          <div className="mt-auto">
            <div className="flex items-center gap-2 mb-3">
              <label className="text-sm text-gray-600">Cantidad:</label>
              <div className="flex items-center border border-gray-300 rounded-lg">
                <button
                  type="button"
                  onClick={() => handleQuantityChange(quantity - 1)}
                  disabled={quantity <= product.minimum_order_quantity}
                  className="px-3 py-1 text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  -
                </button>
                <input
                  type="number"
                  min={product.minimum_order_quantity}
                  max={product.stock_quantity}
                  value={quantity}
                  onChange={(e) => handleQuantityChange(parseInt(e.target.value) || 0)}
                  className="w-16 text-center border-0 focus:ring-0"
                />
                <button
                  type="button"
                  onClick={() => handleQuantityChange(quantity + 1)}
                  disabled={quantity >= product.stock_quantity}
                  className="px-3 py-1 text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  +
                </button>
              </div>
              <span className="text-sm text-gray-600">{product.unit}</span>
            </div>

            {/* Precio calculado */}
            <div className="mb-3 text-center">
              <span className="text-2xl font-bold text-green-600">
                {formatPrice(product.base_price * quantity)}
              </span>
              <span className="text-gray-500 text-sm ml-2">
                ({formatPrice(product.base_price)}/{product.unit})
              </span>
            </div>

            {/* Botón agregar al carrito */}
            <button
              type="button"
              onClick={handleAddToCart}
              disabled={product.stock_quantity === 0}
              className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white font-bold py-3 px-4 rounded-lg transition duration-200"
            >
              Agregar al Carrito
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
