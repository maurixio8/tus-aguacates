'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCartStore, type PaymentMethod } from '@/lib/cart-store';
import { supabase } from '@/lib/supabase';
import type { Address, Profile } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { getPersonalizedGreeting } from '@/lib/greetings';
import { AddressSelector } from './AddressSelector';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import CheckoutSummary from './CheckoutSummary';
import CouponInput from './CouponInput';
import dynamic from 'next/dynamic';

// Cargar BoldPayButton dinámicamente para evitar errores de SSR
const BoldPayButton = dynamic(() => import('./BoldPayButton'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center py-4">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      <span className="ml-3 text-gray-600">Cargando...</span>
    </div>
  ),
});
import {
  User,
  Mail,
  Phone,
  MapPin,
  CheckCircle,
  Edit,
  CreditCard,
  Clock,
  ArrowRight,
  Repeat,
  Check
} from 'lucide-react';
import { SubscriptionConfigModal } from './SubscriptionConfigModal';
import DuplicateOrderModal from './DuplicateOrderModal';

interface EnhancedAuthenticatedCheckoutFormProps {
  onSuccess: (orderId: string) => void;
  profile: Profile | null;
}

type CheckoutStep = 'review' | 'address' | 'payment-method' | 'processing';

export function EnhancedAuthenticatedCheckoutForm({
  onSuccess,
  profile
}: EnhancedAuthenticatedCheckoutFormProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { items, getTotal, clearCart, getTotals, calculateShipping, setPaymentMethod: setStorePaymentMethod } = useCartStore();
  const totals = getTotals();

  const [step, setStep] = useState<CheckoutStep>('review');
  const [orderId, setOrderId] = useState<string>('');
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [paymentMethod, setLocalPaymentMethod] = useState<'daviplata' | 'nequi' | 'efectivo' | 'bold'>('daviplata');
  const [userAddresses, setUserAddresses] = useState<Address[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [editingPersonalInfo, setEditingPersonalInfo] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [personalInfo, setPersonalInfo] = useState({
    full_name: '',
    preferred_name: '',
    phone: '',
    email: ''
  });

  // Estado para modal de pedido duplicado (usuarios autenticados)
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [duplicateOrderInfo, setDuplicateOrderInfo] = useState<{ id: string, time: string } | null>(null);


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

  // Validar formato de teléfono colombiano
  const validatePhone = (phone: string): { valid: boolean; message: string } => {
    const digits = phone.replace(/\D/g, '');
    
    if (!digits) {
      return { valid: false, message: 'El número de teléfono es requerido' };
    }
    
    if (digits.length < 10) {
      return { valid: false, message: 'El número debe tener al menos 10 dígitos' };
    }
    
    if (digits.length > 13) {
      return { valid: false, message: 'El número no puede tener más de 13 dígitos' };
    }
    
    // Verificar que sea un número móvil colombiano (empieza con 3 después del 57)
    const cleanNumber = digits.startsWith('57') ? digits : '57' + digits;
    if (cleanNumber.length === 12 && !cleanNumber.startsWith('573')) {
      return { valid: false, message: 'Los números colombianos deben empezar con 3 (ej: 300, 310, 320)' };
    }
    
    return { valid: true, message: '' };
  };

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
    // Only calculate shipping if there are items in the cart
    if (items.length > 0) {
      calculateShipping();
    }
  }, [calculateShipping, items.length]);

  // Load user data and preferences
  useEffect(() => {
    if (user && profile) {
      // Set personal info from profile
      setPersonalInfo({
        full_name: profile.full_name || '',
        preferred_name: profile.preferred_name || '',
        phone: profile.phone || '',
        email: user.email || ''
      });

      // Set preferred payment method (validar que sea un método conocido)
      const validMethods = ['daviplata', 'nequi', 'efectivo', 'bold'] as const;
      if (profile.preferred_payment_method && validMethods.includes(profile.preferred_payment_method as any)) {
        setLocalPaymentMethod(profile.preferred_payment_method as 'daviplata' | 'nequi' | 'efectivo' | 'bold');
        const methodMap: Record<string, PaymentMethod> = {
          'daviplata': 'daviplata',
          'nequi': 'nequi',
          'efectivo': 'cash',
          'bold': 'card_visa_mastercard'
        };
        setStorePaymentMethod(methodMap[profile.preferred_payment_method] || 'cash');
      }

      // Load addresses
      loadAddresses();
    }
  }, [user, profile]);

  // Recalculate shipping when address changes
  useEffect(() => {
    if (selectedAddress && items.length > 0) {
      calculateShipping(selectedAddress.city);
    }
  }, [selectedAddress, calculateShipping, items.length]);

  const loadAddresses = async () => {
    try {
      const { data, error } = await supabase
        .from('addresses')
        .select('*')
        .eq('user_id', user!.id)
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;

      const addressList = data || [];
      setUserAddresses(addressList);

      // Auto-select default address or first address
      if (addressList.length > 0) {
        const defaultAddress = addressList.find(a => a.is_default) || addressList[0];
        setSelectedAddress(defaultAddress);
      }
    } catch (err) {
      console.error('Error loading addresses:', err);
    }
  };

  const handleSavePersonalInfo = async () => {
    if (!user) return;

    // Validar teléfono antes de guardar
    const phoneValidation = validatePhone(personalInfo.phone);
    if (!phoneValidation.valid) {
      setError(phoneValidation.message);
      return;
    }

    try {
      // Normalizar teléfono antes de guardar
      const normalizedPhone = normalizePhone(personalInfo.phone);
      
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: personalInfo.full_name,
          preferred_name: personalInfo.preferred_name,
          phone: normalizedPhone,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) throw error;

      setEditingPersonalInfo(false);
      // Actualizar el estado local con el teléfono normalizado
      setPersonalInfo({ ...personalInfo, phone: normalizedPhone });
    } catch (err) {
      console.error('Error saving personal info:', err);
      setError('Error al guardar información personal');
    }
  };

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

    // VALIDACIÓN: Verificar si ya existe un pedido hoy para este usuario autenticado
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    console.log('🔍 Verificando pedidos existentes para usuario autenticado...', {
      userId: user.id,
      today: today
    });

    const { data: existingOrder, error: checkError } = await supabase
      .from('orders')
      .select('id, created_at, status, order_data')
      .eq('user_id', user.id)
      .gte('created_at', today + 'T00:00:00.000Z')
      .lte('created_at', today + 'T23:59:59.999Z')
      .order('created_at', { ascending: false })
      .limit(1);

    console.log('🔍 Resultado búsqueda pedidos autenticados:', {
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

    // Para Bold, NO cambiar a processing - quedarse en payment-method para mostrar BoldPayButton
    if (paymentMethod !== 'bold') {
      setStep('processing');
    }
    try {
      // Save payment preference
      await supabase
        .from('profiles')
        .update({
          preferred_payment_method: paymentMethod,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

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

      // Mapear payment_method a valor válido para la BD
      // La BD puede tener constraint que solo acepta ciertos valores
      const dbPaymentMethod = paymentMethod === 'bold' ? 'tarjeta' : paymentMethod;

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
          payment_method: dbPaymentMethod,
          status: 'pendiente',
          payment_status: paymentMethod === 'bold' ? 'pendiente' : paymentMethod === 'daviplata' ? 'pagado' : 'pendiente',
          coupon_code: useCartStore.getState().appliedCoupon?.code || null,
        })
        .select()
        .single();

      if (orderError) throw orderError;

      const createdOrderId = order.id;
      setOrderId(createdOrderId);

      // 2. Crear mensaje de WhatsApp
      let mensajeWhatsApp = `🥑 *Nuevo Pedido - Tus Aguacates*

*Cliente:* ${selectedAddress.full_name}
*Teléfono:* ${selectedAddress.phone}
*Email:* ${user.email}
*Dirección:* ${selectedAddress.street_address}, ${selectedAddress.city}
${selectedAddress.additional_info ? `*Referencias:* ${selectedAddress.additional_info}\n` : ''}
*Pedido:*
${orderData.items.map(item => `• ${item.quantity}x ${item.productName} ${item.variantName ? `(${item.variantName})` : ''} - $${item.price.toLocaleString('es-CO')}`).join('\n')}`;

      // Add breakdown
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

*Método de pago:* ${paymentMethod === 'efectivo' ? 'Efectivo' : paymentMethod === 'nequi' ? 'Nequi' : paymentMethod === 'bold' ? 'Tarjeta/PSE' : 'Daviplata'}

¡Gracias por tu compra! 🥑`;

      // Agregar datos de transferencia al mensaje de WhatsApp para Nequi/Daviplata
      if (paymentMethod === 'nequi' || paymentMethod === 'daviplata') {
        mensajeWhatsApp = mensajeWhatsApp.replace('*Método de pago:*', `*Método de pago:*`) + `\n📱 *Para transferir:* 320 306 2007`;
      }

      // Para Bold: NO redirigir a WhatsApp, el usuario debe pagar primero con Bold
      if (paymentMethod === 'bold') {
        // Solo actualizar el pedido y esperar a que el usuario pague con Bold
        // El BoldPayButton se mostrará porque orderId ya está establecido
        setLoading(false);
        return; // No continuar con el flujo normal
      }

      // 3. Redirigir a WhatsApp (usamos location.href para evitar bloqueo de popups)
      const whatsappUrl = `https://wa.me/573042582777?text=${encodeURIComponent(mensajeWhatsApp)}`;
      window.location.href = whatsappUrl;

      // 4. Actualizar pedido con info de WhatsApp
      await supabase
        .from('orders')
        .update({
          whatsapp_message: mensajeWhatsApp,
          whatsapp_sent: true,
          status: paymentMethod === 'efectivo' ? 'pendiente_entrega' : 'pagado',
        })
        .eq('id', createdOrderId);

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

  const handleCreateSubscription = () => {
    if (!selectedAddress) {
      setError('Debes seleccionar una dirección para crear una suscripción');
      return;
    }
  };

  const handleSubscriptionCreated = () => {
    // Callback cuando se crea una suscripción exitosamente
    clearCart();
  };



  const displayName = profile?.preferred_name || profile?.full_name || user?.email?.split('@')[0];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Left Column - Checkout Form */}
      <div className="lg:col-span-2 space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* Personalized Welcome */}
        <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                <User className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-green-900">
                  {getPersonalizedGreeting(profile, user, {
                    includeTimeGreeting: true,
                    customMessage: 'ya hemos preparado tu información'
                  })}
                </h2>
                <p className="text-green-700 text-sm">
                  Tu experiencia de compra será rápida y sin fricción
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Step Indicator */}
        <div className="flex items-center justify-center space-x-4 mb-8">
          <div className={`flex items-center ${step === 'review' || step === 'address' ? 'text-primary font-semibold' : 'text-muted-foreground'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${step === 'review' || step === 'address' ? 'border-primary bg-primary text-white' : 'border-gray-300'}`}>
              1
            </div>
            <span className="ml-2 hidden sm:inline">Revisión</span>
          </div>
          <div className="w-12 h-0.5 bg-gray-300"></div>
          <div className={`flex items-center ${step === 'payment-method' || step === 'processing' ? 'text-primary font-semibold' : 'text-muted-foreground'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${step === 'payment-method' || step === 'processing' ? 'border-primary bg-primary text-white' : 'border-gray-300'}`}>
              2
            </div>
            <span className="ml-2 hidden sm:inline">Pago</span>
          </div>
        </div>

        {/* Step 1: Review Information */}
        {step === 'review' && (
          <>
            {/* Personal Information Card */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <User className="w-5 h-5" />
                      Información Personal
                    </CardTitle>
                    <CardDescription>
                      Tus datos precargados para compra rápida
                    </CardDescription>
                  </div>
                  {!editingPersonalInfo && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingPersonalInfo(true)}
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      Editar
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {editingPersonalInfo ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Nombre Preferido</label>
                        <input
                          type="text"
                          value={personalInfo.preferred_name}
                          onChange={(e) => setPersonalInfo({ ...personalInfo, preferred_name: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                          placeholder="Cómo te gustas que te llamemos"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Nombre Completo</label>
                        <input
                          type="text"
                          value={personalInfo.full_name}
                          onChange={(e) => setPersonalInfo({ ...personalInfo, full_name: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                          placeholder="Tu nombre completo"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Email</label>
                        <input
                          type="email"
                          value={personalInfo.email}
                          onChange={(e) => setPersonalInfo({ ...personalInfo, email: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                          placeholder="tu@email.com"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Teléfono</label>
                        <input
                          type="tel"
                          value={personalInfo.phone}
                          onChange={(e) => setPersonalInfo({ ...personalInfo, phone: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                          placeholder="3001234567"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={handleSavePersonalInfo} size="sm">
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Guardar
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setEditingPersonalInfo(false)}
                        size="sm"
                      >
                        Cancelar
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <p className="font-medium text-green-700">
                      {displayName} - Datos confirmados
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Address Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Dirección de Entrega
                </CardTitle>
                <CardDescription>
                  {selectedAddress
                    ? `Dirección seleccionada: ${selectedAddress.label}`
                    : 'Selecciona una dirección para continuar'
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                {selectedAddress ? (
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium">{selectedAddress.label}</p>
                          {selectedAddress.is_default && (
                            <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded">
                              Por defecto
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">{selectedAddress.full_name}</p>
                        <p className="text-sm">{selectedAddress.street_address}</p>
                        <p className="text-sm">{selectedAddress.city}, {selectedAddress.state}</p>
                        <p className="text-sm">Tel: {selectedAddress.phone}</p>
                        {selectedAddress.additional_info && (
                          <p className="text-sm text-gray-500 italic mt-1">
                            {selectedAddress.additional_info}
                          </p>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => setStep('address')}
                      className="w-full"
                    >
                      Cambiar dirección
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-600 mb-4">No tienes direcciones guardadas</p>
                    <Button onClick={() => setStep('address')}>
                      Agregar dirección
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Método de Pago - Grid de botones */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <CreditCard className="w-5 h-5" />
                  ¿Cómo prefieres pagar?
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2">
                  {/* Tarjeta/PSE */}
                  <button
                    type="button"
                    onClick={() => {
                      setLocalPaymentMethod('bold');
                      setStorePaymentMethod('card_visa_mastercard');
                    }}
                    className={`p-3 rounded-lg border-2 transition-all flex flex-col items-center gap-1 ${paymentMethod === 'bold'
                      ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                      : 'border-gray-200 hover:border-blue-300'
                      }`}
                  >
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-700 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z" />
                      </svg>
                    </div>
                    <span className="text-xs font-medium">Tarjeta/PSE</span>
                  </button>

                  {/* Daviplata */}
                  <button
                    type="button"
                    onClick={() => {
                      setLocalPaymentMethod('daviplata');
                      setStorePaymentMethod('daviplata');
                    }}
                    className={`p-3 rounded-lg border-2 transition-all flex flex-col items-center gap-1 ${paymentMethod === 'daviplata'
                      ? 'border-red-500 bg-red-50'
                      : 'border-gray-200 hover:border-red-300'
                      }`}
                  >
                    <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-red-700 rounded-lg flex items-center justify-center">
                      <span className="text-white font-black text-sm">D</span>
                    </div>
                    <span className="text-xs font-medium">Daviplata</span>
                  </button>

                  {/* Nequi */}
                  <button
                    type="button"
                    onClick={() => {
                      setLocalPaymentMethod('nequi');
                      setStorePaymentMethod('nequi');
                    }}
                    className={`p-3 rounded-lg border-2 transition-all flex flex-col items-center gap-1 ${paymentMethod === 'nequi'
                      ? 'border-pink-500 bg-pink-50'
                      : 'border-gray-200 hover:border-pink-300'
                      }`}
                  >
                    <div className="w-8 h-8 bg-gradient-to-br from-pink-500 to-fuchsia-600 rounded-lg flex items-center justify-center">
                      <span className="text-white font-black text-sm">N</span>
                    </div>
                    <span className="text-xs font-medium">Nequi</span>
                  </button>

                  {/* Efectivo */}
                  <button
                    type="button"
                    onClick={() => {
                      setLocalPaymentMethod('efectivo');
                      setStorePaymentMethod('cash');
                    }}
                    className={`p-3 rounded-lg border-2 transition-all flex flex-col items-center gap-1 ${paymentMethod === 'efectivo'
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200 hover:border-green-300'
                      }`}
                  >
                    <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-green-700 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1.41 16.09V20h-2.67v-1.93c-1.71-.36-3.16-1.46-3.27-3.4h1.96c.1 1.05.82 1.87 2.65 1.87 1.96 0 2.4-.98 2.4-1.59 0-.83-.44-1.61-2.67-2.14-2.48-.6-4.18-1.62-4.18-3.67 0-1.72 1.39-2.84 3.11-3.21V4h2.67v1.95c1.86.45 2.79 1.86 2.85 3.39H14.3c-.05-1.11-.64-1.87-2.22-1.87-1.5 0-2.4.68-2.4 1.64 0 .84.65 1.39 2.67 1.91s4.18 1.39 4.18 3.91c-.01 1.83-1.38 2.83-3.12 3.16z" />
                      </svg>
                    </div>
                    <span className="text-xs font-medium">Efectivo</span>
                  </button>
                </div>
              </CardContent>
            </Card>

            <button
              onClick={handleContinueToPayment}
              disabled={!selectedAddress}
              className="w-full bg-gradient-to-r from-yellow-400 to-yellow-600 hover:from-yellow-500 hover:to-yellow-700 text-verde-bosque-700 font-bold py-4 rounded-xl transition-all shadow-lg hover:shadow-xl transform hover:scale-[1.02] border-2 border-verde-aguacate disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
            >
              Continuar con mi pedido
              <ArrowRight className="w-5 h-5" />
            </button>
          </>
        )}

        {/* Step 2: Address Selection */}
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

        {/* Step 3: Payment Method */}
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

                {/* Nequi Option */}
                <div
                  className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${paymentMethod === 'nequi'
                    ? 'border-pink-500 bg-pink-50'
                    : 'border-gray-200 hover:border-pink-300'
                    }`}
                  onClick={() => {
                    setLocalPaymentMethod('nequi');
                    setStorePaymentMethod('nequi');
                  }}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="nequi"
                      checked={paymentMethod === 'nequi'}
                      onChange={() => {
                        setLocalPaymentMethod('nequi');
                        setStorePaymentMethod('nequi');
                      }}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-pink-500 to-fuchsia-600 rounded-lg flex items-center justify-center">
                          <span className="text-white font-black text-sm">N</span>
                        </div>
                        <h3 className="font-semibold text-lg">Nequi</h3>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        Transferencia instantánea desde Nequi
                      </p>
                    </div>
                  </div>
                </div>

                {/* Bold - Tarjeta/PSE Option */}
                <div
                  className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${paymentMethod === 'bold'
                    ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                    : 'border-gray-200 hover:border-blue-300'
                    }`}
                  onClick={() => {
                    setLocalPaymentMethod('bold');
                    setStorePaymentMethod('card_visa_mastercard');
                  }}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="bold"
                      checked={paymentMethod === 'bold'}
                      onChange={() => {
                        setLocalPaymentMethod('bold');
                        setStorePaymentMethod('card_visa_mastercard');
                      }}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-700 rounded-lg flex items-center justify-center">
                          <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z" />
                          </svg>
                        </div>
                        <h3 className="font-semibold text-lg">Tarjeta/PSE</h3>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        Paga con tarjeta de crédito, débito o PSE
                      </p>
                    </div>
                  </div>
                </div>

                {/* Botones de acción */}
                <div className="flex gap-3 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setStep('review')}
                    disabled={loading}
                  >
                    Volver
                  </Button>

                  {/* Mostrar BoldPayButton si seleccionó Bold, sino botón normal */}
                  {paymentMethod === 'bold' && orderId ? (
                    <div className="flex-1">
                      <BoldPayButton
                        orderId={orderId}
                        amount={totals.total}
                        description={`Pedido #${orderId.slice(-8)}`}
                        customerEmail={user?.email || ''}
                        customerName={selectedAddress?.full_name || ''}
                        customerPhone={selectedAddress?.phone || ''}
                        customerAddress={selectedAddress?.street_address || ''}
                      />
                    </div>
                  ) : paymentMethod === 'bold' ? (
                    <button
                      onClick={handleConfirmOrder}
                      disabled={loading}
                      className="flex-1 bg-gradient-to-r from-yellow-400 to-yellow-600 hover:from-yellow-500 hover:to-yellow-700 text-verde-bosque-700 font-bold py-4 px-6 rounded-xl transition-all shadow-lg hover:shadow-xl transform hover:scale-[1.02] border-2 border-verde-aguacate disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? 'Procesando...' : 'Preparar pago con Bold'}
                    </button>
                  ) : (
                    <button
                      onClick={handleConfirmOrder}
                      disabled={loading}
                      className="flex-1 bg-gradient-to-r from-yellow-400 to-yellow-600 hover:from-yellow-500 hover:to-yellow-700 text-verde-bosque-700 font-bold py-4 px-6 rounded-xl transition-all shadow-lg hover:shadow-xl transform hover:scale-[1.02] border-2 border-verde-aguacate disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? 'Procesando...' : `Confirmar Pedido - ${paymentMethod === 'daviplata' ? 'Daviplata' :
                        paymentMethod === 'nequi' ? 'Nequi' : 'Efectivo'
                        }`}
                    </button>
                  )}
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* Step 4: Processing */}
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

          {/* Quick Info */}
        </div>
      </div>

      {/* Modal de pedido duplicado para usuarios autenticados */}
      <DuplicateOrderModal
        isOpen={showDuplicateModal}
        onClose={() => setShowDuplicateModal(false)}
        existingOrderId={duplicateOrderInfo?.id || ''}
        existingOrderTime={duplicateOrderInfo?.time || ''}
        customerName={profile?.full_name || profile?.preferred_name || 'Cliente'}
      />

      {/* Modal de Configuración de Suscripción */}
      <SubscriptionConfigModal
        isOpen={showSubscriptionModal}
        onClose={() => setShowSubscriptionModal(false)}
        selectedAddress={selectedAddress}
        paymentMethod={paymentMethod === 'efectivo' ? 'efectivo' : 'daviplata'}
        onSubscriptionCreated={handleSubscriptionCreated}
      />
    </div>
  );
}