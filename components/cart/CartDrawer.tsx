'use client';

import { X, Plus, Minus, ShoppingBag } from 'lucide-react';
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
          className="fixed inset-0 bg-black/50 z-40"
          onClick={toggleCart}
        />
      )}

      {/* Drawer */}
      <div 
        className={`fixed top-0 right-0 h-full w-full md:w-96 bg-white shadow-strong z-50 transform transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="font-display font-bold text-xl">
              Mi Carrito ({itemCount})
            </h2>
            <button 
              onClick={toggleCart}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Items */}
          <div className="flex-1 overflow-y-auto p-4">
            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <ShoppingBag className="w-16 h-16 text-gray-300 mb-4" />
                <p className="text-gray-600 mb-2">Tu carrito está vacío</p>
                <button 
                  onClick={toggleCart}
                  className="text-verde-bosque hover:text-verde-bosque-600 font-semibold"
                >
                  Comenzar a comprar
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {items.map((item) => {
                  const itemKey = item.variant 
                    ? `${item.product.id}-${item.variant.id}`
                    : item.product.id;
                  
                  return (
                  <div key={itemKey} className="flex gap-3 bg-gray-50 p-3 rounded-lg">
                    <div className="relative w-20 h-20 flex-shrink-0 bg-white rounded-lg overflow-hidden">
                      {item.product.main_image_url ? (
                        <Image
                          src={item.product.main_image_url}
                          alt={item.product.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-200">
                          <span className="text-xs text-gray-400">Sin imagen</span>
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm mb-1 line-clamp-2">
                        {item.product.name}
                      </h3>
                      {item.variant && (
                        <p className="text-xs text-gray-600 mb-1">
                          {item.variant.variant_value}
                        </p>
                      )}
                      <div className="text-verde-bosque font-mono font-bold text-sm mb-2">
                        {formatPrice(item.price)}
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => updateQuantity(item.product.id, item.quantity - 1, item.variant?.id)}
                            className="p-1 hover:bg-white rounded transition-colors"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="font-semibold w-8 text-center">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.product.id, item.quantity + 1, item.variant?.id)}
                            disabled={item.quantity >= (item.product.stock || 999)}
                            className="p-1 hover:bg-white rounded transition-colors disabled:opacity-50"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>

                        <button
                          onClick={() => removeItem(item.product.id, item.variant?.id)}
                          className="text-red-500 hover:text-red-700 text-sm font-medium"
                        >
                          Eliminar
                        </button>
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
            <div className="border-t p-4 space-y-4">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-lg">Total:</span>
                <span className="font-mono font-bold text-2xl text-verde-bosque">
                  {formatPrice(total)}
                </span>
              </div>

              <Link
                href="/checkout"
                onClick={toggleCart}
                className="block w-full bg-verde-bosque hover:bg-verde-bosque-600 text-white text-center font-semibold py-4 rounded-xl transition-colors"
              >
                Ir al Checkout
              </Link>

              <Link
                href="/productos"
                onClick={toggleCart}
                className="block w-full text-center text-verde-bosque hover:text-verde-bosque-600 font-semibold py-2"
              >
                Continuar comprando
              </Link>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
