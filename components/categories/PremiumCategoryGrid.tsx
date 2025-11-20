'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Sparkles } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface Category {
  id: string;
  name: string;
  slug: string;
  image_url?: string;
  description?: string;
  sort_order?: number;
}

// Imágenes de placeholder premium con gradientes
const categoryPlaceholders = {
  'aguacates': {
    gradient: 'from-green-400 via-emerald-500 to-green-600',
    emoji: '🥑',
    fallback: 'https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?w=400&h=400&fit=crop'
  },
  'frutas-tropicales': {
    gradient: 'from-orange-400 via-red-500 to-pink-600',
    emoji: '🍊',
    fallback: 'https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=400&h=400&fit=crop'
  },
  'frutos-rojos': {
    gradient: 'from-red-400 via-pink-500 to-rose-600',
    emoji: '🍓',
    fallback: 'https://images.unsplash.com/photo-1464965911861-746a04b4bca6?w=400&h=400&fit=crop'
  },
  'aromaticas': {
    gradient: 'from-green-400 via-teal-500 to-emerald-600',
    emoji: '🌿',
    fallback: 'https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?w=400&h=400&fit=crop'
  },
  'saludables': {
    gradient: 'from-lime-400 via-green-500 to-emerald-600',
    emoji: '🥗',
    fallback: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=400&h=400&fit=crop'
  },
  'especias': {
    gradient: 'from-yellow-400 via-amber-500 to-orange-600',
    emoji: '🌶️',
    fallback: 'https://images.unsplash.com/photo-1596040033229-a0b13f84e434?w=400&h=400&fit=crop'
  },
  'desgranados': {
    gradient: 'from-yellow-300 via-amber-400 to-yellow-600',
    emoji: '🌽',
    fallback: 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?w=400&h=400&fit=crop'
  },
  'gourmet': {
    gradient: 'from-purple-400 via-pink-500 to-red-600',
    emoji: '🍅',
    fallback: 'https://images.unsplash.com/photo-1506368249639-73a05d6f6488?w=400&h=400&fit=crop'
  },
  'productos-nuevos': {
    gradient: 'from-blue-400 via-indigo-500 to-purple-600',
    emoji: '✨',
    fallback: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&h=400&fit=crop'
  },
  'navidad': {
    gradient: 'from-red-500 via-green-500 to-red-600',
    emoji: '🎄',
    fallback: 'https://images.unsplash.com/photo-1512909006721-3d6018887383?w=400&h=400&fit=crop'
  }
};

export default function PremiumCategoryGrid() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (!error && data) {
        setCategories(data);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPlaceholder = (slug: string) => {
    return categoryPlaceholders[slug as keyof typeof categoryPlaceholders] || {
      gradient: 'from-gray-400 via-gray-500 to-gray-600',
      emoji: '📦',
      fallback: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&h=400&fit=crop'
    };
  };

  const handleImageError = (categoryId: string) => {
    setImageErrors(prev => new Set([...prev, categoryId]));
  };

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 mb-12">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="aspect-square rounded-2xl bg-gradient-to-br from-gray-200 to-gray-300 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="mb-12">
      {/* Título de sección */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-verde-aguacate-500" />
            Explora Nuestras Categorías
          </h2>
          <p className="text-gray-600 mt-1">Productos frescos y de calidad premium</p>
        </div>
      </div>

      {/* Grid de categorías */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
        {categories.map((category) => {
          const placeholder = getPlaceholder(category.slug);
          const hasError = imageErrors.has(category.id);
          const imageUrl = category.image_url && !hasError ? category.image_url : placeholder.fallback;

          return (
            <Link
              key={category.id}
              href={`/tienda/${category.slug}`}
              className="group relative aspect-square rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1"
            >
              {/* Imagen de fondo */}
              <div className="absolute inset-0">
                <Image
                  src={imageUrl}
                  alt={category.name}
                  fill
                  className="object-cover group-hover:scale-110 transition-transform duration-500"
                  onError={() => handleImageError(category.id)}
                  unoptimized
                />
              </div>

              {/* Overlay con gradiente */}
              <div className={`absolute inset-0 bg-gradient-to-br ${placeholder.gradient} opacity-60 group-hover:opacity-50 transition-opacity duration-300`} />

              {/* Contenido */}
              <div className="relative h-full flex flex-col items-center justify-center p-4 text-white">
                {/* Emoji/Icono grande */}
                <div className="text-5xl md:text-6xl mb-3 transform group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 drop-shadow-lg">
                  {placeholder.emoji}
                </div>

                {/* Nombre de categoría */}
                <h3 className="text-base md:text-lg font-bold text-center drop-shadow-md">
                  {category.name}
                </h3>

                {/* Descripción (solo en hover en pantallas grandes) */}
                {category.description && (
                  <p className="hidden md:block text-xs text-center mt-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300 drop-shadow">
                    {category.description}
                  </p>
                )}
              </div>

              {/* Badge "Ver más" en hover */}
              <div className="absolute inset-x-0 bottom-0 p-4 flex justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="bg-white text-gray-900 px-4 py-2 rounded-full text-sm font-semibold shadow-xl">
                  Ver productos →
                </div>
              </div>

              {/* Efecto de brillo en hover */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-20 bg-gradient-to-tr from-white via-transparent to-transparent transition-opacity duration-300" />
            </Link>
          );
        })}
      </div>

      {/* Footer decorativo */}
      <div className="mt-8 text-center">
        <p className="text-sm text-gray-500">
          Todos nuestros productos son cuidadosamente seleccionados para garantizar la mejor calidad
        </p>
      </div>
    </div>
  );
}
