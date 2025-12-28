'use client';

import { Heart, Clock, Users, Eye } from 'lucide-react';
import { useState } from 'react';
import type { GeneratedRecipe } from '@/lib/gemini-recipe-service';
import Link from 'next/link';

interface RecipeCardProps {
  recipe: GeneratedRecipe & { id: string; is_favorited: boolean };
  onToggleFavorite: (recipeId: string) => void;
}

export function RecipeCard({ recipe, onToggleFavorite }: RecipeCardProps) {
  const [isFavoriting, setIsFavoriting] = useState(false);
  const totalTime = recipe.prepTime + recipe.cookTime;

  const handleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsFavoriting(true);
    try {
      await onToggleFavorite(recipe.id);
    } finally {
      setIsFavoriting(false);
    }
  };

  return (
    <Link
      href={`/cuenta/recetas/${recipe.id}`}
      className="block group bg-white rounded-xl sm:rounded-2xl shadow-lg border-2 border-gray-100 overflow-hidden hover:shadow-xl hover:border-verde-aguacate/50 transition-all duration-300 hover:-translate-y-1"
    >
      {/* Header con gradiente */}
      <div className="bg-gradient-to-br from-verde-bosque via-verde-aguacate to-emerald-600 text-white p-3 sm:p-4 relative overflow-hidden">
        {/* Decoración de fondo */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
        </div>

        <div className="relative z-10">
          <h3 className="font-bold text-base sm:text-lg leading-tight">{recipe.title}</h3>
          <p className="text-white/80 text-xs sm:text-sm mt-1 line-clamp-2">{recipe.description}</p>
        </div>
      </div>

      {/* Contenido */}
      <div className="p-3 sm:p-4">
        {/* Meta info */}
        <div className="flex flex-wrap gap-2 sm:gap-3 text-xs sm:text-sm text-gray-600 mb-2 sm:mb-3">
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
            {totalTime} min
          </span>
          <span className="flex items-center gap-1">
            <Users className="w-3 h-3 sm:w-4 sm:h-4" />
            {recipe.servings} porc
          </span>
          <span className="px-2 py-0.5 bg-verde-aguacate/10 text-verde-bosque rounded-full text-[10px] sm:text-xs font-medium">
            {recipe.difficulty}
          </span>
        </div>

        {/* Ingredientes */}
        <div className="flex flex-wrap gap-1 mb-3 sm:mb-4">
          {recipe.ingredients.slice(0, 3).map((ing, index) => (
            <span key={index} className="px-1.5 py-0.5 sm:px-2 sm:py-1 bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 rounded-lg text-[10px] sm:text-xs font-medium border border-green-200">
              {ing.name}
            </span>
          ))}
          {recipe.ingredients.length > 3 && (
            <span className="px-1.5 py-0.5 sm:px-2 sm:py-1 bg-gray-100 text-gray-600 rounded-lg text-[10px] sm:text-xs">
              +{recipe.ingredients.length - 3}
            </span>
          )}
        </div>

        {/* Pasos preview */}
        <div className="mb-3 sm:mb-4">
          <p className="text-[10px] sm:text-xs text-gray-500 mb-1 sm:mb-2">Pasos:</p>
          <div className="space-y-0.5 sm:space-y-1">
            {recipe.steps.slice(0, 2).map((step, index) => (
              <p key={index} className="text-[10px] sm:text-xs text-gray-700 line-clamp-1">
                <span className="font-bold text-verde-aguacate">{index + 1}.</span> {step}
              </p>
            ))}
            {recipe.steps.length > 2 && (
              <p className="text-[10px] sm:text-xs text-gray-500">+ {recipe.steps.length - 2} pasos más...</p>
            )}
          </div>
        </div>

        {/* Acciones */}
        <div className="flex gap-2">
          <div className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl font-medium text-sm bg-verde-aguacate text-white">
            <Eye className="w-4 h-4" />
            Ver receta completa
          </div>
          <button
            onClick={handleFavorite}
            disabled={isFavoriting}
            className={`px-4 py-2 rounded-xl font-medium transition-all duration-300 text-sm ${
              recipe.is_favorited
                ? 'bg-red-100 text-red-600 hover:bg-red-200 border border-red-200'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-200'
            } disabled:opacity-50`}
          >
            <Heart className={`w-4 h-4 ${recipe.is_favorited ? 'fill-current' : ''}`} />
          </button>
        </div>
      </div>
    </Link>
  );
}
