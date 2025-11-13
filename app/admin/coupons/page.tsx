'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import CouponModal from './components/CouponModal';
import {
  Ticket,
  Plus,
  Search,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Clock,
  Tag,
  Calendar,
  TrendingUp,
  DollarSign,
  Eye,
  EyeOff,
  Download
} from 'lucide-react';

interface Coupon {
  id: string;
  code: string;
  description: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  min_purchase: number;
  max_discount?: number;
  valid_from: string;
  valid_until?: string;
  usage_limit?: number;
  times_used: number;
  is_active: boolean;
  is_welcome_coupon: boolean;
  free_shipping: boolean;
  created_at: string;
  updated_at: string;
  is_expired?: boolean;
  remaining_uses?: number;
}

interface CouponStats {
  total: number;
  active: number;
  inactive: number;
  expired: number;
  totalUsed: number;
  totalDiscount: number;
}

export default function CouponsPage() {
  const router = useRouter();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [stats, setStats] = useState<CouponStats>({
    total: 0,
    active: 0,
    inactive: 0,
    expired: 0,
    totalUsed: 0,
    totalDiscount: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [couponToDelete, setCouponToDelete] = useState<string | null>(null);
  const [deletingCouponId, setDeletingCouponId] = useState<string | null>(null);
  const [togglingCouponId, setTogglingCouponId] = useState<string | null>(null);
  const [savingCoupon, setSavingCoupon] = useState(false);

  useEffect(() => {
    loadCoupons();
  }, [searchQuery, selectedStatus, currentPage]);

  const loadCoupons = async () => {
    setLoading(true);
    try {
      console.log('🔍 Loading coupons with filters:', { searchQuery, selectedStatus, currentPage });

      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20'
      });

      if (searchQuery) params.append('search', searchQuery);
      if (selectedStatus !== 'all') params.append('status', selectedStatus);

      const response = await fetch(`/api/admin/coupons?${params}`);
      const data = await response.json();

      console.log('📊 Coupons API response:', data);

      if (data.success) {
        setCoupons(data.data);
        setTotalPages(data.pagination.totalPages);

        // Calculate stats
        const allCoupons = data.data;
        const activeCoupons = allCoupons.filter((c: Coupon) => c.is_active && !c.is_expired);
        const expiredCoupons = allCoupons.filter((c: Coupon) => c.is_expired);
        const totalUsed = allCoupons.reduce((sum: number, c: Coupon) => sum + c.times_used, 0);

        setStats({
          total: allCoupons.length,
          active: activeCoupons.length,
          inactive: allCoupons.filter((c: Coupon) => !c.is_active).length,
          expired: expiredCoupons.length,
          totalUsed,
          totalDiscount: 0 // TODO: Calculate from coupon_usage table
        });
      } else {
        throw new Error(data.error);
      }

    } catch (error) {
      console.error('❌ Error loading coupons:', error);
      alert('Error al cargar los cupones');
    } finally {
      setLoading(false);
    }
  };

  const toggleCouponStatus = async (couponId: string, currentStatus: boolean) => {
    setTogglingCouponId(couponId);
    try {
      console.log('🔄 Toggling coupon status:', { couponId, currentStatus });

      const response = await fetch(`/api/admin/coupons/${couponId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          is_active: !currentStatus
        }),
      });

      const data = await response.json();
      console.log('📊 Toggle status response:', data);

      if (!data.success) {
        throw new Error(data.error);
      }

      console.log('✅ Coupon status updated successfully');
      await loadCoupons();
      alert(`Cupón ${!currentStatus ? 'activado' : 'desactivado'} con éxito`);

    } catch (error) {
      console.error('❌ Error toggling coupon status:', error);
      alert(`Error al ${currentStatus ? 'activar' : 'desactivar'} el cupón: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    } finally {
      setTogglingCouponId(null);
    }
  };

  const confirmDelete = (couponId: string) => {
    setCouponToDelete(couponId);
    setShowDeleteConfirm(true);
  };

  const cancelDelete = () => {
    setCouponToDelete(null);
    setShowDeleteConfirm(false);
  };

  const deleteCoupon = async () => {
    if (!couponToDelete) return;

    setDeletingCouponId(couponToDelete);
    try {
      console.log('🗑️ Deleting coupon:', couponToDelete);

      const response = await fetch(`/api/admin/coupons/${couponToDelete}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      console.log('💾 Delete response:', data);

      if (!data.success) {
        throw new Error(data.error);
      }

      console.log('✅ Coupon deleted successfully');
      await loadCoupons();

      setShowDeleteConfirm(false);
      setCouponToDelete(null);

      alert('Cupón eliminado con éxito');

    } catch (error) {
      console.error('❌ Error deleting coupon:', error);
      alert(`Error al eliminar el cupón: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    } finally {
      setDeletingCouponId(null);
    }
  };

  const openCreateModal = () => {
    setEditingCoupon(null);
    setShowCreateModal(true);
  };

  const openEditModal = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    setShowCreateModal(true);
  };

  const closeModal = () => {
    setShowCreateModal(false);
    setEditingCoupon(null);
  };

  const saveCoupon = async (couponData: Partial<Coupon>) => {
    setSavingCoupon(true);
    try {
      console.log('💾 Saving coupon:', couponData);

      let response;
      let successMessage;

      if (editingCoupon) {
        // Update existing coupon
        response = await fetch(`/api/admin/coupons/${editingCoupon.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(couponData),
        });
        successMessage = 'Cupón actualizado exitosamente';
      } else {
        // Create new coupon
        response = await fetch('/api/admin/coupons', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(couponData),
        });
        successMessage = 'Cupón creado exitosamente';
      }

      const data = await response.json();
      console.log('📊 Save coupon response:', data);

      if (!data.success) {
        throw new Error(data.error || 'Error al guardar el cupón');
      }

      console.log('✅ Coupon saved successfully');
      alert(successMessage);

      // Close modal and refresh coupons
      closeModal();
      await loadCoupons();

    } catch (error) {
      console.error('❌ Error saving coupon:', error);
      alert(`Error al guardar el cupón: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    } finally {
      setSavingCoupon(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CO');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP'
    }).format(amount);
  };

  const getDiscountDisplay = (coupon: Coupon) => {
    if (coupon.discount_type === 'percentage') {
      return `${coupon.discount_value}%${coupon.max_discount ? ` (máx ${formatCurrency(coupon.max_discount)})` : ''}`;
    } else {
      return formatCurrency(coupon.discount_value);
    }
  };

  const getStatusBadge = (coupon: Coupon) => {
    if (coupon.is_expired) {
      return 'bg-red-100 text-red-800';
    }
    if (!coupon.is_active) {
      return 'bg-gray-100 text-gray-800';
    }
    return 'bg-green-100 text-green-800';
  };

  const getStatusText = (coupon: Coupon) => {
    if (coupon.is_expired) return 'Expirado';
    if (!coupon.is_active) return 'Inactivo';
    return 'Activo';
  };

  return (
    <div className="min-h-screen bg-gradient-suave py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-display font-bold mb-2">
              Gestión de Cupones
            </h1>
            <p className="text-gray-600">Administra los cupones de descuento</p>
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
              Nuevo Cupón
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-soft">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm mb-1">Total Cupones</p>
                <p className="text-3xl font-bold text-verde-bosque">{stats.total}</p>
              </div>
              <Ticket className="w-12 h-12 text-yellow-500" />
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
                <p className="text-3xl font-bold text-gray-600">{stats.inactive}</p>
              </div>
              <XCircle className="w-12 h-12 text-gray-500" />
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-soft">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm mb-1">Expirados</p>
                <p className="text-3xl font-bold text-red-600">{stats.expired}</p>
              </div>
              <Clock className="w-12 h-12 text-red-500" />
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-soft">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm mb-1">Usos Totales</p>
                <p className="text-3xl font-bold text-blue-600">{stats.totalUsed}</p>
              </div>
              <TrendingUp className="w-12 h-12 text-blue-500" />
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
                  placeholder="Buscar cupones por código o descripción..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-verde-aguacate focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-verde-aguacate focus:border-transparent"
              >
                <option value="all">Todos los estados</option>
                <option value="active">Activos</option>
                <option value="inactive">Inactivos</option>
                <option value="expired">Expirados</option>
              </select>
            </div>
          </div>
        </div>

        {/* Coupons Table */}
        <div className="bg-white rounded-2xl shadow-soft overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Código</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Descripción</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Descuento</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Mínimo</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Uso</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Estado</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                      Cargando cupones...
                    </td>
                  </tr>
                ) : coupons.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                      {searchQuery || selectedStatus !== 'all'
                        ? 'No se encontraron cupones con los filtros seleccionados'
                        : 'No hay cupones registrados'
                      }
                      {!searchQuery && selectedStatus === 'all' && (
                        <div className="mt-4">
                          <button
                            onClick={openCreateModal}
                            className="bg-gradient-to-r from-yellow-400 to-yellow-600 hover:from-yellow-500 hover:to-yellow-700 text-verde-bosque-700 font-bold px-6 py-3 rounded-lg transition-all inline-flex items-center gap-2"
                          >
                            <Plus className="w-5 h-5" />
                            Crear Primer Cupón
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ) : (
                  coupons.map((coupon) => (
                    <tr key={coupon.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Tag className="w-4 h-4 text-gray-500" />
                          <span className="font-mono font-bold text-lg">
                            {coupon.code}
                          </span>
                          {coupon.is_welcome_coupon && (
                            <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                              Bienvenida
                            </span>
                          )}
                          {coupon.free_shipping && (
                            <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                              Envío Gratis
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-900 max-w-xs truncate">
                          {coupon.description}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-bold text-verde-bosque">
                          {getDiscountDisplay(coupon)}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-medium">
                          {formatCurrency(coupon.min_purchase ?? 0)}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          <p className="font-medium">{coupon.times_used}</p>
                          {coupon.remaining_uses !== null && (
                            <p className="text-gray-500">/{(coupon.remaining_uses ?? 0) + coupon.times_used}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadge(coupon)}`}>
                          {getStatusText(coupon)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => toggleCouponStatus(coupon.id, coupon.is_active)}
                            disabled={togglingCouponId === coupon.id || coupon.is_expired}
                            className={`p-2 rounded-lg transition-colors ${
                              coupon.is_active
                                ? 'text-green-600 hover:text-green-800 bg-green-50'
                                : 'text-gray-600 hover:text-gray-800 bg-gray-50'
                            } disabled:opacity-50`}
                            title={coupon.is_active ? 'Desactivar' : 'Activar'}
                          >
                            {togglingCouponId === coupon.id ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent"></div>
                            ) : coupon.is_active ? (
                              <Eye className="w-4 h-4" />
                            ) : (
                              <EyeOff className="w-4 h-4" />
                            )}
                          </button>
                          <button
                            onClick={() => openEditModal(coupon)}
                            className="p-2 text-blue-600 hover:text-blue-800 bg-blue-50 rounded-lg transition-colors"
                            title="Editar cupón"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => confirmDelete(coupon.id)}
                            disabled={deletingCouponId === coupon.id || coupon.times_used > 0}
                            className={`p-2 text-red-600 hover:text-red-800 bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
                            title={coupon.times_used > 0 ? 'No se puede eliminar (ya fue usado)' : 'Eliminar cupón'}
                          >
                            {deletingCouponId === coupon.id ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-2 border-red-600 border-t-transparent"></div>
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-4 mt-6">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Anterior
            </button>
            <span className="text-sm text-gray-600">
              Página {currentPage} de {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Siguiente
            </button>
          </div>
        )}

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
                ¿Estás seguro de que quieres eliminar este cupón? Esta acción no se puede deshacer.
              </p>

              <div className="flex gap-3 justify-end">
                <button
                  onClick={cancelDelete}
                  disabled={deletingCouponId !== null}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={deleteCoupon}
                  disabled={deletingCouponId !== null}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg disabled:opacity-50 flex items-center gap-2"
                >
                  {deletingCouponId ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      Eliminando...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      Eliminar Cupón
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Create/Edit Coupon Modal */}
        <CouponModal
          isOpen={showCreateModal}
          onClose={closeModal}
          onSave={saveCoupon}
          editingCoupon={editingCoupon}
          loading={savingCoupon}
        />
      </div>
    </div>
  );
}