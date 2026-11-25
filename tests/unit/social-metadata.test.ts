import { describe, expect, it } from 'vitest';
import { buildSocialMetadata, DEFAULT_SOCIAL_IMAGE, SITE_URL } from '@/lib/social-metadata';

describe('buildSocialMetadata', () => {
  it('uses a consistent absolute canonical and fallback image', () => {
    const metadata = buildSocialMetadata({ title: 'Tienda', description: 'Productos frescos', path: '/tienda' });
    expect(metadata.alternates?.canonical).toBe(`${SITE_URL}/tienda`);
    expect(metadata.openGraph).toMatchObject({ url: `${SITE_URL}/tienda`, title: 'Tienda', description: 'Productos frescos', images: [{ url: DEFAULT_SOCIAL_IMAGE, width: 1200, height: 630, alt: 'Tienda' }] });
    expect(metadata.twitter).toMatchObject({ card: 'summary_large_image', images: [DEFAULT_SOCIAL_IMAGE] });
  });

  it('resolves local and remote images without inventing dimensions', () => {
    for (const [image, expected] of [['/foto.png', `${SITE_URL}/foto.png`], ['https://example.com/foto.jpg', 'https://example.com/foto.jpg']]) {
      const metadata = buildSocialMetadata({ title: 'Receta', description: 'Una receta', path: '/recetas/ejemplo', image, imageAlt: 'Foto', type: 'article' });
      expect(metadata.openGraph).toMatchObject({ type: 'article', images: [{ url: expected, alt: 'Foto' }] });
      const images = metadata.openGraph?.images as Array<Record<string, unknown>>;
      expect(images[0]).not.toHaveProperty('width');
      expect(images[0]).not.toHaveProperty('height');
      expect(metadata.twitter).toMatchObject({ images: [expected] });
    }
  });
});
