'use client';

import Link from 'next/link';
import Image from 'next/image';
import type { RecipeCategoryInfo } from '@/data/recipes';

interface RecipeCategoryCardProps {
  category: RecipeCategoryInfo;
  recipeCount: number;
}

// Configuración con imágenes de Unsplash de alta calidad
const categoryStyles: Record<string, {
  image: string;
  accentColor: string;
}> = {
  'con-aguacate': {
    image: 'https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?w=400&h=400&fit=crop&q=85',
    accentColor: 'emerald'
  },
  'desayunos': {
    image: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=400&h=400&fit=crop&q=85',
    accentColor: 'amber'
  },
  'smoothies': {
    image: 'https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=400&h=400&fit=crop&q=85',
    accentColor: 'pink'
  },
  'ensaladas': {
    image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&h=400&fit=crop&q=85',
    accentColor: 'emerald'
  },
  'platos-principales': {
    image: 'https://images.unsplash.com/photo-1546241072-48010ad2862c?w=400&h=400&fit=crop&q=85',
    accentColor: 'orange'
  },
  'snacks': {
    image: 'https://images.unsplash.com/photo-1599490659213-e2b9527bd087?w=400&h=400&fit=crop&q=85',
    accentColor: 'purple'
  },
  'postres': {
    image: 'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=400&h=400&fit=crop&q=85',
    accentColor: 'cyan'
  },
};

const accentGradients = {
  emerald: 'from-emerald-500 to-green-600',
  amber: 'from-amber-500 to-orange-600',
  pink: 'from-pink-500 to-rose-600',
  orange: 'from-orange-500 to-red-600',
  purple: 'from-purple-500 to-violet-600',
  cyan: 'from-cyan-500 to-blue-600',
  gray: 'from-gray-500 to-gray-600',
};

export function RecipeCategoryCard({ category, recipeCount }: RecipeCategoryCardProps) {
  const style = categoryStyles[category.slug] || {
    image: 'https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=400&h=400&fit=crop&q=85',
    accentColor: 'gray'
  };

  const accentGradient = accentGradients[style.accentColor] || accentGradients.emerald;

  return (
    <Link href={`/recetas?categoria=${category.slug}`} className="flex-shrink-0 group">
      <div className="relative overflow-hidden rounded-2xl cursor-pointer shadow-lg hover:shadow-2xl transition-all duration-300"
        style={{ width: '180px', height: '200px' }}>

        {/* Imagen de fondo con efecto de zoom al hover */}
        <div className="absolute inset-0">
          <Image
            src={style.image}
            alt={category.name}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-110"
            sizes="180px"
            quality={90}
          />
        </div>

        {/* Overlay muy sutil y claro - solo para legibilidad del texto */}
        <div className="absolute inset-0 bg-gradient-to-t from-white/95 via-white/40 to-white/10" />

        {/* Borde decorativo que aparece al hover */}
        <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${accentGradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
          style={{ padding: '3px' }}>
          <div className="w-full h-full rounded-2xl bg-white/90" />
        </div>

        {/* Contenido de información */}
        <div className="absolute inset-0 flex flex-col justify-end p-4">
          {/* Línea decorativa con gradiente */}
          <div className={`h-1 w-12 bg-gradient-to-r ${accentGradient} rounded-full mb-3 transform origin-left group-hover:w-full transition-transform duration-300 shadow-sm`} />

          <h3 className="text-gray-900 font-bold text-base leading-tight mb-1 tracking-tight">
            {category.name}
          </h3>
          <p className="text-gray-600 text-xs font-medium">
            {recipeCount === 1 ? '1 receta' : `${recipeCount} recetas`}
          </p>
        </div>

        {/* Efecto de brillo sutil al hover */}
        <div className="absolute inset-0 bg-gradient-to-tr from-white/40 via-transparent to-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
      </div>
    </Link>
  );
}
