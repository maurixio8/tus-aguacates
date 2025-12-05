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
  Layers,
  Camera,
  Upload,
  Loader2
} from 'lucide-react';
import { useRef } from 'react';

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface ProductVariant {
  id: string;
  variant_name: string;
  variant_value: string;
  price?: number;
  price_adjustment?: number;
  stock_quantity?: number;
  is_active?: boolean;
  sku?: string;
  sort_order?: number;
}

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  discount_price?: number;
  stock: number;
  is_active: boolean;
  is_featured: boolean;
  main_image_url?: string;
  category_id: string;
  categories?: Category;
  category_name?: string;
  unit: string;
  product_variants?: ProductVariant[];
  variants?: ProductVariant[];
  hasVariants?: boolean;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [status, setStatus] = useState('');
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
  });
  const [expandedProduct, setExpandedProduct] = useState<string | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedProductForImage, setSelectedProductForImage] = useState<string | null>(null);

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
      const response = await fetch('/api/categories/');
      const data = await response.json();
      if (data.success || Array.isArray(data)) {
        setCategories(data.categories || data || []);
      }
    } catch (error) {
      console.error('Error cargando categorías:', error);
    } finally {
      setLoadingCategories(false);
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

      // IMPORTANTE: trailing slash para evitar redirect 308
      const response = await fetch(`/api/admin/products/?${params}`, {
        credentials: 'include',
      });
      const data = await response.json();

      if (data.success) {
        setProducts(data.data || []);
        setPagination(prev => ({
          ...prev,
          total: data.pagination?.total || 0,
          totalPages: data.pagination?.totalPages || 1,
        }));
      }
    } catch (error) {
      console.error('Error cargando productos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (productId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/admin/products/${productId}/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ is_active: !currentStatus }),
      });

      if (response.ok) {
        loadProducts();
      }
    } catch (error) {
      console.error('Error actualizando producto:', error);
      alert('Error al actualizar el producto');
    }
  };

  const handleSaveProduct = async () => {
    if (!editingProduct) return;
    setSaving(true);

    try {
      const response = await fetch(`/api/admin/products/${editingProduct.id}/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: editingProduct.name,
          description: editingProduct.description,
          price: editingProduct.price,
          discount_price: editingProduct.discount_price || null,
          stock: editingProduct.stock,
          is_active: editingProduct.is_active,
          is_featured: editingProduct.is_featured,
          main_image_url: editingProduct.main_image_url,
          category_id: editingProduct.category_id,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setEditingProduct(null);
        loadProducts();
      } else {
        alert(data.error || 'Error al guardar');
      }
    } catch (error) {
      console.error('Error guardando producto:', error);
      alert('Error al guardar el producto');
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

  // Función para subir imagen rápida
  const handleQuickImageUpload = (productId: string) => {
    setSelectedProductForImage(productId);
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedProductForImage) return;

    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      alert('Por favor selecciona una imagen válida');
      return;
    }

    // Validar tamaño (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('La imagen es muy grande. Máximo 5MB');
      return;
    }

    setUploadingImage(selectedProductForImage);

    try {
      // Crear FormData para subir la imagen
      const formData = new FormData();
      formData.append('file', file);
      formData.append('productId', selectedProductForImage);

      const response = await fetch('/api/admin/upload-image/', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      const data = await response.json();

      if (data.success && data.imageUrl) {
        // Actualizar el producto con la nueva imagen
        await fetch(`/api/admin/products/${selectedProductForImage}/`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ main_image_url: data.imageUrl }),
        });

        loadProducts();
      } else {
        alert(data.error || 'Error al subir la imagen');
      }
    } catch (error) {
      console.error('Error subiendo imagen:', error);
      alert('Error al subir la imagen');
    } finally {
      setUploadingImage(null);
      setSelectedProductForImage(null);
      // Limpiar el input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const clearFilters = () => {
    setSearch('');
    setSelectedCategory('');
    setStatus('');
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  return (
    <div className="space-y-6">
      {/* Input oculto para subir imágenes */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
        capture="environment"
      />

      {/* Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Gestión de Productos</h1>
        <p className="text-gray-600 mt-1">Administra tu catálogo de productos</p>
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
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
              />
            </div>
          </div>

          {/* Categorías */}
          <div>
            <div className="relative">
              <Package className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <select
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value);
                  setPagination(prev => ({ ...prev, page: 1 }));
                }}
                disabled={loadingCategories}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none appearance-none bg-white"
              >
                <option value="">Todas las categorías</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Estado */}
          <div>
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPagination(prev => ({ ...prev, page: 1 }));
              }}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none appearance-none bg-white"
            >
              <option value="">Todos los estados</option>
              <option value="active">Activos</option>
              <option value="inactive">Inactivos</option>
              <option value="featured">Destacados</option>
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

        {/* Filtros activos */}
        {(search || selectedCategory || status) && (
          <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
            <span className="text-gray-600 font-medium">Filtros:</span>
            {search && (
              <span className="px-2 py-1 bg-green-100 text-green-700 rounded flex items-center gap-1">
                Búsqueda: {search}
                <button onClick={() => setSearch('')}><X className="w-3 h-3" /></button>
              </span>
            )}
            {selectedCategory && (
              <span className="px-2 py-1 bg-green-100 text-green-700 rounded flex items-center gap-1">
                Categoría: {categories.find(c => c.id === selectedCategory)?.name}
                <button onClick={() => setSelectedCategory('')}><X className="w-3 h-3" /></button>
              </span>
            )}
            {status && (
              <span className="px-2 py-1 bg-green-100 text-green-700 rounded flex items-center gap-1">
                Estado: {status === 'active' ? 'Activos' : status === 'inactive' ? 'Inactivos' : 'Destacados'}
                <button onClick={() => setStatus('')}><X className="w-3 h-3" /></button>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Lista de Productos */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No se encontraron productos</p>
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
                      Precio
                    </th>
                    <th className="px-4 lg:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase hidden lg:table-cell">
                      Stock
                    </th>
                    <th className="px-4 lg:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                      Estado
                    </th>
                    <th className="px-4 lg:px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {products.map((product) => (
                    <>
                      <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 lg:px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="relative group">
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
                              {/* Botón de cámara rápida */}
                              <button
                                onClick={() => handleQuickImageUpload(product.id)}
                                disabled={uploadingImage === product.id}
                                className="absolute inset-0 bg-black/50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                                title="Subir foto"
                              >
                                {uploadingImage === product.id ? (
                                  <Loader2 className="w-5 h-5 text-white animate-spin" />
                                ) : (
                                  <Camera className="w-5 h-5 text-white" />
                                )}
                              </button>
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-gray-900 truncate">{product.name}</p>
                              {((product.variants && product.variants.length > 0) || (product.product_variants && product.product_variants.length > 0)) && (
                                <p className="text-xs text-blue-600 flex items-center gap-1">
                                  <Layers className="w-3 h-3" />
                                  {(product.variants?.length || product.product_variants?.length || 0)} variante(s)
                                </p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 lg:px-6 py-4 hidden md:table-cell">
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                            {product.category_name || product.categories?.name || 'Sin categoría'}
                          </span>
                        </td>
                        <td className="px-4 lg:px-6 py-4">
                          <div>
                            <span className="font-semibold text-gray-900">
                              {formatCurrency(product.price)}
                            </span>
                            {product.discount_price && (
                              <span className="block text-xs text-green-600">
                                Oferta: {formatCurrency(product.discount_price)}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 lg:px-6 py-4 hidden lg:table-cell">
                          <span className={`font-medium ${product.stock < 10 ? 'text-red-600' : 'text-gray-900'}`}>
                            {product.stock}
                          </span>
                        </td>
                        <td className="px-4 lg:px-6 py-4">
                          <button
                            onClick={() => handleToggleActive(product.id, product.is_active)}
                            className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium transition-colors ${
                              product.is_active
                                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                          >
                            {product.is_active ? (
                              <>
                                <Eye className="w-3 h-3" />
                                <span className="hidden sm:inline">Activo</span>
                              </>
                            ) : (
                              <>
                                <EyeOff className="w-3 h-3" />
                                <span className="hidden sm:inline">Inactivo</span>
                              </>
                            )}
                          </button>
                        </td>
                        <td className="px-4 lg:px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => setEditingProduct(product)}
                              className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors"
                            >
                              <Edit className="w-4 h-4 lg:hidden" />
                              <span className="hidden lg:inline">Editar</span>
                            </button>
                            {((product.variants && product.variants.length > 0) || (product.product_variants && product.product_variants.length > 0)) && (
                              <button
                                onClick={() => setExpandedProduct(expandedProduct === product.id ? null : product.id)}
                                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                              >
                                <Layers className="w-4 h-4 lg:hidden" />
                                <span className="hidden lg:inline">
                                  {expandedProduct === product.id ? 'Ocultar' : 'Variantes'}
                                </span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>

                      {/* Fila expandida para variantes */}
                      {expandedProduct === product.id && (product.variants || product.product_variants) && (
                        <tr>
                          <td colSpan={6} className="px-4 lg:px-6 py-4 bg-gray-50">
                            <div className="space-y-3">
                              <h4 className="font-semibold text-gray-900">Variantes del Producto</h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                {(product.variants || product.product_variants || []).map((variant) => (
                                  <div
                                    key={variant.id}
                                    className="bg-white p-3 rounded-lg border border-gray-200"
                                  >
                                    <div className="flex justify-between items-start mb-2">
                                      <div>
                                        <p className="font-medium text-gray-900">{variant.variant_name}</p>
                                        <p className="text-sm text-gray-600">{variant.variant_value}</p>
                                      </div>
                                      <span
                                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                          variant.is_active
                                            ? 'bg-green-100 text-green-800'
                                            : 'bg-red-100 text-red-800'
                                        }`}
                                      >
                                        {variant.is_active ? 'Activa' : 'Inactiva'}
                                      </span>
                                    </div>
                                    <div className="text-sm text-gray-600 space-y-1">
                                      <p>Stock: <span className="font-medium">{variant.stock_quantity || 100}</span></p>
                                      {variant.sku && <p>SKU: <span className="font-medium">{variant.sku}</span></p>}
                                      <p className="font-medium text-green-600">
                                        Precio: {formatCurrency((variant as any).price || (product.price + (variant.price_adjustment || 0)))}
                                      </p>
                                    </div>
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

            {/* Paginación */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-between px-4 lg:px-6 py-4 border-t border-gray-200">
                <div className="text-sm text-gray-700">
                  Página {pagination.page} de {pagination.totalPages} | Total: {pagination.total} productos
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                    disabled={pagination.page === 1}
                    className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                    disabled={pagination.page === pagination.totalPages}
                    className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal de Edición */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Editar Producto</h2>
              <button
                onClick={() => setEditingProduct(null)}
                className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Imagen */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">URL de Imagen</label>
                <div className="flex gap-4">
                  {editingProduct.main_image_url && (
                    <img
                      src={editingProduct.main_image_url}
                      alt={editingProduct.name}
                      className="w-24 h-24 rounded-lg object-cover"
                    />
                  )}
                  <input
                    type="url"
                    value={editingProduct.main_image_url || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, main_image_url: e.target.value })}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                    placeholder="https://..."
                  />
                </div>
              </div>

              {/* Nombre */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nombre *</label>
                <input
                  type="text"
                  value={editingProduct.name}
                  onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                  required
                />
              </div>

              {/* Descripción */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Descripción</label>
                <textarea
                  value={editingProduct.description || ''}
                  onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none resize-none"
                />
              </div>

              {/* Categoría */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Categoría *</label>
                <select
                  value={editingProduct.category_id}
                  onChange={(e) => setEditingProduct({ ...editingProduct, category_id: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                >
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              {/* Precios */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Precio *</label>
                  <input
                    type="number"
                    value={editingProduct.price}
                    onChange={(e) => setEditingProduct({ ...editingProduct, price: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                    min="0"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Precio Oferta</label>
                  <input
                    type="number"
                    value={editingProduct.discount_price || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, discount_price: parseFloat(e.target.value) || undefined })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                    min="0"
                    placeholder="Opcional"
                  />
                </div>
              </div>

              {/* Stock */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Stock *</label>
                <input
                  type="number"
                  value={editingProduct.stock}
                  onChange={(e) => setEditingProduct({ ...editingProduct, stock: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                  min="0"
                  required
                />
              </div>

              {/* Opciones */}
              <div className="flex gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingProduct.is_active}
                    onChange={(e) => setEditingProduct({ ...editingProduct, is_active: e.target.checked })}
                    className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
                  />
                  <span className="text-sm text-gray-700">Producto Activo</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingProduct.is_featured}
                    onChange={(e) => setEditingProduct({ ...editingProduct, is_featured: e.target.checked })}
                    className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
                  />
                  <span className="text-sm text-gray-700">Producto Destacado</span>
                </label>
              </div>
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end gap-3">
              <button
                onClick={() => setEditingProduct(null)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveProduct}
                disabled={saving}
                className="px-6 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white rounded-lg transition-colors flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
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
