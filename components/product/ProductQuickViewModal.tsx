'use client';

import { useState } from 'react';
import Image from 'next/image';
import { X, ShoppingCart } from 'lucide-react';
import type { Product, ProductVariant } from '@/lib/supabase';
import { useCartStore } from '@/lib/cart-store';
import { formatPrice } from '@/lib/utils';
import { ProductVariantSelector } from './ProductVariantSelector';

interface ProductQuickViewModalProps {
  product: Product;
  isOpen: boolean;
  onClose: () => void;
}

export function ProductQuickViewModal({ product, isOpen, onClose }: ProductQuickViewModalProps) {
  const { addItem } = useCartStore();
  const [quantity, setQuantity] = useState(1);
  const [showToast, setShowToast] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);

  // Calcular precio basado en la variante seleccionada
  const basePrice = product.discount_price || product.price;
  const priceModifier = selectedVariant?.price_modifier || 0;
  const finalPrice = basePrice + priceModifier;

  const hasDiscount = product.discount_price && product.discount_price < product.price;

  // Logs para debugging
  console.log('Product from DB:', product);
  console.log('Product variants:', product.variants);
  console.log('Selected variant:', selectedVariant);
  console.log('Final price:', finalPrice);

  const handleAddToCart = () => {
    const itemToAdd = {
      ...product,
      quantity,
      selectedVariant,
      finalPrice,
      variantName: selectedVariant ? `${selectedVariant.variant_name}: ${selectedVariant.variant_value}` : null,
    };

    console.log('Adding to cart:', itemToAdd); // Debug log

    addItem(itemToAdd);
    setShowToast(true);

    setTimeout(() => {
      setShowToast(false);
      onClose(); // Cerrar modal después de agregar
    }, 1500);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div
          className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto"
          onClick={(e) => {
            console.log('ProductQuickViewModal: Modal content clicked, preventing propagation');
            e.stopPropagation();
          }}
        >
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex justify-between items-start">
            <h2 className="text-xl font-bold text-gray-900">
              Vista Rápida
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6">
            <div className="grid md:grid-cols-2 gap-8">
              {/* Imagen */}
              <div className="aspect-square bg-gray-100 rounded-xl overflow-hidden">
                {product.main_image_url ? (
                  <Image
                    src={product.main_image_url}
                    alt={product.name}
                    width={400}
                    height={400}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <span className="text-8xl">🥑</span>
                  </div>
                )}
              </div>

              {/* Información */}
              <div className="space-y-4">
                {/* Nombre */}
                <h1 className="text-2xl font-bold text-gray-900">
                  {product.name}
                </h1>

                {/* Descripción */}
                {product.description && (
                  <p className="text-gray-600">
                    {product.description}
                  </p>
                )}

                {/* Selector de Variantes */}
                {product.variants && product.variants.length > 0 && (
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Presentación:
                    </label>
                    <ProductVariantSelector
                      variants={product.variants}
                      onVariantChange={(variant) => setSelectedVariant(variant)}
                    />
                  </div>
                )}

                {/* Precio */}
                <div className="flex items-center gap-3">
                  <span className="text-3xl font-bold text-green-600">
                    {formatPrice(finalPrice)}
                  </span>

                  {hasDiscount && (
                    <span className="text-lg text-gray-400 line-through">
                      {formatPrice(product.price! + priceModifier)}
                    </span>
                  )}
                </div>

                {/* Badge de descuento */}
                {hasDiscount && (
                  <div className="inline-block bg-red-100 text-red-800 text-sm font-bold px-3 py-1 rounded-full">
                    AHORRA {formatPrice((product.price! + priceModifier) - finalPrice)}
                  </div>
                )}

                {/* Badge de variante seleccionada */}
                {selectedVariant && (
                  <div className="inline-block bg-blue-100 text-blue-800 text-sm font-bold px-3 py-1 rounded-full">
                    {selectedVariant.variant_name}: {selectedVariant.variant_value}
                  </div>
                )}

                {/* Metadatos */}
                <div className="grid grid-cols-2 gap-4 py-4 border-t border-b border-gray-200">
                  <div>
                    <span className="text-sm text-gray-500">Unidad</span>
                    <p className="font-semibold">{product.unit || 'unidad'}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Stock</span>
                    <p className="font-semibold">
                      {product.stock > 0 ? `${product.stock} disponibles` : 'Agotado'}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Peso</span>
                    <p className="font-semibold">
                      {product.weight ? `${product.weight}g` : (product.unit || 'unidad')}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Mínimo</span>
                    <p className="font-semibold">{product.min_quantity || 1}</p>
                  </div>
                </div>

                {/* Selector de cantidad */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Cantidad
                  </label>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="w-10 h-10 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-50"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min="1"
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-20 text-center border border-gray-300 rounded-lg px-3 py-2"
                    />
                    <button
                      onClick={() => setQuantity(quantity + 1)}
                      className="w-10 h-10 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-50"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Total calculado */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Total:</span>
                    <span className="text-2xl font-bold text-gray-900">
                      {formatPrice(finalPrice * quantity)}
                    </span>
                  </div>
                </div>

                {/* Botón agregar al carrito */}
                <button
                  onClick={handleAddToCart}
                  disabled={product.stock === 0}
                  className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold py-4 px-6 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
                >
                  <ShoppingCart className="w-5 h-5" />
                  {product.stock > 0 ? 'Agregar al Carrito' : 'Agotado'}
                </button>

                {/* Badges */}
                <div className="flex gap-2">
                  {product.is_organic === true && (
                    <span className="bg-green-100 text-green-800 text-sm font-medium px-3 py-1 rounded-full">
                      🌿 Orgánico
                    </span>
                  )}
                  {product.is_featured === true && (
                    <span className="bg-yellow-100 text-yellow-800 text-sm font-medium px-3 py-1 rounded-full">
                      ⭐ Destacado
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Toast de éxito */}
      {showToast && (
        <div className="fixed top-4 right-4 bg-green-600 text-white px-6 py-4 rounded-lg shadow-lg z-50 flex items-center gap-3 animate-pulse">
          <span className="text-xl">🛒</span>
          <div>
            <p className="font-bold">¡Agregado al carrito!</p>
            <p className="text-sm">{quantity} × {product.name}</p>
          </div>
        </div>
      )}
    </div>
  );
}