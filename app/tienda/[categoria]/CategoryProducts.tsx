'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { ProductCard } from '@/components/product/ProductCard';
import { getProductsByCategory } from '@/lib/productStorage';
import type { Product } from '@/lib/productStorage';

export function CategoryProducts({ categoria }: { categoria: string }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts();

    // 👂 Escuchar actualizaciones de fondo (cuando termine el sync)
    const handleUpdate = () => {
      console.log('⚡ Actualización recibida en CategoryProducts');
      fetchProducts();
    };

    window.addEventListener('products-updated', handleUpdate);
    return () => window.removeEventListener('products-updated', handleUpdate);
  }, [categoria]);

  async function fetchProducts() {
    try {
      setLoading(true);

      // ✅ Pasar el SLUG directamente (getProductsByCategory es inteligente)
      console.log(`🔍 Buscando productos para slug: ${categoria}`);

      // Obtener productos usando el slug
      const productsData = await getProductsByCategory(categoria);

      console.log(`✅ Encontrados ${productsData.length} productos para ${categoria}`);
      setProducts(productsData);

    } catch (error) {
      console.error('❌ Error in fetchProducts:', error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="text-center py-16">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
        <p className="text-gray-500">Cargando productos...</p>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500">No hay productos disponibles en esta categoría</p>
      </div>
    );
  }

  return (
    <>
      {/* Grid de todos los productos - SIN carousel */}
      <div>
        <div className="mb-4">
          <p className="text-gray-600 text-sm md:text-base">
            Mostrando <span className="font-bold text-green-600">{products.length}</span> producto{products.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Grid con todos los productos */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        {/* Botón Volver al final */}
        <div className="mt-12 flex justify-center">
          <Link
            href="/tienda"
            className="inline-flex items-center gap-2 bg-verde-aguacate-500 hover:bg-verde-aguacate-600 text-white font-semibold px-6 py-3 rounded-lg transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
          >
            <ChevronLeft className="w-5 h-5" />
            Volver a Categorías
          </Link>
        </div>
      </div>
    </>
  );
}
