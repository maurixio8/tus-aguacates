'use client';

import { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Building2, ArrowRight } from 'lucide-react';
import { BUSINESS_CATEGORIES, getBusinessProductsByCategory } from '@/lib/business-products';
import { fetchCategoriesFromSupabase, CategoryWithImage } from '@/lib/category-utils';

interface BusinessCategoriesProps {
  variant?: 'scroll' | 'grid';
  selectedCategory?: string;
}

// Colores únicos por categoría para variación visual
const CATEGORY_COLORS: Record<string, { from: string; to: string; accent: string }> = {
  'aguacates': { from: 'from-verde-bosque', to: 'to-verde-aguacate', accent: 'bg-naranja-frutal' },
  'frutas-tropicales': { from: 'from-naranja-frutal', to: 'to-yellow-500', accent: 'bg-verde-bosque' },
  'frutos-rojos': { from: 'from-rojo-natural', to: 'to-naranja-frutal', accent: 'bg-white' },
  'gourmet': { from: 'from-dorado', to: 'to-naranja-frutal', accent: 'bg-verde-bosque' },
  'aromaticas': { from: 'from-verde-aguacate', to: 'to-verde-bosque', accent: 'bg-naranja-frutal' },
  'saludables': { from: 'from-verde-bosque', to: 'to-esmeralda', accent: 'bg-dorado' },
  'desgranados': { from: 'from-tierra', to: 'to-naranja-frutal', accent: 'bg-verde-aguacate' },
};

