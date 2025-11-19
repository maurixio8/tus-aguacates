'use client';

import { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Promotion {
  id: string;
  title: string;
  description?: string;
  image_url: string;
  link?: string;
  sort_order: number;
}

interface PromotionSliderProps {
  autoPlay?: boolean;
  interval?: number;
  showDots?: boolean;
  showArrows?: boolean;
  className?: string;
}

export default function PromotionSlider({
  autoPlay = true,
  interval = 5000,
  showDots = true,
  showArrows = true,
  className = ''
}: PromotionSliderProps) {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  // Sample promotions as fallback
  const fallbackPromotions: Promotion[] = [
    {
      id: '1',
      title: 'Aguacates Frescos',
      description: 'Directamente del campo a tu mesa',
      image_url: 'https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?w=1200&h=400&fit=crop',
      link: '/tienda/aguacates',
      sort_order: 1
    },
    {
      id: '2',
      title: 'Frutas Tropicales',
      description: 'El sabor exótico que buscas',
      image_url: 'https://images.unsplash.com/photo-1550258987-190a2d41a8ba?w=1200&h=400&fit=crop',
      link: '/tienda/frutas-tropicales',
      sort_order: 2
    },
    {
      id: '3',
      title: 'Envío Gratis',
      description: 'En pedidos mayores a $68.900',
      image_url: 'https://images.unsplash.com/photo-1604386494523-d60f124d0a65?w=1200&h=400&fit=crop',
      link: '/tienda',
      sort_order: 3
    }
  ];

  useEffect(() => {
    loadPromotions();
  }, []);

  useEffect(() => {
    if (!autoPlay || promotions.length <= 1) return;

    const slideInterval = setInterval(() => {
      setCurrentIndex((prevIndex) =>
        prevIndex === promotions.length - 1 ? 0 : prevIndex + 1
      );
    }, interval);

    return () => clearInterval(slideInterval);
  }, [autoPlay, interval, promotions.length]);

  const loadPromotions = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/promotions/active');

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success && data.promotions.length > 0) {
        setPromotions(data.promotions);
      } else {
        // Use fallback promotions if API fails or returns empty
        console.warn('API returned empty or invalid data, using fallback promotions');
        setPromotions(fallbackPromotions);
      }
    } catch (error) {
      console.error('Error loading promotions:', error);
      // Use fallback promotions on error
      console.log('Using fallback promotions due to API error');
      setPromotions(fallbackPromotions);
    } finally {
      setLoading(false);
    }
  };

  const goToSlide = useCallback((index: number) => {
    setCurrentIndex(index);
  }, []);

  const goToPrevious = useCallback(() => {
    setCurrentIndex((prevIndex) =>
      prevIndex === 0 ? promotions.length - 1 : prevIndex - 1
    );
  }, [promotions.length]);

  const goToNext = useCallback(() => {
    setCurrentIndex((prevIndex) =>
      prevIndex === promotions.length - 1 ? 0 : prevIndex + 1
    );
  }, [promotions.length]);

  const handleSlideClick = (promotion: Promotion) => {
    if (promotion.link) {
      window.location.href = promotion.link;
    }
  };

  if (loading) {
    return (
      <div className="relative w-full h-48 sm:h-64 md:h-80 lg:h-96 bg-gray-100 animate-pulse rounded-2xl overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-gray-100 to-gray-200"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-gray-400">Cargando promociones...</div>
        </div>
      </div>
    );
  }

  if (promotions.length === 0) {
    return (
      <div className="relative w-full h-48 sm:h-64 md:h-80 lg:h-96 bg-gray-100 rounded-2xl overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-green-100 to-yellow-100"></div>
        <div className="absolute inset-0 flex flex-col items-center justify-center p-6">
          <div className="text-center">
            <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-2">Aguacates Frescos</h2>
            <p className="text-gray-600 text-sm md:text-base">Directamente del campo a tu mesa</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative w-full ${className}`}>
      {/* Slider Container */}
      <div className="relative h-48 sm:h-64 md:h-80 lg:h-96 overflow-hidden rounded-2xl bg-gray-200">
        {/* Slides */}
        <div
          className="flex transition-transform duration-500 ease-in-out h-full"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {promotions.map((promotion) => (
            <div
              key={promotion.id}
              className="w-full flex-shrink-0 relative cursor-pointer group"
              onClick={() => handleSlideClick(promotion)}
            >
              {/* Fallback background */}
              <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-yellow-400">
                <div className="absolute inset-0 bg-black/20"></div>
              </div>

              {/* Image */}
              <img
                src={promotion.image_url}
                alt={promotion.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  // Use fallback image if promotion image fails
                  const fallback = fallbackPromotions[parseInt(promotion.id) - 1] || fallbackPromotions[0];
                  e.currentTarget.src = fallback.image_url;
                }}
                loading="lazy"
              />

              {/* Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent">
                <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 md:p-8">
                  <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-white mb-1 sm:mb-2 line-clamp-2">
                    {promotion.title}
                  </h2>
                  {promotion.description && (
                    <p className="text-white/90 text-xs sm:text-sm md:text-base max-w-xs sm:max-w-md line-clamp-2 sm:line-clamp-3">
                      {promotion.description}
                    </p>
                  )}
                  {promotion.link && (
                    <button className="mt-2 sm:mt-3 md:mt-4 bg-gradient-to-r from-yellow-400 to-yellow-600 hover:from-yellow-500 hover:to-yellow-700 text-verde-bosque-700 font-bold px-3 sm:px-4 md:px-6 py-1.5 sm:py-2 rounded-lg transition-all transform hover:scale-105 text-xs sm:text-sm md:text-base">
                      Ver Más
                    </button>
                  )}
                </div>
              </div>

              {/* Hover effect */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all duration-300"></div>
            </div>
          ))}
        </div>

        {/* Navigation Arrows */}
        {showArrows && promotions.length > 1 && (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation();
                goToPrevious();
              }}
              className="absolute left-1 sm:left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 p-1.5 sm:p-2 rounded-full shadow-lg transition-all duration-200 hover:scale-110 z-10"
              aria-label="Previous slide"
            >
              <ChevronLeft className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                goToNext();
              }}
              className="absolute right-1 sm:right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 p-1.5 sm:p-2 rounded-full shadow-lg transition-all duration-200 hover:scale-110 z-10"
              aria-label="Next slide"
            >
              <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5" />
            </button>
          </>
        )}
      </div>

      {/* Dots Indicator */}
      {showDots && promotions.length > 1 && (
        <div className="flex justify-center gap-1.5 sm:gap-2 mt-3 sm:mt-4">
          {promotions.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`h-1.5 sm:h-2 rounded-full transition-all duration-200 ${
                index === currentIndex
                  ? 'bg-verde-aguacate w-4 sm:w-6 md:w-8'
                  : 'bg-gray-300 hover:bg-gray-400 w-1.5 sm:w-2'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}