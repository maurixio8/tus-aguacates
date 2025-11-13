import { supabase } from '@/lib/supabase';
import { ProductCard } from '@/components/product/ProductCard';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

interface ProductPageProps {
  params: Promise<{
    id: string;
  }>;
}

async function getProduct(id: string) {
  const { data } = await supabase
    .from('products')
    .select('*')
    .eq('id', id)
    .eq('is_active', true)
    .single();

  return data;
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { id } = await params;
  const product = await getProduct(id);

  if (!product) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-20 pb-24">
      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-green-600 hover:text-green-700 mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a la tienda
        </Link>

        {/* Product Details */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {/* Product Image */}
          <div className="bg-white rounded-xl p-8 shadow-sm">
            <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
              {product.main_image_url ? (
                <img
                  src={product.main_image_url}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  <span className="text-8xl">🥑</span>
                </div>
              )}
            </div>
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                {product.name}
              </h1>

              {product.description && (
                <p className="text-gray-600 text-lg leading-relaxed mb-6">
                  {product.description}
                </p>
              )}

              {/* Price */}
              <div className="flex items-center gap-4 mb-6">
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold text-green-600">
                    ${product.discount_price || product.price}
                  </span>
                  {product.discount_price && (
                    <span className="text-2xl text-gray-400 line-through">
                      ${product.price}
                    </span>
                  )}
                </div>
              </div>

              {/* Product Metadata */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-500 mb-1">Unidad</p>
                  <p className="font-semibold">{product.unit || 'unidad'}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-500 mb-1">Peso</p>
                  <p className="font-semibold">{product.weight || 'N/A'}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-500 mb-1">Stock</p>
                  <p className="font-semibold">{product.stock || 'N/A'}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-500 mb-1">Mínimo</p>
                  <p className="font-semibold">{product.min_quantity || 1}</p>
                </div>
              </div>

              {/* Badges */}
              <div className="flex gap-2">
                {product.is_organic && (
                  <span className="bg-green-100 text-green-800 text-sm font-medium px-3 py-1 rounded-full">
                    🌿 Orgánico
                  </span>
                )}
                {product.is_featured && (
                  <span className="bg-yellow-100 text-yellow-800 text-sm font-medium px-3 py-1 rounded-full">
                    ⭐ Destacado
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Product Card for Add to Cart */}
        <div className="max-w-md mx-auto">
          <h2 className="text-xl font-semibold mb-4 text-center">Comprar Producto</h2>
          <ProductCard product={product} />
        </div>

        {/* Related Products Section */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold mb-8 text-center">Productos Relacionados</h2>
          <div className="text-center text-gray-500">
            <p>Pronto podrás ver más productos relacionados...</p>
          </div>
        </div>
      </div>
    </div>
  );
}