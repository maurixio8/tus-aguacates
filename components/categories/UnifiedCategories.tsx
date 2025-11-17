'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';

// Interface para categorías unificadas
interface UnifiedCategory {
  id: string;
  name: string;
  slug: string;
  icon: string;
  image?: string;
  description?: string;
  productCount?: number;
  color?: string;
}

interface UnifiedCategoriesProps {
  variant?: 'scroll' | 'grid' | 'simple';
  selectedCategory?: string;
  onCategoryChange?: (slug: string) => void;
  showProductCount?: boolean;
  maxItems?: number;
}

// Mapeo unificado de categorías (basado en JSON master pero limpio)
const UNIFIED_CATEGORIES: UnifiedCategory[] = [
  {
    id: 'cat-1',
    name: 'Aguacates',
    slug: 'aguacates',
    icon: '🥑',
    image: '/categories/aguacates.jpg',
    description: 'Aguacates frescos de la mejor calidad',
    color: 'from-green-500 to-green-700'
  },
  {
    id: 'cat-2',
    name: 'Frutas Tropicales',
    slug: 'frutas-tropicales',
    icon: '🍊',
    image: '/categories/tropicales.jpg',
    description: 'Frutas exóticas y tropicales',
    color: 'from-orange-500 to-red-600'
  },
  {
    id: 'cat-3',
    name: 'Frutas Rojas',
    slug: 'frutos-rojos',
    icon: '🍓',
    image: '/categories/frutos-rojos.jpg',
    description: 'Deliciosas frutas rojas y bayas',
    color: 'from-red-500 to-pink-600'
  },
  {
    id: 'cat-4',
    name: 'Verduras',
    slug: 'verduras',
    icon: '🥬',
    image: '/categories/verduras.jpg',
    description: 'Verduras frescas y orgánicas',
    color: 'from-green-400 to-lime-600'
  },
  {
    id: 'cat-5',
    name: 'Aromáticas',
    slug: 'aromaticas',
    icon: '🌿',
    image: '/categories/aromaticas.jpg',
    description: 'Hierbas aromáticas frescas',
    color: 'from-emerald-500 to-teal-600'
  },
  {
    id: 'cat-6',
    name: 'Saludables',
    slug: 'saludables',
    icon: '🥗',
    image: '/categories/saludables.jpg',
    description: 'Productos naturales y saludables',
    color: 'from-emerald-500 to-teal-600'
  },
  {
    id: 'cat-7',
    name: 'Especias',
    slug: 'especias',
    icon: '🌶️',
    image: '/categories/especias.jpg',
    description: 'Especias y condimentos naturales',
    color: 'from-yellow-500 to-orange-600'
  },
  {
    id: 'cat-8',
    name: 'Combos',
    slug: 'combos',
    icon: '🎁',
    image: '/categories/combos.jpg',
    description: 'Combos especiales y paquetes',
    color: 'from-purple-500 to-indigo-600'
  }
];

