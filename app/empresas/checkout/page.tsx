'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import {
  Building2,
  User,
  Phone,
  Mail,
  MapPin,
  FileText,
  Package,
  Truck,
  ArrowLeft,
  MessageCircle
} from 'lucide-react';
import { useBusinessCartStore } from '@/lib/business-cart-store';
import { formatPrice } from '@/lib/utils';
import { supabase } from '@/lib/supabase';

// Cargar BoldPayButton dinámicamente para evitar errores de SSR
const BoldPayButton = dynamic(() => import('@/components/checkout/BoldPayButton'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center py-4">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      <span className="ml-3 text-gray-600">Cargando...</span>
    </div>
  )
});

// Ciudades disponibles para entrega
const AVAILABLE_CITIES = [
  { value: 'bogota', label: 'Bogotá D.C.' },
  { value: 'soacha', label: 'Soacha, Cundinamarca' },
  { value: 'chia', label: 'Chía, Cundinamarca' },
];

interface BusinessFormData {
  companyName: string;
  nit: string;
  contactName: string;
  phone: string;
  email: string;
  city: string;
  address: string;
  notes: string;
  paymentMethod: 'bold' | 'daviplata' | 'nequi' | 'efectivo';
}

type CheckoutStep = 'info' | 'payment-method' | 'processing';

