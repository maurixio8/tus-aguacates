'use client';

import { useState } from 'react';
import type { ProductVariant } from '@/lib/supabase';

interface ProductVariantSelectorProps {
  variants: ProductVariant[];
  onVariantChange?: (variant: ProductVariant | null) => void;
}

export function ProductVariantSelector({ variants, onVariantChange }: ProductVariantSelectorProps) {
  const [selectedVariant, setSelectedVariant] = useState<string | null>(null);

  // Agrupar variantes por tipo (ej: Peso, Tamaño, etc.)
  const variantGroups = variants.reduce((acc, variant) => {
    if (!acc[variant.variant_name]) {
      acc[variant.variant_name] = [];
    }
    acc[variant.variant_name].push(variant);
    return acc;
  }, {} as Record<string, ProductVariant[]>);

  const handleVariantSelect = (variant: ProductVariant) => {
    setSelectedVariant(variant.id);
    onVariantChange?.(variant);
  };

  if (Object.keys(variantGroups).length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {Object.entries(variantGroups).map(([variantType, options]) => (
        <div key={variantType}>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            {variantType}:
          </label>
          <div className="flex flex-wrap gap-2">
            {options.map((option) => (
              <button
                key={option.id}
                onClick={() => handleVariantSelect(option)}
                disabled={!option.is_active || option.stock_quantity === 0}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 transform hover:scale-105 ${
                  selectedVariant === option.id
                    ? 'bg-gradient-to-r from-dorado-400 to-dorado-500 text-verde-bosque-700 shadow-md border-2 border-verde-aguacate'
                    : 'bg-white text-gray-700 border-2 border-gray-300 hover:border-dorado-300 hover:bg-dorado-50'
                } ${
                  (!option.is_active || option.stock_quantity === 0)
                    ? 'opacity-50 cursor-not-allowed'
                    : ''
                }`}
              >
                <span className="block">{option.variant_value}</span>
                {option.price_modifier !== 0 && (
                  <span className="block text-xs mt-1">
                    {option.price_modifier > 0 ? '+' : ''}
                    ${option.price_modifier.toFixed(2)}
                  </span>
                )}
                {option.stock_quantity === 0 && (
                  <span className="block text-xs mt-1 text-red-500">Agotado</span>
                )}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