export function BusinessCategories({ variant = 'scroll', selectedCategory }: BusinessCategoriesProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [categoryImages, setCategoryImages] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  // Cargar imágenes de categorías desde Supabase al montar
  useEffect(() => {
    const loadCategoryImages = async () => {
      try {
        setLoading(true);

        // Slugs de categorías B2B
        const b2bSlugs = BUSINESS_CATEGORIES.map(cat => cat.slug);

        // Fetch desde Supabase
        const categories = await fetchCategoriesFromSupabase({ slugs: b2bSlugs });

        // Crear mapeo de slug -> imagen
        const imageMap: Record<string, string> = {};
        categories.forEach(cat => {
          imageMap[cat.slug] = cat.image;
        });

        setCategoryImages(imageMap);
      } catch (error) {
        console.error('Error loading category images:', error);
      } finally {
        setLoading(false);
      }
    };

    loadCategoryImages();
  }, []);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 300;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  // Obtener conteo de productos por categoría
  const categoriesWithCount = BUSINESS_CATEGORIES.map(cat => ({
    ...cat,
    productCount: getBusinessProductsByCategory(cat.slug).length,
    // Usar imagen de Supabase si está disponible
    image: categoryImages[cat.slug],
    colors: CATEGORY_COLORS[cat.slug] || CATEGORY_COLORS['aguacates'],
  }));

  // Mostrar skeleton mientras carga
  if (loading) {
    return <CategorySkeleton variant={variant} />;
  }

  if (variant === 'grid') {
    return (
      <div className="relative">
        {/* Animated background orbs for category grid */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden -z-10">
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-verde-aguacate/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '4s' }} />
          <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-naranja-frutal/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '5s', animationDelay: '1s' }} />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {categoriesWithCount.map((category, index) => (
            <Link
              key={category.slug}
              href={`/empresas/${category.slug}`}
              className="group relative aspect-square rounded-2xl overflow-hidden shadow-soft hover:shadow-strong transition-all duration-300 hover:-translate-y-2 hover:scale-[1.02]"
              style={{ animation: `fade-in 0.6s ease-out ${index * 0.1}s both` }}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              {/* Imagen de fondo */}
              {category.image ? (
                <img
                  src={category.image}
                  alt={category.name}
                  className={`absolute inset-0 w-full h-full object-cover transition-transform duration-700 ${hoveredIndex === index ? 'scale-125' : 'scale-110 group-hover:scale-120'}`}
                />
              ) : (
                <div className={`absolute inset-0 bg-gradient-to-br ${category.colors.from} ${category.colors.to}`} />
              )}

              {/* Animated overlay gradient */}
              <div className={`absolute inset-0 bg-gradient-to-t ${category.colors.from}/95 via-${category.colors.from}/60 to-transparent transition-opacity duration-300 ${hoveredIndex === index ? 'opacity-90' : 'opacity-80'}`} />

              {/* Animated shine effect on hover */}
              {hoveredIndex === index && (
                <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/20 to-white/0 animate-shine" />
              )}

              {/* Contenido */}
              <div className="absolute inset-0 flex flex-col items-center justify-end p-4 text-white">
                <h3 className="font-display font-bold text-base text-center mb-1 drop-shadow-md">{category.name}</h3>
                <span className="text-xs text-white/90 font-medium">
                  {category.productCount} productos
                </span>
              </div>

              {/* Badge B2B animado */}
              <div className={`absolute top-3 right-3 ${category.colors.accent} text-white px-2.5 py-1 text-xs font-bold rounded-full flex items-center gap-1 shadow-lg transition-transform duration-300 ${hoveredIndex === index ? 'scale-110' : ''}`}>
                <Building2 className="w-3 h-3" />
                B2B
              </div>

              {/* Animated bottom accent */}
              <div className={`absolute bottom-0 left-0 right-0 h-1.5 bg-gradient-to-r ${category.colors.from} ${category.colors.to} scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left`} />

              {/* Corner decorations */}
              <div className={`absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-white/30 rounded-tl-xl transition-all duration-300 ${hoveredIndex === index ? 'w-12 h-12 border-white/50' : ''}`} />
              <div className={`absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-white/30 rounded-br-xl transition-all duration-300 ${hoveredIndex === index ? 'w-12 h-12 border-white/50' : ''}`} />
            </Link>
          ))}
        </div>
      </div>
    );
  }

  // Variante scroll mejorada
  return (
    <div className="relative">
      {/* Animated background elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-0 left-1/4 w-64 h-64 bg-verde-aguacate/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '4s' }} />
        <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-naranja-frutal/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '5s', animationDelay: '1s' }} />
      </div>

      {/* Botones de navegación mejorados */}
      {categoriesWithCount.length > 4 && (
        <>
          <button
            onClick={() => scroll('left')}
            className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 backdrop-blur-sm shadow-strong rounded-full p-3 hover:bg-white border border-verde-aguacate/20 transition-all hover:scale-110 group"
            aria-label="Anterior"
          >
            <ChevronLeft className="w-6 h-6 text-verde-bosque group-hover:text-naranja-frutal transition-colors" />
          </button>
          <button
            onClick={() => scroll('right')}
            className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 backdrop-blur-sm shadow-strong rounded-full p-3 hover:bg-white border border-verde-aguacate/20 transition-all hover:scale-110 group"
            aria-label="Siguiente"
          >
            <ChevronRight className="w-6 h-6 text-verde-bosque group-hover:text-naranja-frutal transition-colors" />
          </button>
        </>
      )}

      {/* Scroll Container mejorado */}
      <div
        ref={scrollRef}
        className="flex gap-6 overflow-x-auto scrollbar-hide pb-6 px-2 md:px-12"
      >
        {categoriesWithCount.map((category, index) => (
          <Link
            key={category.slug}
            href={`/empresas/${category.slug}`}
            className="flex-shrink-0 flex flex-col items-center group"
            onMouseEnter={() => setHoveredIndex(index)}
            onMouseLeave={() => setHoveredIndex(null)}
          >
            {/* Imagen circular mejorada con efectos */}
            <div className={`
              relative w-28 h-28 md:w-36 md:h-36 rounded-full overflow-hidden mb-3
              shadow-soft hover:shadow-strong transition-all duration-300
              group-hover:scale-110 border-4 border-transparent
              ${hoveredIndex === index ? 'border-naranja-frutal' : 'hover:border-verde-aguacate'}
              ${selectedCategory === category.slug ? 'ring-4 ring-naranja-frutal ring-offset-4' : ''}
            `}>
              {category.image ? (
                <img
                  src={category.image}
                  alt={category.name}
                  className={`absolute inset-0 w-full h-full object-cover transition-transform duration-500 ${hoveredIndex === index ? 'scale-125' : 'group-hover:scale-115'}`}
                />
              ) : (
                <div className={`absolute inset-0 bg-gradient-to-br ${category.colors.from} ${category.colors.to}`} />
              )}

              {/* Animated shine overlay on hover */}
              {hoveredIndex === index && (
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/30 to-transparent animate-shine rounded-full" />
              )}

              {/* Badge de conteo animado */}
              <div className={`absolute top-1 right-1 ${category.colors.accent} text-white text-sm rounded-full w-7 h-7 flex items-center justify-center font-bold shadow-lg border-2 border-white transition-transform duration-300 ${hoveredIndex === index ? 'scale-125' : ''}`}>
                {category.productCount}
              </div>

              {/* Ring pulse animation on hover */}
              {hoveredIndex === index && (
                <div className={`absolute inset-0 rounded-full border-2 border-naranja-frutal animate-ping`} />
              )}
            </div>

            {/* Nombre con efecto hover */}
            <div className="text-center">
              <span className={`
                text-sm md:text-base font-semibold w-28 md:w-36 block transition-all duration-200
                ${selectedCategory === category.slug ? 'text-verde-bosque' : 'text-gray-700 group-hover:text-verde-bosque'}
                ${hoveredIndex === index ? 'scale-105' : ''}
              `}>
                {category.name}
              </span>
              {/* Indicator arrow on hover */}
              <div className={`flex items-center justify-center transition-all duration-200 ${hoveredIndex === index ? 'opacity-100 translate-y-1' : 'opacity-0 translate-y-0'}`}>
                <ArrowRight className={`w-4 h-4 text-naranja-frutal transition-transform duration-300 ${hoveredIndex === index ? 'translate-x-1' : ''}`} />
              </div>
            </div>
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
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes shine {
          0% { transform: translateX(-100%) translateY(-100%) rotate(45deg); }
          100% { transform: translateX(200%) translateY(200%) rotate(45deg); }
        }
      `}</style>
    </div>
  );
}

// Skeleton para loading state
function CategorySkeleton({ variant }: { variant: 'scroll' | 'grid' }) {
  if (variant === 'grid') {
    return (
      <div className="relative">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {[...Array(7)].map((_, i) => (
            <div key={i} className="aspect-square rounded-2xl bg-gray-200 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="flex gap-6 overflow-x-auto scrollbar-hide pb-6 px-2 md:px-12">
        {[...Array(7)].map((_, i) => (
          <div key={i} className="flex-shrink-0 flex flex-col items-center">
            <div className="w-28 h-28 md:w-36 md:h-36 rounded-full bg-gray-200 animate-pulse mb-3" />
            <div className="w-20 h-4 bg-gray-200 rounded animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}
