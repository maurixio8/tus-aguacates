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
    <div className="font-modern">
      {/* Hero Section - Luxury Agrícola */}
      <section className="relative min-h-[90vh] flex items-center overflow-hidden bg-esmeralda">
        {/* Decorative background elements */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-64 h-64 border border-champagne/30 rounded-full animate-float" style={{ animationDelay: '0s' }} />
          <div className="absolute bottom-20 right-10 w-96 h-96 border border-champagne/20 rounded-full animate-float" style={{ animationDelay: '2s' }} />
          <div className="absolute top-1/2 left-1/3 w-48 h-48 border border-dorado/30 rounded-full animate-float" style={{ animationDelay: '4s' }} />
        </div>

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-esmeralda via-esmeralda/95 to-esmeralda/90" />

        {/* Texture overlay */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImEiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTTAgNDBMMDQgMEgwIiBmaWxsPSIjZmZmIiBmaWxsLW9wYWNpdHk9Ii4wMyIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNhKSIvPjwvc3ZnPg==')] opacity-30" />

        <div className="relative container mx-auto px-4 py-20 md:py-32">
          <div className="max-w-5xl mx-auto">
            {/* Premium badge */}
            <div className="inline-flex items-center gap-3 bg-champagne/20 backdrop-blur-sm border border-champagne/30 px-6 py-3 rounded-full mb-10 animate-reveal" style={{ animationDelay: '0.1s' }}>
              <div className="w-2 h-2 bg-dorado rounded-full animate-pulse" />
              <Building2 className="w-4 h-4 text-champagne" />
              <span className="font-elegant text-champagne font-medium tracking-wide text-sm">Canal Empresarial Exclusivo</span>
            </div>

            {/* Main heading with elegant typography */}
            <h1 className="font-elegant font-bold text-5xl md:text-7xl lg:text-8xl mb-6 leading-tight animate-reveal" style={{ animationDelay: '0.2s' }}>
              <span className="text-white">Venta Mayorista</span>
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-champagne via-dorado to-champagne bg-[length:200%_auto] animate-shine">
                para Empresas
              </span>
            </h1>

            {/* Subtitle with elegant styling */}
            <p className="font-modern text-xl md:text-2xl mb-6 text-champagne/90 tracking-wide animate-reveal" style={{ animationDelay: '0.3s' }}>
              Del Eje Cafetero a tu Negocio
            </p>

            <p className="font-modern text-lg md:text-xl mb-12 max-w-2xl text-white/80 leading-relaxed animate-reveal" style={{ animationDelay: '0.4s' }}>
              <span className="font-semibold text-champagne">{totalProducts}+ productos</span> de alta rotación
              <br />
              para restaurantes, hoteles, catering y empresas.
              <br />
              <span className="text-champagne font-medium">Precios escalonados por volumen.</span>
            </p>

            {/* Elegant stats display */}
            <div className="flex flex-wrap justify-center gap-8 mb-12 animate-reveal" style={{ animationDelay: '0.5s' }}>
              {[
                { value: totalProducts || '~30', label: 'Productos B2B', icon: Package },
                { value: totalCategories || 7, label: 'Categorías Premium', icon: Leaf },
                { value: aguacateCount || 12, label: 'Variedades Aguacate', icon: Star },
              ].map((stat, index) => (
                <div
                  key={index}
                  className="group relative bg-white/5 backdrop-blur-sm border border-champagne/20 rounded-2xl px-8 py-6 hover:bg-white/10 transition-all duration-500 hover:scale-105"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-champagne/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="relative">
                    <stat.icon className="w-5 h-5 text-dorado mb-2" />
                    <div className="font-elegant text-4xl font-bold text-white mb-1">{stat.value}</div>
                    <div className="font-modern text-sm text-champagne/70">{stat.label}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Data source indicator with elegant styling */}
            {source === 'supabase' && (
              <div className="flex justify-center mb-10 animate-reveal" style={{ animationDelay: '0.6s' }}>
                <span className="inline-flex items-center gap-2 text-sm bg-champagne/10 border border-champagne/20 px-5 py-2.5 rounded-full">
                  <Database className="w-4 h-4 text-dorado" />
                  <span className="text-champagne/90">Precios en tiempo real</span>
                </span>
              </div>
            )}

            {/* Elegant CTA buttons */}
            <div className="flex flex-col sm:flex-row gap-5 justify-center animate-reveal" style={{ animationDelay: '0.7s' }}>
              <a
                href="mailto:empresas@tusaguacates.com"
                className="group relative inline-flex items-center justify-center bg-gradient-to-r from-champagne to-dorado hover:from-dorado hover:to-champagne text-esmeralda font-elegant font-semibold px-10 py-5 rounded-2xl transition-all duration-500 shadow-elegant hover:shadow-gold-glow hover:scale-105 overflow-hidden"
              >
                <span className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                <Mail className="w-5 h-5 mr-3 relative z-10" />
                <span className="relative z-10">empresas@tusaguacates.com</span>
              </a>
              <a
                href="tel:+573042582777"
                className="group inline-flex items-center justify-center bg-white/10 backdrop-blur-sm border-2 border-champagne/30 hover:border-champagne hover:bg-white/20 text-white font-elegant font-semibold px-10 py-5 rounded-2xl transition-all duration-500 hover:scale-105"
              >
                <Phone className="w-5 h-5 mr-3 text-champagne" />
                +57 304 258 2777
              </a>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-champagne/30 rounded-full flex items-start justify-center p-2">
            <div className="w-1 h-2 bg-champagne rounded-full" />
          </div>
        </div>
      </section>

      {/* Categorías B2B - Enhanced */}
      <section className="py-24 bg-gradient-to-b from-antiguo/30 to-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <div className="inline-block">
              <span className="font-elegant text-dorado text-lg tracking-widest uppercase mb-4 block">Catálogo Exclusivo</span>
            </div>
            <h2 className="font-elegant font-bold text-4xl md:text-5xl mb-4 text-esmeralda">
              Selección Mayorista
            </h2>
            <p className="font-modern text-gray-600 text-lg max-w-2xl mx-auto">
              Productos premium seleccionados para alta rotación en tu negocio
            </p>
          </div>

          <BusinessCategories variant="grid" />
        </div>
      </section>

      {/* Sección especial de Aguacates - Luxury redesign */}
      <section className="py-24 bg-gradient-to-br from-esmeralda/5 via-champagne/10 to-esmeralda/5 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-dorado/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-esmeralda/10 rounded-full blur-3xl" />

        <div className="relative container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-esmeralda to-esmeralda/80 rounded-3xl shadow-elegant mb-6">
                <span className="text-4xl">🥑</span>
              </div>
              <h2 className="font-elegant font-bold text-4xl md:text-5xl mb-4 text-esmeralda">
                Especialistas en Aguacate
              </h2>
              <p className="font-modern text-gray-600 text-lg">
                4 variedades × 3 estados de maduración = <span className="text-esmeralda font-semibold">Control total</span> para tu cocina
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Variedades - Luxury card */}
              <div className="group relative bg-white rounded-3xl p-8 shadow-elegant hover:shadow-elegant-lg transition-all duration-500 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-esmeralda/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-14 h-14 bg-gradient-to-br from-esmeralda to-esmeralda/80 rounded-2xl flex items-center justify-center shadow-lg">
                      <span className="text-2xl">🥑</span>
                    </div>
                    <h3 className="font-elegant font-bold text-2xl text-esmeralda">Variedades Premium</h3>
                  </div>
                  <ul className="space-y-4">
                    {[
                      { name: 'Hass', desc: 'El clásico, cremoso y versátil' },
                      { name: 'Papelillo/Lorena', desc: 'Suave y mantequilloso' },
                      { name: 'Semil', desc: 'Textura única' },
                      { name: 'Choquette', desc: 'Grande y cremoso' },
                    ].map((variety, i) => (
                      <li key={i} className="flex items-center gap-4 group/item">
                        <div className="w-2 h-2 bg-esmeralda rounded-full group-hover/item:scale-125 transition-transform" />
                        <span className="font-modern text-gray-700">
                          <span className="font-semibold text-esmeralda">{variety.name}</span> — {variety.desc}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Estados de maduración - Luxury card */}
              <div className="group relative bg-white rounded-3xl p-8 shadow-elegant hover:shadow-elegant-lg transition-all duration-500 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-champagne/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-14 h-14 bg-gradient-to-br from-dorado to-champagne rounded-2xl flex items-center justify-center shadow-lg">
                      <span className="text-2xl">⏱️</span>
                    </div>
                    <h3 className="font-elegant font-bold text-2xl text-esmeralda">Control de Maduración</h3>
                  </div>
                  <ul className="space-y-4">
                    {[
                      { name: 'Verde', desc: 'Madura en 4-7 días', highlight: 'mejor precio', color: 'bg-green-500' },
                      { name: 'Pintón', desc: 'Listo en 1-3 días', highlight: '', color: 'bg-yellow-500' },
                      { name: 'Maduro', desc: 'Consumo inmediato', highlight: '', color: 'bg-orange-500' },
                    ].map((state, i) => (
                      <li key={i} className="flex items-center gap-4 group/item">
                        <div className={`w-3 h-3 ${state.color} rounded-full group-hover/item:scale-125 transition-transform`} />
                        <span className="font-modern text-gray-700">
                          <span className="font-semibold text-esmeralda">{state.name}</span> — {state.desc}
                          {state.highlight && <span className="text-dorado font-medium"> ({state.highlight})</span>}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <p className="font-modern text-xs text-gray-500 mt-6 italic border-t border-antiguo/20 pt-4">
                    * El precio varía según maduración por pérdida de peso natural
                  </p>
                </div>
              </div>
            </div>

            <div className="text-center mt-12">
              <Link
                href="/empresas/aguacates"
                className="group inline-flex items-center gap-3 bg-gradient-to-r from-esmeralda to-esmeralda/80 hover:from-esmeralda/90 hover:to-esmeralda text-white font-elegant font-semibold px-10 py-5 rounded-2xl transition-all duration-500 shadow-elegant hover:shadow-elegant-lg hover:scale-105"
              >
                Explorar Catálogo de Aguacates
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Proceso de Compra - Modern luxury */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <span className="font-elegant text-dorado text-lg tracking-widest uppercase mb-4 block">Experiencia Simplificada</span>
            <h2 className="font-elegant font-bold text-4xl md:text-5xl mb-4 text-esmeralda">
              Proceso B2B
            </h2>
            <p className="font-modern text-gray-600 text-lg">
              Diseñado para la eficiencia de tu negocio
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
            {[
              {
                number: '01',
                icon: '🛒',
                title: 'Selecciona',
                description: 'Variedad, maduración y cantidad en kg'
              },
              {
                number: '02',
                icon: '📦',
                title: 'Arma Pedido',
                description: 'Carrito con precios por volumen'
              },
              {
                number: '03',
                icon: '✅',
                title: 'Confirma',
                description: 'Checkout o WhatsApp directo'
              },
              {
                number: '04',
                icon: '🚚',
                title: 'Recibe',
                description: 'Entrega coordinada a tu negocio'
              }
            ].map((step, index) => (
              <div
                key={step.number}
                className="group relative text-center animate-reveal"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {/* Number badge */}
                <div className="absolute -top-3 -right-3 w-8 h-8 bg-dorado text-white rounded-full flex items-center justify-center font-elegant text-sm font-bold shadow-lg">
                  {step.number}
                </div>
                <div className="bg-gradient-to-br from-esmeralda/5 to-champagne/10 rounded-3xl p-8 group-hover:shadow-elegant transition-all duration-500 border border-esmeralda/10 group-hover:border-esmeralda/30">
                  <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg group-hover:scale-110 transition-transform duration-500 text-3xl">
                    {step.icon}
                  </div>
                  <h3 className="font-elegant font-bold text-xl mb-3 text-esmeralda">{step.title}</h3>
                  <p className="font-modern text-gray-600 text-sm leading-relaxed">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Beneficios - Luxury cards */}
      <section className="py-24 bg-gradient-to-b from-antiguo/20 to-antiguo/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <span className="font-elegant text-dorado text-lg tracking-widest uppercase mb-4 block">Ventajas Exclusivas</span>
            <h2 className="font-elegant font-bold text-4xl md:text-5xl mb-4 text-esmeralda">
              Beneficios para tu Negocio
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {[
              {
                icon: Scale,
                title: 'Precios por Volumen',
                description: '3 niveles: 5-20kg, 20-100kg, 100-300kg. Mayor cantidad, mejor precio por kilo.',
                gradient: 'from-esmeralda/10 to-esmeralda/5',
                iconBg: 'bg-esmeralda',
              },
              {
                icon: Truck,
                title: 'Entregas Flexibles',
                description: 'Coordinamos según tu operación. Envío gratis en pedidos mayores a $100.000.',
                gradient: 'from-dorado/10 to-dorado/5',
                iconBg: 'bg-dorado',
              },
              {
                icon: Star,
                title: 'Calidad Premium',
                description: 'Frescos directos del Eje Cafetero. Control de maduración garantizado.',
                gradient: 'from-champagne/20 to-champagne/10',
                iconBg: 'bg-gradient-to-br from-dorado to-champagne',
              }
            ].map((benefit, index) => (
              <div
                key={index}
                className="group relative bg-white rounded-3xl p-10 shadow-elegant hover:shadow-elegant-lg transition-all duration-500 overflow-hidden"
              >
                {/* Gradient background on hover */}
                <div className={`absolute inset-0 bg-gradient-to-br ${benefit.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                <div className="relative">
                  <div className={`w-16 h-16 ${benefit.iconBg} rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg group-hover:scale-110 transition-transform duration-500`}>
                    <benefit.icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="font-elegant font-bold text-2xl mb-4 text-center text-esmeralda">
                    {benefit.title}
                  </h3>
                  <p className="font-modern text-gray-600 text-center leading-relaxed">
                    {benefit.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Final - Luxury style */}
      <section className="py-24 md:py-32 bg-esmeralda relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0">
          <div className="absolute top-10 left-10 w-64 h-64 border border-dorado/20 rounded-full animate-float" style={{ animationDelay: '0s' }} />
          <div className="absolute bottom-10 right-10 w-80 h-80 border border-champagne/20 rounded-full animate-float" style={{ animationDelay: '3s' }} />
          <div className="absolute top-1/2 right-1/4 w-48 h-48 bg-dorado/5 rounded-full animate-pulse-soft" />
        </div>

        <div className="relative container mx-auto px-4 text-center">
          <div className="max-w-4xl mx-auto">
            <h2 className="font-elegant font-bold text-4xl md:text-6xl mb-6 text-white">
              ¿Listo para Empezar?
            </h2>
            <p className="font-modern text-xl mb-12 max-w-2xl mx-auto text-champagne/90 leading-relaxed">
              Explora nuestro catálogo B2B exclusivo y arma tu primer pedido mayorista
            </p>
            <div className="flex flex-col sm:flex-row gap-5 justify-center">
              <Link
                href="/empresas/aguacates"
                className="group relative inline-flex items-center justify-center bg-gradient-to-r from-champagne to-dorado hover:from-dorado hover:to-champagne text-esmeralda font-elegant font-bold px-12 py-6 rounded-2xl transition-all duration-500 shadow-elegant hover:shadow-gold-glow hover:scale-105 overflow-hidden"
              >
                <span className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                <span className="relative z-10 flex items-center gap-3">
                  Ver Catálogo Completo
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </span>
              </Link>
              <a
                href="https://wa.me/573042582777?text=Hola,%20quiero%20información%20sobre%20pedidos%20mayoristas"
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center justify-center bg-white/10 backdrop-blur-sm border-2 border-champagne/30 hover:border-champagne hover:bg-white/20 text-white font-elegant font-semibold px-12 py-6 rounded-2xl transition-all duration-500 hover:scale-105"
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
