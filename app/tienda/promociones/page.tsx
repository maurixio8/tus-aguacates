import type { Metadata } from 'next';
import PromotionsProducts from './PromotionsProducts';

export const metadata: Metadata = {
  title: 'Promociones y productos destacados | Tus Aguacates',
  description: 'Descubre las promociones y productos destacados de Tus Aguacates con domicilio en Bogotá, Chía y Soacha.',
  alternates: { canonical: '/tienda/promociones' },
  openGraph: {
    title: 'Promociones y productos destacados | Tus Aguacates',
    description: 'Compra productos frescos destacados y promociones de Tus Aguacates.',
    url: 'https://tusaguacates.com/tienda/promociones',
    type: 'website',
  },
};

export default function PromotionsPage() {
  return (
    <main className="min-h-screen bg-gray-50 pt-16 pb-24">
      <section className="relative overflow-hidden bg-gradient-to-br from-verde-bosque via-verde-bosque-700 to-verde-aguacate px-4 py-14 text-white md:py-20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(200,162,39,0.28),transparent_45%)]" />
        <div className="relative mx-auto max-w-6xl">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.22em] text-yellow-300">Selección de la semana</p>
          <h1 className="font-display text-4xl font-bold md:text-6xl">Promociones</h1>
          <p className="mt-4 max-w-2xl text-base text-white/85 md:text-xl">
            Encuentra los productos destacados que elegimos para tu mercado, con precios y disponibilidad actuales.
          </p>
        </div>
      </section>
      <section className="mx-auto max-w-6xl px-4 py-8 md:py-12">
        <PromotionsProducts />
      </section>
    </main>
  );
}
