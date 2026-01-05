'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Save,
  X,
  Loader2,
  Package,
  PlusCircle,
  Trash2,
  TrendingUp,
} from 'lucide-react';

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface PricingTier {
  min_quantity: number;
  max_quantity: number | null;
  price_per_unit: number;
  tier_name: string;
  discount_percentage: number | null;
}

interface NewB2BProduct {
  sku: string;
  name: string;
  description: string;
  category_id: string | null;
  base_price: number;
  cost_price: number | null;
  stock_quantity: number;
  minimum_order_quantity: number;
  unit: string;
  is_active: boolean;
  is_featured: boolean;
  main_image_url: string | null;
  images: string[];
  pricing_tiers: PricingTier[];
}

export default function NewB2BProductPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const [product, setProduct] = useState<NewB2BProduct>({
    sku: '',
    name: '',
    description: '',
    category_id: null,
    base_price: 0,
    cost_price: null,
    stock_quantity: 0,
    minimum_order_quantity: 1,
    unit: 'kg',
    is_active: true,
    is_featured: false,
    main_image_url: null,
    images: [],
    pricing_tiers: [],
  });

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const response = await fetch('/api/admin/b2b/categories');
      const data = await response.json();
      if (data.success) {
        setCategories(data.data || []);
      }
    } catch (error) {
      console.error('Error cargando categorías:', error);
    } finally {
      setLoadingCategories(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!product.sku.trim()) {
      newErrors.sku = 'El SKU es requerido';
    }
    if (!product.name.trim()) {
      newErrors.name = 'El nombre es requerido';
    }
    if (product.base_price <= 0) {
      newErrors.base_price = 'El precio base debe ser mayor a 0';
    }
    if (product.stock_quantity < 0) {
      newErrors.stock_quantity = 'El stock no puede ser negativo';
    }
    if (product.minimum_order_quantity <= 0) {
      newErrors.minimum_order_quantity = 'La cantidad mínima debe ser mayor a 0';
    }
    if (product.pricing_tiers.length === 0) {
      newErrors.pricing_tiers = 'Debe agregar al menos un pricing tier';
    } else {
      // Validar que no haya solapamiento de tiers
      const sortedTiers = [...product.pricing_tiers].sort((a, b) => a.min_quantity - b.min_quantity);
      for (let i = 0; i < sortedTiers.length - 1; i++) {
        const current = sortedTiers[i];
        const next = sortedTiers[i + 1];
        if (current.max_quantity && next.min_quantity <= current.max_quantity) {
          newErrors.pricing_tiers = `Los rangos de pricing tiers se solapan: Tier "${current.tier_name}" y "${next.tier_name}"`;
          break;
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setSaving(true);
    try {
      const response = await fetch('/api/admin/b2b/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(product),
      });

      const data = await response.json();

      if (data.success) {
        showToast('Producto creado exitosamente', 'success');
        setTimeout(() => {
          router.push('/admin/empresas/productos-b2b');
        }, 1500);
      } else {
        showToast(data.error?.message || 'Error al crear el producto', 'error');
      }
    } catch (error) {
      console.error('Error creando producto:', error);
      showToast('Error de conexión', 'error');
    } finally {
      setSaving(false);
    }
  };

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const addPricingTier = () => {
    const newTier: PricingTier = {
      min_quantity: 1,
      max_quantity: null,
      price_per_unit: product.base_price,
      tier_name: `Tier ${product.pricing_tiers.length + 1}`,
      discount_percentage: null,
    };
    setProduct({ ...product, pricing_tiers: [...product.pricing_tiers, newTier] });
  };

  const removePricingTier = (index: number) => {
    const newTiers = product.pricing_tiers.filter((_, i) => i !== index);
    // Renombrar tiers
    const renamedTiers = newTiers.map((tier, i) => ({
      ...tier,
      tier_name: `Tier ${i + 1}`,
    }));
    setProduct({ ...product, pricing_tiers: renamedTiers });
  };

  const updatePricingTier = (index: number, field: keyof PricingTier, value: any) => {
    const newTiers = [...product.pricing_tiers];
    newTiers[index] = { ...newTiers[index], [field]: value };

    // Calcular automáticamente el porcentaje de descuento
    if (field === 'price_per_unit' || field === 'min_quantity') {
      const tier = newTiers[index];
      if (tier.min_quantity > 0 && product.base_price > 0) {
        const discount = ((product.base_price - tier.price_per_unit) / product.base_price) * 100;
        newTiers[index].discount_percentage = Math.round(discount * 10) / 10;
      }
    }

    setProduct({ ...product, pricing_tiers: newTiers });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Toast notification */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg ${
          toast.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
        }`}>
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/empresas/productos-b2b"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Nuevo Producto B2B</h1>
            <p className="text-gray-600 mt-1">Crea un nuevo producto para el catálogo mayorista</p>
          </div>
        </div>
      </div>

      {/* Formulario */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
        {/* Información básica */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Package className="w-5 h-5" />
            Información Básica
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* SKU */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                SKU <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={product.sku}
                onChange={(e) => setProduct({ ...product, sku: e.target.value })}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                  errors.sku ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Ej: B2B-AGUACATE-HASS"
              />
              {errors.sku && <p className="text-sm text-red-500 mt-1">{errors.sku}</p>}
            </div>

            {/* Nombre */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre del producto <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={product.name}
                onChange={(e) => setProduct({ ...product, name: e.target.value })}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                  errors.name ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Ej: Aguacate Hass Premium"
              />
              {errors.name && <p className="text-sm text-red-500 mt-1">{errors.name}</p>}
            </div>

            {/* Descripción */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
              <textarea
                value={product.description}
                onChange={(e) => setProduct({ ...product, description: e.target.value })}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                placeholder="Descripción detallada del producto..."
              />
            </div>

            {/* Categoría */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
              <select
                value={product.category_id || ''}
                onChange={(e) => setProduct({ ...product, category_id: e.target.value || null })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                disabled={loadingCategories}
              >
                <option value="">Sin categoría</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Unidad */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Unidad de medida</label>
              <select
                value={product.unit}
                onChange={(e) => setProduct({ ...product, unit: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              >
                <option value="kg">Kilogramo (kg)</option>
                <option value="lb">Libra (lb)</option>
                <option value="unit">Unidad</option>
                <option value="box">Caja</option>
                <option value="case">Caso</option>
                <option value="pallet">Pallet</option>
              </select>
            </div>
          </div>
        </div>

        {/* Precios e inventario */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Precios e Inventario</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Precio base */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Precio Base <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                <input
                  type="number"
                  value={product.base_price}
                  onChange={(e) => setProduct({ ...product, base_price: parseFloat(e.target.value) || 0 })}
                  className={`w-full pl-8 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                    errors.base_price ? 'border-red-500' : 'border-gray-300'
                  }`}
                  min="0"
                  step="0.01"
                />
              </div>
              {errors.base_price && <p className="text-sm text-red-500 mt-1">{errors.base_price}</p>}
            </div>

            {/* Precio costo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Precio Costo</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                <input
                  type="number"
                  value={product.cost_price || ''}
                  onChange={(e) => setProduct({
                    ...product,
                    cost_price: e.target.value ? parseFloat(e.target.value) : null
                  })}
                  className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  min="0"
                  step="0.01"
                  placeholder="Opcional"
                />
              </div>
            </div>

            {/* Stock */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Stock <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={product.stock_quantity}
                onChange={(e) => setProduct({ ...product, stock_quantity: parseInt(e.target.value) || 0 })}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                  errors.stock_quantity ? 'border-red-500' : 'border-gray-300'
                }`}
                min="0"
              />
              {errors.stock_quantity && <p className="text-sm text-red-500 mt-1">{errors.stock_quantity}</p>}
            </div>

            {/* Cantidad mínima */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cantidad Mínima <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={product.minimum_order_quantity}
                onChange={(e) => setProduct({ ...product, minimum_order_quantity: parseInt(e.target.value) || 1 })}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                  errors.minimum_order_quantity ? 'border-red-500' : 'border-gray-300'
                }`}
                min="1"
              />
              {errors.minimum_order_quantity && <p className="text-sm text-red-500 mt-1">{errors.minimum_order_quantity}</p>}
            </div>
          </div>
        </div>

        {/* Estados */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Estado del Producto</h2>
          <div className="flex flex-wrap gap-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={product.is_active}
                onChange={(e) => setProduct({ ...product, is_active: e.target.checked })}
                className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
              />
              <span className="text-sm text-gray-700">Producto activo</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={product.is_featured}
                onChange={(e) => setProduct({ ...product, is_featured: e.target.checked })}
                className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
              />
              <span className="text-sm text-gray-700">Producto destacado</span>
            </label>
          </div>
        </div>

        {/* Pricing Tiers */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Precios por Volumen (Pricing Tiers) <span className="text-red-500">*</span>
            </h2>
            <button
              type="button"
              onClick={addPricingTier}
              className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
            >
              <PlusCircle className="w-4 h-4" />
              Agregar Tier
            </button>
          </div>

          {errors.pricing_tiers && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">{errors.pricing_tiers}</p>
            </div>
          )}

          {product.pricing_tiers.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
              <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600">No hay pricing tiers configurados</p>
              <p className="text-sm text-gray-500 mt-1">Agrega al menos un tier para continuar</p>
            </div>
          ) : (
            <div className="space-y-4">
              {product.pricing_tiers.map((tier, index) => (
                <div key={index} className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium text-gray-900">{tier.tier_name}</h3>
                    <button
                      type="button"
                      onClick={() => removePricingTier(index)}
                      className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {/* Cantidad mínima */}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Cantidad Mínima</label>
                      <input
                        type="number"
                        value={tier.min_quantity}
                        onChange={(e) => updatePricingTier(index, 'min_quantity', parseInt(e.target.value) || 1)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm"
                        min="1"
                      />
                    </div>

                    {/* Cantidad máxima */}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Cantidad Máxima</label>
                      <div className="relative">
                        <input
                          type="number"
                          value={tier.max_quantity || ''}
                          onChange={(e) => updatePricingTier(index, 'max_quantity', e.target.value ? parseInt(e.target.value) : null)}
                          className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm"
                          min="1"
                          placeholder="Sin límite"
                        />
                        {tier.max_quantity === null && (
                          <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-xs">∞</span>
                        )}
                      </div>
                    </div>

                    {/* Precio por unidad */}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Precio por Unidad</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">$</span>
                        <input
                          type="number"
                          value={tier.price_per_unit}
                          onChange={(e) => updatePricingTier(index, 'price_per_unit', parseFloat(e.target.value) || 0)}
                          className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm"
                          min="0"
                          step="0.01"
                        />
                      </div>
                    </div>

                    {/* Descuento */}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Descuento</label>
                      <div className="relative">
                        <input
                          type="text"
                          value={tier.discount_percentage !== null ? `${tier.discount_percentage}%` : '-'}
                          readOnly
                          className="w-full px-3 py-2 bg-green-50 border border-green-200 rounded-lg text-green-700 font-medium text-sm"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Preview */}
                  <div className="mt-3 p-2 bg-white rounded border border-purple-200">
                    <p className="text-xs text-gray-600">
                      {tier.max_quantity
                        ? `${tier.min_quantity} - ${tier.max_quantity} ${product.unit}`
                        : `${tier.min_quantity}+ ${product.unit}`
                      } → <span className="font-semibold text-green-600">{formatCurrency(tier.price_per_unit)} / {product.unit}</span>
                      {tier.discount_percentage !== null && tier.discount_percentage > 0 && (
                        <span className="ml-2 text-green-600 text-xs">({tier.discount_percentage}% desc)</span>
                      )}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Botones de acción */}
      <div className="flex gap-4 justify-end">
        <Link
          href="/admin/empresas/productos-b2b"
          className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium flex items-center gap-2"
        >
          <X className="w-4 h-4" />
          Cancelar
        </Link>
        <button
          onClick={handleSubmit}
          disabled={saving}
          className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center gap-2"
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Guardando...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              Crear Producto
            </>
          )}
        </button>
      </div>
    </div>
  );
}
