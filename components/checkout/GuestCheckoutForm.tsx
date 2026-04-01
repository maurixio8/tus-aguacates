'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useCartStore, type PaymentMethod } from '@/lib/cart-store';
import { supabase } from '@/lib/supabase';
import CouponInput from './CouponInput';
import CheckoutSummary from './CheckoutSummary';
import dynamic from 'next/dynamic';

// Lazy load de modales pesados (framer-motion)
const OrderSuccessModal = dynamic(() => import('./OrderSuccessModal'), {
  ssr: false,
  loading: () => null
});
const DuplicateOrderModal = dynamic(() => import('./DuplicateOrderModal'), {
  ssr: false,
  loading: () => null
});

// Cargar BoldPayButton dinámicamente para evitar errores de SSR
const BoldPayButton = dynamic(() => import('./BoldPayButton'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center py-4">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      <span className="ml-3 text-gray-600">Cargando...</span>
    </div>
  )
});

interface GuestCheckoutFormProps {
  onSuccess: (orderId: string) => void;
}

type CheckoutStep = 'info' | 'payment' | 'payment-method' | 'processing';

export function GuestCheckoutForm({ onSuccess }: GuestCheckoutFormProps) {
  const router = useRouter();
  const { items, getTotal, clearCart, getTotals, calculateShipping, setPaymentMethod } = useCartStore();
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

  // Estados para Modales
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [duplicateOrderInfo, setDuplicateOrderInfo] = useState<{ id: string, time: string } | null>(null);
  const [whatsappUrlForSuccess, setWhatsappUrlForSuccess] = useState('');

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

  // Normalizar teléfono a formato 57XXXXXXXXXX para sync con n8n
  const normalizePhone = (phone: string): string => {
    // Quitar todo excepto números
    const digits = phone.replace(/\D/g, '');
    // Si tiene 10 dígitos y empieza con 3, agregar 57
    if (digits.length === 10 && digits.startsWith('3')) {
      return '57' + digits;
    }
    // Si ya tiene 12 dígitos con 57, retornar tal cual
    if (digits.length === 12 && digits.startsWith('57')) {
      return digits;
    }
    // Retornar con prefijo 57 si no lo tiene
    return digits.startsWith('57') ? digits : '57' + digits;
  };

  // Initialize shipping calculation when component mounts and cart has items
  useEffect(() => {
    // Only calculate shipping if there are items in the cart
    if (items.length > 0) {
      calculateShipping();
    }
  }, [calculateShipping, items.length]);

  // Initialize payment method in store when component mounts
  useEffect(() => {
    const methodMap: Record<string, PaymentMethod> = {
      'bold': 'card_visa_mastercard',
      'daviplata': 'daviplata',
      'nequi': 'nequi',
      'efectivo': 'cash'
    };
    setPaymentMethod(methodMap[formData.paymentMethod] || 'cash');
  }, []);

  const handleSubmitInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // 0. VALIDACIÓN: Verificar si ya existe un pedido hoy con este teléfono
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

      console.log('🔍 Verificando pedidos existentes...', {
        phone: formData.phone,
        today: today
      });

      const { data: existingOrder, error: checkError } = await supabase
        .from('guest_orders')
        .select('id, created_at, status, order_data')
        .eq('guest_phone', formData.phone)
        .gte('created_at', today + 'T00:00:00.000Z')
        .lte('created_at', today + 'T23:59:59.999Z')
        .order('created_at', { ascending: false })
        .limit(1);

      console.log('🔍 Resultado búsqueda pedidos:', {
        error: checkError,
        found: existingOrder ? existingOrder.length : 0,
        orders: existingOrder
      });

      if (checkError) {
        console.error('Error checking existing orders:', checkError);
      } else if (existingOrder && existingOrder.length > 0) {
        const order = existingOrder[0];
        const orderTime = new Date(order.created_at).toLocaleTimeString('es-CO', {
          hour: '2-digit',
          minute: '2-digit'
        });

        // Activar Modal de Duplicado en lugar de lanzar error
        setDuplicateOrderInfo({
          id: order.id,
          time: orderTime
        });
        setShowDuplicateModal(true);
        setLoading(false);
        return; // DETENER EJECUCIÓN AQUÍ
      }

      // 1. Crear pedido de invitado (sin procesar pago aún)
      console.log('🛒 Creando pedido de invitado...', {
        customer: formData.name,
        email: formData.email,
        phone: formData.phone,
        items: items.length,
        total: totals.total
      });

      const orderData = {
        items: items.map(item => ({
          productName: item.product.name,
          productId: item.product.id,
          variantName: item.variant?.variant_value || null,
          variantType: item.variant?.variant_name || null,
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

      console.log('📦 Order data prepared:', orderData);

      const { data: guestOrder, error: orderError } = await supabase
        .from('guest_orders')
        .insert({
          guest_name: formData.name,
          guest_email: formData.email,
          guest_phone: normalizePhone(formData.phone),
          guest_address: formData.address,
          order_data: orderData,
          total_amount: totals.total,
          status: 'pendiente',
          payment_status: 'pendiente',
          delivery_date: null, // No requerido en checkout rápido
        })
        .select()
        .single();

      console.log('💾 Insert result:', {
        success: !orderError,
        error: orderError,
        data: guestOrder ? `ID: ${guestOrder.id}` : 'No data'
      });

      if (orderError) {
        console.error('❌ ERROR al crear pedido de invitado:', orderError);
        throw orderError;
      }

      console.log('✅ Pedido de invitado creado exitosamente:', guestOrder.id);

      // Guardar order ID y pasar al paso de método de pago
      setOrderId(guestOrder.id);
      setStep('payment-method');

    } catch (err: any) {
      console.error('Error al crear pedido:', err);
      setError(extractErrorMessage(err));
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

      // Generar mensaje para WhatsApp (como si el cliente lo escribiera - tono natural)
      const firstName = formData.name.split(' ')[0];

      let mensajeWhatsApp = `¡Hola! 👋

Acabo de hacer un pedido en su tienda:
🔗 https://tus-aguacates.vercel.app

📦 *Mi pedido:*
${orderData.items.map(item => `• ${item.quantity}x ${item.productName}${item.variantName ? ` (${item.variantName})` : ''} - $${item.price.toLocaleString('es-CO')}`).join('\n')}`;

      // Add breakdown if there's discount or shipping
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
• Nombre: ${firstName}
• Teléfono: ${formData.phone}
• Dirección: ${formData.address}

💳 *Pago:* ${formData.paymentMethod === 'efectivo' ? 'Efectivo contra entrega' : formData.paymentMethod === 'nequi' ? 'Nequi' : formData.paymentMethod === 'daviplata' ? 'Daviplata' : 'Tarjeta/PSE'}`;

      // Agregar datos de transferencia SOLO para Nequi/Daviplata
      if (formData.paymentMethod === 'nequi' || formData.paymentMethod === 'daviplata') {
        mensajeWhatsApp += `\n\n📱 *Para transferir:* 320 306 2007`;
      }

      mensajeWhatsApp += `\n\n¡Quedo atento(a) a la confirmación! 🙏`;

      // 3. MOSTRAR MODAL DE ÉXITO (Reemplaza alert)
      const whatsappUrl = `https://wa.me/573042582777?text=${encodeURIComponent(mensajeWhatsApp)}`;
      setWhatsappUrlForSuccess(whatsappUrl);
      setShowSuccessModal(true);

      // No redirigimos automáticamente a WhatsApp, dejamos que el usuario lo haga desde el modal
      // window.location.href = whatsappUrl;

      // 5. Actualizar estado del pedido con método de pago
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

      // --- INTEGRACIÓN N8N (Invitado): Enviar pedido ---
      try {
        fetch('/api/webhooks/n8n-order-sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderId: orderId,
            orderData: orderData,
            customer: {
              name: formData.name,
              phone: formData.phone,
              address: formData.address,
              email: formData.email,
              isGuest: true
            },
            payment: {
              method: formData.paymentMethod,
              total: totals.total,
              status: paymentStatus
            },
            formattedMessage: mensajeWhatsApp
          })
        }).catch(err => console.error('Error silencioso enviando a n8n:', err));
      } catch (e) {
        console.warn('No se pudo iniciar sync con n8n');
      }
      // -------------------------------------------------

      // 6. Opcional: crear cuenta si el usuario lo solicitó
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

      // 7. NO limpiar carrito todavía. Se limpia cuando el usuario cierra el modal o va a WhatsApp
      // Si limpiamos aquí, el efecto del padre (CheckoutPage) redirige a /productos inmediatamente

    } catch (err: any) {
      console.error('Error al finalizar pedido:', err);
      setError(extractErrorMessage(err));
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
          guest_phone: normalizePhone(formData.phone),
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

      // 2. Generar mensaje de WhatsApp pre-formateado para pedido contra entrega (tono natural)
      const firstName = formData.name.split(' ')[0];

      let mensajeWhatsApp = `¡Hola! 👋

Acabo de hacer un pedido en su tienda:
🔗 https://tus-aguacates.vercel.app

📦 *Mi pedido:*
${orderData.items.map(item => `• ${item.quantity}x ${item.productName}${item.variantName ? ` (${item.variantName})` : ''} - $${item.price.toLocaleString('es-CO')}`).join('\n')}`;

      // Add breakdown if there's discount or shipping
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
• Tel: ${formData.phone}
• Dirección: ${formData.address}

💳 *Pago:* Efectivo contra entrega

¡Quedo atenta a la confirmación! 🙏`;

      // 3. MOSTRAR MODAL DE ÉXITO (Reemplaza alert)
      const whatsappUrl = `https://wa.me/573042582777?text=${encodeURIComponent(mensajeWhatsApp)}`;
      setWhatsappUrlForSuccess(whatsappUrl);
      setShowSuccessModal(true);

      // No abrimos WhatsApp automáticamente, el usuario debe dar click
      // window.open(whatsappUrl, '_blank');

      // 5. Actualizar estado del pedido
      await supabase
        .from('guest_orders')
        .update({
          status: 'confirmado',
          payment_status: 'pendiente_pago',
          payment_method: 'efectivo',
          whatsapp_message: mensajeWhatsApp,
          whatsapp_sent: true
        })
        .eq('id', guestOrder.id);

      // --- INTEGRACIÓN N8N (Efectivo): Enviar pedido ---
      try {
        fetch('/api/webhooks/n8n-order-sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderId: guestOrder.id,
            orderData: orderData,
            customer: {
              name: formData.name,
              phone: formData.phone,
              address: formData.address,
              email: formData.email,
              isGuest: true
            },
            payment: {
              method: 'efectivo',
              total: totals.total,
              status: 'pendiente_pago'
            },
            formattedMessage: mensajeWhatsApp
          })
        }).catch(err => console.error('Error silencioso enviando a n8n:', err));
      } catch (e) {
        console.warn('No se pudo iniciar sync con n8n');
      }
      // -------------------------------------------------

      // 6. NO limpiar carrito todavía. Se limpia cuando el usuario cierra el modal o va a WhatsApp
      // Si limpiamos aquí, el efecto del padre (CheckoutPage) redirige a /productos inmediatamente

    } catch (err: any) {
      console.error('Error al crear pedido:', err);
      setError(extractErrorMessage(err));
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
          <div className="max-w-md mx-auto flex justify-center bg-gradient-to-r from-green-600 to-green-700 rounded-lg p-4">
            <Image
              src="https://i.ibb.co/WWj50Qdy/logo.png"
              alt="Tus Aguacates - Logo"
              width={200}
              height={70}
              priority
              className="object-contain"
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

                    {/* Mensaje informativo sobre política de pedidos */}
                    <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm text-blue-800">
                            <span className="font-semibold">Política de pedidos:</span> Por seguridad, permitimos <strong>1 pedido por día por número de teléfono</strong>. Si necesitas modificar tu pedido, por favor regístrate con tu email.
                          </p>
                        </div>
                      </div>
                    </div>

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
                        <label className="block text-sm font-medium mb-1">Email (opcional)</label>
                        <input
                          type="email"
                          name="email"
                          inputMode="email"
                          autoComplete="email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-verde-aguacate"
                          placeholder="ejemplo@correo.com"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-1">Teléfono *</label>
                        <input
                          type="tel"
                          required
                          value={formData.phone}
                          onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, '');
                            if (val.length <= 10) {
                              setFormData({ ...formData, phone: val });
                            }
                          }}
                          placeholder="300 123 4567 (10 dígitos)"
                          pattern="3[0-9]{9}"
                          title="Debe ser un número celular de 10 dígitos iniciando en 3"
                          maxLength={10}
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
                      {loading ? 'Procesando...' : 'Continuar con mi pedido'}
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
      </div>
    );
  }

  // Paso 2: Selección de método de pago
  if (step === 'payment-method') {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Logo Header */}
        <div className="bg-white border-b border-gray-200 py-4">
          <div className="max-w-md mx-auto flex justify-center bg-gradient-to-r from-green-600 to-green-700 rounded-lg p-4">
            <Image
              src="https://i.ibb.co/WWj50Qdy/logo.png"
              alt="Tus Aguacates - Logo"
              width={200}
              height={70}
              priority
              className="object-contain"
            />
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-green-900">📋 Último paso: Elige cómo pagar</h3>
                  <p className="text-sm text-green-700 mt-1">
                    Pedido #{orderId.slice(0, 8)} • {formData.name}
                  </p>
                </div>

                <div className="space-y-3">
                  <h4 className="font-medium text-gray-900">¿Cómo prefieres pagar?</h4>

                   {/* Payment Method Buttons */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {/* Bold - Tarjeta/PSE */}
                    <button
                      type="button"
                      onClick={() => {
                        setFormData({ ...formData, paymentMethod: 'bold' });
                        setPaymentMethod('card_visa_mastercard');
                      }}
                      className={`p-3 rounded-lg border-2 transition-all flex flex-col items-center gap-1 ${formData.paymentMethod === 'bold'
                        ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                        : 'border-gray-200 hover:border-blue-300'
                        }`}
                    >
                      {/* Icono de Tarjeta con PSE */}
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-700 rounded-lg flex items-center justify-center">
                        <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z" />
                        </svg>
                      </div>
                      <span className="text-xs font-medium">Tarjeta/PSE</span>
                    </button>

                    {/* Daviplata */}
                    <button
                      type="button"
                      onClick={() => {
                        setFormData({ ...formData, paymentMethod: 'daviplata' });
                        setPaymentMethod('daviplata');
                      }}
                      className={`p-3 rounded-lg border-2 transition-all flex flex-col items-center gap-1 ${formData.paymentMethod === 'daviplata'
                        ? 'border-red-500 bg-red-50'
                        : 'border-gray-200 hover:border-red-300'
                        }`}
                    >
                      {/* Logo Daviplata - D estilizada roja */}
                      <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-700 rounded-lg flex items-center justify-center">
                        <span className="text-white font-black text-lg" style={{ fontFamily: 'Arial Black, sans-serif' }}>D</span>
                      </div>
                      <span className="text-xs font-medium">Daviplata</span>
                    </button>

                    {/* Nequi */}
                    <button
                      type="button"
                      onClick={() => {
                        setFormData({ ...formData, paymentMethod: 'nequi' });
                        setPaymentMethod('nequi');
                      }}
                      className={`p-3 rounded-lg border-2 transition-all flex flex-col items-center gap-1 ${formData.paymentMethod === 'nequi'
                        ? 'border-pink-500 bg-pink-50'
                        : 'border-gray-200 hover:border-pink-300'
                        }`}
                    >
                      {/* Logo Nequi - N estilizada fucsia/morada */}
                      <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-fuchsia-600 rounded-lg flex items-center justify-center">
                        <span className="text-white font-black text-lg" style={{ fontFamily: 'Arial Black, sans-serif' }}>N</span>
                      </div>
                      <span className="text-xs font-medium">Nequi</span>
                    </button>

                    {/* Efectivo */}
                    <button
                      type="button"
                      onClick={() => {
                        setFormData({ ...formData, paymentMethod: 'efectivo' });
                        setPaymentMethod('cash');
                      }}
                      className={`p-3 rounded-lg border-2 transition-all flex flex-col items-center gap-1 ${formData.paymentMethod === 'efectivo'
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200 hover:border-green-300'
                        }`}
                    >
                      {/* Icono de Billete/Efectivo */}
                      <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-700 rounded-lg flex items-center justify-center">
                        <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1.41 16.09V20h-2.67v-1.93c-1.71-.36-3.16-1.46-3.27-3.4h1.96c.1 1.05.82 1.87 2.65 1.87 1.96 0 2.4-.98 2.4-1.59 0-.83-.44-1.61-2.67-2.14-2.48-.6-4.18-1.62-4.18-3.67 0-1.72 1.39-2.84 3.11-3.21V4h2.67v1.95c1.86.45 2.79 1.86 2.85 3.39H14.3c-.05-1.11-.64-1.87-2.22-1.87-1.5 0-2.4.68-2.4 1.64 0 .84.65 1.39 2.67 1.91s4.18 1.39 4.18 3.91c-.01 1.83-1.38 2.83-3.12 3.16z" />
                        </svg>
                      </div>
                      <span className="text-xs font-medium">Efectivo</span>
                    </button>
                  </div>

                  {error && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                      {error}
                    </div>
                  )}

                  <div className="space-y-3">
                    {/* Mostrar BoldPayButton o botón normal según el método seleccionado */}
                    {formData.paymentMethod === 'bold' ? (
                      <>
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                          <p className="text-sm text-blue-800">
                            💳 Paga con tarjeta de crédito, débito, PSE o Nequi de forma segura.
                          </p>
                        </div>
                        {orderId && totals.total > 0 && (
                          <BoldPayButton
                            orderId={orderId}
                            amount={totals.total}
                            description={`Pedido #${orderId.slice(-8)}`}
                            customerEmail={formData.email}
                            customerName={formData.name}
                            customerPhone={formData.phone}
                            customerAddress={formData.address}
                          />
                        )}
                      </>
                    ) : (
                      <>
                        <button
                          onClick={handlePaymentSuccess}
                          disabled={loading}
                          className="w-full bg-gradient-to-r from-yellow-400 to-yellow-600 hover:from-yellow-500 hover:to-yellow-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-verde-bosque-700 font-bold py-4 px-6 rounded-lg transition-all transform hover:scale-105 shadow-lg hover:shadow-xl border-2 border-verde-aguacate"
                        >
                          {loading ? 'Procesando...' : `Confirmar Pedido`}
                        </button>
                      </>
                    )}

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
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Order Summary */}
                <CheckoutSummary />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Paso 3: Procesamiento de pago
  if (step === 'payment') {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Logo Header */}
        <div className="bg-white border-b border-gray-200 py-4">
          <div className="max-w-md mx-auto flex justify-center bg-gradient-to-r from-green-600 to-green-700 rounded-lg p-4">
            <Image
              src="https://i.ibb.co/WWj50Qdy/logo.png"
              alt="Tus Aguacates - Logo"
              width={200}
              height={70}
              priority
              className="object-contain"
            />
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
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
          </div>
        </div>
      </div>
    );
  }

  // Paso 3: Procesando
  if (step === 'processing') {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Logo Header */}
        <div className="bg-white border-b border-gray-200 py-4">
          <div className="max-w-md mx-auto flex justify-center bg-gradient-to-r from-green-600 to-green-700 rounded-lg p-4">
            <Image
              src="https://i.ibb.co/WWj50Qdy/logo.png"
              alt="Tus Aguacates - Logo"
              width={200}
              height={70}
              priority
              className="object-contain"
            />
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          <div className="max-w-md mx-auto">
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-verde-aguacate mx-auto mb-4"></div>
              <h3 className="text-xl font-semibold mb-2">Procesando tu pedido...</h3>
              <p className="text-gray-600">Por favor espera un momento</p>
            </div>
          </div>
        </div>

        {/* Modal de Éxito - Visible incluso en processing */}
        <OrderSuccessModal
          isOpen={showSuccessModal}
          onClose={() => {
            clearCart();
            setShowSuccessModal(false);
            window.location.href = '/tienda';
          }}
          orderId={orderId}
          customerName={formData.name}
          total={totals.total}
          paymentMethod={formData.paymentMethod}
          whatsappUrl={whatsappUrlForSuccess}
        />
      </div>
    );
  }

  return null;
}
