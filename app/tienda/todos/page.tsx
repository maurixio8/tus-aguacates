import { supabase } from '@/lib/supabase';
import { ProductCard } from '@/components/product/ProductCard';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';

async function getAllProducts() {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching products:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in getAllProducts:', error);
    return [];
  }
}

export default async function TodosProductosPage() {
  const products = await getAllProducts();

  return (
    <div className="min-h-screen bg-gray-50 pt-20 pb-24">
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/tienda"
            className="text-green-600 hover:text-green-700 font-semibold underline flex items-center gap-1 mb-4 inline-block"
          >
            <ChevronLeft className="w-4 h-4" />
            Volver a la tienda
          </Link>

          <h1 className="text-4xl md:text-5xl font-display font-bold mb-4 text-gray-800">
            Todos los Productos
          </h1>
          <p className="text-lg text-gray-600">
            Explora nuestro catálogo completo de productos frescos y naturales
          </p>
        </div>

        {/* Products Count */}
        <div className="mb-8">
          <p className="text-sm text-gray-500">
            Mostrando {products.length} productos disponibles
          </p>
        </div>

        {/* Products Grid */}
        {products.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <p className="text-gray-500">No hay productos disponibles en este momento.</p>
            <Link
              href="/tienda"
              className="inline-block mt-4 bg-green-600 hover:bg-green-700 text-white font-bold px-6 py-3 rounded-xl transition-all"
            >
              Volver a la tienda
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}