import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Tus Aguacates | Aguacates Frescos a Domicilio en Bogotá',
  description: 'Compra aguacates frescos de agricultores locales con envío a domicilio a Bogotá. Entregas martes y viernes. Calidad garantizada y productos cosechados el mismo día.',
  keywords: ['aguacates', 'aguacates bogotá', 'compra online aguacates', 'frutas frescas', 'verduras frescas', 'envío a domicilio bogotá', 'agricultores locales', 'tienda online', 'aguacates hass', 'aguacates de alta calidad'],
  authors: [{ name: 'Tus Aguacates' }],
  creator: 'Tus Aguacates',
  publisher: 'Tus Aguacates',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://tus-aguacates.vercel.app'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'es_CO',
    url: 'https://tus-aguacates.vercel.app',
    title: 'Tus Aguacates | Aguacates Frescos a Domicilio en Bogotá',
    description: 'Compra aguacates frescos de agricultores locales con envío a domicilio a Bogotá. Entregas martes y viernes.',
    siteName: 'Tus Aguacates',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Tus Aguacates | Aguacates Frescos a Domicilio en Bogotá',
    description: 'Compra aguacates frescos de agricultores locales con envío a domicilio a Bogotá.',
    creator: '@tusaguacates',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'google-site-verification-code',
  },
};
