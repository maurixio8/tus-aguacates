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

// Mapeo de categorías a emojis y descripciones personalizadas
const CATEGORY_CONFIG: Record<string, { emoji: string; name: string; description: string; imageSlug: string }> = {
  'aguacates': {
    emoji: '🥑',
    name: 'Aguacates',
    description: 'Aguacates frescos Hass de la mejor calidad',
    imageSlug: 'aguacates'
  },
  'ofertas-combos': {
    emoji: '🔥',
    name: 'Ofertas y Combos',
    description: '¡Aprovecha nuestros combos especiales y ofertas del día!',
    imageSlug: 'aguacates'
  },
  'frutas-tropicales': {
    emoji: '🍊',
    name: 'Frutas Tropicales',
    description: 'Frutas exóticas llenas de sabor tropical',
    imageSlug: 'tropicales'
  },
  'frutos-rojos': {
    emoji: '🍓',
    name: 'Frutas Rojas',
    description: 'Deliciosas frutas rojas y bayas frescas',
    imageSlug: 'frutos-rojos'
  },
  'aromaticas': {
    emoji: '🌿',
    name: 'Aromáticas',
    description: 'Hierbas aromáticas frescas para tus recetas',
    imageSlug: 'aromaticas'
  },
  'saludables': {
    emoji: '🥗',
    name: 'Saludables',
    description: 'Productos naturales para un estilo de vida saludable',
    imageSlug: 'saludables'
  },
  'especias': {
    emoji: '🌶️',
    name: 'Especias',
    description: 'Condimentos y especias para dar sabor a tus platillos',
    imageSlug: 'especias'
  },
  'desgranados': {
    emoji: '🌽',
    name: 'Desgranados',
    description: 'Productos desgranados listos para usar',
    imageSlug: 'desgranados'
  },
  'gourmet': {
    emoji: '🍅',
    name: 'Gourmet',
    description: 'Productos gourmet selectos para los paladares más exigentes',
    imageSlug: 'gourmet'
  },
  'productos-nuevos': {
    emoji: '✨',
    name: 'Productos Nuevos',
    description: 'Descubre las últimas novedades y productos frescos en nuestra tienda',
    imageSlug: 'gourmet'
  },
  'verduras': {
    emoji: '🥬',
    name: 'Verduras',
    description: 'Verduras frescas y orgánicas',
    imageSlug: 'gourmet' // Fallback a gourmet
  }
};

function CategoryHeader({ categoria }: { categoria: string }) {
  const config = CATEGORY_CONFIG[categoria] || {
    emoji: '🛒',
    name: categoria,
    description: 'Explora nuestra selección de productos frescos',
    imageSlug: 'aguacates'
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-16 pb-24">
      {/* Hero Banner con Imagen de Fondo */}
      <div className="relative h-[280px] md:h-[320px] w-full overflow-hidden">
        {/* Imagen de fondo */}
        <Image
          src={`/categories/${config.imageSlug}.jpg`}
          alt={config.name}
          fill
          className="object-cover"
          priority
        />

        {/* Overlay degradado oscuro para legibilidad */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/70" />

        {/* Contenido superpuesto */}
        <div className="relative h-full flex flex-col justify-between p-4 md:p-6">
          {/* Botón volver arriba */}
          <Link
            href="/tienda"
            className="text-white hover:text-green-300 font-semibold flex items-center gap-1 w-fit transition-colors backdrop-blur-sm bg-black/20 px-3 py-2 rounded-lg"
          >
            <ChevronLeft className="w-4 h-4" />
            Volver
          </Link>

          {/* Título y descripción abajo */}
          <div className="text-white">
            <div className="text-5xl md:text-6xl mb-3">{config.emoji}</div>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold mb-2">
              {config.name}
            </h1>
            <p className="text-white/90 text-base md:text-lg max-w-2xl">
              {config.description}
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