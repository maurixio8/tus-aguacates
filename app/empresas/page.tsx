'use client';

import Link from 'next/link';
import {
  ArrowRight, Phone, Mail, Building2, Scale, Truck, Star,
  Package, Leaf, Shield, Clock, ChevronRight, Check,
} from 'lucide-react';
import { BusinessCategories } from '@/components/categories/BusinessCategories';
import { B2BLeadForm } from '@/components/b2b/B2BLeadForm';

export default function EmpresasPage() {
  return (
    <div className="bg-[#07180f] min-h-screen text-white">

      {/* ==================== HERO ==================== */}
      <section className="relative overflow-hidden py-20 md:py-28">
        {/* Background gradients */}
        <div className="absolute inset-0">
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-dorado/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-[#1A4D2E]/20 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-br from-[#0D2818] to-transparent rounded-full blur-3xl" />
          {/* Grid pattern */}
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: 'radial-gradient(circle at 1px 1px, #C8A227 1px, transparent 0)',
              backgroundSize: '40px 40px',
            }}
          />
        </div>

        <div className="container mx-auto px-4 relative">
          <div className="max-w-4xl mx-auto text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-dorado/10 border border-dorado/30 px-5 py-2.5 rounded-full mb-8">
              <Building2 className="w-4 h-4 text-dorado" />
              <span className="font-semibold text-dorado text-sm tracking-wide">
                Canal Empresarial
              </span>
            </div>

            <h1 className="font-display font-bold text-4xl md:text-5xl lg:text-6xl mb-4 leading-tight">
              Productores Directos de
              <span className="block bg-gradient-to-r from-dorado via-yellow-400 to-dorado bg-clip-text text-transparent">
                Aguacate Premium
              </span>
            </h1>
            <p className="text-lg md:text-xl mb-6 text-white/70 max-w-2xl mx-auto leading-relaxed">
              Hass y Papelillo del Eje Cafetero, Tolima y Llano.
              Precios mayoristas escalonados para restaurantes, hoteles y empresas.
            </p>

            {/* Stats */}
            <div className="flex flex-wrap justify-center gap-4 mb-10">
              {[
                { value: '2', label: 'Variedades', sub: 'Hass · Papelillo' },
                { value: '3', label: 'Maduraciones', sub: 'Verde · Pintón · Maduro' },
                { value: '30+', label: 'Productos', sub: 'Frutas y verduras' },
              ].map((stat, i) => (
                <div
                  key={i}
                  className="bg-white/[0.04] border border-white/10 rounded-xl px-6 py-4 min-w-[140px]"
                >
                  <div className="font-display text-3xl font-bold text-dorado">{stat.value}</div>
                  <div className="text-sm font-medium text-white/80">{stat.label}</div>
                  <div className="text-xs text-white/40 mt-0.5">{stat.sub}</div>
                </div>
              ))}
            </div>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/empresas/aguacates"
                className="group inline-flex items-center justify-center gap-2 bg-gradient-to-r from-dorado to-yellow-500 hover:from-dorado/90 hover:to-yellow-500/90 text-[#07180f] font-bold px-8 py-4 rounded-xl transition-all duration-200 shadow-lg hover:shadow-dorado/30 transform hover:scale-105"
              >
                <Package className="w-5 h-5" />
                Ver Catálogo Mayorista
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <a
                href="tel:+573042582777"
                className="inline-flex items-center justify-center gap-2 bg-white/5 border-2 border-white/20 hover:border-white/40 text-white font-bold px-8 py-4 rounded-xl transition-all duration-200 hover:scale-105"
              >
                <Phone className="w-5 h-5" />
                +57 304 258 2777
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ==================== AGUACATES HIGHLIGHT (solo Hass + Papelillo) ==================== */}
      <section className="py-20 relative overflow-hidden border-t border-white/5">
        <div className="absolute inset-0">
          <div className="absolute top-10 left-10 w-96 h-96 bg-dorado/[0.03] rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-80 h-80 bg-[#1A4D2E]/10 rounded-full blur-3xl" />
        </div>

        <div className="container mx-auto px-4 relative">
          <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="text-center mb-16">
              <div className="inline-block bg-dorado/10 border border-dorado/30 px-5 py-2 rounded-full mb-4">
                <span className="text-dorado font-semibold text-sm tracking-wide">
                  ⋆ Variedades Premium
                </span>
              </div>
              <h2 className="font-display font-bold text-4xl md:text-5xl mb-4">
                Dos Líneas,{' '}
                <span className="bg-gradient-to-r from-dorado to-yellow-400 bg-clip-text text-transparent">
                  Un Solo Proveedor
                </span>
              </h2>
              <p className="text-white/60 text-lg max-w-2xl mx-auto">
                Cada variedad tiene un propósito. Te ayudamos a elegir la que mejor se adapte a tu carta.
              </p>
            </div>

            {/* Varieties Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
              {/* HASS */}
              <div className="group relative">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-dorado/20 to-yellow-500/20 rounded-2xl blur opacity-30 group-hover:opacity-60 transition duration-500" />
                <div className="relative bg-[#0D2818] rounded-2xl p-8 border border-white/10 group-hover:border-dorado/30 transition-all duration-300">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 bg-gradient-to-br from-dorado to-yellow-500 rounded-xl flex items-center justify-center shadow-lg shadow-dorado/20">
                      <span className="text-3xl">🥑</span>
                    </div>
                    <div>
                      <h3 className="font-display font-bold text-2xl text-white">Hass</h3>
                      <p className="text-dorado text-sm font-medium">El Clásico Cremoso</p>
                    </div>
                  </div>
                  <ul className="space-y-3">
                    {[
                      'Textura cremosa y mantecosa',
                      'Ideal para guacamole, purés, salsas',
                      'Del Eje Cafetero y Antioquia',
                      'Piel gruesa — mayor vida útil',
                    ].map((item, i) => (
                      <li key={i} className="flex items-start gap-3 text-white/70 text-sm">
                        <Check className="w-4 h-4 text-dorado mt-0.5 flex-shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* PAPELILLO / LORENA */}
              <div className="group relative">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-[#1A4D2E]/30 to-dorado/20 rounded-2xl blur opacity-30 group-hover:opacity-60 transition duration-500" />
                <div className="relative bg-[#0D2818] rounded-2xl p-8 border border-white/10 group-hover:border-dorado/30 transition-all duration-300">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 bg-gradient-to-br from-[#1A4D2E] to-[#2E7D32] rounded-xl flex items-center justify-center shadow-lg">
                      <span className="text-3xl">🥑</span>
                    </div>
                    <div>
                      <h3 className="font-display font-bold text-2xl text-white">Papelillo / Lorena</h3>
                      <p className="text-dorado text-sm font-medium">El Firme Versátil</p>
                    </div>
                  </div>
                  <ul className="space-y-3">
                    {[
                      'Textura firme — ideal para tajar',
                      'Perfecto para carpaccios, ensaladas',
                      'Del Llano y Tolima',
                      'Gran tamaño, menos merma',
                    ].map((item, i) => (
                      <li key={i} className="flex items-start gap-3 text-white/70 text-sm">
                        <Check className="w-4 h-4 text-dorado mt-0.5 flex-shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Maduración cards */}
            <div className="text-center mb-10">
              <h3 className="font-display font-bold text-2xl mb-3">Tres Estados de Maduración</h3>
              <p className="text-white/60">Tú decides cuándo consumirlo</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-12">
              {[
                { name: 'Verde', desc: 'Madura en 4-7 días', sub: 'Mejor precio', color: 'from-green-600 to-green-500' },
                { name: 'Pintón', desc: 'Listo en 1-3 días', sub: 'Balance ideal', color: 'from-yellow-600 to-amber-500' },
                { name: 'Maduro', desc: 'Consumo inmediato', sub: 'Máxima textura', color: 'from-dorado to-yellow-500' },
              ].map((state, i) => (
                <div key={i} className="bg-white/[0.03] border border-white/10 rounded-xl p-6 text-center hover:border-dorado/30 transition-all duration-300">
                  <div className={`w-12 h-12 mx-auto mb-4 bg-gradient-to-br ${state.color} rounded-full flex items-center justify-center shadow-lg`}>
                    <span className="text-xl">{i === 0 ? '🌱' : i === 1 ? '⚡' : '🔥'}</span>
                  </div>
                  <h4 className="font-display font-bold text-xl text-white mb-1">{state.name}</h4>
                  <p className="text-white/60 text-sm mb-2">{state.desc}</p>
                  <span className="inline-block text-dorado text-xs font-semibold">{state.sub}</span>
                </div>
              ))}
            </div>

            {/* CTA */}
            <div className="text-center">
              <Link
                href="/empresas/aguacates"
                className="group inline-flex items-center gap-3 bg-gradient-to-r from-dorado to-yellow-500 hover:from-dorado/90 hover:to-yellow-500/90 text-[#07180f] font-bold px-10 py-5 rounded-xl transition-all duration-200 shadow-xl hover:shadow-dorado/30 transform hover:scale-105"
              >
                <span>Ver Catálogo de Aguacates</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ==================== CATÁLOGO COMPLETO ==================== */}
      <section className="py-20 border-t border-white/5">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <div className="inline-block bg-dorado/10 border border-dorado/30 px-5 py-2 rounded-full mb-4">
              <span className="text-dorado font-semibold text-sm tracking-wide">
                ⋆ Catálogo Mayorista
              </span>
            </div>
            <h2 className="font-display font-bold text-4xl md:text-5xl mb-4">
              Más de{' '}
              <span className="bg-gradient-to-r from-dorado to-yellow-400 bg-clip-text text-transparent">
                30 Productos
              </span>{' '}
              en Siete Categorías
            </h2>
            <p className="text-white/60 text-lg max-w-2xl mx-auto">
              Frescos premium seleccionados para alta rotación en tu negocio.
              Precios escalonados por volumen desde el primer kilo.
            </p>
          </div>

          <BusinessCategories variant="grid" />
        </div>
      </section>

      {/* ==================== PROCESO DE COMPRA ==================== */}
      <section className="py-20 border-t border-white/5 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-dorado/[0.02] rounded-full blur-3xl" />
        </div>

        <div className="container mx-auto px-4 relative">
          <div className="text-center mb-16">
            <div className="inline-block bg-dorado/10 border border-dorado/30 px-5 py-2 rounded-full mb-4">
              <span className="text-dorado font-semibold text-sm tracking-wide">
                ⋆ Así Funciona
              </span>
            </div>
            <h2 className="font-display font-bold text-4xl md:text-5xl mb-4">
              Compra en{' '}
              <span className="bg-gradient-to-r from-dorado to-yellow-400 bg-clip-text text-transparent">
                Cuatro Pasos
              </span>
            </h2>
            <p className="text-white/60 text-lg max-w-2xl mx-auto">
              Simple, directo. Sin papeleos ni contratos.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {[
              { num: '01', icon: '🛒', title: 'Selecciona', desc: 'Variedad, maduración y cantidad', detail: 'Mínimo 5 kg por producto' },
              { num: '02', icon: '📦', title: 'Arma tu Pedido', desc: 'Precios por volumen automáticos', detail: '3 tiers según cantidad' },
              { num: '03', icon: '✅', title: 'Confirma', desc: 'Checkout o WhatsApp directo', detail: 'Te llamamos si prefieres' },
              { num: '04', icon: '🚚', title: 'Recibe', desc: 'Entrega coordinada a tu negocio', detail: 'Envío gratis > $100.000' },
            ].map((step, i) => (
              <div key={i} className="text-center group">
                <div className="relative inline-block mb-6">
                  <div className="w-20 h-20 mx-auto bg-gradient-to-br from-dorado/20 to-yellow-500/10 rounded-2xl flex items-center justify-center border border-dorado/20 group-hover:border-dorado/40 transition-all duration-300 group-hover:scale-110">
                    <span className="text-3xl">{step.icon}</span>
                  </div>
                  <div className="absolute -top-3 -right-3 w-8 h-8 bg-dorado rounded-full flex items-center justify-center text-[#07180f] font-bold text-sm">
                    {step.num}
                  </div>
                </div>
                <h3 className="font-display font-bold text-xl text-white mb-2">{step.title}</h3>
                <p className="text-white/60 text-sm mb-1">{step.desc}</p>
                <p className="text-white/40 text-xs">{step.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ==================== BENEFICIOS ==================== */}
      <section className="py-20 border-t border-white/5">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <div className="inline-block bg-dorado/10 border border-dorado/30 px-5 py-2 rounded-full mb-4">
              <span className="text-dorado font-semibold text-sm tracking-wide">
                ⋆ Ventajas Exclusivas
              </span>
            </div>
            <h2 className="font-display font-bold text-4xl md:text-5xl mb-4">
              Por Qué Elegirnos
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              {
                icon: Scale,
                title: 'Precios por Volumen',
                desc: '3 niveles de precio según la cantidad. A mayor volumen, menor precio por kilo. Sin contratos ni membresías.',
                badge: 'Hasta -40%',
                features: ['Sin compromiso mensual', 'Precios transparentes', 'Flexibilidad total'],
              },
              {
                icon: Truck,
                title: 'Entregas Flexibles',
                desc: 'Coordinamos la entrega según tu operación. Envío gratis en pedidos mayores a $100.000.',
                badge: 'Gratis >$100k',
                features: ['Programación semanal', 'Tracking de entrega', 'Garantía de frescura'],
              },
              {
                icon: Star,
                title: 'Calidad Premium',
                desc: 'Seleccionamos la fruta directamente del productor. Control de maduración garantizado en cada entrega.',
                badge: '100% Fresco',
                features: ['Del Eje Cafetero', 'Maduración controlada', 'Selección manual'],
              },
            ].map((benefit, i) => (
              <div key={i} className="group relative">
                <div className="absolute -inset-0.5 bg-gradient-to-br from-dorado/10 to-yellow-500/5 rounded-2xl blur opacity-0 group-hover:opacity-100 transition duration-500" />
                <div className="relative bg-[#0D2818] border border-white/10 group-hover:border-dorado/20 rounded-2xl p-8 transition-all duration-300 h-full flex flex-col">
                  <div className="w-14 h-14 bg-gradient-to-br from-dorado to-yellow-500 rounded-xl flex items-center justify-center mb-6 shadow-lg shadow-dorado/20">
                    <benefit.icon className="w-7 h-7 text-[#07180f]" />
                  </div>

                  <div className="mb-4">
                    <span className="inline-block px-3 py-1 bg-dorado/15 text-dorado text-xs font-bold rounded-full">
                      {benefit.badge}
                    </span>
                  </div>

                  <h3 className="font-display font-bold text-xl text-white mb-3">{benefit.title}</h3>
                  <p className="text-white/60 text-sm leading-relaxed mb-6 flex-1">{benefit.desc}</p>

                  <div className="space-y-2">
                    {benefit.features.map((f, j) => (
                      <div key={j} className="flex items-center gap-2 text-sm text-white/50">
                        <div className="w-1.5 h-1.5 rounded-full bg-dorado/60" />
                        <span>{f}</span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 h-0.5 rounded-full bg-gradient-to-r from-dorado/40 to-transparent transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />
                </div>
              </div>
            ))}
          </div>

          {/* Trust badges */}
          <div className="mt-16 flex flex-wrap justify-center gap-6">
            {[
              { text: '+100 Empresas', icon: '🏢' },
              { text: '48h Entrega', icon: '⚡' },
              { text: 'Precio Directo', icon: '💰' },
              { text: 'Sin Intermediarios', icon: '🌿' },
            ].map((badge, i) => (
              <div key={i} className="flex items-center gap-2 px-5 py-3 bg-white/[0.04] border border-white/10 rounded-full hover:border-dorado/30 transition-all duration-300">
                <span className="text-lg">{badge.icon}</span>
                <span className="font-semibold text-white/70 text-sm">{badge.text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ==================== LEAD FORM SECTION ==================== */}
      <section id="cotizar" className="py-20 relative overflow-hidden border-t border-white/5">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-gradient-to-b from-dorado/[0.03] to-transparent rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-[#1A4D2E]/10 rounded-full blur-3xl" />
          <div
            className="absolute inset-0 opacity-[0.02]"
            style={{
              backgroundImage: 'radial-gradient(circle at 2px 2px, #C8A227 1px, transparent 0)',
              backgroundSize: '50px 50px',
            }}
          />
        </div>

        <div className="container mx-auto px-4 relative">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
              {/* Left: Info */}
              <div>
                <div className="inline-block bg-dorado/10 border border-dorado/30 px-5 py-2 rounded-full mb-6">
                  <span className="text-dorado font-semibold text-sm tracking-wide">
                    ⋆ Solicitud Mayorista
                  </span>
                </div>
                <h2 className="font-display font-bold text-4xl md:text-5xl mb-6 leading-tight">
                  ¿Listo para{' '}
                  <span className="bg-gradient-to-r from-dorado to-yellow-400 bg-clip-text text-transparent">
                    trabajar juntos?
                  </span>
                </h2>
                <p className="text-white/60 text-lg mb-8 leading-relaxed">
                  Déjanos tus datos y te enviaremos el catálogo completo con precios mayoristas.
                  O si prefieres, agendamos una llamada para entender tu operación.
                </p>

                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-dorado/10 border border-dorado/20 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Phone className="w-5 h-5 text-dorado" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-white">Llámanos directo</h4>
                      <a href="tel:+573042582777" className="text-dorado hover:text-yellow-400 transition-colors">
                        +57 304 258 2777
                      </a>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-dorado/10 border border-dorado/20 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Mail className="w-5 h-5 text-dorado" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-white">Escríbenos</h4>
                      <a href="mailto:empresas@tusaguacates.com" className="text-dorado hover:text-yellow-400 transition-colors">
                        empresas@tusaguacates.com
                      </a>
                    </div>
                  </div>
                </div>

                <div className="mt-10 flex flex-wrap gap-4">
                  <div className="flex items-center gap-2 text-white/50 text-sm">
                    <Shield className="w-4 h-4 text-dorado/70" />
                    Sin compromiso
                  </div>
                  <div className="flex items-center gap-2 text-white/50 text-sm">
                    <Clock className="w-4 h-4 text-dorado/70" />
                    Respuesta 24h
                  </div>
                  <div className="flex items-center gap-2 text-white/50 text-sm">
                    <Check className="w-4 h-4 text-dorado/70" />
                    Datos seguros
                  </div>
                </div>
              </div>

              {/* Right: Form */}
              <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-8 lg:p-10">
                <div className="mb-6">
                  <h3 className="font-display font-bold text-2xl text-white mb-2">
                    Solicitar Cotización
                  </h3>
                  <p className="text-white/50 text-sm">
                    Completa el formulario y te contactamos en menos de 24 horas.
                  </p>
                </div>
                <B2BLeadForm />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==================== FINAL CTA ==================== */}
      <section className="py-16 border-t border-white/5">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto">
            <h2 className="font-display font-bold text-3xl md:text-4xl mb-4">
          ¿Prefieres ver primero el catálogo?
            </h2>
            <p className="text-white/60 text-lg mb-8">
              Explora todos nuestros productos con precios mayoristas actualizados
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/empresas/aguacates"
                className="group inline-flex items-center justify-center gap-2 bg-gradient-to-r from-dorado to-yellow-500 hover:from-dorado/90 hover:to-yellow-500/90 text-[#07180f] font-bold px-8 py-4 rounded-xl transition-all duration-200 shadow-lg hover:shadow-dorado/30 transform hover:scale-105"
              >
                <Package className="w-5 h-5" />
                Ver Catálogo
                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <a
                href="https://wa.me/573042582777?text=Hola,%20quiero%20información%20sobre%20pedidos%20mayoristas"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 bg-white/5 border-2 border-white/20 hover:border-white/40 text-white font-bold px-8 py-4 rounded-xl transition-all duration-200 hover:scale-105"
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
