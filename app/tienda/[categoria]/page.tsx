import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { CategoryProducts } from './CategoryProducts';
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
  // Obtener datos de la categoría desde la base de datos
  const { data: categoryData } = await supabase
    .from('categories')
    .select('*')
    .eq('slug', categoria)
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

        {/* Overlay sutil solo en la parte inferior para el texto */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

        {/* Contenido superpuesto */}
        <div className="relative h-full flex flex-col justify-between p-4 md:p-6">
          {/* Botón volver arriba */}
          <Link
            href="/tienda"
            className="text-white hover:text-green-300 font-semibold flex items-center gap-1 w-fit transition-colors backdrop-blur-md bg-black/30 px-4 py-2 rounded-lg shadow-lg"
          >
            <ChevronLeft className="w-4 h-4" />
            Volver
          </Link>

          {/* Título y descripción abajo */}
          <div className="text-white">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold mb-2 drop-shadow-lg">
              {category.name}
            </h1>
            <p className="text-white/95 text-base md:text-lg max-w-2xl drop-shadow-md">
              {category.description || 'Explora nuestra selección de productos frescos'}
            </p>
          </div>
        </div>
      </div>

      {/* Contenedor de productos */}
      <div className="container mx-auto px-4 py-8">
        <CategoryProducts categoria={categoria} />
      </div>
    </div>
  );
}

export default async function CategoriaPage({ params }: Props) {
  const { categoria } = await params;

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