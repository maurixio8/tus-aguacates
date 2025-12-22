import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Clock, Users, ChefHat, ArrowLeft, Printer, Share2 } from 'lucide-react';
import { getRecipeBySlug, recipes, getCategoryInfo } from '@/data/recipes';
import { RecipeCard } from '@/components/recipes';
import { AddIngredientsButton } from './AddIngredientsButton';

interface RecipePageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: RecipePageProps): Promise<Metadata> {
  const { slug } = await params;
  const recipe = getRecipeBySlug(slug);

  if (!recipe) {
    return {
      title: 'Receta no encontrada | Tus Aguacates',
    };
  }

  return {
    title: `${recipe.title} | Recetas Tus Aguacates`,
    description: recipe.description,
    openGraph: {
      title: recipe.title,
      description: recipe.shortDescription,
      images: [{ url: recipe.image }],
      type: 'article',
    },
  };
}

export async function generateStaticParams() {
  return recipes.map((recipe) => ({
    slug: recipe.slug,
  }));
}

export default async function RecipePage({ params }: RecipePageProps) {
  const { slug } = await params;
  const recipe = getRecipeBySlug(slug);

  if (!recipe) {
    notFound();
  }

  const totalTime = recipe.prepTime + recipe.cookTime;
  const categoryInfo = getCategoryInfo(recipe.category);

  // Recetas relacionadas (misma categoría)
  const relatedRecipes = recipes
    .filter(r => r.category === recipe.category && r.id !== recipe.id)
    .slice(0, 3);

  // Ingredientes que están en la tienda
  const shopIngredients = recipe.ingredients.filter(ing => ing.productSlug);

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Breadcrumb */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <nav className="flex items-center gap-2 text-sm">
            <Link href="/recetas" className="text-verde-bosque hover:underline flex items-center gap-1">
              <ArrowLeft className="w-4 h-4" />
              Recetas
            </Link>
            <span className="text-gray-400">/</span>
            <span className="text-gray-600">{recipe.title}</span>
          </nav>
        </div>
      </div>

      {/* Hero de la receta */}
      <section className="bg-white pb-8">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-8 py-8">
            {/* Imagen */}
            <div className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-lg">
              <Image
                src={recipe.image}
                alt={recipe.title}
                fill
                className="object-cover"
                priority
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
              {categoryInfo && (
                <div className="absolute top-4 left-4">
                  <span className={`${categoryInfo.color} text-white px-4 py-2 rounded-full font-medium flex items-center gap-2`}>
                    <span>{categoryInfo.icon}</span>
                    <span>{categoryInfo.name}</span>
                  </span>
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex flex-col justify-center">
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                {recipe.title}
              </h1>

              <p className="text-gray-600 text-lg mb-6">
                {recipe.description}
              </p>

              {/* Meta */}
              <div className="flex flex-wrap gap-6 mb-6">
                <div className="flex items-center gap-2 text-gray-700">
                  <Clock className="w-5 h-5 text-verde-aguacate" />
                  <div>
                    <div className="text-sm text-gray-500">Tiempo total</div>
                    <div className="font-medium">{totalTime} minutos</div>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-gray-700">
                  <Users className="w-5 h-5 text-verde-aguacate" />
                  <div>
                    <div className="text-sm text-gray-500">Porciones</div>
                    <div className="font-medium">{recipe.servings} personas</div>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-gray-700">
                  <ChefHat className="w-5 h-5 text-verde-aguacate" />
                  <div>
                    <div className="text-sm text-gray-500">Dificultad</div>
                    <div className="font-medium">{recipe.difficulty}</div>
                  </div>
                </div>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-2 mb-6">
                {recipe.tags.map(tag => (
                  <span
                    key={tag}
                    className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm"
                  >
                    #{tag}
                  </span>
                ))}
              </div>

              {/* Acciones */}
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Printer className="w-4 h-4" />
                  Imprimir
                </button>
                <button
                  onClick={() => navigator.share?.({ title: recipe.title, url: window.location.href })}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Share2 className="w-4 h-4" />
                  Compartir
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contenido principal */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Ingredientes (sidebar) */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl p-6 shadow-sm sticky top-24">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <span>🥗</span>
                  Ingredientes
                </h2>

                <ul className="space-y-3 mb-6">
                  {recipe.ingredients.map((ingredient, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full border-2 border-verde-aguacate flex-shrink-0 mt-0.5" />
                      <div>
                        <span className="font-medium">{ingredient.quantity} {ingredient.unit}</span>
                        {' '}
                        <span className="text-gray-700">{ingredient.name}</span>
                        {ingredient.isOptional && (
                          <span className="text-gray-400 text-sm ml-1">(opcional)</span>
                        )}
                        {ingredient.productSlug && (
                          <Link
                            href={`/tienda?buscar=${encodeURIComponent(ingredient.name)}`}
                            className="ml-2 text-verde-aguacate text-sm hover:underline"
                          >
                            Comprar
                          </Link>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>

                {/* Botón de agregar ingredientes al carrito */}
                {shopIngredients.length > 0 && (
                  <AddIngredientsButton ingredients={shopIngredients} />
                )}
              </div>
            </div>

            {/* Preparación */}
            <div className="lg:col-span-2">
              {/* Tiempos */}
              <div className="bg-white rounded-2xl p-6 shadow-sm mb-8">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-gray-50 rounded-xl">
                    <div className="text-sm text-gray-500 mb-1">Preparación</div>
                    <div className="text-2xl font-bold text-verde-bosque">{recipe.prepTime} min</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-xl">
                    <div className="text-sm text-gray-500 mb-1">Cocción</div>
                    <div className="text-2xl font-bold text-verde-bosque">{recipe.cookTime} min</div>
                  </div>
                </div>
              </div>

              {/* Pasos */}
              <div className="bg-white rounded-2xl p-6 shadow-sm mb-8">
                <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <span>👨‍🍳</span>
                  Preparación
                </h2>

                <ol className="space-y-6">
                  {recipe.steps.map((step, index) => (
                    <li key={index} className="flex gap-4">
                      <div className="flex-shrink-0 w-8 h-8 bg-verde-aguacate text-white rounded-full flex items-center justify-center font-bold">
                        {index + 1}
                      </div>
                      <p className="text-gray-700 pt-1">{step}</p>
                    </li>
                  ))}
                </ol>
              </div>

              {/* Tips */}
              {recipe.tips && recipe.tips.length > 0 && (
                <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-2xl p-6 shadow-sm mb-8 border border-amber-100">
                  <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <span>💡</span>
                    Tips del Chef
                  </h2>

                  <ul className="space-y-3">
                    {recipe.tips.map((tip, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <span className="text-amber-500">✓</span>
                        <p className="text-gray-700">{tip}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Información Nutricional */}
              {recipe.nutrition && (
                <div className="bg-white rounded-2xl p-6 shadow-sm">
                  <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <span>📊</span>
                    Información Nutricional
                  </h2>
                  <p className="text-sm text-gray-500 mb-4">Por porción</p>

                  <div className="grid grid-cols-5 gap-4 text-center">
                    <div className="p-3 bg-gray-50 rounded-xl">
                      <div className="text-2xl font-bold text-verde-bosque">{recipe.nutrition.calories}</div>
                      <div className="text-xs text-gray-500">Calorías</div>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-xl">
                      <div className="text-2xl font-bold text-verde-bosque">{recipe.nutrition.protein}</div>
                      <div className="text-xs text-gray-500">Proteína</div>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-xl">
                      <div className="text-2xl font-bold text-verde-bosque">{recipe.nutrition.carbs}</div>
                      <div className="text-xs text-gray-500">Carbos</div>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-xl">
                      <div className="text-2xl font-bold text-verde-bosque">{recipe.nutrition.fat}</div>
                      <div className="text-xs text-gray-500">Grasas</div>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-xl">
                      <div className="text-2xl font-bold text-verde-bosque">{recipe.nutrition.fiber}</div>
                      <div className="text-xs text-gray-500">Fibra</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Recetas relacionadas */}
      {relatedRecipes.length > 0 && (
        <section className="py-12 bg-white">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Recetas Relacionadas
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              {relatedRecipes.map(recipe => (
                <RecipeCard key={recipe.id} recipe={recipe} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="py-16 bg-gradient-to-r from-verde-bosque to-verde-aguacate">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            ¿Listo para cocinar?
          </h2>
          <p className="text-white/90 text-lg mb-8 max-w-2xl mx-auto">
            Consigue todos los ingredientes frescos directamente en tu puerta.
          </p>
          <Link
            href="/tienda"
            className="inline-block bg-white text-verde-bosque px-8 py-4 rounded-full font-bold hover:bg-gray-100 transition-colors"
          >
            Comprar Ingredientes
          </Link>
        </div>
      </section>
    </main>
  );
}
