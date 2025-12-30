'use client';

import { useRef, useMemo } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Building2 } from 'lucide-react';
import { useB2BProducts, useB2BCategories } from '@/hooks/useB2BProducts';

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
  const { categories } = useB2BCategories();
  const { products } = useB2BProducts();

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
  const categoriesWithCount = useMemo(() => {
    return categories.map(cat => ({
      ...cat,
      productCount: cat.count || products.filter(p => p.categorySlug === cat.slug).length,
      image: CATEGORY_IMAGES[cat.slug]
    }));
  }, [categories, products]);

  if (variant === 'grid') {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {categoriesWithCount.map((category) => (
          <Link
            key={category.slug}
            href={`/empresas/${category.slug}`}
            className={`
              relative aspect-square rounded-2xl overflow-hidden group
              hover:scale-105 transition-transform duration-300 shadow-lg hover:shadow-xl
              ${selectedCategory === category.slug ? 'ring-4 ring-verde-bosque' : ''}
            `}
          >
            {/* Imagen de fondo */}
            {category.image ? (
              <img
                src={category.image}
                alt={category.name}
                className="absolute inset-0 w-full h-full object-cover"
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-verde-aguacate to-verde-bosque" />
            )}

            {/* Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />

            {/* Contenido */}
            <div className="absolute inset-0 flex flex-col items-center justify-end p-4 text-white">
              <span className="text-3xl mb-2">{category.icon}</span>
              <h3 className="font-bold text-lg text-center">{category.name}</h3>
              <span className="text-sm opacity-80">
                {category.productCount} productos
              </span>
            </div>

            {/* Badge B2B */}
            <div className="absolute top-3 right-3 bg-verde-bosque text-white px-2 py-1 text-xs font-bold rounded-full flex items-center gap-1">
              <Building2 className="w-3 h-3" />
              B2B
            </div>
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
        {categoriesWithCount.map((category) => (
          <Link
            key={category.slug}
            href={`/empresas/${category.slug}`}
            className={`
              flex-shrink-0 flex flex-col items-center group
              ${selectedCategory === category.slug ? 'scale-105' : ''}
            `}
          >
            {/* Imagen circular */}
            <div className={`
              relative w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden mb-2
              group-hover:shadow-xl transition-all group-hover:scale-105
              ${selectedCategory === category.slug ? 'ring-4 ring-verde-bosque' : ''}
            `}>
              {category.image ? (
                <img
                  src={category.image}
                  alt={category.name}
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-verde-aguacate/50 to-verde-bosque/50 flex items-center justify-center">
                  <span className="text-4xl">{category.icon}</span>
                </div>
              )}

              {/* Badge de conteo */}
              <div className="absolute top-0 right-0 bg-verde-bosque text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-semibold shadow-lg">
                {category.productCount}
              </div>
            </div>

            {/* Nombre */}
            <span className={`
              text-sm md:text-base font-semibold text-center w-24 md:w-32
              ${selectedCategory === category.slug ? 'text-verde-bosque' : 'text-gray-700'}
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