export default function UnifiedCategories({
  variant = 'scroll',
  selectedCategory,
  onCategoryChange,
  showProductCount = false,
  maxItems = 8
}: UnifiedCategoriesProps) {
  const [categories, setCategories] = useState<UnifiedCategory[]>(UNIFIED_CATEGORIES);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Intentar sincronizar con Supabase (opcional)
  useEffect(() => {
    const syncWithSupabase = async () => {
      try {
        setLoading(true);

        const { data: supabaseCategories, error } = await supabase
          .from('categories')
          .select('id, name, slug, image_url, description, sort_order')
          .eq('is_active', true)
          .order('sort_order', { ascending: true });

        if (!error && supabaseCategories && supabaseCategories.length > 0) {
          // Combinar datos de Supabase con categorías unificadas
          const mergedCategories = UNIFIED_CATEGORIES.map(unifiedCat => {
            const supabaseCat = supabaseCategories.find(sc => sc.slug === unifiedCat.slug);
            return {
              ...unifiedCat,
              ...(supabaseCat && {
                id: supabaseCat.id,
                image: supabaseCat.image_url || unifiedCat.image,
                description: supabaseCat.description || unifiedCat.description
              })
            };
          });

          setCategories(mergedCategories.slice(0, maxItems));
        }
      } catch (error) {
        console.log('⚠️ Error syncing with Supabase, using unified categories:', error);
      } finally {
        setLoading(false);
      }
    };

    syncWithSupabase();
  }, [maxItems]);

  const handleCategoryClick = (category: UnifiedCategory) => {
    if (onCategoryChange) {
      onCategoryChange(category.slug);
    }
  };

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 300;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  if (loading) {
    return <CategorySkeleton variant={variant} />;
  }

  // Variante Scroll (para Home y tiendas)
  if (variant === 'scroll') {
    return (
      <div className="relative">
        {/* Botones de navegación - Desktop */}
        {categories.length > 4 && (
          <>
            <button
              onClick={() => scroll('left')}
              className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white shadow-lg rounded-full p-2 hover:bg-gray-50"
              aria-label="Anterior"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              onClick={() => scroll('right')}
              className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white shadow-lg rounded-full p-2 hover:bg-gray-50"
              aria-label="Siguiente"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </>
        )}

        {/* Scroll Container */}
        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto scrollbar-hide pb-4 px-2 md:px-12"
        >
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/tienda/${category.slug}`}
              className="flex-shrink-0 flex flex-col items-center group"
              onClick={() => handleCategoryClick(category)}
            >
              {/* Imagen */}
              <div className="relative w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden bg-gray-100 mb-2 group-hover:shadow-xl transition-all">
                <Image
                  src={category.image || '/placeholder-category.jpg'}
                  alt={category.name}
                  fill
                  className="object-cover group-hover:scale-110 transition-transform"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
                {/* Fallback emoji */}
                <div className="absolute inset-0 flex items-center justify-center text-4xl bg-gradient-to-br from-green-100 to-green-200">
                  {category.icon}
                </div>

                {/* Badge de conteo de productos */}
                {showProductCount && category.productCount && (
                  <div className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center">
                    {category.productCount}
                  </div>
                )}
              </div>

              {/* Nombre */}
              <span className="text-sm md:text-base font-semibold text-gray-700 text-center w-24 md:w-32">
                {category.name}
              </span>
            </Link>
          ))}
        </div>

        {/* CSS para ocultar scrollbar */}
        <style jsx>{`
          .scrollbar-hide::-webkit-scrollbar {
            display: none;
          }
          .scrollbar-hide {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
        `}</style>
      </div>
    );
  }

  // Variante Grid (para página principal de tienda)
  if (variant === 'grid') {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-8">
        {categories.map((category) => (
          <Link
            key={category.id}
            href={`/tienda/${category.slug}`}
            className="group relative aspect-square rounded-2xl overflow-hidden hover:scale-105 transition-transform duration-300 shadow-lg hover:shadow-xl"
            onClick={() => handleCategoryClick(category)}
          >
            {/* Background */}
            <div className={`absolute inset-0 bg-gradient-to-br ${category.color || 'from-gray-500 to-gray-700'} opacity-90`} />

            {/* Content */}
            <div className="relative h-full flex flex-col items-center justify-center text-white p-4">
              <span className="text-5xl md:text-6xl mb-3 transform group-hover:scale-110 transition-transform duration-300">
                {category.icon}
              </span>
              <h3 className="text-lg md:text-xl font-bold text-center">
                {category.name}
              </h3>

              {showProductCount && category.productCount && (
                <div className="mt-2 bg-white/20 px-2 py-1 rounded-full text-xs">
                  {category.productCount} productos
                </div>
              )}
            </div>

            {/* Overlay con nombre en hover */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-end justify-center opacity-0 group-hover:opacity-100">
              <div className="bg-white/90 px-3 py-1 rounded-full text-sm font-medium text-gray-700 mb-4">
                Ver {category.name}
              </div>
            </div>
          </Link>
        ))}
      </div>
    );
  }

  // Variante Simple (lista horizontal)
  return (
    <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
      {categories.map((category) => (
        <Link
          key={category.id}
          href={`/tienda/${category.slug}`}
          className={`flex-shrink-0 px-4 py-2 rounded-full transition-all ${
            selectedCategory === category.slug
              ? 'bg-green-600 text-white'
              : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
          }`}
          onClick={() => handleCategoryClick(category)}
        >
          <span className="mr-2">{category.icon}</span>
          <span className="text-sm font-medium">{category.name}</span>
          {showProductCount && category.productCount && (
            <span className="ml-2 text-xs bg-gray-200 px-2 py-1 rounded-full">
              {category.productCount}
            </span>
          )}
        </Link>
      ))}
    </div>
  );
}

// Skeleton para loading
function CategorySkeleton({ variant }: { variant: string }) {
  if (variant === 'grid') {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-8">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="aspect-square rounded-2xl bg-gray-200 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {[...Array(8)].map((_, i) => (
        <div key={i} className="flex-shrink-0">
          <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-gray-200 animate-pulse mb-2" />
          <div className="w-20 h-4 bg-gray-200 rounded mx-auto animate-pulse" />
        </div>
      ))}
    </div>
  );
}

// Exportar categorías unificadas para uso en otros componentes
export { UNIFIED_CATEGORIES };