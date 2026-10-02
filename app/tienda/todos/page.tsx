import type { Metadata } from 'next';
import AllProducts from './AllProducts';

export const metadata: Metadata = {
  title: 'Todos los productos | Aguacates, frutas y verduras en Bogotá',
  description: 'Explora todos los productos activos de Tus Aguacates: aguacates, frutas, verduras, combos y alimentos frescos con precios y presentaciones actuales.',
  alternates: { canonical: '/tienda/todos' },
};

export default function TodosProductosPage() {
  return (
    <main className="min-h-screen bg-gray-50 px-4 py-12">
      <header className="mx-auto mb-10 max-w-7xl">
        <h1 className="text-4xl font-bold text-gray-900 md:text-5xl">Todos los productos</h1>
        <p className="mt-4 max-w-3xl text-lg text-gray-600">
          Revisa el catálogo activo de aguacates, frutas y verduras. Cada ficha muestra la presentación y el precio vigente para comprar en línea.
        </p>
      </header>
      <section className="mx-auto max-w-7xl" aria-label="Catálogo completo">
        <AllProducts />
      </section>
    </main>
  );
}
