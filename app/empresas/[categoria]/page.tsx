import { notFound } from 'next/navigation';
import { BusinessCategoryProducts } from './BusinessCategoryProducts';
import { BUSINESS_CATEGORIES } from '@/lib/business-products';
import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';

type Props = {
  params: Promise<{ categoria: string }>;
};

export default async function EmpresasCategoriaPage({ params }: Props) {
  const { categoria } = await params;

  // Verificar que la categoría exista en business-products.ts
  const category = BUSINESS_CATEGORIES.find(cat => cat.slug === categoria);

  if (!category) {
    notFound();
  }

  // Imágenes de categoría (mapeo local)
  const CATEGORY_IMAGES: Record<string, string> = {
    'aguacates': '/categories/aguacates.jpg',
    'frutas-tropicales': '/categories/tropicales.jpg',
    'frutos-rojos': '/categories/frutos-rojos.jpg',
    'gourmet': '/categories/gourmet.jpg',
    'aromaticas': '/categories/aromaticas.jpg',
    'saludables': '/categories/saludables.jpg',
    'desgranados': '/categories/desgranados.jpg',
  };

  const categoryImage = CATEGORY_IMAGES[categoria] || '/categories/aguacates.jpg';

  return (
    <div className="min-h-screen bg-gray-50 pt-16 pb-24">
      {/* Hero Banner con Imagen de Fondo */}
      <div className="relative h-[280px] md:h-[320px] w-full overflow-hidden">
        {/* Imagen de fondo */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${categoryImage})` }}
        />

        {/* Overlay con gradiente */}
        <div className="absolute inset-0 bg-gradient-to-t from-verde-bosque/80 via-verde-bosque/40 to-transparent" />

        {/* Contenido superpuesto */}
        <div className="relative h-full flex flex-col justify-between p-4 md:p-6">
          {/* Botón volver */}
          <Link
            href="/empresas"
            className="text-white hover:text-yellow-300 font-semibold flex items-center gap-1 w-fit transition-colors backdrop-blur-md bg-black/30 px-4 py-2 rounded-lg shadow-lg"
          >
            <ChevronLeft className="w-4 h-4" />
            Volver
          </Link>

          {/* Título y descripción */}
          <div className="text-white">
            <div className="mb-2">
              <span className="bg-verde-aguacate text-white px-3 py-1 rounded-full text-sm font-semibold">
                Catálogo B2B
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold mb-2 drop-shadow-lg flex items-center gap-3">
              <span>{category.icon}</span>
              {category.name}
            </h1>
            <p className="text-white/95 text-base md:text-lg max-w-2xl drop-shadow-md">
              Productos frescos y de calidad premium para tu negocio
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
