'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useCartStore } from '@/lib/cart-store';
import { MapPin, Truck, CreditCard, ShoppingBag, ChevronRight, AlertCircle } from 'lucide-react';
import { AddressAutocomplete } from '@/components/checkout/AddressAutocomplete';

type CheckoutStep = 'shipping' | 'delivery' | 'payment';

interface ShippingAddress {
  fullName: string;
  phone: string;
  street: string;
  number: string;
  apartment: string;
  city: string;
  state: string;
  postalCode: string;
  notes: string;
}

interface DeliveryOption {
  id: string;
  name: string;
  description: string;
  price: number;
  estimatedDays: string;
}

const deliveryOptions: DeliveryOption[] = [
  {
    id: 'tuesday',
    name: 'Entrega Martes',
    description: 'Próximo martes disponible',
    price: 0,
    estimatedDays: 'Martes'
  },
  {
    id: 'friday',
    name: 'Entrega Viernes',
    description: 'Próximo viernes disponible',
    price: 0,
    estimatedDays: 'Viernes'
  }
];

export default function CheckoutPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { items, getTotal, clearCart } = useCartStore();
  
  const [currentStep, setCurrentStep] = useState<CheckoutStep>('shipping');
  const [shippingAddress, setShippingAddress] = useState<ShippingAddress>({
    fullName: '',
    phone: '',
    street: '',
    number: '',
    apartment: '',
    city: '',
    state: 'Caldas',
    postalCode: '',
    notes: ''
  });
  const [selectedDelivery, setSelectedDelivery] = useState<string>('tuesday');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [processing, setProcessing] = useState(false);

  // Redirigir si no hay usuario o carrito vacío
  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/auth/login?redirect=/checkout');
      } else if (items.length === 0) {
        router.push('/productos');
      }
    }
  }, [user, authLoading, items, router]);

  const cartTotal = getTotal();
  const deliveryFee = deliveryOptions.find(d => d.id === selectedDelivery)?.price || 0;
  const total = cartTotal + deliveryFee;

  // Validar formulario de dirección
  function validateShipping(): boolean {
    const newErrors: Record<string, string> = {};
    
    if (!shippingAddress.fullName.trim()) {
      newErrors.fullName = 'El nombre completo es requerido';
    }
    if (!shippingAddress.phone.trim()) {
      newErrors.phone = 'El teléfono es requerido';
    } else if (!/^\d{10}$/.test(shippingAddress.phone.replace(/\s/g, ''))) {
      newErrors.phone = 'Ingresa un teléfono válido de 10 dígitos';
    }
    if (!shippingAddress.street.trim()) {
      newErrors.street = 'La dirección es requerida';
    }
    if (!shippingAddress.number.trim()) {
      newErrors.number = 'El número es requerido';
    }
    if (!shippingAddress.city.trim()) {
      newErrors.city = 'La ciudad es requerida';
    }
    if (!shippingAddress.postalCode.trim()) {
      newErrors.postalCode = 'El código postal es requerido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  // Manejar selección de dirección del autocompletado
  function handleAddressSelect(address: {
    fullAddress: string;
    street: string;
    number: string;
    city: string;
    state: string;
    postalCode: string;
  }) {
    setShippingAddress(prev => ({
      ...prev,
      street: address.street,
      number: address.number || prev.number,
      city: address.city,
      state: address.state,
      postalCode: address.postalCode
    }));
    
    // Limpiar errores relacionados
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors.street;
      delete newErrors.number;
      delete newErrors.city;
      delete newErrors.postalCode;
      return newErrors;
    });
  }

  function handleNextStep() {
    if (currentStep === 'shipping') {
      if (validateShipping()) {
        setCurrentStep('delivery');
      }
    } else if (currentStep === 'delivery') {
      setCurrentStep('payment');
    }
  }

  function handlePreviousStep() {
    if (currentStep === 'delivery') {
      setCurrentStep('shipping');
    } else if (currentStep === 'payment') {
      setCurrentStep('delivery');
    }
  }

  async function handlePlaceOrder() {
    setProcessing(true);
    
    try {
      // Aquí se integraría con Stripe cuando se tengan las credenciales
      // Por ahora, solo simularemos el proceso
      
      // TODO: Integrar con Stripe Payment Intent
      // const paymentIntent = await createPaymentIntent(...)
      
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simular procesamiento
      
      // Limpiar carrito y redirigir a confirmación
      clearCart();
      router.push('/checkout/confirmacion?order=TEMP' + Date.now());
      
    } catch (error) {
      console.error('Error al procesar pedido:', error);
      alert('Error al procesar el pedido. Por favor intenta nuevamente.');
    } finally {
      setProcessing(false);
    }
  }

  if (authLoading || !user || items.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-verde-bosque"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-display font-bold text-3xl md:text-4xl mb-2">
            Finalizar Compra
          </h1>
          <p className="text-gray-600">
            Completa tu pedido en 3 simples pasos
          </p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between max-w-2xl mx-auto">
            {[
              { id: 'shipping', icon: MapPin, label: 'Envío' },
              { id: 'delivery', icon: Truck, label: 'Entrega' },
              { id: 'payment', icon: CreditCard, label: 'Pago' }
            ].map((step, index) => {
              const isActive = currentStep === step.id;
              const isCompleted = 
                (step.id === 'shipping' && ['delivery', 'payment'].includes(currentStep)) ||
                (step.id === 'delivery' && currentStep === 'payment');
              
              return (
                <div key={step.id} className="flex items-center flex-1">
                  <div className="flex flex-col items-center flex-1">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 transition-all ${
                      isCompleted ? 'bg-verde-bosque text-white' :
                      isActive ? 'bg-verde-bosque text-white' :
                      'bg-gray-200 text-gray-500'
                    }`}>
                      <step.icon className="w-6 h-6" />
                    </div>
                    <span className={`text-sm font-medium ${
                      isActive || isCompleted ? 'text-verde-bosque' : 'text-gray-500'
                    }`}>
                      {step.label}
                    </span>
                  </div>
                  {index < 2 && (
                    <ChevronRight className={`w-6 h-6 mx-2 ${
                      isCompleted ? 'text-verde-bosque' : 'text-gray-300'
                    }`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm p-6">
              {/* Paso 1: Información de Envío */}
              {currentStep === 'shipping' && (
                <div>
                  <h2 className="font-display font-bold text-2xl mb-6">
                    Información de Envío
                  </h2>
                  
                  <div className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Nombre Completo *
                        </label>
                        <input
                          type="text"
                          value={shippingAddress.fullName}
                          onChange={(e) => setShippingAddress({...shippingAddress, fullName: e.target.value})}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-verde-bosque focus:border-transparent"
                          placeholder="Juan Pérez"
                        />
                        {errors.fullName && (
                          <p className="text-red-600 text-sm mt-1">{errors.fullName}</p>
                        )}
                      </div>
                      
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Teléfono *
                        </label>
                        <input
                          type="tel"
                          value={shippingAddress.phone}
                          onChange={(e) => setShippingAddress({...shippingAddress, phone: e.target.value})}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-verde-bosque focus:border-transparent"
                          placeholder="3001234567"
                        />
                        {errors.phone && (
                          <p className="text-red-600 text-sm mt-1">{errors.phone}</p>
                        )}
                      </div>
                    </div>

                    <div className="grid md:grid-cols-3 gap-4">
                      <div className="md:col-span-2">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Dirección * (Empieza a escribir para ver sugerencias)
                        </label>
                        <AddressAutocomplete
                          onAddressSelect={handleAddressSelect}
                          value={shippingAddress.street}
                          error={errors.street}
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Número *
                        </label>
                        <input
                          type="text"
                          value={shippingAddress.number}
                          onChange={(e) => setShippingAddress({...shippingAddress, number: e.target.value})}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-verde-bosque focus:border-transparent"
                          placeholder="20-30"
                        />
                        {errors.number && (
                          <p className="text-red-600 text-sm mt-1">{errors.number}</p>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Apartamento/Interior (Opcional)
                      </label>
                      <input
                        type="text"
                        value={shippingAddress.apartment}
                        onChange={(e) => setShippingAddress({...shippingAddress, apartment: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-verde-bosque focus:border-transparent"
                        placeholder="Apto 302"
                      />
                    </div>

                    <div className="grid md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Ciudad *
                        </label>
                        <input
                          type="text"
                          value={shippingAddress.city}
                          onChange={(e) => setShippingAddress({...shippingAddress, city: e.target.value})}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-verde-bosque focus:border-transparent"
                          placeholder="Manizales"
                        />
                        {errors.city && (
                          <p className="text-red-600 text-sm mt-1">{errors.city}</p>
                        )}
                      </div>
                      
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Departamento *
                        </label>
                        <select
                          value={shippingAddress.state}
                          onChange={(e) => setShippingAddress({...shippingAddress, state: e.target.value})}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-verde-bosque focus:border-transparent"
                        >
                          <option value="Caldas">Caldas</option>
                          <option value="Risaralda">Risaralda</option>
                          <option value="Quindío">Quindío</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Código Postal *
                        </label>
                        <input
                          type="text"
                          value={shippingAddress.postalCode}
                          onChange={(e) => setShippingAddress({...shippingAddress, postalCode: e.target.value})}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-verde-bosque focus:border-transparent"
                          placeholder="170001"
                        />
                        {errors.postalCode && (
                          <p className="text-red-600 text-sm mt-1">{errors.postalCode}</p>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Notas de Entrega (Opcional)
                      </label>
                      <textarea
                        value={shippingAddress.notes}
                        onChange={(e) => setShippingAddress({...shippingAddress, notes: e.target.value})}
                        rows={3}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-verde-bosque focus:border-transparent"
                        placeholder="Ej: Casa amarilla, portón azul"
                      />
                    </div>
                  </div>

                  <button
                    onClick={handleNextStep}
                    className="mt-6 w-full bg-verde-bosque hover:bg-verde-bosque-600 text-white font-semibold py-3 rounded-lg transition-all"
                  >
                    Continuar a Método de Entrega
                  </button>
                </div>
              )}

              {/* Paso 2: Método de Entrega */}
              {currentStep === 'delivery' && (
                <div>
                  <h2 className="font-display font-bold text-2xl mb-6">
                    Método de Entrega
                  </h2>
                  
                  <div className="space-y-4">
                    {deliveryOptions.map((option) => (
                      <label
                        key={option.id}
                        className={`block border-2 rounded-lg p-4 cursor-pointer transition-all ${
                          selectedDelivery === option.id
                            ? 'border-verde-bosque bg-verde-bosque-50'
                            : 'border-gray-200 hover:border-verde-bosque-200'
                        }`}
                      >
                        <input
                          type="radio"
                          name="delivery"
                          value={option.id}
                          checked={selectedDelivery === option.id}
                          onChange={(e) => setSelectedDelivery(e.target.value)}
                          className="sr-only"
                        />
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-1">
                              <Truck className="w-5 h-5 text-verde-bosque" />
                              <span className="font-semibold text-gray-900">
                                {option.name}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 ml-8">
                              {option.description} • {option.estimatedDays}
                            </p>
                          </div>
                          <div className="text-right ml-4">
                            <span className="font-semibold text-verde-bosque">
                              {option.price === 0 ? 'Gratis' : `$${option.price.toLocaleString('es-CO')}`}
                            </span>
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>

                  <div className="flex gap-4 mt-6">
                    <button
                      onClick={handlePreviousStep}
                      className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold py-3 rounded-lg transition-all"
                    >
                      Volver
                    </button>
                    <button
                      onClick={handleNextStep}
                      className="flex-1 bg-verde-bosque hover:bg-verde-bosque-600 text-white font-semibold py-3 rounded-lg transition-all"
                    >
                      Continuar a Pago
                    </button>
                  </div>
                </div>
              )}

              {/* Paso 3: Pago */}
              {currentStep === 'payment' && (
                <div>
                  <h2 className="font-display font-bold text-2xl mb-6">
                    Información de Pago
                  </h2>

                  {/* Mensaje temporal sobre configuración de pagos */}
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <h3 className="font-semibold text-yellow-900 mb-2">
                          Configuración de Pagos Pendiente
                        </h3>
                        <p className="text-sm text-yellow-800 mb-3">
                          El sistema de pagos en línea está en proceso de configuración. 
                          Por el momento, tu pedido será registrado y nos pondremos en contacto 
                          contigo para coordinar el pago y confirmar la entrega.
                        </p>
                        <p className="text-sm text-yellow-800 mb-2">
                          <strong>Métodos de pago disponibles al contacto:</strong> Efectivo, 
                          Transferencia bancaria, PSE, Tarjeta de crédito/débito.
                        </p>
                        <p className="text-sm text-yellow-800">
                          <strong>Entregas:</strong> Solo martes y viernes en Bogotá.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Resumen de Dirección */}
                  <div className="bg-gray-50 rounded-lg p-4 mb-6">
                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-verde-bosque" />
                      Dirección de Envío
                    </h3>
                    <p className="text-sm text-gray-700">
                      {shippingAddress.fullName}<br />
                      {shippingAddress.street} #{shippingAddress.number}
                      {shippingAddress.apartment && ` - ${shippingAddress.apartment}`}<br />
                      {shippingAddress.city}, {shippingAddress.state} {shippingAddress.postalCode}<br />
                      Tel: {shippingAddress.phone}
                    </p>
                  </div>

                  {/* Resumen de Entrega */}
                  <div className="bg-gray-50 rounded-lg p-4 mb-6">
                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <Truck className="w-5 h-5 text-verde-bosque" />
                      Método de Entrega
                    </h3>
                    <p className="text-sm text-gray-700">
                      {deliveryOptions.find(d => d.id === selectedDelivery)?.name} - {' '}
                      {deliveryOptions.find(d => d.id === selectedDelivery)?.estimatedDays}
                    </p>
                  </div>

                  <div className="flex gap-4 mt-6">
                    <button
                      onClick={handlePreviousStep}
                      className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold py-3 rounded-lg transition-all"
                    >
                      Volver
                    </button>
                    <button
                      onClick={handlePlaceOrder}
                      disabled={processing}
                      className="flex-1 bg-verde-bosque hover:bg-verde-bosque-600 text-white font-semibold py-3 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {processing ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                          Procesando...
                        </>
                      ) : (
                        <>
                          <ShoppingBag className="w-5 h-5" />
                          Confirmar Pedido
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar - Resumen del Pedido */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm p-6 sticky top-6">
              <h3 className="font-display font-bold text-xl mb-4">
                Resumen del Pedido
              </h3>

              {/* Items */}
              <div className="space-y-3 mb-4 border-b border-gray-200 pb-4">
                {items.map((item) => (
                  <div key={item.product.id} className="flex gap-3">
                    <div className="w-16 h-16 bg-gray-100 rounded-lg flex-shrink-0"></div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-gray-900 truncate">
                        {item.product?.name || 'Producto'}
                      </p>
                      <p className="text-sm text-gray-600">
                        Cantidad: {item.quantity}
                      </p>
                      <p className="text-sm font-semibold text-verde-bosque">
                        ${((item.product?.discount_price || item.product?.price || 0) * item.quantity).toLocaleString('es-CO')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Totales */}
              <div className="space-y-2 mb-4 border-b border-gray-200 pb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-semibold">${cartTotal.toLocaleString('es-CO')}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Envío</span>
                  <span className="font-semibold">
                    {deliveryFee === 0 ? 'Gratis' : `$${deliveryFee.toLocaleString('es-CO')}`}
                  </span>
                </div>
              </div>

              {/* Total */}
              <div className="flex justify-between items-center mb-4">
                <span className="font-display font-bold text-lg">Total</span>
                <span className="font-display font-bold text-2xl text-verde-bosque">
                  ${total.toLocaleString('es-CO')}
                </span>
              </div>

              {/* Garantía */}
              <div className="bg-verde-aguacate-50 rounded-lg p-4">
                <p className="text-xs text-verde-bosque-700 text-center">
                  🛡️ Compra 100% segura<br />
                  Productos frescos garantizados
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
