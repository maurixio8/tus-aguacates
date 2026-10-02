import type { MetadataRoute } from 'next';
import { supabase } from '@/lib/supabase';

const baseUrl = 'https://tusaguacates.com';

const staticRoutes: MetadataRoute.Sitemap = [
  '',
  '/tienda',
  '/tienda/todos',
  '/categorias',
  '/ofertas',
  '/recetas',
  '/faq',
  '/contacto',
  '/sobre-nosotros',
  '/empresas',
].map((path) => ({
  url: `${baseUrl}${path}`,
  changeFrequency: path === '/tienda' || path === '/ofertas' ? 'daily' : 'weekly',
  priority: path === '' ? 1 : path === '/tienda' ? 0.95 : 0.7,
}));

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [{ data: categories }, { data: products }] = await Promise.all([
    supabase.from('categories').select('slug,updated_at').eq('is_active', true),
    supabase.from('products').select('id,slug,updated_at').eq('is_active', true),
  ]);

  const categoryRoutes = (categories ?? []).map((category) => ({
    url: `${baseUrl}/tienda/${category.slug}`,
    lastModified: category.updated_at ? new Date(category.updated_at) : undefined,
    changeFrequency: 'daily' as const,
    priority: 0.85,
  }));

  const productRoutes = (products ?? []).map((product) => ({
    url: `${baseUrl}/productos/${product.slug || product.id}`,
    lastModified: product.updated_at ? new Date(product.updated_at) : undefined,
    changeFrequency: 'daily' as const,
    priority: 0.8,
  }));

  return [...staticRoutes, ...categoryRoutes, ...productRoutes];
}
