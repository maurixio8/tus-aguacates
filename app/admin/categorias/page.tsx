'use client';

import { useEffect, useState } from 'react';
import {
  Plus,
  Edit,
  Trash2,
  Search,
  Eye,
  EyeOff,
  Loader2,
  Upload,
  Image as ImageIcon,
  Save,
  X,
  ArrowUpDown
} from 'lucide-react';
import { OptimizedImage } from '@/components/optimization/OptimizedImage';

interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image_url?: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export default function CategoriesAdminPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    image_url: '',
    is_active: true,
    sort_order: 0
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/categories?includeInactive=true');
      const data = await response.json();

      if (data.success) {
        setCategories(data.categories);
      } else {
        console.error('Error fetching categories:', data.error);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      slug: category.slug,
      description: category.description || '',
      image_url: category.image_url || '',
      is_active: category.is_active,
      sort_order: category.sort_order
    });
    setPreviewUrl(category.image_url || '');
    setSelectedFile(null);
  };

  const handleCreate = () => {
    setIsCreating(true);
    setEditingCategory(null);
    setFormData({
      name: '',
      slug: '',
      description: '',
      image_url: '',
      is_active: true,
      sort_order: categories.length
    });
    setPreviewUrl('');
    setSelectedFile(null);
  };

  const handleCancel = () => {
    setEditingCategory(null);
    setIsCreating(false);
    setFormData({
      name: '',
      slug: '',
      description: '',
      image_url: '',
      is_active: true,
      sort_order: 0
    });
    setPreviewUrl('');
    setSelectedFile(null);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = async (categorySlug: string, oldImageUrl?: string): Promise<string | null> => {
    if (!selectedFile) return null;

    try {
      setUploadingImage(true);
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('categorySlug', categorySlug);

      // Si hay imagen anterior, extraer el storagePath de la URL
      if (oldImageUrl) {
        // Intentar con product-images (nuevo bucket) o category-images (legacy)
        let urlParts = oldImageUrl.split('/product-images/');
        if (urlParts.length === 1) {
          urlParts = oldImageUrl.split('/category-images/');
        }
        if (urlParts.length > 1) {
          formData.append('oldStoragePath', urlParts[1]);
        }
      }

      const response = await fetch('/api/categories/upload-image', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (data.success) {
        return data.publicUrl;
      } else {
        console.error('Error uploading image:', data.error);
        alert(`Error al subir imagen: ${data.error}`);
        return null;
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error al subir imagen');
      return null;
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSave = async () => {
    if (!formData.name || !formData.slug) {
      alert('Nombre y slug son requeridos');
      return;
    }

    try {
      setSaving(true);

      // Primero subir la imagen si hay una nueva
      let imageUrl = formData.image_url;
      if (selectedFile) {
        const uploadedUrl = await uploadImage(
          formData.slug,
          editingCategory?.image_url
        );
        if (uploadedUrl) {
          imageUrl = uploadedUrl;
        }
      }

      // Luego crear o actualizar la categoría
      const endpoint = isCreating ? '/api/categories' : '/api/categories';
      const method = isCreating ? 'POST' : 'PATCH';

      const body = isCreating
        ? {
            name: formData.name,
            slug: formData.slug,
            description: formData.description,
            image_url: imageUrl,
            is_active: formData.is_active,
            sort_order: formData.sort_order
          }
        : {
            id: editingCategory?.id,
            name: formData.name,
            slug: formData.slug,
            description: formData.description,
            image_url: imageUrl,
            is_active: formData.is_active,
            sort_order: formData.sort_order
          };

      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });

      const data = await response.json();

      if (data.success) {
        await fetchCategories();
        handleCancel();
        alert(isCreating ? 'Categoría creada exitosamente' : 'Categoría actualizada exitosamente');
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error al guardar categoría');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`¿Estás seguro de eliminar la categoría "${name}"?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/categories?id=${id}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (data.success) {
        await fetchCategories();
        alert('Categoría eliminada exitosamente');
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error al eliminar categoría');
    }
  };

  const toggleActive = async (category: Category) => {
    try {
      const response = await fetch('/api/categories', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          id: category.id,
          is_active: !category.is_active
        })
      });

      const data = await response.json();

      if (data.success) {
        await fetchCategories();
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error al cambiar estado');
    }
  };

  const filteredCategories = categories.filter(cat =>
    cat.name.toLowerCase().includes(search.toLowerCase()) ||
    cat.slug.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-verde-aguacate" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Gestión de Categorías
        </h1>
        <p className="text-gray-600">
          Administra las categorías de productos de tu tienda
        </p>
      </div>

      {/* Actions Bar */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar categoría..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-verde-aguacate"
            />
          </div>

          {/* Create Button */}
          <button
            onClick={handleCreate}
            className="flex items-center gap-2 bg-verde-aguacate text-white px-4 py-2 rounded-lg hover:bg-verde-bosque transition-colors"
          >
            <Plus className="w-5 h-5" />
            Nueva Categoría
          </button>
        </div>
      </div>

      {/* Create/Edit Form */}
      {(isCreating || editingCategory) && (
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6 border-2 border-verde-aguacate">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">
              {isCreating ? 'Crear Nueva Categoría' : 'Editar Categoría'}
            </h2>
            <button
              onClick={handleCancel}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-verde-aguacate"
                  placeholder="Aguacates, Frutas Tropicales, etc."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Slug * (URL amigable)
                </label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-verde-aguacate"
                  placeholder="aguacates, frutas-tropicales, etc."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descripción
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-verde-aguacate"
                  placeholder="Descripción de la categoría..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Orden
                </label>
                <input
                  type="number"
                  value={formData.sort_order}
                  onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-verde-aguacate"
                  placeholder="0"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-5 h-5 text-verde-aguacate focus:ring-verde-aguacate border-gray-300 rounded"
                />
                <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
                  Categoría activa (visible en la tienda)
                </label>
              </div>
            </div>

            {/* Right Column - Image Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Imagen de Categoría
              </label>

              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                {previewUrl ? (
                  <div className="space-y-4">
                    <div className="relative w-48 h-48 mx-auto">
                      {/* Usar img normal para preview de data URLs */}
                      {previewUrl.startsWith('data:') ? (
                        <img
                          src={previewUrl}
                          alt="Preview"
                          className="rounded-lg object-cover w-full h-full"
                        />
                      ) : (
                        <OptimizedImage
                          src={previewUrl}
                          alt="Preview"
                          fill
                          className="rounded-lg object-cover"
                        />
                      )}
                    </div>
                    <button
                      onClick={() => {
                        setPreviewUrl('');
                        setSelectedFile(null);
                        setFormData({ ...formData, image_url: '' });
                      }}
                      className="text-sm text-red-600 hover:text-red-700"
                    >
                      Quitar imagen
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <ImageIcon className="w-16 h-16 mx-auto text-gray-400" />
                    <p className="text-sm text-gray-600">
                      Arrastra una imagen o haz clic para seleccionar
                    </p>
                    <p className="text-xs text-gray-500">
                      Recomendado: 400x400px, máx 5MB
                    </p>
                  </div>
                )}

                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="image-upload"
                />
                <label
                  htmlFor="image-upload"
                  className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg cursor-pointer transition-colors"
                >
                  <Upload className="w-4 h-4" />
                  Seleccionar Imagen
                </label>
              </div>

              <p className="mt-2 text-xs text-gray-500">
                La imagen se comprimirá automáticamente a 400x400px manteniendo el aspecto
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 mt-6 pt-6 border-t">
            <button
              onClick={handleCancel}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={saving || uploadingImage}
              className="flex items-center gap-2 px-6 py-2 bg-verde-aguacate text-white rounded-lg hover:bg-verde-bosque transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {(saving || uploadingImage) ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {uploadingImage ? 'Subiendo imagen...' : 'Guardando...'}
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
      )}

      {/* Categories Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Imagen
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Nombre / Slug
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Descripción
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <div className="flex items-center gap-1">
                  <ArrowUpDown className="w-4 h-4" />
                  Orden
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Estado
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredCategories.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                  No se encontraron categorías
                </td>
              </tr>
            ) : (
              filteredCategories.map((category) => (
                <tr key={category.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    {category.image_url ? (
                      <div className="relative w-16 h-16">
                        <OptimizedImage
                          src={category.image_url}
                          alt={category.name}
                          fill
                          className="rounded-lg object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                        <ImageIcon className="w-8 h-8 text-gray-400" />
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">
                      {category.name}
                    </div>
                    <div className="text-sm text-gray-500">
                      /{category.slug}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-600 max-w-xs truncate">
                      {category.description || '-'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {category.sort_order}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => toggleActive(category)}
                      className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                        category.is_active
                          ? 'bg-green-100 text-green-800 hover:bg-green-200'
                          : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                      }`}
                    >
                      {category.is_active ? (
                        <>
                          <Eye className="w-3 h-3" />
                          Activa
                        </>
                      ) : (
                        <>
                          <EyeOff className="w-3 h-3" />
                          Inactiva
                        </>
                      )}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleEdit(category)}
                        className="text-blue-600 hover:text-blue-900 p-2 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Editar"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(category.id, category.name)}
                        className="text-red-600 hover:text-red-900 p-2 hover:bg-red-50 rounded-lg transition-colors"
                        title="Eliminar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Summary */}
      <div className="mt-4 text-sm text-gray-600">
        Mostrando {filteredCategories.length} de {categories.length} categorías
        {' '}
        ({categories.filter(c => c.is_active).length} activas, {categories.filter(c => !c.is_active).length} inactivas)
      </div>
    </div>
  );
}
