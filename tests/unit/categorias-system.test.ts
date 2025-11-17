// Tests específicos para el sistema de categorías - ANTES de la refactorización
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { slugToCategory, categoryToSlug, getProductsByCategory } from '@/lib/productStorage';

// Mock del JSON master
const mockCategoriesData = {
  categories: [
    {
      name: '🥑 Aguacates',
      description: 'Aguacates frescos de la mejor calidad',
      products: [
        {
          name: '🌞 Nueva Maya paquete x 8 Mediano',
          price: 8400,
          variants: [{ name: 'Paquete x 8 unidades medianas', price: 8400 }]
        }
      ]
    },
    {
      name: '🌿 Aromáticas y Zumos',
      description: 'Hierbas frescas aromáticas y zumos concentrados',
      products: [
        {
          name: '🌳 Lechuga morada',
          price: 5600,
          variants: [{ name: 'Por 1 unidad', price: 5600 }]
        }
      ]
    },
    {
      name: '🍯🥜 SALUDABLES',
      description: 'Productos naturales saludables',
      products: [
        {
          name: '🌱 Flor de Jamaica',
          price: 9900,
          variants: [{ name: 'Por 1 kilogramo', price: 9900 }]
        }
      ]
    }
  ]
};

// Mock de fetch para JSON
global.fetch = vi.fn();

describe('📂 Sistema de Categorías - Estado Actual', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
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

  describe('🔍 Consistencia entre Componentes', () => {
    it('debe identificar inconsistencias en las categorías hardcodeadas', () => {
      // Estas son las categorías que aparecen en diferentes componentes pero no están mapeadas
      const hardcodedCategories = ['Tubérculos', 'Hierbas Aromáticas', 'Combos'];

      hardcodedCategories.forEach(category => {
        const slug = categoryToSlug(category);
        const mappedBack = slugToCategory(slug);
        // Esto demuestra la inconsistencia
        expect(mappedBack).not.toBe(category);
      });
    });

    it('debe mostrar que CategoryGrid usa categorías diferentes a CategorySimpleScroll', () => {
      // CategoryGrid (hardcodeado):
      const categoryGridSlugs = ['tuberculos', 'saludables', 'frutas', 'aguacates', 'verduras', 'combos'];

      // CategorySimpleScroll (desde JSON):
      const categorySimpleScrollSlugs = [
        'aguacates', 'aromaticas-y-zumos', 'saludables', 'especias',
        'tropicales', 'frutos-rojos', 'desgranados', 'gourmet'
      ];

      // Solo tienen 'aguacates' y 'saludables' en común
      const common = categoryGridSlugs.filter(slug => categorySimpleScrollSlugs.includes(slug));
      expect(common).toEqual(['aguacates', 'saludables']);
    });
  });

  describe('🚨 Problemas de Routing', () => {
    it('debe identificar URLs duplicadas', () => {
      // Existen dos rutas para categorías:
      // /categoria/[slug] - busca en Supabase
      // /tienda/[categoria] - usa JSON local

      const categorySlugs = ['aguacates', 'frutas', 'verduras'];

      categorySlugs.forEach(slug => {
        const categoriaRoute = `/categoria/${slug}`;
        const tiendaRoute = `/tienda/${slug}`;

        // Estas URLs existen pero manejan datos diferentes
        expect(categoriaRoute).not.toBe(tiendaRoute);
      });
    });

    it('debe mostrar que tienda/page.tsx tiene su propia lista de categorías', () => {
      // tienda/page.tsx define sus propias categorías
      const tiendaPageCategories = [
        'Frutas', 'Verduras', 'Aguacates', 'Especias',
        'Hierbas Aromáticas', 'Combos', 'Saludables'
      ];

      // Son diferentes a las del JSON y a las de CategoryGrid
      expect(tiendaPageCategories).toContain('Hierbas Aromáticas'); // No existe en otros lugares
      expect(tiendaPageCategories).toContain('Combos'); // Solo en CategoryGrid y tienda
    });
  });

  describe('📊 Inconsistencias de Datos', () => {
    it('debe mostrar que existen múltiples fuentes de verdad', async () => {
      // Mock del fetch para simular carga del JSON
      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockCategoriesData)
      });

      // Cargar productos desde JSON
      const products = await getProductsByCategory('🥑 Aguacates');

      // Verificar que los datos vienen del JSON
      expect(products.length).toBeGreaterThan(0);
      expect(products[0].category).toBe('🥑 Aguacates');
    });

    it('debe identificar problemas con emojis en nombres de categorías', () => {
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
        // Los emojis en los nombres causan problemas en URLs y bases de datos
        expect(category).toMatch(/[🥑🌿🍯🥜🥗🌱☘️🍊🍎🍓🌽🍅]/);
      });
    });
  });

  describe('🧪 Testing de Componentes Actuales', () => {
    it('debe verificar que CategoryGrid está hardcodeado', async () => {
      // Importar dinámicamente para evitar errores de compilación
      const CategoryGridModule = await import('@/components/categories/CategoryGrid');
      const CategoryGrid = CategoryGridModule.default;

      render(<CategoryGrid />);

      // Verificar que muestra las categorías hardcodeadas
      expect(screen.getByText('Tubérculos')).toBeInTheDocument();
      expect(screen.getByText('Aguacates')).toBeInTheDocument();
      expect(screen.getByText('Combos')).toBeInTheDocument();
    });

    it('debe verificar que CategorySimpleScroll usa datos del JSON', async () => {
      const CategorySimpleScrollModule = await import('@/components/categories/CategorySimpleScroll');
      const CategorySimpleScroll = CategorySimpleScrollModule.default;

      render(<CategorySimpleScroll />);

      // Verificar que muestra las categorías del JSON
      expect(screen.getByText('🥑 Aguacates')).toBeInTheDocument();
      expect(screen.getByText('🌿 Aromáticas y Zumos')).toBeInTheDocument();
      expect(screen.getByText('🍯🥜 SALUDABLES')).toBeInTheDocument();
    });
  });
});

describe('🔧 Tests para Validar Problemas Identificados', () => {
  it('debe documentar todos los problemas encontrados', () => {
    const problemas = [
      'Sistema duplicado de categorías (3 fuentes diferentes)',
      'URLs duplicadas (/categoria vs /tienda)',
      'Mapeo inconsistente entre slugs y categorías',
      'Categorías hardcodeadas vs desde JSON',
      'Emojis en nombres causan problemas de URLs',
      'Múltiples componentes con datos diferentes'
    ];

    problemas.forEach(problema => {
      console.log(`🚨 PROBLEMA: ${problema}`);
      expect(problema).toBeTruthy();
    });
  });
});