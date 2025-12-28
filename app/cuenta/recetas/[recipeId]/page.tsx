'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Clock, Users, ChefHat, Heart } from 'lucide-react';
import Link from 'next/link';
import { getCurrentAccessToken } from '@/lib/auth-utils';
import type { GeneratedRecipe } from '@/lib/gemini-recipe-service';

interface RecipeWithId extends GeneratedRecipe {
  id: string;
  is_favorited: boolean;
  created_at: string;
}

export default function RecipeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const recipeId = params.recipeId as string;

  const [recipe, setRecipe] = useState<RecipeWithId | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFavoriting, setIsFavoriting] = useState(false);

  useEffect(() => {
    fetchRecipe();
  }, [recipeId]);

  async function fetchRecipe() {
    setLoading(true);
    try {
      const token = await getCurrentAccessToken();
      if (!token) {
        setError('No autorizado');
        setLoading(false);
        return;
      }

      // Obtener receta del usuario
      const response = await fetch('/api/user-recipes', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          const foundRecipe = data.data.find((r: RecipeWithId) => r.id === recipeId);
          if (foundRecipe) {
            // Parsear ingredients si es string
            let parsedRecipe = { ...foundRecipe };
            if (typeof foundRecipe.ingredients === 'string') {
              try {
                parsedRecipe.ingredients = JSON.parse(foundRecipe.ingredients);
              } catch (e) {
                console.error('Error parsing ingredients:', e);
              }
            }
            setRecipe(parsedRecipe);
          } else {
            setError('Receta no encontrada');
          }
        }
      } else {
        setError('Error al cargar la receta');
      }
    } catch (err) {
      console.error('Error fetching recipe:', err);
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  }

  async function handleToggleFavorite() {
    if (!recipe) return;

    setIsFavoriting(true);
    try {
      const token = await getCurrentAccessToken();
      if (!token) return;

      const response = await fetch(`/api/user-recipes/${recipeId}/favorite`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setRecipe(prev => prev ? { ...prev, is_favorited: data.data.isFavorited } : null);
        }
      }
    } catch (err) {
      console.error('Error toggling favorite:', err);
    } finally {
      setIsFavoriting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-green-50/30 to-emerald-50/20 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-verde-bosque mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando receta...</p>
        </div>
      </div>
    );
  }

  if (error || !recipe) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-green-50/30 to-emerald-50/20 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center max-w-md">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Receta no encontrada</h2>
          <p className="text-gray-600 mb-6">{error || 'No se pudo cargar la receta'}</p>
          <Link
            href="/cuenta?tab=mis-recetas"
            className="inline-block bg-verde-bosque hover:bg-verde-bosque/90 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
          >
            Volver a Mis Recetas
          </Link>
        </div>
      </div>
    );
  }

  const totalTime = recipe.prepTime + recipe.cookTime;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-green-50/30 to-emerald-50/20 pb-8">
      {/* Header fijo con navegación */}
      <div className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link
              href="/cuenta?tab=mis-recetas"
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ArrowLeft className="w-6 h-6 text-verde-bosque" />
            </Link>
            <h1 className="font-bold text-lg sm:text-xl text-gray-900 flex-1">
              Detalle de Receta
            </h1>
            <button
              onClick={handleToggleFavorite}
              disabled={isFavoriting}
              className={`p-2 rounded-full transition-colors ${
                recipe.is_favorited
                  ? 'bg-red-100 text-red-600'
                  : 'bg-gray-100 text-gray-600 hover:bg-red-50 hover:text-red-500'
              }`}
            >
              <Heart className={`w-6 h-6 ${recipe.is_favorited ? 'fill-current' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 max-w-4xl">
        {/* Header de la receta */}
        <div className="bg-gradient-to-br from-verde-bosque via-verde-aguacate to-emerald-600 text-white rounded-3xl p-6 sm:p-10 mb-6 shadow-xl">
          <div className="flex items-start gap-4 mb-6">
            <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4 shrink-0">
              <ChefHat className="w-10 h-10 sm:w-12 sm:h-12" />
            </div>
            <div className="flex-1">
              <h2 className="font-bold text-2xl sm:text-4xl mb-3 leading-tight">{recipe.title}</h2>
              <p className="text-white/90 text-base sm:text-lg">{recipe.description}</p>
            </div>
          </div>

          {/* Meta info */}
          <div className="flex flex-wrap gap-3 text-sm sm:text-base">
            <span className="flex items-center gap-2 bg-white/25 px-4 py-2 rounded-full font-medium">
              <Clock className="w-5 h-5" />
              {totalTime} minutos
            </span>
            <span className="flex items-center gap-2 bg-white/25 px-4 py-2 rounded-full font-medium">
              <Users className="w-5 h-5" />
              {recipe.servings} porciones
            </span>
            <span className="px-4 py-2 bg-white/25 rounded-full font-bold">
              {recipe.difficulty}
            </span>
            {recipe.category && (
              <span className="px-4 py-2 bg-white/25 rounded-full font-bold">
                {recipe.category}
              </span>
            )}
          </div>
        </div>

        {/* Ingredientes */}
        <div className="bg-white rounded-3xl shadow-lg p-6 sm:p-8 mb-6">
          <h3 className="font-bold text-2xl sm:text-3xl mb-6 flex items-center gap-3 text-verde-bosque">
            <span className="text-4xl">🥗</span>
            <span>Ingredientes</span>
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {recipe.ingredients.map((ing, index) => (
              <div
                key={index}
                className="flex items-start gap-4 p-4 bg-green-50 rounded-2xl border-2 border-green-100"
              >
                <span className="flex-shrink-0 w-10 h-10 bg-verde-aguacate text-white rounded-full flex items-center justify-center text-lg font-bold">
                  {index + 1}
                </span>
                <div className="flex-1">
                  <p className="font-bold text-lg text-gray-900">{ing.name}</p>
                  {(ing.quantity || ing.unit) && (
                    <p className="text-base text-gray-600 mt-1">
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
        <div className="bg-white rounded-3xl shadow-lg p-6 sm:p-8 mb-6">
          <h3 className="font-bold text-2xl sm:text-3xl mb-6 flex items-center gap-3 text-verde-bosque">
            <span className="text-4xl">👨‍🍳</span>
            <span>Instrucciones</span>
          </h3>
          <div className="space-y-6">
            {recipe.steps.map((step, index) => (
              <div
                key={index}
                className="flex gap-5 p-5 bg-gray-50 rounded-2xl border-2 border-gray-100"
              >
                <span className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-verde-aguacate to-verde-bosque text-white rounded-full flex items-center justify-center text-xl font-bold">
                  {index + 1}
                </span>
                <p className="flex-1 text-lg text-gray-700 leading-relaxed">{step}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Tips */}
        {recipe.tips && recipe.tips.length > 0 && (
          <div className="bg-amber-50 rounded-3xl p-6 sm:p-8 border-2 border-amber-200">
            <h3 className="font-bold text-2xl sm:text-3xl mb-6 flex items-center gap-3 text-amber-800">
              <span className="text-4xl">💡</span>
              <span>Tips del Chef</span>
            </h3>
            <ul className="space-y-4 text-lg text-amber-900">
              {recipe.tips.map((tip, index) => (
                <li key={index} className="flex gap-3 leading-relaxed">
                  <span className="flex-shrink-0 text-amber-600 text-2xl">•</span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
