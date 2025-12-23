'use client';

import { useState, useEffect } from 'react';
import { Sparkles, RotateCcw } from 'lucide-react';
import { IngredientInput, RecipeDisplay } from '@/components/chef-virtual';
import type { GeneratedRecipe } from '@/lib/gemini-recipe-service';

const MAX_FREE_DAILY = 2;

export function ChefVirtualGenerator() {
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [recipe, setRecipe] = useState<GeneratedRecipe | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dailyCount, setDailyCount] = useState(0);

  // Load daily count from localStorage on mount (client-side only)
  useEffect(() => {
    const today = new Date().toDateString();
    const saved = localStorage.getItem('chefVirtualCount');
    if (saved) {
      try {
        const { date, count } = JSON.parse(saved);
        if (date === today) {
          setDailyCount(count);
        } else {
          localStorage.setItem('chefVirtualCount', JSON.stringify({ date: today, count: 0 }));
        }
      } catch (e) {
        console.error('Error parsing chefVirtualCount:', e);
      }
    }
  }, []);

  const generateRecipe = async () => {
    if (ingredients.length === 0) {
      setError('Por favor ingresa al menos un ingrediente');
      return;
    }

    // Check daily limit
    const today = new Date().toDateString();
    const saved = localStorage.getItem('chefVirtualCount');
    let currentCount = 0;

    if (saved) {
      try {
        const { date, count } = JSON.parse(saved);
        if (date === today) {
          currentCount = count;
        }
      } catch (e) {
        console.error('Error parsing chefVirtualCount:', e);
      }
    }

    if (currentCount >= MAX_FREE_DAILY) {
      setError(`Has alcanzado el límite de ${MAX_FREE_DAILY} recetas por día. ¡Vuelve mañana!`);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/chef-virtual/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ingredients }),
      });

      const data = await response.json();

      if (data.success) {
        setRecipe(data.recipe);

        // Update daily count
        const newCount = currentCount + 1;
        setDailyCount(newCount);
        localStorage.setItem('chefVirtualCount', JSON.stringify({
          date: today,
          count: newCount
        }));

        // Scroll to recipe
        setTimeout(() => {
          document.getElementById('recipe-result')?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      } else {
        setError(data.error || 'Error al generar la receta');
      }
    } catch (err) {
      setError('Error de conexión. Por favor intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setRecipe(null);
    setError(null);
    // Scroll back to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const canGenerate = ingredients.length > 0 && !loading && dailyCount < MAX_FREE_DAILY;

  return (
    <div className="max-w-5xl mx-auto">
      {/* Input Section */}
      <div className="bg-white rounded-3xl shadow-xl border-2 border-gray-100 p-6 md:p-10 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* Encabezado animado */}
        <div className="mb-6">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
            <span className="text-3xl animate-bounce">👨‍🍳</span>
            ¿Qué ingredientes tienes?
          </h2>
          <p className="text-gray-600">
            Selecciona los ingredientes que tienes en casa y nuestra IA creará una receta única para ti
          </p>
        </div>

        <IngredientInput
          ingredients={ingredients}
          onIngredientsChange={setIngredients}
        />

        {error && (
          <div className="mt-6 p-4 bg-red-50 border-2 border-red-200 rounded-xl text-red-700 text-sm animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex items-center gap-2">
              <span className="text-xl">⚠️</span>
              <span>{error}</span>
            </div>
          </div>
        )}

        {/* Daily limit indicator */}
        <div className={`mt-6 p-4 rounded-2xl border-2 transition-all duration-300 ${
          dailyCount >= MAX_FREE_DAILY
            ? 'bg-amber-50 border-amber-300'
            : 'bg-gradient-to-r from-verde-aguacate/10 to-emerald-50 border-verde-aguacate/30'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{dailyCount >= MAX_FREE_DAILY ? '😅' : '✨'}</span>
              <div>
                <p className="font-bold text-verde-bosque">
                  Recetas generadas hoy: <span className="text-2xl">{dailyCount}</span> / {MAX_FREE_DAILY}
                </p>
                {dailyCount >= MAX_FREE_DAILY ? (
                  <p className="text-sm text-amber-700 mt-1">
                    ¡Has alcanzado el límite diario! Vuelve mañana para más recetas deliciosas 🌙
                  </p>
                ) : (
                  <p className="text-sm text-gray-600 mt-1">
                    Te quedan {MAX_FREE_DAILY - dailyCount} receta{MAX_FREE_DAILY - dailyCount !== 1 ? 's' : ''} disponibles hoy
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-3 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 rounded-full ${
                dailyCount >= MAX_FREE_DAILY
                  ? 'bg-amber-400'
                  : 'bg-gradient-to-r from-verde-aguacate to-verde-bosque'
              }`}
              style={{ width: `${(dailyCount / MAX_FREE_DAILY) * 100}%` }}
            />
          </div>
        </div>

        {/* Generate Button */}
        <div className="mt-8 flex flex-col sm:flex-row gap-4">
          <button
            onClick={generateRecipe}
            disabled={!canGenerate}
            className={`
              flex-1 flex items-center justify-center gap-3 px-8 py-5 rounded-2xl
              font-bold text-lg transition-all duration-300
              ${canGenerate
                ? 'bg-gradient-to-r from-verde-aguacate to-verde-bosque text-white shadow-lg hover:shadow-2xl transform hover:scale-105'
                : 'bg-gray-200 text-gray-500 cursor-not-allowed'
              }
            `}
          >
            {loading ? (
              <>
                <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Generando receta mágica...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-6 h-6" />
                <span>Generar Receta con IA</span>
              </>
            )}
          </button>

          {recipe && (
            <button
              onClick={resetForm}
              className="px-8 py-5 border-2 border-gray-300 text-gray-700 rounded-2xl hover:bg-gray-50 hover:border-gray-400 transition-all duration-300 font-bold text-lg flex items-center gap-3 hover:shadow-md"
            >
              <RotateCcw className="w-5 h-5" />
              Nueva receta
            </button>
          )}
        </div>

        {/* Info de límite */}
        {dailyCount < MAX_FREE_DAILY && ingredients.length > 0 && (
          <p className="mt-4 text-center text-sm text-gray-500 animate-in fade-in slide-in-from-bottom-2 duration-500">
            💡 Genera tu receta ahora - Es gratis y solo toma unos segundos
          </p>
        )}
      </div>

      {/* Recipe Result */}
      {recipe && (
        <div id="recipe-result" className="animate-in fade-in slide-in-from-bottom-8 duration-700">
          <RecipeDisplay recipe={recipe} ingredients={ingredients} />
        </div>
      )}
    </div>
  );
}
