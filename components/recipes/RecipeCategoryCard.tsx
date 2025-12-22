'use client';

import Link from 'next/link';
import type { RecipeCategoryInfo } from '@/data/recipes';

interface RecipeCategoryCardProps {
  category: RecipeCategoryInfo;
  recipeCount: number;
}

export function RecipeCategoryCard({ category, recipeCount }: RecipeCategoryCardProps) {
  return (
    <Link href={`/recetas?categoria=${category.slug}`}>
      <div className={`${category.color} rounded-2xl p-6 text-white hover:scale-105 transition-transform duration-300 cursor-pointer h-full`}>
        <div className="text-4xl mb-3">{category.icon}</div>
        <h3 className="font-bold text-lg mb-1">{category.name}</h3>
        <p className="text-white/80 text-sm mb-2">{category.description}</p>
        <p className="text-white/60 text-xs">{recipeCount} recetas</p>
      </div>
    </Link>
  );
}
