'use client';

import { useState, useEffect } from 'react';
import { X, Calendar, Tag, DollarSign, Percent, Truck, Gift } from 'lucide-react';

interface Coupon {
  id?: string;
  code: string;
  description: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  min_purchase: number;
  max_discount?: number;
  valid_from: string;
  valid_until?: string;
  usage_limit?: number;
  is_active: boolean;
  is_welcome_coupon: boolean;
  free_shipping: boolean;
}

interface CouponModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (coupon: Partial<Coupon>) => void;
  editingCoupon?: Coupon | null;
  loading?: boolean;
}

export default function CouponModal({
  isOpen,
  onClose,
  onSave,
  editingCoupon,
  loading = false
}: CouponModalProps) {
  const [formData, setFormData] = useState<Partial<Coupon>>({
    code: '',
    description: '',
    discount_type: 'percentage',
    discount_value: 10,
    min_purchase: 0,
    max_discount: undefined,
    valid_from: new Date().toISOString().split('T')[0],
    valid_until: '',
    usage_limit: undefined,
    is_active: true,
    is_welcome_coupon: false,
    free_shipping: false
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Initialize form when editingCoupon changes
  useEffect(() => {
    if (editingCoupon) {
      console.log('📝 Editing coupon:', editingCoupon);
      setFormData({
        ...editingCoupon,
        valid_from: editingCoupon.valid_from ? editingCoupon.valid_from.split('T')[0] : new Date().toISOString().split('T')[0],
        valid_until: editingCoupon.valid_until ? editingCoupon.valid_until.split('T')[0] : ''
      });
    } else {
      // Reset form for new coupon
      setFormData({
        code: '',
        description: '',
        discount_type: 'percentage',
        discount_value: 10,
        min_purchase: 0,
        max_discount: undefined,
        valid_from: new Date().toISOString().split('T')[0],
        valid_until: '',
        usage_limit: undefined,
        is_active: true,
        is_welcome_coupon: false,
        free_shipping: false
      });
    }
    setErrors({});
  }, [editingCoupon, isOpen]);

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

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.code?.trim()) {
      newErrors.code = 'El código del cupón es requerido';
    } else if (!/^[A-Z0-9-_]{3,20}$/.test(formData.code.trim().toUpperCase())) {
      newErrors.code = 'El código debe tener 3-20 caracteres (mayúsculas, números, guiones)';
    }

    if (!formData.description?.trim()) {
      newErrors.description = 'La descripción es requerida';
    }

    if (!formData.discount_value || formData.discount_value <= 0) {
      newErrors.discount_value = 'El valor del descuento debe ser mayor que 0';
    }

    if (formData.discount_type === 'percentage' && formData.discount_value && formData.discount_value > 100) {
      newErrors.discount_value = 'El descuento porcentual no puede ser mayor a 100%';
    }

    if (formData.discount_type === 'fixed' && formData.discount_value > 999999) {
      newErrors.discount_value = 'El descuento fijo no puede ser mayor a $999,999';
    }

    if (formData.min_purchase && formData.min_purchase < 0) {
      newErrors.min_purchase = 'El pedido mínimo debe ser mayor o igual a 0';
    }

    if (formData.max_discount && formData.max_discount < 0) {
      newErrors.max_discount = 'El descuento máximo debe ser mayor o igual a 0';
    }

    if (formData.valid_until && formData.valid_from && new Date(formData.valid_until) <= new Date(formData.valid_from)) {
      newErrors.valid_until = 'La fecha de fin debe ser posterior a la fecha de inicio';
    }

    if (formData.usage_limit && formData.usage_limit < 1) {
      newErrors.usage_limit = 'El límite de uso debe ser mayor a 0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    console.log('🚀 Submitting coupon form:', formData);

    if (!validateForm()) {
      console.log('❌ Form validation failed:', errors);
      return;
    }

    // Format dates
    const formattedData = {
      ...formData,
      code: formData.code?.trim().toUpperCase(),
      valid_from: formData.valid_from ? new Date(formData.valid_from).toISOString() : undefined,
      valid_until: formData.valid_until ? new Date(formData.valid_until).toISOString() : undefined
    };

    console.log('✅ Form validation passed, saving coupon:', formattedData);
    onSave(formattedData);
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
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Tag className="w-6 h-6 text-yellow-600" />
            {editingCoupon ? 'Editar Cupón' : 'Nuevo Cupón'}
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
              <Tag className="w-5 h-5 text-gray-600" />
              Información Básica
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Código del Cupón *
                </label>
                <input
                  type="text"
                  name="code"
                  value={formData.code || ''}
                  onChange={handleInputChange}
                  disabled={loading}
                  placeholder="Ej: VERANO10"
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-verde-aguacate disabled:opacity-50 font-mono ${
                    errors.code ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.code && (
                  <p className="mt-1 text-sm text-red-600">{errors.code}</p>
                )}
                <p className="mt-1 text-xs text-gray-500">Solo mayúsculas, números y guiones (3-20 caracteres)</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descripción *
                </label>
                <textarea
                  name="description"
                  value={formData.description || ''}
                  onChange={handleInputChange}
                  disabled={loading}
                  rows={2}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-verde-aguacate disabled:opacity-50 ${
                    errors.description ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Describe el descuento que ofrece este cupón"
                />
                {errors.description && (
                  <p className="mt-1 text-sm text-red-600">{errors.description}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Tipo de Descuento *
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="discount_type"
                      value="percentage"
                      checked={formData.discount_type === 'percentage'}
                      onChange={handleInputChange}
                      disabled={loading}
                      className="mr-2 text-verde-aguacate focus:ring-verde-aguacate"
                    />
                    <div className="flex items-center gap-2">
                      <Percent className="w-4 h-4 text-gray-600" />
                      <span>Porcentaje (%)</span>
                    </div>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="discount_type"
                      value="fixed"
                      checked={formData.discount_type === 'fixed'}
                      onChange={handleInputChange}
                      disabled={loading}
                      className="mr-2 text-verde-aguacate focus:ring-verde-aguacate"
                    />
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-gray-600" />
                      <span>Monto Fijo ($)</span>
                    </div>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {formData.discount_type === 'percentage' ? 'Porcentaje de Descuento *' : 'Monto de Descuento *'}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    {formData.discount_type === 'percentage' ? (
                      <Percent className="h-5 w-5 text-gray-400" />
                    ) : (
                      <DollarSign className="h-5 w-5 text-gray-400" />
                    )}
                  </div>
                  <input
                    type="number"
                    name="discount_value"
                    value={formData.discount_value || ''}
                    onChange={handleInputChange}
                    disabled={loading}
                    step="0.01"
                    min="0"
                    max={formData.discount_type === 'percentage' ? 100 : 999999}
                    className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-verde-aguacate disabled:opacity-50 ${
                      errors.discount_value ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder={formData.discount_type === 'percentage' ? '10' : '10000'}
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <span className="text-sm text-gray-500 font-medium">
                      {formData.discount_type === 'percentage' ? '%' : 'COP'}
                    </span>
                  </div>
                </div>
                {errors.discount_value && (
                  <p className="mt-1 text-sm text-red-600">{errors.discount_value}</p>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  {formData.discount_type === 'percentage'
                    ? 'Ingresa el porcentaje de descuento (ej: 15 para 15% de descuento)'
                    : 'Ingresa el monto fijo en pesos (ej: 15000 para $15.000 de descuento)'}
                </p>
              </div>
            </div>

            {/* Description area takes full width */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mensaje Promocional (opcional)
              </label>
              <textarea
                name="description"
                value={formData.description || ''}
                onChange={handleInputChange}
                disabled={loading}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-verde-aguacate disabled:opacity-50"
                placeholder="Describe los beneficios y condiciones del cupón..."
              />
            </div>
          </div>

          {/* Discount Rules */}
          <div className="bg-blue-50 rounded-xl p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-blue-600" />
              Reglas del Descuento
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Pedido Mínimo
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <DollarSign className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="number"
                    name="min_purchase"
                    value={formData.min_purchase || ''}
                    onChange={handleInputChange}
                    disabled={loading}
                    step="0.01"
                    min="0"
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-verde-aguacate disabled:opacity-50"
                    placeholder="0.00"
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">Compra mínima requerida para usar el cupón</p>
              </div>

              {formData.discount_type === 'percentage' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descuento Máximo (opcional)
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <DollarSign className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="number"
                      name="max_discount"
                      value={formData.max_discount || ''}
                      onChange={handleInputChange}
                      disabled={loading}
                      step="0.01"
                      min="0"
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-verde-aguacate disabled:opacity-50"
                      placeholder="0.00"
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-500">Monto máximo que se puede descontar</p>
                </div>
              )}
            </div>
          </div>

          {/* Validity */}
          <div className="bg-green-50 rounded-xl p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-green-600" />
              Validez del Cupón
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha de Inicio
                </label>
                <input
                  type="date"
                  name="valid_from"
                  value={formData.valid_from || ''}
                  onChange={handleInputChange}
                  disabled={loading}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-verde-aguacate disabled:opacity-50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha de Fin (opcional)
                </label>
                <input
                  type="date"
                  name="valid_until"
                  value={formData.valid_until || ''}
                  onChange={handleInputChange}
                  disabled={loading}
                  min={formData.valid_from || new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-verde-aguacate disabled:opacity-50"
                />
                {errors.valid_until && (
                  <p className="mt-1 text-sm text-red-600">{errors.valid_until}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Límite de Usos (opcional)
                </label>
                <input
                  type="number"
                  name="usage_limit"
                  value={formData.usage_limit || ''}
                  onChange={handleInputChange}
                  disabled={loading}
                  min="1"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-verde-aguacate disabled:opacity-50"
                  placeholder="Ilimitado"
                />
                {errors.usage_limit && (
                  <p className="mt-1 text-sm text-red-600">{errors.usage_limit}</p>
                )}
                <p className="mt-1 text-xs text-gray-500">Número máximo de veces que se puede usar</p>
              </div>
            </div>
          </div>

          {/* Special Features */}
          <div className="bg-yellow-50 rounded-xl p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Gift className="w-5 h-5 text-yellow-600" />
              Características Especiales
            </h3>

            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name="is_welcome_coupon"
                    checked={formData.is_welcome_coupon || false}
                    onChange={handleInputChange}
                    disabled={loading}
                    className="w-4 h-4 text-yellow-600 focus:ring-yellow-500 border-gray-300 rounded disabled:opacity-50"
                  />
                  <span className="text-sm font-medium text-gray-700">Cupón de Bienvenida</span>
                </label>
                <span className="text-xs text-gray-500">Para nuevos clientes</span>
              </div>

              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name="free_shipping"
                    checked={formData.free_shipping || false}
                    onChange={handleInputChange}
                    disabled={loading}
                    className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded disabled:opacity-50"
                  />
                  <span className="text-sm font-medium text-gray-700">Envío Gratis</span>
                </label>
                <span className="text-xs text-gray-500">Otorga envío gratuito</span>
              </div>

              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name="is_active"
                    checked={formData.is_active !== false}
                    onChange={handleInputChange}
                    disabled={loading}
                    className="w-4 h-4 text-green-600 focus:ring-green-500 border-gray-300 rounded disabled:opacity-50"
                  />
                  <span className="text-sm font-medium text-gray-700">Activo</span>
                </label>
                <span className="text-xs text-gray-500">El cupón está disponible para uso</span>
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
                  {editingCoupon ? 'Actualizando...' : 'Creando...'}
                </>
              ) : (
                <>
                  <Tag className="w-4 h-4" />
                  {editingCoupon ? 'Actualizar Cupón' : 'Crear Cupón'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}