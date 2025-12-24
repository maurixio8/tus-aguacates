'use client';

import { useEffect, useState } from 'react';
import {
  Plus,
  Edit,
  Trash2,
  Search,
  Eye,
  Loader2,
  Video,
  Clock,
  Users,
  ChefHat,
  Play,
  Filter,
  MoreVertical,
  Star,
  StarOff,
  ExternalLink,
  Instagram,
  Youtube
} from 'lucide-react';
import type { Recipe, VideoStatus, RecipeCategory } from '@/lib/types/recipes';
import { statusLabels, categoryLabels, difficultyLabels, formatRecipeTime } from '@/lib/types/recipes';

// Status badge colors
const statusColors: Record<VideoStatus, string> = {
  draft: 'bg-gray-100 text-gray-800',
  generating_images: 'bg-yellow-100 text-yellow-800',
  generating_video: 'bg-blue-100 text-blue-800',
  ready: 'bg-green-100 text-green-800',
  published: 'bg-verde-aguacate/20 text-verde-bosque'
};

export default function RecipesAdminPage() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<VideoStatus | ''>('');
  const [categoryFilter, setCategoryFilter] = useState<RecipeCategory | ''>('');
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetchRecipes();
  }, [page, statusFilter, categoryFilter]);

  const fetchRecipes = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        per_page: '20'
      });

      if (statusFilter) params.append('status', statusFilter);
      if (categoryFilter) params.append('category', categoryFilter);
      if (search) params.append('search', search);

      const response = await fetch(`/api/admin/recipes?${params}`, {
        credentials: 'include'
      });
      const data = await response.json();

      if (data.success) {
        setRecipes(data.recipes);
        setTotal(data.total);
      } else {
        console.error('Error fetching recipes:', data.error);
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

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`¿Estás seguro de eliminar la receta "${title}"?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/recipes?id=${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      const data = await response.json();

      if (data.success) {
        fetchRecipes();
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error al eliminar receta');
    }
  };

  const toggleFeatured = async (recipe: Recipe) => {
    try {
      const response = await fetch('/api/admin/recipes', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          id: recipe.id,
          featured: !recipe.featured
        })
      });

      const data = await response.json();

      if (data.success) {
        fetchRecipes();
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const filteredRecipes = recipes.filter(recipe =>
    recipe.title_es.toLowerCase().includes(search.toLowerCase()) ||
    recipe.title_en?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading && recipes.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-verde-aguacate" />
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
          <Video className="w-8 h-8 text-verde-aguacate" />
          Recetas y Videos
        </h1>
        <p className="text-gray-600 text-sm lg:text-base">
          Crea y gestiona recetas con videos generados por IA para redes sociales
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Recetas</p>
              <p className="text-2xl font-bold text-gray-900">{total}</p>
            </div>
            <ChefHat className="w-8 h-8 text-verde-aguacate opacity-50" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Publicadas</p>
              <p className="text-2xl font-bold text-green-600">
                {recipes.filter(r => r.video_status === 'published').length}
              </p>
            </div>
            <Eye className="w-8 h-8 text-green-500 opacity-50" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">En Proceso</p>
              <p className="text-2xl font-bold text-yellow-600">
                {recipes.filter(r => r.video_status === 'generating_images' || r.video_status === 'generating_video').length}
              </p>
            </div>
            <Loader2 className="w-8 h-8 text-yellow-500 opacity-50" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Destacadas</p>
              <p className="text-2xl font-bold text-dorado">
                {recipes.filter(r => r.featured).length}
              </p>
            </div>
            <Star className="w-8 h-8 text-dorado opacity-50" />
          </div>
        </div>
      </div>

      {/* Actions Bar */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Search */}
          <form onSubmit={handleSearch} className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar receta..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-verde-aguacate"
            />
          </form>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value as VideoStatus | '');
                  setPage(1);
                }}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-verde-aguacate text-sm"
              >
                <option value="">Todos los estados</option>
                {Object.entries(statusLabels).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>

            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value as RecipeCategory | '');
                setPage(1);
              }}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-verde-aguacate text-sm"
            >
              <option value="">Todas las categorías</option>
              {Object.entries(categoryLabels).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>

            {/* Create Button */}
            <a
              href="/admin/recetas/nueva"
              className="flex items-center gap-2 bg-verde-aguacate text-white px-4 py-2 rounded-lg hover:bg-verde-bosque transition-colors"
            >
              <Plus className="w-5 h-5" />
              Nueva Receta
            </a>
          </div>
        </div>
      </div>

      {/* Recipes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredRecipes.length === 0 ? (
          <div className="col-span-full bg-white rounded-lg shadow-sm p-12 text-center">
            <ChefHat className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No hay recetas</h3>
            <p className="text-gray-500 mb-4">Crea tu primera receta para empezar a generar videos</p>
            <a
              href="/admin/recetas/nueva"
              className="inline-flex items-center gap-2 bg-verde-aguacate text-white px-4 py-2 rounded-lg hover:bg-verde-bosque transition-colors"
            >
              <Plus className="w-5 h-5" />
              Crear Receta
            </a>
          </div>
        ) : (
          filteredRecipes.map((recipe) => (
            <div
              key={recipe.id}
              className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow"
            >
              {/* Thumbnail */}
              <div className="relative aspect-video bg-gray-100">
                {recipe.thumbnail_url ? (
                  <img
                    src={recipe.thumbnail_url}
                    alt={recipe.title_es}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Video className="w-12 h-12 text-gray-300" />
                  </div>
                )}

                {/* Play button overlay if video exists */}
                {recipe.video_url_vertical && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 hover:opacity-100 transition-opacity">
                    <Play className="w-12 h-12 text-white" fill="white" />
                  </div>
                )}

                {/* Status badge */}
                <div className="absolute top-2 left-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[recipe.video_status]}`}>
                    {statusLabels[recipe.video_status]}
                  </span>
                </div>

                {/* Featured star */}
                <button
                  onClick={() => toggleFeatured(recipe)}
                  className="absolute top-2 right-2 p-1.5 bg-white/90 rounded-full hover:bg-white transition-colors"
                >
                  {recipe.featured ? (
                    <Star className="w-4 h-4 text-dorado" fill="currentColor" />
                  ) : (
                    <StarOff className="w-4 h-4 text-gray-400" />
                  )}
                </button>
              </div>

              {/* Content */}
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 mb-1 line-clamp-1">
                  {recipe.title_es}
                </h3>
                {recipe.title_en && (
                  <p className="text-sm text-gray-500 mb-2 line-clamp-1">
                    {recipe.title_en}
                  </p>
                )}

                {/* Meta info */}
                <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {formatRecipeTime(recipe.total_time_minutes)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5" />
                    {recipe.servings} porciones
                  </span>
                  <span className="px-2 py-0.5 bg-gray-100 rounded-full">
                    {difficultyLabels[recipe.difficulty]}
                  </span>
                </div>

                {/* Category */}
                <div className="text-xs text-verde-aguacate font-medium mb-3">
                  {categoryLabels[recipe.category]}
                </div>

                {/* Social Links */}
                {recipe.video_status === 'published' && (
                  <div className="flex items-center gap-2 mb-3">
                    {recipe.instagram_url && (
                      <a
                        href={recipe.instagram_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:opacity-80"
                      >
                        <Instagram className="w-4 h-4" />
                      </a>
                    )}
                    {recipe.youtube_url && (
                      <a
                        href={recipe.youtube_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 bg-red-600 text-white rounded-lg hover:opacity-80"
                      >
                        <Youtube className="w-4 h-4" />
                      </a>
                    )}
                    {recipe.tiktok_url && (
                      <a
                        href={recipe.tiktok_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 bg-black text-white rounded-lg hover:opacity-80"
                      >
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z" />
                        </svg>
                      </a>
                    )}
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center justify-between pt-3 border-t">
                  <div className="flex items-center gap-1">
                    <a
                      href={`/admin/recetas/${recipe.id}`}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Editar"
                    >
                      <Edit className="w-4 h-4" />
                    </a>
                    {recipe.video_status === 'published' && (
                      <a
                        href={`/recetas/${recipe.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                        title="Ver en sitio"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                    <button
                      onClick={() => handleDelete(recipe.id, recipe.title_es)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Eliminar"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* View count */}
                  <span className="text-xs text-gray-400">
                    {recipe.view_count} vistas
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {total > 20 && (
        <div className="mt-6 flex items-center justify-center gap-2">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Anterior
          </button>
          <span className="px-4 py-2 text-sm text-gray-600">
            Página {page} de {Math.ceil(total / 20)}
          </span>
          <button
            onClick={() => setPage(p => p + 1)}
            disabled={page >= Math.ceil(total / 20)}
            className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Siguiente
          </button>
        </div>
      )}

      {/* Summary */}
      <div className="mt-4 text-sm text-gray-600 text-center">
        Mostrando {filteredRecipes.length} de {total} recetas
      </div>
    </div>
  );
}
