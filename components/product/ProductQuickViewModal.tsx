'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { X, ShoppingCart, CheckCircle } from 'lucide-react';
import type { Product, ProductVariant } from '@/lib/productStorage';
import { useCartStore } from '@/lib/cart-store';
import { formatPrice } from '@/lib/utils';
import { supabase } from '@/lib/supabase';

interface ProductQuickViewModalProps {
  product: Product;
  isOpen: boolean;
  onClose: () => void;
}

export function ProductQuickViewModal({ product, isOpen, onClose }: ProductQuickViewModalProps) {
  const { addItem } = useCartStore();
  const [showToast, setShowToast] = useState(false);
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);

  // Cargar variantes del producto
  useEffect(() => {
    async function loadVariants() {
      try {
        console.log('Loading variants for product:', product.id);
        const { data, error } = await supabase
          .from('product_variants')
          .select('*')
          .eq('product_id', product.id)
          .eq('is_active', true)
          .order('price_adjustment', { ascending: true });

        if (error) {
          console.error('Error loading variants:', error);
          setVariants([]);
        } else {
          console.log('Variants loaded:', data?.length || 0, 'variants');
          setVariants(data || []);
          // Auto-seleccionar primera variante si hay disponibles
          if (data && data.length > 0) {
            setSelectedVariant(data[0]);
          }
        }
      } catch (error) {
        console.error('Error in variant loading:', error);
        setVariants([]);
      }
    }

    if (isOpen && product.id) {
      loadVariants();
    }
  }, [product.id, isOpen]);

  // Calcular precio final
  const basePrice = product.discount_price || product.price;
  const variantPrice = selectedVariant?.price_adjustment || 0;
  const finalPrice = basePrice + variantPrice;

  const handleAddToCart = () => {
    const itemToAdd = {
      ...product,
      quantity: 1,
      selectedVariant,
      finalPrice,
    };

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
      <div className="flex min-h-full items-center justify-center p-2 md:p-4">
        <div
          className="relative w-full max-w-md md:max-w-2xl bg-white rounded-2xl shadow-2xl max-h-[90vh] md:max-h-[85vh] overflow-y-auto"
          onClick={(e) => {
            console.log('ProductQuickViewModal: Modal content clicked, preventing propagation');
            e.stopPropagation();
          }}
        >
          {/* Header */}
          <div className="sticky top-0 bg-gradient-to-r from-blue-50 to-cyan-50 border-b-2 border-blue-200 p-4 flex justify-between items-start">
            <h2 className="text-xl font-bold text-blue-900">
              ✨ Vista Rápida
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-red-500 bg-red-500 text-white rounded-full transition-all transform hover:scale-110 shadow-lg font-bold"
              title="Cerrar"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="p-4 md:p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
              {/* Imagen */}
              <div className="aspect-square md:aspect-square bg-gray-100 rounded-xl overflow-hidden max-h-64 md:max-h-none">
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
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                  {product.name}
                </h1>

                {/* Descripción */}
                {product.description && (
                  <p className="text-gray-700 line-clamp-3 text-lg">
                    {product.description}
                  </p>
                )}

                {/* Selector de presentaciones */}
                {variants.length > 0 && (
                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-blue-900">
                      📦 Presentación:
                    </label>
                    <select
                      value={selectedVariant?.id || ''}
                      onChange={(e) => {
                        const variant = variants.find(v => v.id === e.target.value);
                        setSelectedVariant(variant || null);
                      }}
                      className="w-full border-2 border-blue-400 px-3 py-2 rounded-lg focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-300 text-blue-900 font-medium"
                    >
                      {variants.map((variant) => (
                        <option key={variant.id} value={variant.id}>
                          {variant.variant_name}: {variant.variant_value}
                          {variant.price_adjustment !== 0 &&
                            ` (${variant.price_adjustment > 0 ? '+' : ''}$${variant.price_adjustment.toFixed(2)})`
                          }
                        </option>
                      ))}
                    </select>
                  </div>
                )}


                {/* Total final */}
                <div className="flex justify-between items-center py-3 px-3 bg-gradient-to-r from-blue-50 to-cyan-50 border-2 border-blue-200 rounded-lg">
                  <span className="text-lg font-bold text-blue-900">💰 Total:</span>
                  <span className="text-3xl font-bold text-cyan-600">
                    {formatPrice(finalPrice)}
                  </span>
                </div>

                {/* Botón agregar al carrito - mejorado */}
                <button
                  onClick={handleAddToCart}
                  disabled={(product.stock || 0) === 0}
                  className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-bold py-4 px-4 rounded-lg transition-all transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center justify-center gap-2 border-2 border-emerald-700 disabled:border-gray-500 text-lg"
                >
                  <ShoppingCart className="w-5 h-5" />
                  {(product.stock || 0) > 0 ? '🛒 Agregar al Carrito' : '❌ Agotado'}
                </button>

                {/* Garantía y Confianza */}
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4 border-2 border-green-300">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
                    <div>
                      <p className="font-bold text-green-900">✅ Productos Frescos Garantizados</p>
                      <p className="text-sm text-green-700">Calidad premium verificada en cada envío</p>
                    </div>
                  </div>
                </div>

                {/* Badges adicionales */}
                <div className="flex gap-2 flex-wrap">
                  {product.is_organic === true && (
                    <span className="bg-green-100 text-green-800 text-sm font-bold px-3 py-2 rounded-full border border-green-300">
                      🌿 Orgánico
                    </span>
                  )}
                  {product.is_featured === true && (
                    <span className="bg-yellow-100 text-yellow-800 text-sm font-bold px-3 py-2 rounded-full border border-yellow-300">
                      ⭐ Destacado
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
          {/* Extra bottom padding on mobile to avoid bottom nav overlap */}
          <div className="md:hidden h-24"></div>
        </div>
      </div>

      {/* Toast de éxito */}
      {showToast && (
        <div className="fixed top-4 right-4 bg-green-600 text-white px-6 py-4 rounded-lg shadow-lg z-50 flex items-center gap-3 animate-pulse">
          <span className="text-xl">🛒</span>
          <div>
            <p className="font-bold">¡Agregado al carrito!</p>
            <p className="text-sm">1 × {product.name}</p>
          </div>
        </div>
      )}
    </div>
  );
}