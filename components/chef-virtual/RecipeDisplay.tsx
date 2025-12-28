'use client';

import { Clock, Users, ChefHat, Heart, Share2, ShoppingCart, Sparkles, Check, AlertTriangle } from 'lucide-react';
import type { GeneratedRecipe } from '@/lib/gemini-recipe-service';

interface RecipeDisplayProps {
  recipe: GeneratedRecipe;
  ingredients: string[];
  recipeSaved?: boolean;
  saveWarning?: string | null;
}

export function RecipeDisplay({ recipe, ingredients, recipeSaved = false, saveWarning = null }: RecipeDisplayProps) {
  const totalTime = recipe.prepTime + recipe.cookTime;

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({
        title: recipe.title,
        text: `¡Mira esta receta generada por el Chef Virtual de Tus Aguacates!\n\n${recipe.title}\n\nIngredientes: ${ingredients.join(', ')}`,
        url: window.location.href
      });
    } else {
      const text = `¡Mira esta receta del Chef Virtual de Tus Aguacates!\n\n${recipe.title}\n\n${recipe.description}\n\nIngredientes: ${ingredients.join(', ')}`;
      await navigator.clipboard.writeText(text);
      alert('✅ Receta copiada al portapapeles');
    }
  };

  return (
    <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header principal con gradiente animado */}
      <div className="relative overflow-hidden bg-gradient-to-br from-verde-bosque via-verde-aguacate to-emerald-600 text-white rounded-3xl p-6 md:p-10 mb-8 shadow-xl">
        {/* Decoración de fondo */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-yellow-300 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
        </div>

        <div className="relative z-10">
          <div className="flex items-start justify-between gap-4 mb-6">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                <Sparkles className="w-6 h-6 text-yellow-300 animate-pulse" />
                <span className="text-sm font-medium bg-white/20 px-3 py-1 rounded-full">
                  Receta generada con IA
                </span>
                {recipeSaved && (
                  <span className="text-sm font-medium bg-green-500/30 px-3 py-1 rounded-full flex items-center gap-1.5">
                    <Check className="w-4 h-4" />
                    Guardada en Mis Recetas
                  </span>
                )}
              </div>
              {saveWarning && (
                <div className="mb-3 p-3 bg-amber-500/20 border border-amber-400/30 rounded-lg text-sm">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-300 flex-shrink-0" />
                    <span>{saveWarning}</span>
                  </div>
                </div>
              )}
              <h1 className="text-3xl md:text-4xl font-bold mb-3 leading-tight">{recipe.title}</h1>
              <p className="text-white/90 text-base md:text-lg leading-relaxed">{recipe.description}</p>
            </div>
          </div>

          {/* Meta info con tarjetas */}
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-xl">
              <Clock className="w-5 h-5" />
              <div>
                <p className="text-xs text-white/70">Tiempo total</p>
                <p className="font-bold">{totalTime} min</p>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-xl">
              <Users className="w-5 h-5" />
              <div>
                <p className="text-xs text-white/70">Porciones</p>
                <p className="font-bold">{recipe.servings}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-xl">
              <ChefHat className="w-5 h-5" />
              <div>
                <p className="text-xs text-white/70">Dificultad</p>
                <p className="font-bold">{recipe.difficulty}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Columna izquierda: Ingredientes */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-100 overflow-hidden sticky top-4">
            {/* Header de ingredientes */}
            <div className="bg-gradient-to-r from-verde-aguacate to-verde-bosque px-6 py-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span className="text-2xl">🥗</span>
                Ingredientes
              </h2>
            </div>

            <div className="p-6">
              <ul className="space-y-3">
                {recipe.ingredients.map((ing, index) => (
                  <li
                    key={index}
                    className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl hover:bg-verde-aguacate/10 transition-colors group"
                  >
                    <span className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-verde-aguacate to-verde-bosque text-white rounded-lg flex items-center justify-center font-bold text-sm">
                      {index + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900">{ing.name}</p>
                      <p className="text-sm text-gray-600">
                        <span className="font-medium text-verde-aguacate">{ing.quantity} {ing.unit}</span>
                      </p>
                    </div>
                  </li>
                ))}
              </ul>

              {/* Ingredientes que el usuario tiene */}
              <div className="mt-6 pt-6 border-t-2 border-gray-100">
                <p className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  Tienes estos ingredientes:
                </p>
                <div className="flex flex-wrap gap-2">
                  {ingredients.map((ing) => (
                    <span
                      key={ing}
                      className="px-3 py-1.5 bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 rounded-lg text-xs font-medium border border-green-200"
                    >
                      ✓ {ing}
                    </span>
                  ))}
                </div>
              </div>

              {/* CTA: Comprar ingredientes */}
              <a
                href="/tienda"
                className="mt-6 flex items-center justify-center gap-2 w-full px-4 py-4 bg-gradient-to-r from-naranja-frutal to-orange-500 hover:from-orange-500 hover:to-naranja-frutal text-white rounded-xl transition-all duration-300 font-bold shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <ShoppingCart className="w-5 h-5" />
                Comprar ingredientes
              </a>
            </div>
          </div>
        </div>

        {/* Columna derecha: Preparación */}
        <div className="lg:col-span-2 space-y-6">
          {/* Pasos */}
          <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-verde-aguacate to-verde-bosque px-6 py-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span className="text-2xl">👨‍🍳</span>
                Preparación
              </h2>
            </div>
            <div className="p-6">
              <ol className="space-y-4">
                {recipe.steps.map((step, index) => (
                  <li
                    key={index}
                    className="flex gap-4 p-4 bg-gray-50 rounded-xl hover:bg-verde-aguacate/10 transition-all group"
                  >
                    <span className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-verde-aguacate to-verde-bosque text-white rounded-xl flex items-center justify-center font-bold text-sm shadow-md group-hover:scale-110 transition-transform">
                      {index + 1}
                    </span>
                    <p className="text-gray-700 pt-2 leading-relaxed">{step}</p>
                  </li>
                ))}
              </ol>
            </div>
          </div>

          {/* Tips */}
          {recipe.tips && recipe.tips.length > 0 && (
            <div className="bg-gradient-to-br from-amber-50 to-yellow-50 border-2 border-amber-200 rounded-2xl p-6 shadow-md">
              <h3 className="text-lg font-bold text-amber-900 mb-4 flex items-center gap-2">
                <Heart className="w-5 h-5 fill-amber-500 text-amber-500" />
                Tips del Chef
              </h3>
              <ul className="space-y-3">
                {recipe.tips.map((tip, index) => (
                  <li
                    key={index}
                    className="text-amber-800 text-sm flex gap-3 p-3 bg-white/50 rounded-lg"
                  >
                    <span className="text-xl">💡</span>
                    <span className="leading-relaxed">{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Botones de acción */}
          <div className="flex flex-wrap gap-4 justify-center p-6 bg-white rounded-2xl shadow-lg border-2 border-gray-100">
            <button
              onClick={handleShare}
              className="flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-verde-aguacate to-verde-bosque text-white rounded-xl hover:shadow-xl transition-all duration-300 font-bold shadow-md transform hover:scale-105"
            >
              <Share2 className="w-5 h-5" />
              Compartir receta
            </button>
            <a
              href="/tienda"
              className="flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-naranja-frutal to-orange-500 text-white rounded-xl hover:shadow-xl transition-all duration-300 font-bold shadow-md transform hover:scale-105"
            >
              <ShoppingCart className="w-5 h-5" />
              Comprar ingredientes
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
