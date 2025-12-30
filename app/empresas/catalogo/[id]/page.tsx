'use client';

/**
 * Página de Detalle de Producto B2B
 * "Tus Aguacates" - E-commerce Platform
 */

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { VolumePricingDisplay } from '@/components/b2b/catalog/VolumePricingDisplay';
import { useB2BCartStore } from '@/lib/b2b/b2b-cart-store';
import { formatPrice } from '@/lib/b2b/b2b-pricing';

export default function B2BProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params.id as string;

  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(5);

  const addItem = useB2BCartStore((state) => state.addItem);

  useEffect(() => {
    if (productId) {
      fetchProduct();
    }
  }, [productId]);

  const fetchProduct = async () => {
    try {
      const response = await fetch(`/api/b2b/products?id=${productId}`);
      if (!response.ok) {
        router.push('/empresas/catalogo');
        return;
      }
      const data = await response.json();
      if (data.data && data.data.length > 0) {
        setProduct(data.data[0]);
        setQuantity(data.data[0].minimum_order_quantity);
      } else {
        router.push('/empresas/catalogo');
      }
    } catch (error) {
      console.error('Error fetching product:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = () => {
    if (product) {
      try {
        addItem(product, quantity);
        alert(`${quantity} ${product.name} agregado(s) al carrito`);
      } catch (error: any) {
        alert(error.message);
      }
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">Cargando producto...</div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">Producto no encontrado</div>
      </div>
    );
  }

  const imageUrl = product.main_image_url || product.images?.[0] || '/placeholder-product.jpg';
  const hasDiscount = product.pricing_tiers && product.pricing_tiers.length > 0;
  const bestPrice = hasDiscount
    ? Math.min(...product.pricing_tiers.map((t: any) => t.price_per_unit))
    : product.base_price;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="text-sm mb-6">
        <ol className="flex items-center space-x-2">
          <li>
            <Link href="/empresas" className="text-amber-600 hover:text-amber-700">
              Inicio
            </Link>
          </li>
          <li className="text-gray-400">/</li>
          <li>
            <Link href="/empresas/catalogo" className="text-amber-600 hover:text-amber-700">
              Catálogo
            </Link>
          </li>
          <li className="text-gray-400">/</li>
          <li className="text-gray-600 truncate max-w-xs">{product.name}</li>
        </ol>
      </nav>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Imagen del producto */}
        <div className="aspect-square bg-white rounded-lg shadow-lg overflow-hidden">
          {imageUrl !== '/placeholder-product.jpg' ? (
            <Image
              src={imageUrl}
              alt={product.name}
              fill
              className="object-cover"
              priority
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              <svg className="w-32 h-32" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}
        </div>

        {/* Información del producto */}
        <div>
          {/* SKU y categoría */}
          <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
            <span>SKU: {product.sku}</span>
            {product.category && (
              <>
                <span className="text-gray-400">•</span>
                <Link
                  href={`/empresas/catalogo?category=${product.category.id}`}
                  className="text-amber-600 hover:text-amber-700"
                >
                  {product.category.name}
                </Link>
              </>
            )}
          </div>

          {/* Nombre */}
          <h1 className="text-3xl font-bold text-gray-800 mb-4">
            {product.name}
          </h1>

          {/* Descripción */}
          {product.description && (
            <p className="text-gray-600 mb-6">{product.description}</p>
          )}

          {/* Precio */}
          <div className="mb-6">
            <div className="flex items-baseline gap-3">
              <span className="text-4xl font-bold text-amber-600">
                {formatPrice(product.base_price)}
              </span>
              <span className="text-gray-600">por {product.unit}</span>
            </div>
            {hasDiscount && bestPrice < product.base_price && (
              <p className="text-green-600 text-sm mt-1">
                Desde {formatPrice(bestPrice)}/{product.unit} con descuentos por volumen
              </p>
            )}
          </div>

          {/* Stock */}
          <div className="mb-6">
            <span className={`text-sm font-semibold ${
              product.stock_quantity > 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {product.stock_quantity > 0
                ? `${product.stock_quantity} disponibles`
                : 'Agotado'}
            </span>
            <span className="text-gray-400 mx-2">•</span>
            <span className="text-sm text-gray-600">
              Cantidad mínima: {product.minimum_order_quantity} {product.unit}
            </span>
          </div>

          {/* Precios por volumen */}
          <div className="mb-6">
            <VolumePricingDisplay product={product} currentQuantity={quantity} />
          </div>

          {/* Selector de cantidad y botón agregar */}
          <div className="bg-gray-50 rounded-lg p-6">
            <div className="flex items-center gap-4 mb-4">
              <label className="text-sm font-medium text-gray-700">Cantidad:</label>
              <div className="flex items-center border border-gray-300 rounded-lg">
                <button
                  type="button"
                  onClick={() => setQuantity(Math.max(product.minimum_order_quantity, quantity - 1))}
                  disabled={quantity <= product.minimum_order_quantity}
                  className="px-3 py-2 text-gray-600 hover:bg-gray-100 disabled:opacity-50"
                >
                  -
                </button>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(product.minimum_order_quantity, parseInt(e.target.value) || 0))}
                  min={product.minimum_order_quantity}
                  max={product.stock_quantity}
                  className="w-20 text-center border-0 focus:ring-0"
                />
                <button
                  type="button"
                  onClick={() => setQuantity(Math.min(product.stock_quantity, quantity + 1))}
                  disabled={quantity >= product.stock_quantity}
                  className="px-3 py-2 text-gray-600 hover:bg-gray-100 disabled:opacity-50"
                >
                  +
                </button>
              </div>
              <span className="text-sm text-gray-600">{product.unit}</span>
            </div>

            {/* Precio calculado */}
            <div className="mb-4 text-center">
              <span className="text-2xl font-bold text-amber-600">
                {formatPrice(product.base_price * quantity)}
              </span>
            </div>

            <button
              onClick={handleAddToCart}
              disabled={product.stock_quantity === 0}
              className="w-full bg-amber-600 hover:bg-amber-700 disabled:bg-gray-300 text-white font-bold py-3 px-6 rounded-lg"
            >
              Agregar al Carrito
            </button>
          </div>
        </div>
      </div>

      {/* Productos relacionados */}
      <div className="mt-16">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">
          Productos Relacionados
        </h2>
        <p className="text-gray-600">
          Próximamente...
        </p>
      </div>
    </div>
  );
}
