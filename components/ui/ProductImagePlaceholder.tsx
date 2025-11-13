'use client';

import React from 'react';
import Image from 'next/image';

interface ProductImagePlaceholderProps {
  productName: string;
  price: number;
  category?: string;
  width?: number;
  height?: number;
  className?: string;
  imageUrl?: string | null;
  showPrice?: boolean;
  priority?: boolean;
}

/**
 * Componente Placeholder para Imágenes de Productos
 *
 * Características:
 * - Colores dinámicos por tipo de aguacate
 * - Emoji 🥑 grande (text-6xl)
 * - Initials (2 primeras letras del nombre)
 * - Responsive para mobile + desktop
 * - Hover animation (scale-105)
 * - Fallback a imagen real si existe
 * - TypeScript strict
 * - Tailwind CSS
 */
export function ProductImagePlaceholder({
  productName,
  price,
  category = 'aguacates',
  width = 300,
  height = 300,
  className = '',
  imageUrl,
  showPrice = true,
  priority = false
}: ProductImagePlaceholderProps) {
  const [imageError, setImageError] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);

  // Reset states when imageUrl changes
  React.useEffect(() => {
    setImageError(false);
    setIsLoading(true);
  }, [imageUrl]);

  // Obtener iniciales del nombre del producto
  const getInitials = (name: string): string => {
    if (!name || typeof name !== 'string') {
      return 'PR'; // Default fallback seguro
    }
    const words = name.trim().split(' ');
    if (words.length >= 2) {
      return (words[0][0] + words[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  // Determinar colores según el nombre del producto
  const getAvocadoColors = (name: string) => {
    if (!name || typeof name !== 'string') {
      return {
        gradient: 'from-green-600 to-green-500',
        bgLight: 'bg-green-50',
        textLight: 'text-green-700'
      };
    }
    const normalizedName = name.toLowerCase();

    if (normalizedName.includes('hass') || normalizedName.includes('dark')) {
      return {
        gradient: 'from-green-900 to-green-700',
        bgLight: 'bg-green-100',
        textLight: 'text-green-800'
      };
    }

    if (normalizedName.includes('fuerte') || normalizedName.includes('strong') || normalizedName.includes('medio')) {
      return {
        gradient: 'from-green-800 to-green-600',
        bgLight: 'bg-green-50',
        textLight: 'text-green-900'
      };
    }

    // Default para otros tipos
    return {
      gradient: 'from-green-600 to-green-500',
      bgLight: 'bg-green-50',
      textLight: 'text-green-700'
    };
  };

  const colors = getAvocadoColors(productName);
  const initials = getInitials(productName);

  const handleImageError = () => {
    setImageError(true);
    setIsLoading(false);
  };

  const handleImageLoad = () => {
    setIsLoading(false);
  };

  // Si hay imagen real y no hay error, mostrar la imagen real
  if (imageUrl && !imageError) {
    return (
      <div className={`relative group ${className}`} style={{ width, height }}>
        {/* Loading placeholder */}
        {isLoading && (
          <div className="absolute inset-0 bg-gray-100 animate-pulse rounded-xl">
            <div className="absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-300 opacity-50 rounded-xl" />
          </div>
        )}

        {/* Imagen real */}
        <div className={`relative overflow-hidden rounded-xl ${isLoading ? 'opacity-0' : 'opacity-100'} transition-all duration-300 transform group-hover:scale-105`}>
          <Image
            src={imageUrl}
            alt={productName}
            width={width}
            height={height}
            className="object-cover"
            priority={priority}
            onError={handleImageError}
            onLoad={handleImageLoad}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        </div>

        {/* Loading spinner */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center rounded-xl">
            <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* Overlay con precio */}
        {showPrice && (
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 via-black/50 to-transparent p-3 rounded-b-xl">
            <div className="text-right">
              <p className="text-white font-bold text-sm sm:text-base">
                ${price.toLocaleString('es-CO')}
              </p>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Mostrar placeholder
  return (
    <div
      className={`relative group overflow-hidden rounded-xl transition-all duration-300 transform hover:scale-105 ${className}`}
      style={{ width, height }}
    >
      {/* Gradiente de fondo dinámico */}
      <div className={`absolute inset-0 bg-gradient-to-br ${colors.gradient}`} />

      {/* Patrón de fondo sutil */}
      <div className="absolute inset-0 opacity-20">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.3'%3E%3Cpath d='M30 30c0-8.3-6.7-15-15-15s-15 6.7-15 15 6.7 15 15 15 15-6.7 15-15zm15 0c0-8.3-6.7-15-15-15s-15 6.7-15 15 6.7 15 15 15 15-6.7 15-15z'/%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
      </div>

      {/* Contenido principal */}
      <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-white">
        {/* Emoji grande */}
        <div className="text-6xl sm:text-7xl mb-4 filter drop-shadow-lg animate-pulse">
          🥑
        </div>

        {/* Initials del producto */}
        <div className="text-2xl sm:text-3xl font-bold mb-2 bg-white/20 backdrop-blur-sm rounded-full w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center border-2 border-white/30">
          {initials}
        </div>

        {/* Nombre del producto */}
        <div className="text-center mb-3 px-2">
          <p className="text-xs sm:text-sm font-semibold text-white/95 drop-shadow-md line-clamp-2">
            {productName}
          </p>
        </div>

        {/* Badge de categoría */}
        <div className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs font-medium text-white/90 capitalize">
          {category.replace('_', ' ')}
        </div>
      </div>

      {/* Efectos visuales */}
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
      <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
      <div className="absolute inset-0 rounded-xl border border-white/20" />

      {/* Overlay con precio */}
      {showPrice && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 via-black/50 to-transparent p-3 rounded-b-xl">
          <div className="text-right">
            <p className="text-white font-bold text-sm sm:text-base">
              ${price.toLocaleString('es-CO')}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}