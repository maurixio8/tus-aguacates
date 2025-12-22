'use client';

import Link from 'next/link';
import type { RecipeCategoryInfo } from '@/data/recipes';

interface RecipeCategoryCardProps {
  category: RecipeCategoryInfo;
  recipeCount: number;
}

// Mapeo de gradientes y colores para cada categoría
const categoryStyles: Record<string, { gradient: string; initial: string }> = {
  'con-aguacate': { gradient: 'from-green-400 to-green-600', initial: 'A' },
  'desayunos': { gradient: 'from-yellow-400 to-orange-500', initial: 'D' },
  'smoothies': { gradient: 'from-pink-400 to-rose-500', initial: 'S' },
  'ensaladas': { gradient: 'from-emerald-400 to-teal-600', initial: 'E' },
  'platos-principales': { gradient: 'from-orange-400 to-red-500', initial: 'P' },
  'snacks': { gradient: 'from-purple-400 to-indigo-600', initial: 'S' },
  'postres': { gradient: 'from-cyan-400 to-blue-500', initial: 'P' },
};

export function RecipeCategoryCard({ category, recipeCount }: RecipeCategoryCardProps) {
  const style = categoryStyles[category.slug] || { gradient: 'from-gray-400 to-gray-600', initial: category.name[0] };

  return (
    <Link href={`/recetas?categoria=${category.slug}`} className="flex-shrink-0">
      <div className={`relative group cursor-pointer overflow-hidden rounded-2xl bg-gradient-to-br ${style.gradient} hover:shadow-xl hover:scale-105 transition-all duration-300`}
           style={{ width: '140px', height: '140px' }}>
        {/* Inicial grande estilizada */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-7xl font-black text-white/20 group-hover:text-white/30 transition-colors select-none">
            {style.initial}
          </div>
        </div>

        {/* Información superpuesta */}
        <div className="absolute inset-0 flex flex-col justify-end p-4 bg-gradient-to-t from-black/40 to-transparent">
          <h3 className="text-white font-bold text-sm leading-tight mb-1 drop-shadow-lg">
            {category.name}
          </h3>
          <p className="text-white/80 text-xs font-medium drop-shadow-md">
            {recipeCount} {recipeCount === 1 ? 'receta' : 'recetas'}
          </p>
        </div>
      </div>
    </Link>
  );
}
