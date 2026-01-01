'use client';

import Link from 'next/link';
import { ArrowRight, Phone, Mail, Building2, Scale, Truck, Star, Database, Leaf, Package } from 'lucide-react';
import { BusinessCategories } from '@/components/categories/BusinessCategories';
import { useB2BProducts, useB2BCategories } from '@/hooks/useB2BProducts';

export default function EmpresasPage() {
  const { products, source } = useB2BProducts();
  const { categories } = useB2BCategories();

  const totalProducts = products.length;
  const totalCategories = categories.length;
  const aguacateCount = products.filter(p => p.categorySlug === 'aguacates').length;

  return (
    <div>
      {/* Hero Section - Tus Aguacates brand identity */}
      <section className="bg-gradient-to-r from-verde-bosque via-verde-aguacate to-verde-bosque text-white py-20 md:py-28 relative overflow-hidden">
        {/* Animated background elements - Enhanced */}
        <div className="absolute inset-0">
          {/* Large gradient orbs */}
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-naranja-frutal/20 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '4s' }} />
          <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-yellow-400/15 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '5s', animationDelay: '1s' }} />

          {/* Floating circles with gradient */}
          <div className="absolute top-20 left-10 w-64 h-64 rounded-full animate-float" style={{
            background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)',
            animationDuration: '8s'
          }} />
          <div className="absolute bottom-20 right-10 w-80 h-80 rounded-full animate-float" style={{
            background: 'radial-gradient(circle, rgba(232,168,56,0.15) 0%, transparent 70%)',
            animationDuration: '10s',
            animationDelay: '2s'
          }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full animate-float" style={{
            background: 'radial-gradient(circle, rgba(255,255,255,0.05) 0%, transparent 60%)',
            animationDuration: '12s',
            animationDelay: '4s'
          }} />

          {/* Decorative border circles */}
          <div className="absolute top-10 left-10 w-64 h-64 border-2 border-white/20 rounded-full animate-pulse" style={{ animationDuration: '3s' }} />
          <div className="absolute bottom-10 right-10 w-96 h-96 border-2 border-white/15 rounded-full animate-pulse" style={{ animationDuration: '4s', animationDelay: '1s' }} />
          <div className="absolute top-1/2 left-20 w-48 h-48 border border-dorado/30 rounded-full animate-pulse" style={{ animationDuration: '5s', animationDelay: '2s' }} />

          {/* Small floating particles - Frutas y verduras en blanco */}
          {['🥑', '🍋', '🍊', '🍓', '🥝', '🍅', '🥕', '🥦', '🍆', '🌶️', '🍌', '🍏', '🍐', '🥬'].map((emoji, i) => (
            <div
              key={i}
              className="absolute text-2xl md:text-3xl animate-float drop-shadow-lg opacity-40"
              style={{
                top: `${Math.random() * 90 + 5}%`,
                left: `${Math.random() * 90 + 5}%`,
                animationDuration: `${6 + Math.random() * 6}s`,
                animationDelay: `${Math.random() * 4}s`,
                filter: 'brightness(0) invert(1)',
              }}
            >
              {emoji}
            </div>
          ))}

          {/* Gradient overlay for depth */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/10" />
        </div>

        <div className="container mx-auto px-4 relative">
          <div className="max-w-4xl mx-auto text-center">
            {/* B2B Badge */}
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-5 py-2.5 rounded-full mb-8">
              <Building2 className="w-5 h-5" />
              <span className="font-display font-semibold">Canal Empresarial B2B</span>
            </div>

            <h1 className="font-display font-bold text-4xl md:text-5xl lg:text-6xl mb-4">
              Venta Mayorista para Empresas
            </h1>
            <p className="text-xl md:text-2xl mb-4 text-white/90">
              Del Eje Cafetero a tu Negocio
            </p>
            <p className="text-lg md:text-xl mb-8 max-w-2xl mx-auto text-white/80">
              <span className="font-bold text-naranja-frutal">{totalProducts}+ productos</span> de alta rotación
              <br />
              para restaurantes, hoteles, catering y empresas.
              <br />
              <span className="font-semibold">Precios escalonados por volumen.</span>
            </p>

            {/* Stats con estilo de marca */}
            <div className="flex flex-wrap justify-center gap-5 mb-10">
              {[
                { value: totalProducts || '~30', label: 'Productos B2B', icon: Package },
                { value: totalCategories || 7, label: 'Categorías', icon: Leaf },
                { value: aguacateCount || 12, label: 'Variedades Aguacate', icon: Star },
              ].map((stat, index) => (
                <div
                  key={index}
                  className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-6 py-4 hover:bg-white/15 transition-all hover:scale-105"
                >
                  <stat.icon className="w-5 h-5 text-naranja-frutal mx-auto mb-2" />
                  <div className="font-display text-3xl font-bold">{stat.value}</div>
                  <div className="text-sm text-white/70">{stat.label}</div>
                </div>
              ))}
            </div>

            {/* Data source indicator */}
            {source === 'supabase' && (
              <div className="flex justify-center mb-8">
                <span className="inline-flex items-center gap-2 text-sm bg-white/20 px-4 py-2 rounded-full">
                  <Database className="w-4 h-4" />
                  Precios actualizados en tiempo real
                </span>
              </div>
            )}

            {/* CTAs con estilo de marca */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="mailto:empresas@tusaguacates.com"
                className="group inline-flex items-center justify-center bg-gradient-to-r from-naranja-frutal to-yellow-500 hover:from-naranja-frutal/90 hover:to-yellow-500/90 text-verde-bosque font-bold px-8 py-4 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 border-2 border-verde-aguacate"
              >
                <Mail className="w-5 h-5 mr-2" />
                empresas@tusaguacates.com
              </a>
              <a
                href="tel:+573042582777"
                className="inline-flex items-center justify-center bg-white/20 backdrop-blur-sm border-2 border-white/30 hover:border-white/50 text-white font-bold px-8 py-4 rounded-xl transition-all duration-200 hover:scale-105"
              >
                <Phone className="w-5 h-5 mr-2" />
                +57 304 258 2777
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Categorías B2B */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10">
            <span className="inline-block text-naranja-frutal font-bold text-sm tracking-widest uppercase mb-2">
              Catálogo Exclusivo
            </span>
            <h2 className="font-display font-bold text-3xl md:text-4xl mb-3">
              Selección Mayorista
            </h2>
            <p className="text-gray-600 text-lg">
              Productos premium seleccionados para alta rotación en tu negocio
            </p>
          </div>

          <BusinessCategories variant="grid" />
        </div>
      </section>

      {/* Sección especial de Aguacates */}
      <section className="py-16 gradient-suave">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-10">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-verde-bosque rounded-2xl shadow-lg mb-4">
                <span className="text-3xl">🥑</span>
              </div>
              <h2 className="font-display font-bold text-3xl md:text-4xl mb-3">
                Especialistas en Aguacate
              </h2>
              <p className="text-gray-600 text-lg">
                4 variedades × 3 estados de maduración = <span className="font-bold text-verde-bosque">Control total</span> para tu cocina
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Variedades */}
              <div className="bg-white rounded-2xl p-6 shadow-soft hover:shadow-medium transition-all duration-200 hover:-translate-y-1">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-12 h-12 bg-verde-bosque rounded-xl flex items-center justify-center">
                    <span className="text-xl">🥑</span>
                  </div>
                  <h3 className="font-display font-bold text-xl text-verde-bosque">Variedades</h3>
                </div>
                <ul className="space-y-3">
                  {[
                    { name: 'Hass', desc: 'El clásico, cremoso y versátil' },
                    { name: 'Papelillo/Lorena', desc: 'Suave y mantequilloso' },
                    { name: 'Semil', desc: 'Textura única' },
                    { name: 'Choquette', desc: 'Grande y cremoso' },
                  ].map((variety, i) => (
                    <li key={i} className="flex items-center gap-3">
                      <span className="w-2 h-2 bg-verde-bosque rounded-full flex-shrink-0" />
                      <span className="text-gray-700">
                        <span className="font-semibold text-verde-bosque">{variety.name}</span> — {variety.desc}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Estados de maduración */}
              <div className="bg-white rounded-2xl p-6 shadow-soft hover:shadow-medium transition-all duration-200 hover:-translate-y-1">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-12 h-12 bg-naranja-frutal rounded-xl flex items-center justify-center">
                    <span className="text-xl">⏱️</span>
                  </div>
                  <h3 className="font-display font-bold text-xl text-verde-bosque">Maduración</h3>
                </div>
                <ul className="space-y-3">
                  {[
                    { name: 'Verde', desc: 'Madura en 4-7 días', highlight: 'mejor precio', color: 'bg-verde-bosque' },
                    { name: 'Pintón', desc: 'Listo en 1-3 días', highlight: '', color: 'bg-yellow-500' },
                    { name: 'Maduro', desc: 'Consumo inmediato', highlight: '', color: 'bg-naranja-frutal' },
                  ].map((state, i) => (
                    <li key={i} className="flex items-center gap-3">
                      <span className={`w-3 h-3 ${state.color} rounded-full flex-shrink-0`} />
                      <span className="text-gray-700">
                        <span className="font-semibold text-verde-bosque">{state.name}</span> — {state.desc}
                        {state.highlight && <span className="text-naranja-frutal font-semibold"> ({state.highlight})</span>}
                      </span>
                    </li>
                  ))}
                </ul>
                <p className="text-xs text-gray-500 mt-4 italic border-t border-gray-100 pt-3">
                  * El precio varía según maduración por pérdida de peso natural
                </p>
              </div>
            </div>

            <div className="text-center mt-10">
              <Link
                href="/empresas/aguacates"
                className="group inline-flex items-center gap-2 bg-verde-bosque hover:bg-verde-bosque/90 text-white font-bold px-8 py-4 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                Ver Catálogo de Aguacates
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Proceso de Compra */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <span className="inline-block text-naranja-frutal font-bold text-sm tracking-widest uppercase mb-2">
              Experiencia Simplificada
            </span>
            <h2 className="font-display font-bold text-3xl md:text-4xl mb-3">
              Proceso de Compra B2B
            </h2>
            <p className="text-gray-600 text-lg">
              Simple y eficiente para tu negocio
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {[
              {
                number: '1',
                icon: '🛒',
                title: 'Selecciona',
                description: 'Variedad, maduración y cantidad en kg'
              },
              {
                number: '2',
                icon: '📦',
                title: 'Arma Pedido',
                description: 'Carrito con precios por volumen'
              },
              {
                number: '3',
                icon: '✅',
                title: 'Confirma',
                description: 'Checkout o WhatsApp directo'
              },
              {
                number: '4',
                icon: '🚚',
                title: 'Recibe',
                description: 'Entrega coordinada a tu negocio'
              }
            ].map((step, index) => (
              <div key={step.number} className="relative">
                {/* Number badge */}
                <div className="absolute -top-2 -right-2 w-7 h-7 bg-naranja-frutal text-white rounded-full flex items-center justify-center font-display text-sm font-bold shadow-lg z-10">
                  {step.number}
                </div>
                <div className="bg-gradient-to-br from-verde-bosque/5 to-verde-aguacate/10 rounded-xl p-6 hover:shadow-medium transition-all duration-200 border border-verde-bosque/10 hover:border-verde-bosque/20 text-center h-full">
                  <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center mx-auto mb-4 shadow-soft text-2xl">
                    {step.icon}
                  </div>
                  <h3 className="font-display font-bold text-lg mb-2 text-verde-bosque">{step.title}</h3>
                  <p className="text-gray-600 text-sm">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Beneficios */}
      <section className="py-16 gradient-suave">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <span className="inline-block text-naranja-frutal font-bold text-sm tracking-widest uppercase mb-2">
              Ventajas Exclusivas
            </span>
            <h2 className="font-display font-bold text-3xl md:text-4xl mb-3">
              Beneficios para tu Negocio
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[
              {
                icon: Scale,
                title: 'Precios por Volumen',
                description: '3 niveles: 5-20kg, 20-100kg, 100-300kg. Mayor cantidad, mejor precio por kilo.',
                color: 'verde-bosque',
              },
              {
                icon: Truck,
                title: 'Entregas Flexibles',
                description: 'Coordinamos según tu operación. Envío gratis en pedidos mayores a $100.000.',
                color: 'verde-aguacate',
              },
              {
                icon: Star,
                title: 'Calidad Premium',
                description: 'Frescos directos del Eje Cafetero. Control de maduración garantizado.',
                color: 'naranja-frutal',
              }
            ].map((benefit, index) => (
              <div
                key={index}
                className="group bg-white rounded-2xl p-8 shadow-soft hover:shadow-medium transition-all duration-200 hover:-translate-y-1"
              >
                <div className={`w-14 h-14 bg-${benefit.color} rounded-xl flex items-center justify-center mx-auto mb-5 shadow-lg group-hover:scale-110 transition-transform`}>
                  <benefit.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="font-display font-bold text-xl mb-3 text-center text-verde-bosque">
                  {benefit.title}
                </h3>
                <p className="text-gray-600 text-center text-sm leading-relaxed">
                  {benefit.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-20 bg-gradient-to-r from-verde-bosque via-verde-aguacate to-verde-bosque text-white relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-64 h-64 border-4 border-white/30 rounded-full animate-pulse" />
          <div className="absolute bottom-10 right-10 w-96 h-96 border-4 border-white/20 rounded-full animate-pulse" style={{ animationDelay: '1s' }} />
        </div>

        <div className="container mx-auto px-4 text-center relative">
          <div className="max-w-4xl mx-auto">
            <h2 className="font-display font-bold text-3xl md:text-5xl mb-5">
              ¿Listo para Empezar?
            </h2>
            <p className="text-lg md:text-xl mb-10 max-w-2xl mx-auto text-white/90">
              Explora nuestro catálogo B2B exclusivo y arma tu primer pedido mayorista
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/empresas/aguacates"
                className="group inline-flex items-center justify-center bg-gradient-to-r from-naranja-frutal to-yellow-500 hover:from-naranja-frutal/90 hover:to-yellow-500/90 text-verde-bosque font-bold px-10 py-5 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 border-2 border-verde-aguacate"
              >
                Ver Catálogo Completo
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <a
                href="https://wa.me/573042582777?text=Hola,%20quiero%20información%20sobre%20pedidos%20mayoristas"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center bg-white/20 backdrop-blur-sm border-2 border-white/30 hover:border-white/50 text-white font-bold px-10 py-5 rounded-xl transition-all duration-200 hover:scale-105"
              >
                💬 WhatsApp Directo
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
