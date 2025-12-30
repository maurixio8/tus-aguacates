'use client';

import Link from 'next/link';
import { ArrowRight, Mail, Phone } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { ProductCard } from '@/components/product/ProductCard';
import type { UnifiedProduct } from '@/lib/types';

// Interface para categorías
interface Category {
  slug: string;
  name: string;
  image: string;
  color: string;
}

// Solo las 5 categorías que necesita empresas (slugs de referencia)
const BUSINESS_CATEGORY_SLUGS = [
  'aguacates',
  'frutas-tropicales',
  'frutos-rojos',
  'gourmet',
  'aromaticas'
];

export default function EmpresasPage() {
  const [featuredProducts, setFeaturedProducts] = useState<UnifiedProduct[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);

      // Cargar categorías desde Supabase
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('slug, name, image_url')
        .in('slug', BUSINESS_CATEGORY_SLUGS);

      if (!categoriesError && categoriesData) {
        // Mapear las categorías con sus imágenes desde la BD
        const colorMap: Record<string, string> = {
          'aguacates': 'from-green-500 to-green-700',
          'frutas-tropicales': 'from-orange-500 to-red-600',
          'frutos-rojos': 'from-red-500 to-pink-600',
          'gourmet': 'from-red-500 to-orange-700',
          'aromaticas': 'from-emerald-500 to-teal-600'
        };

        const formattedCategories = categoriesData.map(cat => ({
          slug: cat.slug,
          name: cat.name,
          image: cat.image_url || '/categories/aguacates.jpg', // Fallback
          color: colorMap[cat.slug] || 'from-gray-500 to-gray-700'
        }));

        // Ordenar según el orden de BUSINESS_CATEGORY_SLUGS
        const orderedCategories = BUSINESS_CATEGORY_SLUGS
          .map(slug => formattedCategories.find(cat => cat.slug === slug))
          .filter((cat): cat is Category => cat !== undefined);

        setCategories(orderedCategories);
      }

      // Obtener productos destacados
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .eq('is_featured', true)
        .limit(8);

      if (!productsError && productsData) {
        setFeaturedProducts(productsData as UnifiedProduct[]);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      {/* Hero Compacto */}
      <section className="bg-gradient-to-r from-verde-bosque to-verde-bosque-800 text-white py-12 md:py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="font-display font-bold text-3xl md:text-5xl mb-4">
            Calidad Premium para tu Negocio
          </h1>
          <p className="text-lg md:text-xl mb-6 text-white/90 max-w-2xl mx-auto">
            Productos frescos con precios especiales por volumen
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href="mailto:empresas@tusaguacates.com"
              className="inline-flex items-center justify-center bg-white text-verde-bosque hover:bg-gray-100 font-semibold px-6 py-3 rounded-lg transition-all shadow-lg hover:shadow-xl"
            >
              <Mail className="w-4 h-4 mr-2" />
              Solicitar Cotización
            </a>
            <a
              href="tel:+573042582777"
              className="inline-flex items-center justify-center bg-verde-aguacate text-white hover:bg-verde-aguacate-600 font-semibold px-6 py-3 rounded-lg transition-all shadow-lg hover:shadow-xl"
            >
              <Phone className="w-4 h-4 mr-2" />
              +57 304 258 2777
            </a>
          </div>
        </div>
      </section>

      {/* Categorías GRANDES - Arriba */}
      <section className="py-12 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <h2 className="font-display font-bold text-2xl md:text-3xl mb-2">
              Explora por Categoría
            </h2>
            <p className="text-gray-600">
              Encuentra exactamente lo que necesitas
            </p>
          </div>

          {/* Grid Grande de Categorías - Cuadradas */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6 mb-4">
            {loading ? (
              // Skeleton mientras carga
              [...Array(5)].map((_, i) => (
                <div key={i} className="aspect-square rounded-2xl bg-gray-200 animate-pulse" />
              ))
            ) : (
              categories.map((category) => (
                <Link
                  key={category.slug}
                  href={`/empresas/${category.slug}`}
                  className="group relative aspect-square rounded-2xl overflow-hidden hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-2xl"
                >
                  {/* Imagen de fondo */}
                  <div className="absolute inset-0">
                    <img
                      src={category.image}
                      alt={category.name}
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  </div>

                  {/* Overlay oscuro para legibilidad */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />

                  {/* Contenido */}
                  <div className="relative h-full flex flex-col items-center justify-end text-white p-4">
                    <h3 className="text-base md:text-xl font-bold text-center drop-shadow-lg">
                      {category.name}
                    </h3>
                  </div>

                  {/* Badge "Ver productos" en hover */}
                  <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="bg-white text-verde-bosque px-4 py-2 rounded-full text-sm font-semibold shadow-xl">
                      Ver Productos →
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </section>

      {/* Productos Destacados - Abajo */}
      <section className="py-12 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <h2 className="font-display font-bold text-2xl md:text-3xl mb-2">
              Productos Destacados
            </h2>
            <p className="text-gray-600">
              Nuestra selección premium para empresas
            </p>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="bg-gray-200 rounded-xl h-48 mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                </div>
              ))}
            </div>
          ) : featuredProducts.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {featuredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500">
                Próximamente agregaremos productos destacados para empresas
              </p>
            </div>
          )}

          {featuredProducts.length > 0 && (
            <div className="text-center mt-8">
              <Link
                href="/empresas/aguacates"
                className="inline-flex items-center gap-2 text-verde-bosque hover:text-verde-aguacate font-semibold transition-colors"
              >
                Ver más productos
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* CTA Final - Discreto */}
      <section className="py-12 bg-verde-bosque text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="font-display font-bold text-2xl md:text-3xl mb-4">
            ¿Necesitas Ayuda con tu Pedido?
          </h2>
          <p className="text-lg mb-6 text-white/90 max-w-xl mx-auto">
            Nuestro equipo está listo para asesorarte
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href="mailto:empresas@tusaguacates.com"
              className="inline-flex items-center justify-center bg-white text-verde-bosque hover:bg-gray-100 font-semibold px-6 py-3 rounded-lg transition-all"
            >
              Contactar por Email
            </a>
            <a
              href="https://wa.me/573042582777?text=Hola!%20Necesito%20información%20para%20empresas"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-3 rounded-lg transition-all"
            >
              WhatsApp
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
