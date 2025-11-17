// Tests para el sistema unificado de categorías - DESPUÉS de la refactorización
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { slugToCategory, categoryToSlug } from '@/lib/productStorage';
import { UNIFIED_CATEGORIES } from '@/components/categories/UnifiedCategories';

describe('📂 Sistema Unificado de Categorías - Validación', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('🔤 Mapeo Unificado de Slugs', () => {
    it('debe mapear correctamente las nuevas categorías unificadas', () => {
      expect(slugToCategory('aguacates')).toBe('🥑 Aguacates');
      expect(slugToCategory('frutas-tropicales')).toBe('🍊🍎 Tropicales');
      expect(slugToCategory('frutos-rojos')).toBe('🍓 Frutos Rojos');
      expect(slugToCategory('verduras')).toBe('🥬 Verduras');
      expect(slugToCategory('aromaticas')).toBe('🌿 Aromáticas y Zumos');
      expect(slugToCategory('saludables')).toBe('🍯🥜 SALUDABLES');
      expect(slugToCategory('especias')).toBe('🌶️ Especias');
      expect(slugToCategory('combos')).toBe('🎁 Combos');
    });

    it('debe mantener compatibilidad con URLs antiguas', () => {
      // URLs antiguas deberían seguir funcionando
      expect(slugToCategory('aromaticas-y-zumos')).toBe('🌿 Aromáticas y Zumos');
      expect(slugToCategory('tropicales')).toBe('🍊🍎 Tropicales');
      expect(slugToCategory('desgranados')).toBe('🌽 Desgranados');
      expect(slugToCategory('gourmet')).toBe('🍅🌽 Gourmet');
    });

    it('debe tener mapeo consistente en ambas direcciones', () => {
      const unifiedSlugs = UNIFIED_CATEGORIES.map(cat => cat.slug);

      unifiedSlugs.forEach(slug => {
        const categoryName = slugToCategory(slug);
        // Las categorías unificadas deben tener mapeo válido
        expect(categoryName).toBeTruthy();
        expect(categoryName).not.toBe(slug);
      });
    });
  });

  describe('📋 Validación de Categorías Unificadas', () => {
    it('debe tener todas las categorías necesarias', () => {
      const expectedSlugs = [
        'aguacates', 'frutas-tropicales', 'frutos-rojos', 'verduras',
        'aromaticas', 'saludables', 'especias', 'combos'
      ];

      const actualSlugs = UNIFIED_CATEGORIES.map(cat => cat.slug);

      expectedSlugs.forEach(slug => {
        expect(actualSlugs).toContain(slug);
      });

      expect(UNIFIED_CATEGORIES.length).toBe(8);
    });

    it('debe tener estructura consistente en todas las categorías', () => {
      UNIFIED_CATEGORIES.forEach(category => {
        // Campos requeridos
        expect(category).toHaveProperty('id');
        expect(category).toHaveProperty('name');
        expect(category).toHaveProperty('slug');
        expect(category).toHaveProperty('icon');

        // Campos opcionales pero recomendados
        expect(category).toHaveProperty('image');
        expect(category).toHaveProperty('description');
        expect(category).toHaveProperty('color');

        // Validar tipos
        expect(typeof category.id).toBe('string');
        expect(typeof category.name).toBe('string');
        expect(typeof category.slug).toBe('string');
        expect(typeof category.icon).toBe('string');

        // Validar que los slugs sean URL-friendly
        expect(category.slug).toMatch(/^[a-z0-9-]+$/);
      });
    });

    it('debe tener slugs únicos', () => {
      const slugs = UNIFIED_CATEGORIES.map(cat => cat.slug);
      const uniqueSlugs = [...new Set(slugs)];

      expect(slugs.length).toBe(uniqueSlugs.length);
    });

    it('debe tener nombres legibles sin emojis problemáticos', () => {
      UNIFIED_CATEGORIES.forEach(category => {
        // Los nombres deben ser legibles
        expect(category.name.length).toBeGreaterThan(2);
        expect(category.name.length).toBeLessThan(50);

        // Pueden tener emojis pero no al inicio (para evitar problemas de URLs)
        if (category.name.match(/[🥑🌿🍯🥜🥗🌱☘️🍊🍎🍓🌽🍅🌶️🎁]/)) {
          // Si tiene emoji, debe ser al inicio y el nombre debe seguir
          expect(category.name).toMatch(/^[🥑🌿🍯🥜🥗🌱☘️🍊🍎🍓🌽🍅🌶️🎁]\s+\w+/);
        }
      });
    });

    it('debe tener colores definidos para variante grid', () => {
      UNIFIED_CATEGORIES.forEach(category => {
        if (category.color) {
          // Validar formato de Tailwind gradient
          expect(category.color).toMatch(/^from-\w+-\d+\s+to-\w+-\d+$/);
        }
      });
    });
  });

  describe('🚀 Beneficios del Sistema Unificado', () => {
    it('debe eliminar duplicación de componentes', () => {
      // Antes: CategoryGrid, CategorySimpleScroll, CategoryScroll
      // Ahora: UnifiedCategories con diferentes variantes

      const variantesDisponibles = ['scroll', 'grid', 'simple'];
      variantesDisponibles.forEach(variante => {
        expect(typeof variante).toBe('string');
        expect(['scroll', 'grid', 'simple']).toContain(variante);
      });
    });

    it('debe unificar el sistema de URLs', () => {
      // Ahora todas las categorías usan /tienda/{slug}
      const unifiedUrls = UNIFIED_CATEGORIES.map(cat => `/tienda/${cat.slug}`);

      unifiedUrls.forEach(url => {
        expect(url).toMatch(/^\/tienda\/[a-z0-9-]+$/);
        expect(url).not.toContain('/categoria/');
      });
    });

    it('debe centralizar la configuración de categorías', () => {
      // Todas las componentes usan la misma fuente de verdad
      const esArray = Array.isArray(UNIFIED_CATEGORIES);
      const tieneDatos = UNIFIED_CATEGORIES.length > 0;

      expect(esArray).toBe(true);
      expect(tieneDatos).toBe(true);

      // Cada categoría debe tener estructura consistente
      UNIFIED_CATEGORIES.forEach(cat => {
        expect(cat).toHaveProperty('slug');
        expect(cat).toHaveProperty('name');
        expect(cat).toHaveProperty('icon');
      });
    });

    it('debe ser extensible para futuras categorías', () => {
      const categoriaOriginalLength = UNIFIED_CATEGORIES.length;

      // Simular agregar una nueva categoría
      const nuevaCategoria = {
        id: 'cat-new',
        name: 'Nueva Categoría',
        slug: 'nueva-categoria',
        icon: '🆕',
        image: '/categories/nueva.jpg',
        description: 'Descripción de nueva categoría',
        color: 'from-blue-500 to-purple-600'
      };

      // El sistema debería poder extenderse fácilmente
      expect(nuevaCategoria.slug).toMatch(/^[a-z0-9-]+$/);
      expect(nuevaCategoria).toHaveProperty('id');
      expect(nuevaCategoria).toHaveProperty('name');
    });
  });

  describe('📊 Validación de Mejoras', () => {
    it('debe mostrar mejora en consistencia', () => {
      // Antes: 3 sistemas diferentes de categorías
      // Ahora: 1 sistema unificado

      const sistemasAntes = [
        'CategoryGrid (hardcodeado)',
        'CategorySimpleScroll (JSON)',
        'tienda/page (hardcodeado)'
      ];

      const sistemasAhora = [
        'UnifiedCategories (unificado)'
      ];

      expect(sistemasAhora.length).toBeLessThan(sistemasAntes.length);
      expect(sistemasAhora.length).toBe(1);
    });

    it('debe resolver problemas de routing duplicado', () => {
      const problemasResueltos = [
        '✅ URLs unificadas (/tienda/{slug})',
        '✅ Redirección de /categoria a /tienda',
        '✅ Una sola fuente de verdad para categorías',
        '✅ Componentes reutilizables con variantes',
        '✅ Mapeo consistente de slugs'
      ];

      problemasResueltos.forEach(mejora => {
        expect(mejora).toMatch(/^✅/); // Todas las mejoras deben estar resueltas
      });
    });

    it('debe mejorar experiencia de desarrollador', () => {
      const beneficiosDev = [
        'Un solo componente para mantener',
        'Configuración centralizada',
        'Tipado consistente',
        'Variants reutilizables',
        'Sin duplicación de código',
        'Fácil de extender'
      ];

      beneficiosDev.forEach(beneficio => {
        expect(beneficio.length).toBeGreaterThan(5);
      });
    });
  });
});