export default function BusinessCheckoutPage() {
  const router = useRouter();
  const { items, getTotals, shipping, clearCart } = useBusinessCartStore();
  const [mounted, setMounted] = useState(false);
  const [step, setStep] = useState<CheckoutStep>('info');
  const [orderId, setOrderId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState<BusinessFormData>({
    companyName: '',
    nit: '',
    contactName: '',
    phone: '',
    email: '',
    city: 'bogota', // Pre-seleccionado Bogotá
    address: '',
    notes: '',
    paymentMethod: 'bold'
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  // Redirect if cart is empty
  useEffect(() => {
    if (mounted && items.length === 0) {
      router.push('/empresas');
    }
  }, [mounted, items, router]);

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-verde-bosque mx-auto mb-4"></div>
          <p>Cargando...</p>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return null;
  }

  const totals = getTotals();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Generate order message for WhatsApp
  const generateOrderMessage = (paymentLabel: string) => {
    const itemsList = items.map(item => {
      const variantInfo = item.variant ? ` (${item.variant.variant_name})` : '';
      return `• ${item.quantity} ${item.unit} ${item.product.name}${variantInfo} - ${formatPrice(item.price * item.quantity)}`;
    }).join('\n');

    const cityLabel = AVAILABLE_CITIES.find(c => c.value === formData.city)?.label || formData.city;

    return `*PEDIDO EMPRESARIAL B2B* 🏢

*Empresa:* ${formData.companyName}
${formData.nit ? `*NIT:* ${formData.nit}` : ''}
*Contacto:* ${formData.contactName}
*Teléfono:* ${formData.phone}
${formData.email ? `*Email:* ${formData.email}` : ''}
*Ciudad:* ${cityLabel}
*Dirección:* ${formData.address}

📦 *PRODUCTOS:*
${itemsList}

💰 *Subtotal:* ${formatPrice(totals.subtotal)}
🚚 *Envío:* ${shipping.freeShipping ? 'GRATIS 🎉' : formatPrice(totals.shipping)}
*TOTAL:* ${formatPrice(totals.total)}
*Peso:* ${totals.totalWeight.toFixed(1)} kg

💳 *Método de pago:* ${paymentLabel}
${formData.notes ? `\n📝 *Notas:* ${formData.notes}` : ''}

---
Pedido desde tusaguacates.com/empresas`;
  };

  // Submit info and create order
  const handleSubmitInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validar campos obligatorios
    if (!formData.companyName || !formData.contactName || !formData.phone || !formData.address) {
      setError('Por favor completa todos los campos obligatorios');
      setLoading(false);
      return;
    }

    try {
      const cityLabel = AVAILABLE_CITIES.find(c => c.value === formData.city)?.label || formData.city;

      // Crear pedido B2B en Supabase
      const orderData = {
        items: items.map(item => ({
          productName: item.product.name,
          productId: item.product.id,
          variantName: item.variant?.variant_name || null,
          variantId: item.variant?.id || null,
          quantity: item.quantity,
          price: item.price,
          unit: item.unit
        })),
        subtotal: totals.subtotal,
        shipping: totals.shipping,
        total: totals.total,
        totalWeight: totals.totalWeight,
        shippingInfo: shipping,
        isB2B: true,
        companyName: formData.companyName,
        nit: formData.nit,
      };

      const { data: guestOrder, error: orderError } = await supabase
        .from('guest_orders')
        .insert({
          guest_name: formData.contactName,
          guest_email: formData.email || null,
          guest_phone: formData.phone,
          guest_address: `${formData.address}, ${cityLabel}`,
          order_data: orderData,
          total_amount: totals.total,
          status: 'pendiente',
          payment_status: 'pendiente',
        })
        .select()
        .single();

      if (orderError) throw orderError;

      setOrderId(guestOrder.id);
      setStep('payment-method');

    } catch (err: any) {
      console.error('Error al crear pedido B2B:', err);
      setError(err.message || 'Error al procesar el pedido. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  // Handle payment confirmation (for non-Bold methods)
  const handlePaymentConfirm = async () => {
    setLoading(true);
    setError('');

    try {
      const paymentLabels: Record<string, string> = {
        bold: 'Tarjeta/PSE',
        daviplata: 'Daviplata',
        nequi: 'Nequi',
        efectivo: 'Efectivo contra entrega'
      };

      const paymentLabel = paymentLabels[formData.paymentMethod];
      const message = generateOrderMessage(paymentLabel);

      // Actualizar estado del pedido
      await supabase
        .from('guest_orders')
        .update({
          status: formData.paymentMethod === 'efectivo' ? 'pendiente_entrega' : 'confirmado',
          payment_status: formData.paymentMethod === 'efectivo' ? 'pendiente_pago' : 'pendiente_confirmacion',
          payment_method: formData.paymentMethod,
          whatsapp_message: message,
        })
        .eq('id', orderId);

      // Mensaje de confirmación
      const firstName = formData.contactName.split(' ')[0];

      if (formData.paymentMethod === 'daviplata' || formData.paymentMethod === 'nequi') {
        alert(`✅ ¡Pedido B2B Confirmado, ${firstName}!\n\n📋 Pedido #${orderId.toString().slice(-8)}\n💰 Total: ${formatPrice(totals.total)}\n\n📱 Datos para transferencia:\n• Número: 320 306 2007\n• ${formData.paymentMethod === 'nequi' ? 'Nequi' : 'Daviplata'}\n\nAl dar "Aceptar" te llevaremos a WhatsApp para confirmar tu pago.`);
      } else {
        alert(`✅ ¡Pedido B2B Confirmado, ${firstName}!\n\n📋 Pedido #${orderId.toString().slice(-8)}\n💰 Total: ${formatPrice(totals.total)}\n💳 Pago: ${paymentLabel}\n\nAl dar "Aceptar" te llevaremos a WhatsApp para coordinar la entrega.`);
      }

      // Abrir WhatsApp
      const whatsappUrl = `https://wa.me/573042582777?text=${encodeURIComponent(message)}`;
      window.location.href = whatsappUrl;

      // Limpiar carrito
      setTimeout(() => {
        clearCart();
        router.push('/empresas');
      }, 1000);

    } catch (err: any) {
      console.error('Error al confirmar pedido:', err);
      setError(err.message || 'Error al confirmar. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  // Paso 1: Información de la empresa
  if (step === 'info') {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
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
            {/* Back link */}
            <Link
              href="/empresas"
              className="inline-flex items-center gap-2 text-verde-bosque hover:text-verde-bosque-600 mb-6"
            >
              <ArrowLeft className="w-4 h-4" />
              Volver al catálogo B2B
            </Link>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Form */}
              <div className="lg:col-span-2">
                <form onSubmit={handleSubmitInfo} className="bg-white rounded-2xl shadow-lg p-6 md:p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-verde-bosque rounded-lg flex items-center justify-center">
                      <Building2 className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h2 className="font-display font-bold text-xl">Datos de la Empresa</h2>
                      <p className="text-sm text-gray-500">Completa la información para tu pedido mayorista</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Company Name */}
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nombre de la Empresa *
                      </label>
                      <div className="relative">
                        <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="text"
                          name="companyName"
                          value={formData.companyName}
                          onChange={handleInputChange}
                          placeholder="Restaurante El Buen Sabor S.A.S."
                          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-verde-bosque focus:border-transparent"
                          required
                        />
                      </div>
                    </div>

                    {/* NIT */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        NIT (opcional)
                      </label>
                      <input
                        type="text"
                        name="nit"
                        value={formData.nit}
                        onChange={handleInputChange}
                        placeholder="900.123.456-7"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-verde-bosque focus:border-transparent"
                      />
                    </div>

                    {/* Contact Name */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Persona de Contacto *
                      </label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="text"
                          name="contactName"
                          value={formData.contactName}
                          onChange={handleInputChange}
                          placeholder="Juan Pérez"
                          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-verde-bosque focus:border-transparent"
                          required
                        />
                      </div>
                    </div>

                    {/* Phone */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Teléfono *
                      </label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleInputChange}
                          placeholder="300 123 4567"
                          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-verde-bosque focus:border-transparent"
                          required
                        />
                      </div>
                    </div>

                    {/* Email */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Correo Electrónico
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          placeholder="compras@empresa.com"
                          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-verde-bosque focus:border-transparent"
                        />
                      </div>
                    </div>

                    {/* City - Dropdown pre-selected */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Ciudad *
                      </label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <select
                          name="city"
                          value={formData.city}
                          onChange={handleInputChange}
                          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-verde-bosque focus:border-transparent appearance-none bg-white"
                          required
                        >
                          {AVAILABLE_CITIES.map(city => (
                            <option key={city.value} value={city.value}>
                              {city.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Entregas disponibles solo en Bogotá, Soacha y Chía
                      </p>
                    </div>

                    {/* Address */}
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Dirección de Entrega *
                      </label>
                      <div className="relative">
                        <Truck className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                        <input
                          type="text"
                          name="address"
                          value={formData.address}
                          onChange={handleInputChange}
                          placeholder="Calle 10 # 15-30, Local 5"
                          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-verde-bosque focus:border-transparent"
                          required
                        />
                      </div>
                    </div>

                    {/* Notes */}
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Notas Adicionales
                      </label>
                      <textarea
                        name="notes"
                        value={formData.notes}
                        onChange={handleInputChange}
                        placeholder="Horario de recepción, instrucciones especiales, etc."
                        rows={3}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-verde-bosque focus:border-transparent resize-none"
                      />
                    </div>
                  </div>

                  {error && (
                    <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full mt-6 bg-gradient-to-r from-yellow-400 to-yellow-600 text-verde-bosque-700 hover:from-yellow-500 hover:to-yellow-700 disabled:bg-gray-300 disabled:cursor-not-allowed font-bold py-4 px-6 rounded-lg transition-all transform hover:scale-105 shadow-lg hover:shadow-xl border-2 border-verde-aguacate"
                  >
                    {loading ? 'Procesando...' : 'Continuar al Pago'}
                  </button>
                </form>
              </div>

              {/* Order Summary Sidebar */}
              <div className="lg:col-span-1">
                <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-4">
                  <h2 className="font-display font-bold text-lg mb-4 flex items-center gap-2">
                    <Package className="w-5 h-5 text-verde-bosque" />
                    Resumen del Pedido
                  </h2>

                  <div className="space-y-3 mb-4 max-h-48 overflow-y-auto">
                    {items.map((item) => {
                      const itemKey = item.variant
                        ? `${item.product.id}-${item.variant.id}`
                        : item.product.id;

                      return (
                        <div key={itemKey} className="flex justify-between items-start text-sm border-b pb-2">
                          <div className="flex-1">
                            <p className="font-medium text-sm">{item.product.name}</p>
                            {item.variant && (
                              <p className="text-xs text-verde-bosque">{item.variant.variant_name}</p>
                            )}
                            <p className="text-xs text-gray-500">
                              {item.quantity} {item.unit} x {formatPrice(item.price)}
                            </p>
                          </div>
                          <p className="font-mono text-sm font-semibold">
                            {formatPrice(item.price * item.quantity)}
                          </p>
                        </div>
                      );
                    })}
                  </div>

                  <div className="space-y-2 pt-4 border-t">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Subtotal:</span>
                      <span className="font-mono">{formatPrice(totals.subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Envío:</span>
                      <span className={`font-mono ${shipping.freeShipping ? 'text-green-600' : ''}`}>
                        {shipping.freeShipping ? '¡GRATIS!' : formatPrice(totals.shipping)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t">
                      <span className="font-bold">Total:</span>
                      <span className="font-mono font-bold text-xl text-verde-bosque">
                        {formatPrice(totals.total)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Paso 2: Método de pago
  if (step === 'payment-method') {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
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
              {/* Payment Methods */}
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-green-900">🏢 Último paso: Elige cómo pagar</h3>
                  <p className="text-sm text-green-700 mt-1">
                    Pedido B2B #{orderId.slice(0, 8)} • {formData.companyName}
                  </p>
                </div>

                <div className="bg-white rounded-2xl shadow-lg p-6">
                  <h4 className="font-medium text-gray-900 mb-4">¿Cómo prefieres pagar?</h4>

                  {/* Payment Method Buttons */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                    {/* Bold - Tarjeta/PSE */}
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, paymentMethod: 'bold' })}
                      className={`p-3 rounded-lg border-2 transition-all flex flex-col items-center gap-1 ${formData.paymentMethod === 'bold'
                        ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                        : 'border-gray-200 hover:border-blue-300'
                        }`}
                    >
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
                      onClick={() => setFormData({ ...formData, paymentMethod: 'daviplata' })}
                      className={`p-3 rounded-lg border-2 transition-all flex flex-col items-center gap-1 ${formData.paymentMethod === 'daviplata'
                        ? 'border-red-500 bg-red-50'
                        : 'border-gray-200 hover:border-red-300'
                        }`}
                    >
                      <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-700 rounded-lg flex items-center justify-center">
                        <span className="text-white font-black text-lg">D</span>
                      </div>
                      <span className="text-xs font-medium">Daviplata</span>
                    </button>

                    {/* Nequi */}
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, paymentMethod: 'nequi' })}
                      className={`p-3 rounded-lg border-2 transition-all flex flex-col items-center gap-1 ${formData.paymentMethod === 'nequi'
                        ? 'border-pink-500 bg-pink-50'
                        : 'border-gray-200 hover:border-pink-300'
                        }`}
                    >
                      <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-fuchsia-600 rounded-lg flex items-center justify-center">
                        <span className="text-white font-black text-lg">N</span>
                      </div>
                      <span className="text-xs font-medium">Nequi</span>
                    </button>

                    {/* Efectivo */}
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, paymentMethod: 'efectivo' })}
                      className={`p-3 rounded-lg border-2 transition-all flex flex-col items-center gap-1 ${formData.paymentMethod === 'efectivo'
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200 hover:border-green-300'
                        }`}
                    >
                      <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-700 rounded-lg flex items-center justify-center">
                        <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1.41 16.09V20h-2.67v-1.93c-1.71-.36-3.16-1.46-3.27-3.4h1.96c.1 1.05.82 1.87 2.65 1.87 1.96 0 2.4-.98 2.4-1.59 0-.83-.44-1.61-2.67-2.14-2.48-.6-4.18-1.62-4.18-3.67 0-1.72 1.39-2.84 3.11-3.21V4h2.67v1.95c1.86.45 2.79 1.86 2.85 3.39H14.3c-.05-1.11-.64-1.87-2.22-1.87-1.5 0-2.4.68-2.4 1.64 0 .84.65 1.39 2.67 1.91s4.18 1.39 4.18 3.91c-.01 1.83-1.38 2.83-3.12 3.16z" />
                        </svg>
                      </div>
                      <span className="text-xs font-medium">Efectivo</span>
                    </button>
                  </div>

                  {error && (
                    <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                      {error}
                    </div>
                  )}

                  {/* Payment Action */}
                  <div className="space-y-3">
                    {formData.paymentMethod === 'bold' ? (
                      <>
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                          <p className="text-sm text-blue-800">
                            💳 Paga con tarjeta de crédito, débito o PSE de forma segura.
                          </p>
                        </div>
                        {orderId && totals.total > 0 && (
                          <BoldPayButton
                            orderId={orderId}
                            amount={totals.total}
                            description={`Pedido B2B #${orderId.slice(-8)} - ${formData.companyName}`}
                            customerEmail={formData.email}
                            customerName={formData.contactName}
                            customerPhone={formData.phone}
                            customerAddress={`${formData.address}, ${AVAILABLE_CITIES.find(c => c.value === formData.city)?.label}`}
                          />
                        )}
                      </>
                    ) : (
                      <>
                        {(formData.paymentMethod === 'daviplata' || formData.paymentMethod === 'nequi') && (
                          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                            <p className="text-sm text-yellow-800">
                              📱 Al confirmar, te daremos los datos para transferir a {formData.paymentMethod === 'nequi' ? 'Nequi' : 'Daviplata'}.
                            </p>
                          </div>
                        )}
                        <button
                          onClick={handlePaymentConfirm}
                          disabled={loading}
                          className="w-full bg-gradient-to-r from-yellow-400 to-yellow-600 hover:from-yellow-500 hover:to-yellow-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-verde-bosque-700 font-bold py-4 px-6 rounded-lg transition-all transform hover:scale-105 shadow-lg hover:shadow-xl border-2 border-verde-aguacate"
                        >
                          {loading ? 'Procesando...' : 'Confirmar Pedido B2B'}
                        </button>
                      </>
                    )}

                    <button
                      onClick={() => setStep('info')}
                      className="w-full bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 font-medium py-3 px-6 rounded-lg transition-all"
                    >
                      Volver
                    </button>

                    {/* WhatsApp Alternative */}
                    <div className="pt-4 border-t">
                      <p className="text-sm text-gray-500 text-center mb-3">
                        ¿Prefieres coordinar por WhatsApp?
                      </p>
                      <button
                        onClick={() => {
                          const message = generateOrderMessage('Por coordinar');
                          window.open(`https://wa.me/573042582777?text=${encodeURIComponent(message)}`, '_blank');
                        }}
                        className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg flex items-center justify-center gap-2"
                      >
                        <MessageCircle className="w-5 h-5" />
                        Enviar pedido por WhatsApp
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Order Summary Sidebar */}
              <div className="lg:col-span-1">
                <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-4">
                  <h2 className="font-display font-bold text-lg mb-4 flex items-center gap-2">
                    <Package className="w-5 h-5 text-verde-bosque" />
                    Resumen
                  </h2>

                  <div className="space-y-3 mb-4 max-h-48 overflow-y-auto">
                    {items.map((item) => {
                      const itemKey = item.variant
                        ? `${item.product.id}-${item.variant.id}`
                        : item.product.id;

                      return (
                        <div key={itemKey} className="flex justify-between items-start text-sm border-b pb-2">
                          <div className="flex-1">
                            <p className="font-medium text-sm">{item.product.name}</p>
                            <p className="text-xs text-gray-500">
                              {item.quantity} {item.unit}
                            </p>
                          </div>
                          <p className="font-mono text-sm">
                            {formatPrice(item.price * item.quantity)}
                          </p>
                        </div>
                      );
                    })}
                  </div>

                  <div className="space-y-2 pt-4 border-t">
                    <div className="flex justify-between text-sm">
                      <span>Subtotal:</span>
                      <span className="font-mono">{formatPrice(totals.subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Envío:</span>
                      <span className={`font-mono ${shipping.freeShipping ? 'text-green-600' : ''}`}>
                        {shipping.freeShipping ? 'GRATIS' : formatPrice(totals.shipping)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t font-bold">
                      <span>Total:</span>
                      <span className="font-mono text-xl text-verde-bosque">
                        {formatPrice(totals.total)}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 bg-gray-50 rounded-lg p-3 text-xs text-gray-600">
                    <p><strong>Empresa:</strong> {formData.companyName}</p>
                    <p><strong>Contacto:</strong> {formData.contactName}</p>
                    <p><strong>Ciudad:</strong> {AVAILABLE_CITIES.find(c => c.value === formData.city)?.label}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Paso 3: Procesando
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-verde-bosque mx-auto mb-4"></div>
        <h3 className="text-xl font-semibold mb-2">Procesando tu pedido B2B...</h3>
        <p className="text-gray-600">Por favor espera un momento</p>
      </div>
    </div>
  );
}
