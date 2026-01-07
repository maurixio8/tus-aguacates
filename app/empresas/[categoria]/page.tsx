import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { BusinessCategoryProducts } from './BusinessCategoryProducts';
import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

type Props = {
  params: Promise<{ categoria: string }>;
};

interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image_url?: string;
}

async function CategoryHeader({ categoria }: { categoria: string }) {
  // Obtener datos de la categoría B2B desde la base de datos
  const { data: categoryData } = await supabase
    .from('b2b_categories')
    .select('*')
    .eq('slug', categoria)
    .eq('is_active', true)
    .single();

  if (!categoryData) {
    return null;
  }

  const category = categoryData as Category;

  // Imagen de fallback si no hay imagen en la base de datos
  const fallbackImage = '/categories/aguacates.jpg';
  const categoryImage = category.image_url || fallbackImage;

  return (
    <div className="min-h-screen bg-gray-50 pt-16 pb-24">
      {/* Hero Banner con Imagen de Fondo */}
      <div className="relative h-[280px] md:h-[320px] w-full overflow-hidden">
        {/* Imagen de fondo desde la base de datos */}
        <Image
          src={categoryImage}
          alt={category.name}
          fill
          className="object-cover"
          priority
          unoptimized
        />

        {/* Overlay con gradiente naranja para empresas */}
        <div className="absolute inset-0 bg-gradient-to-t from-orange-600/60 via-transparent to-transparent" />

        {/* Contenido superpuesto */}
        <div className="relative h-full flex flex-col justify-between p-4 md:p-6">
          {/* Botón volver arriba */}
          <Link
            href="/empresas"
            className="text-white hover:text-orange-300 font-semibold flex items-center gap-1 w-fit transition-colors backdrop-blur-md bg-black/30 px-4 py-2 rounded-lg shadow-lg"
          >
            <ChevronLeft className="w-4 h-4" />
            Volver
          </Link>

          {/* Título y descripción abajo */}
          <div className="text-white">
            <div className="mb-2">
              <span className="bg-orange-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                Catálogo para Empresas
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold mb-2 drop-shadow-lg">
              {category.name}
            </h1>
            <p className="text-white/95 text-base md:text-lg max-w-2xl drop-shadow-md">
              {category.description || 'Productos frescos y de calidad premium para tu negocio'}
            </p>
          </div>
        </div>
      </div>

      {/* Contenedor de productos */}
      <div className="container mx-auto px-4 py-8">
        <BusinessCategoryProducts categoria={categoria} />
      </div>
    </div>
  );
}

export default async function EmpresasCategoriaPage({ params }: Props) {
  const { categoria } = await params;

  // Verificar que la categoría B2B exista
  const { data: categoryData } = await supabase
    .from('b2b_categories')
    .select('slug')
    .eq('slug', categoria)
    .eq('is_active', true)
    .single();

  if (!categoryData) {
    notFound();
  }

  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 pt-20 pb-24 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p>Cargando productos para empresas...</p>
        </div>
      </div>
    }>
      <CategoryHeader categoria={categoria} />
    </Suspense>
  );
}
