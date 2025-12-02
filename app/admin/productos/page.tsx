'use client';

import { useState, useEffect } from 'react';
import ImageUploadModal from '@/components/admin/ImageUploadModal';
import type { Product } from '@/lib/productStorage';

interface ProductResponse extends Product {
  category?: string;
  category_name?: string;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<ProductResponse[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<ProductResponse[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<ProductResponse | null>(null);
  const [showImageUpload, setShowImageUpload] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductResponse | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);

  // CARGAR productos de Supabase al iniciar
  useEffect(() => {
    loadProductsFromSupabase();
  }, []);

  // Filtrar productos cuando cambian los filtros
  useEffect(() => {
    let filtered = products;

    if (selectedCategory !== 'Todos') {
      filtered = filtered.filter(p => (p.category_name || p.category) === selectedCategory);
    }

    if (searchTerm) {
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredProducts(filtered);
  }, [selectedCategory, searchTerm, products]);

  // Actualizar categorías cuando cambien los productos
  useEffect(() => {
    const uniqueCategories = ['Todos', ...new Set(products.map(p => p.category_name || p.category).filter(Boolean))];
    setCategories(uniqueCategories as string[]);
  }, [products]);

  // Cargar productos de Supabase
  const loadProductsFromSupabase = async () => {
    try {
      setLoading(true);
      console.log('📥 Cargando productos de Supabase...');

      const response = await fetch('/api/admin/products');

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      console.log(`✅ ${data.data?.length || 0} productos cargados de Supabase`);

      setProducts(data.data || []);
    } catch (error) {
      console.error('❌ Error cargando productos de Supabase:', error);
      alert('Error al cargar productos de Supabase. Por favor, intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  // Sincronizar productos (botón "Sincronizar")
  const handleSyncProducts = async () => {
    try {
      setIsSyncing(true);
      console.log('🔄 Sincronizando productos...');

      const response = await fetch('/api/admin/products');

      if (!response.ok) {
        throw new Error(`Sync failed: ${response.status}`);
      }

      const data = await response.json();
      const count = data.data?.length || 0;

      setProducts(data.data || []);
      console.log(`✅ Sincronización completada: ${count} productos`);
      alert(`✅ Sincronización completada\n${count} productos cargados desde Supabase`);
    } catch (error) {
      console.error('❌ Error sincronizando:', error);
      alert('Error al sincronizar productos. Intenta de nuevo.');
    } finally {
      setIsSyncing(false);
    }
  };

  // Actualizar imagen (sincroniza con Supabase)
  const handleImageUpload = async (imageUrl: string) => {
    if (!selectedProduct) return;

    const updated = {
      ...selectedProduct,
      main_image_url: imageUrl,
      image: imageUrl
    };

    // Actualizar localmente
    setProducts(products.map(p => p.id === selectedProduct.id ? updated : p));

    // Sincronizar con Supabase
    try {
      console.log('🔄 Sincronizando imagen con Supabase para producto:', selectedProduct.id);

      const response = await fetch(`/api/admin/products/${selectedProduct.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          main_image_url: imageUrl
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ Error sincronizando con Supabase:', errorData.error);
        alert(`⚠️ Imagen guardada localmente, pero error al sincronizar:\n${errorData.error}`);
      } else {
        console.log('✅ Imagen sincronizada exitosamente con Supabase');
      }
    } catch (error) {
      console.error('❌ Error en la solicitud:', error);
      alert('⚠️ Imagen guardada localmente, pero hubo error al sincronizar con Supabase');
    }

    setSelectedProduct(null);
    setShowImageUpload(false);
  };

  // Eliminar producto de Supabase
  const handleDelete = async (productId: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este producto?')) return;

    try {
      console.log('🗑️ Eliminando producto:', productId);

      const response = await fetch(`/api/admin/products/${productId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error deleting product');
      }

      setProducts(products.filter(p => p.id !== productId));
      console.log('✅ Producto eliminado exitosamente');
      alert('✅ Producto eliminado');
    } catch (error) {
      console.error('❌ Error eliminando producto:', error);
      alert('Error al eliminar el producto. Intenta de nuevo.');
    }
  };

  // Toggle activo/inactivo en Supabase
  const handleToggleActive = async (productId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/admin/products/${productId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          is_active: !currentStatus
        })
      });

      if (!response.ok) {
        throw new Error('Error updating product');
      }

      setProducts(products.map(p =>
        p.id === productId ? { ...p, is_active: !currentStatus } : p
      ));
      console.log('✅ Estado del producto actualizado');
    } catch (error) {
      console.error('❌ Error actualizando producto:', error);
      alert('Error al actualizar el producto.');
    }
  };

  // Guardar cambios de edición en Supabase
  const handleSaveEdit = async (updatedProduct: ProductResponse) => {
    try {
      const response = await fetch(`/api/admin/products/${updatedProduct.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: updatedProduct.name,
          description: updatedProduct.description,
          price: updatedProduct.price,
          stock: updatedProduct.stock,
          category: updatedProduct.category,
          is_active: updatedProduct.is_active
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error updating product');
      }

      setProducts(products.map(p => p.id === updatedProduct.id ? updatedProduct : p));
      setEditingProduct(null);
      setShowEditModal(false);
      console.log('✅ Producto actualizado exitosamente');
    } catch (error) {
      console.error('❌ Error guardando cambios:', error);
      alert('Error al guardar los cambios.');
    }
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
            <button
              onClick={handleSyncProducts}
              disabled={isSyncing}
              className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              🔄 {isSyncing ? 'Sincronizando...' : 'Sincronizar'}
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
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
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
              <p className="text-2xl font-bold text-green-600">{products.filter(p => p.image || p.main_image_url).length}</p>
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
              <p className="text-2xl font-bold text-orange-600">{products.filter(p => !p.image && !p.main_image_url).length}</p>
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
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando productos...</p>
          </div>
        ) : (
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
                        {product.main_image_url || product.image ? (
                          <img
                            src={product.main_image_url || product.image}
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
                        {product.category_name || product.category || 'Sin categoría'}
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
                      {product.image || product.main_image_url ? (
                        <div>
                          <span className="text-green-600 font-medium">✅ Sí</span>
                          {product.main_image_url && (
                            <p className="text-xs text-gray-500 mt-1">📦 Supabase Storage</p>
                          )}
                        </div>
                      ) : (
                        <span className="text-red-600 font-medium">❌ No</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleToggleActive(product.id, product.is_active || false)}
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
        )}

        {/* Mensaje si no hay resultados */}
        {!loading && filteredProducts.length === 0 && (
          <div className="p-8 text-center text-gray-600">
            <div className="text-4xl mb-4">📭</div>
            <p className="text-lg font-medium mb-2">No hay productos que coincidan con tu búsqueda</p>
            <p className="text-sm">Intenta cambiar los filtros o la búsqueda</p>
          </div>
        )}
      </div>

      {/* Image Upload Modal */}
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
