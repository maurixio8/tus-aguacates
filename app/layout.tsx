import type { Metadata } from "next";
import { buildSocialMetadata } from '@/lib/social-metadata';
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import "maplibre-gl/dist/maplibre-gl.css";
import { ClientLayout } from "@/components/layout/ClientLayout";
import { WebVitals } from "@/components/analytics/WebVitals";
import { GeoSchemas } from "@/components/seo/GeoSchemas";

// Optimización de carga de fuentes con preload
const inter = Inter({
  subsets: ["latin"],
  variable: '--font-inter',
  display: 'swap',
  preload: true,
});

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: '--font-display',
  display: 'swap',
  preload: true,
});

export const metadata: Metadata = {
  title: "Tus Aguacates - El #1 en Aguacates Premium del Eje Cafetero",
  description: "El proveedor líder de aguacates premium y productos frescos del Eje Cafetero. Entrega directa a hogares y negocios en Bogotá. +500 clientes satisfechos. Calidad garantizada.",
  keywords: "aguacates hass, frutas frescas, verduras, eje cafetero, colombia, bogotá, domicilio, frutas premium, combos mercado, entrega rapida, mejores aguacates",
  icons: {
    icon: '/favicon.ico',
    apple: '/favicon.png',
  },
  // Optimización SEO
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
  ...buildSocialMetadata({
    title: 'Tus Aguacates | Aguacates y productos frescos en Bogotá',
    description: 'Compra aguacates y productos frescos a domicilio en Bogotá. Consulta el catálogo, precios y disponibilidad actual.',
    path: '/',
  }),
  // Otros metadatos
  other: {
    'theme-color': '#166534',
    'msapplication-TileColor': '#166534',
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <head>
        {/* PWA Manifest */}
        <link rel="manifest" href="/manifest.json" />
        
        {/* iOS PWA meta tags */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Tus Aguacates" />
        <link rel="apple-touch-icon" href="/favicon.png" />
        
        {/* Preload critical resources */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link rel="preconnect" href="https://gxqkmaaqoehydulksudj.supabase.co" />
        
        {/* DNS prefetch para recursos externos */}
        <link rel="dns-prefetch" href="//res.cloudinary.com" />
        <link rel="dns-prefetch" href="//www.googletagmanager.com" />
      </head>
      <body className={`${inter.variable} ${plusJakarta.variable} antialiased`}>
        {/* GEO Schemas para optimización en motores de IA */}
        <GeoSchemas />
        
        {/* Componente de Web Vitals para monitoreo */}
        <WebVitals />
        
        <ClientLayout>
          {children}
        </ClientLayout>
        
        {/* Scripts de analítica al final del body para no bloquear renderizado */}
        <script dangerouslySetInnerHTML={{
          __html: `
            if (window.location.hostname !== 'localhost') {
              // Google Analytics u otros scripts de analítica aquí
            }
          `,
        }} />
      </body>
    </html>
  );
}
