import { Metadata } from 'next';
import { ChefHat, Sparkles } from 'lucide-react';
import { IngredientInput, RecipeDisplay } from '@/components/chef-virtual';
import type { GeneratedRecipe } from '@/lib/gemini-recipe-service';
import { isChefVirtualAvailable } from '@/lib/gemini-recipe-service';

export const metadata: Metadata = {
  title: 'Chef Virtual | Tus Aguacates',
  description: 'El Chef Virtual genera recetas personalizadas basadas en los ingredientes que tienes en casa. ¡Dile qué ingredientes tienes y obtén una receta única!',
  openGraph: {
    title: 'Chef Virtual | Tus Aguacates',
    description: 'Genera recetas personalizadas con IA usando los ingredientes que tienes en casa.',
    type: 'website',
  },
};

export default async function ChefVirtualPage() {
  const isAvailable = isChefVirtualAvailable();

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-verde-bosque via-verde-aguacate to-emerald-600 text-white py-12 md:py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <ChefHat className="w-12 h-12 md:w-16 md:h-16" />
              <h1 className="text-3xl md:text-5xl font-bold">Chef Virtual</h1>
            </div>
            <p className="text-lg md:text-xl text-white/90 mb-4">
              Tu chef personal con IA. Dile qué ingredientes tienes y generará una receta única para ti.
            </p>
            <div className="flex items-center justify-center gap-2 text-sm md:text-base text-white/80">
              <Sparkles className="w-5 h-5" />
              <span>Powered by Google Gemini AI</span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-8 md:py-12">
        <div className="container mx-auto px-4">
          {!isAvailable ? (
            <div className="max-w-md mx-auto bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-center">
              <ChefHat className="w-12 h-12 text-yellow-600 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-yellow-900 mb-2">
                Chef Virtual no disponible
              </h2>
              <p className="text-yellow-800">
                El servicio de Chef Virtual no está configurado. Por favor contacta al administrador.
              </p>
            </div>
          ) : (
            <ChefVirtualGenerator />
          )}
        </div>
      </section>

      {/* How it works */}
      <section className="py-12 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-center text-gray-900 mb-8">
            ¿Cómo funciona?
          </h2>
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="w-16 h-16 bg-verde-aguacate/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">🥑</span>
              </div>
              <h3 className="font-bold text-gray-900 mb-2">1. Ingresa tus ingredientes</h3>
              <p className="text-gray-600 text-sm">
                Escribe o selecciona los ingredientes que tienes en casa
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-verde-aguacate/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">✨</span>
              </div>
              <h3 className="font-bold text-gray-900 mb-2">2. La IA crea tu receta</h3>
              <p className="text-gray-600 text-sm">
                Nuestro Chef Virtual genera una receta personalizada al instante
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-verde-aguacate/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">🍽️</span>
              </div>
              <h3 className="font-bold text-gray-900 mb-2">3. ¡A cocinar!</h3>
              <p className="text-gray-600 text-sm">
                Sigue los pasos y disfruta tu receta única
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

// Client component for the generator
function ChefVirtualGenerator() {
  return (
    <ChefVirtualGeneratorClient />
  );
}

// This would be a separate client component file in a real Next.js setup
// For simplicity, we're including it inline here
import { useState } from 'react';

function ChefVirtualGeneratorClient() {
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [recipe, setRecipe] = useState<GeneratedRecipe | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dailyCount, setDailyCount] = useState(0);

  const MAX_FREE_DAILY = 2;

  // Load daily count from localStorage
  useState(() => {
    const today = new Date().toDateString();
    const saved = localStorage.getItem('chefVirtualCount');
    if (saved) {
      const { date, count } = JSON.parse(saved);
      if (date === today) {
        setDailyCount(count);
      } else {
        localStorage.setItem('chefVirtualCount', JSON.stringify({ date: today, count: 0 }));
      }
    }
  });

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
      const { date, count } = JSON.parse(saved);
      if (date === today) {
        currentCount = count;
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
