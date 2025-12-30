/**
 * Grid de Productos B2B
 * "Tus Aguacates" - E-commerce Platform
 */
'use client';

import { useState, useEffect } from 'react';
import { B2BProductCard } from './B2BProductCard';
import { useB2BCartStore } from '@/lib/b2b/b2b-cart-store';

interface B2BProductGridProps {
  categoryId?: string;
  search?: string;
  sortBy?: string;
}

interface Product {
  id: string;
  [key: string]: any;
}

interface ApiResponse {
  data: Product[];
  meta?: {
    pagination?: {
      total: number;
    };
  };
}

export function B2BProductGrid({ categoryId, search, sortBy }: B2BProductGridProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const addItem = useB2BCartStore((state) => state.addItem);

  useEffect(() => {
    async function fetchProducts() {
      setLoading(true);
      const queryParams = new URLSearchParams();

      // Always filter for active products
      queryParams.append('is_active', 'true');

      if (categoryId) {
        queryParams.append('category_id', categoryId);
      }

      if (search) {
        queryParams.append('search', search);
      }

      if (sortBy) {
        const [sortField, sortOrder] = sortBy.split('-');
        queryParams.append('sort_by', sortField);
        queryParams.append('sort_order', sortOrder === 'desc' ? 'desc' : 'asc');
      } else {
        // Default sort
        queryParams.append('sort_by', 'name');
        queryParams.append('sort_order', 'asc');
      }

      try {
        const url = `/api/b2b/products?${queryParams.toString()}`;
        console.log('[B2BProductGrid] Fetching:', url);
        const response = await fetch(url);

        if (!response.ok) {
          console.error('[B2BProductGrid] Error fetching:', response.statusText, response.status);
          setProducts([]);
          setTotal(0);
          return;
        }

        const result: ApiResponse = await response.json();
        console.log('[B2BProductGrid] Response:', result);
        setProducts(result.data || []);
        setTotal(result.meta?.pagination?.total || 0);
      } catch (error) {
        console.error('[B2BProductGrid] Error:', error);
        setProducts([]);
        setTotal(0);
      } finally {
        setLoading(false);
      }
    }

    fetchProducts();
  }, [categoryId, search, sortBy]);

  const handleAddToCart = async (productId: string, quantity: number) => {
    const product = products.find((p) => p.id === productId);
    if (!product) return;

    try {
      addItem(product as any, quantity);
      // TODO: Show toast notification
      alert(`${quantity} ${product.name} agregado(s) al carrito`);
    } catch (error: any) {
      alert(error.message);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-16">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
        <p className="mt-4 text-gray-600">Cargando productos...</p>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-16">
        <svg
          className="mx-auto h-24 w-24 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1}
            d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
          />
        </svg>
        <h3 className="mt-4 text-lg font-semibold text-gray-800">
          No se encontraron productos
        </h3>
        <p className="mt-2 text-gray-600">
          {search
            ? `No hay resultados para "${search}"`
            : 'No hay productos disponibles en este momento.'}
        </p>
        {(categoryId || search) && (
          <a
            href="/empresas/catalogo"
            className="inline-block mt-4 text-green-600 hover:text-green-700 font-semibold"
          >
            Ver todos los productos
          </a>
        )}
      </div>
    );
  }

  return (
    <div>
      {/* Contador de resultados */}
      <p className="text-gray-600 mb-6">
        Mostrando {products.length} de {total} productos
      </p>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((product) => (
          <B2BProductCard
            key={product.id}
            product={product as any}
            onAddToCart={(p, q) => handleAddToCart(p.id, q)}
          />
        ))}
      </div>

      {/* Paginación básica */}
      {total > products.length && (
        <div className="mt-8 flex justify-center">
          <nav className="flex items-center gap-2">
            <button
              disabled
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-400 cursor-not-allowed"
            >
              Anterior
            </button>
            <span className="px-4 py-2 bg-green-600 text-white rounded-lg">
              1
            </span>
            <button
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              2
            </button>
            <button className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
              Siguiente
            </button>
          </nav>
        </div>
      )}
    </div>
  );
}
