'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ShoppingBag,
  Users,
  DollarSign,
  TrendingUp,
  Package,
  Clock,
  CheckCircle,
  Download,
  Trash2,
  X,
  User,
  Phone,
  MapPin,
  Calendar,
  Package as PackageIcon,
  CreditCard
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

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
    total: 2,
    pending: 1,
    completed: 1,
    revenue: 21000
  });
  const [loading, setLoading] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  
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
      // Add timeout to prevent hanging
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

      const response = await fetch('/api/auth/admin/me', {
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      const data = await response.json();

      if (data.success && data.user) {
        setAdminUser(data.user);
      } else {
        router.push('/admin/login');
      }
    } catch (error) {
      console.error('Auth check error:', error);
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('Auth check timed out - redirecting to login');
      }
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
      console.log('📊 [Dashboard] Cargando pedidos desde API...');
      
      // ✅ USAR API ROUTE PARA PEDIDOS
      const response = await fetch('/api/admin/orders');
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Error cargando pedidos');
      }

      console.log('✅ [Dashboard] Pedidos cargados:', data.orders?.length || 0);

      // Filtrar por status si es necesario
      const filteredOrders = selectedStatus === 'all'
        ? data.orders || []
        : (data.orders || []).filter((o: GuestOrder) => o.status === selectedStatus);

      setOrders(filteredOrders);

      // Calcular estadísticas basadas en datos reales
      const allOrders = data.orders || [];
      const realStats = {
        total: allOrders.length,
        pending: allOrders.filter((o: GuestOrder) => o.status === 'pendiente').length,
        completed: allOrders.filter((o: GuestOrder) => o.status === 'completado').length,
        revenue: allOrders
          .filter((o: GuestOrder) => o.status === 'completado')
          .reduce((sum: number, o: GuestOrder) => sum + Number(o.total_amount), 0)
      };

      console.log('📈 [Dashboard] Estadísticas reales:', realStats);
      setStats(realStats);

    } catch (error) {
      console.error('❌ [Dashboard] Error en loadOrders:', error);
      setOrders([]);
      setStats({ total: 0, pending: 0, completed: 0, revenue: 0 });
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      console.log(`🔄 [Dashboard] Actualizando pedido ${orderId} a ${newStatus}`);
      
      // ✅ USAR API ROUTE PARA ACTUALIZAR
      const response = await fetch('/api/admin/orders', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: orderId,
          status: newStatus,
          ...(newStatus === 'completado' && { delivery_date: new Date().toISOString().split('T')[0] })
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Error actualizando pedido');
      }

      console.log(`✅ [Dashboard] Pedido ${orderId} actualizado exitosamente`);
      
      // Recargar datos para reflejar cambios
      await loadOrders();
      
    } catch (error) {
      console.error('❌ [Dashboard] Error en updateOrderStatus:', error);
      alert('Error al actualizar el estado del pedido. Por favor intenta nuevamente.');
    }
  };

  const viewOrderDetails = (order: GuestOrder) => {
    const items = order.order_data?.items || [];
    const itemsList = items.map((item: any, index: number) =>
      `${item.productName} x${item.quantity} = $${(item.quantity * item.price).toLocaleString('es-CO')}`
    ).join('\n');
    
    alert(`📋 DETALLES DEL PEDIDO #${order.id.slice(0, 8)}...\n\n` +
          `👤 Cliente: ${order.guest_name}\n` +
          `📧 Email: ${order.guest_email}\n` +
          `📞 Teléfono: ${order.guest_phone}\n` +
          `📍 Dirección: ${order.guest_address}\n\n` +
          `🛒 Productos:\n${itemsList}\n\n` +
          `💰 Total: $${Number(order.total_amount).toLocaleString('es-CO')}\n` +
          `📅 Fecha: ${new Date(order.created_at).toLocaleString('es-CO')}\n` +
          `📦 Estado: ${order.status.toUpperCase()}`);
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
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p>Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  const filteredOrders = selectedStatus === 'all'
    ? orders
    : orders.filter(o => o.status === selectedStatus);

  return (
    <div>
      {/* Dashboard Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">📊 Dashboard Administrativo</h1>
            <p className="text-gray-600">
              Resumen de pedidos y gestión de la tienda
            </p>
          </div>
          <div className="flex gap-3">
            <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 font-medium flex items-center gap-2">
              📥 Exportar Reporte
            </button>
            <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-medium flex items-center gap-2">
              🔄 Actualizar Datos
            </button>
          </div>
        </div>

              </div>

        {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Pedidos</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-2xl">📦</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Pendientes</p>
              <p className="text-2xl font-bold text-orange-600">{stats.pending}</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
              <span className="text-2xl">⏰</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Completados</p>
              <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <span className="text-2xl">✅</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Ingresos</p>
              <p className="text-2xl font-bold text-gray-900">
                ${stats.revenue.toLocaleString('es-CO')}
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
              <span className="text-2xl">💰</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex flex-col md:flex-row justify-between gap-4">
          <div className="flex gap-2">
            <button
              onClick={() => setSelectedStatus('all')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedStatus === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => setSelectedStatus('pendiente')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedStatus === 'pendiente'
                  ? 'bg-orange-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Pendientes
            </button>
            <button
              onClick={() => setSelectedStatus('completado')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedStatus === 'completado'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Completados
            </button>
          </div>

          <button
            onClick={exportToCSV}
            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            Exportar CSV
          </button>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">Fecha</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">Cliente</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">Contacto</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">Productos</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">Total</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">Estado</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    No hay pedidos para mostrar
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr
                    key={order.id}
                    className="border-b hover:bg-gray-50 transition-colors"
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
                          +{order.order_data.items.length - 2} más
                        </p>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-bold text-green-600">
                        ${Number(order.total_amount).toLocaleString('es-CO')}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        order.status === 'completado'
                          ? 'bg-green-100 text-green-800'
                          : order.status === 'pendiente'
                          ? 'bg-orange-100 text-orange-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => viewOrderDetails(order)}
                          className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 font-medium"
                        >
                          📄 Ver
                        </button>
                        {order.status === 'pendiente' && (
                          <button
                            onClick={() => updateOrderStatus(order.id, 'completado')}
                            className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 font-medium"
                          >
                            ✅ Completar
                          </button>
                        )}
                        {order.status === 'pendiente' && (
                          <button
                            onClick={() => updateOrderStatus(order.id, 'cancelado')}
                            className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 font-medium"
                          >
                            ❌ Cancelar
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

          </div>
  );
}
