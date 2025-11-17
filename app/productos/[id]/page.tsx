import { getProducts } from '@/lib/productStorage';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Check, Shield, Truck } from 'lucide-react';
import { ProductImagePlaceholder } from '@/components/ui/ProductImagePlaceholder';
import { ProductCard } from '@/components/product/ProductCard';
import { formatPrice } from '@/lib/utils';

interface ProductPageProps {
  params: Promise<{
    id: string;
  }>;
}

async function getProductById(id: string) {
  const allProducts = await getProducts();
  return allProducts.find(p => p.id === id);
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { id } = await params;
  const product = await getProductById(id);

  if (!product) {
    notFound();
  }

  const allProducts = await getProducts();
  // Get 3 related products from same category
  const relatedProducts = allProducts
    .filter(p => p.category === product.category && p.id !== product.id)
    .slice(0, 3);

  const hasDiscount = product.discount_price && product.discount_price < product.price;
  const discount = hasDiscount ? Math.round(((product.price - product.discount_price!) / product.price) * 100) : 0;

  return (
    <div className="min-h-screen bg-gray-50 pt-20 pb-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Breadcrumb Navigation */}
        <Link
          href="/tienda"
          className="inline-flex items-center gap-2 text-verde-bosque hover:text-verde-aguacate mb-8 font-medium transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a la tienda
        </Link>

        {/* Main Product Section - Responsive Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-12 mb-16">

          {/* Product Image - Left Column */}
          <div className="flex flex-col gap-4">
            {/* Main Image */}
            <div className="bg-white rounded-xl overflow-hidden shadow-soft aspect-square">
              <ProductImagePlaceholder
                productName={product.name}
                price={product.discount_price || product.price}
                category={product.category || 'productos'}
                imageUrl={product.main_image_url}
                showPrice={false}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Discount Badge */}
            {hasDiscount && (
              <div className="bg-naranja-frutal text-white px-4 py-2 rounded-lg text-center font-bold text-lg">
                ¡Ahorra {discount}%!
              </div>
            )}
          </div>

          {/* Product Information - Right Column */}
          <div className="flex flex-col justify-between">

            {/* Category Badge */}
            <div>
              <p className="text-sm text-gray-500 uppercase tracking-wide font-semibold">
                {product.category || 'Producto'}
              </p>
            </div>

            {/* Title and Description */}
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 leading-tight">
                {product.name}
              </h1>
              <p className="text-gray-600 text-base md:text-lg leading-relaxed mb-6">
                {product.description || 'Producto de alta calidad de Tus Aguacates'}
              </p>
            </div>

            {/* Rating */}
            {(product.review_count ?? 0) > 0 && (
              <div className="flex items-center gap-4 py-4 border-y border-gray-200">
                <div className="flex items-center gap-1">
                  <span className="text-yellow-500 text-xl">★★★★★</span>
                  <span className="ml-2 font-semibold text-gray-900">
                    {(product.rating ?? 0).toFixed(1)}/5
                  </span>
                </div>
                <span className="text-gray-500 text-sm">
                  ({product.review_count ?? 0} opiniones)
                </span>
              </div>
            )}

            {/* Pricing Section */}
            <div className="py-6 border-b border-gray-200">
              <div className="flex items-baseline gap-4">
                <span className="text-4xl md:text-5xl font-bold text-verde-bosque font-mono">
                  {formatPrice(product.discount_price || product.price)}
                </span>
                {hasDiscount && (
                  <span className="text-xl text-gray-500 line-through">
                    {formatPrice(product.price)}
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-600 mt-2">
                Por {product.unit || 'unidad'}
              </p>
            </div>

            {/* Stock Status */}
            <div className="py-4">
              {(product.stock || 0) > 0 ? (
                <div className="flex items-center gap-2 text-green-600 font-medium">
                  <Check className="w-5 h-5" />
                  En stock ({product.stock || 'varios'} disponibles)
                </div>
              ) : (
                <div className="text-red-600 font-medium">
                  ✗ Producto agotado
                </div>
              )}
            </div>

            {/* Product Card with Add to Cart */}
            <div className="bg-white rounded-xl p-6 border-2 border-gray-200 mt-4">
              <ProductCard product={product} />
            </div>

            {/* Trust Badges */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8">
              <div className="flex items-start gap-3">
                <Truck className="w-5 h-5 text-verde-bosque flex-shrink-0 mt-1" />
                <div>
                  <p className="font-semibold text-gray-900 text-sm">Envío Rápido</p>
                  <p className="text-xs text-gray-600">A todo el país</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Check className="w-5 h-5 text-verde-bosque flex-shrink-0 mt-1" />
                <div>
                  <p className="font-semibold text-gray-900 text-sm">Productos Frescos</p>
                  <p className="text-xs text-gray-600">Garantizado</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-verde-bosque flex-shrink-0 mt-1" />
                <div>
                  <p className="font-semibold text-gray-900 text-sm">Devolución Fácil</p>
                  <p className="text-xs text-gray-600">Sin preguntas</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Product Details Section */}
        <div className="bg-white rounded-xl p-6 md:p-8 shadow-soft mb-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Detalles del Producto</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="border border-gray-200 rounded-lg p-4">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Unidad</p>
              <p className="font-semibold text-gray-900">{product.unit || 'unidad'}</p>
            </div>
            {product.weight && (
              <div className="border border-gray-200 rounded-lg p-4">
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Peso</p>
                <p className="font-semibold text-gray-900">{product.weight}</p>
              </div>
            )}
            <div className="border border-gray-200 rounded-lg p-4">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Stock</p>
              <p className="font-semibold text-gray-900">{product.stock || '∞'}</p>
            </div>
            <div className="border border-gray-200 rounded-lg p-4">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Mínimo</p>
              <p className="font-semibold text-gray-900">{product.min_quantity || 1}</p>
            </div>
          </div>

          {/* Badges */}
          {(product.is_organic || product.is_featured) && (
            <div className="flex flex-wrap gap-3 mt-6 pt-6 border-t border-gray-200">
              {product.is_organic && (
                <span className="bg-green-100 text-green-800 px-4 py-2 rounded-full font-semibold text-sm">
                  🌿 Orgánico
                </span>
              )}
              {product.is_featured && (
                <span className="bg-yellow-100 text-yellow-800 px-4 py-2 rounded-full font-semibold text-sm">
                  ⭐ Destacado
                </span>
              )}
            </div>
          )}
        </div>

        {/* Related Products Section */}
        {relatedProducts.length > 0 && (
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">Productos Relacionados</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {relatedProducts.map((relatedProduct) => (
                <ProductCard key={relatedProduct.id} product={relatedProduct} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}