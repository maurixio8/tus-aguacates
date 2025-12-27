'use client';

import { ChefHat, Clock, Heart, Sparkles, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export function ChefVirtualPromo() {
  const benefits = [
    {
      icon: Clock,
      title: '5 recetas diarias',
      description: 'Vs 2 para visitantes',
    },
    {
      icon: Heart,
      title: 'Guarda tus favoritas',
      description: 'Acceso permanente',
    },
    {
      icon: Sparkles,
      title: 'IA creativa',
      description: 'Recetas únicas',
    },
  ];

  return (
    <div className="relative bg-gradient-to-br from-verde-bosque via-verde-aguacate to-emerald-600 rounded-3xl p-6 md:p-10 overflow-hidden">
      {/* Decoración de fondo */}
      <div className="absolute inset-0">
        {/* Círculo blur superior derecho */}
        <div className="absolute top-0 right-0 w-64 h-64 md:w-80 md:h-80 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        {/* Círculo blur inferior izquierdo */}
        <div className="absolute bottom-0 left-0 w-48 h-48 md:w-64 md:h-64 bg-naranja-frutal/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="w-full h-full" style={{
            backgroundImage: `radial-gradient(circle, white 1px, transparent 1px)`,
            backgroundSize: '24px 24px'
          }}></div>
        </div>
      </div>

      <div className="relative z-10">
        <div className="flex flex-col lg:flex-row items-center gap-6 lg:gap-10">
          {/* Contenido */}
          <div className="flex-1 text-center lg:text-left">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full mb-4">
              <Sparkles className="w-4 h-4 text-yellow-300" />
              <span className="text-white text-sm font-medium">Exclusivo para registrados</span>
            </div>

            {/* Título */}
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-3">
              Chef Virtual
            </h2>
            <p className="text-xl md:text-2xl text-white/90 mb-6">
              Tu chef personal con IA
            </p>

            {/* Beneficios */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
              {benefits.map((benefit, index) => (
                <div
                  key={index}
                  className="bg-white/20 backdrop-blur-sm rounded-xl px-4 py-3 flex items-center gap-3 lg:block lg:text-center"
                >
                  <div className="bg-white/30 rounded-lg p-2 lg:mx-auto lg:mb-2">
                    <benefit.icon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-white font-bold text-sm">{benefit.title}</p>
                    <p className="text-white/70 text-xs">{benefit.description}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* CTA */}
            <Link
              href="/chef-virtual"
              className="inline-flex items-center justify-center gap-2 bg-white text-verde-bosque px-6 py-3 rounded-xl font-bold text-lg hover:bg-white/90 hover:shadow-xl hover:scale-105 transition-all duration-300"
            >
              <ChefHat className="w-5 h-5" />
              Generar receta ahora
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>

          {/* Emoji decorativo */}
          <div className="text-[120px] md:text-[160px] lg:text-[200px] leading-none animate-bounce" style={{ animationDuration: '3s' }}>
            👨‍🍳
          </div>
        </div>
      </div>

      {/* Línea decorativa inferior */}
      <div className="absolute bottom-0 left-0 right-0 h-2 bg-gradient-to-r from-transparent via-white/30 to-transparent"></div>
    </div>
  );
}
