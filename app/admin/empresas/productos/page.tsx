'use client';

import { useEffect, useState } from 'react';
import {
  Search,
  Edit,
  Eye,
  EyeOff,
  Filter,
  ChevronLeft,
  ChevronRight,
  Package,
  X,
  Save,
  ImageIcon,
  Building2,
  DollarSign,
  Percent,
  RefreshCw,
  Loader2
} from 'lucide-react';

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface B2BProduct {
  id: string;
  product_id: string;
  name: string;
  description?: string;
  original_price: number;
  b2b_price: number;
  discount_percentage: number;
  min_quantity: number;
  stock: number;
  is_active: boolean;
  main_image_url?: string;
  category_name?: string;
  category_slug?: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function B2BProductsPage() {
  const [products, setProducts] = useState<B2BProduct[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [status, setStatus] = useState('');
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
  });
  const [editingProduct, setEditingProduct] = useState<B2BProduct | null>(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [syncingPrices, setSyncingPrices] = useState(false);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadProducts();
    }, 300);
    return () => clearTimeout(timer);
  }, [search, selectedCategory, status, pagination.page]);

  const loadCategories = async () => {
    try {
      const response = await fetch('/api/categories', {
        credentials: 'include',
      });
      const data = await response.json();
      if (data.success || Array.isArray(data)) {
        setCategories(data.categories || data || []);
      }
    } catch (error) {
      console.error('Error cargando categorías:', error);
    }
  };

  const loadProducts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', pagination.page.toString());
      params.set('limit', pagination.limit.toString());
      if (search) params.set('search', search);
      if (selectedCategory) params.set('category', selectedCategory);
      if (status) params.set('status', status);

      const response = await fetch(`/api/admin/empresas/products?${params}`, {
        credentials: 'include',
      });
      const data = await response.json();

      if (data.success) {
        setProducts(data.products || []);
        setPagination(prev => ({
          ...prev,
          total: data.pagination?.total || 0,
          totalPages: data.pagination?.totalPages || 1
        }));
      }
    } catch (error) {
      console.error('Error cargando productos B2B:', error);
      showToast('Error al cargar productos', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (productId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/admin/empresas/products/${productId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ is_active: !currentStatus }),
      });

      if (response.ok) {
        showToast(`Producto ${!currentStatus ? 'activado' : 'desactivado'}`, 'success');
        loadProducts();
      }
    } catch (error) {
      console.error('Error actualizando producto:', error);
      showToast('Error al actualizar', 'error');
    }
  };

  const handleSaveProduct = async () => {
    if (!editingProduct) return;
    setSaving(true);

    try {
      const response = await fetch(`/api/admin/empresas/products/${editingProduct.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          b2b_price: editingProduct.b2b_price,
          discount_percentage: editingProduct.discount_percentage,
          min_quantity: editingProduct.min_quantity,
          is_active: editingProduct.is_active,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setEditingProduct(null);
        loadProducts();
        showToast('Producto actualizado correctamente', 'success');
      } else {
        showToast(data.error || 'Error al guardar', 'error');
      }
    } catch (error) {
      console.error('Error guardando producto:', error);
      showToast('Error al guardar', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleSyncPrices = async () => {
    if (!confirm('¿Deseas sincronizar todos los precios B2B basándose en el descuento configurado?')) return;

    setSyncingPrices(true);
    try {
      const response = await fetch('/api/admin/empresas/products/sync-prices', {
        method: 'POST',
        credentials: 'include',
      });

      const data = await response.json();

      if (data.success) {
        showToast(`${data.updated} productos actualizados`, 'success');
        loadProducts();
      } else {
        showToast(data.error || 'Error al sincronizar', 'error');
      }
    } catch (error) {
      console.error('Error sincronizando precios:', error);
      showToast('Error al sincronizar', 'error');
    } finally {
      setSyncingPrices(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const clearFilters = () => {
    setSearch('');
    setSelectedCategory('');
    setStatus('');
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  // Calcular precio B2B basado en porcentaje de descuento
  const calculateB2BPrice = (originalPrice: number, discountPercentage: number) => {
    return Math.round(originalPrice * (1 - discountPercentage / 100));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
            <Package className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Productos B2B</h1>
            <p className="text-gray-600 mt-1">Gestiona los precios mayoristas para empresas</p>
          </div>
        </div>

        <button
          onClick={handleSyncPrices}
          disabled={syncingPrices}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
        >
          {syncingPrices ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <RefreshCw className="w-5 h-5" />
          )}
          Sincronizar Precios
        </button>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
        <Building2 className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-medium text-blue-900">Precios Mayoristas B2B</p>
          <p className="text-sm text-blue-700 mt-1">
            Los productos B2B tienen un descuento aplicado sobre el precio de la tienda familiar.
            Ajusta el porcentaje de descuento o el precio B2B directamente para cada producto.
          </p>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 lg:p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Búsqueda */}
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar productos..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPagination(prev => ({ ...prev, page: 1 }));
                }}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>
          </div>

          {/* Categorías */}
          <div>
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setPagination(prev => ({ ...prev, page: 1 }));
              }}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white"
            >
              <option value="">Todas las categorías</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.slug}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Estado */}
          <div>
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPagination(prev => ({ ...prev, page: 1 }));
              }}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white"
            >
              <option value="">Todos los estados</option>
              <option value="active">Activos en B2B</option>
              <option value="inactive">Inactivos en B2B</option>
            </select>
          </div>

          {/* Limpiar filtros */}
          <button
            onClick={clearFilters}
            className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <Filter className="w-5 h-5" />
            Limpiar
          </button>
        </div>
      </div>

      {/* Lista de Productos */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No se encontraron productos B2B</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 lg:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                      Producto
                    </th>
                    <th className="px-4 lg:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase hidden md:table-cell">
                      Categoría
                    </th>
                    <th className="px-4 lg:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                      Precio Original
                    </th>
                    <th className="px-4 lg:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                      <div className="flex items-center gap-1">
                        <Building2 className="w-4 h-4" />
                        Precio B2B
                      </div>
                    </th>
                    <th className="px-4 lg:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase hidden lg:table-cell">
                      Descuento
                    </th>
                    <th className="px-4 lg:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                      Estado B2B
                    </th>
                    <th className="px-4 lg:px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {products.map((product) => (
                    <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 lg:px-6 py-4">
                        <div className="flex items-center gap-3">
                          {product.main_image_url ? (
                            <img
                              src={product.main_image_url}
                              alt={product.name}
                              className="w-12 h-12 rounded-lg object-cover"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center">
                              <ImageIcon className="w-6 h-6 text-gray-400" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="font-semibold text-gray-900 truncate">{product.name}</p>
                            <p className="text-xs text-gray-500">Min: {product.min_quantity} unidades</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 lg:px-6 py-4 hidden md:table-cell">
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">
                          {product.category_name || 'Sin categoría'}
                        </span>
                      </td>
                      <td className="px-4 lg:px-6 py-4">
                        <span className="text-gray-600 line-through">
                          {formatCurrency(product.original_price)}
                        </span>
                      </td>
                      <td className="px-4 lg:px-6 py-4">
                        <span className="font-bold text-blue-600">
                          {formatCurrency(product.b2b_price)}
                        </span>
                      </td>
                      <td className="px-4 lg:px-6 py-4 hidden lg:table-cell">
                        <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                          -{product.discount_percentage}%
                        </span>
                      </td>
                      <td className="px-4 lg:px-6 py-4">
                        <button
                          onClick={() => handleToggleActive(product.id, product.is_active)}
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium transition-colors ${product.is_active
                            ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          {product.is_active ? (
                            <>
                              <Eye className="w-3 h-3" />
                              Activo B2B
                            </>
                          ) : (
                            <>
                              <EyeOff className="w-3 h-3" />
                              Inactivo
                            </>
                          )}
                        </button>
                      </td>
                      <td className="px-4 lg:px-6 py-4 text-right">
                        <button
                          onClick={() => setEditingProduct(product)}
                          className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                          title="Editar"
                        >
                          <Edit className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Paginación */}
            {pagination.totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  Mostrando {((pagination.page - 1) * pagination.limit) + 1} a {Math.min(pagination.page * pagination.limit, pagination.total)} de {pagination.total} productos
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                    disabled={pagination.page === 1}
                    className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
                  >
                    Anterior
                  </button>
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, page: Math.min(prev.totalPages, prev.page + 1) }))}
                    disabled={pagination.page === pagination.totalPages}
                    className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
                  >
                    Siguiente
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal de Edición */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
            <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-blue-600" />
                Editar Precio B2B
              </h3>
              <button
                onClick={() => setEditingProduct(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Producto Info */}
              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                {editingProduct.main_image_url ? (
                  <img
                    src={editingProduct.main_image_url}
                    alt={editingProduct.name}
                    className="w-16 h-16 rounded-lg object-cover"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-lg bg-gray-200 flex items-center justify-center">
                    <ImageIcon className="w-8 h-8 text-gray-400" />
                  </div>
                )}
                <div>
                  <p className="font-semibold text-gray-900">{editingProduct.name}</p>
                  <p className="text-sm text-gray-500">{editingProduct.category_name}</p>
                  <p className="text-sm text-gray-500">
                    Precio original: <strong>{formatCurrency(editingProduct.original_price)}</strong>
                  </p>
                </div>
              </div>

              {/* Porcentaje de Descuento */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <Percent className="w-4 h-4 text-green-600" />
                  Porcentaje de Descuento B2B
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    value={editingProduct.discount_percentage}
                    onChange={(e) => {
                      const discount = Math.min(100, Math.max(0, parseFloat(e.target.value) || 0));
                      setEditingProduct({
                        ...editingProduct,
                        discount_percentage: discount,
                        b2b_price: calculateB2BPrice(editingProduct.original_price, discount)
                      });
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    min="0"
                    max="100"
                  />
                  <span className="text-gray-500">%</span>
                </div>
              </div>

              {/* Precio B2B Calculado/Manual */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-blue-600" />
                  Precio B2B Final
                </label>
                <input
                  type="number"
                  value={editingProduct.b2b_price}
                  onChange={(e) => {
                    const newPrice = parseFloat(e.target.value) || 0;
                    const discountPct = editingProduct.original_price > 0
                      ? Math.round((1 - newPrice / editingProduct.original_price) * 100)
                      : 0;
                    setEditingProduct({
                      ...editingProduct,
                      b2b_price: newPrice,
                      discount_percentage: Math.max(0, discountPct)
                    });
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  min="0"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Ahorro: {formatCurrency(editingProduct.original_price - editingProduct.b2b_price)} ({editingProduct.discount_percentage}% descuento)
                </p>
              </div>

              {/* Cantidad Mínima */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cantidad Mínima de Compra
                </label>
                <input
                  type="number"
                  value={editingProduct.min_quantity}
                  onChange={(e) => setEditingProduct({
                    ...editingProduct,
                    min_quantity: parseInt(e.target.value) || 1
                  })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  min="1"
                />
              </div>

              {/* Estado */}
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingProduct.is_active}
                    onChange={(e) => setEditingProduct({
                      ...editingProduct,
                      is_active: e.target.checked
                    })}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Activo en catálogo B2B</span>
                </label>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end gap-3">
              <button
                onClick={() => setEditingProduct(null)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveProduct}
                disabled={saving}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Guardar Cambios
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-white flex items-center gap-2 ${
          toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'
        }`}>
          {toast.type === 'success' ? '✓' : '✕'}
          <span className="font-medium">{toast.message}</span>
        </div>
      )}
    </div>
  );
}
