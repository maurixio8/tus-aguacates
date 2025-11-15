'use client';

import { useState, useEffect } from 'react';
import ImageUploadModal from '@/components/admin/ImageUploadModal';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image?: string;
  category?: string;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showImageUpload, setShowImageUpload] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Cargar productos de ejemplo (temporal)
    const sampleProducts: Product[] = [
      {
        id: '1',
        name: 'Aguacate Hass',
        description: 'Aguacate fresco y delicioso de la mejor calidad',
        price: 5000,
        category: 'Aguacates'
      },
      {
        id: '2',
        name: 'Aguacate Criollo',
        description: 'Variedad colombiana tradicional con sabor único',
        price: 3000,
        category: 'Aguacates'
      },
      {
        id: '3',
        name: 'Limón Tahití',
        description: 'Limón ácido perfecto para bebidas y marinadas',
        price: 3700,
        category: 'Frutas'
      },
      {
        id: '4',
        name: 'Aguacate Premium',
        description: 'Selección especial de aguacates grandes y maduros',
        price: 7500,
        category: 'Aguacates'
      },
      {
        id: '5',
        name: 'Naranja Valencia',
        description: 'Naranjas jugosas y llenas de vitamina C',
        price: 2800,
        category: 'Frutas'
      },
      {
        id: '6',
        name: 'Aguacate Orgánico',
        description: 'Aguacate cultivado sin pesticidas ni químicos',
        price: 8500,
        category: 'Aguacates'
      }
    ];
    setProducts(sampleProducts);
    setLoading(false);
  }, []);

  const handleImageUpload = async (imageData: string) => {
    if (!selectedProduct) return;

    // Actualizar producto con nueva imagen
    const updated = {
      ...selectedProduct,
      image: imageData
    };

    setProducts(products.map(p => p.id === selectedProduct.id ? updated : p));
    setSelectedProduct(null);
    setShowImageUpload(false);

    console.log('✅ Imagen actualizada para:', selectedProduct.name);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando productos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">📦 Productos</h1>
              <p className="text-gray-600">Gestiona tus productos y carga de imágenes</p>
            </div>
            <div className="flex gap-2">
              <a
                href="/admin"
                className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
              >
                ← Volver al Dashboard
              </a>
            </div>
          </div>

          {/* Botones principales */}
          <div className="flex flex-wrap gap-4">
            <button className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2">
              ➕ Nuevo Producto
            </button>
            <button className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2">
              📥 Importar CSV
            </button>
            <button className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 flex items-center gap-2">
              🔄 Sincronizar con Tienda
            </button>
          </div>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-lg p-4 shadow">
            <h3 className="text-sm font-medium text-gray-500">Total Productos</h3>
            <p className="text-2xl font-bold text-gray-900">{products.length}</p>
          </div>
          <div className="bg-white rounded-lg p-4 shadow">
            <h3 className="text-sm font-medium text-gray-500">Con Imágenes</h3>
            <p className="text-2xl font-bold text-green-600">{products.filter(p => p.image).length}</p>
          </div>
          <div className="bg-white rounded-lg p-4 shadow">
            <h3 className="text-sm font-medium text-gray-500">Sin Imágenes</h3>
            <p className="text-2xl font-bold text-orange-600">{products.filter(p => !p.image).length}</p>
          </div>
        </div>

        {/* Grid de productos */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => (
            <div
              key={product.id}
              className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-200"
            >
              {/* Preview de imagen */}
              <div className="h-48 bg-gray-200 relative">
                {product.image ? (
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                    <span className="text-4xl mb-2">🥑</span>
                    <span className="text-gray-500 text-sm">Sin imagen</span>
                  </div>
                )}

                {/* Badge de categoría */}
                {product.category && (
                  <div className="absolute top-2 left-2 bg-green-600 text-white text-xs px-2 py-1 rounded-full">
                    {product.category}
                  </div>
                )}
              </div>

              {/* Info del producto */}
              <div className="p-4">
                <h3 className="font-bold text-lg text-gray-900 mb-2">{product.name}</h3>
                <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                  {product.description}
                </p>
                <div className="flex justify-between items-center mb-4">
                  <p className="text-green-600 font-bold text-xl">${product.price.toLocaleString('es-CO')}</p>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    product.image
                      ? 'bg-green-100 text-green-800'
                      : 'bg-orange-100 text-orange-800'
                  }`}>
                    {product.image ? '✅ Con imagen' : '📷 Sin imagen'}
                  </span>
                </div>

                {/* Botones de acción */}
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => {
                      setSelectedProduct(product);
                      setShowImageUpload(true);
                    }}
                    className="bg-purple-600 text-white py-2 rounded hover:bg-purple-700 text-xs font-bold flex items-center justify-center gap-1"
                  >
                    🖼️ Imagen
                  </button>
                  <button className="bg-gray-600 text-white py-2 rounded hover:bg-gray-700 text-xs font-bold flex items-center justify-center gap-1">
                    ✏️ Editar
                  </button>
                  <button className="bg-red-600 text-white py-2 rounded hover:bg-red-700 text-xs font-bold flex items-center justify-center gap-1">
                    🗑️ Eliminar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Estado vacío */}
        {products.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📦</div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No hay productos</h3>
            <p className="text-gray-500 mb-4">Comienza agregando tu primer producto</p>
            <button className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">
              ➕ Agregar Primer Producto
            </button>
          </div>
        )}
      </div>

      {/* Modal de carga de imagen */}
      {showImageUpload && selectedProduct && (
        <ImageUploadModal
          product={selectedProduct}
          onUpload={handleImageUpload}
          onClose={() => {
            setShowImageUpload(false);
            setSelectedProduct(null);
          }}
        />
      )}
    </div>
  );
}