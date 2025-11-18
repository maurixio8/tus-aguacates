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
      // Usar datos de ejemplo para el dashboard demo
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

      // Calcular estadísticas basadas en todos los pedidos
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
            <button
              onClick={() => router.push('/admin/pedidos')}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 font-medium flex items-center gap-2"
            >
              ➕ Nuevo Pedido Manual
            </button>
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
                        <button className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 font-medium">
                          📄 Ver
                        </button>
                        {order.status === 'pendiente' && (
                          <button className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 font-medium">
                            ✅ Completar
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
