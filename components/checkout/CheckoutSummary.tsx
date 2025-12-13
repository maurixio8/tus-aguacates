'use client';

import Image from 'next/image';
import { Truck, ShoppingBag, Tag } from 'lucide-react';
import { useCartStore } from '@/lib/cart-store';

export default function CheckoutSummary() {
  const {
    items,
    appliedCoupon,
    shipping,
    getTotals,
    getItemCount
  } = useCartStore();

  const totals = getTotals();
  const itemCount = getItemCount();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP'
    }).format(amount);
  };

  if (itemCount === 0) {
    return (
      <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
        <div className="text-center text-gray-500">
          <ShoppingBag className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <p>Tu carrito esta vacio</p>
          <p className="text-sm mt-2">Agrega productos para continuar con tu compra</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-soft overflow-hidden">
      <div className="bg-gradient-to-r from-verde-bosque to-verde-aguacate p-3">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <ShoppingBag className="w-4 h-4" />
          Resumen del Pedido ({itemCount})
        </h2>
      </div>

      <div className="p-4 space-y-3">
        {/* Items Summary con fotos */}
        <div className="space-y-2">
          {items.map((item, index) => (
            <div key={`${item.product.id}-${item.variant?.id || 'no-variant'}-${index}`} className="flex items-center gap-3 py-2 border-b border-gray-100 last:border-0">
              {/* Imagen del producto */}
              <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                {item.product.main_image_url ? (
                  <Image
                    src={item.product.main_image_url}
                    alt={item.product.name}
                    width={48}
                    height={48}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                    Sin img
                  </div>
                )}
              </div>

              {/* Info del producto */}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 text-sm truncate">
                  {item.product.name}
                  {item.variant && (
                    <span className="text-gray-500 ml-1">
                      ({item.variant.variant_name})
                    </span>
                  )}
                </p>
                <p className="text-xs text-gray-500">
                  {item.quantity} x {formatCurrency(item.price)}
                </p>
              </div>

              {/* Precio */}
              <p className="font-bold text-gray-900 text-sm">
                {formatCurrency(item.price * item.quantity)}
              </p>
            </div>
          ))}
        </div>

        {/* Cupon Aplicado (compacto) */}
        {appliedCoupon && (
          <div className="bg-green-50 rounded-lg p-2 border border-green-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Tag className="w-3 h-3 text-green-600" />
                <span className="font-medium text-green-800 text-xs">
                  {appliedCoupon.code}
                </span>
              </div>
              <span className="text-green-700 text-xs font-medium">
                -{formatCurrency(totals.discount)}
              </span>
            </div>
          </div>
        )}

        {/* Totals Breakdown */}
        <div className="space-y-2 pt-3 border-t border-gray-200">
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-600">Subtotal</span>
            <span className="font-medium text-gray-900">
              {formatCurrency(totals.subtotal)}
            </span>
          </div>

          {totals.discount > 0 && (
            <div className="flex justify-between items-center text-sm">
              <span className="text-green-600">Descuento</span>
              <span className="font-medium text-green-600">
                -{formatCurrency(totals.discount)}
              </span>
            </div>
          )}

          {shipping && (
            <div className="flex justify-between items-center text-sm">
              <div className="flex items-center gap-1">
                <Truck className="w-3 h-3 text-blue-600" />
                <span className="text-gray-600">Envio</span>
              </div>
              <div className="text-right">
                {shipping.freeShipping ? (
                  <span className="font-medium text-green-600">GRATIS</span>
                ) : (
                  <span className="font-medium text-gray-900">
                    {formatCurrency(totals.shipping)}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Mensaje de envio gratis faltante */}
          {shipping && !shipping.freeShipping && shipping.amountForFreeShipping > 0 && (
            <p className="text-xs text-blue-600 text-right">
              Te faltan {formatCurrency(shipping.amountForFreeShipping)} para envio gratis
            </p>
          )}

          <div className="flex justify-between items-center pt-3 border-t border-gray-200">
            <span className="text-base font-bold text-gray-900">Total</span>
            <span className="text-lg font-bold text-verde-bosque">
              {formatCurrency(totals.total)}
            </span>
          </div>
        </div>

        {/* Entrega - Solo dias disponibles */}
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <p className="text-sm text-gray-700">
            Entregas: <strong>Martes y Viernes</strong> en Bogota
          </p>
        </div>
      </div>
    </div>
  );
}
