'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronLeft, Building2 } from 'lucide-react';
import { ProductCard } from '@/components/product/ProductCard';
import { getProductsByCategory } from '@/lib/productStorage';
import type { Product } from '@/lib/productStorage';

export function BusinessCategoryProducts({ categoria }: { categoria: string }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts();

    // 👂 Escuchar actualizaciones de fondo (cuando termine el sync)
    const handleUpdate = () => {
      console.log('⚡ Actualización recibida en BusinessCategoryProducts');
      fetchProducts();
    };

    window.addEventListener('products-updated', handleUpdate);
    return () => window.removeEventListener('products-updated', handleUpdate);
  }, [categoria]);

  async function fetchProducts() {
    try {
      setLoading(true);

      // ✅ Obtener productos con filtro de disponibilidad para empresas
      console.log(`🏢 Buscando productos para empresas en categoría: ${categoria}`);

      // Obtener productos filtrando por disponibilidad 'business' o 'both'
      const productsData = await getProductsByCategory(categoria, 'business');

      console.log(`✅ Encontrados ${productsData.length} productos para empresas en ${categoria}`);
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
        <p className="text-gray-500">Cargando productos para empresas...</p>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-16">
        <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500 text-lg mb-2">No hay productos disponibles para empresas en esta categoría</p>
        <p className="text-gray-400 text-sm">Los productos específicos para empresas aparecerán aquí</p>
      </div>
    );
  }

  return (
    <>
      {/* Banner informativo para empresas */}
      <div className="bg-gradient-to-r from-orange-50 to-amber-50 border-l-4 border-orange-500 p-4 mb-6 rounded-lg">
        <div className="flex items-start gap-3">
          <Building2 className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-orange-900">Catálogo para Empresas</p>
            <p className="text-sm text-orange-700">
              Estos productos están disponibles para tu negocio. Contacta con nosotros para precios especiales por volumen.
            </p>
          </div>
        </div>
      </div>

      {/* Grid de todos los productos */}
      <div>
        <div className="mb-4">
          <p className="text-gray-600 text-sm md:text-base">
            Mostrando <span className="font-bold text-orange-600">{products.length}</span> producto{products.length !== 1 ? 's' : ''} para empresas
          </p>
        </div>

        {/* Grid con todos los productos */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        {/* Botón Volver al final */}
        <div className="mt-12 flex justify-center gap-4 flex-col sm:flex-row">
          <Link
            href="/empresas"
            className="inline-flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold px-6 py-3 rounded-lg transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
          >
            <ChevronLeft className="w-5 h-5" />
            Volver a Categorías
          </Link>
          <a
            href="mailto:empresas@tusaguacates.com"
            className="inline-flex items-center justify-center gap-2 bg-verde-bosque-700 hover:bg-verde-bosque-800 text-white font-semibold px-6 py-3 rounded-lg transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
          >
            Solicitar Cotización
          </a>
        </div>
      </div>
    </>
  );
}
