'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useCartStore } from '@/lib/cart-store';
import { supabase } from '@/lib/supabase';
import CouponInput from './CouponInput';
import CheckoutSummary from './CheckoutSummary';

interface GuestCheckoutFormProps {
  onSuccess: (orderId: string) => void;
}

type CheckoutStep = 'info' | 'payment' | 'payment-method' | 'processing';

export function GuestCheckoutForm({ onSuccess }: GuestCheckoutFormProps) {
  const router = useRouter();
  const { items, getTotal, clearCart, getTotals, calculateShipping } = useCartStore();
  const totals = getTotals();
  
  const [step, setStep] = useState<CheckoutStep>('info');
  const [orderId, setOrderId] = useState<string>('');
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
        createAccount: false,
    password: '',
    paymentMethod: 'daviplata'
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Initialize shipping calculation when component mounts
  useEffect(() => {
    calculateShipping();
  }, [calculateShipping]);

  const handleSubmitInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // 1. Crear pedido de invitado (sin procesar pago aún)
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

      const { data: guestOrder, error: orderError } = await supabase
        .from('guest_orders')
        .insert({
          guest_name: formData.name,
          guest_email: formData.email,
          guest_phone: formData.phone,
          guest_address: formData.address,
          order_data: orderData,
          total_amount: totals.total,
          status: 'pendiente',
          payment_status: 'pendiente',
          delivery_date: null, // No requerido en checkout rápido
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Guardar order ID y pasar al paso de método de pago
      setOrderId(guestOrder.id);
      setStep('payment-method');

    } catch (err: any) {
      console.error('Error al crear pedido:', err);
      setError(err.message || 'Error al procesar el pedido');
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = async () => {
    setStep('processing');

    try {
      // 2. Crear mensaje de WhatsApp pre-formateado
      const orderData = {
        id: orderId || 'ORDER-' + Date.now(),
        items: items.map(item => ({
          productName: item.product.name,
          variantName: item.variant?.variant_value || null,
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

      // Generar mensaje para WhatsApp (como si el cliente lo escribiera)
      let mensajeWhatsApp = `🥑 *Nuevo Pedido - Tus Aguacates*

*Cliente:* ${formData.name}
*Teléfono:* ${formData.phone}
*Email:* ${formData.email}
*Dirección:* ${formData.address}

*Pedido:*
${orderData.items.map(item => `• ${item.quantity}x ${item.productName} ${item.variantName ? `(${item.variantName})` : ''} - $${item.price.toLocaleString('es-CO')}`).join('\n')}`;

      // Add breakdown if there's discount or shipping
      if (totals.discount > 0 || totals.shipping > 0) {
        mensajeWhatsApp += `\n
*Resumen:*
• Subtotal: $${totals.subtotal.toLocaleString('es-CO')}`;

        if (totals.discount > 0) {
          mensajeWhatsApp += `\n• Descuento: -$${totals.discount.toLocaleString('es-CO')}`;
        }

        if (totals.shipping > 0) {
          mensajeWhatsApp += `\n• Envío: $${totals.shipping.toLocaleString('es-CO')}`;
        }

        mensajeWhatsApp += `\n• *Total: $${totals.total.toLocaleString('es-CO')} COP*`;
      } else {
        mensajeWhatsApp += `\n
*Total:* $${totals.total.toLocaleString('es-CO')} COP`;
      }

      // Add coupon information if applied
      if (orderData.appliedCoupon) {
        mensajeWhatsApp += `\n
*Cupón Aplicado:* ${orderData.appliedCoupon.code}
${orderData.appliedCoupon.description}
*Descuento:* ${orderData.appliedCoupon.discount_type === 'percentage'
  ? `${orderData.appliedCoupon.discount_value}%`
  : `$${orderData.appliedCoupon.discount_value.toLocaleString('es-CO')}`
}`;
      }

      mensajeWhatsApp += `

*Entrega:* Por coordinar

*Método de pago:* ${formData.paymentMethod === 'efectivo' ? 'Efectivo' : 'Daviplata'}

¡Gracias por tu compra! 🥑`;

      // 3. Abrir WhatsApp con mensaje pre-completado
      const whatsappUrl = `https://wa.me/573042582777?text=${encodeURIComponent(mensajeWhatsApp)}`;
      window.open(whatsappUrl, '_blank');

      // 4. Actualizar estado del pedido con método de pago
      const paymentStatus = formData.paymentMethod === 'efectivo' ? 'pendiente_pago' : 'pagado';
      await supabase
        .from('guest_orders')
        .update({
          status: formData.paymentMethod === 'efectivo' ? 'pendiente_entrega' : 'pagado',
          payment_status: paymentStatus,
          payment_method: formData.paymentMethod,
          paid_at: formData.paymentMethod === 'daviplata' ? new Date().toISOString() : null,
          whatsapp_message: mensajeWhatsApp,
          whatsapp_sent: true
        })
        .eq('id', orderId);

      // 5. Opcional: crear cuenta si el usuario lo solicitó
      if (formData.createAccount && formData.password) {
        try {
          const { data: authData, error: signUpError } = await supabase.auth.signUp({
            email: formData.email,
            password: formData.password,
            options: {
              data: {
                full_name: formData.name,
                phone: formData.phone
              }
            }
          });

          if (!signUpError && authData.user) {
            // Crear perfil de usuario
            await supabase.from('profiles').upsert({
              user_id: authData.user.id,
              full_name: formData.name,
              phone: formData.phone,
              address: formData.address
            });

            // Migrar pedido de invitado a pedido de usuario
            await supabase.from('orders').insert({
              user_id: authData.user.id,
              total: totals.total,
              status: 'pagado',
              shipping_address: formData.address,
              created_from_guest: true,
              guest_order_id: orderId
            });
          }
        } catch (accountError) {
          console.error('Error creating account:', accountError);
          // No bloquear el pedido por error de creación de cuenta
        }
      }

      // 6. Limpiar carrito y redirigir
      clearCart();
      onSuccess(orderId);

    } catch (err: any) {
      console.error('Error al finalizar pedido:', err);
      setError(err.message || 'Error al finalizar el pedido');
    }
  };

  const handlePaymentError = (errorMsg: string) => {
    setError(errorMsg);
    // Actualizar estado del pedido a "pago fallido"
    supabase
      .from('guest_orders')
      .update({ 
        status: 'pago_fallido',
        payment_status: 'fallido'
      })
      .eq('id', orderId);
  };

  const handleConfirmOrder = async () => {
    // Versión sin pago (para testing o pago contra entrega)
    setLoading(true);
    setError('');

    try {
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

      const { data: guestOrder, error: orderError } = await supabase
        .from('guest_orders')
        .insert({
          guest_name: formData.name,
          guest_email: formData.email,
          guest_phone: formData.phone,
          guest_address: formData.address,
          order_data: orderData,
          total_amount: totals.total,
          status: 'pendiente_entrega',
          payment_status: 'pendiente_pago',
          payment_method: 'efectivo',
          delivery_date: null, // No requerido en checkout rápido
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // 2. Generar mensaje de WhatsApp pre-formateado para pedido contra entrega
      let mensajeWhatsApp = `🥑 *Nuevo Pedido - Tus Aguacates*

*Cliente:* ${formData.name}
*Teléfono:* ${formData.phone}
*Email:* ${formData.email}
*Dirección:* ${formData.address}

*Pedido:*
${orderData.items.map(item => `• ${item.quantity}x ${item.productName} ${item.variantName ? `(${item.variantName})` : ''} - $${item.price.toLocaleString('es-CO')}`).join('\n')}`;

      // Add breakdown if there's discount or shipping
      if (totals.discount > 0 || totals.shipping > 0) {
        mensajeWhatsApp += `\n
*Resumen:*
• Subtotal: $${totals.subtotal.toLocaleString('es-CO')}`;

        if (totals.discount > 0) {
          mensajeWhatsApp += `\n• Descuento: -$${totals.discount.toLocaleString('es-CO')}`;
        }

        if (totals.shipping > 0) {
          mensajeWhatsApp += `\n• Envío: $${totals.shipping.toLocaleString('es-CO')}`;
        }

        mensajeWhatsApp += `\n• *Total: $${totals.total.toLocaleString('es-CO')} COP*`;
      } else {
        mensajeWhatsApp += `\n
*Total:* $${totals.total.toLocaleString('es-CO')} COP`;
      }

      // Add coupon information if applied
      if (orderData.appliedCoupon) {
        mensajeWhatsApp += `\n
*Cupón Aplicado:* ${orderData.appliedCoupon.code}
${orderData.appliedCoupon.description}
*Descuento:* ${orderData.appliedCoupon.discount_type === 'percentage'
  ? `${orderData.appliedCoupon.discount_value}%`
  : `$${orderData.appliedCoupon.discount_value.toLocaleString('es-CO')}`
}`;
      }

      mensajeWhatsApp += `

*Entrega:* Por coordinar

*Método de pago:* Efectivo contra entrega

¡Gracias por tu compra! 🥑`;

      // 3. Abrir WhatsApp con mensaje pre-completado
      const whatsappUrl = `https://wa.me/573042582777?text=${encodeURIComponent(mensajeWhatsApp)}`;
      window.open(whatsappUrl, '_blank');

      // 4. Actualizar estado del pedido
      await supabase
        .from('guest_orders')
        .update({
          status: 'pendiente_entrega',
          payment_status: 'pendiente_pago',
          payment_method: 'efectivo',
          whatsapp_message: mensajeWhatsApp,
          whatsapp_sent: true
        })
        .eq('id', guestOrder.id);

      // Limpiar carrito y redirigir
      clearCart();
      onSuccess(guestOrder.id);

    } catch (err: any) {
      console.error('Error al crear pedido:', err);
      setError(err.message || 'Error al procesar el pedido');
    } finally {
      setLoading(false);
    }
  };

  // Paso 1: Información del cliente
  if (step === 'info') {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Logo Header */}
        <div className="bg-white border-b border-gray-200 py-4">
          <div className="max-w-md mx-auto flex justify-center">
            <Image
              src="/images/logo-animated.gif"
              alt="Tus Aguacates"
              width={180}
              height={60}
              priority
            />
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmitInfo} className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-4">Información de Contacto</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Nombre Completo *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-verde-aguacate"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Email *</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-verde-aguacate"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Teléfono *</label>
              <input
                type="tel"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+57 300 123 4567"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-verde-aguacate"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Dirección de Entrega *</label>
              <textarea
                required
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-verde-aguacate"
              />
            </div>
          </div>
        </div>

        <div className="border-t pt-6">
          <label className="flex items-start space-x-3">
            <input
              type="checkbox"
              checked={formData.createAccount}
              onChange={(e) => setFormData({ ...formData, createAccount: e.target.checked })}
              className="mt-1"
            />
            <div>
              <p className="font-medium">Crear cuenta (opcional)</p>
              <p className="text-sm text-gray-600">
                Guarda tu información y accede a tu historial de pedidos
              </p>
            </div>
          </label>

          {formData.createAccount && (
            <div className="mt-4">
              <label className="block text-sm font-medium mb-1">Contraseña</label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                minLength={8}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-verde-aguacate"
                placeholder="Mínimo 8 caracteres"
              />
            </div>
          )}
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        <div className="space-y-3">
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-yellow-400 to-yellow-600 text-verde-bosque-700 hover:from-yellow-500 hover:to-yellow-700 disabled:bg-gray-300 disabled:cursor-not-allowed font-bold py-4 px-6 rounded-lg transition-all transform hover:scale-105 shadow-lg hover:shadow-xl border-2 border-verde-aguacate"
          >
            {loading ? 'Procesando...' : 'Continuar al Pago'}
          </button>

          <button
            type="button"
            onClick={handleConfirmOrder}
            disabled={loading}
            className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold py-4 px-6 rounded-lg transition-all transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016.393 7H3a2 2 0 00-1.997 1.884zM4.5 6.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zm7.5 0a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z"/>
            </svg>
            <span>Pagar Contra Entrega (Envío por WhatsApp)</span>
          </button>
        </div>

        <p className="text-sm text-gray-600 text-center">
          Entregas martes y viernes en Bogotá
        </p>
          </form>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Coupon Input */}
          <CouponInput userEmail={formData.email} />
        </div>
          </div>
        </div>
      </div>
    );
  }

  // Paso 2: Selección de método de pago
  if (step === 'payment-method') {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-purple-900 mb-2">💳 Método de Pago</h3>
          <p className="text-sm text-purple-700">
            Selecciona cómo prefieres pagar tu pedido. Aceptamos pagos digitales y efectivo contra entrega.
          </p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Total a Pagar</label>
              <div className="text-3xl font-bold text-verde-bosque">
                ${totals.total.toLocaleString('es-CO')} COP
              </div>
            </div>

            <div className="border-t pt-4">
              <p className="text-sm text-gray-600 mb-4">
                Pedido #{orderId.slice(0, 8)}
              </p>
              <p className="text-sm text-gray-600">
                Cliente: {formData.name}<br />
                Email: {formData.email}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="font-medium text-gray-900">Selecciona tu método de pago:</h4>

          {/* Daviplata Option */}
          <label className="relative flex items-start p-4 sm:p-6 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-purple-400 transition-colors bg-white">
            <input
              type="radio"
              name="paymentMethod"
              value="daviplata"
              checked={formData.paymentMethod === 'daviplata'}
              onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
              className="mt-1 text-purple-600 focus:ring-purple-500"
            />
            <div className="ml-3 sm:ml-4 flex-1 min-w-0">
              <div className="flex items-center">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-purple-500 to-purple-700 rounded-lg flex items-center justify-center text-white font-bold mr-3 flex-shrink-0">
                  D
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-gray-900 text-sm sm:text-base">Daviplata</p>
                  <p className="text-xs sm:text-sm text-gray-600">Transferencia bancaria instantánea</p>
                </div>
              </div>
              <div className="mt-3 p-3 bg-purple-50 rounded-lg">
                <p className="text-sm font-medium text-purple-900 mb-2">📱 Proceso de Pago:</p>
                <ol className="text-xs text-purple-800 space-y-1 list-decimal list-inside">
                  <li>Confirmas tu pedido en esta página</li>
                  <li>Hacemos clic en "Confirmar Pedido"</li>
                  <li>WhatsApp se abre con tu pedido ya escrito</li>
                  <li>Envía el mensaje para notificar tu compra</li>
                </ol>
              </div>
            </div>
          </label>

          {/* Efectivo Option */}
          <label className="relative flex items-start p-4 sm:p-6 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-green-400 transition-colors bg-white">
            <input
              type="radio"
              name="paymentMethod"
              value="efectivo"
              checked={formData.paymentMethod === 'efectivo'}
              onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
              className="mt-1 text-green-600 focus:ring-green-500"
            />
            <div className="ml-3 sm:ml-4 flex-1 min-w-0">
              <div className="flex items-center">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-green-500 to-green-700 rounded-lg flex items-center justify-center text-white font-bold mr-3 flex-shrink-0">
                  $
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-gray-900 text-sm sm:text-base">Efectivo</p>
                  <p className="text-xs sm:text-sm text-gray-600">Paga cuando recibas tu pedido</p>
                </div>
              </div>
              <div className="mt-3 p-3 bg-green-50 rounded-lg">
                <p className="text-sm font-medium text-green-900 mb-2">💵 Proceso de Entrega:</p>
                <ol className="text-xs text-green-800 space-y-1 list-decimal list-inside">
                  <li>Confirmas tu pedido en esta página</li>
                  <li>Hacemos clic en "Confirmar Pedido"</li>
                  <li>WhatsApp se abre con tu pedido ya escrito</li>
                  <li>Envía el mensaje para confirmar entrega</li>
                  <li>Paga al recibir tu pedido (dinero exacto si es posible)</li>
                </ol>
              </div>
            </div>
          </label>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        <div className="space-y-3">
          <button
            onClick={handlePaymentSuccess}
            disabled={loading}
            className="w-full bg-gradient-to-r from-yellow-400 to-yellow-600 hover:from-yellow-500 hover:to-yellow-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-verde-bosque-700 font-bold py-4 px-6 rounded-lg transition-all transform hover:scale-105 shadow-lg hover:shadow-xl border-2 border-verde-aguacate"
          >
            {loading ? 'Procesando...' : `Confirmar Pedido - ${formData.paymentMethod === 'daviplata' ? 'Daviplata' : 'Efectivo'}`}
          </button>

          <button
            onClick={() => setStep('info')}
            className="w-full bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 font-medium py-3 px-6 rounded-lg transition-all"
          >
            Volver
          </button>
        </div>

        <div className="text-center">
          <p className="text-xs text-gray-500">
            🚚 Entregas disponibles en Bogotá<br />
            💳 Pagos seguros y protegidos
          </p>
        </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Order Summary */}
          <CheckoutSummary />
        </div>
      </div>
    );
  }

  // Paso 3: Procesamiento de pago
  if (step === 'payment') {
    return (
      <div className="space-y-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold mb-2">Información de Pago</h3>
          <p className="text-sm text-blue-800">
            Procesaremos tu pago de forma segura. Por ahora, haz clic en "Simular Pago Exitoso" para completar tu pedido.
          </p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Total a Pagar</label>
              <div className="text-3xl font-bold text-verde-bosque">
                ${totals.total.toLocaleString('es-CO')} COP
              </div>
            </div>

            <div className="border-t pt-4">
              <p className="text-sm text-gray-600 mb-4">
                Pedido #{orderId.slice(0, 8)}
              </p>
              <p className="text-sm text-gray-600">
                Cliente: {formData.name}<br />
                Email: {formData.email}
              </p>
            </div>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        <button
          onClick={handlePaymentSuccess}
          disabled={loading}
          className="w-full bg-gradient-to-r from-yellow-400 to-yellow-600 hover:from-yellow-500 hover:to-yellow-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-verde-bosque-700 font-bold py-4 px-6 rounded-lg transition-all transform hover:scale-105 shadow-lg hover:shadow-xl border-2 border-verde-aguacate"
        >
          {loading ? 'Procesando...' : `Simular Pago Exitoso - $${totals.total.toLocaleString('es-CO')} COP`}
        </button>

        <button
          onClick={() => setStep('info')}
          className="w-full bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 font-medium py-3 px-6 rounded-lg transition-all"
        >
          Volver
        </button>

        <p className="text-xs text-gray-500 text-center mt-4">
          Nota: Esta es una simulación de pago. En producción se integrará Stripe para pagos reales.
        </p>
      </div>
    );
  }

  // Paso 3: Procesando
  if (step === 'processing') {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-verde-aguacate mx-auto mb-4"></div>
        <h3 className="text-xl font-semibold mb-2">Procesando tu pedido...</h3>
        <p className="text-gray-600">Por favor espera un momento</p>
      </div>
    );
  }

  return null;
}
