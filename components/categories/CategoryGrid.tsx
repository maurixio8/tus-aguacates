'use client';

import Link from 'next/link';
import Image from 'next/image';

// Estructura de categorías con placeholders para imágenes
const categories = [
  {
    id: 1,
    name: 'Tubérculos',
    slug: 'tuberculos',
    icon: '🥔',
    image: '/categories/tuberculos.jpg', // Usuario subirá imagen aquí
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

export default function CategoryGrid() {
  return (
    <div className="grid grid-cols-3 md:grid-cols-6 gap-4 mb-12">
      {categories.map((category) => (
        <Link
          key={category.id}
          href={`/categoria/${category.slug}`}
          className="flex flex-col items-center group"
        >
          {/* Imagen de categoría */}
          <div className="relative w-full aspect-square rounded-lg overflow-hidden bg-gray-100 mb-2 group-hover:shadow-lg transition-shadow">
            <Image
              src={category.image}
              alt={category.name}
              fill
              className="object-cover group-hover:scale-105 transition-transform"
              unoptimized
              onError={(e) => {
                // Ocultar imagen si falla, mostrar fallback
                e.currentTarget.style.display = 'none';
              }}
            />
            {/* Fallback si no hay imagen */}
            <div className="absolute inset-0 flex items-center justify-center text-4xl bg-gray-100">
              {category.icon}
            </div>
          </div>

          {/* Nombre */}
          <span className="text-sm font-medium text-gray-700 text-center">
            {category.name}
          </span>
        </Link>
      ))}
    </div>
  );
}