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
  title: "Tus Aguacates | Frutas y Verduras Frescas del Eje Cafetero",
  description: "Compra aguacates, frutas y verduras frescas directamente del Eje Cafetero. Calidad garantizada, entrega martes y viernes en Bogotá.",
  keywords: "aguacates, frutas, verduras, eje cafetero, colombia, frescos, Bogotá",
  icons: {
    icon: '/favicon.ico',
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
  verification: {
    google: 'tu-google-verification-code', // Agregar código de verificación
  },
  // Open Graph para redes sociales
  openGraph: {
    type: 'website',
    locale: 'es_CO',
    url: 'https://tusaguacates.com',
    title: 'Tus Aguacates | Frutas y Verduras Frescas del Eje Cafetero',
    description: 'Compra aguacates, frutas y verduras frescas directamente del Eje Cafetero. Calidad garantizada, entrega martes y viernes en Bogotá.',
    images: [
      {
        url: '/images/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Tus Aguacates - Productos Frescos',
      },
    ],
  },
  // Preload critical resources
  other: {
    'theme-color': '#10b981',
    'msapplication-TileColor': '#10b981',
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
        <link rel="preconnect" href="https://qxoqgpdqgroyxkwsjtii.supabase.co" />

        {/* DNS prefetch para recursos externos */}
        <link rel="dns-prefetch" href="//res.cloudinary.com" />
        <link rel="dns-prefetch" href="//www.googletagmanager.com" />

        {/* Preload imágenes críticas */}
        <link rel="preload" as="image" href="/images/hero-banner.jpg" imagesizes="(max-width: 768px) 100vw, 50vw" />
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
