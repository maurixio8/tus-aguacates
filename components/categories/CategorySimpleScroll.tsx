'use client';

import { useRef, useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

// Categorías extraídas del JSON master
const categories = [
  {
    id: 1,
    name: '🥑 Aguacates',
    slug: 'aguacates',
    icon: '🥑',
    image: '/categories/aguacates.jpg',
  },
  {
    id: 2,
    name: '🌿 Aromáticas y Zumos',
    slug: 'aromaticas-y-zumos',
    icon: '🌿',
    image: '/categories/aromaticas.jpg',
  },
  {
    id: 3,
    name: '🍯🥜 SALUDABLES',
    slug: 'saludables',
    icon: '🍯',
    image: '/categories/saludables.jpg',
  },
  {
    id: 4,
    name: '🥗🌱☘️ Especias',
    slug: 'especias',
    icon: '🥗',
    image: '/categories/especias.jpg',
  },
  {
    id: 5,
    name: '🍊🍎 Tropicales',
    slug: 'tropicales',
    icon: '🍊',
    image: '/categories/tropicales.jpg',
  },
  {
    id: 6,
    name: '🍓 Frutos Rojos',
    slug: 'frutos-rojos',
    icon: '🍓',
    image: '/categories/frutos-rojos.jpg',
  },
  {
    id: 7,
    name: '🌽 Desgranados',
    slug: 'desgranados',
    icon: '🌽',
    image: '/categories/desgranados.jpg',
  },
  {
    id: 8,
    name: '🍅🌽 Gourmet',
    slug: 'gourmet',
    icon: '🍅',
    image: '/categories/gourmet.jpg',
  },
];

export default function CategorySimpleScroll() {
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

  return (
    <div className="relative">
      {/* Botón izquierda - Desktop */}
      <button
        onClick={() => scroll('left')}
        className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white shadow-lg rounded-full p-2 hover:bg-gray-50"
      >
        <ChevronLeft className="w-6 h-6" />
      </button>

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
          >
            {/* Imagen */}
            <div className="relative w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden bg-gray-100 mb-2 group-hover:shadow-xl transition-all">
              <Image
                src={category.image}
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
            </div>

            {/* Nombre */}
            <span className="text-sm md:text-base font-semibold text-gray-700 text-center w-24 md:w-32">
              {category.name}
            </span>
          </Link>
        ))}
      </div>

      {/* Botón derecha - Desktop */}
      <button
        onClick={() => scroll('right')}
        className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white shadow-lg rounded-full p-2 hover:bg-gray-50"
      >
        <ChevronRight className="w-6 h-6" />
      </button>

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