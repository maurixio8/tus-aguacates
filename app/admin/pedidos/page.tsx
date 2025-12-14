'use client';

import { useEffect, useState } from 'react';
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
  AlertTriangle
} from 'lucide-react';

interface OrderItem {
  id: string;
  product_id: string;
  product_snapshot?: {
    name?: string;
    price?: number;
    main_image_url?: string;
    image?: string;
  };
  quantity: number;
  unit_price: number;
  subtotal: number;
  products?: {
    name?: string;
    main_image_url?: string;
  };
  product_name?: string;
  productName?: string;
  variantName?: string;
  price?: number;
}

interface Order {
  id: string;
  order_number: string;
  customer_name?: string;
  customer_phone?: string;
  customer_email?: string;
  delivery_address?: string;
  delivery_notes?: string;
  notes?: string;
  order_status: string;
  total: number;
  total_amount?: number;
  created_at: string;
  delivery_date?: string;
  order_items?: OrderItem[];
  items?: OrderItem[];
  user_id?: string;
  shipping_address?: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const statusConfig: Record<string, { label: string; color: string; bgColor: string; icon: any }> = {
  pendiente: {
    label: 'Pendiente',
    color: 'text-yellow-700',
    bgColor: 'bg-yellow-100 border-yellow-200',
    icon: Clock,
  },
  en_preparacion: {
    label: 'En Preparación',
    color: 'text-blue-700',
    bgColor: 'bg-blue-100 border-blue-200',
    icon: ChefHat,
  },
  listo_entrega: {
    label: 'Listo para Entrega',
    color: 'text-purple-700',
    bgColor: 'bg-purple-100 border-purple-200',
    icon: Truck,
  },
  entregado: {
    label: 'Entregado',
    color: 'text-green-700',
    bgColor: 'bg-green-100 border-green-200',
    icon: CheckCircle,
  },
  cancelado: {
    label: 'Cancelado',
    color: 'text-red-700',
    bgColor: 'bg-red-100 border-red-200',
    icon: XCircle,
  },
};

export default function OrdersPage() {
  const searchParams = useSearchParams();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState(searchParams.get('status') || '');
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

  useEffect(() => {
    loadOrders();
  }, [status, dateFrom, dateTo, pagination.page]);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', pagination.page.toString());
      params.set('limit', pagination.limit.toString());
      if (status) params.set('status', status);
      if (dateFrom) params.set('dateFrom', dateFrom);
      if (dateTo) params.set('dateTo', dateTo);

      const response = await fetch(`/api/admin/orders?${params}`, {
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
      console.error('Error cargando pedidos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    setUpdatingOrder(orderId);
    try {
      const response = await fetch(`/api/admin/orders?id=${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ order_status: newStatus }),
      });

      const data = await response.json();

      if (data.success) {
        loadOrders();
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

  // Función para obtener datos del cliente
  const getCustomerInfo = (order: Order) => {
    // Primero intentar con los datos directos del pedido
    if (order.customer_name) {
      return {
        name: order.customer_name,
        phone: order.customer_phone,
        email: order.customer_email
      };
    }

    // Si hay shipping_address, extraer de allí
    if (order.shipping_address) {
      try {
        const address = JSON.parse(order.shipping_address);
        return {
          name: 'Cliente',
          phone: address.phone || null,
          email: order.customer_email
        };
      } catch {
        // Error parseando JSON
      }
    }

    // Valor por defecto
    return {
      name: 'Cliente',
      phone: null,
      email: order.customer_email
    };
  };

  const clearFilters = () => {
    setStatus('');
    setDateFrom('');
    setDateTo('');
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const deleteOrder = async (orderId: string, orderNumber: string) => {
    if (!confirm(`¿Estás seguro de que deseas eliminar el pedido ${orderNumber}?\n\nEsta acción no se puede deshacer.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      const data = await response.json();

      if (data.success) {
        alert('Pedido eliminado exitosamente');
        loadOrders();
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
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Gestión de Pedidos</h1>
        <p className="text-gray-600 mt-1">Administra y da seguimiento a todos los pedidos</p>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 lg:p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Estado */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Estado</label>
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPagination(prev => ({ ...prev, page: 1 }));
              }}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
            >
              <option value="">Todos los estados</option>
              <option value="pendiente">Pendiente</option>
              <option value="en_preparacion">En Preparación</option>
              <option value="listo_entrega">Listo para Entrega</option>
              <option value="entregado">Entregado</option>
              <option value="cancelado">Cancelado</option>
            </select>
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
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
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
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
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
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No se encontraron pedidos</p>
          </div>
        ) : (
          <>
            {orders.map((order) => {
              const statusInfo = statusConfig[order.order_status] || statusConfig.pendiente;
              const StatusIcon = statusInfo.icon;

              // Función para extraer items de order_data si no hay order_items
              const extractItemsFromOrderData = (order: any) => {
                // Primero intentar con order_items
                if (order.order_items && order.order_items.length > 0) {
                  return order.order_items;
                }

                // Luego con items
                if (order.items && order.items.length > 0) {
                  return order.items;
                }

                // Finalmente extraer desde order_data
                if (order.order_data?.items) {
                  return order.order_data.items.map((item: any, index: number) => ({
                    id: `item-${index}`,
                    product_id: item.productId,
                    product_snapshot: {
                      name: item.productName,
                      price: item.price,
                      main_image_url: null,
                      unit: null
                    },
                    quantity: item.quantity,
                    unit_price: item.price,
                    subtotal: item.quantity * item.price
                  }));
                }

                return [];
              };

              const orderItems = extractItemsFromOrderData(order);
              const customerInfo = getCustomerInfo(order);

              // Debug log
              console.log(`📦 [DEBUG] Pedido ${order.order_number}:`, {
                id: order.id,
                orderItemsCount: orderItems.length,
                orderItems: orderItems.map((item: any) => ({
                  id: item.id,
                  product_id: item.product_id,
                  quantity: item.quantity,
                  has_snapshot: !!item.product_snapshot,
                  snapshot_name: item.product_snapshot?.name,
                  has_products: !!item.products,
                  products_name: item.products?.name,
                  unit_price: item.unit_price,
                  price: item.price
                }))
              });

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
                          <h3 className="text-lg font-bold text-gray-900">
                            Pedido #{order.order_number || order.id.substring(0, 8)}
                          </h3>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusInfo.bgColor} ${statusInfo.color} border`}>
                            {statusInfo.label}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-green-600">
                          {formatCurrency(order.total || order.total_amount || 0)}
                        </p>
                        <p className="text-sm text-gray-500">
                          {formatDate(order.created_at)} - {formatTime(order.created_at)}
                        </p>
                      </div>
                    </div>

                    {/* Info del cliente */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div className="flex items-start gap-2">
                        <User className="w-4 h-4 text-gray-400 mt-0.5" />
                        <div>
                          <p className="text-sm text-gray-500">Cliente</p>
                          <p className="font-medium text-gray-900">{customerInfo.name}</p>
                        </div>
                      </div>
                      {customerInfo.phone && (
                        <div className="flex items-start gap-2">
                          <Phone className="w-4 h-4 text-gray-400 mt-0.5" />
                          <div>
                            <p className="text-sm text-gray-500">Teléfono</p>
                            <a
                              href={`tel:${customerInfo.phone}`}
                              className="font-medium text-green-600 hover:text-green-700"
                            >
                              {customerInfo.phone}
                            </a>
                          </div>
                        </div>
                      )}
                      {order.delivery_date && (
                        <div className="flex items-start gap-2">
                          <Calendar className="w-4 h-4 text-gray-400 mt-0.5" />
                          <div>
                            <p className="text-sm text-gray-500">Fecha de Entrega</p>
                            <p className="font-medium text-gray-900">{formatDate(order.delivery_date)}</p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Detalles expandibles */}
                    {expandedOrder === order.id && (
                      <div className="border-t border-gray-200 pt-4 mt-4 space-y-4">
                        {/* Dirección */}
                        <div className="flex items-start gap-2">
                          <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                          <div>
                            <p className="text-sm text-gray-500">Dirección de Entrega</p>
                            {(() => {
                              // Intentar obtener la dirección del shipping_address (JSON)
                              if (order.shipping_address) {
                                try {
                                  const address = JSON.parse(order.shipping_address);
                                  return (
                                    <div className="text-gray-900">
                                      <p>{address.address}</p>
                                      <p>{address.city}, {address.department}</p>
                                      {address.postal_code && <p>Código Postal: {address.postal_code}</p>}
                                    </div>
                                  );
                                } catch {
                                  // Error parseando JSON, mostrar como texto
                                  return <p className="text-gray-900">{order.shipping_address}</p>;
                                }
                              }
                              // Si no hay shipping_address, usar delivery_address
                              if (order.delivery_address) {
                                return <p className="text-gray-900">{order.delivery_address}</p>;
                              }
                              // Si no hay ninguna dirección
                              return <p className="text-gray-500">No hay dirección registrada</p>;
                            })()}
                            {order.delivery_notes && (
                              <p className="text-sm text-gray-600 mt-1">
                                <strong>Notas:</strong> {order.delivery_notes}
                              </p>
                            )}
                            {order.notes && (
                              <p className="text-sm text-gray-600 mt-1">
                                <strong>Notas del pedido:</strong> {order.notes}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Productos */}
                        {orderItems.length > 0 && (
                          <div>
                            <p className="text-sm font-medium text-gray-700 mb-2">Productos del Pedido</p>
                            <div className="space-y-2">
                              {orderItems.map((item, index) => (
                                <div
                                  key={index}
                                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                                >
                                  <div>
                                    <p className="font-medium text-gray-900">
                                      {item.product_snapshot?.name ||
                                       item.products?.name ||
                                       item.product_name ||
                                       item.productName ||
                                       'Producto'}
                                    </p>
                                    {item.variantName && (
                                      <p className="text-sm text-gray-600">{item.variantName}</p>
                                    )}
                                  </div>
                                  <div className="text-right">
                                    <p className="font-semibold text-gray-900">
                                      {item.quantity} × {formatCurrency(item.unit_price || item.price || 0)}
                                    </p>
                                    <p className="text-sm text-gray-600">
                                      {formatCurrency(item.subtotal || ((item.price || 0) * item.quantity) || 0)}
                                    </p>
                                  </div>
                                </div>
                              ))}
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

                      <div className="flex-1 sm:flex-none">
                        <select
                          value={order.order_status || 'pendiente'}
                          onChange={(e) => handleUpdateStatus(order.id, e.target.value)}
                          disabled={updatingOrder === order.id}
                          className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none disabled:opacity-50"
                        >
                          <option value="pendiente">Pendiente</option>
                          <option value="en_preparacion">En Preparación</option>
                          <option value="listo_entrega">Listo para Entrega</option>
                          <option value="entregado">Entregado</option>
                          <option value="cancelado">Cancelado</option>
                        </select>
                      </div>

                      {updatingOrder === order.id && (
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-green-600"></div>
                      )}

                      {/* WhatsApp button */}
                      {customerInfo.phone && (
                        <a
                          href={`https://wa.me/57${customerInfo.phone.replace(/\D/g, '')}?text=Hola ${customerInfo.name}, te escribimos de Tus Aguacates sobre tu pedido #${order.order_number || order.id.substring(0, 8)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm text-center"
                        >
                          WhatsApp
                        </a>
                      )}

                      {/* Delete button */}
                      <button
                        onClick={() => deleteOrder(order.id, order.id.substring(0, 8))}
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
