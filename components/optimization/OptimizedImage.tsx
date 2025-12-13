'use client';

import Image from 'next/image';
import { useState } from 'react';
import { Loader2 } from 'lucide-react';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  fill?: boolean;
  sizes?: string;
  quality?: number;
  placeholder?: 'blur' | 'empty';
  blurDataURL?: string;
  onLoad?: () => void;
  onError?: () => void;
}

export function OptimizedImage({
  src,
  alt,
  width,
  height,
  className = '',
  priority = false,
  fill = false,
  sizes = '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
  quality = 75,
  placeholder = 'empty',
  blurDataURL,
  onLoad,
  onError,
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // Generar blur data URL para placeholder
  const generateBlurDataURL = () => {
    if (blurDataURL) return blurDataURL;
    // Generar un SVG placeholder simple
    const svg = `
      <svg width="${width || 400}" height="${height || 300}" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#f3f4f6"/>
        <rect width="100%" height="100%" fill="url(#placeholder)"/>
        <defs>
          <pattern id="placeholder" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
            <rect x="0" y="0" width="10" height="10" fill="#e5e7eb"/>
            <rect x="10" y="10" width="10" height="10" fill="#e5e7eb"/>
          </pattern>
        </defs>
      </svg>
    `;
    return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
  };

  const handleLoad = () => {
    setIsLoading(false);
    onLoad?.();
  };

  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
    onError?.();
  };

  // Imagen de fallback en caso de error
  if (hasError) {
    return (
      <div
        className={`flex items-center justify-center bg-gray-100 text-gray-400 ${className}`}
        style={fill ? undefined : { width, height }}
      >
        <span className="text-sm">Error al cargar imagen</span>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <Loader2 className="w-6 h-6 animate-spin text-verde-aguacate" />
        </div>
      )}

      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        fill={fill}
        sizes={sizes}
        quality={quality}
        priority={priority}
        placeholder={placeholder}
        blurDataURL={placeholder === 'blur' ? generateBlurDataURL() : undefined}
        className={`
          transition-opacity duration-300
          ${isLoading ? 'opacity-0' : 'opacity-100'}
          ${className}
        `}
        onLoad={handleLoad}
        onError={handleError}
        // Optimizaciones adicionales
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
      />
    </div>
  );
}

// Componente para productos con imágenes optimizadas
export function ProductImage({
  src,
  alt,
  className = '',
  priority = false
}: Omit<OptimizedImageProps, 'sizes' | 'quality' | 'placeholder'>) {
  return (
    <OptimizedImage
      src={src}
      alt={alt}
      width={300}
      height={300}
      className={className}
      priority={priority}
      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 300px"
      quality={80}
      placeholder="blur"
    />
  );
}

// Componente para imágenes de categorías
export function CategoryImage({
  src,
  alt,
  className = '',
  priority = false
}: Omit<OptimizedImageProps, 'sizes' | 'quality' | 'placeholder'>) {
  return (
    <OptimizedImage
      src={src}
      alt={alt}
      width={120}
      height={120}
      className={className}
      priority={priority}
      sizes="120px"
      quality={75}
      placeholder="blur"
    />
  );
}