'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Image as ImageIcon } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { OptimizedImage } from '@/components/optimization/OptimizedImage';

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

// Mapeo unificado de categorías (sincronizado con productos-master.json)
// ✅ Estas 8 categorías coinciden exactamente con las del JSON
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
    id: 'cat-ofertas',
    name: 'Ofertas y Combos',
    slug: 'ofertas-combos',
    icon: '🔥',
    image: '/categories/ofertas.jpg',
    description: 'Combos especiales y ofertas del día',
    color: 'from-red-500 to-orange-500'
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
    name: 'Frutos Rojos',
    slug: 'frutos-rojos',
    icon: '🍓',
    image: '/categories/frutos-rojos.jpg',
    description: 'Deliciosas frutas rojas y bayas',
    color: 'from-red-500 to-pink-600'
  },
  {
    id: 'cat-4',
    name: 'Aromáticas',
    slug: 'aromaticas',
    icon: '🌿',
    image: '/categories/aromaticas.jpg',
    description: 'Hierbas aromáticas frescas',
    color: 'from-emerald-500 to-teal-600'
  },
  {
    id: 'cat-5',
    name: 'Saludables',
    slug: 'saludables',
    icon: '🥗',
    image: '/categories/saludables.jpg',
    description: 'Productos naturales y saludables',
    color: 'from-emerald-500 to-teal-600'
  },
  {
    id: 'cat-6',
    name: 'Especias',
    slug: 'especias',
    icon: '🥗🌱☘️',
    image: '/categories/especias.jpg',
    description: 'Especias y condimentos naturales',
    color: 'from-yellow-500 to-orange-600'
  },
  {
    id: 'cat-7',
    name: 'Desgranados',
    slug: 'desgranados',
    icon: '🌽',
    image: '/categories/desgranados.jpg',
    description: 'Productos desgranados frescos',
    color: 'from-yellow-400 to-amber-600'
  },
  {
    id: 'cat-8',
    name: 'Gourmet',
    slug: 'gourmet',
    icon: '🍅🌽',
    image: '/categories/gourmet.jpg',
    description: 'Productos gourmet premium',
    color: 'from-red-500 to-orange-700'
  },
  {
    id: 'cat-9',
    name: 'Productos Nuevos',
    slug: 'productos-nuevos',
    icon: '✨',
    image: '/categories/gourmet.jpg',
    description: 'Últimos productos agregados a nuestra tienda',
    color: 'from-purple-500 to-pink-600'
  }
];

