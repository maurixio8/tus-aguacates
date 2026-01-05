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
  Layers,
  Plus,
  Save,
  X,
  Loader2,
  TrendingUp,
  AlertTriangle
} from 'lucide-react';

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface PricingTier {
  id: string;
  min_quantity: number;
  max_quantity: number | null;
  price_per_unit: number;
  tier_name: string;
  discount_percentage: number | null;
}

interface B2BProduct {
  id: string;
  sku: string;
  name: string;
  description: string | null;
  category_id: string | null;
  base_price: number;
  cost_price: number | null;
  stock_quantity: number;
  minimum_order_quantity: number;
  unit: string;
  is_active: boolean;
  is_featured: boolean;
  main_image_url: string | null;
  pricing_tiers?: PricingTier[];
  category?: Category;
  created_at: string;
  updated_at: string;
}

interface Pagination {
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
}

export default function B2BProductsPage() {
  const [products, setProducts] = useState<B2BProduct[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [status, setStatus] = useState('');
  const [lowStock, setLowStock] = useState(false);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    page_size: 20,
    total: 0,
    total_pages: 1,
  });
  const [editingProduct, setEditingProduct] = useState<B2BProduct | null>(null);
  const [saving, setSaving] = useState(false);
  const [expandedProduct, setExpandedProduct] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    loadCategories();
    loadProducts();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadProducts();
    }, 300);
    return () => clearTimeout(timer);
  }, [search, selectedCategory, status, lowStock, pagination.page]);

  const loadCategories = async () => {
    try {
      const response = await fetch('/api/admin/b2b/categories');
      const data = await response.json();

      if (data.success) {
        setCategories(data.data || []);
      }
    } catch (error) {
      console.error('Error cargando categorías B2B:', error);
    } finally {
      setLoadingCategories(false);
    }
  };

  const loadProducts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', pagination.page.toString());
      params.set('page_size', pagination.page_size.toString());
      if (search) params.set('search', search);
      if (selectedCategory) params.set('category_id', selectedCategory);
      if (status) params.set('is_active', status === 'active' ? 'true' : 'false');
      if (lowStock) params.set('low_stock', 'true');
      params.set('_t', Date.now().toString());

      const response = await fetch(`/api/admin/b2b/products?${params}`, {
        credentials: 'include',
        cache: 'no-store',
      });

      const data = await response.json();

      if (data.success) {
        setProducts(data.data || []);
        setPagination(prev => ({
          ...prev,
          total: data.meta?.pagination?.total || 0,
          total_pages: data.meta?.pagination?.total_pages || 1,
        }));
      } else {
        showToast('Error al cargar productos B2B', 'error');
      }
    } catch (error) {
      console.error('Error cargando productos B2B:', error);
      showToast('Error de conexión', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (productId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/admin/b2b/products?id=${productId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ is_active: !currentStatus }),
      });

      if (response.ok) {
        loadProducts();
        showToast('Estado actualizado correctamente', 'success');
      }
    } catch (error) {
      console.error('Error actualizando producto:', error);
      showToast('Error al actualizar el producto', 'error');
    }
  };

  const handleSaveProduct = async () => {
    if (!editingProduct) return;
    setSaving(true);

    try {
      const response = await fetch(`/api/admin/b2b/products?id=${editingProduct.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: editingProduct.name,
          description: editingProduct.description,
          base_price: editingProduct.base_price,
          cost_price: editingProduct.cost_price,
          stock_quantity: editingProduct.stock_quantity,
          minimum_order_quantity: editingProduct.minimum_order_quantity,
          unit: editingProduct.unit,
          category_id: editingProduct.category_id,
          is_active: editingProduct.is_active,
          is_featured: editingProduct.is_featured,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setEditingProduct(null);
        loadProducts();
        showToast('Producto guardado correctamente', 'success');
      } else {
        showToast(data.error?.message || 'Error al guardar', 'error');
      }
    } catch (error) {
      console.error('Error guardando producto:', error);
      showToast('Error al guardar el producto', 'error');
    } finally {
      setSaving(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Productos B2B</h1>
          <p className="text-gray-600 mt-1">Gestión de catálogo mayorista</p>
        </div>
        <a
          href="/admin/empresas/productos-b2b/nuevo"
          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Nuevo Producto
        </a>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Búsqueda */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar por nombre, SKU..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPagination(prev => ({ ...prev, page: 1 }));
              }}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
            />
          </div>

          {/* Categoría */}
          <select
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              setPagination(prev => ({ ...prev, page: 1 }));
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
          >
            <option value="">Todas las categorías</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>

          {/* Estado */}
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPagination(prev => ({ ...prev, page: 1 }));
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
          >
            <option value="">Todos los estados</option>
            <option value="active">Activos</option>
            <option value="inactive">Inactivos</option>
          </select>

          {/* Stock bajo */}
          <label className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
            <input
              type="checkbox"
              checked={lowStock}
              onChange={(e) => {
                setLowStock(e.target.checked);
                setPagination(prev => ({ ...prev, page: 1 }));
              }}
              className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
            />
            <span className="text-sm text-gray-700">Stock bajo (&lt;10)</span>
          </label>
        </div>
      </div>

      {/* Toast notification */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg ${
          toast.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
        }`}>
          {toast.message}
        </div>
      )}

      {/* Loading */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-green-600 animate-spin" />
        </div>
      ) : (
        <>
          {/* Lista de productos */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {products.length === 0 ? (
              <div className="text-center py-12">
                <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No hay productos B2B</p>
                <p className="text-sm text-gray-500 mt-1">
                  {search || selectedCategory || status || lowStock
                    ? 'Intenta con otros filtros'
                    : 'Crea tu primer producto para comenzar'}
                </p>
              </div>
            ) : (
              <>
                {/* Desktop view */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Producto</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">SKU</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Categoría</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Precio Base</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Stock</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Estado</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {products.map((product) => (
                        <>
                          <tr key={product.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-3">
                                {product.main_image_url && (
                                  <img
                                    src={product.main_image_url}
                                    alt={product.name}
                                    className="w-12 h-12 rounded-lg object-cover"
                                  />
                                )}
                                <div>
                                  <p className="font-medium text-gray-900">{product.name}</p>
                                  <p className="text-sm text-gray-500">
                                    Min: {product.minimum_order_quantity} {product.unit}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600">{product.sku}</td>
                            <td className="px-4 py-3">
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                                {product.category?.name || 'Sin categoría'}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <p className="font-semibold text-gray-900">{formatCurrency(product.base_price)}</p>
                              {product.cost_price && (
                                <p className="text-xs text-gray-500">
                                  Costo: {formatCurrency(product.cost_price)}
                                </p>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <span className={`inline-flex items-center gap-1 text-sm ${
                                product.stock_quantity < 10 ? 'text-red-600 font-semibold' : 'text-gray-900'
                              }`}>
                                {product.stock_quantity < 10 && <AlertTriangle className="w-4 h-4" />}
                                {product.stock_quantity} {product.unit}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                product.is_active
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-gray-100 text-gray-700'
                              }`}>
                                {product.is_active ? 'Activo' : 'Inactivo'}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => setEditingProduct(product)}
                                  className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                  title="Editar"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleToggleActive(product.id, product.is_active)}
                                  className={`p-2 rounded-lg transition-colors ${
                                    product.is_active
                                      ? 'text-green-600 hover:text-green-700 hover:bg-green-50'
                                      : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                                  }`}
                                  title={product.is_active ? 'Desactivar' : 'Activar'}
                                >
                                  {product.is_active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                                </button>
                                {product.pricing_tiers && product.pricing_tiers.length > 0 && (
                                  <button
                                    onClick={() => setExpandedProduct(expandedProduct === product.id ? null : product.id)}
                                    className="p-2 text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition-colors"
                                    title="Ver precios por volumen"
                                  >
                                    <TrendingUp className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                          {/* Pricing tiers expandidos */}
                          {expandedProduct === product.id && product.pricing_tiers && product.pricing_tiers.length > 0 && (
                            <tr key={`${product.id}-tiers`}>
                              <td colSpan={7} className="px-4 py-3 bg-purple-50">
                                <div className="space-y-2">
                                  <p className="text-sm font-semibold text-purple-900">Precios por Volumen:</p>
                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                                    {product.pricing_tiers.map((tier) => (
                                      <div
                                        key={tier.id}
                                        className="bg-white p-3 rounded-lg border border-purple-200"
                                      >
                                        <p className="text-sm font-medium text-gray-900">{tier.tier_name}</p>
                                        <p className="text-xs text-gray-500">
                                          {tier.min_quantity}+ {product.unit}
                                        </p>
                                        <p className="text-lg font-bold text-green-600">
                                          {formatCurrency(tier.price_per_unit)}
                                          {tier.discount_percentage && (
                                            <span className="text-xs text-green-500 ml-1">
                                              ({tier.discount_percentage}% desc)
                                            </span>
                                          )}
                                        </p>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile view */}
                <div className="md:hidden space-y-4 p-4">
                  {products.map((product) => (
                    <div key={product.id} className="bg-white rounded-lg border border-gray-200 p-4">
                      <div className="flex items-start gap-3">
                        {product.main_image_url && (
                          <img
                            src={product.main_image_url}
                            alt={product.name}
                            className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 truncate">{product.name}</h3>
                          <p className="text-sm text-gray-500">{product.sku}</p>
                          <p className="text-lg font-bold text-green-600 mt-1">
                            {formatCurrency(product.base_price)}
                          </p>
                        </div>
                      </div>
                      <div className="mt-3 flex items-center justify-between">
                        <span className={`inline-flex items-center gap-1 text-sm ${
                          product.stock_quantity < 10 ? 'text-red-600 font-semibold' : 'text-gray-900'
                        }`}>
                          Stock: {product.stock_quantity}
                        </span>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          product.is_active
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}>
                          {product.is_active ? 'Activo' : 'Inactivo'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Paginación */}
                <div className="bg-gray-50 px-4 py-3 border-t border-gray-200 flex items-center justify-between">
                  <p className="text-sm text-gray-600">
                    Mostrando <span className="font-semibold">{(pagination.page - 1) * pagination.page_size + 1}</span> a{' '}
                    <span className="font-semibold">{Math.min(pagination.page * pagination.page_size, pagination.total)}</span> de{' '}
                    <span className="font-semibold">{pagination.total}</span> productos
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                      disabled={pagination.page === 1}
                      className="p-2 rounded-lg border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <span className="px-3 py-1 text-sm text-gray-700">
                      Página {pagination.page} de {pagination.total_pages}
                    </span>
                    <button
                      onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                      disabled={pagination.page === pagination.total_pages}
                      className="p-2 rounded-lg border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </>
      )}

      {/* Modal de edición */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Editar Producto B2B</h2>
              <button
                onClick={() => setEditingProduct(null)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Nombre */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del producto</label>
                <input
                  type="text"
                  value={editingProduct.name}
                  onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>

              {/* Descripción */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                <textarea
                  value={editingProduct.description || ''}
                  onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Precio base */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Precio Base</label>
                  <input
                    type="number"
                    value={editingProduct.base_price}
                    onChange={(e) => setEditingProduct({ ...editingProduct, base_price: parseFloat(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>

                {/* Precio costo */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Precio Costo (opcional)</label>
                  <input
                    type="number"
                    value={editingProduct.cost_price || ''}
                    onChange={(e) => setEditingProduct({
                      ...editingProduct,
                      cost_price: e.target.value ? parseFloat(e.target.value) : null
                    })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                {/* Stock */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Stock</label>
                  <input
                    type="number"
                    value={editingProduct.stock_quantity}
                    onChange={(e) => setEditingProduct({ ...editingProduct, stock_quantity: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>

                {/* Cantidad mínima */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cant. Mínima</label>
                  <input
                    type="number"
                    value={editingProduct.minimum_order_quantity}
                    onChange={(e) => setEditingProduct({ ...editingProduct, minimum_order_quantity: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>

                {/* Unidad */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Unidad</label>
                  <select
                    value={editingProduct.unit}
                    onChange={(e) => setEditingProduct({ ...editingProduct, unit: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  >
                    <option value="unit">Unidad</option>
                    <option value="kg">Kilogramo (kg)</option>
                    <option value="lb">Libra (lb)</option>
                    <option value="box">Caja</option>
                    <option value="case">Caso</option>
                    <option value="pallet">Pallet</option>
                  </select>
                </div>
              </div>

              {/* Categoría */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
                <select
                  value={editingProduct.category_id || ''}
                  onChange={(e) => setEditingProduct({ ...editingProduct, category_id: e.target.value || null })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                >
                  <option value="">Sin categoría</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Estados */}
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={editingProduct.is_active}
                    onChange={(e) => setEditingProduct({ ...editingProduct, is_active: e.target.checked })}
                    className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
                  />
                  <span className="text-sm text-gray-700">Producto activo</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={editingProduct.is_featured}
                    onChange={(e) => setEditingProduct({ ...editingProduct, is_featured: e.target.checked })}
                    className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
                  />
                  <span className="text-sm text-gray-700">Destacado</span>
                </label>
              </div>
            </div>

            <div className="sticky bottom-0 bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => setEditingProduct(null)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveProduct}
                disabled={saving}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center gap-2"
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
    </div>
  );
}
