'use client';

import { useState, useEffect } from 'react';
import { X, ShoppingCart, Plus, Minus } from 'lucide-react';
import Image from 'next/image';
import type { Product } from '@/lib/supabase';
import { formatPrice, calculateDiscount } from '@/lib/utils';
import { useCartStore } from '@/lib/cart-store';
import { supabase } from '@/lib/supabase';
import { ProductImagePlaceholder } from '@/components/ui/ProductImagePlaceholder';

interface ProductVariant {
  id: string;
  variant_name: string;
  variant_value: string;
  price_adjustment: number;
  price: number;
  stock_quantity: number;
}

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product;
}

export default function ProductModal({ isOpen, onClose, product }: ProductModalProps) {
  const { addItem } = useCartStore();
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  const hasDiscount = product.discount_price && product.discount_price < product.price;

  useEffect(() => {
    if (isOpen && product) {
      loadVariants();
      setQuantity(1);
    }
  }, [isOpen, product]);

  const loadVariants = async () => {
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
      } else {
        setVariants([]);
        setSelectedVariant(null);
      }
    } catch (error) {
      console.error('Error loading variants:', error);
    }
  };

  const handleAddToCart = async () => {
    if (!selectedVariant && variants.length > 0) return;

    setIsLoading(true);

    try {
      const itemToAdd = {
        ...product,
        quantity: quantity,
        price: selectedVariant ? selectedVariant.price : (product.discount_price || product.price),
        variant: selectedVariant || undefined
      };

      addItem(itemToAdd);
      onClose();
    } catch (error) {
      console.error('Error adding to cart:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVariantSelect = (variant: ProductVariant) => {
    setSelectedVariant(variant);
    setQuantity(1);
  };

  const increaseQuantity = () => {
    const maxQuantity = selectedVariant?.stock_quantity || 999;
    if (quantity < maxQuantity) {
      setQuantity(quantity + 1);
    }
  };

  const decreaseQuantity = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };

  const getCurrentPrice = () => {
    if (selectedVariant) return selectedVariant.price;
    return product.discount_price || product.price;
  };

  const getStockInfo = () => {
    if (selectedVariant) {
      return {
        stock: selectedVariant.stock_quantity,
        inStock: selectedVariant.stock_quantity > 0
      };
    }
    return { stock: 999, inStock: true }; // Default for products without variants
  };

  const { stock, inStock } = getStockInfo();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">{product.name}</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 p-2"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Product Images */}
            <div>
              <div className="relative aspect-square bg-gray-100 rounded-2xl overflow-hidden">
                {product.main_image_url ? (
                  <Image
                    src={product.main_image_url}
                    alt={product.name}
                    fill
                    className="object-cover"
                    priority
                  />
                ) : (
                  <ProductImagePlaceholder
                    productName={product.name || 'Producto'}
                    price={getCurrentPrice()}
                    category="aguacates"
                  />
                )}
              </div>

              {/* Image Gallery */}
              {product.gallery_images && product.gallery_images.length > 0 && (
                <div className="grid grid-cols-4 gap-2 mt-4">
                  {[product.main_image_url, ...product.gallery_images].map((img, index) => (
                    <div key={index} className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                      {img && (
                        <Image
                          src={img}
                          alt={`${product.name} ${index + 1}`}
                          fill
                          className="object-cover hover:scale-105 transition-transform cursor-pointer"
                        />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Product Info */}
            <div className="space-y-6">
              {/* Description */}
              <div>
                <h3 className="text-lg font-semibold mb-2">Descripción</h3>
                <p className="text-gray-600 leading-relaxed">
                  {product.description || 'Producto fresco y de alta calidad seleccionado cuidadosamente para ti.'}
                </p>
              </div>

              {/* Variants */}
              {variants.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">
                    {variants[0].variant_name || 'Presentación'}
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    {variants.map((variant) => (
                      <button
                        key={variant.id}
                        onClick={() => handleVariantSelect(variant)}
                        className={`p-3 border-2 rounded-lg transition-all text-left ${
                          selectedVariant?.id === variant.id
                            ? 'border-verde-aguacate bg-verde-aguacate-10'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="font-medium text-gray-900">
                          {variant.variant_value}
                        </div>
                        <div className="text-sm text-gray-600">
                          {formatPrice(variant.price)}
                        </div>
                        <div className="text-xs text-gray-500">
                          Stock: {variant.stock_quantity}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Price */}
              <div>
                <div className="flex items-baseline gap-3 mb-2">
                  <span className="text-3xl font-bold text-verde-bosque">
                    {formatPrice(getCurrentPrice())}
                  </span>
                  {hasDiscount && (
                    <>
                      <span className="text-xl text-gray-400 line-through">
                        {formatPrice(product.price)}
                      </span>
                      <span className="bg-red-500 text-white px-2 py-1 rounded-full text-sm font-medium">
                        {discount}% OFF
                      </span>
                    </>
                  )}
                </div>
                <p className="text-sm text-gray-600">
                  {inStock ? `✓ ${stock} disponibles` : '⚠️ Agotado'}
                </p>
              </div>

              {/* Quantity */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Cantidad</h3>
                <div className="flex items-center gap-4">
                  <div className="flex items-center border border-gray-300 rounded-lg">
                    <button
                      onClick={decreaseQuantity}
                      disabled={quantity <= 1}
                      className="p-2 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="px-4 py-2 font-medium w-12 text-center">
                      {quantity}
                    </span>
                    <button
                      onClick={increaseQuantity}
                      disabled={quantity >= stock}
                      className="p-2 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  <span className="text-sm text-gray-600">
                    Total: {formatPrice(getCurrentPrice() * quantity)}
                  </span>
                </div>
              </div>

              {/* Add to Cart Button */}
              <button
                onClick={handleAddToCart}
                disabled={!inStock || isLoading || (variants.length > 0 && !selectedVariant)}
                className={`w-full py-4 rounded-xl font-bold text-white transition-all transform hover:scale-105 flex items-center justify-center gap-3 ${
                  !inStock || isLoading || (variants.length > 0 && !selectedVariant)
                    ? 'bg-gray-300 cursor-not-allowed'
                    : 'bg-gradient-to-r from-yellow-400 to-yellow-600 hover:from-yellow-500 hover:to-yellow-700 shadow-lg hover:shadow-xl border-2 border-verde-aguacate'
                }`}
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Agregando...
                  </>
                ) : (
                  <>
                    <ShoppingCart className="w-5 h-5" />
                    {!inStock ? 'Agotado' : 'Agregar al Carrito'}
                  </>
                )}
              </button>

              {/* Additional Info */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Categoría:</span>
                    <p className="font-medium">{product.category}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Origen:</span>
                    <p className="font-medium">Colombia</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}