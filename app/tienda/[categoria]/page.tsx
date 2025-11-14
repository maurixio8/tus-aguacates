import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { CategoryProducts } from './CategoryProducts';
import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';

function CategoryHeader({ categoria }: { categoria: string }) {
  return (
    <div className="min-h-screen bg-gray-50 pt-20 pb-24">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/tienda"
            className="text-green-600 hover:text-green-700 font-semibold underline flex items-center gap-1 mb-4 inline-block"
          >
            <ChevronLeft className="w-4 h-4" />
            Volver a la tienda
          </Link>

          <h1 className="text-3xl md:text-4xl font-display font-bold mb-2 capitalize">
            {categoria === 'hierbas-aromaticas' ? 'Hierbas Aromáticas' : categoria}
          </h1>
          <p className="text-gray-600">
            Explora nuestra selección de productos frescos
          </p>
        </div>

        <CategoryProducts categoria={categoria} />
      </div>
    </div>
  );
}

export default async function CategoriaPage({
  params
}: {
  params: { categoria: string }
}) {
  const categoria = params.categoria;

  // Verificar que la categoría exista
  const { data: categoryData } = await supabase
    .from('categories')
    .select('slug')
    .eq('slug', categoria)
    .single();

  if (!categoryData) {
    notFound();
  }

  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 pt-20 pb-24 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p>Cargando productos...</p>
        </div>
      </div>
    }>
      <CategoryHeader categoria={categoria} />
    </Suspense>
  );
}