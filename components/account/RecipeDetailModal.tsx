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
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      {/* Mobile: Sheet from bottom, Desktop: Centered modal */}
      <div
        className="bg-white w-full sm:max-w-2xl sm:rounded-2xl shadow-2xl max-h-[92vh] sm:max-h-[90vh] overflow-hidden flex flex-col animate-in slide-in-from-bottom-4 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header con botón de cerrar prominente */}
        <div className="bg-gradient-to-br from-verde-bosque via-verde-aguacate to-emerald-600 text-white p-4 sm:p-6 relative shrink-0">
          {/* Botón de cerrar - siempre visible y fácil de tocar */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 sm:top-4 sm:right-4 p-2 sm:p-2 bg-black/20 hover:bg-black/30 active:bg-black/40 rounded-full transition-all z-10"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={2.5} />
          </button>

          <div className="flex items-start gap-2 sm:gap-3">
            <div className="bg-white/20 backdrop-blur-sm rounded-lg sm:rounded-xl p-2 sm:p-3 shrink-0">
              <ChefHat className="w-6 h-6 sm:w-8 sm:h-8" />
            </div>
            <div className="flex-1 min-w-0 pr-10 sm:pr-12">
              <h2 className="font-bold text-xl sm:text-2xl mb-1 sm:mb-2 leading-tight">{recipe.title}</h2>
              <p className="text-white/90 text-xs sm:text-sm line-clamp-2">{recipe.description}</p>
            </div>
          </div>

          {/* Meta info - más legible en móvil */}
          <div className="flex flex-wrap gap-2 sm:gap-4 mt-3 sm:mt-4 text-xs sm:text-sm">
            <span className="flex items-center gap-1.5 sm:gap-2 bg-white/20 px-2 py-1 rounded-full">
              <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              {totalTime} min
            </span>
            <span className="flex items-center gap-1.5 sm:gap-2 bg-white/20 px-2 py-1 rounded-full">
              <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              {recipe.servings} porc
            </span>
            <span className="px-2 sm:px-3 py-1 bg-white/20 rounded-full font-medium text-xs sm:text-xs">
              {recipe.difficulty}
            </span>
            {recipe.category && (
              <span className="px-2 sm:px-3 py-1 bg-white/20 rounded-full font-medium text-xs sm:text-xs">
                {recipe.category}
              </span>
            )}
          </div>
        </div>

        {/* Content - Scrollable con mejor espaciado */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
          {/* Ingredientes */}
          <div>
            <h3 className="font-bold text-lg sm:text-xl mb-3 flex items-center gap-2 text-verde-bosque">
              <span className="text-xl sm:text-2xl">🥗</span>
              <span>Ingredientes</span>
            </h3>
            <div className="space-y-2">
              {recipe.ingredients.map((ing, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 p-3 bg-green-50 rounded-xl border border-green-100"
                >
                  <span className="flex-shrink-0 w-6 h-6 bg-verde-aguacate text-white rounded-full flex items-center justify-center text-xs font-bold mt-0.5">
                    {index + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm sm:text-base text-gray-900">{ing.name}</p>
                    {(ing.quantity || ing.unit) && (
                      <p className="text-xs sm:text-sm text-gray-600 mt-0.5">
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
            <h3 className="font-bold text-lg sm:text-xl mb-3 flex items-center gap-2 text-verde-bosque">
              <span className="text-xl sm:text-2xl">👨‍🍳</span>
              <span>Instrucciones</span>
            </h3>
            <div className="space-y-3 sm:space-y-4">
              {recipe.steps.map((step, index) => (
                <div
                  key={index}
                  className="flex gap-3 sm:gap-4 p-3 sm:p-4 bg-gray-50 rounded-xl border border-gray-100"
                >
                  <span className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-br from-verde-aguacate to-verde-bosque text-white rounded-full flex items-center justify-center text-sm sm:text-base font-bold">
                    {index + 1}
                  </span>
                  <p className="flex-1 text-sm sm:text-base text-gray-700 leading-relaxed">{step}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Tips */}
          {recipe.tips && recipe.tips.length > 0 && (
            <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
              <h3 className="font-bold text-base sm:text-lg mb-2 sm:mb-3 text-amber-800 flex items-center gap-2">
                <span className="text-lg sm:text-xl">💡</span>
                <span>Tips del Chef</span>
              </h3>
              <ul className="space-y-2 sm:space-y-3 text-sm sm:text-base text-amber-900">
                {recipe.tips.map((tip, index) => (
                  <li key={index} className="flex gap-2 sm:gap-3 leading-relaxed">
                    <span className="flex-shrink-0 text-amber-600">•</span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Footer con botón de cerrar prominente */}
        <div className="p-3 sm:p-4 border-t border-gray-200 bg-gray-50 shrink-0">
          <button
            onClick={onClose}
            className="w-full bg-verde-bosque hover:bg-verde-bosque/90 active:bg-verde-bosque/95 text-white font-bold py-3.5 sm:py-3 rounded-xl transition-all text-base sm:text-base shadow-lg active:shadow-md"
          >
            Cerrar Receta
          </button>
        </div>
      </div>
    </div>
  );
}