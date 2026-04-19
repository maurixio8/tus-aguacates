'use client';

import { X, Plus, Minus, ShoppingBag, Trash2, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useCartStore } from '@/lib/cart-store';
import { formatPrice } from '@/lib/utils';
import { useEffect, useState } from 'react';

export function CartDrawer() {
  const { items, isOpen, toggleCart, updateQuantity, removeItem, getTotal } = useCartStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const total = getTotal();
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity"
          onClick={toggleCart}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-full sm:w-[420px] bg-white z-50 transform transition-transform duration-300 ease-out shadow-2xl ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-verde-bosque to-verde-aguacate">
            <div className="flex items-center gap-3">
              <ShoppingBag className="w-5 h-5 text-white" />
              <h2 className="font-bold text-lg text-white">
                Mi Carrito
              </h2>
              {itemCount > 0 && (
                <span className="bg-yellow-400 text-verde-bosque text-xs font-bold px-2 py-0.5 rounded-full">
                  {itemCount}
                </span>
              )}
            </div>
            <button
              onClick={toggleCart}
              className="text-white/80 hover:text-white p-1.5 hover:bg-white/20 rounded-lg transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Items */}
          <div className="flex-1 overflow-y-auto">
            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center px-6">
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <ShoppingBag className="w-10 h-10 text-gray-300" />
                </div>
                <p className="text-gray-800 font-semibold text-lg mb-1">Carrito vacío</p>
                <p className="text-gray-400 text-sm mb-6">Agrega productos para comenzar</p>
                <button
                  onClick={toggleCart}
                  className="text-verde-bosque hover:text-verde-aguacate font-semibold text-sm underline underline-offset-2"
                >
                  Ver productos
                </button>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {items.map((item) => {
                  const itemKey = item.variant
                    ? `${item.product.id}-${item.variant.id}`
                    : item.product.id;
                  const lineTotal = item.price * item.quantity;

                  return (
                    <div key={itemKey} className="flex gap-3 p-4 hover:bg-gray-50/50 transition-colors">
                      {/* Imagen */}
                      <div className="relative w-[72px] h-[72px] flex-shrink-0 bg-gray-100 rounded-xl overflow-hidden">
                        {item.product.main_image_url ? (
                          <Image
                            src={item.product.main_image_url}
                            alt={item.product.name}
                            fill
                            className="object-cover"
                            sizes="72px"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xl">
                            🥑
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <h3 className="font-semibold text-sm text-gray-900 truncate">
                              {item.product.name}
                            </h3>
                            {item.variant && (
                              <p className="text-[11px] text-gray-400 mt-0.5">
                                {item.variant.variant_value}
                              </p>
                            )}
                          </div>
                          <button
                            onClick={() => removeItem(item.product.id, item.variant?.id)}
                            className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all flex-shrink-0"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="flex items-center justify-between mt-2">
                          {/* Cantidad */}
                          <div className="flex items-center bg-gray-100 rounded-lg">
                            <button
                              onClick={() => updateQuantity(item.product.id, item.quantity - 1, item.variant?.id)}
                              className="p-1.5 hover:bg-gray-200 rounded-l-lg transition-colors"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="px-3 font-bold text-sm text-gray-900">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateQuantity(item.product.id, item.quantity + 1, item.variant?.id)}
                              disabled={item.quantity >= (item.product.stock || 999)}
                              className="p-1.5 hover:bg-gray-200 rounded-r-lg transition-colors disabled:opacity-30"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>

                          {/* Precio línea */}
                          <span className="font-bold text-sm text-verde-bosque font-mono">
                            {formatPrice(lineTotal)}
                          </span>
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
            <div className="border-t border-gray-100 p-5 space-y-4 bg-white">
              {/* Subtotal + Envío */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Subtotal ({itemCount} items)</span>
                  <span className="font-semibold font-mono">{formatPrice(total)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Envío</span>
                  <span className="text-gray-400 text-xs">Se calcula al pagar</span>
                </div>
                <div className="border-t border-dashed border-gray-200 pt-2 flex justify-between items-center">
                  <span className="font-bold text-gray-900">Total estimado</span>
                  <span className="font-mono font-bold text-xl text-verde-bosque">
                    {formatPrice(total)}
                  </span>
                </div>
              </div>

              {/* Botón Checkout */}
              <Link
                href="/checkout"
                onClick={toggleCart}
                className="flex items-center justify-center gap-2 w-full bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-verde-bosque-700 font-bold py-3.5 rounded-xl transition-all shadow-lg hover:shadow-xl border-2 border-verde-aguacate text-base"
              >
                Ir a pagar
                <ArrowRight className="w-4 h-4" />
              </Link>

              <button
                onClick={toggleCart}
                className="w-full text-center text-sm text-gray-400 hover:text-gray-600 py-1 transition-colors"
              >
                Seguir comprando
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
