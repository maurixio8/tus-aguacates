import { NextResponse } from 'next/server';

export const dynamic = 'force-static';

export async function GET() {
  const manifest = {
    name: "Tus Aguacates - Del Eje Cafetero a tu Mesa",
    short_name: "TusAguacates",
    description: "Aguacates Hass frescos y frutas premium con entrega en 48h en Bogotá",
    start_url: "/",
    display: "standalone",
    background_color: "#FFFEF5",
    theme_color: "#2D5016",
    orientation: "portrait-primary",
    scope: "/",
    icons: [
      {
        src: "/favicon.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any maskable"
      }
    ],
    categories: ["shopping", "food"],
    lang: "es-CO",
    prefer_related_applications: false
  };

  return NextResponse.json(manifest, {
    headers: {
      'Content-Type': 'application/manifest+json',
      'Cache-Control': 'public, max-age=86400',
    },
  });
}
