'use client';

import Link from 'next/link';
import { ChevronLeft, Building2, Package, Database } from 'lucide-react';
import { BusinessProductCard } from '@/components/product/BusinessProductCard';
import { BUSINESS_CATEGORIES } from '@/lib/business-products';
import { useB2BProductsByCategory } from '@/hooks/useB2BProducts';

export function BusinessCategoryProducts({ categoria }: { categoria: string }) {
  const { products, loading, source } = useB2BProductsByCategory(categoria);
  const categoryInfo = BUSINESS_CATEGORIES.find(c => c.slug === categoria);

  if (loading) {
    return (
      <div className="text-center py-16">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-dorado mx-auto mb-4"></div>
        <p className="text-white/50">Cargando productos para empresas...</p>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-16">
        <Building2 className="w-16 h-16 text-white/20 mx-auto mb-4" />
        <p className="text-white/60 text-lg mb-2">No hay productos B2B en esta categoría</p>
        <p className="text-white/40 text-sm mb-4">Pronto agregaremos más productos para tu empresa</p>
        <Link
          href="/empresas"
          className="inline-flex items-center gap-2 text-dorado hover:text-yellow-400 font-semibold transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Ver otras categorías
        </Link>
      </div>
    );
  }

  return (
    <>
      {/* Banner informativo */}
      <div className="bg-gradient-to-r from-dorado/10 to-yellow-500/5 border-l-4 border-dorado p-4 mb-6 rounded-lg">
        <div className="flex items-start gap-3">
          <Package className="w-5 h-5 text-dorado mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-dorado">
              Catálogo B2B — {categoryInfo?.name || categoria}
            </p>
            <p className="text-sm text-white/60">
              Productos con precios escalonados por volumen. Cuanto más compres, mejor precio.
            </p>
          </div>
        </div>
      </div>

      {/* Leyenda de precios */}
      <div className="flex flex-wrap gap-2 mb-6">
        <span className="text-xs bg-white/[0.06] border border-white/10 px-3 py-1 rounded-full text-white/60">
          🟢 Tier 1: Volumen bajo
        </span>
        <span className="text-xs bg-white/[0.06] border border-white/10 px-3 py-1 rounded-full text-white/60">
          🟡 Tier 2: Volumen medio
        </span>
        <span className="text-xs bg-white/[0.06] border border-white/10 px-3 py-1 rounded-full text-white/60">
          🟠 Tier 3: Volumen alto (mejor precio)
        </span>
      </div>

      {/* Conteo */}
      <div className="mb-4 flex items-center gap-2 flex-wrap">
        <p className="text-white/60 text-sm md:text-base">
          Mostrando <span className="font-bold text-dorado">{products.length}</span> producto{products.length !== 1 ? 's' : ''} para empresas
        </p>
        {source === 'supabase' && (
          <span className="inline-flex items-center gap-1 text-xs bg-dorado/10 text-dorado px-2 py-0.5 rounded-full border border-dorado/20">
            <Database className="w-3 h-3" />
            Precios actualizados
          </span>
        )}
      </div>

      {/* Grid de productos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((product) => (
          <BusinessProductCard key={product.id} product={product} />
        ))}
      </div>

      {/* Navegación */}
      <div className="mt-12 flex justify-center gap-4 flex-col sm:flex-row">
        <Link
          href="/empresas"
          className="inline-flex items-center justify-center gap-2 bg-white/[0.06] border border-white/20 hover:border-dorado/40 text-white font-semibold px-6 py-3 rounded-xl transition-all hover:bg-white/10"
        >
          <ChevronLeft className="w-5 h-5" />
          Volver a Categorías
        </Link>
        <a
          href="https://wa.me/573042582777?text=Hola,%20quiero%20hacer%20un%20pedido%20mayorista"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 bg-dorado hover:bg-yellow-500 text-[#07180f] font-bold px-6 py-3 rounded-xl transition-all shadow-lg hover:shadow-dorado/30"
        >
          💬 Contactar por WhatsApp
        </a>
      </div>
    </>
  );
}
