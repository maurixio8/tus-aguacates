'use client';

import { useState, useEffect } from 'react';
import ProductSwiper from '@/components/product/ProductSwiper';
import { ProductCard } from '@/components/product/ProductCard';
import { getProductsByCategory, slugToCategory } from '@/lib/productStorage';
import type { Product } from '@/lib/productStorage';

export function CategoryProducts({ categoria }: { categoria: string }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, [categoria]);

  function fetchProducts() {
    try {
      setLoading(true);

      // Convertir slug a nombre de categoría
      const categoryName = slugToCategory(categoria);
      console.log(`🔍 Buscando productos para categoría: ${categoria} -> ${categoryName}`);

      // Obtener productos del localStorage compartido
      const productsData = getProductsByCategory(categoryName);

      console.log(`✅ Encontrados ${productsData.length} productos para ${categoryName}`);
      setProducts(productsData);

    } catch (error) {
      console.error('Error in fetchProducts:', error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }

  const first12 = products.slice(0, 12);

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
      {/* Slider inicial - SIN botón agregar */}
      <div className="mb-12">
        <h2 className="text-2xl font-display font-bold mb-6 px-4">
          Productos Destacados
        </h2>
        <ProductSwiper
          products={first12}
          title=""
        />

        {/* Botón Ver Más */}
        {products.length > 12 && (
          <div className="text-center mt-8">
            {!showAll ? (
              <button
                onClick={() => setShowAll(true)}
                className="bg-green-600 hover:bg-green-700 text-white font-bold px-8 py-3 rounded-xl transition-all shadow-lg hover:shadow-xl"
              >
                Ver Más Productos ({products.length - 12} más)
              </button>
            ) : (
              <div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
                  {products.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
                <div className="text-center">
                  <button
                    onClick={() => setShowAll(false)}
                    className="bg-gray-600 hover:bg-gray-700 text-white font-bold px-8 py-3 rounded-xl transition-all shadow-lg hover:shadow-xl"
                  >
                    Mostrar Menos
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}