export default function UnifiedCategories({
  variant = 'scroll',
  selectedCategory,
  onCategoryChange,
  showProductCount = false,
  maxItems = 8
}: UnifiedCategoriesProps) {
  const [categories, setCategories] = useState<UnifiedCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Cargar categorías desde Supabase (DB es la fuente principal)
  useEffect(() => {
    const loadCategories = async () => {
      try {
        setLoading(true);

        const { data: supabaseCategories, error } = await supabase
          .from('categories')
          .select('id, name, slug, image_url, description, sort_order, is_active')
          .eq('is_active', true)
          .order('sort_order', { ascending: true })
          .limit(maxItems);

        if (!error && supabaseCategories && supabaseCategories.length > 0) {
          // Mapeo de slug a imagen de Unsplash para fallback (mismas que PremiumCategoryGrid)
          const localImageMap: Record<string, string> = {
            // Categorías principales con imágenes de Unsplash
            'aguacates': 'https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?w=400&h=400&fit=crop',
            'frutas-tropicales': 'https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=400&h=400&fit=crop',
            'frutos-rojos': 'https://images.unsplash.com/photo-1464965911861-746a04b4bca6?w=400&h=400&fit=crop',
            'aromaticas': 'https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?w=400&h=400&fit=crop',
            'saludables': 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=400&h=400&fit=crop',
            'especias': 'https://images.unsplash.com/photo-1596040033229-a0b13f84e434?w=400&h=400&fit=crop',
            'desgranados': 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?w=400&h=400&fit=crop',
            'gourmet': 'https://images.unsplash.com/photo-1506368249639-73a05d6f6488?w=400&h=400&fit=crop',
            'productos-nuevos': 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&h=400&fit=crop',
            'navidad': 'https://images.unsplash.com/photo-1512909006721-3d6018887383?w=400&h=400&fit=crop',
            // Categorías adicionales
            'ofertas-combos': 'https://images.unsplash.com/photo-1506368249639-73a05d6f6488?w=400&h=400&fit=crop',
            'frutas': 'https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=400&h=400&fit=crop',
            'verduras': 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=400&h=400&fit=crop',
            'hierbas-aromaticas': 'https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?w=400&h=400&fit=crop',
            'combos': 'https://images.unsplash.com/photo-1506368249639-73a05d6f6488?w=400&h=400&fit=crop',
            'jugos': 'https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=400&h=400&fit=crop',
            'otros': 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&h=400&fit=crop',
          };

          // Imagen por defecto si no hay coincidencia
          const defaultImage = 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&h=400&fit=crop';

          // Función para obtener URL de imagen válida
          const getValidImageUrl = (imageUrl: string | null | undefined, slug: string): string => {
            // Si tiene una URL válida (http/https), usarla (imágenes de Supabase o externas)
            if (imageUrl && (imageUrl.startsWith('http://') || imageUrl.startsWith('https://'))) {
              return imageUrl;
            }
            // Si tiene una ruta local válida, usarla
            if (imageUrl && imageUrl.startsWith('/') && imageUrl.length > 1) {
              return imageUrl;
            }
            // Fallback a imagen de Unsplash basada en slug
            return localImageMap[slug] || defaultImage;
          };

          // Convertir datos de Supabase al formato UnifiedCategory
          const formattedCategories: UnifiedCategory[] = supabaseCategories.map(cat => ({
            id: cat.id,
            name: cat.name,
            slug: cat.slug,
            icon: '', // Las imágenes reemplazan los íconos
            // Usar validación robusta de imagen - SIEMPRE tendrá un valor
            image: getValidImageUrl(cat.image_url, cat.slug),
            description: cat.description || undefined,
            color: 'from-verde-aguacate to-verde-bosque' // Color por defecto
          }));

          setCategories(formattedCategories);
        } else if (!error) {
          // Si no hay error pero tampoco hay categorías, usar fallback
          setCategories(UNIFIED_CATEGORIES.slice(0, maxItems));
        } else {
          // Si hay error, usar fallback
          setCategories(UNIFIED_CATEGORIES.slice(0, maxItems));
        }
      } catch (error) {
        // Si hay error, usar fallback
        setCategories(UNIFIED_CATEGORIES.slice(0, maxItems));
      } finally {
        setLoading(false);
      }
    };

    loadCategories();
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
              {/* Imagen de categoría */}
              <div className="relative w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden bg-gray-100 mb-2 group-hover:shadow-xl transition-all group-hover:scale-105">
                <img
                  src={category.image || '/categories/gourmet.jpg'}
                  alt={category.name}
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  loading="lazy"
                  onError={(e) => {
                    // Si falla la imagen, mostrar un fondo con el nombre
                    console.error('❌ Error loading category image:', category.slug, category.image);
                    const target = e.currentTarget;
                    target.style.display = 'none';
                    // Agregar un div con el nombre como fallback visual
                    const fallback = document.createElement('div');
                    fallback.className = 'absolute inset-0 flex items-center justify-center bg-gradient-to-br from-verde-aguacate to-verde-bosque text-white text-xs font-bold text-center p-2';
                    fallback.textContent = category.name;
                    target.parentElement?.appendChild(fallback);
                  }}
                />

                {/* Badge de conteo de productos */}
                {showProductCount && category.productCount && (
                  <div className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-semibold shadow-lg">
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
            {/* Imagen de fondo optimizada */}
            {category.image ? (
              <>
                <OptimizedImage
                  src={category.image}
                  alt={category.name}
                  fill
                  priority={false}
                  className="object-cover"
                />
                {/* Overlay oscuro */}
                <div className="absolute inset-0 bg-gradient-to-br from-black/40 to-black/60 group-hover:from-black/30 group-hover:to-black/50 transition-all" />
              </>
            ) : (
              <div className={`absolute inset-0 bg-gradient-to-br ${category.color || 'from-gray-500 to-gray-700'} opacity-90`} />
            )}

            {/* Content */}
            <div className="relative h-full flex flex-col items-center justify-center text-white p-4">
              <h3 className="text-lg md:text-xl font-bold text-center mb-2">
                {category.name}
              </h3>
              {category.description && (
                <p className="text-xs text-white/80 text-center hidden md:block">
                  {category.description}
                </p>
              )}

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

  // Variante Simple (lista horizontal - solo texto)
  return (
    <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
      {categories.map((category) => (
        <Link
          key={category.id}
          href={`/tienda/${category.slug}`}
          className={`flex-shrink-0 px-5 py-2.5 rounded-full transition-all font-medium ${
            selectedCategory === category.slug
              ? 'bg-verde-aguacate text-white shadow-md'
              : 'bg-gray-100 hover:bg-gray-200 text-gray-700 hover:shadow-sm'
          }`}
          onClick={() => handleCategoryClick(category)}
        >
          <span className="text-sm">{category.name}</span>
          {showProductCount && category.productCount && (
            <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${
              selectedCategory === category.slug
                ? 'bg-white/20 text-white'
                : 'bg-gray-200 text-gray-600'
            }`}>
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