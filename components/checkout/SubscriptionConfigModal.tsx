'use client';

import { useState, useEffect } from 'react';
import { useCartStore } from '@/lib/cart-store';
import { supabase, Address, Subscription, SubscriptionProduct } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { 
  X, 
  Calendar, 
  Package, 
  MapPin, 
  CreditCard, 
  Bell, 
  Settings,
  Check,
  AlertCircle,
  Clock,
  Repeat
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface SubscriptionConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedAddress: Address | null;
  paymentMethod: 'daviplata' | 'efectivo';
  onSubscriptionCreated: (subscription: Subscription) => void;
}

export function SubscriptionConfigModal({
  isOpen,
  onClose,
  selectedAddress,
  paymentMethod,
  onSubscriptionCreated
}: SubscriptionConfigModalProps) {
  const { user } = useAuth();
  const { items, getTotal, getTotals } = useCartStore();
  const totals = getTotals();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState<'config' | 'review' | 'success'>('config');

  // Configuración de suscripción
  const [subscriptionName, setSubscriptionName] = useState('Mi Suscripción de Aguacates');
  const [frequencyDays, setFrequencyDays] = useState(15);
  const [notificationDaysBefore, setNotificationDaysBefore] = useState(2);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [whatsappNotifications, setWhatsappNotifications] = useState(true);
  const [notes, setNotes] = useState('');

  // Productos
  const [fixedProducts, setFixedProducts] = useState<SubscriptionProduct[]>([]);
  const [optionalProducts, setOptionalProducts] = useState<SubscriptionProduct[]>([]);

  // Inicializar productos del carrito
  useEffect(() => {
    if (items.length > 0) {
      const cartProducts = items.map(item => ({
        product_id: item.product.id,
        product_name: item.product.name,
        quantity: item.quantity,
        unit_price: item.price,
        variant_id: item.variant?.id,
        variant_name: item.variant?.variant_value,
        product_image: item.product.main_image_url,
        is_optional: false
      }));

      // Por defecto, todos los productos son fijos
      setFixedProducts(cartProducts);
      setOptionalProducts([]);
    }
  }, [items]);

  // Calcular totales
  const fixedProductsTotal = fixedProducts.reduce((sum, product) => 
    sum + (product.unit_price * product.quantity), 0
  );
  const estimatedTotal = fixedProductsTotal + totals.shipping;

  // Mover producto entre fijos y opcionales
  const toggleProductType = (productId: string, isOptional: boolean) => {
    if (isOptional) {
      // Mover de opcionales a fijos
      const product = optionalProducts.find(p => p.product_id === productId);
      if (product) {
        setFixedProducts([...fixedProducts, { ...product, is_optional: false }]);
        setOptionalProducts(optionalProducts.filter(p => p.product_id !== productId));
      }
    } else {
      // Mover de fijos a opcionales
      const product = fixedProducts.find(p => p.product_id === productId);
      if (product) {
        setOptionalProducts([...optionalProducts, { ...product, is_optional: true }]);
        setFixedProducts(fixedProducts.filter(p => p.product_id !== productId));
      }
    }
  };

  // Crear suscripción
  const handleCreateSubscription = async () => {
    if (!user || !selectedAddress) {
      setError('Debes estar autenticado y tener una dirección seleccionada');
      return;
    }

    if (fixedProducts.length === 0) {
      setError('Debes tener al menos un producto fijo en tu suscripción');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Calcular próxima fecha de entrega
      const nextDeliveryDate = new Date();
      nextDeliveryDate.setDate(nextDeliveryDate.getDate() + frequencyDays);

      // Snapshot de la dirección
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

      // Crear suscripción
      const { data: subscription, error: subscriptionError } = await supabase
        .from('subscriptions')
        .insert({
          user_id: user.id,
          name: subscriptionName,
          frequency_days: frequencyDays,
          next_delivery_date: nextDeliveryDate.toISOString().split('T')[0],
          address_id: selectedAddress.id,
          shipping_address_snapshot: addressSnapshot,
          payment_method: paymentMethod,
          fixed_products: fixedProducts,
          optional_products: optionalProducts,
          base_total: fixedProductsTotal,
          shipping_fee: totals.shipping,
          estimated_total: estimatedTotal,
          notification_days_before: notificationDaysBefore,
          email_notifications: emailNotifications,
          whatsapp_notifications: whatsappNotifications,
          notes: notes
        })
        .select()
        .single();

      if (subscriptionError) throw subscriptionError;

      // Crear primera entrega programada
      const { error: deliveryError } = await supabase
        .from('subscription_deliveries')
        .insert({
          subscription_id: subscription.id,
          delivery_date: nextDeliveryDate.toISOString().split('T')[0],
          scheduled_date: nextDeliveryDate.toISOString().split('T')[0],
          products_snapshot: fixedProducts,
          total_amount: estimatedTotal,
          shipping_fee: totals.shipping
        });

      if (deliveryError) throw deliveryError;

      setStep('success');
      onSubscriptionCreated(subscription);

    } catch (err: any) {
      console.error('Error creating subscription:', err);
      setError(err.message || 'Error al crear la suscripción');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <Repeat className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Configurar Pedido Recurrente
              </h2>
              <p className="text-gray-600">
                Recibe tus productos favoritos cada {frequencyDays} días automáticamente
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6">
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              {error}
            </div>
          )}

          {step === 'config' && (
            <div className="space-y-8">
              {/* Información básica */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="w-5 h-5" />
                    Configuración Básica
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Nombre de la suscripción
                    </label>
                    <input
                      type="text"
                      value={subscriptionName}
                      onChange={(e) => setSubscriptionName(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="Ej: Mi suscripción semanal de aguacates"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Frecuencia de entrega
                      </label>
                      <select
                        value={frequencyDays}
                        onChange={(e) => setFrequencyDays(Number(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      >
                        <option value={7}>Cada 7 días</option>
                        <option value={15}>Cada 15 días (recomendado)</option>
                        <option value={30}>Cada 30 días</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Notificar días antes
                      </label>
                      <select
                        value={notificationDaysBefore}
                        onChange={(e) => setNotificationDaysBefore(Number(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      >
                        <option value={1}>1 día antes</option>
                        <option value={2}>2 días antes</option>
                        <option value={3}>3 días antes</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Notas adicionales
                    </label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      rows={3}
                      placeholder="Instrucciones especiales para tus entregas..."
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Productos */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="w-5 h-5" />
                    Configuración de Productos
                  </CardTitle>
                  <p className="text-sm text-gray-600">
                    Los productos fijos se incluyen en cada entrega. Los opcionales puedes modificarlos antes de cada entrega.
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Productos fijos */}
                    <div>
                      <h4 className="font-medium mb-3 flex items-center gap-2">
                        <Check className="w-4 h-4 text-green-600" />
                        Productos Fijos ({fixedProducts.length})
                      </h4>
                      {fixedProducts.length === 0 ? (
                        <p className="text-gray-500 text-sm">No hay productos fijos</p>
                      ) : (
                        <div className="space-y-2">
                          {fixedProducts.map((product) => (
                            <div key={product.product_id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                              <div className="flex items-center gap-3">
                                {product.product_image && (
                                  <img
                                    src={product.product_image}
                                    alt={product.product_name}
                                    className="w-10 h-10 object-cover rounded"
                                  />
                                )}
                                <div>
                                  <p className="font-medium">{product.product_name}</p>
                                  <p className="text-sm text-gray-600">
                                    {product.quantity} x ${product.unit_price.toLocaleString('es-CO')}
                                    {product.variant_name && ` (${product.variant_name})`}
                                  </p>
                                </div>
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => toggleProductType(product.product_id, false)}
                                className="text-orange-600 border-orange-200 hover:bg-orange-50"
                              >
                                Hacer opcional
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Productos opcionales */}
                    <div>
                      <h4 className="font-medium mb-3 flex items-center gap-2">
                        <Settings className="w-4 h-4 text-orange-600" />
                        Productos Opcionales ({optionalProducts.length})
                      </h4>
                      {optionalProducts.length === 0 ? (
                        <p className="text-gray-500 text-sm">No hay productos opcionales</p>
                      ) : (
                        <div className="space-y-2">
                          {optionalProducts.map((product) => (
                            <div key={product.product_id} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                              <div className="flex items-center gap-3">
                                {product.product_image && (
                                  <img
                                    src={product.product_image}
                                    alt={product.product_name}
                                    className="w-10 h-10 object-cover rounded"
                                  />
                                )}
                                <div>
                                  <p className="font-medium">{product.product_name}</p>
                                  <p className="text-sm text-gray-600">
                                    {product.quantity} x ${product.unit_price.toLocaleString('es-CO')}
                                    {product.variant_name && ` (${product.variant_name})`}
                                  </p>
                                </div>
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => toggleProductType(product.product_id, true)}
                                className="text-green-600 border-green-200 hover:bg-green-50"
                              >
                                Hacer fijo
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Dirección y pago */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="w-5 h-5" />
                      Dirección de Entrega
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {selectedAddress ? (
                      <div className="space-y-2">
                        <p className="font-medium">{selectedAddress.label}</p>
                        <p className="text-sm text-gray-600">{selectedAddress.full_name}</p>
                        <p className="text-sm">{selectedAddress.street_address}</p>
                        <p className="text-sm">{selectedAddress.city}, {selectedAddress.state}</p>
                        <p className="text-sm">Tel: {selectedAddress.phone}</p>
                      </div>
                    ) : (
                      <p className="text-red-600">No hay dirección seleccionada</p>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CreditCard className="w-5 h-5" />
                      Método de Pago
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        paymentMethod === 'daviplata' 
                          ? 'bg-purple-100 text-purple-700' 
                          : 'bg-green-100 text-green-700'
                      }`}>
                        {paymentMethod === 'daviplata' ? 'D' : '$'}
                      </div>
                      <div>
                        <p className="font-medium capitalize">
                          {paymentMethod === 'daviplata' ? 'Daviplata' : 'Efectivo'}
                        </p>
                        <p className="text-sm text-gray-500">
                          {paymentMethod === 'daviplata' 
                            ? 'Transferencia bancaria'
                            : 'Pago contra entrega'
                          }
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Notificaciones */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="w-5 h-5" />
                    Preferencias de Notificación
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Notificaciones por Email</p>
                        <p className="text-sm text-gray-600">Recibe recordatorios de entrega</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={emailNotifications}
                        onChange={(e) => setEmailNotifications(e.target.checked)}
                        className="w-5 h-5 text-green-600 rounded focus:ring-green-500"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Notificaciones por WhatsApp</p>
                        <p className="text-sm text-gray-600">Alertas rápidas en tu móvil</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={whatsappNotifications}
                        onChange={(e) => setWhatsappNotifications(e.target.checked)}
                        className="w-5 h-5 text-green-600 rounded focus:ring-green-500"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Resumen */}
              <Card className="bg-blue-50 border-blue-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    Resumen de la Suscripción
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span>Productos fijos:</span>
                      <span className="font-medium">${fixedProductsTotal.toLocaleString('es-CO')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Envío:</span>
                      <span className="font-medium">${totals.shipping.toLocaleString('es-CO')}</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold pt-2 border-t">
                      <span>Total estimado por entrega:</span>
                      <span className="text-green-600">${estimatedTotal.toLocaleString('es-CO')}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600 mt-2">
                      <Clock className="w-4 h-4" />
                      <span>Próxima entrega: {new Date(Date.now() + frequencyDays * 24 * 60 * 60 * 1000).toLocaleDateString('es-CO')}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {step === 'success' && (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Check className="w-10 h-10 text-green-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                ¡Suscripción Creada Exitosamente!
              </h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                Tu suscripción "{subscriptionName}" ha sido configurada. Recibirás tus productos cada {frequencyDays} días comenzando el {new Date(Date.now() + frequencyDays * 24 * 60 * 60 * 1000).toLocaleDateString('es-CO')}.
              </p>
              <div className="bg-blue-50 p-4 rounded-lg max-w-md mx-auto mb-6">
                <p className="text-sm text-blue-800">
                  <strong>Próxima entrega:</strong> {new Date(Date.now() + frequencyDays * 24 * 60 * 60 * 1000).toLocaleDateString('es-CO')}<br />
                  <strong>Total estimado:</strong> ${estimatedTotal.toLocaleString('es-CO')} COP<br />
                  <strong>Método de pago:</strong> {paymentMethod === 'daviplata' ? 'Daviplata' : 'Efectivo'}
                </p>
              </div>
              <Button onClick={onClose} className="w-full max-w-xs">
                Entendido
              </Button>
            </div>
          )}
        </div>

        {/* Actions */}
        {step === 'config' && (
          <div className="sticky bottom-0 bg-white border-t p-6 flex gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={loading}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleCreateSubscription}
              disabled={loading || !selectedAddress || fixedProducts.length === 0}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              {loading ? 'Creando...' : 'Crear Suscripción'}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}