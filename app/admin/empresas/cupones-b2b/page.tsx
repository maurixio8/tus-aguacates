'use client';

import { useEffect, useState } from 'react';
import {
  Ticket,
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  Loader2,
} from 'lucide-react';

interface Coupon {
  id: string;
  code: string;
  description?: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  min_purchase: number;
  max_discount?: number;
  valid_from: string;
  valid_until?: string;
  usage_limit?: number;
  times_used: number;
  is_active: boolean;
  applicable_to: 'all' | 'specific_companies' | 'specific_categories';
  created_at: string;
}

export default function B2BCouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    loadCoupons();
  }, []);

  const loadCoupons = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/b2b/coupons?_t=' + Date.now(), {
        credentials: 'include',
        cache: 'no-store',
      });

      const data = await response.json();

      if (data.success) {
        setCoupons(data.data || []);
      } else {
        showToast('Error al cargar cupones', 'error');
      }
    } catch (error) {
      console.error('Error cargando cupones:', error);
      showToast('Error de conexión', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCoupon = async () => {
    if (!editingCoupon) return;
    setSaving(true);

    try {
      const isEditing = !!editingCoupon.id;
      const url = isEditing
        ? `/api/admin/b2b/coupons?id=${editingCoupon.id}`
        : '/api/admin/b2b/coupons';
      const method = isEditing ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          code: editingCoupon.code,
          description: editingCoupon.description,
          discount_type: editingCoupon.discount_type,
          discount_value: editingCoupon.discount_value,
          min_purchase: editingCoupon.min_purchase,
          max_discount: editingCoupon.max_discount,
          valid_from: editingCoupon.valid_from,
          valid_until: editingCoupon.valid_until,
          usage_limit: editingCoupon.usage_limit,
          is_active: editingCoupon.is_active,
          applicable_to: editingCoupon.applicable_to,
          company_ids: editingCoupon.applicable_to === 'specific_companies' ? [] : null,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setEditingCoupon(null);
        loadCoupons();
        showToast(isEditing ? 'Cupón actualizado' : 'Cupón creado', 'success');
      } else {
        showToast(data.error?.message || 'Error al guardar', 'error');
      }
    } catch (error) {
      console.error('Error guardando cupón:', error);
      showToast('Error al guardar el cupón', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCoupon = async (couponId: string) => {
    if (!confirm('¿Estás seguro de eliminar este cupón?')) return;

    try {
      const response = await fetch(`/api/admin/b2b/coupons?id=${couponId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        showToast('Cupón eliminado correctamente', 'success');
        loadCoupons();
      } else {
        showToast('Error al eliminar cupón', 'error');
      }
    } catch (error) {
      console.error('Error eliminando cupón:', error);
      showToast('Error de conexión', 'error');
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Cupones B2B</h1>
          <p className="text-gray-600 mt-1">Descuentos exclusivos para empresas</p>
        </div>
        <button
          onClick={() => setEditingCoupon({
            id: '',
            code: '',
            description: '',
            discount_type: 'percentage',
            discount_value: 0,
            min_purchase: 0,
            valid_from: new Date().toISOString().slice(0, 16),
            times_used: 0,
            is_active: true,
            applicable_to: 'all',
            created_at: '',
          })}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Nuevo Cupón
        </button>
      </div>

      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg ${
          toast.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
        }`}>
          {toast.message}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-green-600 animate-spin" />
          </div>
        ) : coupons.length === 0 ? (
          <div className="text-center py-12">
            <Ticket className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No hay cupones B2B</p>
            <p className="text-sm text-gray-500 mt-1">Crea cupones de descuento para empresas</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Código</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Descuento</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Compra mín</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Uso</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Vigencia</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Estado</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {coupons.map((coupon) => (
                  <tr key={coupon.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-mono font-semibold text-gray-900">{coupon.code}</p>
                        {coupon.description && (
                          <p className="text-xs text-gray-500 truncate max-w-xs">{coupon.description}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${
                        coupon.discount_type === 'percentage'
                          ? 'bg-purple-100 text-purple-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}>
                        {coupon.discount_type === 'percentage'
                          ? `${coupon.discount_value}%`
                          : formatCurrency(coupon.discount_value)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {coupon.min_purchase > 0 ? formatCurrency(coupon.min_purchase) : 'No hay mínimo'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {coupon.times_used} / {coupon.usage_limit || '∞'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {new Date(coupon.valid_from).toLocaleDateString()}
                      {coupon.valid_until && ` - ${new Date(coupon.valid_until).toLocaleDateString()}`}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        coupon.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                      }`}>
                        {coupon.is_active ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setEditingCoupon(coupon)}
                          className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteCoupon(coupon.id)}
                          className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {editingCoupon && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">
                {editingCoupon.id ? 'Editar Cupón' : 'Nuevo Cupón'}
              </h2>
              <button onClick={() => setEditingCoupon(null)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Código</label>
                  <input
                    type="text"
                    value={editingCoupon.code}
                    onChange={(e) => setEditingCoupon({ ...editingCoupon, code: e.target.value.toUpperCase() })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de descuento</label>
                  <select
                    value={editingCoupon.discount_type}
                    onChange={(e) => setEditingCoupon({ ...editingCoupon, discount_type: e.target.value as any })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  >
                    <option value="percentage">Porcentaje (%)</option>
                    <option value="fixed">Monto fijo ($)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Valor</label>
                  <input
                    type="number"
                    value={editingCoupon.discount_value}
                    onChange={(e) => setEditingCoupon({ ...editingCoupon, discount_value: parseFloat(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Compra mínima</label>
                  <input
                    type="number"
                    value={editingCoupon.min_purchase}
                    onChange={(e) => setEditingCoupon({ ...editingCoupon, min_purchase: parseFloat(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>

              {editingCoupon.discount_type === 'percentage' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Descuento máximo (opcional)</label>
                  <input
                    type="number"
                    value={editingCoupon.max_discount || ''}
                    onChange={(e) => setEditingCoupon({
                      ...editingCoupon,
                      max_discount: e.target.value ? parseFloat(e.target.value) : undefined
                    })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción (opcional)</label>
                <textarea
                  value={editingCoupon.description || ''}
                  onChange={(e) => setEditingCoupon({ ...editingCoupon, description: e.target.value })}
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Válido desde</label>
                  <input
                    type="datetime-local"
                    value={editingCoupon.valid_from}
                    onChange={(e) => setEditingCoupon({ ...editingCoupon, valid_from: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Válido hasta (opcional)</label>
                  <input
                    type="datetime-local"
                    value={editingCoupon.valid_until || ''}
                    onChange={(e) => setEditingCoupon({ ...editingCoupon, valid_until: e.target.value || undefined })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Límite de uso (opcional)</label>
                <input
                  type="number"
                  value={editingCoupon.usage_limit || ''}
                  onChange={(e) => setEditingCoupon({
                    ...editingCoupon,
                    usage_limit: e.target.value ? parseInt(e.target.value) : undefined
                  })}
                  placeholder="Sin límite"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Aplicable a</label>
                <select
                  value={editingCoupon.applicable_to}
                  onChange={(e) => setEditingCoupon({ ...editingCoupon, applicable_to: e.target.value as any })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                >
                  <option value="all">Todas las empresas</option>
                  <option value="specific_companies">Empresas específicas</option>
                  <option value="specific_categories">Categorías específicas</option>
                </select>
              </div>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={editingCoupon.is_active}
                  onChange={(e) => setEditingCoupon({ ...editingCoupon, is_active: e.target.checked })}
                  className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
                />
                <span className="text-sm text-gray-700">Cupón activo</span>
              </label>
            </div>

            <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
              <button onClick={() => setEditingCoupon(null)} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100">
                Cancelar
              </button>
              <button onClick={handleSaveCoupon} disabled={saving} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
