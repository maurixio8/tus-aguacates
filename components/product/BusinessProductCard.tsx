'use client';

import { useState } from 'react';
import { ShoppingCart, Package, Clock, Leaf } from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import { useBusinessCartStore } from '@/lib/business-cart-store';
import type { BusinessProduct, BusinessProductVariant } from '@/lib/business-products';
import { ProductImagePlaceholder } from '@/components/ui/ProductImagePlaceholder';

interface BusinessProductCardProps {
  product: BusinessProduct;
}

export function BusinessProductCard({ product }: BusinessProductCardProps) {
  const { addItem, openCart } = useBusinessCartStore();
  const [selectedVariant, setSelectedVariant] = useState<BusinessProductVariant>(product.variants[0]);
  const [showToast, setShowToast] = useState(false);
  const [quantity, setQuantity] = useState(selectedVariant.minKg);

  // Determinar si es aguacate para mostrar info de maduración
  const isAguacate = product.categorySlug === 'aguacates';

  // Color del badge según estado de maduración
  const getRipenessColor = (ripeness?: string) => {
    switch (ripeness) {
      case 'verde': return 'bg-green-500';
      case 'pinton': return 'bg-yellow-500';
      case 'maduro': return 'bg-orange-500';
      default: return 'bg-gray-500';
    }
  };

  // Calcular precio total
  const totalPrice = selectedVariant.pricePerKg * quantity;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const productToAdd = {
      id: product.id,
      name: product.name,
      description: product.description,
      price: selectedVariant.pricePerKg,
      category: product.category,
      unit: product.unit,
      variant: {
        id: selectedVariant.id,
        variant_name: selectedVariant.name,
        variant_value: selectedVariant.name,
        price: selectedVariant.pricePerKg,
        min_quantity: selectedVariant.minKg,
        max_quantity: selectedVariant.maxKg,
        price_tier: selectedVariant.tier,
      }
    };

    addItem(productToAdd as any, quantity, product.unit);

    // Mostrar toast y abrir carrito
    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
      openCart();
    }, 1500);
  };

  const handleVariantChange = (variant: BusinessProductVariant) => {
    setSelectedVariant(variant);
    // Ajustar cantidad al mínimo de la nueva variante
    setQuantity(variant.minKg);
  };

  return (
    <>
      <div className="bg-white rounded-2xl overflow-hidden shadow-soft hover:shadow-medium transition-all duration-200 hover:-translate-y-1 border border-gray-100">
        {/* Imagen */}
        <div className="relative aspect-square overflow-hidden">
          <ProductImagePlaceholder
            productName={product.name}
            price={selectedVariant.pricePerKg}
            category={product.categorySlug}
            imageUrl={product.image}
            showPrice={false}
            className="w-full h-full"
          />

          {/* Badge de maduración para aguacates */}
          {isAguacate && product.ripeness && (
            <div className={`absolute top-3 left-3 ${getRipenessColor(product.ripeness)} text-white px-2 py-1 text-xs font-bold rounded-full flex items-center gap-1`}>
              <Leaf className="w-3 h-3" />
              {product.ripeness.charAt(0).toUpperCase() + product.ripeness.slice(1)}
            </div>
          )}

          {/* Badge B2B */}
          <div className="absolute top-3 right-3 bg-verde-bosque text-white px-2 py-1 text-xs font-bold rounded-full flex items-center gap-1">
            <Package className="w-3 h-3" />
            B2B
          </div>
        </div>

        {/* Contenido */}
        <div className="p-4">
          {/* Nombre */}
          <h3 className="font-semibold text-base text-gray-900 mb-1 line-clamp-2">
            {product.name}
          </h3>

          {/* Info de maduración para aguacates */}
          {isAguacate && product.ripenessDescription && (
            <div className="flex items-center gap-1 text-xs text-gray-600 mb-2">
              <Clock className="w-3 h-3" />
              {product.ripenessDescription}
            </div>
          )}

          {/* Descripción corta */}
          <p className="text-xs text-gray-500 mb-3 line-clamp-2">
            {product.description}
          </p>

          {/* Selector de rango de volumen */}
          <div className="mb-3">
            <label className="text-xs font-medium text-gray-700 mb-1 block">
              Rango de volumen:
            </label>
            <div className="grid grid-cols-1 gap-1.5">
              {product.variants.map((variant) => (
                <button
                  key={variant.id}
                  onClick={() => handleVariantChange(variant)}
                  className={`
                    flex items-center justify-between px-3 py-2 rounded-lg border-2 transition-all text-sm
                    ${selectedVariant.id === variant.id
                      ? 'border-verde-bosque bg-verde-bosque/10'
                      : 'border-gray-200 bg-white hover:border-verde-bosque/50'
                    }
                  `}
                >
                  <span className={`font-medium ${selectedVariant.id === variant.id ? 'text-verde-bosque' : 'text-gray-700'}`}>
                    {variant.name}
                  </span>
                  <span className={`font-mono text-xs ${selectedVariant.id === variant.id ? 'text-verde-bosque' : 'text-gray-500'}`}>
                    {formatPrice(variant.pricePerKg)}/{product.unit}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Selector de cantidad */}
          <div className="mb-3">
            <label className="text-xs font-medium text-gray-700 mb-1 block">
              Cantidad ({product.unit}):
            </label>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setQuantity(Math.max(selectedVariant.minKg, quantity - 1))}
                className="w-8 h-8 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-100"
                disabled={quantity <= selectedVariant.minKg}
              >
                -
              </button>
              <input
                type="number"
                value={quantity}
                onChange={(e) => {
                  const val = parseInt(e.target.value) || selectedVariant.minKg;
                  setQuantity(Math.min(selectedVariant.maxKg, Math.max(selectedVariant.minKg, val)));
                }}
                min={selectedVariant.minKg}
                max={selectedVariant.maxKg}
                className="w-16 h-8 text-center border border-gray-300 rounded-lg text-sm font-mono"
              />
              <button
                onClick={() => setQuantity(Math.min(selectedVariant.maxKg, quantity + 1))}
                className="w-8 h-8 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-100"
                disabled={quantity >= selectedVariant.maxKg}
              >
                +
              </button>
              <span className="text-xs text-gray-500">
                {product.unit}
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Mín: {selectedVariant.minKg} - Máx: {selectedVariant.maxKg} {product.unit}
            </p>
          </div>

          {/* Precio total */}
          <div className="bg-gray-50 rounded-lg p-3 mb-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Total estimado:</span>
              <span className="text-xl font-bold text-verde-bosque font-mono">
                {formatPrice(totalPrice)}
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              {quantity} {product.unit} × {formatPrice(selectedVariant.pricePerKg)}/{product.unit}
            </p>
          </div>

          {/* Botón Agregar */}
          <button
            onClick={handleAddToCart}
            className="w-full bg-gradient-to-r from-verde-bosque to-verde-aguacate hover:from-verde-bosque/90 hover:to-verde-aguacate/90 text-white font-bold py-3 px-4 rounded-lg transition-all transform hover:scale-[1.02] shadow-md hover:shadow-lg flex items-center justify-center gap-2"
          >
            <ShoppingCart className="w-5 h-5" />
            Agregar al Pedido
          </button>
        </div>
      </div>

      {/* Toast Notification */}
      {showToast && (
        <div className="fixed top-4 right-4 bg-verde-bosque text-white px-4 py-3 rounded-lg shadow-lg z-50 flex items-center gap-2 animate-pulse">
          <Package className="w-5 h-5" />
          <span className="font-medium">¡Agregado al pedido B2B!</span>
        </div>
      )}
    </>
  );
}
