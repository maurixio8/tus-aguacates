'use client';

import Link from 'next/link';
import { ArrowRight, Leaf, Truck, Shield } from 'lucide-react';
import { ProductCard } from '@/components/product/ProductCard';
import ProductSwiper from '@/components/product/ProductSwiper';
import Image from 'next/image';
import PromotionSlider from '@/components/promotions/PromotionSlider';
import CategoryScroll from '@/components/categories/CategoryScroll';
import CategorySimpleScroll from '@/components/categories/CategorySimpleScroll';
import { useState, useEffect } from 'react';
import { initializeProducts, getProductsByCategory } from '@/lib/productStorage';
import type { Product } from '@/lib/productStorage';

export default function Home() {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoading(true);

        // Inicializar productos (sincronizar si es necesario)
        await initializeProducts();

        // Obtener productos destacados o los más recientes
        const allProducts = getProductsByCategory('todos');

        // Prioridad: productos destacados > productos recientes
        const featured = allProducts
          .filter(p => p.is_active !== false)
          .filter(p => p.is_featured || true) // Si no hay destacados, usar todos
          .slice(0, 12);

        setFeaturedProducts(featured);

      } catch (error) {
        console.error('Error loading products:', error);
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, []);

  return (
    <div>
      {/* Hero Section */}
      <section className="relative text-white py-16 md:py-24 overflow-hidden">
        {/* Imagen de fondo SIN overlays */}
        <div className="absolute inset-0">
          <Image
            src="/images/hero-limpio.png"
            alt="Fondo hero"
            fill
            className="object-cover"
            priority
          />
        </div>

        {/* Contenido */}
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            {/* Título según especificación del usuario */}
            <h1 className="text-4xl md:text-6xl font-display font-bold mb-6">
              Del Corazón de Colombia
              <br />
              <span className="text-yellow-400">a tu Mesa</span>
            </h1>

            {/* Subtítulo */}
            <p className="text-xl md:text-2xl mb-8 text-white/90">
              Frutas y verduras frescas, cultivadas con amor por familias campesinas colombianas
            </p>

            {/* UN SOLO botón - diseño simple */}
            <Link
              href="/tienda"
              className="bg-yellow-400 hover:bg-yellow-500 text-green-900 font-bold px-8 py-4 rounded-xl transition-all inline-flex items-center justify-center gap-2 shadow-lg"
            >
              Explorar Tienda
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

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

      {/* Categorías con imágenes */}
      <section className="py-12 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <h2 className="font-display font-bold text-2xl md:text-3xl mb-2">
              Explora por Categoría
            </h2>
            <p className="text-gray-600 text-sm">
              Explora nuestras categorías de productos frescos
            </p>
          </div>
          <CategorySimpleScroll />
        </div>
      </section>

      {/* Promotion Slider */}
      <section className="py-8">
        <div className="container mx-auto px-4">
          <PromotionSlider />
        </div>
      </section>

      {/* Categories Scroll */}
      <section>
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <h2 className="font-display font-bold text-2xl md:text-3xl mb-2">
              Explora por Categoría
            </h2>
            <p className="text-gray-600">
              Desliza para descubrir productos frescos
            </p>
          </div>
          <CategoryScroll />
        </div>
      </section>

      {/* Productos Destacados con Swiper */}
      <section className="py-4 bg-gray-50">
        {loading ? (
          <div className="container mx-auto px-4">
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-verde-bosque"></div>
              <p className="mt-2 text-gray-600">Cargando productos frescos...</p>
            </div>
          </div>
        ) : (
          <ProductSwiper
            products={featuredProducts}
            title="Lo Más Fresco"
          />
        )}
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
