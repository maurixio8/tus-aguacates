'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCartStore, type PaymentMethod } from '@/lib/cart-store';
import { supabase } from '@/lib/supabase';
import type { Address } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { AddressSelector } from './AddressSelector';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import CheckoutSummary from './CheckoutSummary';
import CouponInput from './CouponInput';

interface AuthenticatedCheckoutFormProps {
  onSuccess: (orderId: string) => void;
}

type CheckoutStep = 'address' | 'payment-method' | 'processing';

export function AuthenticatedCheckoutForm({ onSuccess }: AuthenticatedCheckoutFormProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { items, getTotal, clearCart, getTotals, calculateShipping, setPaymentMethod: setStorePaymentMethod, paymentMethod: storePaymentMethod } = useCartStore();
  const totals = getTotals();

  const [step, setStep] = useState<CheckoutStep>('address');
  const [orderId, setOrderId] = useState<string>('');
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [paymentMethod, setLocalPaymentMethod] = useState<'daviplata' | 'efectivo'>('daviplata');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Función mejorada para extraer mensaje de error de Supabase
  const extractErrorMessage = (error: any): string => {
    if (typeof error === 'string') return error;
    if (error?.message) return error.message;
    if (error?.error?.message) return error.error.message;
    if (error?.details) return error.details;
    if (error?.code === '409') return 'Hubo un conflicto al crear el pedido. Por favor intenta de nuevo.';
    if (error?.code === '42501') return 'No tienes permisos para crear pedidos. Por favor contacta soporte.';
    if (error?.code === '23505') return 'El número de pedido ya existe. Por favor intenta de nuevo.';
    return 'Error al procesar el pedido. Por favor intenta de nuevo más tarde.';
  };

  // Initialize shipping calculation when component mounts and cart has items
  useEffect(() => {
    // Only calculate shipping if there are items in cart
    if (items.length > 0) {
      calculateShipping();
    }
  }, [calculateShipping, items.length]);

  // Recalculate shipping when address changes
  useEffect(() => {
    if (selectedAddress && items.length > 0) {
      calculateShipping(selectedAddress.city);
    }
  }, [selectedAddress, calculateShipping, items.length]);

  // Initialize payment method in store when component mounts
  useEffect(() => {
    const methodMap: Record<string, PaymentMethod> = {
      'daviplata': 'daviplata',
      'efectivo': 'cash'
    };
    setStorePaymentMethod(methodMap[paymentMethod] || 'cash');
  }, []);

  const handleAddressSelect = (address: Address) => {
    setSelectedAddress(address);
    setError('');
  };

  const handleContinueToPayment = () => {
    if (!selectedAddress) {
      setError('Por favor selecciona una dirección de entrega');
      return;
    }
    setStep('payment-method');
  };

  const handleConfirmOrder = async () => {
    if (!selectedAddress || !user) {
      setError('Faltan datos para procesar el pedido');
      return;
    }

    setLoading(true);
    setError('');
    setStep('processing');

    try {
      // 1. Crear pedido autenticado
      const orderData = {
        items: items.map(item => ({
          productName: item.product.name,
          productId: item.product.id,
          variantName: item.variant?.variant_value || null,
          variantId: item.variant?.id || null,
          quantity: item.quantity,
          price: item.price
        })),
        subtotal: totals.subtotal,
        discount: totals.discount,
        shipping: totals.shipping,
        total: totals.total,
        appliedCoupon: useCartStore.getState().appliedCoupon,
        shippingInfo: useCartStore.getState().shipping,
      };

      // Snapshot de la dirección (copia de los datos al momento del pedido)
      const addressSnapshot = {
        label: selectedAddress.label,
        full_name: selectedAddress.full_name,
        phone: selectedAddress.phone,
        street_address: selectedAddress.street_address,
        city: selectedAddress.city,
        state: selectedAddress.state,
        postal_code: selectedAddress.postal_code,
        additional_info: selectedAddress.additional_info,
      };

      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user.id,
          order_data: orderData,
          total_amount: totals.total,
          subtotal: totals.subtotal,
          discount_amount: totals.discount,
          shipping_amount: totals.shipping,
          address_id: selectedAddress.id,
          shipping_address: addressSnapshot,
          payment_method: paymentMethod,
          status: 'pendiente',
          payment_status: paymentMethod === 'daviplata' ? 'pagado' : 'pendiente',
          coupon_code: useCartStore.getState().appliedCoupon?.code || null,
        })
        .select()
        .single();

      if (orderError) throw orderError;

      const createdOrderId = order.id;
      setOrderId(createdOrderId);

      // 2. Crear mensaje de WhatsApp (tono natural)
      const firstName = selectedAddress.full_name.split(' ')[0];

      let mensajeWhatsApp = `¡Hola! 👋

Acabo de hacer un pedido en su tienda:
🔗 https://tus-aguacates.vercel.app

📦 *Mi pedido:*
${orderData.items.map(item => `• ${item.quantity}x ${item.productName}${item.variantName ? ` (${item.variantName})` : ''} - $${item.price.toLocaleString('es-CO')}`).join('\n')}`;

      // Add breakdown
      if (totals.discount > 0 || totals.shipping > 0) {
        mensajeWhatsApp += `\n\n💰 *Resumen:*`;
        mensajeWhatsApp += `\n• Subtotal: $${totals.subtotal.toLocaleString('es-CO')}`;

        if (totals.discount > 0) {
          mensajeWhatsApp += `\n• Descuento: -$${totals.discount.toLocaleString('es-CO')}`;
        }

        if (totals.shipping > 0) {
          mensajeWhatsApp += `\n• Envío: $${totals.shipping.toLocaleString('es-CO')}`;
        } else {
          mensajeWhatsApp += `\n• Envío: GRATIS 🎉`;
        }

        mensajeWhatsApp += `\n• *Total: $${totals.total.toLocaleString('es-CO')}*`;
      } else {
        mensajeWhatsApp += `\n\n💰 *Total:* $${totals.total.toLocaleString('es-CO')}`;
      }

      // Add coupon information if applied
      if (orderData.appliedCoupon) {
        mensajeWhatsApp += `\n\n🎟️ Usé el cupón: ${orderData.appliedCoupon.code}`;
      }

      mensajeWhatsApp += `

👤 *Mis datos:*
• Me llamo ${firstName}
• Tel: ${selectedAddress.phone}
• Dirección: ${selectedAddress.street_address}, ${selectedAddress.city}
${selectedAddress.additional_info ? `• Referencias: ${selectedAddress.additional_info}\n` : ''}
💳 *Pago:* ${paymentMethod === 'efectivo' ? 'Efectivo contra entrega' : 'Daviplata'}

¡Quedo atenta a la confirmación! 🙏`;

      // 3. Abrir WhatsApp
      const whatsappUrl = `https://wa.me/573042582777?text=${encodeURIComponent(mensajeWhatsApp)}`;
      window.open(whatsappUrl, '_blank');

      // 4. Actualizar pedido con info de WhatsApp
      await supabase
        .from('orders')
        .update({
          whatsapp_message: mensajeWhatsApp,
          whatsapp_sent: true,
          status: paymentMethod === 'efectivo' ? 'pendiente_entrega' : 'pagado',
        })
        .eq('id', createdOrderId);

      // --- INTEGRACIÓN N8N: Enviar pedido para limpieza y notificación ---
      try {
        fetch('/api/webhooks/n8n-order-sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderId: createdOrderId,
            orderData: orderData,
            customer: {
              name: selectedAddress.full_name,
              phone: selectedAddress.phone,
              address: selectedAddress.street_address,
              city: selectedAddress.city,
              email: user.email
            },
            payment: {
              method: paymentMethod,
              total: totals.total,
              status: paymentMethod === 'daviplata' ? 'pagado' : 'pendiente'
            },
            formattedMessage: mensajeWhatsApp
          })
        }).catch(err => console.error('Error silencioso enviando a n8n:', err));
      } catch (e) {
        console.warn('No se pudo iniciar sync con n8n');
      }
      // ------------------------------------------------------------------

      // 5. Limpiar carrito y redirigir
      clearCart();
      onSuccess(createdOrderId);

    } catch (err: any) {
      console.error('Error al crear pedido:', err);
      setError(extractErrorMessage(err));
      setStep('payment-method');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="text-center p-8">
        <p className="text-muted-foreground">
          Debes iniciar sesión para continuar
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Left Column - Checkout Form */}
      <div className="lg:col-span-2 space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* Step Indicator */}
        <div className="flex items-center justify-center space-x-4 mb-8">
          <div className={`flex items-center ${step === 'address' ? 'text-primary font-semibold' : 'text-muted-foreground'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${step === 'address' ? 'border-primary bg-primary text-white' : 'border-gray-300'}`}>
              1
            </div>
            <span className="ml-2 hidden sm:inline">Dirección</span>
          </div>
          <div className="w-12 h-0.5 bg-gray-300"></div>
          <div className={`flex items-center ${step === 'payment-method' || step === 'processing' ? 'text-primary font-semibold' : 'text-muted-foreground'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${step === 'payment-method' || step === 'processing' ? 'border-primary bg-primary text-white' : 'border-gray-300'}`}>
              2
            </div>
            <span className="ml-2 hidden sm:inline">Pago</span>
          </div>
        </div>

        {/* Step 1: Address Selection */}
        {step === 'address' && (
          <Card>
            <CardHeader>
              <CardTitle>Dirección de Entrega</CardTitle>
              <CardDescription>
                Selecciona o agrega una dirección para la entrega
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AddressSelector
                onSelect={handleAddressSelect}
                selectedAddressId={selectedAddress?.id}
              />

              <div className="mt-6">
                <Button
                  onClick={handleContinueToPayment}
                  disabled={!selectedAddress}
                  className="w-full"
                >
                  Continuar al Pago
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Payment Method */}
        {step === 'payment-method' && (
          <>
            <Card>
              <CardHeader>
                <CardTitle>💳 Método de Pago</CardTitle>
                <CardDescription>
                  Selecciona cómo prefieres pagar tu pedido
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Daviplata Option */}
                <div
                  className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${paymentMethod === 'daviplata'
                    ? 'border-primary bg-primary/5'
                    : 'border-gray-200 hover:border-gray-300'
                    }`}
                  onClick={() => {
                    setLocalPaymentMethod('daviplata');
                    setStorePaymentMethod('daviplata');
                  }}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="daviplata"
                      checked={paymentMethod === 'daviplata'}
                      onChange={(e) => {
                        setLocalPaymentMethod(e.target.value as 'daviplata');
                        setStorePaymentMethod('daviplata');
                      }}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-1">Daviplata</h3>
                      <p className="text-sm text-muted-foreground mb-2">
                        Transferencia bancaria instantánea
                      </p>

                      {paymentMethod === 'daviplata' && (
                        <div className="mt-3 p-3 bg-blue-50 rounded-md text-sm">
                          <p className="font-semibold mb-2">📱 Instrucciones:</p>
                          <ol className="list-decimal list-inside space-y-1">
                            <li>Abre tu app Daviplata</li>
                            <li>Selecciona "Enviar dinero"</li>
                            <li>Ingresa el número: <strong className="text-primary">320 306 2007</strong></li>
                            <li>Monto: <strong className="text-primary">$ {totals.total.toLocaleString('es-CO')} COP</strong></li>
                            <li>Confirma tu pago</li>
                          </ol>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Efectivo Option */}
                <div
                  className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${paymentMethod === 'efectivo'
                    ? 'border-primary bg-primary/5'
                    : 'border-gray-200 hover:border-gray-300'
                    }`}
                  onClick={() => {
                    setLocalPaymentMethod('efectivo');
                    setStorePaymentMethod('cash');
                  }}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="efectivo"
                      checked={paymentMethod === 'efectivo'}
                      onChange={(e) => {
                        setLocalPaymentMethod(e.target.value as 'efectivo');
                        setStorePaymentMethod('cash');
                      }}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-1">Efectivo</h3>
                      <p className="text-sm text-muted-foreground mb-2">
                        Paga cuando recibas tu pedido
                      </p>

                      {paymentMethod === 'efectivo' && (
                        <div className="mt-3 p-3 bg-green-50 rounded-md text-sm">
                          <p className="font-semibold mb-2">💵 Instrucciones:</p>
                          <ul className="list-disc list-inside space-y-1">
                            <li>Prepara el dinero exacto si es posible</li>
                            <li>Paga directamente al repartidor</li>
                            <li>Recibirás tu factura al momento</li>
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setStep('address')}
                    disabled={loading}
                  >
                    Volver
                  </Button>
                  <Button
                    onClick={handleConfirmOrder}
                    disabled={loading}
                    className="flex-1"
                  >
                    {loading ? 'Procesando...' : `Confirmar Pedido - ${paymentMethod === 'daviplata' ? 'Daviplata' : 'Efectivo'}`}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* Step 3: Processing */}
        {step === 'processing' && (
          <Card>
            <CardContent className="p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <h3 className="text-lg font-semibold mb-2">Procesando tu pedido...</h3>
              <p className="text-muted-foreground">Por favor espera un momento</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Right Column - Order Summary */}
      <div className="lg:col-span-1">
        <div className="sticky top-4 space-y-4">
          <CouponInput />
          <CheckoutSummary />
        </div>
      </div>
    </div>
  );
}
