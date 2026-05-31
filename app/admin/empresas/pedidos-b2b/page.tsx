'use client';

import { useEffect, useState } from 'react';
import {
  Filter,
  ChevronLeft,
  ChevronRight,
  Building2,
  User,
  Phone,
  MapPin,
  Calendar,
  CheckCircle,
  XCircle,
  Package,
  Trash2,
  Edit,
  Eye,
  MessageCircle,
  Loader2,
  TrendingUp,
  FileText,
  AlertCircle
} from 'lucide-react';
import { getWhatsAppSafeEmoji } from '@/utils/productEmojis';

interface B2BOrderItem {
  id: string;
  product_id: string;
  product_snapshot: any;
  quantity: number;
  unit_price: number;
  discount_percentage?: number;
  applied_tier_name?: string;
  subtotal: number;
}

interface Company {
  id: string;
  company_name: string;
  nit: string;
  contact_name: string;
  contact_email: string;
  contact_phone: string;
}

interface B2BOrder {
  id: string;
  order_number: string;
  company_id?: string;
  company?: Company;
  guest_contact_info?: any;
  status: string;
  payment_status: string;
  payment_method: string;
  subtotal: number;
  tax: number;
  shipping_fee: number;
  total: number;
  requested_delivery_date?: string;
  customer_purchase_order?: string;
  notes?: string;
  internal_notes?: string;
  created_at: string;
  items?: B2BOrderItem[];
}

interface Pagination {
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
}

const statusConfig: Record<string, { label: string; color: string; bgColor: string }> = {
  pending: { label: 'Pendiente', color: 'text-yellow-700', bgColor: 'bg-yellow-100' },
  confirmed: { label: 'Confirmado', color: 'text-blue-700', bgColor: 'bg-blue-100' },
  processing: { label: 'En Proceso', color: 'text-purple-700', bgColor: 'bg-purple-100' },
  shipped: { label: 'Enviado', color: 'text-indigo-700', bgColor: 'bg-indigo-100' },
  delivered: { label: 'Entregado', color: 'text-green-700', bgColor: 'bg-green-100' },
  cancelled: { label: 'Cancelado', color: 'text-red-700', bgColor: 'bg-red-100' },
};

const paymentStatusConfig: Record<string, { label: string; color: string; bgColor: string }> = {
  pending: { label: 'Pendiente', color: 'text-yellow-700', bgColor: 'bg-yellow-100' },
  paid: { label: 'Pagado', color: 'text-green-700', bgColor: 'bg-green-100' },
  partial: { label: 'Parcial', color: 'text-blue-700', bgColor: 'bg-blue-100' },
  failed: { label: 'Fallido', color: 'text-red-700', bgColor: 'bg-red-100' },
  refunded: { label: 'Reembolsado', color: 'text-gray-700', bgColor: 'bg-gray-100' },
};

