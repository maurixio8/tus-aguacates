import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { ProductCard } from '@/components/product/ProductCard';

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
    if (!data || data.length < 12) {
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

export default async function TiendaPage() {
  const featuredProducts = await getFeaturedProducts();

  const categories = [
    { name: 'Frutas', emoji: '🍓', slug: 'frutas', color: 'from-red-500 to-pink-600' },
    { name: 'Verduras', emoji: '🥬', slug: 'verduras', color: 'from-lime-500 to-green-600' },
    { name: 'Aguacates', emoji: '🥑', slug: 'aguacates', color: 'from-green-500 to-green-700' },
    { name: 'Especias', emoji: '🌶️', slug: 'especias', color: 'from-yellow-500 to-orange-600' },
    { name: 'Hierbas Aromáticas', emoji: '🌿', slug: 'hierbas-aromaticas', color: 'from-emerald-500 to-teal-600' },
    { name: 'Combos', emoji: '📦', slug: 'combos', color: 'from-purple-500 to-indigo-600' },
  ];

  return (
    <div className="container mx-auto px-4 py-12">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold mb-4 text-gray-800">
          Explora Nuestras Categorías
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Descubre la frescura y calidad de nuestros productos cultivados con amor en Colombia
        </p>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mb-16">
        {categories.map((category) => (
          <Link
            key={category.slug}
            href={`/productos?categoria=${category.slug}`}
            className="group relative aspect-square rounded-2xl overflow-hidden hover:scale-105 transition-transform duration-300 shadow-lg hover:shadow-xl"
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${category.color} opacity-90`} />
            <div className="relative h-full flex flex-col items-center justify-center text-white">
              <span className="text-6xl mb-4 transform group-hover:scale-110 transition-transform duration-300">
                {category.emoji}
              </span>
              <h3 className="text-2xl font-bold text-center px-4">
                {category.name}
              </h3>
            </div>
          </Link>
        ))}
      </div>

      {/* Featured Products Section */}
      <div className="mb-16">
        <div className="text-center mb-8">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-800">
            Productos Destacados
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Los productos más frescos y populares seleccionados especialmente para ti
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {featuredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>

      {/* CTA Section */}
      <div className="text-center py-12 bg-gradient-to-r from-green-50 to-emerald-50 rounded-3xl">
        <h2 className="text-3xl font-bold mb-4 text-gray-800">
          ¿Listo para disfrutar de productos frescos?
        </h2>
        <p className="text-lg text-gray-600 mb-6 max-w-2xl mx-auto">
          Explora nuestro catálogo completo y descubre la calidad que nos caracteriza
        </p>
        <Link
          href="/productos"
          className="inline-block bg-green-600 hover:bg-green-700 text-white font-bold px-8 py-4 rounded-xl transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
        >
          Ver Todos los Productos
        </Link>
      </div>
    </div>
  );
}