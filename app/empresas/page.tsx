'use client';

import Link from 'next/link';
import { ArrowRight, Package, Truck, Star, Phone, Mail, Building2, Scale } from 'lucide-react';
import { BusinessCategories } from '@/components/categories/BusinessCategories';
import { BUSINESS_PRODUCTS, BUSINESS_CATEGORIES } from '@/lib/business-products';

export default function EmpresasPage() {
  const totalProducts = BUSINESS_PRODUCTS.length;
  const totalCategories = BUSINESS_CATEGORIES.length;

  return (
    <div>
      {/* Hero Section - Verde corporativo */}
      <section className="bg-gradient-to-r from-verde-bosque via-verde-aguacate to-verde-bosque text-white py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            {/* Badge B2B */}
            <div className="inline-flex items-center gap-2 bg-white/20 px-4 py-2 rounded-full mb-6">
              <Building2 className="w-5 h-5" />
              <span className="font-semibold">Canal Empresarial B2B</span>
            </div>

            <h1 className="font-display font-bold text-4xl md:text-5xl lg:text-6xl mb-4">
              Venta Mayorista para Empresas
            </h1>
            <p className="text-xl md:text-2xl mb-4 text-white/90">
              Del Eje Cafetero a tu Negocio
            </p>
            <p className="text-lg md:text-xl mb-8 max-w-2xl mx-auto text-white/80">
              {totalProducts} productos de alta rotación para restaurantes, hoteles, catering y empresas.
              <br />
              <strong>Precios escalonados por volumen.</strong>
            </p>

            {/* Stats */}
            <div className="flex flex-wrap justify-center gap-6 mb-8">
              <div className="bg-white/10 backdrop-blur px-6 py-3 rounded-xl">
                <div className="text-3xl font-bold">{totalProducts}</div>
                <div className="text-sm text-white/70">Productos B2B</div>
              </div>
              <div className="bg-white/10 backdrop-blur px-6 py-3 rounded-xl">
                <div className="text-3xl font-bold">{totalCategories}</div>
                <div className="text-sm text-white/70">Categorías</div>
              </div>
              <div className="bg-white/10 backdrop-blur px-6 py-3 rounded-xl">
                <div className="text-3xl font-bold">12</div>
                <div className="text-sm text-white/70">Variedades Aguacate</div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="mailto:empresas@tusaguacates.com"
                className="inline-flex items-center justify-center bg-white text-verde-bosque hover:bg-gray-100 font-bold px-8 py-4 rounded-xl transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <Mail className="w-5 h-5 mr-2" />
                empresas@tusaguacates.com
              </a>
              <a
                href="tel:+573042582777"
                className="inline-flex items-center justify-center bg-yellow-500 text-verde-bosque-900 hover:bg-yellow-400 font-bold px-8 py-4 rounded-xl transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <Phone className="w-5 h-5 mr-2" />
                +57 304 258 2777
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Categorías B2B */}
      <section className="py-12 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <h2 className="font-display font-bold text-2xl md:text-3xl mb-2">
              Catálogo Mayorista
            </h2>
            <p className="text-gray-600">
              Productos seleccionados de alta rotación para tu negocio
            </p>
          </div>

          {/* Usar el componente de categorías B2B */}
          <BusinessCategories variant="grid" />
        </div>
      </section>

      {/* Sección especial de Aguacates */}
      <section className="py-16 bg-gradient-to-b from-white to-green-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <span className="text-5xl mb-4 block">🥑</span>
              <h2 className="font-display font-bold text-2xl md:text-3xl mb-2">
                Especialistas en Aguacate
              </h2>
              <p className="text-gray-600">
                4 variedades × 3 estados de maduración = Control total para tu cocina
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Variedades */}
              <div className="bg-white rounded-2xl p-6 shadow-lg">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                  <span className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">🥑</span>
                  Variedades Disponibles
                </h3>
                <ul className="space-y-3">
                  <li className="flex items-center gap-3">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    <span><strong>Hass</strong> - El clásico, cremoso y versátil</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    <span><strong>Papelillo/Lorena</strong> - Suave y mantequilloso</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    <span><strong>Semil</strong> - Textura única</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    <span><strong>Choquette</strong> - Grande y cremoso</span>
                  </li>
                </ul>
              </div>

              {/* Estados de maduración */}
              <div className="bg-white rounded-2xl p-6 shadow-lg">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                  <span className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">⏱️</span>
                  Estados de Maduración
                </h3>
                <ul className="space-y-3">
                  <li className="flex items-center gap-3">
                    <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                    <span><strong>Verde</strong> - Madura en 4-7 días (mejor precio)</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="w-3 h-3 bg-yellow-500 rounded-full"></span>
                    <span><strong>Pintón</strong> - Listo en 1-3 días</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="w-3 h-3 bg-orange-500 rounded-full"></span>
                    <span><strong>Maduro</strong> - Consumo inmediato</span>
                  </li>
                </ul>
                <p className="text-xs text-gray-500 mt-4">
                  * El precio aumenta según el estado de maduración debido a la pérdida de peso por deshidratación.
                </p>
              </div>
            </div>

            <div className="text-center mt-8">
              <Link
                href="/empresas/aguacates"
                className="inline-flex items-center gap-2 bg-verde-bosque hover:bg-verde-bosque/90 text-white font-bold px-8 py-4 rounded-xl transition-all shadow-lg hover:shadow-xl"
              >
                Ver Catálogo de Aguacates
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Proceso de Compra */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="font-display font-bold text-3xl md:text-4xl mb-4">
              Proceso de Compra B2B
            </h2>
            <p className="text-gray-600 text-lg">
              Simple y eficiente para tu negocio
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
            {[
              {
                number: '1',
                icon: '🛒',
                title: 'Selecciona Productos',
                description: 'Elige la variedad, estado de maduración y cantidad en kg'
              },
              {
                number: '2',
                icon: '📦',
                title: 'Arma tu Pedido',
                description: 'Agrega al carrito B2B con precios por volumen automáticos'
              },
              {
                number: '3',
                icon: '✅',
                title: 'Confirma y Paga',
                description: 'Checkout simplificado o contacto directo por WhatsApp'
              },
              {
                number: '4',
                icon: '🚚',
                title: 'Recibe tu Pedido',
                description: 'Entrega coordinada según las necesidades de tu negocio'
              }
            ].map((step) => (
              <div key={step.number} className="text-center">
                <div className="w-16 h-16 bg-verde-bosque text-white rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold shadow-lg">
                  {step.icon}
                </div>
                <h3 className="font-display font-bold text-xl mb-2">{step.title}</h3>
                <p className="text-gray-600">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Beneficios */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="font-display font-bold text-3xl md:text-4xl mb-4">
              Beneficios para tu Negocio
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all">
              <div className="w-16 h-16 bg-verde-bosque/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Scale className="w-8 h-8 text-verde-bosque" />
              </div>
              <h3 className="font-display font-bold text-xl mb-3 text-center">
                Precios por Volumen
              </h3>
              <p className="text-gray-600 text-center">
                3 niveles de precios: 5-20kg, 20-100kg, 100-300kg. Cuanto más compres, mejor precio por kg.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all">
              <div className="w-16 h-16 bg-verde-bosque/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Truck className="w-8 h-8 text-verde-bosque" />
              </div>
              <h3 className="font-display font-bold text-xl mb-3 text-center">
                Entregas Flexibles
              </h3>
              <p className="text-gray-600 text-center">
                Coordinamos entregas según tu operación. Envío gratis en pedidos mayores a $500.000.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all">
              <div className="w-16 h-16 bg-verde-bosque/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Star className="w-8 h-8 text-verde-bosque" />
              </div>
              <h3 className="font-display font-bold text-xl mb-3 text-center">
                Calidad Premium
              </h3>
              <p className="text-gray-600 text-center">
                Productos frescos directos del Eje Cafetero. Control de maduración en aguacates.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-16 md:py-24 bg-verde-bosque text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="font-display font-bold text-3xl md:text-5xl mb-6">
            ¿Listo para Empezar?
          </h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto text-white/80">
            Explora nuestro catálogo B2B y arma tu primer pedido mayorista
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/empresas/aguacates"
              className="inline-flex items-center justify-center bg-yellow-500 text-verde-bosque-900 hover:bg-yellow-400 font-bold px-8 py-4 rounded-xl transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              Ver Catálogo Completo
              <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
            <a
              href="https://wa.me/573042582777?text=Hola,%20quiero%20información%20sobre%20pedidos%20mayoristas"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center bg-green-600 text-white hover:bg-green-500 font-bold px-8 py-4 rounded-xl transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              💬 Contactar por WhatsApp
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
