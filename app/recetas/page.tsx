import { Metadata } from 'next';
import { Suspense } from 'react';
import { recipes, recipeCategories, getRecipesByCategory, getFeaturedRecipes, type RecipeCategory } from '@/data/recipes';
import { RecipeCard, RecipeCategoryCard } from '@/components/recipes';
import { Search } from 'lucide-react';

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

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-verde-bosque to-verde-aguacate text-white py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Recetas Saludables
            </h1>
            <p className="text-xl text-white/90 mb-8">
              Descubre cómo preparar platos deliciosos con los productos más frescos.
              Recetas fáciles, nutritivas y llenas de sabor.
            </p>

            {/* Barra de búsqueda */}
            <form action="/recetas" method="GET" className="max-w-xl mx-auto">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  name="buscar"
                  placeholder="Buscar recetas..."
                  defaultValue={searchQuery}
                  className="w-full pl-12 pr-4 py-4 rounded-full text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-4 focus:ring-white/30"
                />
              </div>
            </form>
          </div>
        </div>
      </section>

      {/* Categorías */}
      <section className="py-10 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Explora por Categoría</h2>

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
        <section className="py-12">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Recetas Destacadas</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredRecipes.map(recipe => (
                <RecipeCard key={recipe.id} recipe={recipe} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Todas las Recetas */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              {selectedCategory
                ? `Recetas de ${recipeCategories.find(c => c.slug === selectedCategory)?.name || selectedCategory}`
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
