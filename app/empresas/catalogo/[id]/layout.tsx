import { supabase } from '@/lib/supabase';
import { buildSocialMetadata } from '@/lib/social-metadata';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { data: product } = await supabase.from('b2b_products')
    .select('name,description,main_image_url').eq('id', id)
    .eq('is_active', true).is('deleted_at', null).maybeSingle();
  return buildSocialMetadata({
    title: product ? `${product.name} | Tus Aguacates Empresas` : 'Producto | Tus Aguacates Empresas',
    description: product?.description || 'Consulta productos y presentaciones para tu negocio en Tus Aguacates Empresas.',
    path: `/empresas/catalogo/${encodeURIComponent(id)}`,
    image: product?.main_image_url,
    imageAlt: product?.name,
  });
}

export default function Layout({ children }: { children: React.ReactNode }) { return children; }
