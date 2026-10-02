import type { MetadataRoute } from 'next';

const baseUrl = 'https://tusaguacates.com';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/admin/', '/auth/', '/cuenta/', '/perfil/', '/cart/', '/checkout/'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
