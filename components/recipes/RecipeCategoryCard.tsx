'use client';

import Link from 'next/link';
import type { RecipeCategoryInfo } from '@/data/recipes';

interface RecipeCategoryCardProps {
  category: RecipeCategoryInfo;
  recipeCount: number;
}

// Mapeo de gradientes mejorados y emojis para cada categoría
const categoryStyles: Record<string, {
  gradient: string;
  emoji: string;
}> = {
  'con-aguacate': {
    gradient: 'from-green-400 via-emerald-500 to-teal-600',
    emoji: '🥑'
  },
  'desayunos': {
    gradient: 'from-amber-400 via-orange-500 to-yellow-500',
    emoji: '🍳'
  },
  'smoothies': {
    gradient: 'from-pink-400 via-rose-500 to-fuchsia-600',
    emoji: '🥤'
  },
  'ensaladas': {
    gradient: 'from-emerald-400 via-green-500 to-teal-600',
    emoji: '🥗'
  },
  'platos-principales': {
    gradient: 'from-orange-400 via-red-500 to-rose-600',
    emoji: '🍽️'
  },
  'snacks': {
    gradient: 'from-purple-400 via-violet-500 to-indigo-600',
    emoji: '🥨'
  },
  'postres': {
    gradient: 'from-cyan-400 via-blue-500 to-indigo-600',
    emoji: '🍨'
  },
};

export function RecipeCategoryCard({ category, recipeCount }: RecipeCategoryCardProps) {
  const style = categoryStyles[category.slug] || {
    gradient: 'from-gray-400 to-gray-600',
    emoji: category.icon
  };

  return (
    <Link href={`/recetas?categoria=${category.slug}`} className="flex-shrink-0">
      <div className={`
        relative group cursor-pointer overflow-hidden rounded-2xl
        bg-gradient-to-br ${style.gradient}
        hover:shadow-2xl hover:scale-105
        transition-all duration-300
        before:absolute before:inset-0
        before:bg-gradient-to-t before:from-black/50 via-transparent to-transparent
        before:opacity-0 group-hover:before:opacity-100
        before:transition-opacity before:duration-300
      `} style={{ width: '160px', height: '160px' }}>

        {/* Emoji grande flotante */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-6xl transform group-hover:scale-110 group-hover:rotate-12 transition-all duration-300 drop-shadow-2xl">
            {style.emoji}
          </div>
        </div>

        {/* Efecto de brillo en hover */}
        <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/20 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

        {/* Información superpuesta */}
        <div className="absolute inset-0 flex flex-col justify-end p-3 bg-gradient-to-t from-black/60 via-black/20 to-transparent">
          <h3 className="text-white font-bold text-sm leading-tight mb-1 drop-shadow-lg">
            {category.name}
          </h3>
          <p className="text-white/90 text-xs font-medium drop-shadow-md">
            {recipeCount} {recipeCount === 1 ? 'receta' : 'recetas'}
          </p>
        </div>
      </div>
    </Link>
  );
}
