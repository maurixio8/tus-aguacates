'use client';

import { Heart } from 'lucide-react';
import { useFavoritesStore } from '@/lib/favorites-store';
import { useState } from 'react';

interface FavoriteButtonProps {
  productId: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showLabel?: boolean;
}

export default function FavoriteButton({
  productId,
  size = 'md',
  className = '',
  showLabel = false,
}: FavoriteButtonProps) {
  const { isFavorite, toggleFavorite } = useFavoritesStore();
  const [isAnimating, setIsAnimating] = useState(false);
  const favorite = isFavorite(productId);

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    setIsAnimating(true);
    toggleFavorite(productId);

    setTimeout(() => setIsAnimating(false), 300);
  };

  return (
    <button
      onClick={handleClick}
      className={`
        ${sizeClasses[size]}
        flex items-center justify-center gap-2
        rounded-full
        transition-all duration-200
        ${favorite
          ? 'bg-red-50 text-red-500 hover:bg-red-100'
          : 'bg-white/90 text-gray-400 hover:text-red-500 hover:bg-white'
        }
        shadow-sm hover:shadow
        ${isAnimating ? 'scale-125' : 'scale-100'}
        ${className}
      `}
      title={favorite ? 'Quitar de favoritos' : 'Agregar a favoritos'}
      aria-label={favorite ? 'Quitar de favoritos' : 'Agregar a favoritos'}
    >
      <Heart
        className={`
          ${iconSizes[size]}
          transition-all duration-200
          ${favorite ? 'fill-current' : ''}
          ${isAnimating ? 'animate-pulse' : ''}
        `}
      />
      {showLabel && (
        <span className="text-sm font-medium">
          {favorite ? 'En favoritos' : 'Favorito'}
        </span>
      )}
    </button>
  );
}
