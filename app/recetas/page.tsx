import { Metadata } from 'next';
import { Suspense } from 'react';
import { recipes, recipeCategories, getRecipesByCategory, getFeaturedRecipes, type RecipeCategory } from '@/data/recipes';
import { RecipeCard, RecipeCategoryCard } from '@/components/recipes';
import { Search } from 'lucide-react';
import { getRecipeCategoryBySlug } from '@/lib/recipe-categories';

export const metadata: Metadata = {
  title: 'Recetas Saludables | Tus Aguacates',
  description: 'Descubre recetas deliciosas y saludables con aguacate y frutas tropicales frescas. Desde guacamole hasta smoothies energizantes.',
  openGraph: {
    title: 'Recetas Saludables | Tus Aguacates',
    description: 'Descubre recetas deliciosas y saludables con aguacate y frutas tropicales frescas.',
    type: 'website',
  },
};

interface RecetasPageProps {
  searchParams: Promise<{ categoria?: string; buscar?: string }>;
}

export default async function RecetasPage({ searchParams }: RecetasPageProps) {
  const params = await searchParams;
  const selectedCategory = params.categoria as RecipeCategory | undefined;
  const searchQuery = params.buscar?.toLowerCase();

  // Obtener datos de la categoría desde BD si hay una seleccionada
  const categoryData = selectedCategory
    ? await getRecipeCategoryBySlug(selectedCategory)
    : null;

  // Filtrar recetas
  let filteredRecipes = selectedCategory
    ? getRecipesByCategory(selectedCategory)
    : recipes;

  if (searchQuery) {
    filteredRecipes = filteredRecipes.filter(recipe =>
      recipe.title.toLowerCase().includes(searchQuery) ||
      recipe.description.toLowerCase().includes(searchQuery) ||
      recipe.tags.some(tag => tag.toLowerCase().includes(searchQuery))
    );
  }

  const featuredRecipes = getFeaturedRecipes();

  // Obtener nombre de la categoría para el título
  const categoryName = selectedCategory
    ? (categoryData?.name || recipeCategories.find(c => c.slug === selectedCategory)?.name || selectedCategory)
    : null;

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 via-green-50/30 to-emerald-50/20">
      {/* Hero Section con animaciones */}
      <section className="relative bg-gradient-to-br from-verde-bosque via-verde-aguacate to-emerald-600 text-white py-16 md:py-24 overflow-hidden">
        {/* Decoración de fondo animada - Burbujas */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-10 left-10 w-32 h-32 bg-yellow-300 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-10 right-10 w-48 h-48 bg-green-300 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-white rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
        </div>

        {/* Imagen de fondo si existe */}
        {categoryData?.image_url && (
          <div className="absolute inset-0 z-0">
            <img
              src={categoryData.image_url}
              alt={categoryData.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-br from-verde-bosque/85 to-verde-aguacate/85"></div>
          </div>
        )}

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 animate-bounce drop-shadow-lg">
              {categoryName ? `Recetas de ${categoryName}` : 'Recetas Saludables'}
            </h1>
            <p className="text-xl text-white/90 mb-8">
              {categoryData?.description || 'Descubre cómo preparar platos deliciosos con los productos más frescos. Recetas fáciles, nutritivas y llenas de sabor.'}
            </p>

            {/* Barra de búsqueda */}
            <form action="/recetas" method="GET" className="max-w-xl mx-auto mb-4">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  name="buscar"
                  placeholder="Buscar recetas..."
                  defaultValue={searchQuery}
                  className="w-full pl-12 pr-4 py-4 rounded-full text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-4 focus:ring-white/30 bg-white/95 backdrop-blur-sm"
                />
              </div>
            </form>

            {/* Chef Virtual CTA */}
            <a
              href="/chef-virtual"
              className="inline-flex items-center gap-2 px-6 py-3 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white rounded-full font-medium transition-all border-2 border-white/30 hover:scale-105 shadow-xl"
            >
              🧑‍🍳 Chef Virtual
            </a>
          </div>
        </div>

        {/* Wave SVG divider */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
            <path d="M0 120L60 105C120 90 240 60 360 45C480 30 600 30 720 37.5C840 45 960 60 1080 67.5C1200 75 1320 75 1380 75L1440 75V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="url(#gradient0)"/>
            <defs>
              <linearGradient id="gradient0" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="rgba(249,250,251,0)" />
                <stop offset="100%" stopColor="#f9fafb" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      </section>

      {/* Categorías */}
      <section className="py-10 bg-white relative overflow-hidden">
        {/* Decoración de fondo sutil */}
        <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none">
          <div className="absolute top-20 left-20 w-40 h-40 bg-verde-aguacate rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-20 w-60 h-60 bg-naranja-frutal rounded-full blur-3xl"></div>
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 animate-in fade-in slide-in-from-bottom-4">Explora por Categoría</h2>

          {/* Carrusel horizontal con snap-scroll */}
          <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-4 px-1 scrollbar-hide">
            {recipeCategories.map(category => {
              const count = getRecipesByCategory(category.slug).length;
              return (
                <div key={category.slug} className="snap-start">
                  <RecipeCategoryCard
                    category={category}
                    recipeCount={count}
                  />
                </div>
              );
            })}
          </div>

          {/* Indicador de scroll */}
          <p className="text-gray-500 text-sm mt-2 text-center md:hidden">
            Desliza para ver más categorías →
          </p>
        </div>
      </section>

      {/* Recetas Destacadas (solo si no hay filtro) */}
      {!selectedCategory && !searchQuery && featuredRecipes.length > 0 && (
        <section className="py-12 relative overflow-hidden">
          {/* Decoración de fondo sutil */}
          <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none">
            <div className="absolute top-10 right-10 w-32 h-32 bg-verde-aguacate rounded-full blur-3xl"></div>
          </div>

          <div className="container mx-auto px-4 relative z-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 animate-in fade-in slide-in-from-bottom-4">Recetas Destacadas</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredRecipes.map(recipe => (
                <RecipeCard key={recipe.id} recipe={recipe} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Todas las Recetas */}
      <section className="py-12 relative overflow-hidden">
        {/* Decoración de fondo sutil */}
        <div className="absolute bottom-0 right-0 w-full h-full opacity-5 pointer-events-none">
          <div className="absolute bottom-10 left-10 w-40 h-40 bg-naranja-frutal rounded-full blur-3xl"></div>
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 animate-in fade-in slide-in-from-bottom-4">
              {selectedCategory
                ? `Recetas de ${categoryName || selectedCategory}`
                : searchQuery
                ? `Resultados para "${searchQuery}"`
                : 'Todas las Recetas'}
            </h2>
            {(selectedCategory || searchQuery) && (
              <a
                href="/recetas"
                className="text-verde-bosque hover:underline font-medium"
              >
                Ver todas
              </a>
            )}
          </div>

          {filteredRecipes.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredRecipes.map(recipe => (
                <RecipeCard key={recipe.id} recipe={recipe} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">🍽️</div>
              <h3 className="text-xl font-medium text-gray-900 mb-2">
                No encontramos recetas
              </h3>
              <p className="text-gray-600 mb-6">
                Intenta con otros términos de búsqueda o explora nuestras categorías.
              </p>
              <a
                href="/recetas"
                className="inline-block bg-verde-bosque text-white px-6 py-3 rounded-full font-medium hover:bg-verde-bosque/90 transition-colors"
              >
                Ver todas las recetas
              </a>
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-naranja-frutal to-orange-400">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            ¿Te faltan ingredientes?
          </h2>
          <p className="text-white/90 text-lg mb-8 max-w-2xl mx-auto">
            Encuentra todos los ingredientes frescos que necesitas en nuestra tienda.
            Envío el mismo día en Bogotá.
          </p>
          <a
            href="/tienda"
            className="inline-block bg-white text-naranja-frutal px-8 py-4 rounded-full font-bold hover:bg-gray-100 transition-colors"
          >
            Ir a la Tienda
          </a>
        </div>
      </section>
    </main>
  );
}
