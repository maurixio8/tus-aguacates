'use client';

import { Clock, Users, ChefHat, Heart, Share2, ShoppingCart } from 'lucide-react';
import type { GeneratedRecipe } from '@/lib/gemini-recipe-service';

interface RecipeDisplayProps {
  recipe: GeneratedRecipe;
  ingredients: string[];
}

export function RecipeDisplay({ recipe, ingredients }: RecipeDisplayProps) {
  const totalTime = recipe.prepTime + recipe.cookTime;

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({
        title: recipe.title,
        text: `¡Mira esta receta generada por el Chef Virtual de Tus Aguacates!\n\n${recipe.title}\n\nIngredientes: ${ingredients.join(', ')}`,
        url: window.location.href
      });
    } else {
      // Fallback: copiar al portapapeles
      const text = `¡Mira esta receta generada por el Chef Virtual de Tus Aguacates!\n\n${recipe.title}\n\n${recipe.description}\n\nIngredientes: ${ingredients.join(', ')}`;
      await navigator.clipboard.writeText(text);
      alert('Receta copiada al portapapeles');
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header de la receta */}
      <div className="bg-gradient-to-br from-verde-bosque to-verde-aguacate text-white rounded-2xl p-6 md:p-8 mb-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h1 className="text-2xl md:text-3xl font-bold mb-2">{recipe.title}</h1>
            <p className="text-white/90 text-sm md:text-base">{recipe.description}</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleShare}
              className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
              title="Compartir receta"
            >
              <Share2 className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Meta info */}
        <div className="flex flex-wrap gap-4 mt-4 text-sm">
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            <span>{totalTime} min</span>
          </div>
          <div className="flex items-center gap-1">
            <Users className="w-4 h-4" />
            <span>{recipe.servings} porciones</span>
          </div>
          <div className="flex items-center gap-1">
            <ChefHat className="w-4 h-4" />
            <span>{recipe.difficulty}</span>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Ingredientes */}
        <div className="md:col-span-1">
          <div className="bg-white rounded-xl shadow-sm p-6 sticky top-4">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Ingredientes</h2>
            <ul className="space-y-2">
              {recipe.ingredients.map((ing, index) => (
                <li key={index} className="flex items-start gap-2 text-sm">
                  <span className="text-verde-aguacate mt-1">•</span>
                  <span>
                    <span className="font-medium">{ing.quantity} {ing.unit}</span>
                    <span className="text-gray-600"> de {ing.name}</span>
                  </span>
                </li>
              ))}
            </ul>

            {/* Ingredientes que el usuario tiene */}
            <div className="mt-6 pt-4 border-t">
              <p className="text-sm text-gray-600 mb-2">Tienes estos ingredientes:</p>
              <div className="flex flex-wrap gap-1">
                {ingredients.map((ing) => (
                  <span
                    key={ing}
                    className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs"
                  >
                    ✓ {ing}
                  </span>
                ))}
              </div>
            </div>

            {/* CTA: Comprar ingredientes faltantes */}
            <a
              href="/tienda"
              className="mt-4 flex items-center justify-center gap-2 w-full px-4 py-2 bg-naranja-frutal hover:bg-orange-500 text-white rounded-lg transition-colors text-sm font-medium"
            >
              <ShoppingCart className="w-4 h-4" />
              Comprar ingredientes
            </a>
          </div>
        </div>

        {/* Preparación */}
        <div className="md:col-span-2 space-y-6">
          {/* Pasos */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Preparación</h2>
            <ol className="space-y-4">
              {recipe.steps.map((step, index) => (
                <li key={index} className="flex gap-4">
                  <span className="flex-shrink-0 w-8 h-8 bg-verde-aguacate text-white rounded-full flex items-center justify-center font-bold text-sm">
                    {index + 1}
                  </span>
                  <p className="text-gray-700 pt-1">{step}</p>
                </li>
              ))}
            </ol>
          </div>

          {/* Tips */}
          {recipe.tips && recipe.tips.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
              <h3 className="text-lg font-bold text-amber-900 mb-3 flex items-center gap-2">
                <Heart className="w-5 h-5" />
                Tips del Chef
              </h3>
              <ul className="space-y-2">
                {recipe.tips.map((tip, index) => (
                  <li key={index} className="text-amber-800 text-sm flex gap-2">
                    <span>💡</span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Footer actions */}
      <div className="mt-8 flex flex-wrap gap-4 justify-center">
        <button
          onClick={handleShare}
          className="flex items-center gap-2 px-6 py-3 bg-verde-aguacate text-white rounded-lg hover:bg-verde-bosque transition-colors"
        >
          <Share2 className="w-5 h-5" />
          Compartir receta
        </button>
        <a
          href="/tienda"
          className="flex items-center gap-2 px-6 py-3 bg-naranja-frutal text-white rounded-lg hover:bg-orange-500 transition-colors"
        >
          <ShoppingCart className="w-5 h-5" />
          Comprar ingredientes
        </a>
      </div>
    </div>
  );
}
