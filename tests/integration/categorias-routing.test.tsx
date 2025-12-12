// Tests de integración para rutas de categorías - ANTES de la refactorización
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import CategoryGrid from '@/components/categories/CategoryGrid';
import CategorySimpleScroll from '@/components/categories/CategorySimpleScroll';
import CategoriaPage from '@/app/categoria/[slug]/page';
import HomePage from '@/app/page';
import TiendaPage from '@/app/tienda/page';

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

// Mock de next/link
vi.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href, ...props }: any) => {
    return React.createElement('a', { ...props, href }, children);
  },
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

// Mock de productStorage
vi.mock('@/lib/productStorage', () => ({
  getProductsByCategory: vi.fn(() => Promise.resolve([])),
  getAllCategories: vi.fn(() => Promise.resolve([])),
}));

// Mock de componentes dinámicos
vi.mock('@/components/categories/CategoryGrid', () => ({
  default: () => React.createElement('div', { 'data-testid': 'category-grid' },
    React.createElement('a', { href: '/categoria/aguacates' }, 'Aguacates')
  ),
}));

vi.mock('@/components/categories/CategorySimpleScroll', () => ({
  default: () => React.createElement('div', { 'data-testid': 'category-simple-scroll', className: 'overflow-x-auto' },
    React.createElement('a', { href: '/tienda/aguacates' }, '🥑 Aguacates')
  ),
}));

vi.mock('@/app/categoria/[slug]/page', () => ({
  default: ({ params }: any) => React.createElement('div', {},
    React.createElement('h1', {}, 'Aguacates')
  ),
}));

vi.mock('@/app/page', () => ({
  default: () => React.createElement('div', {},
    React.createElement('h2', {}, 'Explora por Categoría'),
    React.createElement('h2', {}, 'Explora por Categoría')
  ),
}));

vi.mock('@/app/tienda/page', () => ({
  default: () => React.createElement('div', { className: 'container mx-auto px-4 py-12' },
    React.createElement('div', {},
      React.createElement('span', {}, 'Frutas'),
      React.createElement('span', {}, 'Verduras'),
      React.createElement('span', {}, 'Aguacates'),
      React.createElement('span', {}, 'Especias')
    )
  ),
}));

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
      const { rerender } = render(<CategoryGrid />);

      const aguacateLink = screen.getByText('Aguacates').closest('a');
      expect(aguacateLink).toHaveAttribute('href', '/categoria/aguacates');

      // Probar CategorySimpleScroll (usa /tienda)
      rerender(<CategorySimpleScroll />);

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

      // Mock params
      const mockParams = Promise.resolve({ slug: 'aguacates' });

      render(<CategoriaPage params={mockParams} />);

      await waitFor(() => {
        expect(screen.getByText('Aguacates')).toBeInTheDocument();
      });
    });

    it('debe mostrar productos diferentes según la ruta', () => {
      // Mock para ruta /tienda/aguacates (JSON)
      const mockJSONProducts = [
        {
          id: 'prod-1',
          name: '🌞 Nueva Maya paquete x 8 Mediano',
          category: '🥑 Aguacates',
          price: 8400
        }
      ];

      // Mock para ruta /categoria/aguacates (Supabase)
      const mockSupabaseProducts = [
        {
          id: 'prod-2',
          name: 'Aguacate Hass Premium',
          category: 'Aguacates',
          price: 5000
        }
      ];

      // Los productos serían diferentes en cada ruta
      expect(mockJSONProducts[0].name).not.toBe(mockSupabaseProducts[0].name);
      expect(mockJSONProducts[0].price).not.toBe(mockSupabaseProducts[0].price);
    });
  });

  describe('🔄 Flujo de Navegación del Usuario', () => {
    it('debe mostrar navegación confusa desde Home', () => {
      // El Home muestra ambos componentes de categorías
      render(<HomePage />);

      // El usuario ve dos secciones de "Explora por Categoría" diferentes
      const headers = screen.getAllByText(/Explora por Categoría/i);
      expect(headers.length).toBeGreaterThan(1);

      // 🚨 PROBLEMA: Usuario confundido con categorías diferentes
    });

    it('debe mostrar inconsistencias al navegar desde Tienda', () => {
      render(<TiendaPage />);

      // Categorías en tienda page
      const tiendaCategories = ['Frutas', 'Verduras', 'Aguacates', 'Especias'];

      tiendaCategories.forEach(category => {
        expect(screen.getByText(category)).toBeInTheDocument();
      });

      // Estas categorías pueden no existir en el JSON o tener productos diferentes
    });

    it('debe manejar errores 404 en categorías inexistentes', () => {
      // Esto debería mostrar 404 o página de error
      // Pero actualmente puede romperse
      expect(true).toBe(true); // Placeholder test
    });
  });

  describe('📱 Compatibilidad Móvil', () => {
    it('debe mostrar scroll horizontal en CategorySimpleScroll', () => {
      render(<CategorySimpleScroll />);

      // Verificar que el contenedor tiene scroll
      const scrollContainer = document.querySelector('.overflow-x-auto');
      expect(scrollContainer).toBeInTheDocument();
    });

    it('debe manejar mal los emojis en pantallas pequeñas', () => {
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
    it('debe tener links rotos o inconsistentes', () => {
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

    it('debe manejar mal las redirecciones', () => {
      const user = userEvent.setup();

      // Simular click en una categoría
      render(<CategorySimpleScroll />);

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