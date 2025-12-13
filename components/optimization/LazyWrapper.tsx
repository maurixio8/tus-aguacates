'use client';

import { lazy, Suspense, ComponentType } from 'react';
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

// Higher-order component para lazy loading
export function withLazyLoading<T extends object>(
  importFunc: () => Promise<{ default: ComponentType<T> }>,
  fallback?: React.ReactNode
) {
  const LazyComponent = lazy(importFunc);

  return function LazyComponentWrapper(props: T) {
    return (
      <LazyWrapper fallback={fallback}>
        <LazyComponent {...props} />
      </LazyWrapper>
    );
  };
}

// Componentes pre-configurados para lazy loading
export const LazyPromotionSlider = withLazyLoading(
  () => import('@/components/promotions/PromotionSlider'),
  <div className="h-48 bg-gray-100 animate-pulse rounded-lg" />
);

export const LazyPersonalizedHero = withLazyLoading(
  () => import('@/components/home/PersonalizedHero'),
  <div className="h-96 bg-gray-100 animate-pulse rounded-lg" />
);

export const LazyRecommendedProducts = withLazyLoading(
  () => import('@/components/home/RecommendedProducts'),
  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
    {[1, 2, 3].map((i) => (
      <div key={i} className="h-64 bg-gray-100 animate-pulse rounded-lg" />
    ))}
  </div>
);

export const LazyLastOrderSummary = withLazyLoading(
  () => import('@/components/home/LastOrderSummary'),
  <div className="h-32 bg-gray-100 animate-pulse rounded-lg" />
);

export const LazyUnifiedCategories = withLazyLoading(
  () => import('@/components/categories/UnifiedCategories'),
  <div className="flex gap-4 overflow-x-auto">
    {[1, 2, 3, 4, 5].map((i) => (
      <div key={i} className="w-24 h-24 bg-gray-100 animate-pulse rounded-lg flex-shrink-0" />
    ))}
  </div>
);

export const LazyAddressAutocomplete = withLazyLoading(
  () => import('@/components/checkout/AddressAutocomplete'),
  <div className="h-10 bg-gray-100 animate-pulse rounded" />
);