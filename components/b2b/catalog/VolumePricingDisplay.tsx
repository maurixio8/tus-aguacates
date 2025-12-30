/**
 * Componente para visualizar precios por volumen (Pricing Tiers)
 * "Tus Aguacates" - E-commerce Platform
 */

import { useMemo } from 'react';
import type { B2BProduct } from '@/lib/b2b/b2b-types';
import { formatPrice, formatDiscount, generatePricingTable } from '@/lib/b2b/b2b-pricing';

interface VolumePricingDisplayProps {
  product: B2BProduct;
  currentQuantity?: number;
}

export function VolumePricingDisplay({ product, currentQuantity }: VolumePricingDisplayProps) {
  const pricingTable = useMemo(() => generatePricingTable(product), [product]);

  if (pricingTable.length === 0) {
    return (
      <div className="text-gray-500 text-sm">
        Precio unitario: {formatPrice(product.base_price)}
      </div>
    );
  }

  return (
    <div className="w-full">
      <h4 className="text-lg font-semibold text-gray-800 mb-4">
        Precios por Volumen
      </h4>

      {/* Tabla de precios */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-amber-50 border-b border-amber-200">
              <th className="text-left py-3 px-4 font-semibold text-gray-700">
                Cantidad
              </th>
              <th className="text-right py-3 px-4 font-semibold text-gray-700">
                Precio Unitario
              </th>
              <th className="text-right py-3 px-4 font-semibold text-gray-700">
                Descuento
              </th>
              <th className="text-right py-3 px-4 font-semibold text-gray-700">
                Ahorras
              </th>
            </tr>
          </thead>
          <tbody>
            {pricingTable.map((tier, index) => {
              const isCurrentTier =
                currentQuantity !== undefined &&
                currentQuantity >= tier.minQty &&
                (tier.maxQty === null || currentQuantity <= tier.maxQty);

              const isOutOfRange =
                currentQuantity !== undefined &&
                currentQuantity > 0 &&
                ((index < pricingTable.length - 1 &&
                  currentQuantity < tier.minQty) ||
                  (index === pricingTable.length - 1 &&
                    currentQuantity < tier.minQty));

              return (
                <tr
                  key={`${tier.minQty}-${tier.maxQty}`}
                  className={`border-b border-gray-100 transition ${
                    isCurrentTier
                      ? 'bg-green-50 font-semibold'
                      : isOutOfRange
                      ? 'bg-gray-50 text-gray-400'
                      : index % 2 === 0
                      ? 'bg-white'
                      : 'bg-gray-50'
                  }`}
                >
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-900">
                        {tier.minQty} {product.unit}
                        {tier.maxQty && ` - ${tier.maxQty} ${product.unit}`}
                        {!tier.maxQty && '+'}
                      </span>
                      {isCurrentTier && (
                        <span className="bg-green-600 text-white text-xs px-2 py-1 rounded">
                          Actual
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="text-right py-3 px-4">
                    <span className={isCurrentTier ? 'text-green-700' : 'text-gray-900'}>
                      {formatPrice(tier.unitPrice)}
                    </span>
                  </td>
                  <td className="text-right py-3 px-4">
                    {tier.discount > 0 ? (
                      <span className="text-green-600 font-semibold">
                        {formatDiscount(tier.discount)}
                      </span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="text-right py-3 px-4">
                    {tier.savings > 0 ? (
                      <span className="text-green-600">
                        {formatPrice(tier.savings)}
                      </span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Nota informativa */}
      <p className="text-xs text-gray-500 mt-3">
        * Los precios por volumen se aplican automáticamente al agregar al carrito.
      </p>
    </div>
  );
}

/**
 * Versión compacta del componente de precios por volumen
 */
export function VolumePricingCompact({ product }: { product: B2BProduct }) {
  const pricingTable = useMemo(() => generatePricingTable(product), [product]);

  if (pricingTable.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-2 text-xs">
      {pricingTable.map((tier) => (
        <div
          key={`${tier.minQty}-${tier.maxQty}`}
          className="bg-gray-100 px-3 py-1 rounded-full"
          title={`Precio: ${formatPrice(tier.unitPrice)}`}
        >
          {tier.minQty}+ {product.unit}: {tier.discount > 0 && (
            <span className="text-green-600 font-semibold">
              {formatDiscount(tier.discount)} dto
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
