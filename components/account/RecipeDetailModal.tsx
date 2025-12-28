'use client';

import { X, Clock, Users, ChefHat, Heart } from 'lucide-react';
import type { GeneratedRecipe } from '@/lib/gemini-recipe-service';

interface RecipeDetailModalProps {
  recipe: GeneratedRecipe & { id?: string; is_favorited?: boolean };
  isOpen: boolean;
  onClose: () => void;
}

export function RecipeDetailModal({ recipe, isOpen, onClose }: RecipeDetailModalProps) {
  if (!isOpen) return null;

  const totalTime = recipe.prepTime + recipe.cookTime;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-br from-verde-bosque via-verde-aguacate to-emerald-600 text-white p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-start gap-3">
            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3">
              <ChefHat className="w-8 h-8" />
            </div>
            <div className="flex-1">
              <h2 className="font-bold text-2xl mb-2">{recipe.title}</h2>
              <p className="text-white/90 text-sm">{recipe.description}</p>
            </div>
          </div>

          {/* Meta info */}
          <div className="flex flex-wrap gap-4 mt-4 text-sm">
            <span className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              {totalTime} min
            </span>
            <span className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              {recipe.servings} porciones
            </span>
            <span className="px-3 py-1 bg-white/20 rounded-full text-xs font-medium">
              {recipe.difficulty}
            </span>
            {recipe.category && (
              <span className="px-3 py-1 bg-white/20 rounded-full text-xs font-medium">
                {recipe.category}
              </span>
            )}
          </div>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Ingredientes */}
          <div className="mb-6">
            <h3 className="font-bold text-lg mb-3 flex items-center gap-2 text-verde-bosque">
              <span>🥗</span> Ingredientes
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {recipe.ingredients.map((ing, index) => (
                <div
                  key={index}
                  className="flex items-start gap-2 p-2 bg-green-50 rounded-lg text-sm"
                >
                  <span className="text-verde-bosque font-bold">•</span>
                  <div>
                    <span className="font-medium">{ing.name}</span>
                    {(ing.quantity || ing.unit) && (
                      <span className="text-gray-600 ml-1">
                        {ing.quantity && `${ing.quantity} `}
                        {ing.unit && ing.unit}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Instrucciones */}
          <div>
            <h3 className="font-bold text-lg mb-3 flex items-center gap-2 text-verde-bosque">
              <span>👨‍🍳</span> Instrucciones
            </h3>
            <div className="space-y-3">
              {recipe.steps.map((step, index) => (
                <div
                  key={index}
                  className="flex gap-3 p-3 bg-gray-50 rounded-xl hover:bg-green-50 transition-colors"
                >
                  <span className="flex-shrink-0 w-7 h-7 bg-gradient-to-br from-verde-aguacate to-verde-bosque text-white rounded-full flex items-center justify-center text-sm font-bold">
                    {index + 1}
                  </span>
                  <p className="text-sm text-gray-700 leading-relaxed">{step}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Tips */}
          {recipe.tips && recipe.tips.length > 0 && (
            <div className="mt-6 p-4 bg-amber-50 rounded-xl border border-amber-200">
              <h3 className="font-bold text-sm mb-2 text-amber-800 flex items-center gap-2">
                <span>💡</span> Tips del Chef
              </h3>
              <ul className="space-y-1 text-sm text-amber-900">
                {recipe.tips.map((tip, index) => (
                  <li key={index} className="flex gap-2">
                    <span>•</span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="w-full bg-verde-bosque hover:bg-verde-bosque/90 text-white font-semibold py-3 rounded-xl transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
