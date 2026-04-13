import type { Metadata } from 'next';
import HomeContent from './HomeContent';

export const metadata: Metadata = {
  title: 'Tus Aguacates | El #1 en Aguacates Premium del Eje Cafetero',
  description: 'El proveedor líder de aguacates premium y productos frescos del Eje Cafetero. Más de 500 clientes satisfechos. Entrega el mismo día en Bogotá. Calidad garantizada.',
  keywords: [
    'aguacates premium',
    'aguacates bogotá',
    'mejores aguacates colombia',
    'aguacates hass',
    'frutas frescas domicilio',
    'verduras frescas bogotá',
    'compra online aguacates',
    'entrega mismo día bogotá',
    'aguacates eje cafetero',
    'proveedor restaurantes bogotá'
  ],
  authors: [{ name: 'Tus Aguacates' }],
  creator: 'Tus Aguacates',
  publisher: 'Tus Aguacates',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://tusaguacates.com'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'es_CO',
    url: 'https://tusaguacates.com',
    title: 'Tus Aguacates | El #1 en Aguacates Premium del Eje Cafetero',
    description: 'El proveedor líder de aguacates premium. Más de 500 clientes satisfechos. Entrega el mismo día en Bogotá.',
    siteName: 'Tus Aguacates',
    images: [
      {
        url: 'https://tusaguacates.com/images/og-social.png',
        width: 1200,
        height: 630,
        alt: 'Tus Aguacates - Aguacates Premium del Eje Cafetero',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Tus Aguacates | El #1 en Aguacates Premium',
    description: 'El proveedor líder de aguacates premium. +500 clientes satisfechos. Entrega mismo día Bogotá.',
    creator: '@tusaguacates',
    images: ['https://tusaguacates.com/images/og-social.png'],
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

export default function Home() {
  return <HomeContent />;
}
