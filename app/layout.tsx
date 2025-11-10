import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { ClientLayout } from "@/components/layout/ClientLayout";

const inter = Inter({ 
  subsets: ["latin"],
  variable: '--font-inter',
});

const plusJakarta = Plus_Jakarta_Sans({ 
  subsets: ["latin"],
  variable: '--font-display',
});

export const metadata: Metadata = {
  title: "Tus Aguacates | Frutas y Verduras Frescas del Eje Cafetero",
  description: "Compra aguacates, frutas y verduras frescas directamente del Eje Cafetero. Calidad garantizada, entrega martes y viernes en Bogotá.",
  keywords: "aguacates, frutas, verduras, eje cafetero, colombia, frescos, Bogotá",
  icons: {
    icon: '/favicon.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`${inter.variable} ${plusJakarta.variable} antialiased`}>
        <ClientLayout>
          {children}
        </ClientLayout>
      </body>
    </html>
  );
}
