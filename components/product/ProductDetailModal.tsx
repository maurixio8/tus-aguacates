'use client';

import { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Heart, ShoppingCart, Share2 } from 'lucide-react';
import type { Product } from '@/lib/productStorage';
import { formatPrice, calculateDiscount } from '@/lib/utils';
import { useCartStore } from '@/lib/cart-store';
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
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [showToast, setShowToast] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);

  const hasDiscount = product.discount_price && product.discount_price < product.price;
  const discount = hasDiscount ? calculateDiscount(product.price, product.discount_price!) : 0;

  // Cargar variantes
  useEffect(() => {
    if (product.variants && product.variants.length > 0) {
      const variantsWithPrice = product.variants.map((v: any) => ({
        ...v,
        price: (product.discount_price || product.base_price || product.price) + (v.price_adjustment || 0)
      }));
      setVariants(variantsWithPrice);
      setSelectedVariant(variantsWithPrice[0]);
    }
  }, [product, isOpen]);

  if (!isOpen) return null;

  const displayPrice = selectedVariant ? selectedVariant.price : (product.discount_price || product.price);

  const handleAddToCart = () => {
    const itemToAdd = {
      ...product,
      category_id: product.category_id || product.category || 'general',
      quantity: quantity,
      variant: selectedVariant ?? undefined
    };

    addItem(itemToAdd);
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
      <div
        className="fixed inset-0 bg-black/50 z-40 transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Container - Responsive */}
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4 sm:p-6">
          {/* Modal Content */}
          <div
            className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-xl bg-white shadow-2xl animation-in fade-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="sticky top-4 right-4 z-10 absolute top-4 right-4 bg-white/90 hover:bg-white p-2 rounded-full shadow-lg transition-all"
              aria-label="Cerrar"
            >
              <X className="w-6 h-6 text-gray-600" />
            </button>

            {/* Content Grid - Responsive */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 p-6 md:p-8">

              {/* Imagen - Lado Izquierdo */}
              <div className="flex flex-col gap-4">
                {/* Imagen Principal */}
                <div className="relative aspect-square rounded-lg overflow-hidden bg-gray-100">
                  <ProductImagePlaceholder
                    productName={product.name}
                    price={displayPrice}
                    category={product.category || 'productos'}
                    imageUrl={product.main_image_url}
                    showPrice={false}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Acciones en imagen (Mobile-friendly) */}
                <div className="flex gap-3">
                  <button
                    onClick={() => setIsWishlisted(!isWishlisted)}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg border-2 transition-all ${
                      isWishlisted
                        ? 'bg-red-50 border-red-300 text-red-600'
                        : 'border-gray-300 text-gray-700 hover:border-red-300'
                    }`}
                  >
                    <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-current' : ''}`} />
                    <span className="hidden sm:inline text-sm font-medium">
                      {isWishlisted ? 'Guardado' : 'Guardar'}
                    </span>
                  </button>

                  <button
                    onClick={handleShare}
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-lg border-2 border-gray-300 text-gray-700 hover:border-blue-300 transition-all"
                  >
                    <Share2 className="w-5 h-5" />
                    <span className="hidden sm:inline text-sm font-medium">Compartir</span>
                  </button>
                </div>
              </div>

              {/* Información - Lado Derecho */}
              <div className="flex flex-col gap-6">

                {/* Categoría */}
                <div>
                  <p className="text-sm text-gray-500 uppercase tracking-wide">
                    {product.category || 'Producto'}
                  </p>
                </div>

                {/* Título y Descripción */}
                <div>
                  <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                    {product.name}
                  </h2>
                  <p className="text-gray-600 leading-relaxed text-sm md:text-base">
                    {product.description || 'Producto de alta calidad de Tus Aguacates'}
                  </p>
                </div>

                {/* Rating */}
                {(product.review_count ?? 0) > 0 && (
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <span className="text-yellow-500 text-lg">★</span>
                      <span className="font-semibold text-gray-900">
                        {(product.rating ?? 0).toFixed(1)}
                      </span>
                      <span className="text-gray-500 text-sm">
                        ({product.review_count ?? 0} opiniones)
                      </span>
                    </div>
                  </div>
                )}

                {/* Precio */}
                <div className="py-4 border-t border-b border-gray-200">
                  <p className="text-xs text-gray-500 mb-2">Precio</p>
                  <div className="flex items-baseline gap-3">
                    <span className="text-3xl md:text-4xl font-bold text-verde-bosque font-mono">
                      {formatPrice(displayPrice)}
                    </span>
                    {hasDiscount && (
                      <>
                        <span className="text-lg text-gray-500 line-through">
                          {formatPrice(product.price)}
                        </span>
                        <span className="bg-naranja-frutal text-white px-3 py-1 rounded-full text-sm font-bold">
                          -{discount}%
                        </span>
                      </>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mt-2">Por {product.unit || 'unidad'}</p>
                </div>

                {/* Selector de Variantes */}
                {variants.length > 0 && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-3">
                      Presentación
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {variants.map((variant) => (
                        <button
                          key={variant.id}
                          onClick={() => setSelectedVariant(variant)}
                          className={`px-3 py-2 rounded-lg border-2 font-medium transition-all text-sm ${
                            selectedVariant?.id === variant.id
                              ? 'bg-verde-bosque text-white border-verde-bosque'
                              : 'border-gray-300 text-gray-700 hover:border-verde-bosque'
                          }`}
                        >
                          <div className="font-semibold">{variant.variant_value}</div>
                          <div className="text-xs opacity-80">{formatPrice(variant.price)}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Stock Info */}
                <div className="text-sm">
                  {(product.stock || 0) > 0 ? (
                    <span className="text-green-600 font-medium">
                      ✓ Disponible ({product.stock || 'varios'} unidades)
                    </span>
                  ) : (
                    <span className="text-red-600 font-medium">✗ Agotado</span>
                  )}
                </div>

                {/* Selector de Cantidad */}
                {(product.stock || 0) > 0 && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-3">
                      Cantidad
                    </label>
                    <div className="flex items-center border border-gray-300 rounded-lg w-fit">
                      <button
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="px-4 py-2 text-gray-600 hover:bg-gray-100 transition"
                      >
                        −
                      </button>
                      <input
                        type="number"
                        min="1"
                        value={quantity}
                        onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-16 text-center font-semibold border-0 focus:outline-none"
                      />
                      <button
                        onClick={() => setQuantity(quantity + 1)}
                        className="px-4 py-2 text-gray-600 hover:bg-gray-100 transition"
                      >
                        +
                      </button>
                    </div>
                  </div>
                )}

                {/* Botón Agregar al Carrito */}
                <button
                  onClick={handleAddToCart}
                  disabled={(product.stock || 0) === 0}
                  className="w-full bg-gradient-to-r from-yellow-400 to-yellow-600 hover:from-yellow-500 hover:to-yellow-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-verde-bosque font-bold py-4 rounded-lg transition-all transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center justify-center gap-2 border-2 border-verde-aguacate disabled:border-gray-400 text-lg"
                >
                  <ShoppingCart className="w-5 h-5" />
                  {(product.stock || 0) > 0 ? 'Agregar al Carrito' : 'Agotado'}
                </button>

                {/* Información Adicional */}
                <div className="bg-gray-50 p-4 rounded-lg space-y-2 text-sm text-gray-600">
                  <p>✓ Envío rápido a todo el país</p>
                  <p>✓ Productos frescos garantizados</p>
                  <p>✓ Devolución sin preguntas</p>
                </div>
              </div>
            </div>
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
    </>
  );
}
