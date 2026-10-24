'use client';

import { Facebook, Instagram, MessageCircle, PlayCircle, Sparkles } from 'lucide-react';

const SOCIAL_LINKS = {
  instagram: 'https://www.instagram.com/invites/contact/?igsh=aw5gc4o2dib7&utm_content=mb2lvuk',
  facebook: 'https://www.facebook.com/aguacates.laesmeralda?mibextid=ZbWKwL',
  tiktok: 'https://www.tiktok.com/@tusaguacates',
  whatsapp: 'https://wa.me/573042582777?text=Hola%2C%20quiero%20conocer%20el%20grupo%20de%20recetas%20de%20Tus%20Aguacates',
};

export default function VideosPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-green-950 via-green-900 to-emerald-950 text-white">
      <section className="mx-auto flex min-h-[70vh] max-w-4xl flex-col items-center justify-center px-6 py-20 text-center">
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-white/10 ring-1 ring-white/20">
          <PlayCircle className="h-10 w-10 text-amber-300" aria-hidden="true" />
        </div>
        <p className="mb-3 inline-flex items-center gap-2 rounded-full bg-amber-300/15 px-4 py-2 text-sm font-semibold text-amber-200">
          <Sparkles className="h-4 w-4" aria-hidden="true" /> Comunidad Tus Aguacates
        </p>
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">Vídeos en preparación</h1>
        <p className="mt-5 max-w-2xl text-lg leading-8 text-green-100">
          Estamos preparando vídeos reales de recetas, productos y consejos para que encuentres ideas frescas y fáciles de disfrutar.
        </p>
        <p className="mt-3 max-w-xl text-sm leading-6 text-green-200/90">
          Mientras terminamos esta sección, puedes seguir nuestras redes y escribirnos para conocer la comunidad de recetas.
        </p>

        <div className="mt-9 grid w-full max-w-2xl gap-3 sm:grid-cols-4">
          <a href={SOCIAL_LINKS.instagram} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-gradient-to-tr from-purple-600 via-pink-500 to-orange-400 px-4 py-3 font-semibold shadow-lg transition hover:-translate-y-0.5">
            <Instagram className="h-5 w-5" aria-hidden="true" /> Instagram
          </a>
          <a href={SOCIAL_LINKS.facebook} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 font-semibold shadow-lg transition hover:-translate-y-0.5">
            <Facebook className="h-5 w-5" aria-hidden="true" /> Facebook
          </a>
          <a href={SOCIAL_LINKS.tiktok} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-black px-4 py-3 font-semibold shadow-lg transition hover:-translate-y-0.5">
            <span className="text-lg" aria-hidden="true">♪</span> TikTok
          </a>
          <a href={SOCIAL_LINKS.whatsapp} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-green-500 px-4 py-3 font-semibold shadow-lg transition hover:-translate-y-0.5">
            <MessageCircle className="h-5 w-5" aria-hidden="true" /> Recetas
          </a>
        </div>

        <p className="mt-8 text-xs text-green-200/70">
          No hay vídeos publicados todavía; por eso no mostramos tarjetas repetidas ni contenido de ejemplo.
        </p>
      </section>
    </main>
  );
}
