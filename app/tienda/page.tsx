import type { Metadata } from 'next';
import Link from 'next/link';
import { SearchTrigger } from '@/components/tienda/SearchTrigger';
import PremiumCategoryGrid from '@/components/categories/PremiumCategoryGrid';
import { FeaturedProductsCarousel } from '@/components/home/FeaturedProductsCarousel';

export const metadata: Metadata = {
  title: 'Comprar aguacates, frutas y verduras en Bogotá | Tus Aguacates',
  description: 'Compra aguacates, frutas y verduras frescas a domicilio en Bogotá. Revisa presentaciones, precios, promociones y disponibilidad actual en nuestra tienda.',
  alternates: { canonical: '/tienda' },
  openGraph: {
    title: 'Tienda de aguacates, frutas y verduras en Bogotá',
    description: 'Productos frescos, promociones y compra en línea con domicilio en Bogotá.',
    url: 'https://tusaguacates.com/tienda',
    type: 'website',
  },
};

export default function TiendaPage() {

  return (
    <main className="container mx-auto px-4 py-12">
      <header className="mb-10 text-center">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900">Tienda de aguacates, frutas y verduras</h1>
        <p className="mx-auto mt-4 max-w-3xl text-lg text-gray-600">
          Compra productos frescos a domicilio en Bogotá. Explora por categoría, compara presentaciones y revisa el precio y la disponibilidad actual antes de añadir al carrito.
        </p>
        <nav aria-label="Navegación de la tienda" className="mt-6 flex flex-wrap justify-center gap-3">
          <Link href="/tienda/todos" className="rounded-full border border-green-700 px-4 py-2 font-semibold text-green-800 hover:bg-green-50">Ver todos los productos</Link>
          <Link href="/ofertas" className="rounded-full border border-amber-600 px-4 py-2 font-semibold text-amber-700 hover:bg-amber-50">Ver promociones</Link>
          <Link href="/faq" className="rounded-full border border-gray-300 px-4 py-2 font-semibold text-gray-700 hover:bg-gray-50">Preguntas frecuentes</Link>
        </nav>
      </header>

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
          href="/tienda/todos"
          prefetch={false}
          className="inline-block bg-green-600 hover:bg-green-700 text-white font-bold px-8 py-4 rounded-xl transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
        >
          Ver Todos los Productos
        </Link>
      </div>
    </main>
  );
}