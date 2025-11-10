'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { CheckCircle, Package, Truck, Phone, Mail, ArrowRight } from 'lucide-react';
import Link from 'next/link';

function ConfirmacionContent() {
  const searchParams = useSearchParams();
  const [orderNumber, setOrderNumber] = useState<string>('');

  useEffect(() => {
    const order = searchParams?.get('order');
    if (order) {
      setOrderNumber(order);
    }
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-crema via-white to-verde-aguacate-50 py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto">
          {/* Success Card */}
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center mb-8">
            {/* Success Icon */}
            <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>

            {/* Title */}
            <h1 className="font-display font-bold text-3xl md:text-4xl text-gray-900 mb-3">
              ¡Pedido Confirmado!
            </h1>
            <p className="text-lg text-gray-600 mb-6">
              Gracias por tu compra. Hemos recibido tu pedido exitosamente.
            </p>

            {/* Order Number */}
            <div className="bg-verde-aguacate-50 rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-600 mb-1">
                Número de Pedido
              </p>
              <p className="font-mono font-bold text-xl text-verde-bosque">
                #{orderNumber}
              </p>
            </div>

            {/* Info Message */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 text-left">
              <p className="text-sm text-yellow-800">
                <strong>📞 Próximos pasos:</strong> Nuestro equipo se pondrá en contacto contigo 
                en las próximas horas para confirmar los detalles del pedido y coordinar el pago 
                y la entrega.
              </p>
            </div>

            {/* Next Steps */}
            <div className="grid md:grid-cols-3 gap-4 mb-8">
              <div className="text-center p-4">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-verde-bosque-100 rounded-full mb-3">
                  <Phone className="w-6 h-6 text-verde-bosque" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">
                  Confirmación
                </h3>
                <p className="text-sm text-gray-600">
                  Te llamaremos para confirmar
                </p>
              </div>

              <div className="text-center p-4">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-verde-bosque-100 rounded-full mb-3">
                  <Package className="w-6 h-6 text-verde-bosque" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">
                  Preparación
                </h3>
                <p className="text-sm text-gray-600">
                  Empacamos tus productos
                </p>
              </div>

              <div className="text-center p-4">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-verde-bosque-100 rounded-full mb-3">
                  <Truck className="w-6 h-6 text-verde-bosque" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">
                  Entrega
                </h3>
                <p className="text-sm text-gray-600">
                  Enviamos a tu domicilio
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/cuenta"
                className="flex-1 bg-verde-bosque hover:bg-verde-bosque-600 text-white font-semibold py-3 rounded-lg transition-all flex items-center justify-center gap-2"
              >
                Ver Mis Pedidos
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="/productos"
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold py-3 rounded-lg transition-all"
              >
                Seguir Comprando
              </Link>
            </div>
          </div>

          {/* Contact Info */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="font-semibold text-lg text-gray-900 mb-4">
              ¿Necesitas ayuda?
            </h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-gray-700">
                <Mail className="w-5 h-5 text-verde-bosque" />
                <span className="text-sm">
                  <strong>Email:</strong> soporte@tusaguacates.com
                </span>
              </div>
              <div className="flex items-center gap-3 text-gray-700">
                <Phone className="w-5 h-5 text-verde-bosque" />
                <span className="text-sm">
                  <strong>Teléfono:</strong> +57 300 123 4567
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ConfirmacionPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-verde-bosque"></div>
      </div>
    }>
      <ConfirmacionContent />
    </Suspense>
  );
}
