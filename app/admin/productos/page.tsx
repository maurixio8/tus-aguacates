'use client';

import { useState, useEffect } from 'react';
import ImageUploadModal from '@/components/admin/ImageUploadModal';
import { getProducts, saveProducts, getDefaultProducts } from '@/lib/productStorage';
import type { Product } from '@/lib/productStorage';

const CATEGORIES = ['Todos', 'Aguacates', 'Frutas', 'Verduras', 'Lácteos', 'Panadería'];

const SAMPLE_PRODUCTS: Product[] = [
  // Aguacates
  { id: '1', name: 'Aguacate Hass Premium', description: 'Variedad premium de alta calidad', price: 6500, category: 'Aguacates', stock: 150, is_active: true },
  { id: '2', name: 'Aguacate Criollo', description: 'Variedad colombiana tradicional', price: 3500, category: 'Aguacates', stock: 200, is_active: true },
  { id: '3', name: 'Aguacate Orgánico', description: 'Cultivado sin pesticidas', price: 8500, category: 'Aguacates', stock: 75, is_active: true },
  { id: '4', name: 'Aguacate Jumbo', description: 'Tamaño extra grande', price: 5500, category: 'Aguacates', stock: 100, is_active: true },

  // Frutas
  { id: '5', name: 'Limón Tahití', description: 'Ácido y jugoso', price: 3700, category: 'Frutas', stock: 300, is_active: true },
  { id: '6', name: 'Naranja Valencia', description: 'Dulce y jugosa', price: 2500, category: 'Frutas', stock: 250, is_active: true },
  { id: '7', name: 'Mango Ataulfo', description: 'Dulce y aromático', price: 4500, category: 'Frutas', stock: 180, is_active: true },
  { id: '8', name: 'Fresa Fresca', description: 'Fresa fresca y dulce', price: 8500, category: 'Frutas', stock: 120, is_active: true },

  // Verduras
  { id: '9', name: 'Tomate Rojo', description: 'Tomate maduro y jugoso', price: 2000, category: 'Verduras', stock: 400, is_active: true },
  { id: '10', name: 'Lechuga Crespa', description: 'Lechuga fresca y crujiente', price: 1500, category: 'Verduras', stock: 350, is_active: true },
  { id: '11', name: 'Cilantro Fresco', description: 'Cilantro orgánico fresco', price: 800, category: 'Verduras', stock: 500, is_active: true },
  { id: '12', name: 'Pimentón Rojo', description: 'Pimentón rojo fresco', price: 2200, category: 'Verduras', stock: 280, is_active: true },
];

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showImageUpload, setShowImageUpload] = useState(false);

  // CARGAR productos del sistema compartido AL INICIAR
  useEffect(() => {
    const loaded = getProducts();
    setProducts(loaded);
    console.log('✅ Productos cargados desde sistema compartido:', loaded.length);
  }, []);

  // GUARDAR usando sistema compartido cuando cambien
  useEffect(() => {
    if (products.length > 0) {
      saveProducts(products);
    }
  }, [products]);

  // Filtrar productos
  useEffect(() => {
    let filtered = products;

    if (selectedCategory !== 'Todos') {
      filtered = filtered.filter(p => p.category === selectedCategory);
    }

    if (searchTerm) {
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredProducts(filtered);
  }, [selectedCategory, searchTerm, products]);

  const handleImageUpload = (imageData: string) => {
    if (!selectedProduct) return;

    const updated = {
      ...selectedProduct,
      image: imageData
    };

    // Actualizar array y localStorage se actualiza automáticamente por useEffect
    setProducts(products.map(p => p.id === selectedProduct.id ? updated : p));
    setSelectedProduct(null);
    setShowImageUpload(false);

    console.log('✅ Imagen guardada para:', selectedProduct.name);
  };

  const handleDelete = (productId: string) => {
    if (confirm('¿Estás seguro de que deseas eliminar este producto?')) {
      setProducts(products.filter(p => p.id !== productId));
    }
  };

  const handleToggleActive = (productId: string) => {
    setProducts(products.map(p =>
      p.id === productId ? { ...p, is_active: !p.is_active } : p
    ));
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">📦 Gestión de Productos</h1>
            <p className="text-gray-600">
              Total: <span className="font-semibold">{products.length}</span> productos |
              Activos: <span className="font-semibold text-green-600">{products.filter(p => p.is_active).length}</span>
            </p>
          </div>
          <div className="flex gap-3">
            <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-medium flex items-center gap-2">
              ➕ Nuevo Producto
            </button>
            <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 font-medium flex items-center gap-2">
              📥 Importar CSV
            </button>
            <button className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 font-medium flex items-center gap-2">
              🔄 Sincronizar con Tienda
            </button>
          </div>
        </div>

        {/* Controles */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Búsqueda */}
            <div className="relative">
              <input
                type="text"
                placeholder="🔍 Buscar por nombre o descripción..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full p-3 pl-10 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
              />
              <div className="absolute left-3 top-3.5 text-gray-400">
                🔍
              </div>
            </div>

            {/* Filtro de categoría */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
            >
              {CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>

            {/* Selector de orden */}
            <select className="w-full p-3 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none">
              <option value="name-asc">Nombre A-Z</option>
              <option value="name-desc">Nombre Z-A</option>
              <option value="price-asc">Precio Menor a Mayor</option>
              <option value="price-desc">Precio Mayor a Menor</option>
            </select>

            {/* Selector de estado */}
            <select className="w-full p-3 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none">
              <option value="all">Todos los productos</option>
              <option value="active">Solo activos</option>
              <option value="inactive">Solo inactivos</option>
            </select>
          </div>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Productos</p>
              <p className="text-2xl font-bold text-gray-900">{products.length}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-2xl">📦</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Con Imágenes</p>
              <p className="text-2xl font-bold text-green-600">{products.filter(p => p.image).length}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <span className="text-2xl">🖼️</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Sin Imágenes</p>
              <p className="text-2xl font-bold text-orange-600">{products.filter(p => !p.image).length}</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
              <span className="text-2xl">📷</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Stock Total</p>
              <p className="text-2xl font-bold text-purple-600">
                {products.reduce((sum, p) => sum + (p.stock || 0), 0)}
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
              <span className="text-2xl">📊</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabla de productos */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">Producto</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">Categoría</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">Precio</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">Stock</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">Imagen</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">Estado</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product) => (
                <tr key={product.id} className="border-b hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {product.image ? (
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-12 h-12 object-cover rounded-lg"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                          <span className="text-xl">🥑</span>
                        </div>
                      )}
                      <div>
                        <p className="font-semibold text-gray-900">{product.name}</p>
                        <p className="text-sm text-gray-600 line-clamp-1">{product.description}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                      {product.category}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-bold text-green-600">
                      ${product.price.toLocaleString('es-CO')}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-medium">{product.stock || 0}</p>
                  </td>
                  <td className="px-6 py-4">
                    {product.image ? (
                      <span className="text-green-600 font-medium">✅ Sí</span>
                    ) : (
                      <span className="text-red-600 font-medium">❌ No</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => handleToggleActive(product.id)}
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        product.is_active
                          ? 'bg-green-100 text-green-800 hover:bg-green-200'
                          : 'bg-red-100 text-red-800 hover:bg-red-200'
                      }`}
                    >
                      {product.is_active ? '✅ Activo' : '❌ Inactivo'}
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setSelectedProduct(product);
                          setShowImageUpload(true);
                        }}
                        className="bg-purple-600 text-white px-3 py-1 rounded text-sm hover:bg-purple-700 font-medium"
                      >
                        🖼️ Imagen
                      </button>
                      <button className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 font-medium">
                        ✏️ Editar
                      </button>
                      <button
                        onClick={() => handleDelete(product.id)}
                        className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 font-medium"
                      >
                        🗑️ Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mensaje si no hay resultados */}
        {filteredProducts.length === 0 && (
          <div className="p-8 text-center text-gray-600">
            <div className="text-4xl mb-4">📭</div>
            <p className="text-lg font-medium mb-2">No hay productos que coincidan con tu búsqueda</p>
            <p className="text-sm">Intenta cambiar los filtros o la búsqueda</p>
          </div>
        )}
      </div>

      {/* Modal */}
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