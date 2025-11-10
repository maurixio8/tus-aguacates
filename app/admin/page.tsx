'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
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
  Download
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

export default function AdminDashboard() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState<GuestOrder[]>([]);
  const [stats, setStats] = useState<OrderStats>({
    total: 0,
    pending: 0,
    completed: 0,
    revenue: 0
  });
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      loadOrders();
    }
  }, [user, selectedStatus]);

  const loadOrders = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('guest_orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (selectedStatus !== 'all') {
        query = query.eq('status', selectedStatus);
      }

      const { data, error } = await query;

      if (error) throw error;

      setOrders(data || []);

      // Calcular estadísticas
      const allOrders = data || [];
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
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('guest_orders')
        .update({ status: newStatus })
        .eq('id', orderId);

      if (error) throw error;

      await loadOrders();
    } catch (error) {
      console.error('Error updating order:', error);
      alert('Error al actualizar el pedido');
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

  if (authLoading || !user) {
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
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-display font-bold mb-2">
            Dashboard Administrativo
          </h1>
          <p className="text-gray-600">Gestion de pedidos y ventas</p>
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
                    <tr key={order.id} className="hover:bg-gray-50">
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
                              onClick={() => updateOrderStatus(order.id, 'completado')}
                              className="text-green-600 hover:text-green-800 p-1"
                              title="Marcar como completado"
                            >
                              <CheckCircle className="w-5 h-5" />
                            </button>
                          )}
                          {order.status === 'pendiente' && (
                            <button
                              onClick={() => updateOrderStatus(order.id, 'cancelado')}
                              className="text-red-600 hover:text-red-800 p-1"
                              title="Cancelar"
                            >
                              <XCircle className="w-5 h-5" />
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
    </div>
  );
}
