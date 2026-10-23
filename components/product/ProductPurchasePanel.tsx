'use client';

import { useEffect, useMemo, useState } from 'react';
import { ShoppingCart } from 'lucide-react';
import type { UnifiedProduct } from '@/lib/types';
import { dedupeVariants } from '@/lib/product-variants';
import { formatPrice } from '@/lib/utils';
import { useCartStore } from '@/lib/cart-store';

interface ProductPurchasePanelProps {
  product: UnifiedProduct;
}

export function ProductPurchasePanel({ product }: ProductPurchasePanelProps) {
  const { addItem } = useCartStore();
  const variants = useMemo(() => dedupeVariants(product.variants || []), [product.variants]);
  const [selectedVariant, setSelectedVariant] = useState<any>(variants[0] || null);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    setSelectedVariant(variants[0] || null);
  }, [variants]);

  const price = selectedVariant?.price || product.discount_price || product.price;
  const unavailable = Number(product.stock ?? 1) <= 0;

  const handleAdd = () => {
    if (unavailable) return;
    addItem({ ...product, variant: selectedVariant || undefined } as any, 1);
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1800);
  };

  return (
    <div className="mt-5">
      {variants.length > 0 && (
        <div className="mb-4">
          <p className="mb-2 text-sm font-semibold text-gray-700">Elige la presentación</p>
          <div className="flex flex-wrap gap-2">
            {variants.map((variant: any) => (
              <button
                key={variant.id}
                type="button"
                onClick={() => setSelectedVariant(variant)}
                className={`rounded-lg border-2 px-3 py-2 text-sm font-semibold transition ${selectedVariant?.id === variant.id ? 'border-verde-bosque bg-verde-bosque/10 text-verde-bosque' : 'border-gray-200 bg-white text-gray-700 hover:border-verde-bosque/50'}`}
              >
                {variant.variant_value || variant.variant_name}
              </button>
            ))}
          </div>
        </div>
      )}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <span className="text-sm text-gray-600">{formatPrice(price)} · {product.unit || 'unidad'}</span>
        <button
          type="button"
          onClick={handleAdd}
          disabled={unavailable}
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-yellow-400 to-yellow-600 px-6 py-3 font-bold text-verde-bosque-700 shadow-md transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:bg-gray-300 disabled:from-gray-300 disabled:to-gray-400"
        >
          <ShoppingCart className="h-5 w-5" />
          {added ? '¡Agregado al carrito!' : unavailable ? 'No disponible' : 'Agregar al carrito'}
        </button>
      </div>
    </div>
  );
}
