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

  // Mapeo de slug a imagen de Unsplash para fallback (mismas que PremiumCategoryGrid)
  const categoryFallbacks: Record<string, string> = {
    'aguacates': 'https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?w=800&h=400&fit=crop',
    'frutas-tropicales': 'https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=800&h=400&fit=crop',
    'frutos-rojos': 'https://images.unsplash.com/photo-1464965911861-746a04b4bca6?w=800&h=400&fit=crop',
    'aromaticas': 'https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?w=800&h=400&fit=crop',
    'saludables': 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=800&h=400&fit=crop',
    'especias': 'https://images.unsplash.com/photo-1596040033229-a0b13f84e434?w=800&h=400&fit=crop',
    'desgranados': 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?w=800&h=400&fit=crop',
    'gourmet': 'https://images.unsplash.com/photo-1506368249639-73a05d6f6488?w=800&h=400&fit=crop',
    'productos-nuevos': 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&h=400&fit=crop',
    'navidad': 'https://images.unsplash.com/photo-1512909006721-3d6018887383?w=800&h=400&fit=crop',
    'ofertas-combos': 'https://images.unsplash.com/photo-1506368249639-73a05d6f6488?w=800&h=400&fit=crop',
  };

  // Usar imagen de Supabase si existe, sino fallback de Unsplash
  const defaultFallback = 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&h=400&fit=crop';
  const categoryImage = category.image_url || categoryFallbacks[categoria] || defaultFallback;

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