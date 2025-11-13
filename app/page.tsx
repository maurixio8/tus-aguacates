import Link from 'next/link';
import { ArrowRight, Leaf, Truck, Shield } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { ProductCard } from '@/components/product/ProductCard';
import ProductSwiper from '@/components/product/ProductSwiper';
import Image from 'next/image';
import PromotionSlider from '@/components/promotions/PromotionSlider';
import CategoryScroll from '@/components/categories/CategoryScroll';
import CategorySimpleScroll from '@/components/categories/CategorySimpleScroll';

export const revalidate = 3600; // Revalidar cada hora

async function getFeaturedProducts() {
  try {
    const { data } = await supabase
      .from('products')
      .select('*')
      .eq('is_active', true)
      .eq('is_featured', true)
      .order('created_at', { ascending: false })
      .limit(12);

    // Si no hay productos suficientes, crear productos de ejemplo
    if (!data || data.length < 8) {
      const exampleProducts = [
        {
          id: 'example-1',
          name: 'Aguacate Hass Premium',
          price: 4500,
          discount_price: 3900,
          description: 'Aguacate de la mejor calidad, cremoso y delicioso',
          category_id: 'aguacates',
          main_image_url: null,
          is_active: true,
          is_featured: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          in_stock: true,
          featured: false
        },
        {
          id: 'example-2',
          name: 'Uchuvas Frescas',
          price: 3500,
          discount_price: null,
          description: 'Uchuvas dulces y jugosas, directamente del campo',
          category_id: 'frutas',
          main_image_url: null,
          is_active: true,
          is_featured: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          in_stock: true,
          featured: false
        },
        {
          id: 'example-3',
          name: 'Papa Criolla',
          price: 2500,
          discount_price: 2000,
          description: 'Papa criolla perfecta para tus platos típicos',
          category_id: 'tuberculos',
          main_image_url: null,
          is_active: true,
          is_featured: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          in_stock: true,
          featured: false
        },
        {
          id: 'example-4',
          name: 'Tomate Chonto',
          price: 3200,
          discount_price: null,
          description: 'Tomates maduros y sabrosos para tus ensaladas',
          category_id: 'verduras',
          main_image_url: null,
          is_active: true,
          is_featured: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          in_stock: true,
          featured: false
        },
        {
          id: 'example-5',
          name: 'Limon Taití',
          price: 1200,
          discount_price: 1000,
          description: 'Limones ácidos y jugosos, perfectos para bebidas',
          category_id: 'frutas',
          main_image_url: null,
          is_active: true,
          is_featured: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          in_stock: true,
          featured: false
        },
        {
          id: 'example-6',
          name: 'Cebolla Larga',
          price: 1800,
          discount_price: null,
          description: 'Cebollas largas y dulces, ideales para cocinar',
          category_id: 'verduras',
          main_image_url: null,
          is_active: true,
          is_featured: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          in_stock: true,
          featured: false
        },
        {
          id: 'example-7',
          name: 'Zanahoria Orgánica',
          price: 2100,
          discount_price: 1800,
          description: 'Zanahorias orgánicas dulces y nutritivas',
          category_id: 'verduras',
          main_image_url: null,
          is_active: true,
          is_featured: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          in_stock: true,
          featured: false
        },
        {
          id: 'example-8',
          name: 'Mango Tommy',
          price: 5500,
          discount_price: 4500,
          description: 'Mango dulce y jugoso, directamente del árbol',
          category_id: 'frutas',
          main_image_url: null,
          is_active: true,
          is_featured: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          in_stock: true,
          featured: false
        },
        {
          id: 'example-9',
          name: 'Yuca Fresca',
          price: 2800,
          discount_price: null,
          description: 'Yuca fresca y tierna, perfecta para freír',
          category_id: 'tuberculos',
          main_image_url: null,
          is_active: true,
          is_featured: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          in_stock: true,
          featured: false
        },
        {
          id: 'example-10',
          name: 'Pimentón Rojo',
          price: 3200,
          discount_price: 2800,
          description: 'Pimentón rojo dulce y crujiente',
          category_id: 'verduras',
          main_image_url: null,
          is_active: true,
          is_featured: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          in_stock: true,
          featured: false
        },
        {
          id: 'example-11',
          name: 'Naranja Valencia',
          price: 4500,
          discount_price: 3800,
          description: 'Naranjas jugosas y llenas de vitamina C',
          category_id: 'frutas',
          main_image_url: null,
          is_active: true,
          is_featured: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          in_stock: true,
          featured: false
        },
        {
          id: 'example-12',
          name: 'Remolacha Orgánica',
          price: 2700,
          discount_price: 2200,
          description: 'Remolacha orgánica dulce y nutritiva',
          category_id: 'verduras',
          main_image_url: null,
          is_active: true,
          is_featured: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          in_stock: true,
          featured: false
        },
      ];

      // Combinar productos reales con ejemplos
      const allProducts = [...(data || []), ...exampleProducts].slice(0, 12);
      return allProducts;
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching products:', error);
    return [];
  }
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
              href="/productos"
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
              Sube tus imágenes a: /public/categories/
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

      {/* Desktop Categories Grid (hidden on mobile) */}
      <section className="py-8 hidden md:block">
        <div className="container mx-auto px-4">
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

      {/* Productos Destacados con Swiper */}
      <section className="py-4 bg-gray-50">
        <ProductSwiper
          products={featuredProducts}
          title="Lo Más Fresco"
        />
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
