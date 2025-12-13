'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/lib/cart-store';
import { supabase } from '@/lib/supabase';
import type { Address, Profile } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { getPersonalizedGreeting } from '@/lib/greetings';
import { AddressSelector } from './AddressSelector';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import CheckoutSummary from './CheckoutSummary';
import CouponInput from './CouponInput';
import {
  User,
  Mail,
  Phone,
  MapPin,
  CheckCircle,
  Edit,
  CreditCard,
  ArrowRight
} from 'lucide-react';

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
  const { items, getTotal, clearCart, getTotals, calculateShipping } = useCartStore();
  const totals = getTotals();

  const [step, setStep] = useState<CheckoutStep>('review');
  const [orderId, setOrderId] = useState<string>('');
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'daviplata' | 'nequi' | 'efectivo'>('daviplata');
  const [userAddresses, setUserAddresses] = useState<Address[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [editingPersonalInfo, setEditingPersonalInfo] = useState(false);
  const [personalInfo, setPersonalInfo] = useState({
    full_name: '',
    preferred_name: '',
    phone: '',
    email: ''
  });

  // Initialize shipping calculation when component mounts
  useEffect(() => {
    calculateShipping();
  }, [calculateShipping]);

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

      // Set preferred payment method
      if (profile.preferred_payment_method) {
        setPaymentMethod(profile.preferred_payment_method);
      }

      // Load addresses
      loadAddresses();
    }
  }, [user, profile]);

  // Recalculate shipping when address changes
  useEffect(() => {
    if (selectedAddress) {
      calculateShipping(selectedAddress.city);
    }
  }, [selectedAddress, calculateShipping]);

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

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: personalInfo.full_name,
          preferred_name: personalInfo.preferred_name,
          phone: personalInfo.phone,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) throw error;
      
      setEditingPersonalInfo(false);
      // Update profile state to reflect changes
      // This would typically be handled by a context or state management
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
    setStep('processing');

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
          price: item.price,
          image: item.product.main_image_url || item.product.image || null
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
          payment_status: (paymentMethod === 'daviplata' || paymentMethod === 'nequi') ? 'pagado' : 'pendiente',
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

*Metodo de pago:* ${paymentMethod === 'efectivo' ? 'Efectivo' : paymentMethod === 'nequi' ? 'Nequi' : 'Daviplata'}

¡Gracias por tu compra! 🥑`;

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

      // 5. Limpiar carrito y redirigir
      clearCart();
      onSuccess(createdOrderId);

    } catch (err: any) {
      console.error('Error al crear pedido:', err);
      setError(err.message || 'Error al procesar el pedido');
      setStep('payment-method');
    } finally {
      setLoading(false);
    }
  };

  if (!user || !profile) {
    return (
      <div className="text-center p-8">
        <p className="text-muted-foreground">
          Debes iniciar sesión para continuar
        </p>
      </div>
    );
  }

  const displayName = profile.preferred_name || profile.full_name || user.email?.split('@')[0];

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
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <User className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="font-medium">{displayName}</p>
                        {profile.preferred_name && profile.full_name && (
                          <p className="text-sm text-gray-500">{profile.full_name}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Mail className="w-5 h-5 text-gray-400" />
                      <p className="text-sm">{user.email}</p>
                    </div>
                    {profile.phone && (
                      <div className="flex items-center gap-3">
                        <Phone className="w-5 h-5 text-gray-400" />
                        <p className="text-sm">{profile.phone}</p>
                      </div>
                    )}
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

            {/* Payment Preference Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Método de Pago Preferido
                </CardTitle>
                <CardDescription>
                  Basado en tus compras anteriores
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    paymentMethod === 'daviplata'
                      ? 'bg-purple-100 text-purple-700'
                      : paymentMethod === 'nequi'
                      ? 'bg-pink-100 text-pink-700'
                      : 'bg-green-100 text-green-700'
                  }`}>
                    {paymentMethod === 'daviplata' ? 'D' : paymentMethod === 'nequi' ? 'N' : '$'}
                  </div>
                  <div>
                    <p className="font-medium capitalize">
                      {paymentMethod === 'daviplata' ? 'Daviplata' : paymentMethod === 'nequi' ? 'Nequi' : 'Efectivo'}
                    </p>
                    <p className="text-sm text-gray-500">
                      {paymentMethod === 'daviplata' || paymentMethod === 'nequi'
                        ? 'Transferencia bancaria instantanea'
                        : 'Paga cuando recibas tu pedido'
                      }
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Button
              onClick={handleContinueToPayment}
              disabled={!selectedAddress}
              className="w-full"
              size="lg"
            >
              Continuar el pago
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
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
                  Continuar el pago
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
                  className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                    paymentMethod === 'daviplata'
                      ? 'border-primary bg-primary/5'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setPaymentMethod('daviplata')}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="daviplata"
                      checked={paymentMethod === 'daviplata'}
                      onChange={(e) => setPaymentMethod(e.target.value as 'daviplata')}
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

                {/* Nequi Option */}
                <div
                  className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                    paymentMethod === 'nequi'
                      ? 'border-primary bg-primary/5'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setPaymentMethod('nequi')}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="nequi"
                      checked={paymentMethod === 'nequi'}
                      onChange={(e) => setPaymentMethod(e.target.value as 'nequi')}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-1">Nequi</h3>
                      <p className="text-sm text-muted-foreground mb-2">
                        Transferencia bancaria instantanea
                      </p>

                      {paymentMethod === 'nequi' && (
                        <div className="mt-3 p-3 bg-pink-50 rounded-md text-sm">
                          <p className="font-semibold mb-2">Instrucciones:</p>
                          <ol className="list-decimal list-inside space-y-1">
                            <li>Abre tu app Nequi</li>
                            <li>Selecciona "Enviar dinero"</li>
                            <li>Ingresa el numero: <strong className="text-primary">320 306 2007</strong></li>
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
                  className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                    paymentMethod === 'efectivo'
                      ? 'border-primary bg-primary/5'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setPaymentMethod('efectivo')}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="efectivo"
                      checked={paymentMethod === 'efectivo'}
                      onChange={(e) => setPaymentMethod(e.target.value as 'efectivo')}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-1">Efectivo</h3>
                      <p className="text-sm text-muted-foreground mb-2">
                        Paga cuando recibas tu pedido
                      </p>

                      {paymentMethod === 'efectivo' && (
                        <div className="mt-3 p-3 bg-green-50 rounded-md text-sm">
                          <p className="font-semibold mb-2">Instrucciones:</p>
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
                    onClick={() => setStep('review')}
                    disabled={loading}
                  >
                    Volver
                  </Button>
                  <Button
                    onClick={handleConfirmOrder}
                    disabled={loading}
                    className="flex-1"
                  >
                    {loading ? 'Procesando...' : `Confirmar Pedido - ${paymentMethod === 'daviplata' ? 'Daviplata' : paymentMethod === 'nequi' ? 'Nequi' : 'Efectivo'}`}
                  </Button>
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
        </div>
      </div>
    </div>
  );
}