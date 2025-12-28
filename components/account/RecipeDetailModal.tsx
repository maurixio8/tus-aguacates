'use client';

import React from 'react';
import { X, Clock, Users, ChefHat } from 'lucide-react';
import type { GeneratedRecipe } from '@/lib/gemini-recipe-service';

interface RecipeDetailModalProps {
  recipe: GeneratedRecipe & { id?: string; is_favorited?: boolean };
  isOpen: boolean;
  onClose: () => void;
}

export function RecipeDetailModal({ recipe, isOpen, onClose }: RecipeDetailModalProps) {
  if (!isOpen) return null;

  const totalTime = recipe.prepTime + recipe.cookTime;

  // Cerrar al hacer clic fuera del modal
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Cerrar con tecla Escape
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevenir scroll en el body
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      {/* Mobile: Full screen sheet, Desktop: Large centered modal */}
      <div
        className="bg-white w-full sm:max-w-4xl sm:rounded-3xl shadow-2xl h-[98vh] sm:h-[95vh] overflow-hidden flex flex-col animate-in slide-in-from-bottom-4 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header con botón de cerrar prominente */}
        <div className="bg-gradient-to-br from-verde-bosque via-verde-aguacate to-emerald-600 text-white p-5 sm:p-8 relative shrink-0">
          {/* Botón de cerrar - grande y fácil de tocar */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 sm:top-5 sm:right-5 p-3 bg-black/30 hover:bg-black/40 active:bg-black/50 rounded-full transition-all z-10"
            aria-label="Cerrar"
          >
            <X className="w-6 h-6 sm:w-7 sm:h-7" strokeWidth={2.5} />
          </button>

          <div className="flex items-start gap-3 sm:gap-4">
            <div className="bg-white/20 backdrop-blur-sm rounded-xl sm:rounded-2xl p-3 sm:p-4 shrink-0">
              <ChefHat className="w-8 h-8 sm:w-10 sm:h-10" />
            </div>
            <div className="flex-1 min-w-0 pr-16 sm:pr-20">
              <h2 className="font-bold text-2xl sm:text-3xl mb-2 sm:mb-3 leading-tight">{recipe.title}</h2>
              <p className="text-white/90 text-sm sm:text-base">{recipe.description}</p>
            </div>
          </div>

          {/* Meta info - badges más grandes */}
          <div className="flex flex-wrap gap-2.5 sm:gap-3 mt-4 sm:mt-5 text-sm sm:text-base">
            <span className="flex items-center gap-2 bg-white/25 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full font-medium">
              <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
              {totalTime} min
            </span>
            <span className="flex items-center gap-2 bg-white/25 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full font-medium">
              <Users className="w-4 h-4 sm:w-5 sm:h-5" />
              {recipe.servings} porc
            </span>
            <span className="px-3 py-1.5 sm:px-4 sm:py-2 bg-white/25 rounded-full font-bold text-sm sm:text-base">
              {recipe.difficulty}
            </span>
            {recipe.category && (
              <span className="px-3 py-1.5 sm:px-4 sm:py-2 bg-white/25 rounded-full font-bold text-sm sm:text-base">
                {recipe.category}
              </span>
            )}
          </div>
        </div>

        {/* Content - Scrollable con mucho espaciado */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-8 space-y-6 sm:space-y-8">
          {/* Ingredientes */}
          <div>
            <h3 className="font-bold text-2xl sm:text-3xl mb-4 sm:mb-5 flex items-center gap-3 text-verde-bosque">
              <span className="text-3xl sm:text-4xl">🥗</span>
              <span>Ingredientes</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {recipe.ingredients.map((ing, index) => (
                <div
                  key={index}
                  className="flex items-start gap-4 p-4 sm:p-5 bg-green-50 rounded-xl sm:rounded-2xl border-2 border-green-100"
                >
                  <span className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 bg-verde-aguacate text-white rounded-full flex items-center justify-center text-base sm:text-lg font-bold">
                    {index + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-base sm:text-lg text-gray-900">{ing.name}</p>
                    {(ing.quantity || ing.unit) && (
                      <p className="text-sm sm:text-base text-gray-600 mt-1">
                        {ing.quantity && `${ing.quantity} `}
                        {ing.unit && ing.unit}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Instrucciones */}
          <div>
            <h3 className="font-bold text-2xl sm:text-3xl mb-4 sm:mb-5 flex items-center gap-3 text-verde-bosque">
              <span className="text-3xl sm:text-4xl">👨‍🍳</span>
              <span>Instrucciones</span>
            </h3>
            <div className="space-y-4 sm:space-y-5">
              {recipe.steps.map((step, index) => (
                <div
                  key={index}
                  className="flex gap-4 sm:gap-5 p-4 sm:p-6 bg-gray-50 rounded-xl sm:rounded-2xl border-2 border-gray-100"
                >
                  <span className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-verde-aguacate to-verde-bosque text-white rounded-full flex items-center justify-center text-base sm:text-lg font-bold">
                    {index + 1}
                  </span>
                  <p className="flex-1 text-base sm:text-lg text-gray-700 leading-relaxed">{step}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Tips */}
          {recipe.tips && recipe.tips.length > 0 && (
            <div className="p-5 sm:p-6 bg-amber-50 rounded-xl sm:rounded-2xl border-2 border-amber-200">
              <h3 className="font-bold text-xl sm:text-2xl mb-3 sm:mb-4 text-amber-800 flex items-center gap-3">
                <span className="text-2xl sm:text-3xl">💡</span>
                <span>Tips del Chef</span>
              </h3>
              <ul className="space-y-3 sm:space-y-4 text-base sm:text-lg text-amber-900">
                {recipe.tips.map((tip, index) => (
                  <li key={index} className="flex gap-3 leading-relaxed">
                    <span className="flex-shrink-0 text-amber-600 text-xl">•</span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Footer con botón de cerrar prominente */}
        <div className="p-4 sm:p-6 border-t-2 border-gray-200 bg-gray-50 shrink-0">
          <button
            onClick={onClose}
            className="w-full bg-verde-bosque hover:bg-verde-bosque/90 active:bg-verde-bosque/95 text-white font-bold py-4 sm:py-4 rounded-xl sm:rounded-2xl transition-all text-lg sm:text-xl shadow-lg active:shadow-md"
          >
            Cerrar Receta
          </button>
        </div>
      </div>
    </div>
  );
}