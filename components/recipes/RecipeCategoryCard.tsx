'use client';

import Link from 'next/link';
import Image from 'next/image';
import type { RecipeCategoryInfo } from '@/data/recipes';

interface RecipeCategoryCardProps {
  category: RecipeCategoryInfo;
  recipeCount: number;
}

// Configuración premium con imágenes de Unsplash de alta calidad
const categoryStyles: Record<string, {
  image: string;
  emoji: string;
  gradient: string;
  accentColor: string;
}> = {
  'con-aguacate': {
    image: 'https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?w=400&h=400&fit=crop&q=80',
    emoji: '🥑',
    gradient: 'from-green-900/80 via-emerald-800/70 to-green-900/80',
    accentColor: 'emerald'
  },
  'desayunos': {
    image: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=400&h=400&fit=crop&q=80',
    emoji: '🍳',
    gradient: 'from-amber-900/80 via-orange-800/70 to-amber-900/80',
    accentColor: 'amber'
  },
  'smoothies': {
    image: 'https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=400&h=400&fit=crop&q=80',
    emoji: '🥤',
    gradient: 'from-pink-900/80 via-rose-800/70 to-pink-900/80',
    accentColor: 'pink'
  },
  'ensaladas': {
    image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&h=400&fit=crop&q=80',
    emoji: '🥗',
    gradient: 'from-emerald-900/80 via-green-800/70 to-emerald-900/80',
    accentColor: 'emerald'
  },
  'platos-principales': {
    image: 'https://images.unsplash.com/photo-1546241072-48010ad2862c?w=400&h=400&fit=crop&q=80',
    emoji: '🍽️',
    gradient: 'from-orange-900/80 via-red-800/70 to-orange-900/80',
    accentColor: 'orange'
  },
  'snacks': {
    image: 'https://images.unsplash.com/photo-1599490659213-e2b9527bd087?w=400&h=400&fit=crop&q=80',
    emoji: '🥨',
    gradient: 'from-purple-900/80 via-violet-800/70 to-purple-900/80',
    accentColor: 'purple'
  },
  'postres': {
    image: 'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=400&h=400&fit=crop&q=80',
    emoji: '🍨',
    gradient: 'from-cyan-900/80 via-blue-800/70 to-cyan-900/80',
    accentColor: 'cyan'
  },
};

const accentColors = {
  emerald: 'from-emerald-400 to-green-500',
  amber: 'from-amber-400 to-orange-500',
  pink: 'from-pink-400 to-rose-500',
  orange: 'from-orange-400 to-red-500',
  purple: 'from-purple-400 to-violet-500',
  cyan: 'from-cyan-400 to-blue-500',
};

export function RecipeCategoryCard({ category, recipeCount }: RecipeCategoryCardProps) {
  const style = categoryStyles[category.slug] || {
    image: 'https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=400&h=400&fit=crop&q=80',
    emoji: category.icon,
    gradient: 'from-gray-900/80 via-gray-800/70 to-gray-900/80',
    accentColor: 'gray'
  };

  const accentGradient = accentColors[style.accentColor as keyof typeof accentColors] || accentColors.emerald;

  return (
    <Link href={`/recetas?categoria=${category.slug}`} className="flex-shrink-0 group">
      <div className="relative overflow-hidden rounded-2xl cursor-pointer"
        style={{ width: '180px', height: '200px' }}>

        {/* Imagen de fondo con efecto de zoom al hover */}
        <div className="absolute inset-0">
          <Image
            src={style.image}
            alt={category.name}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-110"
            sizes="180px"
            quality={85}
          />
        </div>

        {/* Overlay gradiente para legibilidad */}
        <div className={`absolute inset-0 bg-gradient-to-br ${style.gradient} transition-opacity duration-300 group-hover:opacity-90`} />

        {/* Patrón sutil de textura */}
        <div className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg"%3E%3Cfilter id="noiseFilter"%3E%3CfeTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="4" /%3E%3C/filter%3E%3Crect width="100%25" height="100%25" filter="url(%23noiseFilter)" /%3E%3C/svg%3E")',
          }}
        />

        {/* Borde decorativo con gradiente */}
        <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${accentGradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none`}
          style={{ padding: '2px' }}>
          <div className="w-full h-full rounded-2xl bg-transparent" />
        </div>

        {/* Badge decorativo del emoji */}
        <div className="absolute top-3 right-3">
          <div className={`relative w-10 h-10 rounded-full bg-gradient-to-br ${accentGradient} flex items-center justify-center shadow-lg transform group-hover:scale-110 group-hover:rotate-12 transition-all duration-300`}>
            <span className="text-lg drop-shadow-md">{style.emoji}</span>
          </div>
        </div>

        {/* Badge de cantidad */}
        <div className="absolute top-3 left-3">
          <div className="px-2 py-1 rounded-full bg-white/20 backdrop-blur-md border border-white/30">
            <span className="text-white text-xs font-bold drop-shadow-sm">
              {recipeCount}
            </span>
          </div>
        </div>

        {/* Contenido de información */}
        <div className="absolute inset-0 flex flex-col justify-end p-4">
          {/* Línea decorativa */}
          <div className={`h-0.5 w-8 bg-gradient-to-r ${accentGradient} rounded-full mb-2 transform origin-left group-hover:w-full transition-transform duration-300`} />

          <h3 className="text-white font-bold text-base leading-tight mb-1 drop-shadow-lg tracking-tight">
            {category.name}
          </h3>
          <p className="text-white/90 text-xs font-medium drop-shadow-md">
            {recipeCount === 1 ? '1 receta' : `${recipeCount} recetas`}
          </p>
        </div>

        {/* Efecto de brillo al hover */}
        <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/10 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
      </div>
    </Link>
  );
}