export default function B2BOrdersPage() {
  const [orders, setOrders] = useState<B2BOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('');
  const [orderNumber, setOrderNumber] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    page_size: 20,
    total: 0,
    total_pages: 1,
  });
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [updatingOrder, setUpdatingOrder] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    loadOrders();
  }, [status, paymentStatus, orderNumber, dateFrom, dateTo, pagination.page]);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', pagination.page.toString());
      params.set('page_size', pagination.page_size.toString());
      if (status) params.set('status', status);
      if (paymentStatus) params.set('payment_status', paymentStatus);
      if (orderNumber) params.set('order_number', orderNumber);
      if (dateFrom) params.set('date_from', dateFrom);
      if (dateTo) params.set('date_to', dateTo);
      params.set('_t', Date.now().toString());

      const response = await fetch(`/api/admin/b2b/orders?${params}`, {
        credentials: 'include',
        cache: 'no-store',
      });

      const data = await response.json();

      if (data.success) {
        setOrders(data.data || []);
        setPagination(prev => ({
          ...prev,
          total: data.meta?.pagination?.total || 0,
          total_pages: data.meta?.pagination?.total_pages || 1,
        }));
      } else {
        showToast('Error al cargar pedidos B2B', 'error');
      }
    } catch (error) {
      console.error('Error cargando pedidos B2B:', error);
      showToast('Error de conexión', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    setUpdatingOrder(orderId);
    try {
      const response = await fetch(`/api/admin/b2b/orders?id=${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        loadOrders();
        showToast('Estado actualizado correctamente', 'success');
      } else {
        showToast('Error al actualizar estado', 'error');
      }
    } catch (error) {
      console.error('Error actualizando estado:', error);
      showToast('Error de conexión', 'error');
    } finally {
      setUpdatingOrder(null);
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    if (!confirm('¿Estás seguro de eliminar este pedido?')) return;

    try {
      const response = await fetch(`/api/admin/b2b/orders?id=${orderId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        showToast('Pedido eliminado correctamente', 'success');
        loadOrders();
      } else {
        showToast('Error al eliminar pedido', 'error');
      }
    } catch (error) {
      console.error('Error eliminando pedido:', error);
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const generateWhatsAppMessage = (order: B2BOrder) => {
    const isGuest = !order.company;
    const companyName = isGuest
      ? order.guest_contact_info?.company_name || 'Cliente'
      : order.company?.company_name;

    const contactName = isGuest
      ? order.guest_contact_info?.contact_name
      : order.company?.contact_name;

    const phone = isGuest
      ? order.guest_contact_info?.phone
      : order.company?.contact_phone;

    let message = `🏢 *Tus Aguacates B2B*\n`;
    message += `📦 Pedido: ${order.order_number}\n`;
    message += `🏪 Empresa: ${companyName}\n`;
    message += `👤 Contacto: ${contactName}\n`;
    message += `\n📋 *Estado: ${statusConfig[order.status]?.label || order.status}*\n`;
    message += `\n💰 *Total: ${formatCurrency(order.total)}*\n`;
    message += `\n📦 *Items:*\n`;

    order.items?.forEach((item, index) => {
      const snapshot = typeof item.product_snapshot === 'string'
        ? JSON.parse(item.product_snapshot)
        : item.product_snapshot;

      message += `\n${index + 1}. ${getWhatsAppSafeEmoji(snapshot.name)} ${snapshot.name}`;
      message += `\n   Cantidad: ${item.quantity} ${item.applied_tier_name || ''}`;
      message += `\n   Subtotal: ${formatCurrency(item.subtotal)}`;
    });

    if (order.notes) {
      message += `\n\n📝 *Notas:* ${order.notes}`;
    }

    return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Pedidos B2B</h1>
        <p className="text-gray-600 mt-1">Gestión de pedidos empresariales</p>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {/* Estado */}
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPagination(prev => ({ ...prev, page: 1 }));
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
          >
            <option value="">Todos los estados</option>
            {Object.entries(statusConfig).map(([key, config]) => (
              <option key={key} value={key}>{config.label}</option>
            ))}
          </select>

          {/* Estado de pago */}
          <select
            value={paymentStatus}
            onChange={(e) => {
              setPaymentStatus(e.target.value);
              setPagination(prev => ({ ...prev, page: 1 }));
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
          >
            <option value="">Todos los pagos</option>
            {Object.entries(paymentStatusConfig).map(([key, config]) => (
              <option key={key} value={key}>{config.label}</option>
            ))}
          </select>

          {/* Número de pedido */}
          <input
            type="text"
            placeholder="Buscar por # pedido"
            value={orderNumber}
            onChange={(e) => setOrderNumber(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && setPagination(prev => ({ ...prev, page: 1 }))}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
          />

          {/* Fecha desde */}
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
          />

          {/* Fecha hasta */}
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
          />
        </div>
      </div>

      {/* Toast notification */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg ${
          toast.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
        }`}>
          {toast.message}
        </div>
      )}

      {/* Loading */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-green-600 animate-spin" />
        </div>
      ) : (
        <>
          {/* Lista de pedidos */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {orders.length === 0 ? (
              <div className="text-center py-12">
                <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No hay pedidos B2B</p>
                <p className="text-sm text-gray-500 mt-1">
                  {status || paymentStatus || orderNumber || dateFrom || dateTo
                    ? 'Intenta con otros filtros'
                    : 'Los pedidos de empresas aparecerán aquí'}
                </p>
              </div>
            ) : (
              <>
                {/* Desktop view */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Pedido</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Empresa</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Fecha</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Total</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Estado</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Pago</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {orders.map((order) => (
                        <>
                          <tr key={order.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3">
                              <div>
                                <p className="font-semibold text-gray-900">{order.order_number}</p>
                                {order.customer_purchase_order && (
                                  <p className="text-xs text-gray-500">PO: {order.customer_purchase_order}</p>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              {order.company ? (
                                <div>
                                  <p className="font-medium text-gray-900">{order.company.company_name}</p>
                                  <p className="text-xs text-gray-500">{order.company.contact_name}</p>
                                </div>
                              ) : order.guest_contact_info ? (
                                <div>
                                  <p className="font-medium text-gray-900">
                                    {order.guest_contact_info.company_name || 'Guest'}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    {order.guest_contact_info.contact_name}
                                  </p>
                                </div>
                              ) : (
                                <span className="text-gray-500">Sin empresa</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600">
                              {formatDate(order.created_at)}
                              {order.requested_delivery_date && (
                                <p className="text-xs text-blue-600">
                                      Entrega: {formatDate(order.requested_delivery_date)}
                                    </p>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <p className="font-semibold text-gray-900">{formatCurrency(order.total)}</p>
                            </td>
                            <td className="px-4 py-3">
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                statusConfig[order.status]?.bgColor || 'bg-gray-100'
                              } ${statusConfig[order.status]?.color || 'text-gray-700'}`}>
                                {statusConfig[order.status]?.label || order.status}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                paymentStatusConfig[order.payment_status]?.bgColor || 'bg-gray-100'
                              } ${paymentStatusConfig[order.payment_status]?.color || 'text-gray-700'}`}>
                                {paymentStatusConfig[order.payment_status]?.label || order.payment_status}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                                  className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                  title="Ver detalles"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                                <a
                                  href={generateWhatsAppMessage(order)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-2 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-lg transition-colors"
                                  title="Contactar por WhatsApp"
                                >
                                  <MessageCircle className="w-4 h-4" />
                                </a>
                              </div>
                            </td>
                          </tr>
                          {/* Detalles expandidos */}
                          {expandedOrder === order.id && (
                            <tr key={`${order.id}-details`}>
                              <td colSpan={7} className="px-4 py-4 bg-gray-50">
                                <div className="space-y-4">
                                  {/* Items */}
                                  <div>
                                    <h4 className="font-semibold text-gray-900 mb-2">Productos:</h4>
                                    <div className="space-y-2">
                                      {order.items?.map((item) => {
                                        const snapshot = typeof item.product_snapshot === 'string'
                                          ? JSON.parse(item.product_snapshot)
                                          : item.product_snapshot;

                                        return (
                                          <div key={item.id} className="flex items-center justify-between bg-white p-3 rounded-lg border border-gray-200">
                                            <div className="flex-1">
                                              <p className="font-medium text-gray-900">{snapshot.name}</p>
                                              <p className="text-sm text-gray-500">
                                                Cantidad: {item.quantity}
                                                {item.applied_tier_name && (
                                                  <span className="ml-2 text-purple-600">
                                                    ({item.applied_tier_name})
                                                  </span>
                                                )}
                                              </p>
                                            </div>
                                            <div className="text-right">
                                              <p className="font-semibold text-green-600">
                                                {formatCurrency(item.subtotal)}
                                              </p>
                                              {item.discount_percentage && (
                                                <p className="text-xs text-green-500">
                                                  {item.discount_percentage}% desc
                                                </p>
                                              )}
                                            </div>
                                          </div>
                                        );
                                      }) || <p className="text-gray-500">No hay items</p>}
                                    </div>
                                  </div>

                                  {/* Resumen financiero */}
                                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div className="bg-white p-3 rounded-lg border border-gray-200">
                                      <p className="text-xs text-gray-500">Subtotal</p>
                                      <p className="font-semibold text-gray-900">{formatCurrency(order.subtotal)}</p>
                                    </div>
                                    <div className="bg-white p-3 rounded-lg border border-gray-200">
                                      <p className="text-xs text-gray-500">Impuestos</p>
                                      <p className="font-semibold text-gray-900">{formatCurrency(order.tax)}</p>
                                    </div>
                                    <div className="bg-white p-3 rounded-lg border border-gray-200">
                                      <p className="text-xs text-gray-500">Envío</p>
                                      <p className="font-semibold text-gray-900">{formatCurrency(order.shipping_fee)}</p>
                                    </div>
                                    <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                                      <p className="text-xs text-green-600">Total</p>
                                      <p className="font-bold text-green-700">{formatCurrency(order.total)}</p>
                                    </div>
                                  </div>

                                  {/* Cambiar estado */}
                                  <div>
                                    <h4 className="font-semibold text-gray-900 mb-2">Cambiar estado:</h4>
                                    <div className="flex flex-wrap gap-2">
                                      {Object.entries(statusConfig).map(([key, config]) => (
                                        <button
                                          key={key}
                                          onClick={() => handleUpdateStatus(order.id, key)}
                                          disabled={updatingOrder === order.id || order.status === key}
                                          className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                                            order.status === key
                                              ? `${config.bgColor} ${config.color} border-2`
                                              : `${config.bgColor} ${config.color} hover:opacity-80 border`
                                          } disabled:opacity-50`}
                                        >
                                          {config.label}
                                        </button>
                                      ))}
                                    </div>
                                  </div>

                                  {/* Notas */}
                                  {order.notes && (
                                    <div>
                                      <h4 className="font-semibold text-gray-900 mb-2">Notas del cliente:</h4>
                                      <p className="text-sm text-gray-600 bg-white p-3 rounded-lg border border-gray-200">
                                        {order.notes}
                                      </p>
                                    </div>
                                  )}
                                </div>
                              </td>
                            </tr>
                          )}
                        </>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile view */}
                <div className="md:hidden space-y-4 p-4">
                  {orders.map((order) => (
                    <div key={order.id} className="bg-white rounded-lg border border-gray-200 p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-semibold text-gray-900">{order.order_number}</h3>
                          {order.company ? (
                            <p className="text-sm text-gray-600">{order.company.company_name}</p>
                          ) : (
                            <p className="text-sm text-gray-600">
                              {order.guest_contact_info?.company_name || 'Guest'}
                            </p>
                          )}
                        </div>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          statusConfig[order.status]?.bgColor || 'bg-gray-100'
                        } ${statusConfig[order.status]?.color || 'text-gray-700'}`}>
                          {statusConfig[order.status]?.label || order.status}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-lg font-bold text-green-600">{formatCurrency(order.total)}</p>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                          >
                            <Eye className="w-5 h-5" />
                          </button>
                          <a
                            href={generateWhatsAppMessage(order)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                          >
                            <MessageCircle className="w-5 h-5" />
                          </a>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Paginación */}
                <div className="bg-gray-50 px-4 py-3 border-t border-gray-200 flex items-center justify-between">
                  <p className="text-sm text-gray-600">
                    Mostrando <span className="font-semibold">{(pagination.page - 1) * pagination.page_size + 1}</span> a{' '}
                    <span className="font-semibold">{Math.min(pagination.page * pagination.page_size, pagination.total)}</span> de{' '}
                    <span className="font-semibold">{pagination.total}</span> pedidos
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                      disabled={pagination.page === 1}
                      className="p-2 rounded-lg border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <span className="px-3 py-1 text-sm text-gray-700">
                      Página {pagination.page} de {pagination.total_pages}
                    </span>
                    <button
                      onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                      disabled={pagination.page === pagination.total_pages}
                      className="p-2 rounded-lg border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
