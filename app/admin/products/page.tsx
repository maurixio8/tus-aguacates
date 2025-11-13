'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
// import ProductModal from './components/ProductModal'; // Temporarily disabled
import {
  Package,
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Star,
  X,
  CheckCircle,
  AlertCircle,
  DollarSign,
  TrendingUp,
  TrendingDown
} from 'lucide-react';

interface Product {
  id: string;
  name: string;
  description: string;
  category_id: string;
  category_name?: string;
  price: number;
  discount_price?: number;
  unit: string;
  weight?: number;
  min_quantity: number;
  main_image_url?: string;
  images?: string[];
  stock: number;
  reserved_stock: number;
  is_organic: boolean;
  is_featured: boolean;
  is_active: boolean;
  benefits?: string[];
  rating: number;
  review_count: number;
  slug: string;
  sku?: string;
  created_at: string;
  updated_at: string;
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface ProductStats {
  total: number;
  active: number;
  inactive: number;
  low_stock: number;
  total_value: number;
}

export default function ProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [stats, setStats] = useState<ProductStats>({
    total: 0,
    active: 0,
    inactive: 0,
    low_stock: 0,
    total_value: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [productToDelete, setProductToDelete] = useState<string | null>(null);
  const [deletingProductId, setDeletingProductId] = useState<string | null>(null);
  const [togglingProductId, setTogglingProductId] = useState<string | null>(null);
  const [savingProduct, setSavingProduct] = useState(false);

  useEffect(() => {
    loadProducts();
    loadCategories();
  }, [searchQuery, selectedCategory, selectedStatus]);

  const loadProducts = async () => {
    setLoading(true);
    try {
      console.log('🔍 Loading products with filters:', { searchQuery, selectedCategory, selectedStatus });

      let query = supabase
        .from('products')
        .select(`
          *,
          categories:category_id (
            id,
            name,
            slug
          )
        `)
        .order('created_at', { ascending: false });

      // Apply search filter
      if (searchQuery) {
        query = query.or(`name.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`);
      }

      // Apply category filter
      if (selectedCategory !== 'all') {
        query = query.eq('category_id', selectedCategory);
      }

      // Apply status filter
      if (selectedStatus !== 'all') {
        if (selectedStatus === 'active') {
          query = query.eq('is_active', true);
        } else if (selectedStatus === 'inactive') {
          query = query.eq('is_active', false);
        } else if (selectedStatus === 'featured') {
          query = query.eq('is_featured', true);
        }
      }

      const { data, error } = await query;

      console.log('📊 Products data:', {
        totalProducts: data?.length || 0,
        sampleProduct: data?.[0] ? { id: data[0].id, name: data[0].name, is_active: data[0].is_active } : null,
        error: error?.message
      });

      if (error) throw error;

      const productsData = data?.map(item => ({
        ...item,
        category_name: item.categories?.name || 'Sin categoría'
      })) || [];

      console.log('📝 Products with category names:', productsData.slice(0, 3).map(p => ({ id: p.id, name: p.name, category: p.category_name, active: p.is_active })));

      setProducts(productsData);

      // Calculate stats
      const activeProducts = productsData.filter(p => p.is_active);
      const lowStockProducts = productsData.filter(p => p.stock <= 10 && p.is_active);
      const totalValue = activeProducts.reduce((sum, p) => sum + (p.price * p.stock), 0);

      const newStats = {
        total: productsData.length,
        active: activeProducts.length,
        inactive: productsData.filter(p => !p.is_active).length,
        low_stock: lowStockProducts.length,
        total_value: totalValue
      };

      console.log('📈 Updated stats:', newStats);
      setStats(newStats);

    } catch (error) {
      console.error('❌ Error loading products:', {
        error: error,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        errorStack: error instanceof Error ? error.stack : 'No stack trace'
      });
      alert('Error al cargar los productos');
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('id, name, slug')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('❌ Error loading categories:', error);
    }
  };

  const toggleProductStatus = async (productId: string, currentStatus: boolean) => {
    setTogglingProductId(productId);
    try {
      console.log('🔄 Toggling product status:', { productId, currentStatus });

      // Use API endpoint instead of direct database access
      const response = await fetch(`/api/admin/products/${productId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          is_active: !currentStatus,
          updated_at: new Date().toISOString()
        }),
      });

      console.log('📡 API response status:', response.status);
      console.log('📡 API response headers:', response.headers);

      const data = await response.json();
      console.log('📊 API response data:', data);

      if (!response.ok || !data.success) {
        console.error('❌ API Error:', { status: response.status, data });
        throw new Error(data.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      console.log('✅ Product status updated successfully via API');
      await loadProducts();

      alert(`Producto ${!currentStatus ? 'activado' : 'desactivado'} con éxito`);

    } catch (error) {
      console.error('❌ Error toggling product status:', {
        error: error,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        errorStack: error instanceof Error ? error.stack : 'No stack trace'
      });
      alert(`Error al ${currentStatus ? 'activar' : 'desactivar'} el producto: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    } finally {
      setTogglingProductId(null);
    }
  };

  const toggleFeaturedStatus = async (productId: string, currentFeatured: boolean) => {
    setTogglingProductId(productId);
    try {
      console.log('⭐ Toggling featured status:', { productId, currentFeatured });

      // Use API endpoint instead of direct database access
      const response = await fetch(`/api/admin/products/${productId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          is_featured: !currentFeatured,
          updated_at: new Date().toISOString()
        }),
      });

      console.log('📡 Featured API response status:', response.status);

      const data = await response.json();
      console.log('📊 Featured API response data:', data);

      if (!response.ok || !data.success) {
        console.error('❌ Featured API Error:', { status: response.status, data });
        throw new Error(data.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      console.log('✅ Product featured status updated successfully via API');
      await loadProducts();

      alert(`Producto ${!currentFeatured ? 'marcado como destacado' : 'quitado de destacados'} con éxito`);

    } catch (error) {
      console.error('❌ Error toggling featured status:', {
        error: error,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        errorStack: error instanceof Error ? error.stack : 'No stack trace'
      });
      alert(`Error al ${currentFeatured ? 'quitar' : 'marcar como'} destacado: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    } finally {
      setTogglingProductId(null);
    }
  };

  const confirmDelete = (productId: string) => {
    setProductToDelete(productId);
    setShowDeleteConfirm(true);
  };

  const cancelDelete = () => {
    setProductToDelete(null);
    setShowDeleteConfirm(false);
  };

  const deleteProduct = async () => {
    if (!productToDelete) return;

    setDeletingProductId(productToDelete);
    try {
      console.log('🗑️ Deleting product:', productToDelete);

      const { data, error } = await supabase
        .from('products')
        .delete()
        .eq('id', productToDelete)
        .select();

      console.log('💾 Delete response:', { data, error });

      if (error) throw error;

      console.log('✅ Product deleted successfully');
      await loadProducts();

      setShowDeleteConfirm(false);
      setProductToDelete(null);

      alert('Producto eliminado con éxito');

    } catch (error) {
      console.error('❌ Error deleting product:', error);
      alert('Error al eliminar el producto');
    } finally {
      setDeletingProductId(null);
    }
  };

  const openCreateModal = () => {
    setEditingProduct(null);
    setShowCreateModal(true);
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setShowCreateModal(true);
  };

  const closeModal = () => {
    setShowCreateModal(false);
    setEditingProduct(null);
  };

  const saveProduct = async (productData: Partial<Product>) => {
    setSavingProduct(true);
    try {
      console.log('💾 Saving product:', productData);

      let response;
      let successMessage;

      if (editingProduct) {
        // Update existing product
        response = await fetch(`/api/admin/products/${editingProduct.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(productData),
        });
        successMessage = 'Producto actualizado exitosamente';
      } else {
        // Create new product
        response = await fetch('/api/admin/products', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(productData),
        });
        successMessage = 'Producto creado exitosamente';
      }

      const data = await response.json();
      console.log('📊 Save product response:', data);

      if (!data.success) {
        throw new Error(data.error || 'Error al guardar el producto');
      }

      console.log('✅ Product saved successfully');
      alert(successMessage);

      // Close modal and refresh products
      closeModal();
      await loadProducts();

    } catch (error) {
      console.error('❌ Error saving product:', error);
      alert(`Error al guardar el producto: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    } finally {
      setSavingProduct(false);
    }
  };

  const getStockStatus = (stock: number) => {
    if (stock === 0) return { status: 'Sin stock', color: 'bg-red-100 text-red-800' };
    if (stock <= 5) return { status: 'Stock bajo', color: 'bg-orange-100 text-orange-800' };
    if (stock <= 10) return { status: 'Stock limitado', color: 'bg-yellow-100 text-yellow-800' };
    return { status: 'En stock', color: 'bg-green-100 text-green-800' };
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP'
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-gradient-suave py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-display font-bold mb-2">
              Gestión de Productos
            </h1>
            <p className="text-gray-600">Administra tu catálogo de productos</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/admin')}
              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              ← Volver al Dashboard
            </button>
            <button
              onClick={openCreateModal}
              className="bg-gradient-to-r from-yellow-400 to-yellow-600 hover:from-yellow-500 hover:to-yellow-700 text-verde-bosque-700 font-bold px-4 py-2 rounded-lg transition-all flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Nuevo Producto
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-soft">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm mb-1">Total Productos</p>
                <p className="text-3xl font-bold text-verde-bosque">{stats.total}</p>
              </div>
              <Package className="w-12 h-12 text-yellow-500" />
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-soft">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm mb-1">Activos</p>
                <p className="text-3xl font-bold text-green-600">{stats.active}</p>
              </div>
              <CheckCircle className="w-12 h-12 text-green-500" />
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-soft">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm mb-1">Inactivos</p>
                <p className="text-3xl font-bold text-red-600">{stats.inactive}</p>
              </div>
              <X className="w-12 h-12 text-red-500" />
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-soft">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm mb-1">Stock Bajo</p>
                <p className="text-3xl font-bold text-orange-600">{stats.low_stock}</p>
              </div>
              <AlertCircle className="w-12 h-12 text-orange-500" />
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-soft">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm mb-1">Valor Total</p>
                <p className="text-2xl font-bold text-verde-bosque">
                  {formatCurrency(stats.total_value)}
                </p>
              </div>
              <DollarSign className="w-12 h-12 text-yellow-500" />
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-2xl p-6 shadow-soft mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Buscar productos por nombre o descripción..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-verde-aguacate focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-verde-aguacate focus:border-transparent"
              >
                <option value="all">Todas las categorías</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>

              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-verde-aguacate focus:border-transparent"
              >
                <option value="all">Todos los estados</option>
                <option value="active">Activos</option>
                <option value="inactive">Inactivos</option>
                <option value="featured">Destacados</option>
              </select>
            </div>
          </div>
        </div>

        {/* Products Table */}
        <div className="bg-white rounded-2xl shadow-soft overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Producto</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Categoría</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Precio</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Stock</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Estado</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                      Cargando productos...
                    </td>
                  </tr>
                ) : products.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                      {searchQuery || selectedCategory !== 'all' || selectedStatus !== 'all'
                        ? 'No se encontraron productos con los filtros seleccionados'
                        : 'No hay productos registrados'
                      }
                      {!searchQuery && selectedCategory === 'all' && selectedStatus === 'all' && (
                        <div className="mt-4">
                          <button
                            onClick={openCreateModal}
                            className="bg-gradient-to-r from-yellow-400 to-yellow-600 hover:from-yellow-500 hover:to-yellow-700 text-verde-bosque-700 font-bold px-6 py-3 rounded-lg transition-all inline-flex items-center gap-2"
                          >
                            <Plus className="w-5 h-5" />
                            Crear Primer Producto
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ) : (
                  products.map((product) => {
                    const stockStatus = getStockStatus(product.stock);
                    return (
                      <tr key={product.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center overflow-hidden">
                              {product.main_image_url ? (
                                <img
                                  src={product.main_image_url}
                                  alt={product.name}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                  }}
                                />
                              ) : (
                                <Package className="w-6 h-6 text-gray-400" />
                              )}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <p className="font-medium text-gray-900">{product.name}</p>
                                {product.is_featured && (
                                  <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                                )}
                              </div>
                              <p className="text-sm text-gray-500 line-clamp-1 max-w-xs">
                                {product.description}
                              </p>
                              {product.sku && (
                                <p className="text-xs text-gray-400">SKU: {product.sku}</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-gray-700">
                            {product.category_name}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-left">
                            <p className="font-bold text-verde-bosque">
                              {formatCurrency(product.price)}
                            </p>
                            {product.discount_price && (
                              <p className="text-sm text-gray-500 line-through">
                                {formatCurrency(product.discount_price)}
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-medium">{product.stock} {product.unit}</p>
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${stockStatus.color}`}>
                              {stockStatus.status}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-2">
                            <button
                              onClick={() => {
                                console.log('🖱️ Toggle status button clicked:', {
                                  productId: product.id,
                                  currentStatus: product.is_active,
                                  productName: product.name
                                });
                                toggleProductStatus(product.id, product.is_active);
                              }}
                              disabled={togglingProductId === product.id}
                              className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                                product.is_active
                                  ? 'bg-green-100 text-green-800 hover:bg-green-200'
                                  : 'bg-red-100 text-red-800 hover:bg-red-200'
                              } disabled:opacity-50`}
                            >
                              {togglingProductId === product.id ? (
                                <div className="animate-spin rounded-full h-3 w-3 border-2 border-current border-t-transparent"></div>
                              ) : product.is_active ? (
                                <>
                                  <Eye className="w-3 h-3" />
                                  Activo
                                </>
                              ) : (
                                <>
                                  <EyeOff className="w-3 h-3" />
                                  Inactivo
                                </>
                              )}
                            </button>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            <button
                              onClick={() => toggleFeaturedStatus(product.id, product.is_featured)}
                              disabled={togglingProductId === product.id}
                              className={`p-2 rounded-lg transition-colors ${
                                product.is_featured
                                  ? 'text-yellow-600 hover:text-yellow-800 bg-yellow-50'
                                  : 'text-gray-400 hover:text-yellow-600 bg-gray-50'
                              } disabled:opacity-50`}
                              title={product.is_featured ? 'Quitar de destacados' : 'Marcar como destacado'}
                            >
                              {togglingProductId === product.id ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent"></div>
                              ) : (
                                <Star className={`w-4 h-4 ${product.is_featured ? 'fill-current' : ''}`} />
                              )}
                            </button>
                            <button
                              onClick={() => openEditModal(product)}
                              className="p-2 text-blue-600 hover:text-blue-800 bg-blue-50 rounded-lg transition-colors"
                              title="Editar producto"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => confirmDelete(product.id)}
                              disabled={deletingProductId === product.id}
                              className="p-2 text-red-600 hover:text-red-800 bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                              title="Eliminar producto"
                            >
                              {deletingProductId === product.id ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-2 border-red-600 border-t-transparent"></div>
                              ) : (
                                <Trash2 className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <Trash2 className="w-6 h-6 text-red-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Confirmar Eliminación</h3>
              </div>

              <p className="text-gray-600 mb-6">
                ¿Estás seguro de que quieres eliminar este producto? Esta acción no se puede deshacer y se eliminarán todas las variantes y datos asociados.
              </p>

              <div className="flex gap-3 justify-end">
                <button
                  onClick={cancelDelete}
                  disabled={deletingProductId !== null}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={deleteProduct}
                  disabled={deletingProductId !== null}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg disabled:opacity-50 flex items-center gap-2"
                >
                  {deletingProductId ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      Eliminando...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      Eliminar Producto
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Product Modal - Temporarily disabled */}
        {/* <ProductModal
          isOpen={showCreateModal}
          onClose={closeModal}
          onSave={saveProduct}
          editingProduct={editingProduct}
          categories={categories}
          loading={savingProduct}
        /> */}
      </div>
    </div>
  );
}