'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Clock, Users, ChefHat } from 'lucide-react';
import type { Recipe } from '@/data/recipes';

interface RecipeCardProps {
  recipe: Recipe;
}

export function RecipeCard({ recipe }: RecipeCardProps) {
  const totalTime = recipe.prepTime + recipe.cookTime;

  return (
    <Link href={`/recetas/${recipe.slug}`}>
      <article className="group bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border-2 border-gray-100 hover:border-verde-aguacate/50 h-full flex flex-col hover:-translate-y-2 hover:scale-105">
        {/* Imagen */}
        <div className="relative aspect-[4/3] overflow-hidden">
          <Image
            src={recipe.image}
            alt={recipe.title}
            fill
            className="object-cover group-hover:scale-110 transition-transform duration-500"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />

          {/* Badge de categoría */}
          <div className="absolute top-3 left-3">
            <span className="bg-verde-aguacate text-white text-xs font-medium px-3 py-1 rounded-full">
              {recipe.category === 'con-aguacate' ? 'Con Aguacate' :
               recipe.category.charAt(0).toUpperCase() + recipe.category.slice(1).replace('-', ' ')}
            </span>
          </div>

          {/* Badge de destacado */}
          {recipe.isFeatured && (
            <div className="absolute top-3 right-3">
              <span className="bg-naranja-frutal text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                <span>⭐</span>
                <span>Destacada</span>
              </span>
            </div>
          )}
        </div>

        {/* Contenido */}
        <div className="p-4 flex flex-col flex-grow">
          <h3 className="font-bold text-lg text-gray-900 group-hover:text-verde-bosque transition-colors line-clamp-2 mb-2">
            {recipe.title}
          </h3>

          <p className="text-gray-600 text-sm line-clamp-2 mb-4 flex-grow">
            {recipe.shortDescription}
          </p>

          {/* Meta información */}
          <div className="flex items-center justify-between text-sm text-gray-500 pt-3 border-t border-gray-100">
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span>{totalTime} min</span>
            </div>

            <div className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              <span>{recipe.servings} porc.</span>
            </div>

            <div className="flex items-center gap-1">
              <ChefHat className="w-4 h-4" />
              <span>{recipe.difficulty}</span>
            </div>
          </div>
        </div>
      </article>
    </Link>
  );
}
