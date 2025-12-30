/**
 * Página del Catálogo B2B
 * "Tus Aguacates" - E-commerce Platform
 */

// Force dynamic rendering for B2B catalog
export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { B2BProductGrid } from '@/components/b2b/catalog/B2BProductGrid';
import { B2BCategoryFilter } from '@/components/b2b/catalog/B2BCategoryFilter';

export const metadata = {
  title: 'Catálogo Empresas - Tus Aguacates',
  description: 'Catálogo de productos al por mayor para empresas. Precios especiales por volumen.',
};

export default async function B2BCatalogPage({
  searchParams,
}: {
  searchParams: { category?: string; search?: string; sort?: string };
}) {
  const category = searchParams.category;
  const search = searchParams.search;
  const sort = searchParams.sort || 'name';

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-800 mb-2">
          Catálogo Empresas
        </h1>
        <p className="text-gray-600">
          Precios especiales por volumen para tu negocio
        </p>
      </div>

      {/* Breadcrumb */}
      <nav className="text-sm mb-6">
        <ol className="flex items-center space-x-2">
          <li>
            <Link href="/empresas" className="text-green-600 hover:text-green-700">
              Inicio
            </Link>
          </li>
          <li className="text-gray-400">/</li>
          <li className="text-gray-600">Catálogo</li>
        </ol>
      </nav>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar - Filtros */}
        <aside className="lg:w-64 flex-shrink-0">
          <B2BCategoryFilter selectedCategory={category} />

          {/* Info de precios por volumen */}
          <div className="bg-green-50 rounded-lg p-4 mt-6">
            <h3 className="font-semibold text-green-800 mb-2">
              ¿Cómo funcionan los precios?
            </h3>
            <p className="text-sm text-green-700">
              Los precios se calculan automáticamente según la cantidad que agregues al carrito. Cuanto más compres, mejor precio.
            </p>
          </div>
        </aside>

        {/* Grid de Productos */}
        <main className="flex-1">
          {/* Barra de búsqueda y ordenamiento */}
          <div className="bg-white rounded-lg shadow p-4 mb-6 flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="flex-1 w-full">
              <input
                type="search"
                name="search"
                placeholder="Buscar productos..."
                defaultValue={search}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">Ordenar por:</label>
              <select
                name="sort"
                defaultValue={sort}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              >
                <option value="name">Nombre A-Z</option>
                <option value="name-desc">Nombre Z-A</option>
                <option value="price">Precio: Menor a Mayor</option>
                <option value="price-desc">Precio: Mayor a Menor</option>
                <option value="created_at">Más Recientes</option>
              </select>
            </div>
          </div>

          {/* Grid de productos */}
          <B2BProductGrid
            categoryId={category}
            search={search}
            sortBy={sort}
          />
        </main>
      </div>
    </div>
  );
}
