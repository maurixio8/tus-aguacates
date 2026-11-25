import { NextResponse } from 'next/server';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { supabase } from '@/lib/supabase';
import { fetchSocialImage, socialImageJpeg } from '@/lib/social-product-image';

export const runtime = 'nodejs';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
  const { data: product, error } = await supabase.from('products')
    .select('main_image_url').eq(isUuid ? 'id' : 'slug', id)
    .eq('is_active', true).maybeSingle();
  if (error) return new NextResponse('Catalog temporarily unavailable', { status: 503 });
  if (!product) return new NextResponse('Product not found', { status: 404 });

  let jpeg: Buffer;
  let fallback = false;
  try {
    if (!product.main_image_url) throw new Error('No catalog image');
    jpeg = await socialImageJpeg(await fetchSocialImage(product.main_image_url));
  } catch {
    // A broken external image must not leave the link without any preview.
    fallback = true;
    jpeg = await socialImageJpeg(await readFile(path.join(process.cwd(), 'public/images/og-social.png')));
  }
  return new NextResponse(new Uint8Array(jpeg), {
    headers: {
      'Content-Type': 'image/jpeg',
      'Content-Disposition': 'inline; filename="producto.jpg"',
      'Cache-Control': fallback
        ? 'public, max-age=60, s-maxage=60'
        : 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=3600',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
