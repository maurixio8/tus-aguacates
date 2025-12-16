import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { ClientLayout } from "@/components/layout/ClientLayout";
import { WebVitals } from "@/components/analytics/WebVitals";

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
  title: "Tus Aguacates - Del Eje Cafetero a tu Mesa",
  description: "Aguacates Hass frescos y frutas premium con entrega en 48h en Bogotá. ¡Pide hoy!",
  keywords: "aguacates hass, frutas frescas, verduras, eje cafetero, colombia, bogotá, domicilio, frutas premium, combos mercado, entrega rapida",
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
  // Open Graph para redes sociales (WhatsApp, Facebook, etc.)
  openGraph: {
    type: 'website',
    locale: 'es_CO',
    url: 'https://tus-aguacates.vercel.app',
    siteName: 'Tus Aguacates',
    title: 'Tus Aguacates - Del Eje Cafetero a tu Mesa',
    description: 'Aguacates Hass frescos y frutas premium con entrega en 48h en Bogotá. ¡Pide hoy!',
    images: [
      {
        url: 'https://tus-aguacates.vercel.app/images/hero-optimized.png',
        width: 1200,
        height: 630,
        alt: 'Tus Aguacates - Aguacates frescos del Eje Cafetero',
      },
    ],
  },
  // Twitter Card (también funciona para WhatsApp)
  twitter: {
    card: 'summary_large_image',
    title: 'Tus Aguacates - Del Eje Cafetero a tu Mesa',
    description: 'Aguacates Hass frescos y frutas premium con entrega en 48h en Bogotá. ¡Pide hoy!',
    images: ['https://tus-aguacates.vercel.app/images/hero-optimized.png'],
  },
  // Otros metadatos
  other: {
    'theme-color': '#166534',
    'msapplication-TileColor': '#166534',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <head>
        {/* Preload critical resources */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link rel="preconnect" href="https://gxqkmaaqoehydulksudj.supabase.co" />

        {/* DNS prefetch para recursos externos */}
        <link rel="dns-prefetch" href="//res.cloudinary.com" />
        <link rel="dns-prefetch" href="//www.googletagmanager.com" />

        {/* Preload imágenes críticas - removido temporalmente para solucionar errores */}
        {/* <link rel="preload" as="image" href="/images/hero-optimized.png" imageSizes="(max-width: 768px) 100vw, 50vw" /> */}
      </head>
      <body className={`${inter.variable} ${plusJakarta.variable} antialiased`}>
        {/* Componente de Web Vitals para monitoreo */}
        <WebVitals />
        <ClientLayout>
          {children}
        </ClientLayout>
        {/* Scripts de analítica al final del body para no bloquear renderizado */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if (window.location.hostname !== 'localhost') {
                // Google Analytics u otros scripts de analítica aquí
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
