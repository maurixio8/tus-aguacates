'use client';

import { useState, useEffect } from 'react';
import { ChefHat, Clock, Sparkles, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { RecipeCard } from './RecipeCard';
import type { GeneratedRecipe } from '@/lib/gemini-recipe-service';
import { getCurrentAccessToken } from '@/lib/auth-utils';

interface RecipeWithId extends GeneratedRecipe {
  id: string;
  is_favorited: boolean;
  created_at: string;
}

type FilterType = 'all' | 'favorites' | 'recent';

interface DailyLimits {
  recipesLimit: number;
  recipesGeneratedToday: number;
  remainingToday: number;
  userTier: string;
  canSave: boolean;
  isLoggedIn: boolean;
}

export function MyRecipesTab() {
  const [recipes, setRecipes] = useState<RecipeWithId[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [limits, setLimits] = useState<DailyLimits | null>(null);

  // Fetch recetas y límites
  useEffect(() => {
    fetchRecipes();
    fetchLimits();
  }, [activeFilter]);

  const fetchRecipes = async () => {
    setLoading(true);
    try {
      const token = await getCurrentAccessToken();
      if (!token) {
        console.error('[MyRecipesTab] No token available');
        setLoading(false);
        return;
      }

      console.log('[MyRecipesTab] Fetching recipes with filter:', activeFilter);
      const response = await fetch(`/api/user-recipes?filter=${activeFilter}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          console.log('[MyRecipesTab] Recipes loaded:', data.data?.length || 0);
          setRecipes(data.data);
        } else {
          console.error('[MyRecipesTab] API returned success=false:', data.error);
        }
      } else {
        console.error('[MyRecipesTab] API error:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('[MyRecipesTab] Error fetching recipes:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLimits = async () => {
    try {
      const token = await getCurrentAccessToken();
      if (!token) {
        console.error('[MyRecipesTab] No token available for limits');
        return;
      }

      const response = await fetch('/api/chef-virtual/limits', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setLimits(data);
      }
    } catch (error) {
      console.error('[MyRecipesTab] Error fetching limits:', error);
    }
  };

  const handleToggleFavorite = async (recipeId: string) => {
    try {
      const token = await getCurrentAccessToken();
      if (!token) {
        console.error('[MyRecipesTab] No token available for favorite toggle');
        return;
      }

      const response = await fetch(`/api/user-recipes/${recipeId}/favorite`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // Actualizar localmente para evitar refetch
          setRecipes(prev =>
            prev.map(r =>
              r.id === recipeId
                ? { ...r, is_favorited: data.data.isFavorited }
                : r
            )
          );
        }
      }
    } catch (error) {
      console.error('[MyRecipesTab] Error toggling favorite:', error);
    }
  };

  const filters: { key: FilterType; label: string; icon: React.ElementType }[] = [
    { key: 'all', label: 'Todas', icon: Clock },
    { key: 'favorites', label: 'Favoritas', icon: Sparkles },
    { key: 'recent', label: 'Recientes', icon: Clock },
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Límite diario - Card con gradiente */}
      {limits && (
        <div className="bg-gradient-to-br from-verde-bosque via-verde-aguacate to-emerald-600 rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-6 text-white relative overflow-hidden">
          {/* Decoración de fondo */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-40 h-40 bg-white rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-yellow-300 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
          </div>

          <div className="relative z-10 flex items-center justify-between gap-2 sm:gap-3">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="bg-white/20 backdrop-blur-sm rounded-lg sm:rounded-xl p-2 sm:p-3">
                <ChefHat className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8" />
              </div>
              <div>
                <p className="text-white/80 text-[10px] sm:text-xs md:text-sm">Límite diario</p>
                <p className="text-xl sm:text-2xl md:text-3xl font-bold">
                  {limits.recipesGeneratedToday}/{limits.recipesLimit}
                </p>
              </div>
            </div>

            {limits.remainingToday > 0 ? (
              <Link
                href="/chef-virtual"
                className="hidden sm:flex items-center gap-2 bg-white text-verde-bosque px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg sm:rounded-xl font-semibold hover:bg-white/90 transition-all text-xs sm:text-sm"
              >
                Generar
                <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4" />
              </Link>
            ) : (
              <span className="hidden sm:block bg-white/20 backdrop-blur-sm px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg font-medium text-xs">
                Límite alcanzado
              </span>
            )}
          </div>

          {/* Mobile CTA */}
          {limits.remainingToday > 0 && (
            <Link
              href="/chef-virtual"
              className="sm:hidden mt-3 flex items-center justify-center gap-2 bg-white text-verde-bosque px-3 py-2 rounded-xl font-semibold text-sm"
            >
              <ChefHat className="w-4 h-4" />
              Generar receta
            </Link>
          )}
        </div>
      )}

      {/* Filtros */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {filters.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveFilter(key)}
            className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl font-medium transition-all whitespace-nowrap text-sm ${
              activeFilter === key
                ? 'bg-gradient-to-r from-verde-aguacate to-verde-bosque text-white shadow-lg'
                : 'bg-white/70 backdrop-blur-sm text-gray-700 hover:bg-verde-aguacate/10 border border-verde-aguacate/20'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Grid de recetas */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-gray-100 rounded-xl sm:rounded-2xl h-64 sm:h-80 animate-pulse"
            />
          ))}
        </div>
      ) : recipes.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {recipes.map((recipe) => (
            <div
              key={recipe.id}
              className="animate-in fade-in slide-in-from-bottom-4"
              style={{ animationDelay: `${recipes.indexOf(recipe) * 50}ms` }}
            >
              <RecipeCard
                recipe={recipe}
                onToggleFavorite={handleToggleFavorite}
              />
            </div>
          ))}
        </div>
      ) : (
        /* Empty state */
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl border-2 border-verde-aguacate/20 p-6 sm:p-8 md:p-12 text-center">
          <div className="text-5xl sm:text-6xl md:text-8xl mb-3 sm:mb-4">👨‍🍳</div>
          <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800 mb-2">
            Aún no tienes recetas
          </h3>
          <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6 max-w-md mx-auto">
            {activeFilter === 'favorites'
              ? 'Marca algunas recetas como favoritas para verlas aquí.'
              : 'Genera tu primera receta con nuestro Chef Virtual impulsado por IA.'}
          </p>

          {activeFilter !== 'favorites' && (
            <Link
              href="/chef-virtual"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-verde-aguacate to-verde-bosque text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl font-semibold hover:shadow-lg hover:scale-105 transition-all text-sm sm:text-base"
            >
              <ChefHat className="w-4 h-4 sm:w-5 sm:h-5" />
              Crear mi primera receta
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
