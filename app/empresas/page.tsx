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
