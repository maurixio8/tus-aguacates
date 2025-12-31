'use client';

import { useEffect, useState, useRef } from 'react';
import {
  Search,
  Edit,
  Eye,
  EyeOff,
  Filter,
  Package,
  X,
  Save,
  ImageIcon,
  Building2,
  DollarSign,
  Percent,
  RefreshCw,
  Loader2,
  Camera,
  Upload,
  Tag,
  Plus
} from 'lucide-react';

interface B2BProduct {
  id: string;
  product_slug: string;
  name: string;
  display_name?: string;
  description?: string;
  tier1_price: number;
  tier2_price: number;
  tier3_price: number;
  min_quantity: number;
  max_quantity?: number;
  is_active: boolean;
  main_image_url?: string;
  b2b_category?: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const B2B_CATEGORIES = [
  { value: 'frutas', label: 'Frutas' },
  { value: 'verduras', label: 'Verduras' },
  { value: 'aguacates', label: 'Aguacates' },
  { value: 'organicos', label: 'Orgánicos' },
  { value: 'combos', label: 'Combos Empresariales' },
  { value: 'general', label: 'General' }
];

export default function B2BProductsPage() {
  const [products, setProducts] = useState<B2BProduct[]>([]);
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

  // Image upload state
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [selectedProductForImage, setSelectedProductForImage] = useState<string | null>(null);
  const [uploadStep, setUploadStep] = useState<'select' | 'optimizing' | 'review'>('select');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);
  const [uploadStats, setUploadStats] = useState<{ originalSize: number; newSize: number; width: number; format: string } | null>(null);
  const [finalImageUrl, setFinalImageUrl] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadProducts();
    }, 300);
    return () => clearTimeout(timer);
  }, [search, selectedCategory, status, pagination.page]);

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
          tier1_price: editingProduct.tier1_price,
          tier2_price: editingProduct.tier2_price,
          tier3_price: editingProduct.tier3_price,
          min_quantity: editingProduct.min_quantity,
          max_quantity: editingProduct.max_quantity,
          is_active: editingProduct.is_active,
          display_name: editingProduct.display_name,
          description: editingProduct.description,
          b2b_category: editingProduct.b2b_category,
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
    if (!confirm('¿Deseas sincronizar todos los precios B2B?')) return;

    setSyncingPrices(true);
    try {
      const response = await fetch('/api/admin/empresas/products/sync-prices', {
        method: 'POST',
        credentials: 'include',
      });

      const data = await response.json();

      if (data.success) {
        showToast(`${data.updated || 0} productos actualizados`, 'success');
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

  // Image upload handlers
  const handleQuickImageUpload = (productId: string) => {
    setSelectedProductForImage(productId);
    setUploadModalOpen(true);
    setUploadStep('select');
    setSelectedFile(null);
    setUploadPreview(null);
    setUploadStats(null);
    setFinalImageUrl(null);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Por favor selecciona una imagen válida', 'error');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast('La imagen es muy grande. Máximo 5MB', 'error');
      return;
    }

    setSelectedFile(file);
    setUploadPreview(URL.createObjectURL(file));
    setUploadStep('select');
  };

  const handleOptimize = async () => {
    if (!selectedFile || !selectedProductForImage) return;

    setUploadStep('optimizing');
    setUploadingImage(selectedProductForImage);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('productId', `b2b-${selectedProductForImage}`);

      const response = await fetch('/api/admin/upload-image', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.error || 'Error al optimizar');

      if (data.success && data.imageUrl) {
        setFinalImageUrl(data.imageUrl);
        setUploadStats(data.stats || {
          originalSize: selectedFile.size,
          newSize: 0,
          width: 0,
          format: 'webp'
        });
        setUploadStep('review');
      }
    } catch (error: any) {
      console.error('Error optimizando:', error);
      showToast(error.message, 'error');
      setUploadStep('select');
    } finally {
      setUploadingImage(null);
    }
  };

  const handleConfirmAssignment = async () => {
    if (!finalImageUrl || !selectedProductForImage) return;

    setSaving(true);
    try {
      const patchResponse = await fetch(`/api/admin/empresas/products/${selectedProductForImage}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ image_url: finalImageUrl }),
      });

      const patchData = await patchResponse.json();

      if (patchResponse.ok && patchData.success) {
        showToast('Imagen asignada correctamente', 'success');

        // Update local state
        setProducts(prev => prev.map(p =>
          p.id === selectedProductForImage
            ? { ...p, main_image_url: finalImageUrl }
            : p
        ));

        closeUploadModal();
      } else {
        showToast(patchData.error || 'Error al asignar la imagen', 'error');
      }
    } catch (error) {
      console.error('Error asignando:', error);
      showToast('Error de conexión', 'error');
    } finally {
      setSaving(false);
    }
  };

  const closeUploadModal = () => {
    setUploadModalOpen(false);
    setSelectedFile(null);
    setUploadPreview(null);
    setFinalImageUrl(null);
    setSelectedProductForImage(null);
    setUploadStats(null);
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

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Image Upload Modal */}
      {uploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
            {/* Header */}
            <div className="bg-blue-50 border-b border-blue-100 px-4 md:px-6 py-4 flex items-center justify-between">
              <h3 className="text-base md:text-lg font-bold text-gray-900">
                {uploadStep === 'select' && '1. Seleccionar Imagen'}
                {uploadStep === 'optimizing' && '2. Optimizando...'}
                {uploadStep === 'review' && '3. Confirmar Imagen'}
              </h3>
              <button onClick={closeUploadModal} className="text-gray-400 hover:text-gray-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-4 md:p-6">
              {/* Step 1: Select */}
              {uploadStep === 'select' && (
                <div className="space-y-4">
                  <div
                    className="border-2 border-dashed border-blue-300 rounded-xl p-6 md:p-8 flex flex-col items-center justify-center cursor-pointer hover:bg-blue-50 transition-colors"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {uploadPreview ? (
                      <img src={uploadPreview} alt="Preview" className="h-36 md:h-48 object-contain rounded-lg shadow-sm" />
                    ) : (
                      <>
                        <div className="w-14 h-14 md:w-16 md:h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                          <Upload className="w-7 h-7 md:w-8 md:h-8 text-blue-600" />
                        </div>
                        <p className="text-gray-600 font-medium text-center">Toca para seleccionar imagen</p>
                        <p className="text-xs text-gray-400 mt-1">JPG, PNG, WebP (Max 5MB)</p>
                      </>
                    )}
                  </div>

                  {uploadPreview && (
                    <button
                      onClick={handleOptimize}
                      className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg shadow-blue-200 transition-all"
                    >
                      Optimizar e Inspeccionar
                    </button>
                  )}
                </div>
              )}

              {/* Step 2: Optimizing */}
              {uploadStep === 'optimizing' && (
                <div className="py-10 md:py-12 flex flex-col items-center text-center">
                  <Loader2 className="w-14 h-14 md:w-16 md:h-16 text-blue-500 animate-spin mb-4" />
                  <h4 className="text-lg md:text-xl font-bold text-gray-800">Procesando Imagen...</h4>
                  <p className="text-gray-500 mt-2 text-sm">Redimensionando a 1200px y convirtiendo a WebP</p>
                </div>
              )}

              {/* Step 3: Review */}
              {uploadStep === 'review' && uploadStats && finalImageUrl && (
                <div className="space-y-4 md:space-y-6">
                  {/* Comparison */}
                  <div className="grid grid-cols-2 gap-4 bg-gray-50 p-3 md:p-4 rounded-xl border border-gray-200">
                    <div className="text-center p-2 border-r border-gray-200">
                      <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Original</p>
                      <p className="text-base md:text-lg font-bold text-gray-700">{(uploadStats.originalSize / 1024).toFixed(1)} KB</p>
                    </div>
                    <div className="text-center p-2">
                      <p className="text-xs text-blue-600 uppercase tracking-wider mb-1 font-bold">Optimizado</p>
                      <p className="text-xl md:text-2xl font-black text-blue-600">{(uploadStats.newSize / 1024).toFixed(1)} KB</p>
                      <span className="inline-block px-2 py-0.5 bg-blue-100 text-blue-800 text-[10px] rounded-full mt-1">
                        Ahorro: {Math.round((1 - uploadStats.newSize / uploadStats.originalSize) * 100)}%
                      </span>
                    </div>
                  </div>

                  {/* Technical Details */}
                  <div className="text-xs text-gray-500 flex justify-between px-2">
                    <span>Formato: <strong className="text-gray-700 uppercase">{uploadStats.format}</strong></span>
                    <span>Ancho: <strong className="text-gray-700">{uploadStats.width}px</strong></span>
                  </div>

                  {/* Final Image */}
                  <div className="relative rounded-xl overflow-hidden border border-gray-200 shadow-sm">
                    <img src={finalImageUrl} alt="Final" className="w-full h-40 md:h-48 object-cover" />
                    <div className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded backdrop-blur-sm">
                      Vista Previa
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <button
                      onClick={() => setUploadStep('select')}
                      className="py-2.5 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
                    >
                      Descartar
                    </button>
                    <button
                      onClick={handleConfirmAssignment}
                      disabled={saving}
                      className="py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-md shadow-blue-200 transition-all flex items-center justify-center gap-2"
                    >
                      {saving ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Asignando...
                        </>
                      ) : (
                        'Confirmar'
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept="image/*"
        className="hidden"
      />

      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
            <Package className="w-5 h-5 md:w-6 md:h-6 text-white" />
          </div>
          <div className="min-w-0">
            <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900">Productos B2B</h1>
            <p className="text-sm md:text-base text-gray-600 mt-0.5">Gestiona el catálogo mayorista</p>
          </div>
        </div>

        <button
          onClick={handleSyncPrices}
          disabled={syncingPrices}
          className="w-full md:w-auto px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
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
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 md:p-4 flex items-start gap-3">
        <Building2 className="w-5 h-5 md:w-6 md:h-6 text-blue-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-medium text-blue-900 text-sm md:text-base">Catálogo B2B</p>
          <p className="text-xs md:text-sm text-blue-700 mt-1">
            Gestiona productos, imágenes y precios por volumen para clientes empresariales.
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 md:p-4 lg:p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 md:gap-4">
          {/* Search */}
          <div className="sm:col-span-2">
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
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-base"
              />
            </div>
          </div>

          {/* Category */}
          <div>
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setPagination(prev => ({ ...prev, page: 1 }));
              }}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white text-base"
            >
              <option value="">Todas las categorías</option>
              {B2B_CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          {/* Status */}
          <div>
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPagination(prev => ({ ...prev, page: 1 }));
              }}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white text-base"
            >
              <option value="">Todos los estados</option>
              <option value="active">Activos</option>
              <option value="inactive">Inactivos</option>
            </select>
          </div>

          {/* Clear Filters */}
          <button
            onClick={clearFilters}
            className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <Filter className="w-5 h-5" />
            <span className="hidden sm:inline">Limpiar</span>
          </button>
        </div>
      </div>

      {/* Products List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 md:h-12 md:w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-12 px-4">
            <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No se encontraron productos B2B</p>
            <p className="text-sm text-gray-400 mt-1">Intenta ajustar los filtros</p>
          </div>
        ) : (
          <>
            {/* Mobile Card View */}
            <div className="md:hidden divide-y divide-gray-200">
              {products.map((product) => (
                <div key={product.id} className="p-4">
                  <div className="flex items-start gap-3">
                    {/* Product Image with Upload */}
                    <div className="relative group flex-shrink-0">
                      {product.main_image_url ? (
                        <img
                          src={product.main_image_url}
                          alt={product.name}
                          className="w-16 h-16 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center">
                          <ImageIcon className="w-6 h-6 text-gray-400" />
                        </div>
                      )}
                      <button
                        onClick={() => handleQuickImageUpload(product.id)}
                        className="absolute inset-0 bg-black/50 rounded-lg opacity-0 active:opacity-100 transition-opacity flex items-center justify-center"
                      >
                        <Camera className="w-5 h-5 text-white" />
                      </button>
                    </div>

                    {/* Product Info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 truncate">{product.display_name || product.name}</p>
                      {product.b2b_category && (
                        <span className="inline-block mt-1 px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs">
                          {B2B_CATEGORIES.find(c => c.value === product.b2b_category)?.label || product.b2b_category}
                        </span>
                      )}
                      <div className="mt-2 grid grid-cols-3 gap-2 text-center">
                        <div className="bg-gray-50 rounded p-1.5">
                          <p className="text-[10px] text-gray-500">Tier 1</p>
                          <p className="text-xs font-bold text-blue-600">{formatCurrency(product.tier1_price)}</p>
                        </div>
                        <div className="bg-gray-50 rounded p-1.5">
                          <p className="text-[10px] text-gray-500">Tier 2</p>
                          <p className="text-xs font-bold text-blue-600">{formatCurrency(product.tier2_price)}</p>
                        </div>
                        <div className="bg-gray-50 rounded p-1.5">
                          <p className="text-[10px] text-gray-500">Tier 3</p>
                          <p className="text-xs font-bold text-blue-600">{formatCurrency(product.tier3_price)}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-3 flex items-center justify-between">
                    <button
                      onClick={() => handleToggleActive(product.id, product.is_active)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${product.is_active
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {product.is_active ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                      {product.is_active ? 'Activo' : 'Inactivo'}
                    </button>
                    <button
                      onClick={() => setEditingProduct(product)}
                      className="px-4 py-1.5 text-blue-600 bg-blue-50 rounded-lg text-sm font-medium"
                    >
                      Editar
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 lg:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                      Producto
                    </th>
                    <th className="px-4 lg:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                      Categoría
                    </th>
                    <th className="px-4 lg:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                      Tier 1
                    </th>
                    <th className="px-4 lg:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase hidden lg:table-cell">
                      Tier 2
                    </th>
                    <th className="px-4 lg:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase hidden lg:table-cell">
                      Tier 3
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
                    <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 lg:px-6 py-4">
                        <div className="flex items-center gap-3">
                          {/* Image with upload overlay */}
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
                            <button
                              onClick={() => handleQuickImageUpload(product.id)}
                              disabled={uploadingImage === product.id}
                              className="absolute inset-0 bg-black/50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                              title="Subir imagen"
                            >
                              {uploadingImage === product.id ? (
                                <Loader2 className="w-5 h-5 text-white animate-spin" />
                              ) : (
                                <Camera className="w-5 h-5 text-white" />
                              )}
                            </button>
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-gray-900 truncate">{product.display_name || product.name}</p>
                            <p className="text-xs text-gray-500">Min: {product.min_quantity} uds</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 lg:px-6 py-4">
                        {product.b2b_category ? (
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                            {B2B_CATEGORIES.find(c => c.value === product.b2b_category)?.label || product.b2b_category}
                          </span>
                        ) : (
                          <span className="text-gray-400 text-xs">Sin categoría</span>
                        )}
                      </td>
                      <td className="px-4 lg:px-6 py-4">
                        <span className="font-bold text-blue-600">
                          {formatCurrency(product.tier1_price)}
                        </span>
                      </td>
                      <td className="px-4 lg:px-6 py-4 hidden lg:table-cell">
                        <span className="font-medium text-blue-600">
                          {formatCurrency(product.tier2_price)}
                        </span>
                      </td>
                      <td className="px-4 lg:px-6 py-4 hidden lg:table-cell">
                        <span className="font-medium text-blue-600">
                          {formatCurrency(product.tier3_price)}
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
                              Activo
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

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="px-4 md:px-6 py-4 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3">
                <p className="text-sm text-gray-600 text-center sm:text-left">
                  {((pagination.page - 1) * pagination.limit) + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} de {pagination.total}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                    disabled={pagination.page === 1}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 text-sm"
                  >
                    Anterior
                  </button>
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, page: Math.min(prev.totalPages, prev.page + 1) }))}
                    disabled={pagination.page === pagination.totalPages}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 text-sm"
                  >
                    Siguiente
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Edit Modal */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-t-2xl md:rounded-xl shadow-xl w-full md:max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-4 md:px-6 py-4 flex items-center justify-between z-10">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-blue-600" />
                Editar Producto B2B
              </h3>
              <button
                onClick={() => setEditingProduct(null)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 md:p-6 space-y-5">
              {/* Product Info */}
              <div className="flex items-center gap-4 p-3 md:p-4 bg-gray-50 rounded-xl">
                {editingProduct.main_image_url ? (
                  <img
                    src={editingProduct.main_image_url}
                    alt={editingProduct.name}
                    className="w-14 h-14 md:w-16 md:h-16 rounded-lg object-cover"
                  />
                ) : (
                  <div className="w-14 h-14 md:w-16 md:h-16 rounded-lg bg-gray-200 flex items-center justify-center">
                    <ImageIcon className="w-7 h-7 md:w-8 md:h-8 text-gray-400" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-gray-900 truncate">{editingProduct.name}</p>
                  <p className="text-sm text-gray-500 truncate">{editingProduct.product_slug}</p>
                </div>
              </div>

              {/* Display Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre de Visualización B2B
                </label>
                <input
                  type="text"
                  value={editingProduct.display_name || ''}
                  onChange={(e) => setEditingProduct({ ...editingProduct, display_name: e.target.value })}
                  placeholder={editingProduct.name}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>

              {/* Tier Prices */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700 flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-blue-600" />
                  Precios por Volumen
                </label>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Tier 1</label>
                    <input
                      type="number"
                      value={editingProduct.tier1_price}
                      onChange={(e) => setEditingProduct({ ...editingProduct, tier1_price: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Tier 2</label>
                    <input
                      type="number"
                      value={editingProduct.tier2_price}
                      onChange={(e) => setEditingProduct({ ...editingProduct, tier2_price: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Tier 3</label>
                    <input
                      type="number"
                      value={editingProduct.tier3_price}
                      onChange={(e) => setEditingProduct({ ...editingProduct, tier3_price: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                      min="0"
                    />
                  </div>
                </div>
              </div>

              {/* Quantities */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cantidad Mínima
                  </label>
                  <input
                    type="number"
                    value={editingProduct.min_quantity}
                    onChange={(e) => setEditingProduct({ ...editingProduct, min_quantity: parseInt(e.target.value) || 1 })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    min="1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cantidad Máxima
                  </label>
                  <input
                    type="number"
                    value={editingProduct.max_quantity || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, max_quantity: parseInt(e.target.value) || undefined })}
                    placeholder="Sin límite"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    min="1"
                  />
                </div>
              </div>

              {/* B2B Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <Tag className="w-4 h-4 text-blue-600" />
                  Categoría B2B
                </label>
                <select
                  value={editingProduct.b2b_category || ''}
                  onChange={(e) => setEditingProduct({ ...editingProduct, b2b_category: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white"
                >
                  <option value="">Sin categoría</option>
                  {B2B_CATEGORIES.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status */}
              <div className="flex items-center gap-3 pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingProduct.is_active}
                    onChange={(e) => setEditingProduct({ ...editingProduct, is_active: e.target.checked })}
                    className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Activo en catálogo B2B</span>
                </label>
              </div>
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-4 md:px-6 py-4 flex gap-3">
              <button
                onClick={() => setEditingProduct(null)}
                className="flex-1 md:flex-none px-4 py-2.5 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveProduct}
                disabled={saving}
                className="flex-1 md:flex-none px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors flex items-center justify-center gap-2 font-medium"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Guardar
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div className={`fixed bottom-20 md:top-4 md:bottom-auto right-4 left-4 md:left-auto z-50 px-4 py-3 rounded-lg shadow-lg text-white flex items-center justify-center md:justify-start gap-2 ${
          toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'
        }`}>
          {toast.type === 'success' ? (
            <div className="w-5 h-5 bg-white rounded-full flex items-center justify-center">
              <svg className="w-3 h-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path>
              </svg>
            </div>
          ) : (
            <div className="w-5 h-5 bg-white rounded-full flex items-center justify-center">
              <svg className="w-3 h-3 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </div>
          )}
          <span className="font-medium">{toast.message}</span>
        </div>
      )}
    </div>
  );
}
