'use client';

import Link from 'next/link';
import { SearchTrigger } from '@/components/tienda/SearchTrigger';
import PremiumCategoryGrid from '@/components/categories/PremiumCategoryGrid';
import { FeaturedProductsCarousel } from '@/components/home/FeaturedProductsCarousel';

export default function TiendaPage() {

  return (
    <div className="container mx-auto px-4 py-12">
      {/* Categories Grid Premium */}
      <PremiumCategoryGrid />

      {/* Mobile Search Section - Added between categories and featured products */}
      <div className="mb-12 md:hidden">
        <SearchTrigger />
      </div>

      {/* Featured Products Carousel - Mismo carrusel de la página principal */}
      <div className="mb-16">
        <div className="text-center mb-8">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-800">
            Productos Más Populares
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Los favoritos de nuestros clientes
          </p>
        </div>
        <FeaturedProductsCarousel
          autoPlay={true}
          interval={3500}
          showDots={true}
          showArrows={true}
          maxProducts={8}
        />
      </div>

      {/* CTA Section */}
      <div className="text-center py-12 bg-gradient-to-r from-green-50 to-emerald-50 rounded-3xl">
        <h2 className="text-3xl font-bold mb-4 text-gray-800">
          ¿Listo para disfrutar de productos frescos?
        </h2>
        <p className="text-lg text-gray-600 mb-6 max-w-2xl mx-auto">
          Explora nuestro catálogo completo y descubre la calidad que nos caracteriza
        </p>
        <Link
          href="/tienda"
          prefetch={false}
          className="inline-block bg-green-600 hover:bg-green-700 text-white font-bold px-8 py-4 rounded-xl transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
        >
          Ver Todos los Productos
        </Link>
      </div>
    </div>
  );
}