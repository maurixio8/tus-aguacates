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
  const fallbackImage = '/categories/aguacates.jpg';
  const categoryImage = category.image_url || fallbackImage;

  return (
    <div className="min-h-screen bg-[#07180f] pt-16 pb-24">
      {/* Hero Banner */}
      <div className="relative h-[280px] md:h-[320px] w-full overflow-hidden">
        <Image
          src={categoryImage}
          alt={category.name}
          fill
          className="object-cover"
          priority
          unoptimized
        />

        {/* Overlay oscuro con gradiente dorado */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#07180f] via-[#07180f]/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-dorado/20 to-transparent" />

        <div className="relative h-full flex flex-col justify-between p-4 md:p-6">
          <Link
            href="/empresas"
            className="text-white hover:text-dorado font-semibold flex items-center gap-1 w-fit transition-colors backdrop-blur-md bg-black/40 px-4 py-2 rounded-lg shadow-lg border border-white/10"
          >
            <ChevronLeft className="w-4 h-4" />
            Volver a Empresas
          </Link>

          <div className="text-white">
            <div className="mb-2">
              <span className="bg-dorado text-[#07180f] px-3 py-1 rounded-full text-sm font-semibold">
                Catálogo para Empresas
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold mb-2 drop-shadow-lg">
              {category.name}
            </h1>
            <p className="text-white/80 text-base md:text-lg max-w-2xl drop-shadow-md">
              {category.description || 'Productos frescos premium para tu negocio'}
            </p>
          </div>
        </div>
      </div>

      {/* Productos */}
      <div className="container mx-auto px-4 py-8">
        <BusinessCategoryProducts categoria={categoria} />
      </div>
    </div>
  );
}

export default async function EmpresasCategoriaPage({ params }: Props) {
  const { categoria } = await params;

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
      <div className="min-h-screen bg-[#07180f] pt-20 pb-24 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-dorado mx-auto mb-4"></div>
          <p className="text-white/60">Cargando productos para empresas...</p>
        </div>
      </div>
    }>
      <CategoryHeader categoria={categoria} />
    </Suspense>
  );
}
