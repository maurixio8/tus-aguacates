'use client';

import { useState, useEffect } from 'react';
import { Ticket, Plus, Edit2, Trash2, Calendar, Percent } from 'lucide-react';

interface Coupon {
  id: string;
  code: string;
  description: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  min_purchase: number;
  max_uses: number | null;
  current_uses: number;
  start_date: string;
  end_date: string;
  is_active: boolean;
  created_at: string;
}

export default function CuponesPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);

  useEffect(() => {
    loadCoupons();
  }, []);

  const loadCoupons = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/coupons');
      if (response.ok) {
        const data = await response.json();
        setCoupons(data.data || []);
      }
    } catch (error) {
      console.error('Error cargando cupones:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este cupón?')) return;

    try {
      const response = await fetch(`/api/admin/coupons/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setCoupons(coupons.filter(c => c.id !== id));
        alert('Cupón eliminado exitosamente');
      }
    } catch (error) {
      console.error('Error eliminando cupón:', error);
      alert('Error al eliminar el cupón');
    }
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/admin/coupons/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          is_active: !currentStatus
        })
      });

      if (response.ok) {
        setCoupons(coupons.map(c =>
          c.id === id ? { ...c, is_active: !currentStatus } : c
        ));
      }
    } catch (error) {
      console.error('Error actualizando cupón:', error);
    }
  };

  const isExpired = (endDate: string) => {
    return new Date(endDate) < new Date();
  };

  const isMaxedOut = (coupon: Coupon) => {
    return coupon.max_uses !== null && coupon.current_uses >= coupon.max_uses;
  };

  const activeCoupons = coupons.filter(c => c.is_active && !isExpired(c.end_date) && !isMaxedOut(c));
  const totalDiscount = coupons.reduce((sum, c) => {
    if (c.discount_type === 'percentage') {
      return sum; // No podemos calcular sin saber el total de ventas
    }
    return sum + (c.discount_value * c.current_uses);
  }, 0);

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Gestión de Cupones</h1>
            <p className="text-gray-600">
              Crea y administra cupones de descuento
            </p>
          </div>
          <button
            onClick={() => {
              setEditingCoupon(null);
              setShowModal(true);
            }}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 font-medium flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Nuevo Cupón
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Cupones</p>
              <p className="text-2xl font-bold text-gray-900">{coupons.length}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <Ticket className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Activos</p>
              <p className="text-2xl font-bold text-green-600">{activeCoupons.length}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <span className="text-2xl">✅</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Usos</p>
              <p className="text-2xl font-bold text-purple-600">
                {coupons.reduce((sum, c) => sum + c.current_uses, 0)}
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
              <span className="text-2xl">📊</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Descuento Total</p>
              <p className="text-2xl font-bold text-orange-600">
                ${totalDiscount.toLocaleString('es-CO')}
              </p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
              <Percent className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Coupons Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando cupones...</p>
          </div>
        ) : coupons.length === 0 ? (
          <div className="p-12 text-center text-gray-600">
            <Ticket className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <p className="text-lg font-medium mb-2">No hay cupones</p>
            <p className="text-sm mb-4">Crea tu primer cupón para ofrecer descuentos a tus clientes</p>
            <button
              onClick={() => setShowModal(true)}
              className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 font-medium inline-flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Crear primer cupón
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">Código</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">Descuento</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">Compra Mínima</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">Usos</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">Vigencia</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">Estado</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {coupons.map((coupon) => (
                  <tr
                    key={coupon.id}
                    className="border-b hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Ticket className="w-5 h-5 text-blue-600" />
                        <div>
                          <p className="font-bold text-lg">{coupon.code}</p>
                          <p className="text-sm text-gray-600">{coupon.description}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-bold text-green-600">
                        {coupon.discount_type === 'percentage'
                          ? `${coupon.discount_value}%`
                          : `$${coupon.discount_value.toLocaleString('es-CO')}`}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-gray-700">
                        ${coupon.min_purchase.toLocaleString('es-CO')}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`font-medium ${isMaxedOut(coupon) ? 'text-red-600' : 'text-gray-900'}`}>
                        {coupon.current_uses} / {coupon.max_uses || '∞'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex items-center gap-1 text-gray-600">
                        <Calendar className="w-4 h-4" />
                        <span>
                          {new Date(coupon.start_date).toLocaleDateString('es-CO')} -
                          {new Date(coupon.end_date).toLocaleDateString('es-CO')}
                        </span>
                      </div>
                      {isExpired(coupon.end_date) && (
                        <p className="text-red-600 text-xs mt-1">Expirado</p>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleToggleActive(coupon.id, coupon.is_active)}
                        className={`px-3 py-1 rounded-full text-sm font-medium ${
                          coupon.is_active && !isExpired(coupon.end_date) && !isMaxedOut(coupon)
                            ? 'bg-green-100 text-green-800 hover:bg-green-200'
                            : 'bg-red-100 text-red-800 hover:bg-red-200'
                        }`}
                      >
                        {coupon.is_active && !isExpired(coupon.end_date) && !isMaxedOut(coupon)
                          ? '✅ Activo'
                          : '❌ Inactivo'}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setEditingCoupon(coupon);
                            setShowModal(true);
                          }}
                          className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 font-medium flex items-center gap-1"
                        >
                          <Edit2 className="w-3 h-3" />
                          Editar
                        </button>
                        <button
                          onClick={() => handleDelete(coupon.id)}
                          className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 font-medium flex items-center gap-1"
                        >
                          <Trash2 className="w-3 h-3" />
                          Eliminar
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
    </div>
  );
}
