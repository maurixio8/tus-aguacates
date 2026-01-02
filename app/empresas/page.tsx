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

          {/* Small floating particles - Frutas y verduras con colores */}
          {['🥑', '🍋', '🍊', '🍓', '🥝', '🍅', '🥕', '🥦', '🍆', '🌶️', '🍌', '🍏', '🍐', '🥬'].map((emoji, i) => (
            <div
              key={i}
              className="absolute text-2xl md:text-3xl animate-float drop-shadow-2xl"
              style={{
                top: `${Math.random() * 90 + 5}%`,
                left: `${Math.random() * 90 + 5}%`,
                animationDuration: `${6 + Math.random() * 6}s`,
                animationDelay: `${Math.random() * 4}s`,
                opacity: 0.6,
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
            {/* Empresas Badge */}
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-5 py-2.5 rounded-full mb-8">
              <Building2 className="w-5 h-5" />
              <span className="font-display font-semibold">Canal Empresarial</span>
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
                { value: totalProducts || '~30', label: 'Productos Mayoristas', icon: Package },
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

      {/* Categorías */}
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

      {/* Sección especial de Aguacates - Modern 3D Design */}
      <section className="py-20 bg-gradient-to-br from-verde-bosque via-verde-aguacate to-verde-bosque relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0">
          {/* Large gradient orbs with blur */}
          <div className="absolute top-10 left-10 w-96 h-96 bg-naranja-frutal/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '4s' }} />
          <div className="absolute bottom-10 right-10 w-80 h-80 bg-dorado/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '5s', animationDelay: '1s' }} />

          {/* Floating avocado slices with 3D effect */}
          {[
            { emoji: '🥑', top: '5%', left: '8%', size: 'text-4xl', delay: '0s', duration: '8s' },
            { emoji: '🥑', top: '15%', right: '10%', size: 'text-5xl', delay: '1s', duration: '10s' },
            { emoji: '🥑', bottom: '20%', left: '5%', size: 'text-3xl', delay: '2s', duration: '9s' },
            { emoji: '🥑', bottom: '10%', right: '8%', size: 'text-4xl', delay: '3s', duration: '11s' },
          ].map((item, i) => (
            <div
              key={i}
              className={`absolute ${item.size} opacity-20 animate-float`}
              style={{
                top: item.top,
                left: item.left,
                right: item.right as string | undefined,
                bottom: item.bottom as string | undefined,
                animationDuration: item.duration,
                animationDelay: item.delay,
                filter: 'drop-shadow(0 20px 40px rgba(0,0,0,0.3))',
              }}
            >
              {item.emoji}
            </div>
          ))}

          {/* Animated grid pattern */}
          <div
            className="absolute inset-0 opacity-5"
            style={{
              backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
              backgroundSize: '50px 50px',
            }}
          />
        </div>

        <div className="container mx-auto px-4 relative">
          <div className="max-w-6xl mx-auto">
            {/* Header with animated elements */}
            <div className="text-center mb-16 relative">
              {/* Floating 3D avocado badge */}
              <div className="inline-block mb-6 relative animate-float" style={{ animationDuration: '6s' }}>
                <div className="relative">
                  <div className="absolute inset-0 bg-white/20 rounded-3xl blur-xl animate-pulse" style={{ animationDuration: '3s' }} />
                  <div className="relative w-24 h-24 md:w-32 md:h-32 bg-gradient-to-br from-naranja-frutal to-dorado rounded-3xl flex items-center justify-center shadow-2xl transform rotate-3 hover:rotate-6 transition-transform duration-500">
                    <span className="text-5xl md:text-6xl filter drop-shadow-lg">🥑</span>
                  </div>
                </div>
              </div>

              <h2 className="font-display font-bold text-4xl md:text-6xl text-white mb-6 drop-shadow-2xl">
                Especialistas en
                <span className="block bg-gradient-to-r from-naranja-frutal via-dorado to-naranja-frutal bg-clip-text text-transparent animate-gradient bg-[length:200%_auto]">
                  Aguacate
                </span>
              </h2>

              {/* Animated counter */}
              <div className="flex items-center justify-center gap-4 md:gap-6 mb-6">
                <div className="text-center">
                  <div className="font-display text-5xl md:text-7xl font-bold text-white drop-shadow-lg">
                    4
                  </div>
                  <div className="text-white/80 text-sm md:text-base font-medium">Variedades</div>
                </div>
                <div className="text-4xl md:text-5xl font-bold text-naranja-frutal">×</div>
                <div className="text-center">
                  <div className="font-display text-5xl md:text-7xl font-bold text-white drop-shadow-lg">
                    3
                  </div>
                  <div className="text-white/80 text-sm md:text-base font-medium">Maduraciones</div>
                </div>
                <div className="text-4xl md:text-5xl font-bold text-naranja-frutal">=</div>
                <div className="text-center">
                  <div className="font-display text-5xl md:text-7xl font-bold text-naranja-frutal drop-shadow-lg">
                    12
                  </div>
                  <div className="text-white/80 text-sm md:text-base font-medium">Combinaciones</div>
                </div>
              </div>

              <p className="text-white/90 text-lg md:text-xl max-w-2xl mx-auto">
                Control total para tu cocina con la mejor selección del Eje Cafetero
              </p>
            </div>

            {/* Glassmorphism cards with 3D effects */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
              {/* Variedades - 3D Card */}
              <div className="group relative">
                {/* Animated gradient border */}
                <div className="absolute -inset-0.5 bg-gradient-to-r from-naranja-frutal via-dorado to-naranja-frutal rounded-3xl blur opacity-30 group-hover:opacity-75 transition duration-500 animate-gradient bg-[length:200%_auto]" />

                {/* Main card */}
                <div className="relative bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20 shadow-2xl transform transition-all duration-500 group-hover:-translate-y-2 group-hover:scale-[1.02]">
                  {/* Header with 3D icon */}
                  <div className="flex items-center gap-4 mb-8">
                    <div className="relative">
                      <div className="absolute inset-0 bg-naranja-frutal/20 rounded-2xl blur-lg group-hover:blur-xl transition-all" />
                      <div className="relative w-16 h-16 bg-gradient-to-br from-verde-bosque to-verde-aguacate rounded-2xl flex items-center justify-center shadow-xl transform -rotate-6 group-hover:rotate-0 transition-transform duration-300">
                        <span className="text-3xl">🥑</span>
                      </div>
                    </div>
                    <div>
                      <h3 className="font-display font-bold text-2xl text-white drop-shadow">Variedades</h3>
                      <p className="text-white/70 text-sm">Premium Selection</p>
                    </div>
                  </div>

                  {/* Variety list with hover effects */}
                  <div className="space-y-4">
                    {[
                      { name: 'Hass', desc: 'El clásico, cremoso y versátil', icon: '👑' },
                      { name: 'Papelillo/Lorena', desc: 'Suave y mantequilloso', icon: '✨' },
                      { name: 'Semil', desc: 'Textura única', icon: '💎' },
                      { name: 'Choquette', desc: 'Grande y cremoso', icon: '🌟' },
                    ].map((variety, i) => (
                      <div
                        key={i}
                        className="group/item flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all duration-300 cursor-default transform hover:translate-x-2"
                        style={{ animation: `fade-in 0.6s ease-out ${i * 0.1}s both` }}
                      >
                        <span className="text-2xl opacity-60 group-hover/item:opacity-100 group-hover/item:scale-125 transition-all">{variety.icon}</span>
                        <div className="flex-1">
                          <div className="font-semibold text-white group-hover/item:text-naranja-frutal transition-colors">{variety.name}</div>
                          <div className="text-white/60 text-sm">{variety.desc}</div>
                        </div>
                        <div className="opacity-0 group-hover/item:opacity-100 transition-opacity">
                          <ArrowRight className="w-5 h-5 text-naranja-frutal" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Maduración - 3D Card */}
              <div className="group relative">
                {/* Animated gradient border */}
                <div className="absolute -inset-0.5 bg-gradient-to-r from-verde-bosque via-verde-aguacate to-verde-bosque rounded-3xl blur opacity-30 group-hover:opacity-75 transition duration-500 animate-gradient bg-[length:200%_auto]" />

                {/* Main card */}
                <div className="relative bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20 shadow-2xl transform transition-all duration-500 group-hover:-translate-y-2 group-hover:scale-[1.02]">
                  {/* Header with 3D icon */}
                  <div className="flex items-center gap-4 mb-8">
                    <div className="relative">
                      <div className="absolute inset-0 bg-verde-aguacate/20 rounded-2xl blur-lg group-hover:blur-xl transition-all" />
                      <div className="relative w-16 h-16 bg-gradient-to-br from-naranja-frutal to-dorado rounded-2xl flex items-center justify-center shadow-xl transform rotate-6 group-hover:rotate-0 transition-transform duration-300">
                        <span className="text-3xl">⏱️</span>
                      </div>
                    </div>
                    <div>
                      <h3 className="font-display font-bold text-2xl text-white drop-shadow">Maduración</h3>
                      <p className="text-white/70 text-sm">Perfect Timing</p>
                    </div>
                  </div>

                  {/* Ripeness stages with visual indicators */}
                  <div className="space-y-5">
                    {[
                      { name: 'Verde', desc: 'Madura en 4-7 días', highlight: 'mejor precio', color: 'from-verde-bosque', toColor: 'to-verde-aguacate', icon: '🌱', days: '4-7días' },
                      { name: 'Pintón', desc: 'Listo en 1-3 días', highlight: '', color: 'from-yellow-500', toColor: 'to-naranja-frutal', icon: '⚡', days: '1-3días' },
                      { name: 'Maduro', desc: 'Consumo inmediato', highlight: '', color: 'from-naranja-frutal', toColor: 'to-rojo-natural', icon: '🔥', days: 'Ahora' },
                    ].map((state, i) => (
                      <div
                        key={i}
                        className="group/item relative"
                        style={{ animation: `fade-in 0.6s ease-out ${i * 0.15}s both` }}
                      >
                        {/* Hover glow effect */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent rounded-xl opacity-0 group-hover/item:opacity-100 transition-opacity duration-500" />

                        <div className="relative flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all duration-300 cursor-default transform hover:translate-x-2">
                          {/* Animated color orb */}
                          <div className="relative">
                            <div className={`absolute inset-0 bg-gradient-to-br ${state.color} ${state.toColor} rounded-full blur-md opacity-60 animate-pulse`} style={{ animationDuration: '2s' }} />
                            <div className={`relative w-12 h-12 bg-gradient-to-br ${state.color} ${state.toColor} rounded-full flex items-center justify-center shadow-lg border-2 border-white/30`}>
                              <span className="text-lg">{state.icon}</span>
                            </div>
                          </div>

                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-white group-hover/item:text-naranja-frutal transition-colors">{state.name}</span>
                              {state.highlight && (
                                <span className="px-2 py-0.5 bg-naranja-frutal/20 text-naranja-frutal text-xs rounded-full border border-naranja-frutal/30">
                                  {state.highlight}
                                </span>
                              )}
                            </div>
                            <div className="text-white/60 text-sm">{state.desc}</div>
                          </div>

                          {/* Days badge */}
                          <div className="text-right">
                            <div className="text-white/40 text-xs uppercase tracking-wide">Tiempo</div>
                            <div className="text-naranja-frutal font-semibold text-sm">{state.days}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Note */}
                  <p className="text-white/50 text-xs mt-6 italic border-t border-white/10 pt-4 text-center">
                    * El precio varía según maduración por pérdida de peso natural
                  </p>
                </div>
              </div>
            </div>

            {/* CTA with 3D effect */}
            <div className="text-center">
              <Link
                href="/empresas/aguacates"
                className="group inline-flex items-center gap-3 bg-gradient-to-r from-naranja-frutal via-dorado to-naranja-frutal bg-[length:200%_auto] hover:bg-[position:100%_0] text-verde-bosque font-bold px-10 py-5 rounded-2xl transition-all duration-500 shadow-2xl hover:shadow-naranja-frutal/50 transform hover:scale-110 border-2 border-white/30 hover:border-white/50 relative overflow-hidden"
              >
                {/* Shine effect on hover */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />

                <span className="relative z-10">Ver Catálogo de Aguacates</span>
                <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform relative z-10" />
              </Link>
            </div>
          </div>
        </div>

        {/* Custom animations */}
        <style jsx>{`
          @keyframes gradient {
            0%, 100% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
          }
          @keyframes fade-in {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .animate-gradient {
            animation: gradient 3s ease infinite;
          }
        `}</style>
      </section>

      {/* Proceso de Compra - Modern Timeline Design */}
      <section className="py-20 bg-gradient-to-b from-white to-gray-50 relative overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-30">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(45, 80, 22, 0.1) 1px, transparent 0)',
              backgroundSize: '40px 40px',
            }}
          />
        </div>

        <div className="container mx-auto px-4 relative">
          {/* Header */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-verde-bosque/10 px-4 py-2 rounded-full mb-6 border border-verde-bosque/20">
              <span className="w-2 h-2 bg-naranja-frutal rounded-full animate-pulse" />
              <span className="text-naranja-frutal font-bold text-sm tracking-widest uppercase">Experiencia Simplificada</span>
            </div>
            <h2 className="font-display font-bold text-4xl md:text-5xl mb-4 bg-gradient-to-r from-verde-bosque via-verde-aguacate to-naranja-frutal bg-clip-text text-transparent">
              Proceso de Compra
            </h2>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              4 simples pasos para recibir tu pedido mayorista
            </p>
          </div>

          {/* Timeline Steps */}
          <div className="max-w-6xl mx-auto">
            {/* Desktop: Horizontal timeline */}
            <div className="hidden lg:block relative">
              {/* Connection line */}
              <div className="absolute top-1/2 left-0 right-0 h-1 bg-gradient-to-r from-verde-bosque via-verde-aguacate to-naranja-frutal transform -translate-y-1/2 rounded-full" style={{ backgroundSize: '200% 100%', animation: 'gradient-flow 3s ease infinite' }}>
                <div className="absolute inset-0 bg-white/30 animate-pulse" />
              </div>

              <div className="grid grid-cols-4 gap-8 relative">
                {[
                  {
                    number: '1',
                    icon: '🛒',
                    iconBg: 'from-verde-bosque',
                    iconTo: 'to-verde-aguacate',
                    title: 'Selecciona',
                    description: 'Variedad, maduración y cantidad en kg',
                    detail: 'Elige entre 4 variedades y 3 estados de maduración'
                  },
                  {
                    number: '2',
                    icon: '📦',
                    iconBg: 'from-verde-aguacate',
                    iconTo: 'to-naranja-frutal',
                    title: 'Arma Pedido',
                    description: 'Carrito con precios por volumen',
                    detail: 'Precios escalonados: 5-20kg, 20-100kg, 100-300kg'
                  },
                  {
                    number: '3',
                    icon: '✅',
                    iconBg: 'from-naranja-frutal',
                    iconTo: 'to-dorado',
                    title: 'Confirma',
                    description: 'Checkout o WhatsApp directo',
                    detail: 'Múltiples métodos de pago disponibles'
                  },
                  {
                    number: '4',
                    icon: '🚚',
                    iconBg: 'from-dorado',
                    iconTo: 'to-verde-bosque',
                    title: 'Recibe',
                    description: 'Entrega coordinada a tu negocio',
                    detail: 'Envío gratis en pedidos mayores a $100.000'
                  }
                ].map((step, index) => (
                  <div key={step.number} className="relative">
                    {/* Step card */}
                    <div className="group relative">
                      {/* Glow effect on hover */}
                      <div className={`absolute -inset-4 bg-gradient-to-br ${step.iconBg} ${step.iconTo} rounded-3xl blur-2xl opacity-0 group-hover:opacity-20 transition-opacity duration-500`} />

                      {/* Card content */}
                      <div className="relative bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-500 transform group-hover:-translate-y-2 border border-gray-100 hover:border-white">
                        {/* Number badge with glow */}
                        <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                          <div className={`relative w-12 h-12 bg-gradient-to-br ${step.iconBg} ${step.iconTo} rounded-xl flex items-center justify-center shadow-lg transform group-hover:scale-110 group-hover:rotate-6 transition-all duration-300`}>
                            <div className={`absolute inset-0 bg-gradient-to-br ${step.iconBg} ${step.iconTo} rounded-xl blur-lg opacity-60 animate-pulse`} style={{ animationDuration: '2s' }} />
                            <span className="relative font-display font-bold text-lg text-white">{step.number}</span>
                          </div>
                        </div>

                        {/* Icon */}
                        <div className="pt-6 pb-4">
                          <div className={`w-20 h-20 mx-auto bg-gradient-to-br ${step.iconBg} ${step.iconTo} rounded-2xl flex items-center justify-center shadow-lg transform group-hover:scale-110 group-hover:rotate-12 transition-all duration-500 relative`}>
                            <div className={`absolute inset-0 bg-gradient-to-br ${step.iconBg} ${step.iconTo} rounded-2xl blur-xl opacity-40 group-hover:opacity-60 transition-opacity`} />
                            <span className="relative text-4xl">{step.icon}</span>
                          </div>
                        </div>

                        {/* Content */}
                        <div className="text-center">
                          <h3 className="font-display font-bold text-xl text-verde-bosque mb-2 group-hover:text-naranja-frutal transition-colors">
                            {step.title}
                          </h3>
                          <p className="text-gray-600 text-sm mb-3">{step.description}</p>
                          <p className="text-xs text-gray-400 italic">{step.detail}</p>
                        </div>

                        {/* Hover arrow indicator */}
                        <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                          <ArrowRight className="w-5 h-5 text-naranja-frutal" />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Mobile/Tablet: Vertical timeline */}
            <div className="lg:hidden relative max-w-md mx-auto">
              {/* Vertical connection line */}
              <div className="absolute left-8 top-0 bottom-0 w-1 bg-gradient-to-b from-verde-bosque via-verde-aguacate to-naranja-frutal rounded-full">
                <div className="absolute inset-0 bg-white/30 animate-pulse" />
              </div>

              <div className="space-y-8">
                {[
                  {
                    number: '1',
                    icon: '🛒',
                    iconBg: 'from-verde-bosque',
                    iconTo: 'to-verde-aguacate',
                    title: 'Selecciona',
                    description: 'Variedad, maduración y cantidad en kg',
                    detail: 'Elige entre 4 variedades y 3 estados de maduración'
                  },
                  {
                    number: '2',
                    icon: '📦',
                    iconBg: 'from-verde-aguacate',
                    iconTo: 'to-naranja-frutal',
                    title: 'Arma Pedido',
                    description: 'Carrito con precios por volumen',
                    detail: 'Precios escalonados: 5-20kg, 20-100kg, 100-300kg'
                  },
                  {
                    number: '3',
                    icon: '✅',
                    iconBg: 'from-naranja-frutal',
                    iconTo: 'to-dorado',
                    title: 'Confirma',
                    description: 'Checkout o WhatsApp directo',
                    detail: 'Múltiples métodos de pago disponibles'
                  },
                  {
                    number: '4',
                    icon: '🚚',
                    iconBg: 'from-dorado',
                    iconTo: 'to-verde-bosque',
                    title: 'Recibe',
                    description: 'Entrega coordinada a tu negocio',
                    detail: 'Envío gratis en pedidos mayores a $100.000'
                  }
                ].map((step, index) => (
                  <div key={step.number} className="relative pl-20">
                    {/* Number on timeline */}
                    <div className="absolute left-4 top-6">
                      <div className={`relative w-10 h-10 bg-gradient-to-br ${step.iconBg} ${step.iconTo} rounded-full flex items-center justify-center shadow-lg transform hover:scale-110 transition-transform`}>
                        <div className={`absolute inset-0 bg-gradient-to-br ${step.iconBg} ${step.iconTo} rounded-full blur-md opacity-60 animate-pulse`} style={{ animationDuration: '2s' }} />
                        <span className="relative font-display font-bold text-base text-white">{step.number}</span>
                      </div>
                    </div>

                    {/* Card */}
                    <div className="group relative bg-white rounded-xl p-5 shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-x-2 border border-gray-100">
                      {/* Icon and title row */}
                      <div className="flex items-center gap-4 mb-3">
                        <div className={`w-14 h-14 bg-gradient-to-br ${step.iconBg} ${step.iconTo} rounded-xl flex items-center justify-center shadow-md group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 flex-shrink-0`}>
                          <span className="text-2xl">{step.icon}</span>
                        </div>
                        <div>
                          <h3 className="font-display font-bold text-lg text-verde-bosque group-hover:text-naranja-frutal transition-colors">
                            {step.title}
                          </h3>
                        </div>
                      </div>

                      <p className="text-gray-600 text-sm mb-2">{step.description}</p>
                      <p className="text-xs text-gray-400 italic">{step.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Custom animations */}
        <style jsx>{`
          @keyframes gradient-flow {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }
        `}</style>
      </section>

      {/* Beneficios - Modern 3D Cards Design */}
      <section id="beneficios" className="py-20 bg-white relative overflow-hidden">
        {/* Animated background pattern */}
        <div className="absolute inset-0">
          <div
            className="absolute inset-0 opacity-40"
            style={{
              backgroundImage: 'radial-gradient(circle at 3px 3px, rgba(107, 142, 35, 0.15) 1px, transparent 0)',
              backgroundSize: '60px 60px',
            }}
          />
          {/* Floating gradient orbs */}
          <div className="absolute top-20 right-20 w-96 h-96 bg-verde-aguacate/5 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '6s' }} />
          <div className="absolute bottom-20 left-20 w-80 h-80 bg-naranja-frutal/5 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '8s', animationDelay: '2s' }} />
        </div>

        <div className="container mx-auto px-4 relative">
          {/* Header */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-naranja-frutal/10 px-4 py-2 rounded-full mb-6 border border-naranja-frutal/20">
              <span className="w-2 h-2 bg-naranja-frutal rounded-full animate-pulse" />
              <span className="text-naranja-frutal font-bold text-sm tracking-widest uppercase">Ventajas Exclusivas</span>
            </div>
            <h2 className="font-display font-bold text-4xl md:text-5xl mb-4">
              Beneficios para tu
              <span className="block bg-gradient-to-r from-verde-bosque via-verde-aguacate to-naranja-frutal bg-clip-text text-transparent">
                Negocio
              </span>
            </h2>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              Razones por las que los mejores restaurantes y hoteles nos eligen
            </p>
          </div>

          {/* Benefit Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {[
              {
                icon: Scale,
                emoji: '💰',
                title: 'Precios por Volumen',
                description: '3 niveles: 5-20kg, 20-100kg, 100-300kg. Mayor cantidad, mejor precio por kilo.',
                highlight: 'Hasta -40%',
                color: 'from-verde-bosque',
                toColor: 'to-verde-aguacate',
                bgColor: 'bg-verde-bosque',
                features: ['Precios escalonados', 'Sin contratos', 'Flexibilidad total'],
              },
              {
                icon: Truck,
                emoji: '🚚',
                title: 'Entregas Flexibles',
                description: 'Coordinamos según tu operación. Envío gratis en pedidos mayores a $100.000.',
                highlight: 'Gratis >$100k',
                color: 'from-verde-aguacate',
                toColor: 'to-naranja-frutal',
                bgColor: 'bg-verde-aguacate',
                features: ['Programación ideal', 'Tracking en vivo', 'Garantía frescura'],
              },
              {
                icon: Star,
                emoji: '⭐',
                title: 'Calidad Premium',
                description: 'Frescos directos del Eje Cafetero. Control de maduración garantizado.',
                highlight: '100% Fresco',
                color: 'from-naranja-frutal',
                toColor: 'to-dorado',
                bgColor: 'bg-naranja-frutal',
                features: ['Eje Cafetero', 'Maduración controlada', 'Selección manual'],
              }
            ].map((benefit, index) => (
              <div key={index} className="group relative">
                {/* Animated gradient border glow */}
                <div className={`absolute -inset-1 bg-gradient-to-br ${benefit.color} ${benefit.toColor} rounded-3xl blur opacity-20 group-hover:opacity-40 transition duration-500`} />
                <div className={`absolute -inset-0.5 bg-gradient-to-br ${benefit.color} ${benefit.toColor} rounded-3xl blur-lg opacity-0 group-hover:opacity-30 transition duration-500 animate-pulse`} style={{ animationDuration: '3s' }} />

                {/* Main card */}
                <div className="relative bg-white rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all duration-500 transform group-hover:-translate-y-3 border border-gray-100 h-full flex flex-col">
                  {/* Icon container with 3D effect */}
                  <div className="relative mb-6">
                    {/* Background glow */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${benefit.color} ${benefit.toColor} rounded-2xl blur-xl opacity-20 group-hover:opacity-40 transition-opacity duration-300`} />

                    {/* Icon */}
                    <div className={`relative w-20 h-20 mx-auto bg-gradient-to-br ${benefit.color} ${benefit.toColor} rounded-2xl flex items-center justify-center shadow-xl transform group-hover:scale-110 group-hover:rotate-6 transition-all duration-500`}>
                      <div className={`absolute inset-0 bg-gradient-to-br ${benefit.color} ${benefit.toColor} rounded-2xl blur opacity-50 animate-pulse`} style={{ animationDuration: '2s' }} />
                      <benefit.icon className="relative w-10 h-10 text-white" />
                    </div>

                    {/* Floating emoji */}
                    <div className="absolute -top-2 -right-2 w-10 h-10 bg-white rounded-xl shadow-lg flex items-center justify-center text-xl transform group-hover:scale-125 group-hover:rotate-12 transition-all duration-300 animate-float" style={{ animationDuration: '4s' }}>
                      {benefit.emoji}
                    </div>
                  </div>

                  {/* Highlight badge */}
                  <div className="text-center mb-4">
                    <span className={`inline-block px-4 py-1.5 bg-gradient-to-r ${benefit.color} ${benefit.toColor} text-white text-sm font-bold rounded-full shadow-md`}>
                      {benefit.highlight}
                    </span>
                  </div>

                  {/* Content */}
                  <h3 className="font-display font-bold text-2xl text-center mb-3 text-verde-bosque group-hover:bg-gradient-to-r group-hover:from-verde-bosque group-hover:to-naranja-frutal group-hover:bg-clip-text group-hover:text-transparent transition-all duration-300">
                    {benefit.title}
                  </h3>
                  <p className="text-gray-600 text-center text-sm leading-relaxed mb-6 flex-1">
                    {benefit.description}
                  </p>

                  {/* Features list */}
                  <div className="space-y-2 mb-6">
                    {benefit.features.map((feature, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm text-gray-700">
                        <div className={`w-1.5 h-1.5 rounded-full ${benefit.bgColor}`} />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>

                  {/* Bottom accent */}
                  <div className={`h-1.5 rounded-full bg-gradient-to-r ${benefit.color} ${benefit.toColor} transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left`} />
                </div>
              </div>
            ))}
          </div>

          {/* Trust badges */}
          <div className="mt-16 flex flex-wrap justify-center gap-6">
            {[
              { text: '+100 Empresas', icon: '🏢' },
              { text: '48h Entrega', icon: '⚡' },
              { text: 'SAT 100%', icon: '✅' },
              { text: 'Eje Cafetero', icon: '🌿' },
            ].map((badge, i) => (
              <div key={i} className="flex items-center gap-2 px-5 py-3 bg-white rounded-full shadow-md border border-gray-100 hover:shadow-lg hover:border-naranja-frutal/30 transition-all duration-300">
                <span className="text-xl">{badge.icon}</span>
                <span className="font-semibold text-gray-700">{badge.text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Final - Epic Animated Design */}
      <section id="contacto" className="py-24 md:py-32 bg-gradient-to-br from-verde-bosque via-verde-aguacate to-naranja-frutal text-white relative overflow-hidden">
        {/* Animated background layers */}
        <div className="absolute inset-0">
          {/* Large gradient orbs */}
          <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-dorado/20 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '6s' }} />
          <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-naranja-frutal/20 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '8s', animationDelay: '2s' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-white/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '10s', animationDelay: '4s' }} />

          {/* Animated grid pattern */}
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
              backgroundSize: '40px 40px',
            }}
          />

          {/* Floating particles/confetti */}
          {Array.from({ length: 20 }).map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-white/30 rounded-full animate-float"
              style={{
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                animationDuration: `${5 + Math.random() * 5}s`,
                animationDelay: `${Math.random() * 3}s`,
                transform: `scale(${0.5 + Math.random()})`,
              }}
            />
          ))}

          {/* Decorative circles */}
          <div className="absolute top-20 left-20 w-32 h-32 border-2 border-white/10 rounded-full animate-spin" style={{ animationDuration: '20s' }} />
          <div className="absolute bottom-20 right-20 w-40 h-40 border-2 border-white/10 rounded-full animate-spin" style={{ animationDuration: '25s', animationDirection: 'reverse' }} />
          <div className="absolute top-1/2 right-10 w-24 h-24 border border-dorado/20 rounded-full animate-ping" style={{ animationDuration: '3s' }} />
        </div>

        <div className="container mx-auto px-4 text-center relative">
          <div className="max-w-4xl mx-auto">
            {/* Animated badge */}
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-6 py-3 rounded-full mb-8 border border-white/20 shadow-lg animate-bounce" style={{ animationDuration: '3s' }}>
              <span className="text-2xl">🚀</span>
              <span className="font-bold text-sm uppercase tracking-widest">Comienza Hoy</span>
            </div>

            {/* Main heading with gradient text */}
            <h2 className="font-display font-bold text-5xl md:text-7xl mb-6 leading-tight">
              ¿Listo para
              <span className="block relative">
                <span className="relative z-10 bg-gradient-to-r from-white via-dorado to-white bg-clip-text text-transparent animate-gradient bg-[length:200%_auto]">
                  Empezar?
                </span>
                <span className="absolute inset-0 text-white/20 blur-xl animate-pulse" style={{ animationDuration: '2s' }}>
                  Empezar?
                </span>
              </span>
            </h2>

            {/* Description */}
            <p className="text-xl md:text-2xl mb-12 max-w-2xl mx-auto text-white/90 leading-relaxed">
              Explora nuestro catálogo exclusivo y arma tu
              <span className="font-bold text-naranja-frutal"> primer pedido mayorista</span>
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-5 justify-center items-center">
              {/* Primary CTA - Catalog */}
              <Link
                href="/empresas/aguacates"
                className="group relative inline-flex items-center justify-center gap-3 bg-gradient-to-r from-naranja-frutal via-dorado to-naranja-frutal bg-[length:200%_auto] hover:bg-[position:100%_0] text-verde-bosque font-bold px-12 py-6 rounded-2xl transition-all duration-500 shadow-2xl hover:shadow-naranja-frutal/50 transform hover:scale-110 border-2 border-white/30 hover:border-white/50 overflow-hidden"
              >
                {/* Shine effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />

                {/* Glow effect */}
                <div className="absolute inset-0 bg-naranja-frutal/20 blur-xl group-hover:bg-naranja-frutal/30 transition-colors duration-300" />

                <span className="relative z-10 text-lg">Ver Catálogo Completo</span>
                <ArrowRight className="relative z-10 w-6 h-6 group-hover:translate-x-2 transition-transform" />
              </Link>

              {/* Secondary CTA - WhatsApp */}
              <a
                href="https://wa.me/573042582777?text=Hola,%20quiero%20información%20sobre%20pedidos%20mayoristas"
                target="_blank"
                rel="noopener noreferrer"
                className="group relative inline-flex items-center justify-center gap-3 bg-white/10 backdrop-blur-md border-2 border-white/30 hover:border-white/50 text-white font-bold px-12 py-6 rounded-2xl transition-all duration-300 hover:bg-white/20 hover:scale-105 shadow-xl overflow-hidden"
              >
                {/* WhatsApp pulse effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-green-500/20 to-green-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                <span className="relative z-10 text-2xl group-hover:scale-125 transition-transform duration-300">💬</span>
                <span className="relative z-10 text-lg">WhatsApp Directo</span>
              </a>
            </div>

            {/* Trust indicators */}
            <div className="mt-16 flex flex-wrap justify-center gap-8 text-white/80">
              <div className="flex items-center gap-2">
                <span className="text-2xl">✨</span>
                <span className="font-medium">Sin compromisos</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-2xl">🛡️</span>
                <span className="font-medium">Garantía de frescura</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-2xl">⚡</span>
                <span className="font-medium">Respuesta 24h</span>
              </div>
            </div>
          </div>
        </div>

        {/* Custom animations */}
        <style jsx>{`
          @keyframes gradient {
            0%, 100% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
          }
          .animate-gradient {
            animation: gradient 3s ease infinite;
          }
        `}</style>
      </section>
    </div>
  );
}
