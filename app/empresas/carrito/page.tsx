'use client';

/**
 * Página del Carrito B2B
 * "Tus Aguacates" - E-commerce Platform
 */

import { useRouter } from 'next/navigation';
import { useB2BCartStore, useB2BCartSummary } from '@/lib/b2b/b2b-cart-store';
import { formatPrice } from '@/lib/b2b/b2b-pricing';
import Image from 'next/image';
import Link from 'next/link';

export default function B2BCartPage() {
  const router = useRouter();
  const items = useB2BCartStore((state) => state.items);
  const removeItem = useB2BCartStore((state) => state.removeItem);
  const updateQuantity = useB2BCartStore((state) => state.updateQuantity);
  const clearCart = useB2BCartStore((state) => state.clearCart);

  const {
    subtotal,
    totalDiscount,
    total,
    totalItems,
    minimumOrder,
    meetsMinimum,
    remainingForMinimumFormatted,
  } = useB2BCartSummary();

  const handleQuantityChange = (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeItem(productId);
    } else {
      try {
        updateQuantity(productId, newQuantity);
      } catch (error: any) {
        alert(error.message);
      }
    }
  };

  const handleRemoveItem = (productId: string) => {
    if (confirm('¿Eliminar este producto del carrito?')) {
      removeItem(productId);
    }
  };

  const handleClearCart = () => {
    if (confirm('¿Vaciar el carrito?')) {
      clearCart();
    }
  };

  const handleCheckout = () => {
    if (!meetsMinimum) {
      alert(`El monto mínimo de pedido es ${minimumOrder}. Te faltan ${remainingForMinimumFormatted}.`);
      return;
    }
    router.push('/empresas/checkout');
  };

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-md mx-auto text-center">
          <svg
            className="mx-auto h-24 w-24 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1}
              d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
          <h2 className="mt-4 text-2xl font-bold text-gray-800">
            Tu carrito está vacío
          </h2>
          <p className="mt-2 text-gray-600">
            Agrega productos para comenzar tu compra
          </p>
          <Link
            href="/empresas/catalogo"
            className="inline-block mt-6 bg-amber-600 hover:bg-amber-700 text-white font-bold py-3 px-8 rounded-lg"
          >
            Ver Catálogo
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Mi Carrito</h1>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Lista de items */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-800">
                Productos ({totalItems})
              </h2>
              <button
                onClick={handleClearCart}
                className="text-sm text-red-600 hover:text-red-700"
              >
                Vaciar carrito
              </button>
            </div>

            <div className="divide-y divide-gray-200">
              {items.map((item) => (
                <div key={item.product_id} className="p-4 flex gap-4">
                  {/* Imagen */}
                  <div className="relative w-24 h-24 flex-shrink-0 bg-gray-100 rounded">
                    {item.product.main_image_url ? (
                      <Image
                        src={item.product.main_image_url}
                        alt={item.product.name}
                        fill
                        className="object-cover rounded"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* Información */}
                  <div className="flex-1">
                    <Link
                      href={`/empresas/catalogo/${item.product_id}`}
                      className="text-lg font-semibold text-gray-800 hover:text-amber-600"
                    >
                      {item.product.name}
                    </Link>
                    <p className="text-sm text-gray-600">{item.product.sku}</p>

                    {/* Pricing tier aplicado */}
                    {item.applied_tier && (
                      <div className="mt-1 inline-flex items-center gap-1 text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                        <span>{item.applied_tier.tier_name || 'Descuento por volumen'}</span>
                        <span className="font-semibold">
                          {item.discount_percentage}% dto
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Cantidad y precio */}
                  <div className="flex flex-col items-end gap-2">
                    <div className="text-right">
                      <p className="text-lg font-bold text-amber-600">
                        {formatPrice(item.subtotal)}
                      </p>
                      {item.discount_percentage > 0 && (
                        <p className="text-sm text-gray-400 line-through">
                          {formatPrice(item.product.base_price * item.quantity)}
                        </p>
                      )}
                      <p className="text-sm text-gray-600">
                        {formatPrice(item.unit_price)}/{item.product.unit}
                      </p>
                    </div>

                    {/* Selector de cantidad */}
                    <div className="flex items-center border border-gray-300 rounded">
                      <button
                        onClick={() => handleQuantityChange(item.product_id, item.quantity - 1)}
                        className="px-2 py-1 text-gray-600 hover:bg-gray-100"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => handleQuantityChange(item.product_id, parseInt(e.target.value) || 0)}
                        className="w-16 text-center border-0 focus:ring-0"
                        min={item.product.minimum_order_quantity}
                        max={item.product.stock_quantity}
                      />
                      <button
                        onClick={() => handleQuantityChange(item.product_id, item.quantity + 1)}
                        className="px-2 py-1 text-gray-600 hover:bg-gray-100"
                      >
                        +
                      </button>
                    </div>

                    {/* Eliminar */}
                    <button
                      onClick={() => handleRemoveItem(item.product_id)}
                      className="text-sm text-red-600 hover:text-red-700"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Resumen */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow p-6 sticky top-4">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Resumen del Pedido
            </h2>

            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>{subtotal}</span>
              </div>
              {totalDiscount !== '$0' && (
                <div className="flex justify-between text-green-600">
                  <span>Descuentos</span>
                  <span>-{totalDiscount}</span>
                </div>
              )}
              <div className="flex justify-between text-gray-600">
                <span>Envío</span>
                <span>Por calcular</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Impuestos</span>
                <span>Por calcular</span>
              </div>
              <div className="border-t pt-3 flex justify-between text-xl font-bold text-gray-800">
                <span>Total</span>
                <span>{total}</span>
              </div>
            </div>

            {/* Monto mínimo */}
            <div className={`mb-6 p-4 rounded-lg ${
              meetsMinimum ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
            }`}>
              <p className={`text-sm font-semibold ${
                meetsMinimum ? 'text-green-800' : 'text-red-800'
              }`}>
                {meetsMinimum
                  ? '✓ Cumple con el monto mínimo'
                  : `⚠ Monto mínimo: ${minimumOrder}`
                }
              </p>
              {!meetsMinimum && (
                <p className={`text-sm mt-1 ${
                  meetsMinimum ? 'text-green-700' : 'text-red-700'
                }`}>
                  Te faltan {remainingForMinimumFormatted}
                </p>
              )}
            </div>

            {/* Botones */}
            <div className="space-y-3">
              <button
                onClick={handleCheckout}
                disabled={!meetsMinimum}
                className="w-full bg-amber-600 hover:bg-amber-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-lg transition"
              >
                Proceder al Pago
              </button>
              <Link
                href="/empresas/catalogo"
                className="block text-center text-amber-600 hover:text-amber-700 font-semibold"
              >
                Seguir Comprando
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
