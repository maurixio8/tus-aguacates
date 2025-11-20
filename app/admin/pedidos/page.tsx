'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

interface Order {
  id: string;
  customer_id?: string;
  guest_name: string;
  guest_email: string;
  guest_phone: string;
  guest_address: string;
  order_data: {
    items: Array<{
      product_id: string;
      name: string;
      price: number;
      quantity: number;
      subtotal: number;
    }>;
  };
  total_amount: number;
  status: string;
  payment_status?: string;
  payment_method?: string;
  delivery_date?: string;
  created_at: string;
}

export default function PedidosPage() {
  const router = useRouter();
  const supabase = createClient();

  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);

  useEffect(() => {
    loadOrders();
  }, []);

  useEffect(() => {
    filterOrders();
  }, [orders, searchTerm, statusFilter]);

  const loadOrders = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('guest_orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Error al cargar pedidos:', error);
      alert('Error al cargar los pedidos');
    } finally {
      setIsLoading(false);
    }
  };

  const filterOrders = () => {
    let filtered = orders;

    // Filtrar por estado
    if (statusFilter !== 'all') {
      filtered = filtered.filter((order) => order.status === statusFilter);
    }

    // Filtrar por búsqueda
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (order) =>
          order.guest_name.toLowerCase().includes(term) ||
          order.guest_phone.includes(term) ||
          order.id.toLowerCase().includes(term)
      );
    }

    setFilteredOrders(filtered);
  };

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('guest_orders')
        .update({ status: newStatus })
        .eq('id', orderId);

      if (error) throw error;

      await loadOrders();

      if (selectedOrder && selectedOrder.id === orderId) {
        const updated = orders.find(o => o.id === orderId);
        if (updated) setSelectedOrder({ ...updated, status: newStatus });
      }
    } catch (error) {
      console.error('Error al actualizar estado:', error);
      alert('Error al actualizar el estado del pedido');
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    if (!confirm('¿Estás seguro de eliminar este pedido?')) return;

    try {
      const { error } = await supabase.from('guest_orders').delete().eq('id', orderId);

      if (error) throw error;

      await loadOrders();
      if (selectedOrder && selectedOrder.id === orderId) {
        setShowOrderDetails(false);
        setSelectedOrder(null);
      }
    } catch (error) {
      console.error('Error al eliminar pedido:', error);
      alert('Error al eliminar el pedido');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      pendiente: 'bg-yellow-100 text-yellow-800',
      confirmado: 'bg-blue-100 text-blue-800',
      'en-camino': 'bg-purple-100 text-purple-800',
      entregado: 'bg-green-100 text-green-800',
      cancelado: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusLabel = (status: string) => {
    const labels: { [key: string]: string } = {
      pendiente: 'Pendiente',
      confirmado: 'Confirmado',
      'en-camino': 'En Camino',
      entregado: 'Entregado',
      cancelado: 'Cancelado'
    };
    return labels[status] || status;
  };

  const orderStats = {
    total: orders.length,
    pendiente: orders.filter((o) => o.status === 'pendiente').length,
    confirmado: orders.filter((o) => o.status === 'confirmado').length,
    entregado: orders.filter((o) => o.status === 'entregado').length,
    totalRevenue: orders
      .filter((o) => o.status === 'entregado')
      .reduce((sum, o) => sum + o.total_amount, 0)
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Gestión de Pedidos</h1>
          <p className="text-gray-600">Administra todos los pedidos de tu tienda</p>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-4">
            <p className="text-sm text-gray-600 font-medium">Total Pedidos</p>
            <p className="text-2xl font-bold text-gray-900">{orderStats.total}</p>
          </div>
          <div className="bg-yellow-50 rounded-lg shadow-sm p-4">
            <p className="text-sm text-yellow-600 font-medium">Pendientes</p>
            <p className="text-2xl font-bold text-yellow-700">{orderStats.pendiente}</p>
          </div>
          <div className="bg-blue-50 rounded-lg shadow-sm p-4">
            <p className="text-sm text-blue-600 font-medium">Confirmados</p>
            <p className="text-2xl font-bold text-blue-700">{orderStats.confirmado}</p>
          </div>
          <div className="bg-green-50 rounded-lg shadow-sm p-4">
            <p className="text-sm text-green-600 font-medium">Entregados</p>
            <p className="text-2xl font-bold text-green-700">{orderStats.entregado}</p>
          </div>
          <div className="bg-purple-50 rounded-lg shadow-sm p-4">
            <p className="text-sm text-purple-600 font-medium">Ingresos</p>
            <p className="text-xl font-bold text-purple-700">
              {formatCurrency(orderStats.totalRevenue)}
            </p>
          </div>
        </div>

        {/* Filtros y búsqueda */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex-1 w-full md:max-w-md">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Buscar por cliente, teléfono o ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <svg
                  className="absolute left-3 top-2.5 w-5 h-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
            </div>

            <div className="flex gap-3 w-full md:w-auto">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="flex-1 md:flex-none px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="all">Todos los estados</option>
                <option value="pendiente">Pendiente</option>
                <option value="confirmado">Confirmado</option>
                <option value="en-camino">En Camino</option>
                <option value="entregado">Entregado</option>
                <option value="cancelado">Cancelado</option>
              </select>

              <button
                onClick={() => router.push('/admin/pedidos/nuevo')}
                className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2 whitespace-nowrap"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Nuevo Pedido
              </button>
            </div>
          </div>
        </div>

        {/* Lista de pedidos */}
        {isLoading ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
            <p className="mt-4 text-gray-600">Cargando pedidos...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <h3 className="mt-2 text-lg font-medium text-gray-900">
              {searchTerm || statusFilter !== 'all'
                ? 'No se encontraron pedidos'
                : 'No hay pedidos registrados'}
            </h3>
            <p className="mt-1 text-gray-500">
              {searchTerm || statusFilter !== 'all'
                ? 'Intenta con otros filtros'
                : 'Crea tu primer pedido'}
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Pedido
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cliente
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Productos
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fecha
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          #{order.id.slice(0, 8)}
                        </div>
                        {order.payment_method && (
                          <div className="text-xs text-gray-500 capitalize">
                            {order.payment_method}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">
                          {order.guest_name}
                        </div>
                        <div className="text-sm text-gray-500">{order.guest_phone}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {order.order_data.items.length} productos
                        </div>
                        <div className="text-xs text-gray-500">
                          {order.order_data.items.reduce((sum, item) => sum + item.quantity, 0)}{' '}
                          items
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-bold text-green-600">
                          {formatCurrency(order.total_amount)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <select
                          value={order.status}
                          onChange={(e) => handleUpdateStatus(order.id, e.target.value)}
                          className={`text-xs font-medium px-2 py-1 rounded ${getStatusColor(
                            order.status
                          )} border-0 focus:outline-none focus:ring-2 focus:ring-green-500`}
                        >
                          <option value="pendiente">Pendiente</option>
                          <option value="confirmado">Confirmado</option>
                          <option value="en-camino">En Camino</option>
                          <option value="entregado">Entregado</option>
                          <option value="cancelado">Cancelado</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{formatDate(order.created_at)}</div>
                        {order.delivery_date && (
                          <div className="text-xs text-gray-400">
                            Entrega: {new Date(order.delivery_date).toLocaleDateString('es-CO')}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => {
                              setSelectedOrder(order);
                              setShowOrderDetails(true);
                            }}
                            className="text-blue-600 hover:text-blue-900"
                            title="Ver detalles"
                          >
                            <svg
                              className="w-5 h-5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                              />
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                              />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDeleteOrder(order.id)}
                            className="text-red-600 hover:text-red-900"
                            title="Eliminar"
                          >
                            <svg
                              className="w-5 h-5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Modal de detalles del pedido */}
      {showOrderDetails && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">
                    Pedido #{selectedOrder.id.slice(0, 8)}
                  </h2>
                  <p className="text-sm text-gray-600">{formatDate(selectedOrder.created_at)}</p>
                </div>
                <button
                  onClick={() => {
                    setShowOrderDetails(false);
                    setSelectedOrder(null);
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              {/* Información del cliente */}
              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 mb-3">Información del Cliente</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <p className="text-sm text-gray-600">Nombre</p>
                      <p className="font-medium text-gray-900">{selectedOrder.guest_name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Teléfono</p>
                      <p className="font-medium text-gray-900">{selectedOrder.guest_phone}</p>
                    </div>
                    {selectedOrder.guest_email && (
                      <div>
                        <p className="text-sm text-gray-600">Email</p>
                        <p className="font-medium text-gray-900">{selectedOrder.guest_email}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-sm text-gray-600">Método de Pago</p>
                      <p className="font-medium text-gray-900 capitalize">
                        {selectedOrder.payment_method || 'No especificado'}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3">
                    <p className="text-sm text-gray-600">Dirección de Entrega</p>
                    <p className="font-medium text-gray-900">{selectedOrder.guest_address}</p>
                  </div>
                </div>
              </div>

              {/* Productos del pedido */}
              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 mb-3">Productos</h3>
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">
                          Producto
                        </th>
                        <th className="px-4 py-2 text-center text-xs font-medium text-gray-500">
                          Cantidad
                        </th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">
                          Precio
                        </th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">
                          Subtotal
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {selectedOrder.order_data.items.map((item, idx) => (
                        <tr key={idx}>
                          <td className="px-4 py-3 text-sm text-gray-900">{item.name}</td>
                          <td className="px-4 py-3 text-sm text-center text-gray-900">
                            {item.quantity}
                          </td>
                          <td className="px-4 py-3 text-sm text-right text-gray-900">
                            {formatCurrency(item.price)}
                          </td>
                          <td className="px-4 py-3 text-sm text-right font-medium text-gray-900">
                            {formatCurrency(item.subtotal)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Total */}
              <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold text-gray-900">Total del Pedido:</span>
                  <span className="text-3xl font-bold text-green-600">
                    {formatCurrency(selectedOrder.total_amount)}
                  </span>
                </div>
              </div>

              {/* Estado */}
              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Estado del Pedido
                </label>
                <select
                  value={selectedOrder.status}
                  onChange={(e) => {
                    handleUpdateStatus(selectedOrder.id, e.target.value);
                    setSelectedOrder({ ...selectedOrder, status: e.target.value });
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="pendiente">Pendiente</option>
                  <option value="confirmado">Confirmado</option>
                  <option value="en-camino">En Camino</option>
                  <option value="entregado">Entregado</option>
                  <option value="cancelado">Cancelado</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
