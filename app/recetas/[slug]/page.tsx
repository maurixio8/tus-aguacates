'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Loader2,
  Clock,
  Users,
  ChefHat,
  Play,
  ShoppingCart,
  Share2,
  Instagram,
  Youtube,
  Check,
  ExternalLink
} from 'lucide-react';
import type { Recipe, RecipeIngredient, RecipeStep } from '@/lib/types/recipes';
import { categoryLabels, difficultyLabels, formatRecipeTime } from '@/lib/types/recipes';

export default function RecipeDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedIngredients, setSelectedIngredients] = useState<Set<string>>(new Set());
  const [showVideo, setShowVideo] = useState(false);
  const [locale, setLocale] = useState<'es' | 'en'>('es');

  useEffect(() => {
    fetchRecipe();
  }, [resolvedParams.slug]);

  const fetchRecipe = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/recipes/${resolvedParams.slug}`);
      const data = await response.json();

      if (data.success && data.recipe) {
        setRecipe(data.recipe);
        // Select all ingredients by default
        if (data.recipe.ingredients) {
          setSelectedIngredients(new Set(data.recipe.ingredients.map((ing: RecipeIngredient) => ing.id)));
        }
      } else {
        router.push('/recetas');
      }
    } catch (error) {
      console.error('Error:', error);
      router.push('/recetas');
    } finally {
      setLoading(false);
    }
  };

  const toggleIngredient = (id: string) => {
    const newSelected = new Set(selectedIngredients);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIngredients(newSelected);
  };

  const addToCart = () => {
    // TODO: Implement add to cart functionality
    alert('Funcionalidad próximamente: Agregar ingredientes al carrito');
  };

  const shareRecipe = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: recipe?.title_es,
          text: recipe?.description_es,
          url: window.location.href
        });
      } catch (err) {
        console.log('Share cancelled');
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      alert('Enlace copiado al portapapeles');
    }
  };

  const getLocalizedText = (esText?: string, enText?: string) => {
    if (locale === 'en' && enText) return enText;
    return esText || '';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-verde-aguacate" />
      </div>
    );
  }

  if (!recipe) {
    return null;
  }

  return (
    <div className="min-h-screen bg-crema">
      {/* Hero with Video */}
      <div className="relative bg-gradient-to-br from-verde-bosque to-verde-aguacate">
        {/* Back button */}
        <div className="absolute top-4 left-4 z-20">
          <Link
            href="/recetas"
            className="flex items-center gap-2 text-white/90 hover:text-white bg-black/20 backdrop-blur-sm px-4 py-2 rounded-full transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver a recetas
          </Link>
        </div>

        {/* Language toggle */}
        <div className="absolute top-4 right-4 z-20">
          <div className="flex bg-black/20 backdrop-blur-sm rounded-full p-1">
            <button
              onClick={() => setLocale('es')}
              className={`px-3 py-1 rounded-full text-sm transition-colors ${
                locale === 'es' ? 'bg-white text-verde-bosque' : 'text-white/80 hover:text-white'
              }`}
            >
              ES
            </button>
            <button
              onClick={() => setLocale('en')}
              className={`px-3 py-1 rounded-full text-sm transition-colors ${
                locale === 'en' ? 'bg-white text-verde-bosque' : 'text-white/80 hover:text-white'
              }`}
            >
              EN
            </button>
          </div>
        </div>

        {/* Video/Thumbnail */}
        <div className="max-w-4xl mx-auto px-4 pt-20 pb-8">
          <div className="relative aspect-video rounded-2xl overflow-hidden shadow-2xl bg-black">
            {showVideo && recipe.video_url_horizontal ? (
              <video
                src={recipe.video_url_horizontal}
                controls
                autoPlay
                className="w-full h-full object-contain"
              />
            ) : (
              <>
                {recipe.thumbnail_url ? (
                  <img
                    src={recipe.thumbnail_url}
                    alt={recipe.title_es}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-verde-bosque/50">
                    <ChefHat className="w-24 h-24 text-white/50" />
                  </div>
                )}

                {/* Play button */}
                {recipe.video_url_horizontal && (
                  <button
                    onClick={() => setShowVideo(true)}
                    className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/40 transition-colors group"
                  >
                    <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center transform group-hover:scale-110 transition-transform shadow-lg">
                      <Play className="w-10 h-10 text-verde-aguacate ml-1" fill="currentColor" />
                    </div>
                  </button>
                )}
              </>
            )}
          </div>

          {/* Social links */}
          {(recipe.instagram_url || recipe.youtube_url || recipe.tiktok_url) && (
            <div className="flex items-center justify-center gap-3 mt-6">
              <span className="text-white/70 text-sm">Ver en:</span>
              {recipe.instagram_url && (
                <a
                  href={recipe.instagram_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-full hover:bg-white/30 transition-colors"
                >
                  <Instagram className="w-4 h-4" />
                  Instagram
                </a>
              )}
              {recipe.youtube_url && (
                <a
                  href={recipe.youtube_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-full hover:bg-white/30 transition-colors"
                >
                  <Youtube className="w-4 h-4" />
                  YouTube
                </a>
              )}
              {recipe.tiktok_url && (
                <a
                  href={recipe.tiktok_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-full hover:bg-white/30 transition-colors"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z" />
                  </svg>
                  TikTok
                </a>
              )}
            </div>
          )}
        </div>

        {/* Wave */}
        <svg className="w-full h-12 text-crema" viewBox="0 0 1440 48" fill="currentColor" preserveAspectRatio="none">
          <path d="M0 48h1440V0c-624 52-816 52-1440 0v48z" />
        </svg>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Title and meta */}
            <div>
              <div className="flex items-center gap-3 mb-3">
                <span className="px-3 py-1 bg-verde-aguacate/10 text-verde-aguacate rounded-full text-sm font-medium">
                  {categoryLabels[recipe.category]}
                </span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  recipe.difficulty === 'facil' ? 'bg-green-100 text-green-700' :
                  recipe.difficulty === 'medio' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  {difficultyLabels[recipe.difficulty]}
                </span>
              </div>

              <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
                {getLocalizedText(recipe.title_es, recipe.title_en)}
              </h1>

              {recipe.description_es && (
                <p className="text-lg text-gray-600">
                  {getLocalizedText(recipe.description_es, recipe.description_en)}
                </p>
              )}

              {/* Quick stats */}
              <div className="flex flex-wrap items-center gap-6 mt-6 text-gray-600">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-verde-aguacate" />
                  <span>
                    <strong>{formatRecipeTime(recipe.total_time_minutes)}</strong>
                    <span className="text-sm text-gray-400 ml-1">{locale === 'es' ? 'total' : 'total'}</span>
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-verde-aguacate" />
                  <span>
                    <strong>{recipe.servings}</strong>
                    <span className="text-sm text-gray-400 ml-1">{locale === 'es' ? 'porciones' : 'servings'}</span>
                  </span>
                </div>
                <button
                  onClick={shareRecipe}
                  className="flex items-center gap-2 text-verde-aguacate hover:underline"
                >
                  <Share2 className="w-5 h-5" />
                  {locale === 'es' ? 'Compartir' : 'Share'}
                </button>
              </div>
            </div>

            {/* Steps */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                {locale === 'es' ? 'Preparación' : 'Instructions'}
              </h2>

              <div className="space-y-6">
                {recipe.steps?.map((step: RecipeStep, index: number) => (
                  <div key={step.id} className="flex gap-4">
                    <div className="flex-shrink-0 w-10 h-10 bg-verde-aguacate text-white rounded-full flex items-center justify-center font-bold">
                      {index + 1}
                    </div>
                    <div className="flex-1 pt-1">
                      <p className="text-gray-700 leading-relaxed">
                        {getLocalizedText(step.instruction_es, step.instruction_en)}
                      </p>
                      {step.image_url && (
                        <img
                          src={step.image_url}
                          alt={`Paso ${index + 1}`}
                          className="mt-4 rounded-lg max-w-sm"
                        />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar - Ingredients */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-sm p-6 sticky top-4">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                {locale === 'es' ? 'Ingredientes' : 'Ingredients'}
              </h2>

              <div className="space-y-3 mb-6">
                {recipe.ingredients?.map((ing: RecipeIngredient) => (
                  <label
                    key={ing.id}
                    className="flex items-start gap-3 cursor-pointer group"
                  >
                    <div className="flex-shrink-0 mt-0.5">
                      <div
                        onClick={() => toggleIngredient(ing.id)}
                        className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                          selectedIngredients.has(ing.id)
                            ? 'bg-verde-aguacate border-verde-aguacate'
                            : 'border-gray-300 group-hover:border-verde-aguacate'
                        }`}
                      >
                        {selectedIngredients.has(ing.id) && (
                          <Check className="w-3 h-3 text-white" />
                        )}
                      </div>
                    </div>
                    <div className={`flex-1 ${selectedIngredients.has(ing.id) ? '' : 'text-gray-400 line-through'}`}>
                      <span className="font-medium">
                        {ing.quantity} {getLocalizedText(ing.unit_es, ing.unit_en)}
                      </span>{' '}
                      <span className="text-gray-600">
                        {getLocalizedText(ing.name_es, ing.name_en)}
                      </span>
                      {ing.is_optional && (
                        <span className="text-xs text-gray-400 ml-1">
                          ({locale === 'es' ? 'opcional' : 'optional'})
                        </span>
                      )}
                      {ing.notes_es && (
                        <span className="block text-sm text-gray-400">
                          {getLocalizedText(ing.notes_es, ing.notes_en)}
                        </span>
                      )}
                    </div>
                  </label>
                ))}
              </div>

              {/* Add to cart button */}
              <button
                onClick={addToCart}
                disabled={selectedIngredients.size === 0}
                className="w-full flex items-center justify-center gap-2 bg-verde-aguacate text-white py-3 rounded-xl font-semibold hover:bg-verde-bosque transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ShoppingCart className="w-5 h-5" />
                {locale === 'es' ? 'Agregar al carrito' : 'Add to cart'}
              </button>

              <p className="text-xs text-gray-400 text-center mt-3">
                {selectedIngredients.size} {locale === 'es' ? 'ingredientes seleccionados' : 'ingredients selected'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-verde-bosque to-verde-aguacate py-12 mt-12">
        <div className="max-w-4xl mx-auto px-4 text-center text-white">
          <h2 className="text-2xl lg:text-3xl font-bold mb-4">
            {locale === 'es' ? '¿Te gustó esta receta?' : 'Did you like this recipe?'}
          </h2>
          <p className="text-white/80 mb-6">
            {locale === 'es'
              ? 'Pide los ingredientes frescos directamente del Eje Cafetero'
              : 'Order fresh ingredients directly from the Eje Cafetero'}
          </p>
          <Link
            href="/productos"
            className="inline-flex items-center gap-2 bg-white text-verde-bosque px-8 py-3 rounded-full font-semibold hover:bg-crema transition-colors"
          >
            {locale === 'es' ? 'Ver productos' : 'View products'}
            <ExternalLink className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
