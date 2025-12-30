'use client';

import { X, Plus, Minus, Package, Building2, Truck } from 'lucide-react';
import Link from 'next/link';
import { useBusinessCartStore } from '@/lib/business-cart-store';
import { formatPrice } from '@/lib/utils';
import { useEffect, useState } from 'react';

export function BusinessCartDrawer() {
  const {
    items,
    isOpen,
    toggleCart,
    closeCart,
    updateQuantity,
    removeItem,
    getTotals,
    shipping
  } = useBusinessCartStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const totals = getTotals();
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40"
          onClick={closeCart}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-full md:w-[450px] bg-white shadow-strong z-50 transform transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b bg-verde-bosque text-white">
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              <h2 className="font-display font-bold text-xl">
                Pedido Empresas
              </h2>
              <span className="bg-white/20 px-2 py-0.5 rounded-full text-sm">
                {itemCount} {itemCount === 1 ? 'item' : 'items'}
              </span>
            </div>
            <button
              onClick={closeCart}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Items */}
          <div className="flex-1 overflow-y-auto p-4">
            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <Package className="w-16 h-16 text-gray-300 mb-4" />
                <p className="text-gray-600 mb-2">Tu pedido está vacío</p>
                <p className="text-sm text-gray-400 mb-4">
                  Agrega productos para comenzar tu pedido mayorista
                </p>
                <button
                  onClick={closeCart}
                  className="text-verde-bosque hover:text-verde-bosque-600 font-semibold"
                >
                  Explorar catálogo B2B
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {items.map((item) => {
                  const itemKey = item.variant
                    ? `${item.product.id}-${item.variant.id}`
                    : item.product.id;

                  return (
                    <div key={itemKey} className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <h3 className="font-semibold text-sm mb-1">
                            {item.product.name}
                          </h3>
                          {item.variant && (
                            <p className="text-xs text-verde-bosque font-medium bg-verde-bosque/10 inline-block px-2 py-0.5 rounded">
                              {item.variant.variant_name}
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => removeItem(item.product.id, item.variant?.id)}
                          className="text-red-500 hover:text-red-700 text-xs font-medium"
                        >
                          Eliminar
                        </button>
                      </div>

                      <div className="flex items-center justify-between">
                        {/* Cantidad */}
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => updateQuantity(item.product.id, item.quantity - 1, item.variant?.id)}
                            className="w-8 h-8 flex items-center justify-center bg-white border border-gray-300 rounded-lg hover:bg-gray-100"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <div className="text-center">
                            <span className="font-bold text-lg">{item.quantity}</span>
                            <span className="text-xs text-gray-500 ml-1">{item.unit}</span>
                          </div>
                          <button
                            onClick={() => updateQuantity(item.product.id, item.quantity + 1, item.variant?.id)}
                            className="w-8 h-8 flex items-center justify-center bg-white border border-gray-300 rounded-lg hover:bg-gray-100"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Precio */}
                        <div className="text-right">
                          <div className="font-mono font-bold text-verde-bosque">
                            {formatPrice(item.price * item.quantity)}
                          </div>
                          <div className="text-xs text-gray-500">
                            {formatPrice(item.price)}/{item.unit}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          {items.length > 0 && (
            <div className="border-t p-4 space-y-3 bg-gray-50">
              {/* Resumen */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-mono">{formatPrice(totals.subtotal)}</span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 flex items-center gap-1">
                    <Truck className="w-4 h-4" />
                    Envío:
                  </span>
                  <span className={`font-mono ${shipping.freeShipping ? 'text-green-600' : ''}`}>
                    {shipping.freeShipping ? '¡GRATIS!' : formatPrice(totals.shipping)}
                  </span>
                </div>

                {!shipping.freeShipping && (
                  <p className="text-xs text-gray-500 bg-yellow-50 p-2 rounded-lg">
                    Te faltan {formatPrice(shipping.amountForFreeShipping)} para envío gratis
                  </p>
                )}

                <div className="flex justify-between items-center pt-2 border-t">
                  <span className="font-bold text-lg">Total:</span>
                  <span className="font-mono font-bold text-2xl text-verde-bosque">
                    {formatPrice(totals.total)}
                  </span>
                </div>

                {totals.totalWeight > 0 && (
                  <p className="text-xs text-gray-500 text-right">
                    Peso estimado: {totals.totalWeight.toFixed(1)} kg
                  </p>
                )}
              </div>

              {/* Botones */}
              <Link
                href="/empresas/checkout"
                onClick={closeCart}
                className="block w-full bg-gradient-to-r from-verde-bosque to-verde-aguacate hover:from-verde-bosque/90 hover:to-verde-aguacate/90 text-white text-center font-bold py-4 rounded-xl transition-all shadow-lg hover:shadow-xl"
              >
                Finalizar Pedido B2B
              </Link>

              <div className="flex gap-2">
                <a
                  href="https://wa.me/573042582777?text=Hola,%20quiero%20hacer%20un%20pedido%20mayorista"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 text-center text-verde-bosque border border-verde-bosque hover:bg-verde-bosque/5 font-semibold py-2 rounded-lg text-sm"
                >
                  Contactar por WhatsApp
                </a>
                <Link
                  href="/empresas"
                  onClick={closeCart}
                  className="flex-1 text-center text-gray-600 hover:text-gray-800 font-semibold py-2"
                >
                  Seguir comprando
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
