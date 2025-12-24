'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Search,
  Loader2,
  Clock,
  Users,
  ChefHat,
  Play,
  Filter,
  Star
} from 'lucide-react';
import type { Recipe, RecipeCategory } from '@/lib/types/recipes';
import { categoryLabels, difficultyLabels, formatRecipeTime } from '@/lib/types/recipes';

export default function RecipesPage() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<RecipeCategory | ''>('');
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetchRecipes();
  }, [page, categoryFilter]);

  const fetchRecipes = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        per_page: '12'
      });

      if (categoryFilter) params.append('category', categoryFilter);
      if (search) params.append('search', search);

      const response = await fetch(`/api/recipes?${params}`);
      const data = await response.json();

      if (data.success) {
        setRecipes(data.recipes);
        setTotal(data.total);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchRecipes();
  };

  const filteredRecipes = recipes.filter(recipe =>
    recipe.title_es.toLowerCase().includes(search.toLowerCase()) ||
    recipe.title_en?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-crema">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-verde-bosque to-verde-aguacate text-white">
        <div className="max-w-7xl mx-auto px-4 py-16 lg:py-24">
          <div className="text-center">
            <h1 className="text-4xl lg:text-5xl font-bold mb-4">
              Recetas con Aguacate
            </h1>
            <p className="text-xl text-white/80 max-w-2xl mx-auto mb-8">
              Descubre deliciosas recetas preparadas con los mejores aguacates del Eje Cafetero.
              Videos paso a paso para que cocines como un chef.
            </p>

            {/* Search */}
            <form onSubmit={handleSearch} className="max-w-xl mx-auto">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar recetas..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 rounded-full text-gray-900 focus:outline-none focus:ring-4 focus:ring-dorado/50"
                />
              </div>
            </form>
          </div>
        </div>

        {/* Wave decoration */}
        <svg className="w-full h-12 text-crema" viewBox="0 0 1440 48" fill="currentColor" preserveAspectRatio="none">
          <path d="M0 48h1440V0c-624 52-816 52-1440 0v48z" />
        </svg>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-4 mb-8">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-600">Filtrar por:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => { setCategoryFilter(''); setPage(1); }}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                categoryFilter === ''
                  ? 'bg-verde-aguacate text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              Todas
            </button>
            {Object.entries(categoryLabels).filter(([key]) => key !== 'general').map(([value, label]) => (
              <button
                key={value}
                onClick={() => { setCategoryFilter(value as RecipeCategory); setPage(1); }}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  categoryFilter === value
                    ? 'bg-verde-aguacate text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Loading */}
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-8 h-8 animate-spin text-verde-aguacate" />
          </div>
        ) : filteredRecipes.length === 0 ? (
          <div className="text-center py-24">
            <ChefHat className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No hay recetas disponibles</h2>
            <p className="text-gray-500">Pronto agregaremos nuevas recetas deliciosas</p>
          </div>
        ) : (
          <>
            {/* Recipes Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredRecipes.map((recipe) => (
                <Link
                  key={recipe.id}
                  href={`/recetas/${recipe.slug}`}
                  className="group bg-white rounded-2xl shadow-sm overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
                >
                  {/* Thumbnail */}
                  <div className="relative aspect-video bg-gray-100 overflow-hidden">
                    {recipe.thumbnail_url ? (
                      <img
                        src={recipe.thumbnail_url}
                        alt={recipe.title_es}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-verde-bosque/20 to-verde-aguacate/20">
                        <ChefHat className="w-16 h-16 text-verde-aguacate/50" />
                      </div>
                    )}

                    {/* Play overlay */}
                    {recipe.video_url_vertical && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/30 transition-colors">
                        <div className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center transform scale-0 group-hover:scale-100 transition-transform">
                          <Play className="w-8 h-8 text-verde-aguacate ml-1" fill="currentColor" />
                        </div>
                      </div>
                    )}

                    {/* Featured badge */}
                    {recipe.featured && (
                      <div className="absolute top-3 left-3 flex items-center gap-1 bg-dorado text-white px-3 py-1 rounded-full text-xs font-medium">
                        <Star className="w-3 h-3" fill="currentColor" />
                        Destacada
                      </div>
                    )}

                    {/* Category badge */}
                    <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-medium text-verde-bosque">
                      {categoryLabels[recipe.category]}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-5">
                    <h3 className="font-bold text-lg text-gray-900 mb-2 group-hover:text-verde-aguacate transition-colors line-clamp-2">
                      {recipe.title_es}
                    </h3>

                    {recipe.description_es && (
                      <p className="text-gray-500 text-sm mb-4 line-clamp-2">
                        {recipe.description_es}
                      </p>
                    )}

                    {/* Meta */}
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-4 text-gray-500">
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {formatRecipeTime(recipe.total_time_minutes)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          {recipe.servings}
                        </span>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        recipe.difficulty === 'facil' ? 'bg-green-100 text-green-700' :
                        recipe.difficulty === 'medio' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {difficultyLabels[recipe.difficulty]}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* Pagination */}
            {total > 12 && (
              <div className="mt-12 flex items-center justify-center gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-6 py-3 bg-white rounded-full disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 font-medium"
                >
                  Anterior
                </button>
                <span className="px-6 py-3 text-gray-600">
                  Página {page} de {Math.ceil(total / 12)}
                </span>
                <button
                  onClick={() => setPage(p => p + 1)}
                  disabled={page >= Math.ceil(total / 12)}
                  className="px-6 py-3 bg-white rounded-full disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 font-medium"
                >
                  Siguiente
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
