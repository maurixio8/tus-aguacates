'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Building2 } from 'lucide-react';
import { BUSINESS_CATEGORIES, getBusinessProductsByCategory } from '@/lib/business-products';

interface BusinessCategoriesProps {
  variant?: 'scroll' | 'grid';
  selectedCategory?: string;
}

// Mapeo de imágenes por categoría
const CATEGORY_IMAGES: Record<string, string> = {
  'aguacates': '/categories/aguacates.jpg',
  'frutas-tropicales': '/categories/tropicales.jpg',
  'frutos-rojos': '/categories/frutos-rojos.jpg',
  'gourmet': '/categories/gourmet.jpg',
  'aromaticas': '/categories/aromaticas.jpg',
  'saludables': '/categories/saludables.jpg',
  'desgranados': '/categories/desgranados.jpg',
};

export function BusinessCategories({ variant = 'scroll', selectedCategory }: BusinessCategoriesProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

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
    image: CATEGORY_IMAGES[cat.slug]
  }));

  if (variant === 'grid') {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
        {categoriesWithCount.map((category, index) => (
          <Link
            key={category.slug}
            href={`/empresas/${category.slug}`}
            className="group relative aspect-square rounded-2xl overflow-hidden shadow-soft hover:shadow-medium transition-all duration-200 hover:-translate-y-1"
          >
            {/* Imagen de fondo */}
            {category.image ? (
              <img
                src={category.image}
                alt={category.name}
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-verde-bosque to-verde-aguacate" />
            )}

            {/* Overlay gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-verde-bosque/90 via-verde-bosque/50 to-transparent" />

            {/* Contenido */}
            <div className="absolute inset-0 flex flex-col items-center justify-end p-4 text-white">
              <span className="text-3xl mb-2 drop-shadow-lg">{category.icon}</span>
              <h3 className="font-display font-bold text-base text-center">{category.name}</h3>
              <span className="text-xs text-white/80">
                {category.productCount} productos
              </span>
            </div>

            {/* Badge B2B */}
            <div className="absolute top-3 right-3 bg-naranja-frutal text-white px-2.5 py-1 text-xs font-bold rounded-full flex items-center gap-1 shadow-lg">
              <Building2 className="w-3 h-3" />
              B2B
            </div>

            {/* Bottom accent on hover */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-naranja-frutal to-yellow-500 scale-x-0 group-hover:scale-x-100 transition-transform duration-200" />
          </Link>
        ))}
      </div>
    );
  }

  // Variante scroll
  return (
    <div className="relative">
      {/* Botones de navegación */}
      {categoriesWithCount.length > 4 && (
        <>
          <button
            onClick={() => scroll('left')}
            className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white shadow-medium rounded-full p-2 hover:bg-gray-50 transition-all hover:scale-105"
            aria-label="Anterior"
          >
            <ChevronLeft className="w-6 h-6 text-verde-bosque" />
          </button>
          <button
            onClick={() => scroll('right')}
            className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white shadow-medium rounded-full p-2 hover:bg-gray-50 transition-all hover:scale-105"
            aria-label="Siguiente"
          >
            <ChevronRight className="w-6 h-6 text-verde-bosque" />
          </button>
        </>
      )}

      {/* Scroll Container */}
      <div
        ref={scrollRef}
        className="flex gap-5 overflow-x-auto scrollbar-hide pb-4 px-2 md:px-12"
      >
        {categoriesWithCount.map((category) => (
          <Link
            key={category.slug}
            href={`/empresas/${category.slug}`}
            className="flex-shrink-0 flex flex-col items-center group"
          >
            {/* Imagen circular */}
            <div className={`
              relative w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden mb-2
              shadow-soft hover:shadow-medium transition-all duration-200
              group-hover:scale-105 border-4 border-transparent group-hover:border-verde-aguacate
              ${selectedCategory === category.slug ? 'ring-4 ring-naranja-frutal ring-offset-2' : ''}
            `}>
              {category.image ? (
                <img
                  src={category.image}
                  alt={category.name}
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-verde-bosque/50 to-verde-aguacate/50 flex items-center justify-center">
                  <span className="text-4xl">{category.icon}</span>
                </div>
              )}

              {/* Badge de conteo */}
              <div className="absolute top-0 right-0 bg-naranja-frutal text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-semibold shadow-lg border-2 border-white">
                {category.productCount}
              </div>
            </div>

            {/* Nombre */}
            <span className={`
              text-sm md:text-base font-semibold text-center w-24 md:w-32
              ${selectedCategory === category.slug ? 'text-verde-bosque' : 'text-gray-700 group-hover:text-verde-bosque'}
              transition-colors
            `}>
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
