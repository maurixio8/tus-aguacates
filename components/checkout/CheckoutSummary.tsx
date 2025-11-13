'use client';

import { Truck, ShoppingBag, DollarSign, Tag, Check, Calendar } from 'lucide-react';
import { useCartStore } from '@/lib/cart-store';

export default function CheckoutSummary() {
  const {
    items,
    appliedCoupon,
    shipping,
    getSubtotal,
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CO', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  if (itemCount === 0) {
    return (
      <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
        <div className="text-center text-gray-500">
          <ShoppingBag className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <p>Tu carrito está vacío</p>
          <p className="text-sm mt-2">Agrega productos para continuar con tu compra</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-soft overflow-hidden">
      <div className="bg-gradient-to-r from-verde-bosque to-verde-aguacate p-4">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <ShoppingBag className="w-5 h-5" />
          Resumen del Pedido
        </h2>
      </div>

      <div className="p-6 space-y-4">
        {/* Items Summary */}
        <div className="space-y-3">
          {items.slice(0, 3).map((item, index) => (
            <div key={`${item.product.id}-${item.variant?.id || 'no-variant'}-${index}`} className="flex justify-between items-start gap-3 py-2 border-b border-gray-100 last:border-0">
              <div className="flex-1">
                <p className="font-medium text-gray-900">
                  {item.product.name}
                  {item.variant && (
                    <span className="text-sm text-gray-500 ml-1">
                      ({item.variant.variant_name})
                    </span>
                  )}
                </p>
                <p className="text-sm text-gray-500">
                  {item.quantity} x {formatCurrency(item.price)}
                </p>
              </div>
              <p className="font-bold text-gray-900 text-right">
                {formatCurrency(item.price * item.quantity)}
              </p>
            </div>
          ))}
          {items.length > 3 && (
            <p className="text-sm text-gray-500 text-center py-2">
              +{items.length - 3} productos más
            </p>
          )}
        </div>

        {/* Coupon Applied */}
        {appliedCoupon && (
          <div className="bg-green-50 rounded-lg p-4 border border-green-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-green-600" />
                <span className="font-medium text-green-800">
                  Cupón Aplicado: {appliedCoupon.code}
                </span>
              </div>
              <div className="text-right">
                <p className="text-sm text-green-700">
                  -{formatCurrency(totals.discount)}
                </p>
              </div>
            </div>
            <p className="text-xs text-green-600 mt-1">
              {appliedCoupon.description}
            </p>
            <p className="text-xs text-green-600 mt-1">
              Tipo: {appliedCoupon.discount_type === 'percentage'
                ? `${appliedCoupon.discount_value}% de descuento`
                : `${formatCurrency(appliedCoupon.discount_value)} de descuento fijo`
              }
            </p>
          </div>
        )}

        {/* Totals Breakdown */}
        <div className="space-y-3 pt-4 border-t border-gray-200">
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Subtotal</span>
            <span className="font-medium text-gray-900">
              {formatCurrency(totals.subtotal)}
            </span>
          </div>

          {totals.discount > 0 && (
            <div className="flex justify-between items-center">
              <span className="text-green-600">Descuento</span>
              <span className="font-medium text-green-600">
                -{formatCurrency(totals.discount)}
              </span>
            </div>
          )}

          {shipping && (
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-blue-600" />
                <span className="text-gray-600">Envío</span>
                {shipping.freeShipping && (
                  <span className="text-xs text-green-600 font-medium ml-1">
                    (GRATIS)
                  </span>
                )}
              </div>
              <div className="text-right">
                {shipping.freeShipping ? (
                  <span className="font-medium text-green-600">
                    GRATIS
                  </span>
                ) : (
                  <>
                    {shipping.amountForFreeShipping > 0 && (
                      <p className="text-xs text-blue-600 line-through">
                        {formatCurrency(totals.subtotal)}
                      </p>
                    )}
                    <span className="font-medium text-gray-900">
                      {formatCurrency(totals.shipping)}
                    </span>
                    {shipping.amountForFreeShipping > 0 && (
                      <p className="text-xs text-blue-600">
                        ¡Te faltan {formatCurrency(shipping.amountForFreeShipping)} para envío gratis!
                      </p>
                    )}
                  </>
                )}
              </div>
            </div>
          )}

          <div className="flex justify-between items-center pt-4 border-t border-gray-200">
            <span className="text-lg font-bold text-gray-900">Total</span>
            <span className="text-xl font-bold text-verde-bosque">
              {formatCurrency(totals.total)}
            </span>
          </div>
        </div>

        {/* Delivery Information */}
        {shipping && (
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <div className="flex items-center gap-2 mb-2">
              <Truck className="w-4 h-4 text-blue-600" />
              <span className="font-medium text-blue-800">Información de Entrega</span>
            </div>
            <div className="text-sm text-blue-700 space-y-1">
              <p>{shipping.message}</p>
              <p>Entrega estimada en {shipping.estimatedDays} día{shipping.estimatedDays !== 1 ? 's' : ''}</p>
            </div>
          </div>
        )}

        {/* Estimated Delivery */}
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-4 h-4 text-gray-600" />
            <span className="font-medium text-gray-800">Entrega</span>
          </div>
          <p className="text-sm text-gray-700">
            Entregas disponibles: Martes y Viernes en Bogotá
          </p>
          <p className="text-xs text-gray-600 mt-1">
            El horario de entrega es 8am-12pm y 2pm-6pm
          </p>
        </div>
      </div>
    </div>
  );
}