'use client';

import Link from 'next/link';
import { ChevronLeft, Building2 } from 'lucide-react';
import { getBusinessProductsByCategory, BUSINESS_CATEGORIES } from '@/lib/business-products';
import type { BusinessProduct } from '@/lib/business-products';

export function BusinessCategoryProducts({ categoria }: { categoria: string }) {
  // Obtener productos de business-products.ts (SISTEMA CORRECTO)
  const products = getBusinessProductsByCategory(categoria);
  const categoryInfo = BUSINESS_CATEGORIES.find(cat => cat.slug === categoria);

  if (products.length === 0) {
    return (
      <div className="text-center py-16">
        <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500 text-lg mb-2">No hay productos disponibles en esta categoría</p>
        <Link
          href="/empresas"
          className="inline-block mt-4 text-orange-600 hover:text-orange-700 font-semibold"
        >
          Volver a Categorías
        </Link>
      </div>
    );
  }

  return (
    <>
      {/* Banner informativo para empresas */}
      <div className="bg-gradient-to-r from-verde-bosque/10 to-verde-aguacate/10 border-l-4 border-verde-bosque p-4 mb-6 rounded-lg">
        <div className="flex items-start gap-3">
          <Building2 className="w-5 h-5 text-verde-bosque mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-verde-bosque">Catálogo Mayorista B2B</p>
            <p className="text-sm text-gray-700">
              {products.length} productos disponibles con precios especiales por volumen
            </p>
          </div>
        </div>
      </div>

      {/* Grid de productos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>

      {/* Botón Volver */}
      <div className="mt-12 flex justify-center">
        <Link
          href="/empresas"
          className="inline-flex items-center justify-center gap-2 bg-verde-bosque hover:bg-verde-bosque/90 text-white font-semibold px-6 py-3 rounded-lg transition-all shadow-md hover:shadow-lg"
        >
          <ChevronLeft className="w-5 h-5" />
          Volver a Categorías
        </Link>
      </div>
    </>
  );
}

// Tarjeta de producto B2B con precios por volumen
function ProductCard({ product }: { product: BusinessProduct }) {
  // Obtener el mejor precio (tier más bajo por kg)
  const bestVariant = product.variants.reduce((best, current) =>
    current.pricePerKg < best.pricePerKg ? current : best
  );

  return (
    <Link
      href={`/empresas/catalogo?id=${product.id}`}
      className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden group"
    >
      {/* Imagen o gradiente de fondo */}
      <div className="relative h-48 bg-gradient-to-br from-verde-aguacate/20 to-verde-bosque/20 group-hover:scale-105 transition-transform duration-300">
        {product.image ? (
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-6xl">🥑</span>
          </div>
        )}

        {/* Badge de estado de maduración si aplica */}
        {product.ripeness && (
          <div className="absolute top-3 right-3">
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${
              product.ripeness === 'verde' ? 'bg-green-500 text-white' :
              product.ripeness === 'pinton' ? 'bg-yellow-500 text-white' :
              'bg-orange-500 text-white'
            }`}>
              {product.ripenessDescription || product.ripeness}
            </span>
          </div>
        )}
      </div>

      {/* Contenido */}
      <div className="p-5">
        <h3 className="font-bold text-lg text-gray-800 mb-2">{product.name}</h3>
        <p className="text-sm text-gray-600 mb-4 line-clamp-2">{product.description}</p>

        {/* Precios por volumen */}
        <div className="space-y-2">
          <div className="text-sm font-semibold text-verde-bosque">
            Precios por volumen:
          </div>
          {product.variants.map((variant) => (
            <div
              key={variant.id}
              className={`flex justify-between items-center text-sm p-2 rounded ${
                variant.tier === 'tier3'
                  ? 'bg-verde-bosque text-white'
                  : variant.tier === 'tier2'
                  ? 'bg-verde-aguacate/20 text-verde-bosque'
                  : 'bg-gray-100 text-gray-700'
              }`}
            >
              <span className="font-medium">{variant.name}</span>
              <span className="font-bold">
                ${variant.pricePerKg.toLocaleString()}/kg
              </span>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-4">
          <Link
            href={`/empresas/catalogo?id=${product.id}`}
            className="block w-full text-center bg-verde-bosque hover:bg-verde-bosque/90 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
          >
            Ver Detalles
          </Link>
        </div>
      </div>
    </Link>
  );
}
