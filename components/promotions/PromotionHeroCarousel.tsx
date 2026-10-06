'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, ExternalLink, Pause, Play } from 'lucide-react';

interface Promotion {
  id: string;
  title: string;
  description?: string | null;
  image_url: string;
  link?: string | null;
  sort_order: number;
}

const FALLBACK_PROMOTION: Promotion = {
  id: 'brand-fallback',
  title: 'Productos frescos para tu semana',
  description: 'Descubre nuestros productos destacados y compra en línea.',
  image_url: '/images/hero-optimized.png',
  link: '/tienda/promociones',
  sort_order: 0,
};

export function PromotionHeroCarousel() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [paused, setPaused] = useState(false);
  const [dragStart, setDragStart] = useState<number | null>(null);
  const [dragOffset, setDragOffset] = useState(0);
  const touchStart = useRef<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/promotions/active', { cache: 'no-store' })
      .then(async (response) => {
        if (!response.ok) throw new Error('No se pudieron cargar las promociones');
        const data = await response.json();
        if (!cancelled) {
          setPromotions(Array.isArray(data.promotions) && data.promotions.length ? data.promotions : [FALLBACK_PROMOTION]);
          setLoading(false);
        }
      })
      .catch((error) => {
        console.error('Error cargando hero promocional:', error);
        if (!cancelled) {
          setPromotions([FALLBACK_PROMOTION]);
          setLoading(false);
        }
      });

    return () => { cancelled = true; };
  }, []);

  const goTo = useCallback((index: number) => {
    setActiveIndex((index + promotions.length) % promotions.length);
    setDragOffset(0);
  }, [promotions.length]);

  const next = useCallback(() => goTo(activeIndex + 1), [activeIndex, goTo]);
  const previous = useCallback(() => goTo(activeIndex - 1), [activeIndex, goTo]);

  useEffect(() => {
    if (paused || promotions.length < 2) return;
    const timer = window.setInterval(next, 6000);
    return () => window.clearInterval(timer);
  }, [next, paused, promotions.length]);

  const startPointer = (clientX: number) => {
    setDragStart(clientX);
    setPaused(true);
  };

  const movePointer = (clientX: number) => {
    if (dragStart === null) return;
    setDragOffset(clientX - dragStart);
  };

  const endPointer = () => {
    if (dragStart === null) return;
    if (Math.abs(dragOffset) > 55) {
      if (dragOffset < 0) next();
      else previous();
    }
    setDragStart(null);
    setDragOffset(0);
    setPaused(false);
  };

  const active = promotions[activeIndex] || FALLBACK_PROMOTION;

  if (loading) {
    return <div className="h-[420px] animate-pulse bg-verde-bosque md:h-[560px]" aria-label="Cargando promociones" />;
  }

  return (
    <section
      className="relative overflow-hidden bg-[#07180f] text-white"
      aria-roledescription="carrusel de promociones"
      aria-label="Promociones destacadas"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => { if (dragStart === null) setPaused(false); }}
      onKeyDown={(event) => {
        if (event.key === 'ArrowLeft') previous();
        if (event.key === 'ArrowRight') next();
        if (event.key === ' ') setPaused((value) => !value);
      }}
      tabIndex={0}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_20%,rgba(200,162,39,0.24),transparent_36%),linear-gradient(115deg,#07180f_0%,#0d2818_52%,#07180f_100%)]" />

      <div
        className="relative mx-auto flex min-h-[420px] max-w-[1500px] items-center px-4 py-8 md:min-h-[560px] md:px-10 md:py-12"
        onMouseDown={(event) => startPointer(event.clientX)}
        onMouseMove={(event) => movePointer(event.clientX)}
        onMouseUp={endPointer}
        onMouseLeave={endPointer}
        onTouchStart={(event) => { touchStart.current = event.touches[0]?.clientX ?? null; setPaused(true); }}
        onTouchMove={(event) => { if (touchStart.current !== null) setDragOffset((event.touches[0]?.clientX ?? 0) - touchStart.current); }}
        onTouchEnd={() => { setDragStart(touchStart.current); endPointer(); touchStart.current = null; }}
      >
        <div className="pointer-events-none absolute inset-y-8 left-1/2 hidden w-[78%] -translate-x-1/2 rounded-[2rem] border border-white/10 bg-white/[0.04] shadow-[0_30px_100px_rgba(0,0,0,0.35)] backdrop-blur-sm md:block" />

        <div className="relative z-10 grid w-full items-center gap-8 md:grid-cols-[minmax(0,0.9fr)_minmax(420px,1.3fr)] md:gap-12">
          <div className="order-2 px-2 md:order-1 md:pl-8">
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.25em] text-[#C8A227]">Promoción destacada</p>
            <div aria-live="polite">
              <h1 className="max-w-xl font-display text-4xl font-bold leading-[0.98] md:text-6xl lg:text-7xl">{active.title}</h1>
              {active.description && <p className="mt-5 max-w-lg text-base leading-relaxed text-white/75 md:text-xl">{active.description}</p>}
            </div>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Link href={active.link || '/tienda/promociones'} className="inline-flex min-h-12 items-center gap-2 rounded-full bg-[#C8A227] px-6 py-3 font-bold text-[#07180f] shadow-[0_8px_30px_rgba(200,162,39,0.25)] transition hover:scale-[1.03] hover:bg-[#e0bd35]">
                Ver promoción <ExternalLink className="h-4 w-4" />
              </Link>
              <button type="button" onClick={() => setPaused((value) => !value)} className="inline-flex min-h-12 items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-3 text-sm font-semibold backdrop-blur-md transition hover:bg-white/15" aria-label={paused ? 'Reanudar promociones' : 'Pausar promociones'}>
                {paused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                {paused ? 'Reanudar' : 'Pausar'}
              </button>
            </div>
          </div>

          <div className="order-1 min-w-0 md:order-2">
            <div className="relative mx-auto aspect-[16/10] w-full max-w-[760px] select-none" style={{ transform: `translateX(${dragOffset}px)` }}>
              <div className="absolute -inset-5 rounded-[2rem] bg-[#C8A227]/10 blur-2xl" />
              <div className="relative h-full overflow-hidden rounded-[1.6rem] border border-white/20 bg-[#0D2818]/80 shadow-[0_25px_70px_rgba(0,0,0,0.45)] backdrop-blur-xl">
                <img src={active.image_url} alt={active.title} className="h-full w-full object-cover" draggable={false} />
                <div className="absolute inset-0 bg-gradient-to-t from-[#07180f]/70 via-transparent to-white/10" />
                <div className="absolute inset-0 rounded-[1.6rem] ring-1 ring-inset ring-[#C8A227]/25" />
              </div>
            </div>
          </div>
        </div>

        {promotions.length > 1 && <>
          <button type="button" onClick={previous} className="absolute left-3 top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/25 backdrop-blur-md transition hover:bg-black/45 md:left-6" aria-label="Promoción anterior"><ChevronLeft className="h-6 w-6" /></button>
          <button type="button" onClick={next} className="absolute right-3 top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/25 backdrop-blur-md transition hover:bg-black/45 md:right-6" aria-label="Siguiente promoción"><ChevronRight className="h-6 w-6" /></button>
        </>}

        <div className="absolute bottom-5 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2" role="tablist" aria-label="Promociones disponibles">
          {promotions.map((promotion, index) => <button key={promotion.id} type="button" onClick={() => goTo(index)} className={`h-2 rounded-full transition-all ${index === activeIndex ? 'w-8 bg-[#C8A227]' : 'w-2 bg-white/45 hover:bg-white/80'}`} aria-label={`Ver promoción ${index + 1}`} aria-selected={index === activeIndex} role="tab" />)}
        </div>
      </div>
    </section>
  );
}
