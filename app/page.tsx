'use client';

import Link from 'next/link';
import { ArrowRight, Leaf, Truck, Shield } from 'lucide-react';
import Image from 'next/image';
import PromotionSlider from '@/components/promotions/PromotionSlider';
import UnifiedCategories from '@/components/categories/UnifiedCategories';
import { PersonalizedHero } from '@/components/home/PersonalizedHero';
import { RecommendedProducts } from '@/components/home/RecommendedProducts';
import { LastOrderSummary } from '@/components/home/LastOrderSummary';

export default function Home() {

  return (
    <div>
      {/* Personalized Hero Section */}
      <PersonalizedHero />

      {/* Last Order Summary (Only for Authenticated Users) */}
      <LastOrderSummary />

      {/* Recommended Products (Only for Authenticated Users) */}
      <RecommendedProducts />

      {/* Beneficios */}
      <section className="py-12 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-verde-aguacate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Leaf className="w-8 h-8 text-verde-aguacate" />
              </div>
              <h3 className="font-display font-bold text-xl mb-2">100% Fresco</h3>
              <p className="text-gray-600">
                Productos cosechados el mismo día de tu pedido
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-verde-aguacate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Truck className="w-8 h-8 text-verde-aguacate" />
              </div>
              <h3 className="font-display font-bold text-xl mb-2">Entrega Rápida</h3>
              <p className="text-gray-600">
                Entregas martes y viernes en Bogotá
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-verde-aguacate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-verde-aguacate" />
              </div>
              <h3 className="font-display font-bold text-xl mb-2">Calidad Garantizada</h3>
              <p className="text-gray-600">
                Satisfacción 100% o te devolvemos tu dinero
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Categorías Unificadas - Scroll Horizontal */}
      <section className="py-12 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <h2 className="font-display font-bold text-2xl md:text-3xl mb-2">
              Explora por Categoría
            </h2>
            <p className="text-gray-600">
              Desliza para descubrir productos frescos de nuestra tierra
            </p>
          </div>
          <UnifiedCategories
            variant="scroll"
            showProductCount={false}
          />
        </div>
      </section>

      {/* Promotion Slider */}
      <section className="py-8">
        <div className="container mx-auto px-4">
          <PromotionSlider />
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-16 md:py-24 gradient-verde text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="font-display font-bold text-3xl md:text-5xl mb-6">
            Únete a Miles de Familias<br />
            que Disfrutan del Verdadero Sabor
          </h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Apoya a los agricultores locales y recibe los productos más frescos en tu puerta
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/auth/registro"
              className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-verde-bosque-700 hover:from-yellow-500 hover:to-yellow-700 font-bold px-8 py-4 rounded-xl transition-all shadow-lg hover:shadow-xl transform hover:scale-105 border-2 border-verde-aguacate"
            >
              Crear Cuenta
            </Link>
            <Link
              href="/tienda"
              className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-verde-bosque-700 hover:from-yellow-500 hover:to-yellow-700 font-bold px-8 py-4 rounded-xl transition-all shadow-lg hover:shadow-xl transform hover:scale-105 border-2 border-verde-aguacate"
            >
              Ver Productos
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
