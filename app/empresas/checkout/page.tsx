'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
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
  Send,
  MessageCircle
} from 'lucide-react';
import { useBusinessCartStore } from '@/lib/business-cart-store';
import { formatPrice } from '@/lib/utils';

interface BusinessFormData {
  companyName: string;
  nit: string;
  contactName: string;
  phone: string;
  email: string;
  city: string;
  address: string;
  notes: string;
}

export default function BusinessCheckoutPage() {
  const router = useRouter();
  const { items, getTotals, shipping, clearCart } = useBusinessCartStore();
  const [mounted, setMounted] = useState(false);
  const [formData, setFormData] = useState<BusinessFormData>({
    companyName: '',
    nit: '',
    contactName: '',
    phone: '',
    email: '',
    city: '',
    address: '',
    notes: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Generate order message for WhatsApp/Email
  const generateOrderMessage = () => {
    const itemsList = items.map(item => {
      const variantInfo = item.variant ? ` (${item.variant.variant_name})` : '';
      return `- ${item.product.name}${variantInfo}: ${item.quantity} ${item.unit} x ${formatPrice(item.price)} = ${formatPrice(item.price * item.quantity)}`;
    }).join('\n');

    return `*PEDIDO EMPRESARIAL B2B*
----------------------------
*Empresa:* ${formData.companyName}
*NIT:* ${formData.nit}
*Contacto:* ${formData.contactName}
*Teléfono:* ${formData.phone}
*Email:* ${formData.email}
*Ciudad:* ${formData.city}
*Dirección:* ${formData.address}

*PRODUCTOS:*
${itemsList}

----------------------------
*Subtotal:* ${formatPrice(totals.subtotal)}
*Envío:* ${shipping.freeShipping ? 'GRATIS' : formatPrice(totals.shipping)}
*TOTAL:* ${formatPrice(totals.total)}
*Peso estimado:* ${totals.totalWeight.toFixed(1)} kg

${formData.notes ? `*Notas:* ${formData.notes}` : ''}
----------------------------
Pedido generado desde tusaguacates.com/empresas`;
  };

  const handleWhatsAppSubmit = () => {
    if (!formData.companyName || !formData.contactName || !formData.phone) {
      alert('Por favor completa los campos obligatorios');
      return;
    }

    const message = generateOrderMessage();
    const whatsappUrl = `https://wa.me/573042582777?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleEmailSubmit = async () => {
    if (!formData.companyName || !formData.contactName || !formData.email) {
      alert('Por favor completa los campos obligatorios');
      return;
    }

    setIsSubmitting(true);

    // For now, open email client with pre-filled message
    const subject = encodeURIComponent(`Pedido B2B - ${formData.companyName}`);
    const body = encodeURIComponent(generateOrderMessage().replace(/\*/g, ''));
    const mailtoUrl = `mailto:empresas@tusaguacates.com?subject=${subject}&body=${body}`;
    window.location.href = mailtoUrl;

    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-green-50 py-8 md:py-12">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/empresas"
            className="inline-flex items-center gap-2 text-verde-bosque hover:text-verde-bosque-600 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver al catálogo
          </Link>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-verde-bosque rounded-xl flex items-center justify-center">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-display font-bold">
                Finalizar Pedido B2B
              </h1>
              <p className="text-gray-600">
                Completa los datos de tu empresa para procesar el pedido
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form Section */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8">
              <h2 className="font-display font-bold text-xl mb-6 flex items-center gap-2">
                <FileText className="w-5 h-5 text-verde-bosque" />
                Datos de la Empresa
              </h2>

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
                    NIT
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

                {/* City */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ciudad
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      placeholder="Pereira, Risaralda"
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-verde-bosque focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Address */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Dirección de Entrega
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

              {/* Submit Buttons */}
              <div className="mt-8 space-y-4">
                <button
                  onClick={handleWhatsAppSubmit}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
                >
                  <MessageCircle className="w-5 h-5" />
                  Enviar Pedido por WhatsApp
                </button>

                <button
                  onClick={handleEmailSubmit}
                  disabled={isSubmitting}
                  className="w-full bg-verde-bosque hover:bg-verde-bosque/90 text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-xl disabled:opacity-50"
                >
                  <Send className="w-5 h-5" />
                  {isSubmitting ? 'Enviando...' : 'Enviar por Correo'}
                </button>

                <p className="text-center text-sm text-gray-500">
                  Al enviar, recibirás confirmación de tu pedido y coordinaremos la entrega
                </p>
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-4">
              <h2 className="font-display font-bold text-xl mb-4 flex items-center gap-2">
                <Package className="w-5 h-5 text-verde-bosque" />
                Resumen del Pedido
              </h2>

              {/* Items */}
              <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
                {items.map((item) => {
                  const itemKey = item.variant
                    ? `${item.product.id}-${item.variant.id}`
                    : item.product.id;

                  return (
                    <div key={itemKey} className="flex justify-between items-start text-sm border-b pb-2">
                      <div className="flex-1">
                        <p className="font-medium">{item.product.name}</p>
                        {item.variant && (
                          <p className="text-xs text-verde-bosque">{item.variant.variant_name}</p>
                        )}
                        <p className="text-gray-500">
                          {item.quantity} {item.unit} x {formatPrice(item.price)}
                        </p>
                      </div>
                      <p className="font-mono font-semibold">
                        {formatPrice(item.price * item.quantity)}
                      </p>
                    </div>
                  );
                })}
              </div>

              {/* Totals */}
              <div className="space-y-2 pt-4 border-t">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-mono">{formatPrice(totals.subtotal)}</span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 flex items-center gap-1">
                    <Truck className="w-4 h-4" />
                    Envío:
                  </span>
                  <span className={`font-mono ${shipping.freeShipping ? 'text-green-600 font-semibold' : ''}`}>
                    {shipping.freeShipping ? '¡GRATIS!' : formatPrice(totals.shipping)}
                  </span>
                </div>

                {shipping.freeShipping && (
                  <p className="text-xs text-green-600 bg-green-50 p-2 rounded-lg text-center">
                    Tu pedido supera los ${shipping.freeShippingMin.toLocaleString('es-CO')}
                  </p>
                )}

                <div className="flex justify-between items-center pt-3 border-t">
                  <span className="font-bold text-lg">Total:</span>
                  <span className="font-mono font-bold text-2xl text-verde-bosque">
                    {formatPrice(totals.total)}
                  </span>
                </div>

                <p className="text-xs text-gray-500 text-center">
                  Peso estimado: {totals.totalWeight.toFixed(1)} kg
                </p>
              </div>

              {/* Info */}
              <div className="mt-6 bg-verde-bosque/5 rounded-lg p-4">
                <h3 className="font-semibold text-sm text-verde-bosque mb-2">
                  Proceso de Compra B2B
                </h3>
                <ol className="text-xs text-gray-600 space-y-1">
                  <li>1. Envía tu pedido por WhatsApp o correo</li>
                  <li>2. Te confirmaremos disponibilidad</li>
                  <li>3. Coordinaremos fecha y hora de entrega</li>
                  <li>4. Pago contra entrega o transferencia</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
