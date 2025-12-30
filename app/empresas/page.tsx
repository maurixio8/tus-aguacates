'use client';

import Link from 'next/link';
import { ArrowRight, Package, Truck, Star, Phone, Mail } from 'lucide-react';
import dynamic from 'next/dynamic';

// Usar el mismo componente de categorías que los clientes normales
const UnifiedCategories = dynamic(
  () => import('@/components/categories/UnifiedCategories'),
  {
    loading: () => (
      <div className="flex gap-4 overflow-x-auto">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="w-24 h-24 bg-gray-100 animate-pulse rounded-lg flex-shrink-0" />
        ))}
      </div>
    ),
    ssr: true
  }
);

export default function EmpresasPage() {
  return (
    <div>
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="font-display font-bold text-4xl md:text-5xl lg:text-6xl mb-4">
              Venta a Empresas
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-white/90">
              Del Eje Cafetero a tu Mesa
            </p>
            <p className="text-lg md:text-xl mb-8 max-w-2xl mx-auto">
              Productos frescos y de calidad premium para tu restaurante, hotel o negocio.
              Cuanto más compres, mejor precio.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="mailto:empresas@tusaguacates.com"
                className="inline-flex items-center justify-center bg-white text-orange-600 hover:bg-gray-100 font-bold px-8 py-4 rounded-xl transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <Mail className="w-5 h-5 mr-2" />
                empresas@tusaguacates.com
              </a>
              <a
                href="tel:+573042582777"
                className="inline-flex items-center justify-center bg-verde-bosque-700 text-white hover:bg-verde-bosque-800 font-bold px-8 py-4 rounded-xl transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <Phone className="w-5 h-5 mr-2" />
                +57 304 258 2777
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Categorías - Usando el mismo componente que clientes normales */}
      <section className="py-12 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <h2 className="font-display font-bold text-2xl md:text-3xl mb-2">
              Explora Nuestro Catálogo
            </h2>
            <p className="text-gray-600">
              La misma calidad y frescura para tu negocio
            </p>
          </div>
          <UnifiedCategories
            variant="scroll"
            showProductCount={false}
            baseHref="/empresas"
          />
        </div>
      </section>

      {/* Proceso de Compra */}
      <section className="py-16 bg-gradient-to-b from-white to-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="font-display font-bold text-3xl md:text-4xl mb-4">
              Proceso de Compra
            </h2>
            <p className="text-gray-600 text-lg">
              Simple y eficiente para tu negocio
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
            {[
              {
                number: '1',
                title: 'Explora el Catálogo',
                description: 'Revisa nuestros productos frescos y de calidad premium'
              },
              {
                number: '2',
                title: 'Realiza tu Pedido',
                description: 'Contáctanos y coordina tu orden según tus necesidades'
              },
              {
                number: '3',
                title: 'Confirmación',
                description: 'Recibe confirmación de tu pedido y precio especial'
              },
              {
                number: '4',
                title: 'Entrega',
                description: 'Recibe tus productos frescos en la fecha acordada'
              }
            ].map((step) => (
              <div key={step.number} className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-amber-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold shadow-lg">
                  {step.number}
                </div>
                <h3 className="font-display font-bold text-xl mb-2">{step.title}</h3>
                <p className="text-gray-600">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Beneficios para Empresas */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="font-display font-bold text-3xl md:text-4xl mb-4">
              Beneficios para tu Negocio
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all border-2 border-gray-100">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Package className="w-8 h-8 text-orange-600" />
              </div>
              <h3 className="font-display font-bold text-xl mb-3 text-center">
                Precios por Volumen
              </h3>
              <p className="text-gray-600 text-center">
                Cuanto más compres, mejor precio. Tarifas especiales para empresas y pedidos al por mayor.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all border-2 border-gray-100">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Truck className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="font-display font-bold text-xl mb-3 text-center">
                Entregas Flexibles
              </h3>
              <p className="text-gray-600 text-center">
                Coordinamos las entregas según las necesidades de tu establecimiento. Frecuencia personalizada.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all border-2 border-gray-100">
              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Star className="w-8 h-8 text-amber-600" />
              </div>
              <h3 className="font-display font-bold text-xl mb-3 text-center">
                Productos Premium
              </h3>
              <p className="text-gray-600 text-center">
                Selección especial de productos de la más alta calidad para tu negocio gastronómico.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-16 md:py-24 gradient-verde text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="font-display font-bold text-3xl md:text-5xl mb-6">
            ¿Listo para Empezar?
          </h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Regístrate para acceder a precios exclusivos para empresas
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="mailto:empresas@tusaguacates.com"
              className="inline-flex items-center justify-center bg-gradient-to-r from-yellow-400 to-yellow-600 text-verde-bosque-700 hover:from-yellow-500 hover:to-yellow-700 font-bold px-8 py-4 rounded-xl transition-all shadow-lg hover:shadow-xl transform hover:scale-105 border-2 border-verde-aguacate"
            >
              Contactar Ahora
              <ArrowRight className="ml-2 w-5 h-5" />
            </a>
            <Link
              href="/tienda"
              className="inline-flex items-center justify-center bg-white text-verde-bosque-700 hover:bg-gray-100 font-bold px-8 py-4 rounded-xl transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              Ver Catálogo Completo
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
