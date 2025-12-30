'use client';

/**
 * Página de Checkout B2B
 * "Tus Aguacates" - E-commerce Platform
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useB2BCartStore, useB2BCartSummary } from '@/lib/b2b/b2b-cart-store';
import { GuestInfoForm } from '@/components/b2b/checkout/GuestInfoForm';
import type { GuestContactInfo, Address, B2BPaymentMethod } from '@/lib/b2b/b2b-types';
import { useToast } from '@/components/ui/Toast';

export default function B2BCheckoutPage() {
  const router = useRouter();
  const items = useB2BCartStore((state) => state.items);
  const clearCart = useB2BCartStore((state) => state.clearCart);
  const { total, totalItems, meetsMinimum } = useB2BCartSummary();
  const { showError } = useToast();

  const [step, setStep] = useState<'guest' | 'payment' | 'processing' | 'success'>('guest');
  const [guestInfo, setGuestInfo] = useState<(GuestContactInfo & { shipping_address: Address }) | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<B2BPaymentMethod>('bold_pay');
  const [orderNotes, setOrderNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Redirigir si el carrito está vacío o no cumple monto mínimo
  useEffect(() => {
    if (items.length === 0) {
      router.push('/empresas/carrito');
    } else if (!meetsMinimum) {
      showError('El carrito no cumple con el monto mínimo de pedido');
      router.push('/empresas/carrito');
    }
  }, [items.length, meetsMinimum, router, showError]);

  const handleGuestInfoSubmit = (info: GuestContactInfo & { shipping_address: Address }) => {
    setGuestInfo(info);
    setStep('payment');
  };

  const handlePlaceOrder = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/b2b/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: items.map(item => ({
            product_id: item.product_id,
            quantity: item.quantity,
          })),
          guest_contact_info: guestInfo,
          shipping_address: guestInfo?.shipping_address,
          order_notes: orderNotes,
          payment_method: paymentMethod,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Error al procesar el pedido');
      }

      // Pedido creado exitosamente
      setStep('success');
      clearCart();

      // Redirigir a página de confirmación o procesar pago
      if (data.data.payment_url) {
        window.location.href = data.data.payment_url;
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (step === 'success') {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-md mx-auto text-center">
          <div className="mb-6">
            <svg className="mx-auto h-24 w-24 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-4">
            ¡Pedido Creado Exitosamente!
          </h1>
          <p className="text-gray-600 mb-8">
            Te hemos enviado un email con los detalles de tu pedido.
          </p>
          <div className="space-y-4">
            <a
              href="/empresas/catalogo"
              className="inline-block bg-amber-600 hover:bg-amber-700 text-white font-bold py-3 px-8 rounded-lg"
            >
              Seguir Comprando
            </a>
            <div>
              <a href="/empresas" className="text-amber-600 hover:text-amber-700">
                Volver al Inicio
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Finalizar Compra</h1>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Formulario */}
        <div className="lg:col-span-2">
          {/* Paso 1: Información de contacto (guest) */}
          {step === 'guest' && (
            <div className="bg-white rounded-lg shadow p-6">
              <GuestInfoForm onSubmit={handleGuestInfoSubmit} />
            </div>
          )}

          {/* Paso 2: Método de pago */}
          {step === 'payment' && (
            <div className="bg-white rounded-lg shadow p-6">
              <div className="mb-6">
                <button
                  onClick={() => setStep('guest')}
                  className="text-amber-600 hover:text-amber-700 text-sm"
                >
                  ← Volver a información de contacto
                </button>
              </div>

              <h2 className="text-xl font-semibold text-gray-800 mb-6">
                Método de Pago
              </h2>

              {/* Opciones de pago */}
              <div className="space-y-4 mb-6">
                <label className={`flex items-center p-4 border rounded-lg cursor-pointer transition ${
                  paymentMethod === 'bold_pay' ? 'border-amber-600 bg-amber-50' : 'border-gray-300 hover:border-gray-400'
                }`}>
                  <input
                    type="radio"
                    name="payment_method"
                    value="bold_pay"
                    checked={paymentMethod === 'bold_pay'}
                    onChange={(e) => setPaymentMethod(e.target.value as B2BPaymentMethod)}
                    className="mr-3"
                  />
                  <div className="flex-1">
                    <p className="font-semibold text-gray-800">Tarjeta de Crédito/Débito</p>
                    <p className="text-sm text-gray-600">Pago seguro a través de Bold Pay</p>
                  </div>
                </label>

                <label className={`flex items-center p-4 border rounded-lg cursor-pointer transition ${
                  paymentMethod === 'transfer' ? 'border-amber-600 bg-amber-50' : 'border-gray-300 hover:border-gray-400'
                }`}>
                  <input
                    type="radio"
                    name="payment_method"
                    value="transfer"
                    checked={paymentMethod === 'transfer'}
                    onChange={(e) => setPaymentMethod(e.target.value as B2BPaymentMethod)}
                    className="mr-3"
                  />
                  <div className="flex-1">
                    <p className="font-semibold text-gray-800">Transferencia Bancaria</p>
                    <p className="text-sm text-gray-600">Recibirás los datos para hacer la transferencia</p>
                  </div>
                </label>

                <label className={`flex items-center p-4 border rounded-lg cursor-pointer transition ${
                  paymentMethod === 'cash' ? 'border-amber-600 bg-amber-50' : 'border-gray-300 hover:border-gray-400'
                }`}>
                  <input
                    type="radio"
                    name="payment_method"
                    value="cash"
                    checked={paymentMethod === 'cash'}
                    onChange={(e) => setPaymentMethod(e.target.value as B2BPaymentMethod)}
                    className="mr-3"
                  />
                  <div className="flex-1">
                    <p className="font-semibold text-gray-800">Pago contra Entrega</p>
                    <p className="text-sm text-gray-600">Paga en efectivo cuando recibas tu pedido</p>
                  </div>
                </label>
              </div>

              {/* Notas del pedido */}
              <div className="mb-6">
                <label htmlFor="order_notes" className="block text-sm font-medium text-gray-700 mb-1">
                  Notas Adicionales (opcional)
                </label>
                <textarea
                  id="order_notes"
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                  rows={3}
                  placeholder="Instrucciones especiales, hora de entrega preferida, etc."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* Información de contacto mostrada */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <h3 className="font-semibold text-gray-800 mb-2">Información de Contacto</h3>
                <p className="text-sm text-gray-600">
                  <strong>Nombre:</strong> {guestInfo?.name}<br />
                  <strong>Empresa:</strong> {guestInfo?.company_name}<br />
                  <strong>Email:</strong> {guestInfo?.email}<br />
                  <strong>Teléfono:</strong> {guestInfo?.phone}<br />
                  <strong>Dirección:</strong> {guestInfo?.shipping_address.street_address}, {guestInfo?.shipping_address.city}
                </p>
              </div>

              {/* Error */}
              {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-800 rounded-lg">
                  {error}
                </div>
              )}

              {/* Botón */}
              <button
                onClick={handlePlaceOrder}
                disabled={isLoading}
                className="w-full bg-amber-600 hover:bg-amber-700 disabled:bg-gray-300 text-white font-bold py-3 px-6 rounded-lg transition"
              >
                {isLoading ? 'Procesando...' : `Confirmar Pedido - ${total}`}
              </button>
            </div>
          )}
        </div>

        {/* Resumen del pedido */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow p-6 sticky top-4">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Resumen del Pedido
            </h2>

            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-gray-600">
                <span>Productos ({totalItems})</span>
              </div>

              <div className="border-t pt-3 space-y-2">
                {items.map((item) => (
                  <div key={item.product_id} className="flex justify-between text-sm">
                    <span className="text-gray-700">
                      {item.quantity}x {item.product.name}
                    </span>
                    <span className="text-gray-900 font-medium">
                      ${item.subtotal.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>

              <div className="border-t pt-3 flex justify-between text-lg font-bold text-gray-800">
                <span>Total</span>
                <span>{total}</span>
              </div>
            </div>

            {/* Info importante */}
            <div className="text-sm text-gray-600 space-y-2">
              <p>✓ Precios por volumen aplicados</p>
              <p>✓ Envío pendiente de calcular</p>
              <p>✓ Recibirás confirmación por email</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
