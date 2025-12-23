'use client';

import { useState, useEffect } from 'react';
import { Sparkles } from 'lucide-react';
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
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Input Section */}
      <div className="bg-white rounded-2xl shadow-sm p-6 md:p-8 mb-6">
        <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-4">
          ¿Qué ingredientes tienes?
        </h2>

        <IngredientInput
          ingredients={ingredients}
          onIngredientsChange={setIngredients}
        />

        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Daily limit indicator */}
        <div className="mt-4 p-3 bg-verde-aguacate/10 border border-verde-aguacate/20 rounded-lg">
          <p className="text-sm text-verde-bosque">
            Recetas generadas hoy: <span className="font-bold">{dailyCount}</span> / {MAX_FREE_DAILY}
          </p>
          {dailyCount >= MAX_FREE_DAILY && (
            <p className="text-xs text-verde-bosque/70 mt-1">
              Has alcanzado el límite diario. ¡Vuelve mañana para más recetas!
            </p>
          )}
        </div>

        {/* Generate Button */}
        <div className="mt-6 flex flex-col sm:flex-row gap-4">
          <button
            onClick={generateRecipe}
            disabled={ingredients.length === 0 || loading || dailyCount >= MAX_FREE_DAILY}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-verde-aguacate text-white rounded-xl hover:bg-verde-bosque transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium text-lg"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Generando receta...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                Generar Receta
              </>
            )}
          </button>

          {recipe && (
            <button
              onClick={resetForm}
              className="px-6 py-4 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium text-lg"
            >
              Nueva receta
            </button>
          )}
        </div>
      </div>

      {/* Recipe Result */}
      {recipe && (
        <div id="recipe-result" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <RecipeDisplay recipe={recipe} ingredients={ingredients} />
        </div>
      )}
    </div>
  );
}
