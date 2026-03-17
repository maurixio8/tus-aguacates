'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Search,
  Edit,
  Eye,
  EyeOff,
  Filter,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Package,
  X,
  Save,
  ImageIcon,
  Layers,
  Camera,
  Upload,
  Loader2,
  Trash2,
  Plus,
  Star
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
}

interface Product {
  id: string;
  numeric_id?: number; // Nuevo ID secuencial
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
  const searchParams = useSearchParams();
  const [initialLoadDone, setInitialLoadDone] = useState(false);
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

  // New Image Audit State
  const [uploadModalOpen, setUploadModalOpen] = useState(false);

  // Estado para el producto que está actualizando su categoría
  const [updatingCategory, setUpdatingCategory] = useState<string | null>(null);
  const [uploadStep, setUploadStep] = useState<'select' | 'optimizing' | 'review'>('select');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);
  const [uploadStats, setUploadStats] = useState<{ originalSize: number; newSize: number; width: number; format: string } | null>(null);
  const [finalImageUrl, setFinalImageUrl] = useState<string | null>(null);
  const [finalFileName, setFinalFileName] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Variant editing state
  const [editingVariant, setEditingVariant] = useState<{ productId: string; variantId: string; data: ProductVariant } | null>(null);
  const [savingVariant, setSavingVariant] = useState(false);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleNumericInputFocus = (event: React.FocusEvent<HTMLInputElement>) => {
    requestAnimationFrame(() => {
      event.currentTarget.select();
    });
  };

  const handleNumericInputMouseUp = (event: React.MouseEvent<HTMLInputElement>) => {
    event.preventDefault();
  };

  useEffect(() => {
    console.log('🚀 [ProductsPage] Component mounted, loading categories...');
    loadCategories();
  }, []);

  // Manejar searchParams al cargar (deep linking)
  useEffect(() => {
    if (!searchParams || initialLoadDone) return;

    const querySearch = searchParams.get('search');
    const editId = searchParams.get('edit');

    if (querySearch) {
      setSearch(querySearch);
    }

    if (editId) {
      console.log('🔗 [ProductsPage] Found edit ID:', editId);
      // Fetch directo para editar
      fetch(`/api/admin/products/${editId}?_t=${Date.now()}`, {
        credentials: 'include',
        headers: { 'Pragma': 'no-cache' }
      })
        .then(res => res.json())
        .then(data => {
          if (data.success && data.data) {
            setEditingProduct(data.data);
            // También abrir el modal de edición si es necesario (el código de edición parece usar editingProduct para mostrar el modal)
          } else {
            showToast('No se pudo cargar el producto para editar', 'error');
          }
        })
        .catch(err => console.error('Error fetching product for edit:', err));
    }

    setInitialLoadDone(true);
  }, [searchParams, initialLoadDone]);

  // También cargar categorías cuando el componente se enfoca (para asegurar carga en cliente)
  useEffect(() => {
    const handleFocus = () => {
      console.log('🎯 [ProductsPage] Window focused, checking categories...');
      if (categories.length === 0 && !loadingCategories) {
        console.log('🔄 [ProductsPage] No categories loaded, retrying...');
        loadCategories();
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [categories.length, loadingCategories]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadProducts();
    }, 300);
    return () => clearTimeout(timer);
  }, [search, selectedCategory, status, pagination.page]);

  const loadCategories = async () => {
    console.log('🔄 [Categories] Starting to load categories...');
    try {
      console.log('📡 [Categories] Making request to /api/categories');
      const response = await fetch('/api/categories', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });
      console.log('📊 [Categories] Response status:', response.status);
      console.log('📊 [Categories] Response ok:', response.ok);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('📦 [Categories] Response data:', data);

      if (data.success || Array.isArray(data)) {
        const categoriesData = data.categories || data || [];
        console.log('✅ [Categories] Categories loaded successfully:', categoriesData.length, 'categories');
        setCategories(categoriesData);
      } else {
        console.error('❌ [Categories] Invalid response format:', data);
        // Fallback: intentar usar los datos directamente si vienen en un formato inesperado
        if (Array.isArray(data)) {
          console.log('🔄 [Categories] Using fallback for array data');
          setCategories(data);
        }
      }
    } catch (error) {
      console.error('❌ [Categories] Error cargando categorías:', error);
      // Set categories vacío para evitar que el componente se quede cargando
      setCategories([]);
    } finally {
      console.log('🏁 [Categories] Loading categories completed');
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
      // Add timestamp to prevent caching
      const response = await fetch(`/api/admin/products?page=${pagination.page}&limit=${pagination.limit}&search=${search}&category=${selectedCategory}&status=${status}&_t=${Date.now()}`, {
        credentials: 'include',
        cache: 'no-store',
        headers: {
          'Pragma': 'no-cache',
          'Cache-Control': 'no-cache, no-store, must-revalidate'
        }
      });
      const data = await response.json();

      if (data.success) {
        setProducts(data.data || []);

        // Debug Logging: Check if specific product has image
        if (selectedProductForImage) {
          const listVersion = data.data.find((p: Product) => p.id === selectedProductForImage);

          console.log(`🔍 [AdminDebug] Comparing Data Sources for ID: ${selectedProductForImage}`);
          console.log(`📦 [List API] Timestamp: ${listVersion?.updated_at}, Image: ${listVersion?.main_image_url}`);

          // Direct Fetch to bypass List Cache - FIX: Add credentials
          fetch(`/api/admin/products/${selectedProductForImage}?_t=${Date.now()}`, {
            headers: { 'Pragma': 'no-cache' },
            credentials: 'include'
          })
            .then(res => res.json())
            .then(directData => {
              const directProd = directData.data;
              console.log(`🎯 [Direct API] Timestamp: ${directProd?.updated_at}, Image: ${directProd?.main_image_url}`);

              if (listVersion?.updated_at !== directProd?.updated_at) {
                console.error('⚠️ DATA MISMATCH: List API is serving stale data!');
              }
            })
            .catch(err => console.error('Direct fetch failed', err));
        }

        setPagination(prev => ({
          ...prev,
          total: data.pagination.total,
          totalPages: data.pagination.totalPages
        }));
      } else {
        showToast('Error al cargar productos', 'error');
      }
    } catch (error) {
      console.error('Error cargando productos:', error);
      showToast('Error de conexión', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Smart Refresh: Reload single product to bypass stale list cache
  const refreshProduct = async (productId: string) => {
    try {
      console.log(`🔄 Smart Refresh: Fetching fresh data for ${productId}...`);
      const response = await fetch(`/api/admin/products/${productId}?_t=${Date.now()}`, {
        headers: { 'Pragma': 'no-cache' },
        credentials: 'include'
      });
      const data = await response.json();

      if (data.success && data.data) {
        console.log('✅ Smart Refresh Success. Payload:', {
          id: data.data.id,
          updated_at: data.data.updated_at,
          main_image_url: data.data.main_image_url
        });
        setProducts(prev => prev.map(p =>
          p.id === productId ? data.data : p
        ));
      } else {
        console.error('❌ Smart Refresh Failed:', data);
      }
    } catch (e) {
      console.error('❌ Smart Refresh Error:', e);
    }
  };

  const handleToggleActive = async (productId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/admin/products/${productId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ is_active: !currentStatus }),
      });

      const data = await response.json();

      if (data.success) {
        setProducts(prev => prev.map(p =>
          p.id === productId ? { ...p, is_active: !currentStatus } : p
        ));
        showToast(!currentStatus ? 'Producto activado' : 'Producto desactivado', 'success');
      } else {
        showToast(data.error || 'Error al actualizar', 'error');
      }
    } catch (error) {
      console.error('Error actualizando estado:', error);
      showToast('Error de conexión', 'error');
    }
  };

  const handleToggleFeatured = async (productId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/admin/products/${productId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ is_featured: !currentStatus }),
      });

      const data = await response.json();

      if (data.success) {
        setProducts(prev => prev.map(p =>
          p.id === productId ? { ...p, is_featured: !currentStatus } : p
        ));
        showToast(!currentStatus ? 'Marcado como destacado' : 'Removido de destacados', 'success');
      } else {
        showToast(data.error || 'Error al actualizar destacado', 'error');
      }
    } catch (error) {
      console.error('Error actualizando destacado:', error);
      showToast('Error de conexión', 'error');
    }
  };

  const handleSaveProduct = async () => {
    if (!editingProduct) return;
    setSaving(true);

    const payload = {
      name: editingProduct.name,
      description: editingProduct.description,
      price: Number(editingProduct.price),
      discount_price: editingProduct.discount_price ? Number(editingProduct.discount_price) : null,
      stock: Number(editingProduct.stock),
      is_active: editingProduct.is_active,
      is_featured: editingProduct.is_featured,
      main_image_url: editingProduct.main_image_url,
      category_id: editingProduct.category_id,
      variants: editingProduct.variants || editingProduct.product_variants || [],
      unit: editingProduct.unit || 'unidad',
    };



    console.log('📤 [SaveProduct] Sending payload:', payload);
    console.log('📤 [SaveProduct] Product ID:', editingProduct.id);

    try {
      // Determinar si es creación o actualización
      const isEdit = !!editingProduct.id;
      const endpoint = isEdit
        ? `/api/admin/products/${editingProduct.id}`
        : '/api/admin/products';

      const method = isEdit ? 'PATCH' : 'POST';

      const response = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      console.log('📥 [SaveProduct] Response:', {
        status: response.status,
        ok: response.ok,
        success: data.success,
        data: data.data,
        error: data.error,
        method,
        endpoint
      });

      if (data.success) {
        // Verify price was actually saved
        if (data.data && data.data.price !== payload.price) {
          console.error('⚠️ [SaveProduct] PRICE MISMATCH! Sent:', payload.price, 'Received:', data.data.price);
          showToast('⚠️ El precio no se guardó correctamente', 'error');
        } else {
          showToast(isEdit ? 'Producto actualizado correctamente' : 'Producto creado correctamente', 'success');
        }
        setEditingProduct(null);
        loadProducts();
      } else {
        showToast(data.error || 'Error al guardar', 'error');
      }
    } catch (error) {
      console.error('Error guardando producto:', error);
      showToast('Error al guardar el producto', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este producto?')) return;

    try {
      const response = await fetch(`/api/admin/products/${productId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        showToast('Producto eliminado correctamente', 'success');
        loadProducts();
      } else {
        const data = await response.json();
        alert(data.error || 'Error al eliminar el producto');
      }
    } catch (error) {
      console.error('Error eliminando producto:', error);
      alert('Error al eliminar el producto');
    }
  };

  const handleUpdateCategory = async (productId: string, categoryId: string) => {
    try {
      const response = await fetch(`/api/admin/products/${productId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ category_id: categoryId }),
      });

      const data = await response.json();

      if (data.success) {
        // Actualizar el producto localmente para evitar recargar la página
        setProducts(prev => prev.map(p =>
          p.id === productId
            ? {
              ...p,
              category_id: categoryId,
              category_name: categories.find(c => c.id === categoryId)?.name || 'Sin categoría'
            }
            : p
        ));
        showToast('Categoría actualizada correctamente', 'success');
      } else {
        showToast(data.error || 'Error al actualizar la categoría', 'error');
      }
    } catch (error) {
      console.error('Error actualizando categoría:', error);
      showToast('Error de conexión', 'error');
    } finally {
      setUpdatingCategory(null);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(value);
  };

  // Funciones para gestionar variantes en el estado local de edición
  const addVariantToProduct = () => {
    if (!editingProduct) return;
    const currentVariants = editingProduct.variants || editingProduct.product_variants || [];
    const newVariant: ProductVariant = {
      id: '',
      variant_name: 'Presentacion',
      variant_value: '',
      price: editingProduct.price,
      stock_quantity: 0,
      is_active: true
    };

    setEditingProduct({
      ...editingProduct,
      variants: [...currentVariants, newVariant],
      product_variants: [...currentVariants, newVariant]
    });
  };

  const removeVariantFromProduct = (index: number) => {
    if (!editingProduct) return;
    const currentVariants = [...(editingProduct.variants || editingProduct.product_variants || [])];
    currentVariants.splice(index, 1);

    setEditingProduct({
      ...editingProduct,
      variants: currentVariants,
      product_variants: currentVariants
    });
  };

  const updateVariantInProduct = (index: number, field: keyof ProductVariant, value: any) => {
    if (!editingProduct) return;
    const currentVariants = [...(editingProduct.variants || editingProduct.product_variants || [])];
    currentVariants[index] = { ...currentVariants[index], [field]: value };

    setEditingProduct({
      ...editingProduct,
      variants: currentVariants,
      product_variants: currentVariants
    });
  };


  // 1. Abrir modal
  const handleQuickImageUpload = (productId: string) => {
    setSelectedProductForImage(productId);
    setUploadModalOpen(true);
    setUploadStep('select');
    setSelectedFile(null);
    setUploadPreview(null);
    setUploadStats(null);
    setFinalImageUrl(null);
    setFinalFileName(null);
  };

  // 2. Seleccionar archivo local
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Por favor selecciona una imagen válida');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('La imagen es muy grande. Máximo 5MB');
      return;
    }

    setSelectedFile(file);
    setUploadPreview(URL.createObjectURL(file));
    setUploadStep('select');
  };

  // 3. Enviar a optimizar (servidor)
  const handleOptimize = async () => {
    if (!selectedFile || !selectedProductForImage) return;

    setUploadStep('optimizing');
    setUploadingImage(selectedProductForImage);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('productId', selectedProductForImage);

      const response = await fetch('/api/admin/upload-image', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.error || 'Error al optimizar');

      if (data.success && data.imageUrl) {
        setFinalImageUrl(data.imageUrl);
        setFinalFileName(data.fileName);
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

  // 4. Confirmar y Asignar
  const handleConfirmAssignment = async () => {
    if (!finalImageUrl || !selectedProductForImage) return;

    setSaving(true);
    try {
      console.log('📤 Sending PATCH with Image:', finalImageUrl);

      const patchResponse = await fetch(`/api/admin/products/${selectedProductForImage}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ main_image_url: finalImageUrl }),
      });

      const patchData = await patchResponse.json();

      console.log('📥 PATCH Response:', {
        status: patchResponse.status,
        ok: patchResponse.ok,
        data: patchData
      });

      // Strict validation: only consider success if API explicitly says success AND image matches
      if (patchResponse.ok && patchData.success && patchData.data?.main_image_url === finalImageUrl) {
        showToast('Imagen asignada correctamente al producto', 'success');

        // Update UI with confirmed data from server
        setProducts(prev => prev.map(p =>
          p.id === selectedProductForImage
            ? { ...p, main_image_url: patchData.data.main_image_url }
            : p
        ));

        // Capture ID before clearing state
        const productIdToRefresh = selectedProductForImage;

        // Cierra el modal y limpia
        closeUploadModal();

        // Recargar SOLO este producto para confirmar persistencia (bypass cache)
        if (productIdToRefresh) {
          setTimeout(() => {
            refreshProduct(productIdToRefresh);
          }, 1000);
        }
      } else {
        // Log detailed error for debugging
        console.error('❌ PATCH Failed:', {
          httpOk: patchResponse.ok,
          success: patchData.success,
          error: patchData.error,
          sentUrl: finalImageUrl,
          receivedUrl: patchData.data?.main_image_url,
          debug: patchData.debug
        });

        const errorMsg = patchData.error || patchData.debug?.sent !== patchData.debug?.received
          ? 'La imagen no se guardó en la base de datos. Revisa la consola del servidor.'
          : 'Error al asignar la imagen';
        showToast(errorMsg, 'error');
      }
    } catch (error) {
      console.error('Error asignando:', error);
      showToast('Error de conexión', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Crear nuevo producto
  const handleCreateProduct = () => {
    // Buscar una categoría por defecto (la primera disponible)
    const defaultCategoryId = categories.length > 0 ? categories[0].id : '';

    setEditingProduct({
      id: '',
      name: '',
      description: '',
      price: 0,
      discount_price: undefined,
      stock: 0,
      is_active: true,
      is_featured: false,
      main_image_url: '',
      category_id: selectedCategory || defaultCategoryId, // Asignar categoría por defecto
      unit: 'unidad',
      variants: [],
      hasVariants: false
    });
  };

  const closeUploadModal = () => {
    setUploadModalOpen(false);
    setSelectedFile(null);
    setUploadPreview(null);
    setFinalImageUrl(null);
    setSelectedProductForImage(null);
  };

  const clearFilters = () => {
    setSearch('');
    setSelectedCategory('');
    setStatus('');
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  // Variant editing functions
  const handleEditVariant = (productId: string, variant: ProductVariant) => {
    setEditingVariant({
      productId,
      variantId: variant.id,
      data: { ...variant }
    });
  };

  const handleCancelVariantEdit = () => {
    setEditingVariant(null);
  };

  const handleSaveVariant = async () => {
    if (!editingVariant) return;
    setSavingVariant(true);

    try {
      const response = await fetch(`/api/admin/variants/${editingVariant.variantId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          price: editingVariant.data.price,
          stock_quantity: editingVariant.data.stock_quantity,
          is_active: editingVariant.data.is_active
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Update the product's variants in the local state
        setProducts(prev => prev.map(p => {
          if (p.id === editingVariant.productId) {
            const updatedVariants = (p.variants || p.product_variants || []).map(v =>
              v.id === editingVariant.variantId ? data.data : v
            );
            return {
              ...p,
              variants: updatedVariants,
              product_variants: updatedVariants
            };
          }
          return p;
        }));

        showToast('Variante actualizada correctamente', 'success');
        setEditingVariant(null);
      } else {
        showToast(data.error || 'Error al guardar la variante', 'error');
      }
    } catch (error) {
      console.error('Error guardando variante:', error);
      showToast('Error de conexión', 'error');
    } finally {
      setSavingVariant(false);
    }
  };


  return (
    <div className="space-y-6">
      {/* Modal de Auditoría de Imagen */}
      {uploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
            {/* Header */}
            <div className="bg-gray-50 border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">
                {uploadStep === 'select' && '1. Seleccionar Imagen'}
                {uploadStep === 'optimizing' && '2. Optimizando...'}
                {uploadStep === 'review' && '3. Auditoría de Calidad'}
              </h3>
              <button onClick={closeUploadModal} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6">
              {/* Paso 1: Selección */}
              {uploadStep === 'select' && (
                <div className="space-y-4">
                  <div
                    className="border-2 border-dashed border-gray-300 rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {uploadPreview ? (
                      <img src={uploadPreview} alt="Preview" className="h-48 object-contain rounded-lg shadow-sm" />
                    ) : (
                      <>
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                          <Upload className="w-8 h-8 text-green-600" />
                        </div>
                        <p className="text-gray-600 font-medium">Clic para seleccionar imagen</p>
                        <p className="text-xs text-gray-400 mt-1">JPG, PNG, WebP (Max 5MB)</p>
                      </>
                    )}
                  </div>

                  {uploadPreview && (
                    <button
                      onClick={handleOptimize}
                      className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg shadow-blue-200 transition-all transform hover:scale-[1.02]"
                    >
                      ✨ Optimizar e Inspeccionar
                    </button>
                  )}
                </div>
              )}

              {/* Paso 2: Optimizando */}
              {uploadStep === 'optimizing' && (
                <div className="py-12 flex flex-col items-center text-center">
                  <Loader2 className="w-16 h-16 text-green-500 animate-spin mb-4" />
                  <h4 className="text-xl font-bold text-gray-800">Procesando Imagen...</h4>
                  <p className="text-gray-500 mt-2">Redmensionando a 1200px y convirtiendo a WebP</p>
                </div>
              )}

              {/* Paso 3: Revisión (Auditoría) */}
              {uploadStep === 'review' && uploadStats && finalImageUrl && (
                <div className="space-y-6">
                  {/* Comparativa */}
                  <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-200">
                    <div className="text-center p-2 border-r border-gray-200">
                      <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Original</p>
                      <p className="text-lg font-bold text-gray-700">{(uploadStats.originalSize / 1024).toFixed(1)} KB</p>
                    </div>
                    <div className="text-center p-2">
                      <p className="text-xs text-green-600 uppercase tracking-wider mb-1 font-bold">Optimizado</p>
                      <p className="text-2xl font-black text-green-600">{(uploadStats.newSize / 1024).toFixed(1)} KB</p>
                      <span className="inline-block px-2 py-0.5 bg-green-100 text-green-800 text-[10px] rounded-full mt-1">
                        Ahorro: {Math.round((1 - uploadStats.newSize / uploadStats.originalSize) * 100)}%
                      </span>
                    </div>
                  </div>

                  {/* Detalles Técnicos */}
                  <div className="text-xs text-gray-500 flex justify-between px-2">
                    <span>Formato: <strong className="text-gray-700 uppercase">{uploadStats.format}</strong></span>
                    <span>Ancho: <strong className="text-gray-700">{uploadStats.width}px</strong></span>
                  </div>

                  {/* Imagen Final */}
                  <div className="relative group rounded-xl overflow-hidden border border-gray-200 shadow-sm">
                    <img src={finalImageUrl} alt="Final" className="w-full h-48 object-cover" />
                    <div className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded backdrop-blur-sm">
                      Vista Previa Final
                    </div>
                  </div>

                  {/* Acciones */}
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
                      className="py-2.5 px-4 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold shadow-md shadow-green-200 transition-all transform hover:scale-[1.02] flex items-center justify-center gap-2"
                    >
                      {saving ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Asignando...
                        </>
                      ) : (
                        '✅ Confirmar y Asignar'
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Input oculto para subir imágenes */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept="image/*"
        className="hidden"
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

          {/* Crear Producto */}
          <button
            onClick={handleCreateProduct}
            className="px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2 font-medium shadow-sm hover:shadow-md"
          >
            <Plus className="w-5 h-5" />
            Crear Producto
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
                    <th className="px-4 lg:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase hidden sm:table-cell">
                      ID
                    </th>
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
                    <th className="px-4 lg:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase hidden sm:table-cell">
                      Estado
                    </th>
                    <th className="px-4 lg:px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase">
                      Destacado
                    </th>
                    <th className="px-4 lg:px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {products.map((product) => {
                    const variants = product.variants || product.product_variants || [];
                    const hasVariants = variants.length > 0;
                    const isExpanded = expandedProduct === product.id;

                    return (
                      <>
                        <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 lg:px-6 py-4 hidden sm:table-cell">
                            <span className="text-xs font-mono text-gray-500">
                              #{product.numeric_id || product.id.substring(0, 4)}
                            </span>
                          </td>
                          <td className="px-4 lg:px-6 py-4">
                            <div className="flex items-center gap-3">
                              {/* Expand button for products with variants */}
                              {hasVariants && (
                                <button
                                  onClick={() => setExpandedProduct(isExpanded ? null : product.id)}
                                  className="p-1 hover:bg-gray-200 rounded transition-colors"
                                  title={isExpanded ? "Ocultar variantes" : "Ver variantes"}
                                >
                                  {isExpanded ? (
                                    <ChevronUp className="w-4 h-4 text-gray-600" />
                                  ) : (
                                    <ChevronDown className="w-4 h-4 text-gray-600" />
                                  )}
                                </button>
                              )}

                              <div className="relative group flex-shrink-0">
                                {product.main_image_url ? (
                                  <img
                                    src={product.main_image_url}
                                    alt={product.name}
                                    className="w-10 h-10 lg:w-12 lg:h-12 rounded-lg object-cover"
                                  />
                                ) : (
                                  <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-lg bg-gray-100 flex items-center justify-center">
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
                                <p className="font-semibold text-gray-900 truncate text-sm lg:text-base">{product.name}</p>
                                <p className="text-xs text-gray-500 lg:hidden truncate">
                                  {categories.find(c => c.id === product.category_id)?.name}
                                </p>
                                {hasVariants && (
                                  <p className="text-xs text-blue-600 flex items-center gap-1">
                                    <Layers className="w-3 h-3" />
                                    {variants.length} variante(s)
                                  </p>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 lg:px-6 py-4 hidden md:table-cell">
                            {updatingCategory === product.id ? (
                              <div className="flex items-center gap-2">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
                                <span className="text-xs text-gray-500">Actualizando...</span>
                              </div>
                            ) : (
                              <select
                                value={product.category_id}
                                onChange={(e) => {
                                  setUpdatingCategory(product.id);
                                  handleUpdateCategory(product.id, e.target.value);
                                }}
                                className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200 focus:ring-2 focus:ring-green-500 focus:border-transparent cursor-pointer"
                              >
                                {categories.map((cat) => (
                                  <option key={cat.id} value={cat.id}>
                                    {cat.name}
                                  </option>
                                ))}
                              </select>
                            )}
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
                          <td className="px-4 lg:px-6 py-4 hidden sm:table-cell">
                            <button
                              onClick={() => handleToggleActive(product.id, product.is_active)}
                              className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium transition-colors ${product.is_active
                                ? 'bg-green-100 text-green-700 hover:bg-green-200'
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
                          <td className="px-4 lg:px-6 py-4 text-center">
                            <button
                              onClick={() => handleToggleFeatured(product.id, product.is_featured)}
                              className={`p-2 rounded-full transition-all duration-200 ${product.is_featured
                                ? 'bg-yellow-100 text-yellow-500 hover:bg-yellow-200 shadow-sm'
                                : 'bg-gray-50 text-gray-300 hover:text-gray-400 hover:bg-gray-100'
                                }`}
                              title={product.is_featured ? "Quitar de destacados" : "Marcar como destacado"}
                            >
                              <Star className={`w-5 h-5 ${product.is_featured ? 'fill-current' : ''}`} />
                            </button>
                          </td>
                          <td className="px-4 lg:px-6 py-4 text-right">
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => {
                                  setEditingProduct(product);
                                }}
                                className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                                title="Editar"
                              >
                                <Edit className="w-5 h-5" />
                              </button>
                              <button
                                onClick={() => handleDeleteProduct(product.id)}
                                className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                                title="Eliminar"
                              >
                                <Trash2 className="w-5 h-5" />
                              </button>
                            </div>
                          </td>
                        </tr>

                        {/* Expanded Variants Section */}
                        {isExpanded && hasVariants && (
                          <tr className="bg-gray-50">
                            <td colSpan={6} className="px-4 lg:px-6 py-4">
                              <div className="ml-12">
                                <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                                  <Layers className="w-4 h-4" />
                                  Variantes del Producto
                                </h4>
                                <div className="space-y-2">
                                  {variants.map((variant) => {
                                    const isEditing = editingVariant?.variantId === variant.id;
                                    const editData = isEditing ? editingVariant.data : variant;

                                    return (
                                      <div
                                        key={variant.id}
                                        className="bg-white rounded-lg border border-gray-200 p-4"
                                      >
                                        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
                                          {/* Variant Name */}
                                          <div>
                                            <label className="text-xs text-gray-500 block mb-1">Variante</label>
                                            <p className="font-medium text-gray-900">{variant.variant_value}</p>
                                          </div>

                                          {/* Price */}
                                          <div>
                                            <label className="text-xs text-gray-500 block mb-1">Precio</label>
                                            {isEditing ? (
                                              <input
                                                type="number"
                                                value={editData.price || 0}
                                                onChange={(e) => setEditingVariant({
                                                  ...editingVariant,
                                                  data: { ...editData, price: parseFloat(e.target.value) || 0 }
                                                })}
                                                onFocus={handleNumericInputFocus}
                                                onMouseUp={handleNumericInputMouseUp}
                                                className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                                min="0"
                                              />
                                            ) : (
                                              <p className="font-semibold text-gray-900">
                                                {formatCurrency(variant.price || 0)}
                                              </p>
                                            )}
                                          </div>

                                          {/* Stock */}
                                          <div>
                                            <label className="text-xs text-gray-500 block mb-1">Stock</label>
                                            {isEditing ? (
                                              <input
                                                type="number"
                                                value={editData.stock_quantity || 0}
                                                onChange={(e) => setEditingVariant({
                                                  ...editingVariant,
                                                  data: { ...editData, stock_quantity: parseInt(e.target.value) || 0 }
                                                })}
                                                onFocus={handleNumericInputFocus}
                                                onMouseUp={handleNumericInputMouseUp}
                                                className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                                min="0"
                                              />
                                            ) : (
                                              <p className={`font-medium ${(variant.stock_quantity || 0) < 10 ? 'text-red-600' : 'text-gray-900'}`}>
                                                {variant.stock_quantity || 0}
                                              </p>
                                            )}
                                          </div>

                                          {/* Status */}
                                          <div>
                                            <label className="text-xs text-gray-500 block mb-1">Estado</label>
                                            {isEditing ? (
                                              <button
                                                onClick={() => setEditingVariant({
                                                  ...editingVariant,
                                                  data: { ...editData, is_active: !editData.is_active }
                                                })}
                                                className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium transition-colors ${editData.is_active
                                                  ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                                  }`}
                                              >
                                                {editData.is_active ? (
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
                                            ) : (
                                              <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${variant.is_active
                                                ? 'bg-green-100 text-green-700'
                                                : 'bg-gray-100 text-gray-600'
                                                }`}>
                                                {variant.is_active ? (
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
                                              </span>
                                            )}
                                          </div>

                                          {/* Actions */}
                                          <div className="flex justify-end gap-2">
                                            {isEditing ? (
                                              <>
                                                <button
                                                  onClick={handleCancelVariantEdit}
                                                  className="px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                                                  disabled={savingVariant}
                                                >
                                                  Cancelar
                                                </button>
                                                <button
                                                  onClick={handleSaveVariant}
                                                  disabled={savingVariant}
                                                  className="px-3 py-1.5 text-xs bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center gap-1 disabled:opacity-50"
                                                >
                                                  {savingVariant ? (
                                                    <>
                                                      <Loader2 className="w-3 h-3 animate-spin" />
                                                      Guardando...
                                                    </>
                                                  ) : (
                                                    <>
                                                      <Save className="w-3 h-3" />
                                                      Guardar
                                                    </>
                                                  )}
                                                </button>
                                              </>
                                            ) : (
                                              <button
                                                onClick={() => handleEditVariant(product.id, variant)}
                                                className="px-3 py-1.5 text-xs text-blue-600 hover:bg-blue-50 rounded-lg transition-colors flex items-center gap-1"
                                              >
                                                <Edit className="w-3 h-3" />
                                                Editar
                                              </button>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    );
                  })}
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
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
              <h3 className="text-lg font-bold text-gray-900">Editar Producto</h3>
              <button
                onClick={() => setEditingProduct(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Nombre */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nombre del Producto *</label>
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Precio */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Precio Regular *</label>
                  <input
                    type="number"
                    value={editingProduct.price}
                    onChange={(e) => setEditingProduct({ ...editingProduct, price: parseFloat(e.target.value) || 0 })}
                    onFocus={handleNumericInputFocus}
                    onMouseUp={handleNumericInputMouseUp}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                    min="0"
                    required
                  />
                </div>
                {/* Precio Oferta */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Precio Oferta</label>
                  <input
                    type="number"
                    value={editingProduct.discount_price || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, discount_price: parseFloat(e.target.value) || undefined })}
                    onFocus={handleNumericInputFocus}
                    onMouseUp={handleNumericInputMouseUp}
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
                  onFocus={handleNumericInputFocus}
                  onMouseUp={handleNumericInputMouseUp}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                  min="0"
                  required
                />
              </div>

              {/* Categoría */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Categoría *</label>
                <select
                  value={editingProduct.category_id}
                  onChange={(e) => setEditingProduct({ ...editingProduct, category_id: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none bg-white"
                  required
                >
                  <option value="">Selecciona una categoría</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
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

              {/* Variantes Section */}
              <div className="border-t border-gray-200 pt-6 mt-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-md font-bold text-gray-900 flex items-center gap-2">
                    <Layers className="w-5 h-5 text-green-600" />
                    Variantes del Producto
                  </h4>
                  <button
                    onClick={addVariantToProduct}
                    className="text-sm bg-green-50 text-green-700 px-3 py-1.5 rounded-lg border border-green-200 hover:bg-green-100 transition-colors flex items-center gap-1 font-medium"
                  >
                    <Plus className="w-4 h-4" />
                    Añadir Variante
                  </button>
                </div>

                <p className="text-sm text-gray-600 mb-4">
                  Define opciones como diferentes tamaños, pesos o presentaciones. Cada opción puede tener su propio precio y stock.
                </p>

                {((editingProduct.variants || editingProduct.product_variants || []).length === 0) ? (
                  <div className="bg-gray-50 border border-dashed border-gray-300 rounded-xl p-8 text-center text-gray-500">
                    <Layers className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    No hay variantes definidas. Pulsa "Añadir Variante" para crear la primera.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {(editingProduct.variants || editingProduct.product_variants || []).map((variant, index) => (
                      <div
                        key={variant.id || `new-${index}`}
                        className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow relative"
                      >
                        <button
                          onClick={() => removeVariantFromProduct(index)}
                          className="absolute -top-2 -right-2 w-7 h-7 bg-red-100 text-red-600 rounded-full flex items-center justify-center hover:bg-red-200 transition-colors shadow-sm"
                          title="Eliminar variante"
                        >
                          <X className="w-4 h-4" />
                        </button>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {/* Presentación (ej: Bolsa 500g) */}
                          <div className="md:col-span-1">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">Presentación</label>
                            <input
                              type="text"
                              value={variant.variant_value}
                              onChange={(e) => updateVariantInProduct(index, 'variant_value', e.target.value)}
                              placeholder="Ej: 500g, Caja 12u"
                              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none bg-gray-50 font-medium"
                            />
                          </div>

                          {/* Precio */}
                          <div>
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">Precio ($)</label>
                            <input
                              type="number"
                              value={variant.price || 0}
                              onChange={(e) => updateVariantInProduct(index, 'price', parseFloat(e.target.value) || 0)}
                              onFocus={handleNumericInputFocus}
                              onMouseUp={handleNumericInputMouseUp}
                              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none bg-gray-50 font-bold text-gray-700"
                              min="0"
                            />
                          </div>

                          {/* Stock */}
                          <div>
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">Stock</label>
                            <input
                              type="number"
                              value={variant.stock_quantity || 0}
                              onChange={(e) => updateVariantInProduct(index, 'stock_quantity', parseInt(e.target.value) || 0)}
                              onFocus={handleNumericInputFocus}
                              onMouseUp={handleNumericInputMouseUp}
                              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none bg-gray-50 font-medium"
                              min="0"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
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

      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-white flex items-center gap-2 transform transition-all duration-300 ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'
          }`}>
          {toast.type === 'success' ? (
            <div className="w-5 h-5 bg-white rounded-full flex items-center justify-center shadow-sm">
              <svg className="w-3 h-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
            </div>
          ) : (
            <div className="w-5 h-5 bg-white rounded-full flex items-center justify-center shadow-sm">
              <svg className="w-3 h-3 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12"></path></svg>
            </div>
          )}
          <span className="font-medium">{toast.message}</span>
        </div>
      )}
    </div>
  );
}
