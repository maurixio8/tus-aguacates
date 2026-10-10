'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Image as ImageIcon, Pause, Play } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { OptimizedImage } from '@/components/optimization/OptimizedImage';

// Interface para categorías unificadas
interface UnifiedCategory {
  id: string;
  name: string;
  slug: string;
  icon: string;
  image?: string;
  description?: string;
  productCount?: number;
  color?: string;
}

interface UnifiedCategoriesProps {
  variant?: 'scroll' | 'grid' | 'simple';
  selectedCategory?: string;
  onCategoryChange?: (slug: string) => void;
  showProductCount?: boolean;
  maxItems?: number;
  baseHref?: string; // Base path for category links (default: '/tienda')
  autoScroll?: boolean;
}

// Mapeo unificado de categorías (sincronizado con productos-master.json)
// ✅ Estas 8 categorías coinciden exactamente con las del JSON
const UNIFIED_CATEGORIES: UnifiedCategory[] = [
  {
    id: 'cat-1',
    name: 'Aguacates',
    slug: 'aguacates',
    icon: '🥑',
    image: '/categories/aguacates.jpg',
    description: 'Aguacates frescos de la mejor calidad',
    color: 'from-green-500 to-green-700'
  },
  {
    id: 'cat-ofertas',
    name: 'Ofertas y Combos',
    slug: 'ofertas-combos',
    icon: '🔥',
    image: '/categories/ofertas.jpg',
    description: 'Combos especiales y ofertas del día',
    color: 'from-red-500 to-orange-500'
  },
  {
    id: 'cat-2',
    name: 'Frutas Tropicales',
    slug: 'frutas-tropicales',
    icon: '🍊',
    image: '/categories/tropicales.jpg',
    description: 'Frutas exóticas y tropicales',
    color: 'from-orange-500 to-red-600'
  },
  {
    id: 'cat-3',
    name: 'Frutos Rojos',
    slug: 'frutos-rojos',
    icon: '🍓',
    image: '/categories/frutos-rojos.jpg',
    description: 'Deliciosas frutas rojas y bayas',
    color: 'from-red-500 to-pink-600'
  },
  {
    id: 'cat-4',
    name: 'Aromáticas',
    slug: 'aromaticas',
    icon: '🌿',
    image: '/categories/aromaticas.jpg',
    description: 'Hierbas aromáticas frescas',
    color: 'from-emerald-500 to-teal-600'
  },
  {
    id: 'cat-5',
    name: 'Saludables',
    slug: 'saludables',
    icon: '🥗',
    image: '/categories/saludables.jpg',
    description: 'Productos naturales y saludables',
    color: 'from-emerald-500 to-teal-600'
  },
  {
    id: 'cat-6',
    name: 'Especias',
    slug: 'especias',
    icon: '🥗🌱☘️',
    image: '/categories/especias.jpg',
    description: 'Especias y condimentos naturales',
    color: 'from-yellow-500 to-orange-600'
  },
  {
    id: 'cat-7',
    name: 'Desgranados',
    slug: 'desgranados',
    icon: '🌽',
    image: '/categories/desgranados.jpg',
    description: 'Productos desgranados frescos',
    color: 'from-yellow-400 to-amber-600'
  },
  {
    id: 'cat-8',
    name: 'Gourmet',
    slug: 'gourmet',
    icon: '🍅🌽',
    image: '/categories/gourmet.jpg',
    description: 'Productos gourmet premium',
    color: 'from-red-500 to-orange-700'
  },
  {
    id: 'cat-9',
    name: 'Productos Nuevos',
    slug: 'productos-nuevos',
    icon: '✨',
    image: '/categories/gourmet.jpg',
    description: 'Últimos productos agregados a nuestra tienda',
    color: 'from-purple-500 to-pink-600'
  }
];

