'use client';

import { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

const categories = [
  {
    id: 1,
    name: 'Tubérculos',
    slug: 'tuberculos',
    icon: '🥔',
    image: '/categories/tuberculos.jpg',
  },
  {
    id: 2,
    name: 'Saludables',
    slug: 'saludables',
    icon: '🥗',
    image: '/categories/saludables.jpg',
  },
  {
    id: 3,
    name: 'Frutas',
    slug: 'frutas',
    icon: '🍎',
    image: '/categories/frutas.jpg',
  },
  {
    id: 4,
    name: 'Aguacates',
    slug: 'aguacates',
    icon: '🥑',
    image: '/categories/aguacates.jpg',
  },
  {
    id: 5,
    name: 'Verduras',
    slug: 'verduras',
    icon: '🥬',
    image: '/categories/verduras.jpg',
  },
  {
    id: 6,
    name: 'Combos',
    slug: 'combos',
    icon: '🎁',
    image: '/categories/combos.jpg',
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
            href={`/categoria/${category.slug}`}
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