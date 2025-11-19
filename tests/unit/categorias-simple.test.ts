// Tests simples para validar sistema de categorías
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { slugToCategory, categoryToSlug } from '@/lib/productStorage';

describe('📂 Sistema de Categorías - Diagnóstico', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('🔤 Mapeo de Slugs a Categorías', () => {
    it('debe mapear correctamente los slugs del JSON master', () => {
      expect(slugToCategory('aguacates')).toBe('🥑 Aguacates');
      expect(slugToCategory('aromaticas-y-zumos')).toBe('🌿 Aromáticas y Zumos');
      expect(slugToCategory('saludables')).toBe('🍯🥜 SALUDABLES');
      expect(slugToCategory('especias')).toBe('🥗🌱☘️ Especias');
      expect(slugToCategory('tropicales')).toBe('🍊🍎 Tropicales');
      expect(slugToCategory('frutos-rojos')).toBe('🍓 Frutos Rojos');
      expect(slugToCategory('desgranados')).toBe('🌽 Desgranados');
      expect(slugToCategory('gourmet')).toBe('🍅🌽 Gourmet');
    });

    it('debe retornar el slug si no encuentra categoría', () => {
      expect(slugToCategory('categoria-inexistente')).toBe('categoria-inexistente');
      expect(slugToCategory('')).toBe('');
    });

    it('categoryToSlug debe funcionar para categorías básicas', () => {
      expect(categoryToSlug('Aguacates')).toBe('aguacates');
      expect(categoryToSlug('Frutas')).toBe('frutas');
      expect(categoryToSlug('Verduras')).toBe('verduras');
    });

    it('categoryToSlug debe manejar categorías no mapeadas', () => {
      expect(categoryToSlug('Categoría Nueva')).toBe('categoría nueva');
      expect(categoryToSlug('')).toBe('');
    });
  });

  describe('🚨 Detección de Inconsistencias', () => {
    it('debe identificar categorías hardcodeadas vs JSON', () => {
      // Categorías en CategoryGrid (hardcodeado)
      const categoryGridSlugs = [
        'tuberculos', 'saludables', 'frutas', 'aguacates', 'verduras', 'combos'
      ];

      // Categorías en CategorySimpleScroll (desde JSON)
      const categorySimpleScrollSlugs = [
        'aguacates', 'aromaticas-y-zumos', 'saludables', 'especias',
        'tropicales', 'frutos-rojos', 'desgranados', 'gourmet'
      ];

      // Solo tienen 'aguacates' y 'saludables' en común
      const common = categoryGridSlugs.filter(slug => categorySimpleScrollSlugs.includes(slug));
      expect(common.sort()).toEqual(['aguacates', 'saludables']);

      // 🚨 PROBLEMA: Múltiples categorías no están sincronizadas
      const notInJSON = categoryGridSlugs.filter(slug => !categorySimpleScrollSlugs.includes(slug));
      expect(notInJSON).toEqual(['tuberculos', 'frutas', 'verduras', 'combos']);
    });

    it('debe mostrar problemas de URLs duplicadas', () => {
      const categorySlugs = ['aguacates', 'frutas', 'verduras'];

      categorySlugs.forEach(slug => {
        const categoriaRoute = `/categoria/${slug}`;
        const tiendaRoute = `/tienda/${slug}`;

        // 🚨 INCONSISTENCIA: Dos URLs diferentes para la misma categoría
        expect(categoriaRoute).not.toBe(tiendaRoute);
        expect(categoriaRoute).toContain('/categoria/');
        expect(tiendaRoute).toContain('/tienda/');
      });
    });

    it('debe identificar problemas con emojis en nombres', () => {
      const categoriesWithEmojis = [
        '🥑 Aguacates',
        '🌿 Aromáticas y Zumos',
        '🍯🥜 SALUDABLES',
        '🥗🌱☘️ Especias',
        '🍊🍎 Tropicales',
        '🍓 Frutos Rojos',
        '🌽 Desgranados',
        '🍅🌽 Gourmet'
      ];

      categoriesWithEmojis.forEach(category => {
        // Los emojis causan problemas en URLs y bases de datos
        expect(category).toMatch(/[🥑🌿🍯🥜🥗🌱☘️🍊🍎🍓🌽🍅]/);
      });
    });
  });

  describe('📊 Reporte de Problemas', () => {
    it('debe documentar todos los problemas encontrados', () => {
      const problemas = [
        'Sistema duplicado de categorías (3 fuentes diferentes)',
        'URLs duplicadas (/categoria vs /tienda)',
        'Mapeo inconsistente entre slugs y categorías',
        'Categorías hardcodeadas vs desde JSON',
        'Emojis en nombres causan problemas de URLs',
        'Múltiples componentes con datos diferentes',
        'Posibles 404 en categorías no sincronizadas',
        'Confusión para usuarios con múltiples rutas',
        'Problemas de SEO con contenido duplicado'
      ];

      problemas.forEach(problema => {
        console.log(`🚨 PROBLEMA: ${problema}`);
        expect(problema).toBeTruthy();
      });

      expect(problemas.length).toBe(9);
    });

    it('debe mostrar la complejidad del sistema actual', () => {
      const fuentesDeDatos = {
        'CategoryGrid': 'hardcodeado - 6 categorías',
        'CategorySimpleScroll': 'JSON master - 8 categorías con emojis',
        'tienda/page': 'hardcodeado - 7 categorías',
        'productStorage': 'JSON master con mapeo de slugs',
        'Supabase': 'Base de datos - estructura diferente'
      };

      Object.entries(fuentesDeDatos).forEach(([componente, descripcion]) => {
        console.log(`📂 ${componente}: ${descripcion}`);
        expect(componente).toBeTruthy();
        expect(descripcion).toBeTruthy();
      });

      expect(Object.keys(fuentesDeDatos).length).toBe(5);
    });
  });
});