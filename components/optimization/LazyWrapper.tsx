'use client';

import { lazy, Suspense } from 'react';
import { Loader2 } from 'lucide-react';

interface LazyWrapperProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

// Fallback para lazy loading
const DefaultFallback = () => (
  <div className="flex items-center justify-center p-8">
    <Loader2 className="w-8 h-8 animate-spin text-verde-aguacate" />
  </div>
);

export function LazyWrapper({ children, fallback = <DefaultFallback /> }: LazyWrapperProps) {
  return <Suspense fallback={fallback}>{children}</Suspense>;
}

// Componentes lazy simples sin TypeScript complejo
export const LazyPromotionSlider = lazy(() =>
  import('@/components/promotions/PromotionSlider')
);

export const LazyPersonalizedHero = lazy(() =>
  import('@/components/home/PersonalizedHero').then(module => ({
    default: module.PersonalizedHero
  }))
);

export const LazyRecommendedProducts = lazy(() =>
  import('@/components/home/RecommendedProducts').then(module => ({
    default: module.RecommendedProducts
  }))
);

export const LazyLastOrderSummary = lazy(() =>
  import('@/components/home/LastOrderSummary').then(module => ({
    default: module.LastOrderSummary
  }))
);

export const LazyUnifiedCategories = lazy(() =>
  import('@/components/categories/UnifiedCategories')
);