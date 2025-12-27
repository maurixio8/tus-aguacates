'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { ProductCard } from '@/components/product/ProductCard';
import { UnifiedProduct } from '@/lib/types';

interface FeaturedProductsCarouselProps {
  autoPlay?: boolean;
  interval?: number;
  showDots?: boolean;
  showArrows?: boolean;
  maxProducts?: number;
  className?: string;
}

// Cache para productos
let productsCache: UnifiedProduct[] | null = null;
let lastFetchTime = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

export function FeaturedProductsCarousel({
  autoPlay = true,
  interval = 3500,
  showDots = true,
  showArrows = true,
  maxProducts = 8,
  className = ''
}: FeaturedProductsCarouselProps) {
  const [products, setProducts] = useState<UnifiedProduct[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Número de productos visibles según el tamaño de pantalla
  const getItemsPerPage = () => {
    if (typeof window === 'undefined') return 4;
    if (window.innerWidth < 768) return 1;
    if (window.innerWidth < 1024) return 2;
    return 4;
  };

  const [itemsPerPage, setItemsPerPage] = useState(4);

  // Actualizar itemsPerPage cuando cambia el tamaño de ventana
  useEffect(() => {
    const handleResize = () => {
      setItemsPerPage(getItemsPerPage());
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Cargar productos populares
  useEffect(() => {
    async function loadProducts() {
      try {
        setLoading(true);

        // Verificar cache
        const now = Date.now();
        if (productsCache && (now - lastFetchTime) < CACHE_DURATION) {
          setProducts(productsCache);
          setLoading(false);
          return;
        }

        // Obtener productos ordenados por popularidad (rating y review_count)
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .eq('is_active', true)
          .order('rating', { ascending: false })
          .order('review_count', { ascending: false })
          .limit(maxProducts);

        if (error) {
          console.error('Error fetching popular products:', error);
          setProducts([]);
        } else {
          productsCache = data || [];
          lastFetchTime = now;
          setProducts(data || []);
        }
      } catch (error) {
        console.error('Error loading products:', error);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    }

    loadProducts();
  }, [maxProducts]);

  // Auto-play con pausa al hover
  useEffect(() => {
    if (!autoPlay || products.length <= itemsPerPage || isPaused) return;

    const maxIndex = Math.max(0, products.length - itemsPerPage);
    const slideInterval = setInterval(() => {
      setCurrentIndex((prevIndex) =>
        prevIndex >= maxIndex ? 0 : prevIndex + 1
      );
    }, interval);

    return () => clearInterval(slideInterval);
  }, [autoPlay, interval, products.length, itemsPerPage, isPaused]);

  const goToPrevious = useCallback(() => {
    const maxIndex = Math.max(0, products.length - itemsPerPage);
    setCurrentIndex((prevIndex) =>
      prevIndex === 0 ? maxIndex : prevIndex - 1
    );
  }, [products.length, itemsPerPage]);

  const goToNext = useCallback(() => {
    const maxIndex = Math.max(0, products.length - itemsPerPage);
    setCurrentIndex((prevIndex) =>
      prevIndex >= maxIndex ? 0 : prevIndex + 1
    );
  }, [products.length, itemsPerPage]);

  const goToSlide = useCallback((index: number) => {
    setCurrentIndex(index);
  }, []);

  // Calcular el número máximo de páginas/dots
  const maxIndex = Math.max(0, products.length - itemsPerPage);
  const totalDots = Math.max(1, products.length - itemsPerPage + 1);

  // Si no hay suficientes productos para carrusel, mostrar grid
  if (!loading && products.length <= itemsPerPage) {
    return (
      <div className={className}>
        {products.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.map((product) => (
              <div key={product.id} className="flex items-center justify-center">
                <div className="w-full max-w-[280px]">
                  <ProductCard product={product} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500">No hay productos disponibles en este momento.</p>
          </div>
        )}
      </div>
    );
  }

  // Skeleton de carga
  if (loading) {
    return (
      <div className={className}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(itemsPerPage)].map((_, i) => (
            <div key={i} className="flex items-center justify-center">
              <div className="w-full max-w-[280px] animate-pulse">
                <div className="bg-gray-200 rounded-2xl h-64 mb-4"></div>
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className={className}>
        <div className="text-center py-12">
          <p className="text-gray-500">No hay productos disponibles en este momento.</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={className}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="relative" ref={containerRef}>
        {/* Carrusel Container */}
        <div className="overflow-hidden">
          <div
            className="flex transition-transform duration-500 ease-in-out"
            style={{
              transform: `translateX(-${currentIndex * (100 / itemsPerPage)}%)`,
            }}
          >
            {products.map((product) => (
              <div
                key={product.id}
                className="flex-shrink-0 px-2 flex items-center justify-center"
                style={{ width: `${100 / itemsPerPage}%` }}
              >
                <div className="w-full max-w-[280px]">
                  <ProductCard product={product} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Flechas de navegación */}
        {showArrows && products.length > itemsPerPage && (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation();
                goToPrevious();
              }}
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 bg-white hover:bg-gray-50 text-gray-800 p-2 rounded-full shadow-lg transition-all duration-200 hover:scale-110 z-10"
              aria-label="Anterior"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                goToNext();
              }}
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 bg-white hover:bg-gray-50 text-gray-800 p-2 rounded-full shadow-lg transition-all duration-200 hover:scale-110 z-10"
              aria-label="Siguiente"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}
      </div>

      {/* Indicadores (dots) */}
      {showDots && products.length > itemsPerPage && (
        <div className="flex justify-center gap-2 mt-6">
          {Array.from({ length: totalDots }).map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`h-2 rounded-full transition-all duration-200 ${
                index === currentIndex
                  ? 'bg-verde-aguacate w-8'
                  : 'bg-gray-300 hover:bg-gray-400 w-2'
              }`}
              aria-label={`Ir al grupo ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
