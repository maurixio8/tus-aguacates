import Link from 'next/link';
import { ArrowRight, Leaf, Truck, Shield } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { ProductCard } from '@/components/product/ProductCard';
import Image from 'next/image';

export const revalidate = 3600; // Revalidar cada hora

async function getFeaturedProducts() {
  const { data } = await supabase
    .from('products')
    .select('*')
    .eq('is_active', true)
    .eq('is_featured', true)
    .order('created_at', { ascending: false })
    .limit(8);
  
  return data || [];
}

async function getCategories() {
  const { data } = await supabase
    .from('categories')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })
    .limit(6);
  
  return data || [];
}

export default async function Home() {
  const [featuredProducts, categories] = await Promise.all([
    getFeaturedProducts(),
    getCategories(),
  ]);

  return (
    <div>
      {/* Hero Section */}
      <section className="relative text-white py-16 md:py-24 overflow-hidden">
        <div className="absolute inset-0">
          <Image 
            src="/images/hero-limpio.png" 
            alt="Fondo hero"
            fill
            className="object-cover"
            priority
          />
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-display font-bold mb-6">
              Del Corazón del Eje Cafetero
              <br />
              <span className="text-verde-aguacate-200">a tu Mesa</span>
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-white/90">
              Frutas y verduras frescas, cultivadas con amor por familias campesinas colombianas
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/productos"
                className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-verde-bosque-700 hover:from-yellow-500 hover:to-yellow-700 font-bold px-8 py-4 rounded-xl transition-all inline-flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transform hover:scale-105 border-2 border-verde-aguacate"
              >
                Explorar Tienda
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
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

      {/* Categorías */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="font-display font-bold text-3xl md:text-4xl mb-4">
              Explora por Categoría
            </h2>
            <p className="text-gray-600 text-lg">
              Encuentra los productos más frescos y de mejor calidad
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/productos?categoria=${category.slug}`}
                className="group"
              >
                <div className="bg-white rounded-2xl overflow-hidden shadow-soft hover:shadow-strong transition-all duration-300 p-4 text-center transform hover:scale-105 hover:-translate-y-2 hover:border-2 hover:border-yellow-500">
                  {category.image_url && (
                    <div className="relative w-full aspect-square mb-3 rounded-xl overflow-hidden bg-gray-100">
                      <Image
                        src={category.image_url}
                        alt={category.name}
                        fill
                        className="object-cover group-hover:scale-125 transition-transform duration-500 group-hover:rotate-2"
                      />
                    </div>
                  )}
                  <h3 className="font-semibold text-sm group-hover:text-yellow-700 transition-colors duration-300 group-hover:font-bold">
                    {category.name}
                  </h3>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Productos Destacados */}
      <section className="py-16 bg-gradient-suave">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h2 className="font-display font-bold text-3xl md:text-4xl mb-2">
                Lo Más Fresco Esta Semana
              </h2>
              <p className="text-gray-600">
                Productos seleccionados especialmente para ti
              </p>
            </div>
            <Link
              href="/productos"
              className="hidden md:flex items-center gap-2 text-verde-bosque hover:text-verde-bosque-600 font-semibold transition-colors"
            >
              Ver todos
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          <div className="text-center mt-8 md:hidden">
            <Link
              href="/productos"
              className="inline-flex items-center gap-2 text-verde-bosque hover:text-verde-bosque-600 font-semibold transition-colors"
            >
              Ver todos los productos
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
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
              href="/registro"
              className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-verde-bosque-700 hover:from-yellow-500 hover:to-yellow-700 font-bold px-8 py-4 rounded-xl transition-all shadow-lg hover:shadow-xl transform hover:scale-105 border-2 border-verde-aguacate"
            >
              Crear Cuenta
            </Link>
            <Link
              href="/productos"
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
