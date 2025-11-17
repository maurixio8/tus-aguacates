import { redirect, permanentRedirect } from 'next/navigation';

interface CategoryPageProps {
  params: Promise<{
    slug: string;
  }>;
}

// Redirección permanente de /categoria/[slug] a /tienda/[slug]
// Esto mantiene compatibilidad con enlaces antiguos y unifica el routing
export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params;

  // Redirigir permanentemente a la nueva estructura
  permanentRedirect(`/tienda/${slug}`);
}