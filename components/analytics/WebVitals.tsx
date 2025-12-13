'use client';

import { useEffect } from 'react';
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

interface Metric {
  name: string;
  value: number;
  id: string;
}

interface WebVitalsProps {
  onMetric?: (metric: Metric) => void;
}

export function WebVitals({ onMetric }: WebVitalsProps) {
  useEffect(() => {
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
      const handleMetric = (metric: Metric) => {
        // Enviar a analítica o console
        if (onMetric) {
          onMetric(metric);
        } else {
          // Opcional: Enviar a Google Analytics
          if (window.gtag) {
            window.gtag('event', metric.name, {
              value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
              event_category: 'Web Vitals',
              event_label: metric.id,
              non_interaction: true,
            });
          }

          // Opcional: Enviar a un endpoint personalizado
          fetch('/api/web-vitals', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              ...metric,
              url: window.location.href,
              userAgent: navigator.userAgent,
            }),
            keepalive: true,
          }).catch(() => {
            // Silently fail if analytics endpoint is not available
          });
        }
      };

      getCLS(handleMetric);
      getFID(handleMetric);
      getFCP(handleMetric);
      getLCP(handleMetric);
      getTTFB(handleMetric);
    }
  }, [onMetric]);

  return null;
}

// Extension del tipo Window para gtag
declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
  }
}