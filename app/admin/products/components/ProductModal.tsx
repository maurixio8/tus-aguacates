'use client';

import { useState, useEffect } from 'react';
import { X, Upload, Plus, Trash2, Star, Leaf, Package as PackageIcon } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface Product {
  id?: string;
  name: string;
  description: string;
  category_id: string;
  price: number;
  discount_price?: number;
  unit: string;
  weight?: number;
  min_quantity: number;
  main_image_url?: string;
  images?: string[];
  stock: number;
  is_organic: boolean;
  is_featured: boolean;
  is_active: boolean;
  benefits?: string[];
  sku?: string;
}

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (product: Partial<Product>) => void;
  editingProduct?: Product | null;
  categories: Category[];
  loading?: boolean;
}

export default function ProductModal({
  isOpen,
  onClose,
  onSave,
  editingProduct,
  categories,
  loading = false
}: ProductModalProps) {
  const [formData, setFormData] = useState<Partial<Product>>({
    name: '',
    description: '',
    category_id: '',
    price: 0,
    discount_price: undefined,
    unit: 'unit',
    weight: undefined,
    min_quantity: 1,
    main_image_url: '',
    images: [],
    stock: 0,
    is_organic: false,
    is_featured: false,
    is_active: true,
    benefits: [],
    sku: ''
  });

  const [benefitInput, setBenefitInput] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Initialize form when editingProduct changes
  useEffect(() => {
    if (editingProduct) {
      console.log('📝 Editing product:', editingProduct);
      setFormData({
        ...editingProduct,
        benefits: editingProduct.benefits || []
      });
    } else {
      // Reset form for new product
      setFormData({
        name: '',
        description: '',
        category_id: '',
        price: 0,
        discount_price: undefined,
        unit: 'unit',
        weight: undefined,
        min_quantity: 1,
        main_image_url: '',
        images: [],
        stock: 0,
        is_organic: false,
        is_featured: false,
        is_active: true,
        benefits: [],
        sku: ''
      });
    }
    setErrors({});
    setBenefitInput('');
  }, [editingProduct, isOpen]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;

    let processedValue: any = value;

    if (type === 'number') {
      processedValue = parseFloat(value) || 0;
    } else if (type === 'checkbox') {
      const target = e.target as HTMLInputElement;
      processedValue = target.checked;
    }

    setFormData(prev => ({
      ...prev,
      [name]: processedValue
    }));

    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleAddBenefit = () => {
    if (benefitInput.trim()) {
      setFormData(prev => ({
        ...prev,
        benefits: [...(prev.benefits || []), benefitInput.trim()]
      }));
      setBenefitInput('');
    }
  };

  const handleRemoveBenefit = (index: number) => {
    setFormData(prev => ({
      ...prev,
      benefits: prev.benefits?.filter((_, i) => i !== index) || []
    }));
  };

  const handleAddImage = () => {
    const newImages = [...(formData.images || []), ''];
    setFormData(prev => ({
      ...prev,
      images: newImages
    }));
  };

  const handleImageChange = (index: number, value: string) => {
    const newImages = [...(formData.images || [])];
    newImages[index] = value;
    setFormData(prev => ({
      ...prev,
      images: newImages
    }));
  };

  const handleRemoveImage = (index: number) => {
    const newImages = [...(formData.images || [])];
    newImages.splice(index, 1);
    setFormData(prev => ({
      ...prev,
      images: newImages
    }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name?.trim()) {
      newErrors.name = 'El nombre del producto es requerido';
    }

    if (!formData.category_id) {
      newErrors.category_id = 'La categoría es requerida';
    }

    if (!formData.price || formData.price <= 0) {
      newErrors.price = 'El precio debe ser mayor que 0';
    }

    if (!formData.stock || formData.stock < 0) {
      newErrors.stock = 'El stock debe ser mayor o igual a 0';
    }

    if (!formData.unit) {
      newErrors.unit = 'La unidad es requerida';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    console.log('🚀 Submitting product form:', formData);

    if (!validateForm()) {
      console.log('❌ Form validation failed:', errors);
      return;
    }

    // Generate SKU if not provided
    if (!formData.sku) {
      formData.sku = `PRD-${Date.now().toString(36).toUpperCase()}`;
    }

    console.log('✅ Form validation passed, saving product:', formData);
    onSave(formData);
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">
            {editingProduct ? 'Editar Producto' : 'Nuevo Producto'}
          </h2>
          <button
            onClick={handleClose}
            disabled={loading}
            className="text-gray-500 hover:text-gray-700 p-2 disabled:opacity-50"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="bg-gray-50 rounded-xl p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <PackageIcon className="w-5 h-5 text-gray-600" />
              Información Básica
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre del Producto *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name || ''}
                  onChange={handleInputChange}
                  disabled={loading}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-verde-aguacate disabled:opacity-50 ${
                    errors.name ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Ej: Aguacate Hass"
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Categoría *
                </label>
                <select
                  name="category_id"
                  value={formData.category_id || ''}
                  onChange={handleInputChange}
                  disabled={loading}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-verde-aguacate disabled:opacity-50 ${
                    errors.category_id ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">Selecciona una categoría</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
                {errors.category_id && (
                  <p className="mt-1 text-sm text-red-600">{errors.category_id}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  SKU (opcional)
                </label>
                <input
                  type="text"
                  name="sku"
                  value={formData.sku || ''}
                  onChange={handleInputChange}
                  disabled={loading}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-verde-aguacate disabled:opacity-50"
                  placeholder="Se generará automáticamente"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Unidad *
                </label>
                <select
                  name="unit"
                  value={formData.unit || 'unit'}
                  onChange={handleInputChange}
                  disabled={loading}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-verde-aguacate disabled:opacity-50 ${
                    errors.unit ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="unit">Unidad</option>
                  <option value="kg">Kilogramo</option>
                  <option value="lb">Libra</option>
                  <option value="box">Caja</option>
                  <option value="dozen">Docena</option>
                  <option value="pack">Paquete</option>
                </select>
                {errors.unit && (
                  <p className="mt-1 text-sm text-red-600">{errors.unit}</p>
                )}
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descripción
              </label>
              <textarea
                name="description"
                value={formData.description || ''}
                onChange={handleInputChange}
                disabled={loading}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-verde-aguacate disabled:opacity-50"
                placeholder="Describe el producto..."
              />
            </div>
          </div>

          {/* Pricing and Inventory */}
          <div className="bg-blue-50 rounded-xl p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Star className="w-5 h-5 text-blue-600" />
              Precios e Inventario
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Precio *
                </label>
                <input
                  type="number"
                  name="price"
                  value={formData.price || ''}
                  onChange={handleInputChange}
                  disabled={loading}
                  step="0.01"
                  min="0"
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-verde-aguacate disabled:opacity-50 ${
                    errors.price ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="0.00"
                />
                {errors.price && (
                  <p className="mt-1 text-sm text-red-600">{errors.price}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Precio con Descuento
                </label>
                <input
                  type="number"
                  name="discount_price"
                  value={formData.discount_price || ''}
                  onChange={handleInputChange}
                  disabled={loading}
                  step="0.01"
                  min="0"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-verde-aguacate disabled:opacity-50"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Stock *
                </label>
                <input
                  type="number"
                  name="stock"
                  value={formData.stock || ''}
                  onChange={handleInputChange}
                  disabled={loading}
                  min="0"
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-verde-aguacate disabled:opacity-50 ${
                    errors.stock ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="0"
                />
                {errors.stock && (
                  <p className="mt-1 text-sm text-red-600">{errors.stock}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cantidad Mínima
                </label>
                <input
                  type="number"
                  name="min_quantity"
                  value={formData.min_quantity || ''}
                  onChange={handleInputChange}
                  disabled={loading}
                  min="1"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-verde-aguacate disabled:opacity-50"
                  placeholder="1"
                />
              </div>
            </div>
          </div>

          {/* Product Features */}
          <div className="bg-green-50 rounded-xl p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Leaf className="w-5 h-5 text-green-600" />
              Características
            </h3>

            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name="is_organic"
                    checked={formData.is_organic || false}
                    onChange={handleInputChange}
                    disabled={loading}
                    className="w-4 h-4 text-green-600 focus:ring-green-500 border-gray-300 rounded disabled:opacity-50"
                  />
                  <span className="text-sm font-medium text-gray-700">Orgánico</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name="is_featured"
                    checked={formData.is_featured || false}
                    onChange={handleInputChange}
                    disabled={loading}
                    className="w-4 h-4 text-yellow-600 focus:ring-yellow-500 border-gray-300 rounded disabled:opacity-50"
                  />
                  <span className="text-sm font-medium text-gray-700">Destacado</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name="is_active"
                    checked={formData.is_active !== false}
                  onChange={handleInputChange}
                    disabled={loading}
                    className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded disabled:opacity-50"
                />
                  <span className="text-sm font-medium text-gray-700">Activo</span>
                </label>
              </div>

              {/* Benefits */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Beneficios del Producto
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={benefitInput}
                    onChange={(e) => setBenefitInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddBenefit())}
                    disabled={loading}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-verde-aguacate disabled:opacity-50"
                    placeholder="Ej: Rico en vitaminas"
                  />
                  <button
                    type="button"
                    onClick={handleAddBenefit}
                    disabled={loading || !benefitInput.trim()}
                    className="bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white px-4 py-2 rounded-lg transition-colors disabled:cursor-not-allowed"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                {formData.benefits && formData.benefits.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.benefits.map((benefit, index) => (
                      <span
                        key={index}
                        className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm flex items-center gap-1"
                      >
                        {benefit}
                        <button
                          type="button"
                          onClick={() => handleRemoveBenefit(index)}
                          disabled={loading}
                          className="text-green-600 hover:text-green-800 disabled:opacity-50"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Images */}
          <div className="bg-yellow-50 rounded-xl p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Upload className="w-5 h-5 text-yellow-600" />
              Imágenes
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  URL de Imagen Principal
                </label>
                <input
                  type="url"
                  name="main_image_url"
                  value={formData.main_image_url || ''}
                  onChange={handleInputChange}
                  disabled={loading}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-verde-aguacate disabled:opacity-50"
                  placeholder="https://ejemplo.com/imagen.jpg"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Imágenes Adicionales
                  </label>
                  <button
                    type="button"
                    onClick={handleAddImage}
                    disabled={loading}
                    className="bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-300 text-white px-3 py-1 rounded-lg text-sm transition-colors disabled:cursor-not-allowed flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    Agregar Imagen
                  </button>
                </div>

                <div className="space-y-2">
                  {formData.images?.map((image, index) => (
                    <div key={index} className="flex gap-2">
                      <input
                        type="url"
                        value={image}
                        onChange={(e) => handleImageChange(index, e.target.value)}
                        disabled={loading}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-verde-aguacate disabled:opacity-50"
                        placeholder="https://ejemplo.com/imagen-adicional.jpg"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(index)}
                        disabled={loading}
                        className="bg-red-600 hover:bg-red-700 disabled:bg-gray-300 text-white px-3 py-2 rounded-lg transition-colors disabled:cursor-not-allowed"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-6 border-t">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="px-6 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-gradient-to-r from-yellow-400 to-yellow-600 hover:from-yellow-500 hover:to-yellow-700 disabled:bg-gray-300 text-verde-bosque-700 font-bold px-6 py-2 rounded-lg transition-all disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-verde-bosque-700 border-t-transparent"></div>
                  {editingProduct ? 'Actualizando...' : 'Creando...'}
                </>
              ) : (
                <>
                  <PackageIcon className="w-4 h-4" />
                  {editingProduct ? 'Actualizar Producto' : 'Crear Producto'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}