export default function UnifiedCategories({
  variant = 'scroll',
  selectedCategory,
  onCategoryChange,
  showProductCount = false,
  maxItems = 8,
  baseHref = '/tienda',
  autoScroll = false
}: UnifiedCategoriesProps) {
  const [categories, setCategories] = useState<UnifiedCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAutoScrollPaused, setIsAutoScrollPaused] = useState(false);
  const [isMotionEnabled, setIsMotionEnabled] = useState(false);
  const [loopCopies, setLoopCopies] = useState(1);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [motionPreferenceReady, setMotionPreferenceReady] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const firstSequenceRef = useRef<HTMLDivElement>(null);
  const interactionPausedRef = useRef(false);
  const manualPauseUntilRef = useRef(0);

  // Cargar categorías desde Supabase (DB es la fuente principal)
  useEffect(() => {
    const loadCategories = async () => {
      try {
        setLoading(true);

        const { data: supabaseCategories, error } = await supabase
          .from('categories')
          .select('id, name, slug, image_url, description, sort_order, is_active')
          .eq('is_active', true)
          .order('sort_order', { ascending: true })
          .limit(maxItems);

        if (!error && supabaseCategories && supabaseCategories.length > 0) {
          // Mapeo de slug a imagen local para fallback
          const localImageMap: Record<string, string> = {
            'aguacates': '/categories/aguacates.jpg',
            'ofertas-combos': '/categories/gourmet.jpg',
            'frutas-tropicales': '/categories/tropicales.jpg',
            'frutos-rojos': '/categories/frutos-rojos.jpg',
            'aromaticas': '/categories/aromaticas.jpg',
            'saludables': '/categories/saludables.jpg',
            'especias': '/categories/especias.jpg',
            'desgranados': '/categories/desgranados.jpg',
            'gourmet': '/categories/gourmet.jpg',
            'productos-nuevos': '/categories/gourmet.jpg',
          };

          // Convertir datos de Supabase al formato UnifiedCategory
          const formattedCategories: UnifiedCategory[] = supabaseCategories.map(cat => ({
            id: cat.id,
            name: cat.name,
            slug: cat.slug,
            icon: '', // Las imágenes reemplazan los íconos
            // Usar image_url de Supabase, o fallback a imagen local basada en slug
            image: cat.image_url || localImageMap[cat.slug] || undefined,
            description: cat.description || undefined,
            color: 'from-verde-aguacate to-verde-bosque' // Color por defecto
          }));

          setCategories([
            {
              id: 'virtual-promociones',
              name: 'Promociones',
              slug: 'promociones',
              icon: '✨',
              image: '/categories/ofertas.jpg',
              description: 'Productos destacados y ofertas de la semana',
              color: 'from-yellow-500 to-orange-600'
            },
            ...formattedCategories.filter(category => category.slug !== 'promociones')
          ].slice(0, maxItems));
        } else if (!error) {
          // Si no hay error pero tampoco hay categorías, usar fallback
          console.log('⚠️ No hay categorías activas en la base de datos');
          setCategories(UNIFIED_CATEGORIES.slice(0, maxItems));
        } else {
          // Si hay error, usar fallback
          console.error('Error loading categories from Supabase:', error);
          setCategories(UNIFIED_CATEGORIES.slice(0, maxItems));
        }
      } catch (error) {
        console.log('⚠️ Error loading categories, using fallback:', error);
        setCategories(UNIFIED_CATEGORIES.slice(0, maxItems));
      } finally {
        setLoading(false);
      }
    };

    loadCategories();
  }, [maxItems]);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const updatePreference = (event: MediaQueryListEvent) => setPrefersReducedMotion(event.matches);

    setPrefersReducedMotion(mediaQuery.matches);
    setMotionPreferenceReady(true);
    mediaQuery.addEventListener('change', updatePreference);
    return () => mediaQuery.removeEventListener('change', updatePreference);
  }, []);

  useEffect(() => {
    if (variant !== 'scroll' || !autoScroll || categories.length < 2 || !motionPreferenceReady || (prefersReducedMotion && !isMotionEnabled) || isAutoScrollPaused) {
      return;
    }

    const viewport = scrollRef.current;
    const firstSequence = firstSequenceRef.current;
    if (!viewport || !firstSequence) return;

    let frameId = 0;
    let lastTimestamp = 0;
    let sequenceWidth = firstSequence.scrollWidth;
    let fractionalRemainder = 0;
    let isInViewport = true;
    const updateSequenceWidth = () => {
      sequenceWidth = firstSequence.scrollWidth;
      const requiredCopies = sequenceWidth > 0 && viewport.clientWidth > 0
        ? Math.ceil(viewport.clientWidth / sequenceWidth) + 1
        : 1;
      setLoopCopies((currentCopies) => currentCopies === requiredCopies ? currentCopies : requiredCopies);
    };
    const resizeObserver = typeof ResizeObserver !== 'undefined'
      ? new ResizeObserver(updateSequenceWidth)
      : null;
    resizeObserver?.observe(firstSequence);
    resizeObserver?.observe(viewport);
    const intersectionObserver = typeof IntersectionObserver !== 'undefined'
      ? new IntersectionObserver(([entry]) => { isInViewport = entry?.isIntersecting ?? true; })
      : null;
    intersectionObserver?.observe(viewport);
    window.addEventListener('resize', updateSequenceWidth);
    updateSequenceWidth();

    const animate = (timestamp: number) => {
      if (lastTimestamp > 0) {
        const elapsed = Math.min(timestamp - lastTimestamp, 50);
        const interactionPaused = interactionPausedRef.current || timestamp < manualPauseUntilRef.current;

        if (!document.hidden && isInViewport && !interactionPaused) {
          const accumulatedPixels = elapsed * 0.025 + fractionalRemainder;
          const wholePixels = Math.floor(accumulatedPixels);
          fractionalRemainder = accumulatedPixels - wholePixels;

          if (wholePixels > 0) {
            viewport.scrollLeft += wholePixels;
            if (sequenceWidth > 0 && viewport.scrollLeft >= sequenceWidth) {
              viewport.scrollLeft %= sequenceWidth;
            }
          }
        } else {
          fractionalRemainder = 0;
        }
      }

      lastTimestamp = timestamp;
      frameId = window.requestAnimationFrame(animate);
    };

    frameId = window.requestAnimationFrame(animate);
    return () => {
      window.cancelAnimationFrame(frameId);
      resizeObserver?.disconnect();
      intersectionObserver?.disconnect();
      window.removeEventListener('resize', updateSequenceWidth);
    };
  }, [autoScroll, categories.length, isAutoScrollPaused, isMotionEnabled, motionPreferenceReady, prefersReducedMotion, variant]);

  const handleCategoryClick = (category: UnifiedCategory) => {
    if (onCategoryChange) {
      onCategoryChange(category.slug);
    }
  };

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 300;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  if (loading) {
    return <CategorySkeleton variant={variant} />;
  }

  // Variante Scroll (para Home y tiendas)
  if (variant === 'scroll') {
    const shouldLoopCategories = autoScroll && categories.length > 1 && motionPreferenceReady && (!prefersReducedMotion || isMotionEnabled);
    const needsMotionOptIn = prefersReducedMotion && !isMotionEnabled;
    const isMotionRunning = !needsMotionOptIn && !isAutoScrollPaused;
    const renderCategoryLinks = (isDuplicate = false) => categories.map((category) => (
      <Link
        key={`${isDuplicate ? 'duplicate-' : ''}${category.id}`}
        href={`${baseHref}/${category.slug}`}
        className="flex-shrink-0 flex flex-col items-center group"
        onClick={() => handleCategoryClick(category)}
        aria-hidden={isDuplicate || undefined}
        tabIndex={isDuplicate ? -1 : undefined}
      >
        {/* Imagen optimizada */}
        <div className="relative w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden bg-gradient-to-br from-verde-aguacate/20 to-verde-bosque/20 mb-2 group-hover:shadow-xl transition-all group-hover:scale-105">
          {category.image ? (
            <img
              src={category.image}
              alt={category.name}
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
              loading="lazy"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <ImageIcon className="w-12 h-12 text-gray-400" />
            </div>
          )}

          {/* Badge de conteo de productos */}
          {showProductCount && category.productCount && (
            <div className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-semibold shadow-lg">
              {category.productCount}
            </div>
          )}
        </div>

        {/* Nombre */}
        <span className="text-sm md:text-base font-semibold text-gray-700 text-center w-24 md:w-32">
          {category.name}
        </span>
      </Link>
    ));

    return (
      <div
        className="relative"
        onMouseEnter={() => { interactionPausedRef.current = true; }}
        onMouseLeave={() => { interactionPausedRef.current = false; }}
        onFocusCapture={() => { interactionPausedRef.current = true; }}
        onBlurCapture={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
            interactionPausedRef.current = false;
          }
        }}
        onPointerDown={(event) => {
          if (event.pointerType !== 'mouse') {
            manualPauseUntilRef.current = performance.now() + 2200;
          }
        }}
        onWheel={() => { manualPauseUntilRef.current = performance.now() + 1800; }}
      >
        {/* Botones de navegación - Desktop */}
        {categories.length > 4 && (
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
          role="region"
          aria-label="Categorías de productos"
          className="overflow-x-auto scrollbar-hide pb-4 px-2 md:px-12"
        >
          <div className="flex w-max">
            <div
              ref={firstSequenceRef}
              data-category-sequence="original"
              className={`flex gap-4 ${shouldLoopCategories ? 'pr-4' : ''}`}
            >
              {renderCategoryLinks()}
            </div>
            {shouldLoopCategories && Array.from({ length: loopCopies }, (_, copyIndex) => (
              <div
                data-category-sequence="duplicate"
                key={`duplicate-sequence-${copyIndex}`}
                className="flex gap-4 pr-4"
                aria-hidden="true"
                inert
              >
                {renderCategoryLinks(true)}
              </div>
            ))}
          </div>
        </div>

        {autoScroll && motionPreferenceReady && categories.length > 1 && (
          <div className="mt-1 flex justify-end">
            <button
              type="button"
              onClick={() => {
                if (needsMotionOptIn) {
                  setIsMotionEnabled(true);
                  setIsAutoScrollPaused(false);
                } else {
                  setIsAutoScrollPaused((paused) => !paused);
                }
              }}
              className="inline-flex min-h-9 items-center gap-2 rounded-full px-3 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-verde-aguacate"
              aria-label={needsMotionOptIn ? 'Activar movimiento de categorías' : isAutoScrollPaused ? 'Reanudar movimiento de categorías' : 'Pausar movimiento de categorías'}
              aria-pressed={isMotionRunning}
            >
              {needsMotionOptIn || isAutoScrollPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
              {needsMotionOptIn ? 'Activar movimiento' : isAutoScrollPaused ? 'Reanudar movimiento' : 'Pausar movimiento'}
            </button>
          </div>
        )}

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

  // Variante Grid (para página principal de tienda)
  if (variant === 'grid') {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-8">
        {categories.map((category) => (
          <Link
            key={category.id}
            href={`${baseHref}/${category.slug}`}
            className="group relative aspect-square rounded-2xl overflow-hidden hover:scale-105 transition-transform duration-300 shadow-lg hover:shadow-xl"
            onClick={() => handleCategoryClick(category)}
          >
            {/* Imagen de fondo optimizada */}
            {category.image ? (
              <>
                <OptimizedImage
                  src={category.image}
                  alt={category.name}
                  fill
                  priority={false}
                  className="object-cover"
                />
                {/* Overlay oscuro */}
                <div className="absolute inset-0 bg-gradient-to-br from-black/40 to-black/60 group-hover:from-black/30 group-hover:to-black/50 transition-all" />
              </>
            ) : (
              <div className={`absolute inset-0 bg-gradient-to-br ${category.color || 'from-gray-500 to-gray-700'} opacity-90`} />
            )}

            {/* Content */}
            <div className="relative h-full flex flex-col items-center justify-center text-white p-4">
              <h3 className="text-lg md:text-xl font-bold text-center mb-2">
                {category.name}
              </h3>
              {category.description && (
                <p className="text-xs text-white/80 text-center hidden md:block">
                  {category.description}
                </p>
              )}

              {showProductCount && category.productCount && (
                <div className="mt-2 bg-white/20 px-2 py-1 rounded-full text-xs">
                  {category.productCount} productos
                </div>
              )}
            </div>

            {/* Overlay con nombre en hover */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-end justify-center opacity-0 group-hover:opacity-100">
              <div className="bg-white/90 px-3 py-1 rounded-full text-sm font-medium text-gray-700 mb-4">
                Ver {category.name}
              </div>
            </div>
          </Link>
        ))}
      </div>
    );
  }

  // Variante Simple (lista horizontal - solo texto)
  return (
    <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
      {categories.map((category) => (
        <Link
          key={category.id}
          href={`${baseHref}/${category.slug}`}
          className={`flex-shrink-0 px-5 py-2.5 rounded-full transition-all font-medium ${
            selectedCategory === category.slug
              ? 'bg-verde-aguacate text-white shadow-md'
              : 'bg-gray-100 hover:bg-gray-200 text-gray-700 hover:shadow-sm'
          }`}
          onClick={() => handleCategoryClick(category)}
        >
          <span className="text-sm">{category.name}</span>
          {showProductCount && category.productCount && (
            <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${
              selectedCategory === category.slug
                ? 'bg-white/20 text-white'
                : 'bg-gray-200 text-gray-600'
            }`}>
              {category.productCount}
            </span>
          )}
        </Link>
      ))}
    </div>
  );
}

// Skeleton para loading
function CategorySkeleton({ variant }: { variant: string }) {
  if (variant === 'grid') {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-8">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="aspect-square rounded-2xl bg-gray-200 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {[...Array(8)].map((_, i) => (
        <div key={i} className="flex-shrink-0">
          <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-gray-200 animate-pulse mb-2" />
          <div className="w-20 h-4 bg-gray-200 rounded mx-auto animate-pulse" />
        </div>
      ))}
    </div>
  );
}

// Exportar categorías unificadas para uso en otros componentes
export { UNIFIED_CATEGORIES };