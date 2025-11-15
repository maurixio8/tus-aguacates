'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import {
  ShoppingBag,
  Users,
  DollarSign,
  TrendingUp,
  Package,
  Clock,
  CheckCircle,
  XCircle,
  Download,
  LogOut,
  Shield,
  Trash2,
  X,
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Package as PackageIcon,
  CreditCard,
  Box,
  ArrowLeft,
  Ticket
} from 'lucide-react';

interface GuestOrder {
  id: string;
  guest_name: string;
  guest_email: string;
  guest_phone: string;
  guest_address: string;
  order_data: any;
  total_amount: number;
  status: string;
  delivery_date: string | null;
  created_at: string;
}

interface OrderStats {
  total: number;
  pending: number;
  completed: number;
  revenue: number;
}

interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [orders, setOrders] = useState<GuestOrder[]>([]);
  const [stats, setStats] = useState<OrderStats>({
    total: 0,
    pending: 0,
    completed: 0,
    revenue: 0
  });
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  // Modal and UI state
  const [selectedOrder, setSelectedOrder] = useState<GuestOrder | null>(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<string | null>(null);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const [deletingOrderId, setDeletingOrderId] = useState<string | null>(null);

  // Editing state
  const [isEditingOrder, setIsEditingOrder] = useState(false);
  const [editedOrder, setEditedOrder] = useState<Partial<GuestOrder>>({});
  const [savingOrderId, setSavingOrderId] = useState<string | null>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (adminUser) {
      loadOrders();
    }
  }, [adminUser, selectedStatus]);

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/admin/me');
      const data = await response.json();

      if (data.success && data.user) {
        setAdminUser(data.user);
      } else {
        router.push('/admin/login');
      }
    } catch (error) {
      console.error('Auth check error:', error);
      router.push('/admin/login');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/admin/logout', { method: 'POST' });
      router.push('/admin/login');
    } catch (error) {
      console.error('Logout error:', error);
      router.push('/admin/login');
    }
  };

  const loadOrders = async () => {
    setLoading(true);
    try {
      // PRIMERO: Intentar cargar desde la tabla guest_orders
      try {
        let query = supabase
          .from('guest_orders')
          .select('*')
          .order('created_at', { ascending: false });

        if (selectedStatus !== 'all') {
          query = query.eq('status', selectedStatus);
        }

        const { data, error } = await query;

        if (!error && data) {
          setOrders(data);

          // Calcular estadísticas
          setStats({
            total: data.length,
            pending: data.filter(o => o.status === 'pendiente').length,
            completed: data.filter(o => o.status === 'completado').length,
            revenue: data
              .filter(o => o.status === 'completado')
              .reduce((sum, o) => sum + Number(o.total_amount), 0)
          });
          return;
        }
      } catch (tableError) {
        console.log('⚠️ Tabla guest_orders no existe, usando datos de ejemplo');
      }

      // FALLBACK: Datos de ejemplo mientras las tablas se crean
      const sampleOrders: GuestOrder[] = [
        {
          id: 'sample-1',
          guest_name: 'Juan Pérez',
          guest_email: 'juan@email.com',
          guest_phone: '3011234567',
          guest_address: 'Calle 123 #45-67, Bogotá',
          order_data: {
            items: [
              { productName: 'Aguacate Hass', quantity: 2, price: 5000 },
              { productName: 'Aguacate Criollo', quantity: 1, price: 3000 }
            ]
          },
          total_amount: 13000,
          status: 'pendiente',
          delivery_date: null,
          created_at: new Date().toISOString()
        },
        {
          id: 'sample-2',
          guest_name: 'María García',
          guest_email: 'maria@email.com',
          guest_phone: '3109876543',
          guest_address: 'Av. Principal #89-12, Medellín',
          order_data: {
            items: [
              { productName: 'Aguacate Hass Premium', quantity: 3, price: 7000 }
            ]
          },
          total_amount: 21000,
          status: 'completado',
          delivery_date: new Date().toISOString().split('T')[0],
          created_at: new Date(Date.now() - 86400000).toISOString()
        }
      ];

      // Filtrar por status si es necesario
      const filteredOrders = selectedStatus === 'all'
        ? sampleOrders
        : sampleOrders.filter(o => o.status === selectedStatus);

      setOrders(filteredOrders);

      // Calcular estadísticas
      const allOrders = sampleOrders;
      setStats({
        total: allOrders.length,
        pending: allOrders.filter(o => o.status === 'pendiente').length,
        completed: allOrders.filter(o => o.status === 'completado').length,
        revenue: allOrders
          .filter(o => o.status === 'completado')
          .reduce((sum, o) => sum + Number(o.total_amount), 0)
      });

    } catch (error) {
      console.error('Error loading orders:', error);
      setOrders([]);
      setStats({ total: 0, pending: 0, completed: 0, revenue: 0 });
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    console.log('🔄 updateOrderStatus called:', { orderId, newStatus });
    setUpdatingOrderId(orderId);

    try {
      console.log('📊 Updating order in database...');
      const { data, error, status: dbStatus } = await supabase
        .from('guest_orders')
        .update({
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId)
        .select();

      console.log('💾 Database response:', { data, error, dbStatus });

      if (error) {
        console.error('❌ Database error:', error);
        throw error;
      }

      console.log('✅ Order updated successfully, refreshing data...');
      await loadOrders();

      console.log('✅ Orders refreshed successfully');
      alert(`Pedido ${newStatus === 'completado' ? 'completado' : 'cancelado'} con éxito`);

    } catch (error) {
      console.error('❌ Error updating order:', error);
      alert(`Error al actualizar el pedido: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const openOrderDetails = (order: GuestOrder) => {
    setSelectedOrder(order);
    setShowOrderModal(true);
    setIsEditingOrder(false);
    setEditedOrder({});
  };

  const closeOrderModal = () => {
    setSelectedOrder(null);
    setShowOrderModal(false);
    setIsEditingOrder(false);
    setEditedOrder({});
  };

  const startEditingOrder = () => {
    if (selectedOrder) {
      setIsEditingOrder(true);
      setEditedOrder({
        guest_name: selectedOrder.guest_name,
        guest_email: selectedOrder.guest_email,
        guest_phone: selectedOrder.guest_phone,
        guest_address: selectedOrder.guest_address
      });
    }
  };

  const cancelEditingOrder = () => {
    setIsEditingOrder(false);
    setEditedOrder({});
  };

  const saveOrderChanges = async () => {
    if (!selectedOrder || !editedOrder) return;

    setSavingOrderId(selectedOrder.id);
    try {
      console.log('💾 Saving order changes:', editedOrder);

      const { data, error, status: dbStatus } = await supabase
        .from('guest_orders')
        .update({
          guest_name: editedOrder.guest_name || selectedOrder.guest_name,
          guest_email: editedOrder.guest_email || selectedOrder.guest_email,
          guest_phone: editedOrder.guest_phone || selectedOrder.guest_phone,
          guest_address: editedOrder.guest_address || selectedOrder.guest_address,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedOrder.id)
        .select();

      console.log('💾 Save response:', { data, error, dbStatus });

      if (error) {
        console.error('❌ Error saving order:', error);
        throw error;
      }

      console.log('✅ Order saved successfully');
      alert('Pedido actualizado con éxito');

      // Update selected order with new data
      if (data && data[0]) {
        setSelectedOrder(data[0]);
      }

      // Refresh the orders list
      await loadOrders();

      // Exit editing mode
      setIsEditingOrder(false);
      setEditedOrder({});

    } catch (error) {
      console.error('❌ Error saving order:', error);
      alert(`Error al guardar el pedido: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    } finally {
      setSavingOrderId(null);
    }
  };

  const confirmDelete = (orderId: string) => {
    setOrderToDelete(orderId);
    setShowDeleteConfirm(true);
  };

  const cancelDelete = () => {
    setOrderToDelete(null);
    setShowDeleteConfirm(false);
  };

  const deleteOrder = async () => {
    if (!orderToDelete) return;

    setDeletingOrderId(orderToDelete);
    try {
      const { error } = await supabase
        .from('guest_orders')
        .delete()
        .eq('id', orderToDelete);

      if (error) throw error;

      await loadOrders();
      setShowDeleteConfirm(false);
      setOrderToDelete(null);
    } catch (error) {
      console.error('Error deleting order:', error);
      alert('Error al eliminar el pedido');
    } finally {
      setDeletingOrderId(null);
    }
  };

  const exportToCSV = () => {
    const csvContent = [
      ['Fecha', 'Cliente', 'Email', 'Telefono', 'Total', 'Estado'].join(','),
      ...orders.map(order => [
        new Date(order.created_at).toLocaleDateString('es-CO'),
        order.guest_name,
        order.guest_email,
        order.guest_phone,
        order.total_amount,
        order.status
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pedidos-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  if (authLoading || !adminUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-verde-aguacate mx-auto mb-4"></div>
          <p>Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-suave py-8">
      <div className="container mx-auto px-4">
        {/* Header with Navigation */}
        <div className="mb-8">
          {/* Warning banner for sample data */}
          <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-200 rounded-full flex items-center justify-center">
                <span className="text-amber-700">⚠️</span>
              </div>
              <div>
                <h3 className="font-semibold text-amber-800">Modo Configuración</h3>
                <p className="text-sm text-amber-700">
                  El dashboard está usando datos de ejemplo. Para ver pedidos reales,
                  ejecuta el script SQL <code>supabase/admin-setup.sql</code> en tu panel de Supabase.
                </p>
              </div>
            </div>
          </div>

          {/* Navigation Bar */}
          <div className="bg-white rounded-2xl shadow-soft p-4 mb-6">
            <nav className="flex flex-wrap items-center gap-4">
              <button
                className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all bg-gradient-to-r from-yellow-400 to-yellow-600 text-verde-bosque-700 border-2 border-verde-aguacate"
              >
                <ShoppingBag className="w-5 h-5" />
                Pedidos
              </button>
              <button
                onClick={() => router.push('/admin/products')}
                className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all bg-gray-100 text-gray-700 hover:bg-gray-200"
              >
                <Box className="w-5 h-5" />
                Productos
              </button>
              <button
                onClick={() => router.push('/admin/coupons')}
                className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all bg-gray-100 text-gray-700 hover:bg-gray-200"
              >
                <Ticket className="w-5 h-5" />
                Cupones
              </button>
            </nav>
          </div>

          {/* Dashboard Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-display font-bold mb-2">
                Dashboard Administrativo
              </h1>
              <p className="text-gray-600">Gestión de pedidos y ventas</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm text-gray-600">Administrador</p>
                <p className="font-semibold text-gray-900">{adminUser.name}</p>
                <p className="text-xs text-gray-500">{adminUser.role}</p>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors"
                title="Cerrar sesión"
              >
                <LogOut className="w-4 h-4" />
                Salir
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-soft">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm mb-1">Total Pedidos</p>
                <p className="text-3xl font-bold text-verde-bosque">{stats.total}</p>
              </div>
              <ShoppingBag className="w-12 h-12 text-yellow-500" />
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-soft">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm mb-1">Pendientes</p>
                <p className="text-3xl font-bold text-orange-600">{stats.pending}</p>
              </div>
              <Clock className="w-12 h-12 text-orange-500" />
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-soft">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm mb-1">Completados</p>
                <p className="text-3xl font-bold text-green-600">{stats.completed}</p>
              </div>
              <CheckCircle className="w-12 h-12 text-green-500" />
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-soft">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm mb-1">Ingresos</p>
                <p className="text-3xl font-bold text-verde-bosque">
                  ${stats.revenue.toLocaleString('es-CO')}
                </p>
              </div>
              <DollarSign className="w-12 h-12 text-yellow-500" />
            </div>
          </div>
        </div>

        {/* Filters and Export */}
        <div className="bg-white rounded-2xl p-6 shadow-soft mb-6">
          <div className="flex flex-col md:flex-row justify-between gap-4">
            <div className="flex gap-2">
              <button
                onClick={() => setSelectedStatus('all')}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  selectedStatus === 'all'
                    ? 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-verde-bosque-700 border-2 border-verde-aguacate'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Todos
              </button>
              <button
                onClick={() => setSelectedStatus('pendiente')}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  selectedStatus === 'pendiente'
                    ? 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-verde-bosque-700 border-2 border-verde-aguacate'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Pendientes
              </button>
              <button
                onClick={() => setSelectedStatus('completado')}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  selectedStatus === 'completado'
                    ? 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-verde-bosque-700 border-2 border-verde-aguacate'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Completados
              </button>
            </div>

            <button
              onClick={exportToCSV}
              className="flex items-center gap-2 bg-verde-bosque text-white px-6 py-2 rounded-lg hover:bg-verde-bosque-600 transition-all"
            >
              <Download className="w-4 h-4" />
              Exportar CSV
            </button>
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-white rounded-2xl shadow-soft overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Fecha</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Cliente</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Contacto</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Productos</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Total</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Estado</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                      Cargando pedidos...
                    </td>
                  </tr>
                ) : orders.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                      No hay pedidos
                    </td>
                  </tr>
                ) : (
                  orders.map((order) => (
                    <tr
                      key={order.id}
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => openOrderDetails(order)}
                    >
                      <td className="px-6 py-4 text-sm">
                        {new Date(order.created_at).toLocaleDateString('es-CO')}
                        <br />
                        <span className="text-xs text-gray-500">
                          {new Date(order.created_at).toLocaleTimeString('es-CO', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-medium">{order.guest_name}</p>
                        <p className="text-sm text-gray-600">{order.guest_address}</p>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <p>{order.guest_phone}</p>
                        <p className="text-gray-600">{order.guest_email}</p>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {order.order_data?.items?.slice(0, 2).map((item: any, idx: number) => (
                          <p key={idx} className="text-gray-700">
                            {item.productName} x{item.quantity}
                          </p>
                        ))}
                        {order.order_data?.items?.length > 2 && (
                          <p className="text-gray-500 text-xs">
                            +{order.order_data.items.length - 2} mas
                          </p>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-bold text-verde-bosque">
                          ${Number(order.total_amount).toLocaleString('es-CO')}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          order.status === 'completado'
                            ? 'bg-green-100 text-green-800'
                            : order.status === 'pendiente'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          {order.status === 'pendiente' && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                updateOrderStatus(order.id, 'completado');
                              }}
                              disabled={updatingOrderId === order.id}
                              className="text-green-600 hover:text-green-800 p-1 disabled:opacity-50"
                              title="Marcar como completado"
                            >
                              {updatingOrderId === order.id ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-2 border-green-600 border-t-transparent"></div>
                              ) : (
                                <CheckCircle className="w-5 h-5" />
                              )}
                            </button>
                          )}
                          {order.status === 'pendiente' && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                updateOrderStatus(order.id, 'cancelado');
                              }}
                              disabled={updatingOrderId === order.id}
                              className="text-red-600 hover:text-red-800 p-1 disabled:opacity-50"
                              title="Cancelar"
                            >
                              {updatingOrderId === order.id ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-2 border-red-600 border-t-transparent"></div>
                              ) : (
                                <XCircle className="w-5 h-5" />
                              )}
                            </button>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              confirmDelete(order.id);
                            }}
                            disabled={deletingOrderId === order.id}
                            className="text-red-600 hover:text-red-800 p-1 disabled:opacity-50"
                            title="Eliminar pedido"
                          >
                            {deletingOrderId === order.id ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-2 border-red-600 border-t-transparent"></div>
                            ) : (
                              <Trash2 className="w-5 h-5" />
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

        {/* Order Details Modal */}
        {showOrderModal && selectedOrder && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900">Detalles del Pedido</h2>
                <button
                  onClick={closeOrderModal}
                  className="text-gray-500 hover:text-gray-700 p-2"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* Customer Information */}
                <div className="bg-gray-50 rounded-xl p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <User className="w-5 h-5 text-gray-600" />
                      Información del Cliente
                    </h3>
                    {!isEditingOrder ? (
                      <button
                        onClick={startEditingOrder}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg text-sm flex items-center gap-1"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Editar
                      </button>
                    ) : (
                      <div className="flex gap-2">
                        <button
                          onClick={saveOrderChanges}
                          disabled={savingOrderId === selectedOrder.id}
                          className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-3 py-1 rounded-lg text-sm flex items-center gap-1"
                        >
                          {savingOrderId === selectedOrder.id ? (
                            <div className="animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent"></div>
                          ) : (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                          Guardar
                        </button>
                        <button
                          onClick={cancelEditingOrder}
                          disabled={savingOrderId === selectedOrder.id}
                          className="bg-gray-600 hover:bg-gray-700 disabled:bg-gray-400 text-white px-3 py-1 rounded-lg text-sm flex items-center gap-1"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          Cancelar
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-3">
                      <User className="w-4 h-4 text-gray-500" />
                      <div className="flex-1">
                        <p className="text-sm text-gray-500">Nombre</p>
                        {!isEditingOrder ? (
                          <p className="font-medium">{selectedOrder.guest_name}</p>
                        ) : (
                          <input
                            type="text"
                            value={editedOrder.guest_name || selectedOrder.guest_name}
                            onChange={(e) => setEditedOrder({ ...editedOrder, guest_name: e.target.value })}
                            className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Mail className="w-4 h-4 text-gray-500" />
                      <div className="flex-1">
                        <p className="text-sm text-gray-500">Email</p>
                        {!isEditingOrder ? (
                          <p className="font-medium">{selectedOrder.guest_email}</p>
                        ) : (
                          <input
                            type="email"
                            value={editedOrder.guest_email || selectedOrder.guest_email}
                            onChange={(e) => setEditedOrder({ ...editedOrder, guest_email: e.target.value })}
                            className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Phone className="w-4 h-4 text-gray-500" />
                      <div className="flex-1">
                        <p className="text-sm text-gray-500">Teléfono</p>
                        {!isEditingOrder ? (
                          <p className="font-medium">{selectedOrder.guest_phone}</p>
                        ) : (
                          <input
                            type="tel"
                            value={editedOrder.guest_phone || selectedOrder.guest_phone}
                            onChange={(e) => setEditedOrder({ ...editedOrder, guest_phone: e.target.value })}
                            className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        )}
                      </div>
                    </div>
                    <div className="flex items-start gap-3 md:col-span-2">
                      <MapPin className="w-4 h-4 text-gray-500 mt-2" />
                      <div className="flex-1">
                        <p className="text-sm text-gray-500">Dirección</p>
                        {!isEditingOrder ? (
                          <p className="font-medium">{selectedOrder.guest_address}</p>
                        ) : (
                          <textarea
                            value={editedOrder.guest_address || selectedOrder.guest_address}
                            onChange={(e) => setEditedOrder({ ...editedOrder, guest_address: e.target.value })}
                            rows={2}
                            className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Order Information */}
                <div className="bg-blue-50 rounded-xl p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <PackageIcon className="w-5 h-5 text-blue-600" />
                    Información del Pedido
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center gap-3">
                      <Calendar className="w-4 h-4 text-blue-500" />
                      <div>
                        <p className="text-sm text-gray-500">Fecha del Pedido</p>
                        <p className="font-medium">
                          {new Date(selectedOrder.created_at).toLocaleDateString('es-CO')}{' '}
                          {new Date(selectedOrder.created_at).toLocaleTimeString('es-CO', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                    {selectedOrder.delivery_date && (
                      <div className="flex items-center gap-3">
                        <Calendar className="w-4 h-4 text-blue-500" />
                        <div>
                          <p className="text-sm text-gray-500">Fecha de Entrega</p>
                          <p className="font-medium">{selectedOrder.delivery_date}</p>
                        </div>
                      </div>
                    )}
                    <div className="flex items-center gap-3">
                      <CreditCard className="w-4 h-4 text-blue-500" />
                      <div>
                        <p className="text-sm text-gray-500">Total</p>
                        <p className="font-bold text-lg text-green-600">
                          ${Number(selectedOrder.total_amount).toLocaleString('es-CO')}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Products */}
                <div className="bg-green-50 rounded-xl p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Package className="w-5 h-5 text-green-600" />
                    Productos del Pedido
                  </h3>
                  <div className="space-y-3">
                    {selectedOrder.order_data?.items?.map((item: any, idx: number) => (
                      <div key={idx} className="bg-white rounded-lg p-4 flex justify-between items-center">
                        <div>
                          <p className="font-medium">{item.productName}</p>
                          {item.variantName && (
                            <p className="text-sm text-gray-500">Variante: {item.variantName}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="font-medium">${Number(item.price).toLocaleString('es-CO')}</p>
                          <p className="text-sm text-gray-500">x{item.quantity}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Status Management */}
                <div className="bg-yellow-50 rounded-xl p-6">
                  <h3 className="text-lg font-semibold mb-4">Gestión de Estado</h3>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Estado Actual</p>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        selectedOrder.status === 'completado'
                          ? 'bg-green-100 text-green-800'
                          : selectedOrder.status === 'pendiente'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {selectedOrder.status}
                      </span>
                    </div>
                    <div className="flex gap-3">
                      {selectedOrder.status === 'pendiente' && (
                        <>
                          <button
                            onClick={() => {
                              updateOrderStatus(selectedOrder.id, 'completado');
                              closeOrderModal();
                            }}
                            disabled={updatingOrderId === selectedOrder.id}
                            className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                          >
                            {updatingOrderId === selectedOrder.id ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                            ) : (
                              <CheckCircle className="w-4 h-4" />
                            )}
                            Marcar Completado
                          </button>
                          <button
                            onClick={() => {
                              updateOrderStatus(selectedOrder.id, 'cancelado');
                              closeOrderModal();
                            }}
                            disabled={updatingOrderId === selectedOrder.id}
                            className="bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                          >
                            {updatingOrderId === selectedOrder.id ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                            ) : (
                              <XCircle className="w-4 h-4" />
                            )}
                            Cancelar
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
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
                ¿Estás seguro de que quieres eliminar este pedido? Esta acción no se puede deshacer y el pedido se eliminará permanentemente de la base de datos.
              </p>

              <div className="flex gap-3 justify-end">
                <button
                  onClick={cancelDelete}
                  disabled={deletingOrderId !== null}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={deleteOrder}
                  disabled={deletingOrderId !== null}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg disabled:opacity-50 flex items-center gap-2"
                >
                  {deletingOrderId ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      Eliminando...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      Eliminar Pedido
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
