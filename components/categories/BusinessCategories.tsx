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
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {categoriesWithCount.map((category, index) => (
          <Link
            key={category.slug}
            href={`/empresas/${category.slug}`}
            className="group relative aspect-square rounded-3xl overflow-hidden shadow-elegant hover:shadow-elegant-lg transition-all duration-500 hover:scale-105 animate-reveal"
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            {/* Imagen de fondo */}
            {category.image ? (
              <img
                src={category.image}
                alt={category.name}
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-esmeralda to-esmeralda/80" />
            )}

            {/* Overlay gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-esmeralda/90 via-esmeralda/40 to-transparent" />

            {/* Contenido */}
            <div className="absolute inset-0 flex flex-col items-center justify-end p-5 text-white">
              <span className="text-4xl mb-3 drop-shadow-lg">{category.icon}</span>
              <h3 className="font-elegant font-bold text-lg text-center mb-1">{category.name}</h3>
              <span className="font-modern text-xs text-champagne/90">
                {category.productCount} productos
              </span>
            </div>

            {/* Badge B2B elegante */}
            <div className="absolute top-4 right-4 bg-gradient-to-br from-dorado to-champagne text-esmeralda px-3 py-1.5 text-xs font-elegant font-semibold rounded-full shadow-lg flex items-center gap-1.5">
              <Building2 className="w-3 h-3" />
              B2B
            </div>

            {/* Bottom accent on hover */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-champagne via-dorado to-champagne scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />
          </Link>
        ))}
      </div>
    );
  }

  // Variante scroll con estilo luxury
  return (
    <div className="relative">
      {/* Botones de navegación elegantes */}
      {categoriesWithCount.length > 4 && (
        <>
          <button
            onClick={() => scroll('left')}
            className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 backdrop-blur-sm shadow-elegant rounded-full p-3 hover:bg-white border border-champagne/20 transition-all hover:scale-110"
            aria-label="Anterior"
          >
            <ChevronLeft className="w-6 h-6 text-esmeralda" />
          </button>
          <button
            onClick={() => scroll('right')}
            className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 backdrop-blur-sm shadow-elegant rounded-full p-3 hover:bg-white border border-champagne/20 transition-all hover:scale-110"
            aria-label="Siguiente"
          >
            <ChevronRight className="w-6 h-6 text-esmeralda" />
          </button>
        </>
      )}

      {/* Scroll Container */}
      <div
        ref={scrollRef}
        className="flex gap-6 overflow-x-auto scrollbar-hide pb-6 px-2 md:px-12"
      >
        {categoriesWithCount.map((category) => (
          <Link
            key={category.slug}
            href={`/empresas/${category.slug}`}
            className="flex-shrink-0 flex flex-col items-center group"
          >
            {/* Imagen circular elegante */}
            <div className={`
              relative w-28 h-28 md:w-36 md:h-36 rounded-full overflow-hidden mb-3
              shadow-elegant hover:shadow-elegant-lg transition-all duration-500
              group-hover:scale-105 border-4 border-transparent group-hover:border-champagne/30
              ${selectedCategory === category.slug ? 'ring-4 ring-dorado ring-offset-4' : ''}
            `}>
              {category.image ? (
                <img
                  src={category.image}
                  alt={category.name}
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-esmeralda/50 to-esmeralda/30 flex items-center justify-center">
                  <span className="text-5xl">{category.icon}</span>
                </div>
              )}

              {/* Badge de conteo elegante */}
              <div className="absolute top-0 right-0 bg-gradient-to-br from-dorado to-champagne text-esmeralda text-xs rounded-full w-7 h-7 flex items-center justify-center font-elegant font-bold shadow-lg border-2 border-white">
                {category.productCount}
              </div>
            </div>

            {/* Nombre con tipografía elegante */}
            <span className={`
              font-elegant text-sm md:text-base font-semibold text-center w-28 md:w-36
              ${selectedCategory === category.slug ? 'text-esmeralda' : 'text-gray-700 group-hover:text-esmeralda'}
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
