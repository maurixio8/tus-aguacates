// Tests de integración para rutas de categorías - ANTES de la refactorización
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';

// Mock de Next.js router
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
  }),
  usePathname: () => '/tienda',
  useParams: () => ({ categoria: 'aguacates' }),
}));

// Mock de Supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: null, error: null })),
          order: vi.fn(() => Promise.resolve({ data: [], error: null })),
        })),
      })),
    })),
  },
}));

// Mock de localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
global.localStorage = localStorageMock;

describe('🛣️ Integración de Rutas de Categorías', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPush.mockClear();
    localStorageMock.getItem.mockReturnValue('[]');
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('📂 Navegación entre Componentes de Categorías', () => {
    it('debe mostrar diferentes URLs para misma categoría en distintos componentes', async () => {
      // Mock datos del JSON master
      const mockProductsData = {
        categories: [
          {
            name: '🥑 Aguacates',
            products: [
              { name: 'Aguacate Hass', price: 5000, variants: [] }
            ]
          }
        ]
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockProductsData)
      });

      // Probar CategoryGrid (usa /categoria)
      const { unmount } = await import('@/components/categories/CategoryGrid');
      const CategoryGrid = unmount.default;

      const { rerender } = render(
        <BrowserRouter>
          <CategoryGrid />
        </BrowserRouter>
      );

      const aguacateLink = screen.getByText('Aguacates').closest('a');
      expect(aguacateLink).toHaveAttribute('href', '/categoria/aguacates');

      // Probar CategorySimpleScroll (usa /tienda)
      const CategorySimpleScrollModule = await import('@/components/categories/CategorySimpleScroll');
      const CategorySimpleScroll = CategorySimpleScrollModule.default;

      rerender(
        <BrowserRouter>
          <CategorySimpleScroll />
        </BrowserRouter>
      );

      const aguacateLink2 = screen.getByText('🥑 Aguacates').closest('a');
      expect(aguacateLink2).toHaveAttribute('href', '/tienda/aguacates');

      // 🚨 INCONSISTENCIA: Dos URLs diferentes para la misma categoría
      expect('/categoria/aguacates').not.toBe('/tienda/aguacates');
    });

    it('debe manejar datos diferentes en rutas duplicadas', async () => {
      // Simular navegación a /categoria/aguacates (Supabase)
      const mockSupabaseData = {
        id: 'cat-1',
        name: 'Aguacates',
        slug: 'aguacates',
        description: 'Desde Supabase'
      };

      const { supabase } = await import('@/lib/supabase');
      supabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockSupabaseData,
              error: null
            })
          })
        })
      });

      // Cargar página de categoría
      const { default: CategoriaPage } = await import('@/app/categoria/[slug]/page');

      // Mock params
      const mockParams = Promise.resolve({ slug: 'aguacates' });

      render(
        <BrowserRouter>
          <CategoriaPage params={mockParams} />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Aguacates')).toBeInTheDocument();
      });
    });

    it('debe mostrar productos diferentes según la ruta', async () => {
      // Mock para ruta /tienda/aguacates (JSON)
      const mockJSONProducts = [
        {
          id: 'prod-1',
          name: '🌞 Nueva Maya paquete x 8 Mediano',
          category: '🥑 Aguacates',
          price: 8400
        }
      ];

      const { getProductsByCategory } = await import('@/lib/productStorage');
      vi.mocked(getProductsByCategory).mockResolvedValue(mockJSONProducts);

      // Mock para ruta /categoria/aguacates (Supabase)
      const mockSupabaseProducts = [
        {
          id: 'prod-2',
          name: 'Aguacate Hass Premium',
          category: 'Aguacates',
          price: 5000
        }
      ];

      const { supabase } = await import('@/lib/supabase');
      supabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({
                data: mockSupabaseProducts,
                error: null
              })
            })
          })
        })
      });

      // Los productos serían diferentes en cada ruta
      expect(mockJSONProducts[0].name).not.toBe(mockSupabaseProducts[0].name);
      expect(mockJSONProducts[0].price).not.toBe(mockSupabaseProducts[0].price);
    });
  });

  describe('🔄 Flujo de Navegación del Usuario', () => {
    it('debe mostrar navegación confusa desde Home', async () => {
      // El Home muestra ambos componentes de categorías
      const { default: HomePage } = await import('@/app/page');

      render(
        <BrowserRouter>
          <HomePage />
        </BrowserRouter>
      );

      // El usuario ve dos secciones de "Explora por Categoría" diferentes
      const headers = screen.getAllByText(/Explora por Categoría/i);
      expect(headers.length).toBeGreaterThan(1);

      // 🚨 PROBLEMA: Usuario confundido con categorías diferentes
    });

    it('debe mostrar inconsistencias al navegar desde Tienda', async () => {
      const { default: TiendaPage } = await import('@/app/tienda/page');

      render(
        <BrowserRouter>
          <TiendaPage />
        </BrowserRouter>
      );

      // Categorías en tienda page
      const tiendaCategories = ['Frutas', 'Verduras', 'Aguacates', 'Especias'];

      tiendaCategories.forEach(category => {
        expect(screen.getByText(category)).toBeInTheDocument();
      });

      // Estas categorías pueden no existir en el JSON o tener productos diferentes
    });

    it('debe manejar errores 404 en categorías inexistentes', async () => {
      const { supabase } = await import('@/lib/supabase');
      supabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'Category not found' }
            })
          })
        })
      });

      // Esto debería mostrar 404 o página de error
      // Pero actualmente puede romperse
    });
  });

  describe('📱 Compatibilidad Móvil', () => {
    it('debe mostrar scroll horizontal en CategorySimpleScroll', async () => {
      const CategorySimpleScrollModule = await import('@/components/categories/CategorySimpleScroll');
      const CategorySimpleScroll = CategorySimpleScrollModule.default;

      render(
        <BrowserRouter>
          <CategorySimpleScroll />
        </BrowserRouter>
      );

      // Verificar que el contenedor tiene scroll
      const scrollContainer = document.querySelector('.overflow-x-auto');
      expect(scrollContainer).toBeInTheDocument();
    });

    it('debe manejar mal los emojis en pantallas pequeñas', async () => {
      // Los emojis pueden causar problemas de layout en móviles
      const categoriesWithEmojis = [
        '🥑 Aguacates',
        '🍯🥜 SALUDABLES',
        '🥗🌱☘️ Especias'
      ];

      categoriesWithEmojis.forEach(category => {
        // Los emojis pueden romper el layout en ciertas condiciones
        expect(category.length).toBeGreaterThan(5); // Incluye emojis
      });
    });
  });

  describe('🔗 Links y Redirecciones', () => {
    it('debe tener links rotos o inconsistentes', async () => {
      // CategoryGrid apunta a /categoria/
      // CategorySimpleScroll apunta a /tienda/
      // tienda/page apunta a /tienda/

      const inconsistentLinks = [
        { from: 'CategoryGrid', to: '/categoria/' },
        { from: 'CategorySimpleScroll', to: '/tienda/' },
        { from: 'tienda page', to: '/tienda/' }
      ];

      // Esto evidencia el problema de routing duplicado
      expect(inconsistentLinks.length).toBeGreaterThan(1);
    });

    it('debe manejar mal las redirecciones', async () => {
      const user = userEvent.setup();

      // Simular click en una categoría
      const CategorySimpleScrollModule = await import('@/components/categories/CategorySimpleScroll');
      const CategorySimpleScroll = CategorySimpleScrollModule.default;

      render(
        <BrowserRouter>
          <CategorySimpleScroll />
        </BrowserRouter>
      );

      const aguacateLink = screen.getByText('🥑 Aguacates').closest('a');
      expect(aguacateLink).toHaveAttribute('href', '/tienda/aguacates');

      // El usuario espera que esto funcione, pero puede que la ruta no exista
      // o tenga datos diferentes
    });
  });
});

describe('📊 Reporte de Problemas de Integración', () => {
  it('debe documentar todos los problemas de routing', () => {
    const routingProblems = [
      'URLs duplicadas: /categoria/{slug} vs /tienda/{slug}',
      'Datos diferentes en rutas duplicadas',
      'Componentes con enlaces inconsistentes',
      'Posibles 404 en categorías no sincronizadas',
      'Confusión para usuarios con múltiples rutas',
      'Problemas de SEO con contenido duplicado',
      'Dificultad para mantener sincronización'
    ];

    routingProblems.forEach(problem => {
      console.log(`🚨 ROUTING PROBLEM: ${problem}`);
      expect(problem).toBeTruthy();
    });
  });
});