'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Filter,
  ChevronLeft,
  ChevronRight,
  Package,
  Clock,
  Phone,
  MapPin,
  User,
  Calendar,
  CheckCircle,
  XCircle,
  Truck,
  ChefHat,
  Trash2,
  AlertTriangle,
  Building2,
  Mail,
  FileText,
  Search
} from 'lucide-react';

interface OrderItem {
  id?: string;
  productId?: string;
  productName?: string;
  quantity: number;
  price?: number;
  subtotal?: number;
}

interface B2BOrder {
  id: string;
  order_number?: string;
  customer_name: string;
  customer_email?: string;
  customer_phone?: string;
  company_name?: string;
  nit?: string;
  delivery_address?: string;
  city?: string;
  notes?: string;
  status: string;
  total: number;
  payment_method?: string;
  created_at: string;
  order_data?: {
    items?: OrderItem[];
    shipping_cost?: number;
    [key: string]: any;
  };
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface OrderStats {
  pending: number;
  confirmed: number;
  processing: number;
  shipped: number;
  delivered: number;
  cancelled: number;
  total: number;
}

const statusConfig: Record<string, { label: string; color: string; bgColor: string; icon: any }> = {
  pending: {
    label: 'Pendiente',
    color: 'text-yellow-700',
    bgColor: 'bg-yellow-100 border-yellow-200',
    icon: Clock,
  },
  confirmed: {
    label: 'Confirmado',
    color: 'text-blue-700',
    bgColor: 'bg-blue-100 border-blue-200',
    icon: CheckCircle,
  },
  processing: {
    label: 'En Preparación',
    color: 'text-purple-700',
    bgColor: 'bg-purple-100 border-purple-200',
    icon: ChefHat,
  },
  shipped: {
    label: 'En Camino',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100 border-blue-200',
    icon: Truck,
  },
  delivered: {
    label: 'Entregado',
    color: 'text-green-700',
    bgColor: 'bg-green-100 border-green-200',
    icon: CheckCircle,
  },
  cancelled: {
    label: 'Cancelado',
    color: 'text-red-700',
    bgColor: 'bg-red-100 border-red-200',
    icon: XCircle,
  },
};

export default function B2BOrdersPage() {
  const searchParams = useSearchParams();
  const [orders, setOrders] = useState<B2BOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState(searchParams.get('status') || '');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
  });
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [updatingOrder, setUpdatingOrder] = useState<string | null>(null);
  const [orderStats, setOrderStats] = useState<OrderStats>({
    pending: 0,
    confirmed: 0,
    processing: 0,
    shipped: 0,
    delivered: 0,
    cancelled: 0,
    total: 0
  });

  useEffect(() => {
    loadOrders();
  }, [status, dateFrom, dateTo, pagination.page, searchTerm]);

  useEffect(() => {
    loadOrderStats();
  }, []);

  const loadOrderStats = async () => {
    try {
      const response = await fetch('/api/admin/empresas/orders/stats', {
        credentials: 'include',
      });
      const data = await response.json();
      if (data.success && data.stats) {
        setOrderStats(data.stats);
      }
    } catch (error) {
      console.error('Error cargando estadísticas B2B:', error);
    }
  };

  const loadOrders = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', pagination.page.toString());
      params.set('limit', pagination.limit.toString());
      params.set('isB2B', 'true'); // Filtrar solo pedidos B2B
      if (status) params.set('status', status);
      if (dateFrom) params.set('dateFrom', dateFrom);
      if (dateTo) params.set('dateTo', dateTo);
      if (searchTerm) params.set('search', searchTerm);

      const response = await fetch(`/api/admin/empresas/orders?${params}`, {
        credentials: 'include',
      });
      const data = await response.json();

      if (data.success) {
        setOrders(data.orders || []);
        setPagination(prev => ({
          ...prev,
          total: data.pagination?.total || 0,
          totalPages: data.pagination?.totalPages || 1,
        }));
      }
    } catch (error) {
      console.error('Error cargando pedidos B2B:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    setUpdatingOrder(orderId);
    try {
      const response = await fetch(`/api/admin/empresas/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await response.json();

      if (data.success) {
        loadOrders();
        loadOrderStats();
      } else {
        alert(data.error || 'Error al actualizar el estado');
      }
    } catch (error) {
      console.error('Error actualizando estado:', error);
      alert('Error al actualizar el estado del pedido');
    } finally {
      setUpdatingOrder(null);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('es-CO', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const clearFilters = () => {
    setStatus('');
    setDateFrom('');
    setDateTo('');
    setSearchTerm('');
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const deleteOrder = async (orderId: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este pedido B2B?\n\nEsta acción no se puede deshacer.')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/empresas/orders/${orderId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      const data = await response.json();

      if (data.success) {
        alert('Pedido eliminado exitosamente');
        loadOrders();
        loadOrderStats();
      } else {
        alert(data.error || 'Error al eliminar el pedido');
      }
    } catch (error) {
      console.error('Error eliminando pedido:', error);
      alert('Error al eliminar el pedido');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
          <Building2 className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Pedidos B2B</h1>
          <p className="text-gray-600 mt-1">Gestiona los pedidos de clientes empresariales</p>
        </div>
      </div>

      {/* Quick Stats Panel */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        {/* Total */}
        <button
          onClick={() => { setStatus(''); setPagination(prev => ({ ...prev, page: 1 })); }}
          className={`p-4 rounded-xl border-2 transition-all ${
            status === ''
              ? 'bg-gray-100 border-gray-400 shadow-md'
              : 'bg-white border-gray-200 hover:border-gray-300'
          }`}
        >
          <div className="text-2xl font-bold text-gray-900">{orderStats.total}</div>
          <div className="text-xs text-gray-600">Total</div>
        </button>

        {/* Pending */}
        <button
          onClick={() => { setStatus('pending'); setPagination(prev => ({ ...prev, page: 1 })); }}
          className={`p-4 rounded-xl border-2 transition-all ${
            status === 'pending'
              ? 'bg-yellow-100 border-yellow-400 shadow-md'
              : 'bg-white border-gray-200 hover:border-yellow-300'
          }`}
        >
          <div className="text-2xl font-bold text-yellow-600">{orderStats.pending}</div>
          <div className="text-xs text-gray-600 flex items-center gap-1">
            <Clock className="w-3 h-3" /> Pendientes
          </div>
        </button>

        {/* Confirmed */}
        <button
          onClick={() => { setStatus('confirmed'); setPagination(prev => ({ ...prev, page: 1 })); }}
          className={`p-4 rounded-xl border-2 transition-all ${
            status === 'confirmed'
              ? 'bg-blue-100 border-blue-400 shadow-md'
              : 'bg-white border-gray-200 hover:border-blue-300'
          }`}
        >
          <div className="text-2xl font-bold text-blue-600">{orderStats.confirmed}</div>
          <div className="text-xs text-gray-600 flex items-center gap-1">
            <CheckCircle className="w-3 h-3" /> Confirmados
          </div>
        </button>

        {/* Processing */}
        <button
          onClick={() => { setStatus('processing'); setPagination(prev => ({ ...prev, page: 1 })); }}
          className={`p-4 rounded-xl border-2 transition-all ${
            status === 'processing'
              ? 'bg-purple-100 border-purple-400 shadow-md'
              : 'bg-white border-gray-200 hover:border-purple-300'
          }`}
        >
          <div className="text-2xl font-bold text-purple-600">{orderStats.processing}</div>
          <div className="text-xs text-gray-600 flex items-center gap-1">
            <ChefHat className="w-3 h-3" /> Preparación
          </div>
        </button>

        {/* Shipped */}
        <button
          onClick={() => { setStatus('shipped'); setPagination(prev => ({ ...prev, page: 1 })); }}
          className={`p-4 rounded-xl border-2 transition-all ${
            status === 'shipped'
              ? 'bg-blue-100 border-blue-400 shadow-md'
              : 'bg-white border-gray-200 hover:border-blue-300'
          }`}
        >
          <div className="text-2xl font-bold text-blue-500">{orderStats.shipped}</div>
          <div className="text-xs text-gray-600 flex items-center gap-1">
            <Truck className="w-3 h-3" /> En Camino
          </div>
        </button>

        {/* Delivered */}
        <button
          onClick={() => { setStatus('delivered'); setPagination(prev => ({ ...prev, page: 1 })); }}
          className={`p-4 rounded-xl border-2 transition-all ${
            status === 'delivered'
              ? 'bg-green-100 border-green-400 shadow-md'
              : 'bg-white border-gray-200 hover:border-green-300'
          }`}
        >
          <div className="text-2xl font-bold text-green-600">{orderStats.delivered}</div>
          <div className="text-xs text-gray-600 flex items-center gap-1">
            <CheckCircle className="w-3 h-3" /> Entregados
          </div>
        </button>

        {/* Cancelled */}
        <button
          onClick={() => { setStatus('cancelled'); setPagination(prev => ({ ...prev, page: 1 })); }}
          className={`p-4 rounded-xl border-2 transition-all ${
            status === 'cancelled'
              ? 'bg-red-100 border-red-400 shadow-md'
              : 'bg-white border-gray-200 hover:border-red-300'
          }`}
        >
          <div className="text-2xl font-bold text-red-600">{orderStats.cancelled}</div>
          <div className="text-xs text-gray-600 flex items-center gap-1">
            <XCircle className="w-3 h-3" /> Cancelados
          </div>
        </button>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 lg:p-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {/* Búsqueda */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Buscar</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Nombre, empresa, NIT..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>
          </div>

          {/* Fecha Desde */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Desde</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => {
                setDateFrom(e.target.value);
                setPagination(prev => ({ ...prev, page: 1 }));
              }}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </div>

          {/* Fecha Hasta */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Hasta</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => {
                setDateTo(e.target.value);
                setPagination(prev => ({ ...prev, page: 1 }));
              }}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </div>

          {/* Limpiar filtros */}
          <div className="flex items-end">
            <button
              onClick={clearFilters}
              className="w-full px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <Filter className="w-5 h-5" />
              Limpiar
            </button>
          </div>
        </div>
      </div>

      {/* Lista de Pedidos */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No se encontraron pedidos B2B</p>
            <p className="text-gray-400 text-sm mt-2">Los pedidos de empresas aparecerán aquí</p>
          </div>
        ) : (
          <>
            {orders.map((order) => {
              const statusInfo = statusConfig[order.status] || statusConfig.pending;
              const StatusIcon = statusInfo.icon;
              const items = order.order_data?.items || [];

              return (
                <div
                  key={order.id}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
                >
                  <div className="p-4 lg:p-6">
                    {/* Header del pedido */}
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-4">
                      <div className="flex items-start gap-4">
                        <div className={`p-2 rounded-lg ${statusInfo.bgColor} border`}>
                          <StatusIcon className={`w-5 h-5 ${statusInfo.color}`} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-lg font-bold text-gray-900">
                              Pedido #{order.order_number || order.id.substring(0, 8)}
                            </h3>
                            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-bold rounded-full flex items-center gap-1">
                              <Building2 className="w-3 h-3" />
                              B2B
                            </span>
                          </div>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusInfo.bgColor} ${statusInfo.color} border mt-1`}>
                            {statusInfo.label}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-blue-600">
                          {formatCurrency(order.total)}
                        </p>
                        <p className="text-sm text-gray-500">
                          {formatDate(order.created_at)} - {formatTime(order.created_at)}
                        </p>
                      </div>
                    </div>

                    {/* Info del cliente empresarial */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4 p-4 bg-blue-50 rounded-xl border border-blue-100">
                      <div className="flex items-start gap-2">
                        <Building2 className="w-4 h-4 text-blue-600 mt-0.5" />
                        <div>
                          <p className="text-xs text-gray-500">Empresa</p>
                          <p className="font-medium text-gray-900">{order.company_name || 'Sin nombre'}</p>
                          {order.nit && <p className="text-xs text-gray-500">NIT: {order.nit}</p>}
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <User className="w-4 h-4 text-blue-600 mt-0.5" />
                        <div>
                          <p className="text-xs text-gray-500">Contacto</p>
                          <p className="font-medium text-gray-900">{order.customer_name}</p>
                        </div>
                      </div>
                      {order.customer_phone && (
                        <div className="flex items-start gap-2">
                          <Phone className="w-4 h-4 text-blue-600 mt-0.5" />
                          <div>
                            <p className="text-xs text-gray-500">Teléfono</p>
                            <a
                              href={`tel:${order.customer_phone}`}
                              className="font-medium text-blue-600 hover:text-blue-700"
                            >
                              {order.customer_phone}
                            </a>
                          </div>
                        </div>
                      )}
                      {order.customer_email && (
                        <div className="flex items-start gap-2">
                          <Mail className="w-4 h-4 text-blue-600 mt-0.5" />
                          <div>
                            <p className="text-xs text-gray-500">Email</p>
                            <a
                              href={`mailto:${order.customer_email}`}
                              className="font-medium text-blue-600 hover:text-blue-700 text-sm truncate block"
                            >
                              {order.customer_email}
                            </a>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Detalles expandibles */}
                    {expandedOrder === order.id && (
                      <div className="border-t border-gray-200 pt-4 mt-4 space-y-4">
                        {/* Dirección y método de pago */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="flex items-start gap-2">
                            <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                            <div>
                              <p className="text-sm text-gray-500">Dirección de Entrega</p>
                              <p className="text-gray-900">{order.delivery_address || 'No especificada'}</p>
                              {order.city && <p className="text-sm text-gray-600">{order.city}</p>}
                            </div>
                          </div>
                          {order.payment_method && (
                            <div className="flex items-start gap-2">
                              <FileText className="w-4 h-4 text-gray-400 mt-0.5" />
                              <div>
                                <p className="text-sm text-gray-500">Método de Pago</p>
                                <p className="text-gray-900 capitalize">{order.payment_method.replace('_', ' ')}</p>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Notas */}
                        {order.notes && (
                          <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                            <p className="text-sm font-medium text-yellow-800">Notas del pedido:</p>
                            <p className="text-sm text-yellow-700">{order.notes}</p>
                          </div>
                        )}

                        {/* Productos */}
                        {items.length > 0 && (
                          <div>
                            <p className="text-sm font-medium text-gray-700 mb-2">Productos del Pedido</p>
                            <div className="space-y-2">
                              {items.map((item, index) => (
                                <div
                                  key={index}
                                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                                >
                                  <div>
                                    <p className="font-medium text-gray-900">
                                      {item.productName || 'Producto'}
                                    </p>
                                  </div>
                                  <div className="text-right">
                                    <p className="font-semibold text-gray-900">
                                      {item.quantity} × {formatCurrency(item.price || 0)}
                                    </p>
                                    <p className="text-sm text-gray-600">
                                      {formatCurrency(item.subtotal || (item.price || 0) * item.quantity)}
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>

                            {/* Resumen */}
                            <div className="mt-4 pt-4 border-t border-gray-200">
                              <div className="flex justify-between items-center">
                                <span className="font-semibold text-gray-900">Total del Pedido:</span>
                                <span className="text-xl font-bold text-blue-600">
                                  {formatCurrency(order.total)}
                                </span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Acciones */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mt-4 pt-4 border-t border-gray-200">
                      <button
                        onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                        className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors text-sm"
                      >
                        {expandedOrder === order.id ? 'Ocultar detalles' : 'Ver detalles'}
                      </button>

                      {/* Quick action buttons */}
                      {order.status === 'pending' && (
                        <button
                          onClick={() => handleUpdateStatus(order.id, 'confirmed')}
                          disabled={updatingOrder === order.id}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm disabled:opacity-50 flex items-center gap-2"
                        >
                          <CheckCircle className="w-4 h-4" />
                          Confirmar
                        </button>
                      )}
                      {order.status === 'confirmed' && (
                        <button
                          onClick={() => handleUpdateStatus(order.id, 'processing')}
                          disabled={updatingOrder === order.id}
                          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors text-sm disabled:opacity-50 flex items-center gap-2"
                        >
                          <ChefHat className="w-4 h-4" />
                          En Preparación
                        </button>
                      )}
                      {order.status === 'processing' && (
                        <button
                          onClick={() => handleUpdateStatus(order.id, 'shipped')}
                          disabled={updatingOrder === order.id}
                          className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors text-sm disabled:opacity-50 flex items-center gap-2"
                        >
                          <Truck className="w-4 h-4" />
                          Enviar
                        </button>
                      )}
                      {order.status === 'shipped' && (
                        <button
                          onClick={() => handleUpdateStatus(order.id, 'delivered')}
                          disabled={updatingOrder === order.id}
                          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm disabled:opacity-50 flex items-center gap-2"
                        >
                          <CheckCircle className="w-4 h-4" />
                          Marcar Entregado
                        </button>
                      )}

                      <div className="flex-1 sm:flex-none">
                        <select
                          value={order.status || 'pending'}
                          onChange={(e) => handleUpdateStatus(order.id, e.target.value)}
                          disabled={updatingOrder === order.id}
                          className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none disabled:opacity-50"
                        >
                          <option value="pending">Pendiente</option>
                          <option value="confirmed">Confirmado</option>
                          <option value="processing">En Preparación</option>
                          <option value="shipped">En Camino</option>
                          <option value="delivered">Entregado</option>
                          <option value="cancelled">Cancelado</option>
                        </select>
                      </div>

                      {updatingOrder === order.id && (
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                      )}

                      {/* WhatsApp */}
                      {order.customer_phone && (
                        <a
                          href={`https://wa.me/57${order.customer_phone.replace(/\D/g, '')}?text=Hola ${order.customer_name}, te escribimos de Tus Aguacates sobre tu pedido B2B #${order.order_number || order.id.substring(0, 8)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm text-center"
                        >
                          WhatsApp
                        </a>
                      )}

                      {/* Delete */}
                      <button
                        onClick={() => deleteOrder(order.id)}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm flex items-center gap-2"
                      >
                        <Trash2 className="w-4 h-4" />
                        Eliminar
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Paginación */}
            {pagination.totalPages > 1 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 lg:p-6">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    Página {pagination.page} de {pagination.totalPages} | Total: {pagination.total} pedidos
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                      disabled={pagination.page === 1}
                      className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                      disabled={pagination.page === pagination.totalPages}
                      className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
