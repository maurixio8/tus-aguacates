'use client';

import { useState, useEffect } from 'react';
import {
  Package,
  Clock,
  CheckCircle,
  XCircle,
  Truck,
  Download,
  Search,
  Filter
} from 'lucide-react';

interface Order {
  id: string;
  guest_name: string;
  guest_email: string;
  guest_phone: string;
  guest_address: string;
  order_data: any;
  total_amount: number;
  status: 'pendiente' | 'en_proceso' | 'enviado' | 'entregado' | 'cancelado';
  delivery_date: string | null;
  created_at: string;
}

interface OrderStats {
  total: number;
  pendiente: number;
  en_proceso: number;
  enviado: number;
  entregado: number;
  cancelado: number;
  revenue: number;
}

export default function PedidosPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<OrderStats>({
    total: 0,
    pendiente: 0,
    en_proceso: 0,
    enviado: 0,
    entregado: 0,
    cancelado: 0,
    revenue: 0
  });
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    setLoading(true);
    try {
      // TODO: Implementar llamada a API de pedidos
      // const response = await fetch('/api/admin/orders');
      // const data = await response.json();

      // Datos de ejemplo por ahora
      const sampleOrders: Order[] = [];

      setOrders(sampleOrders);
      calculateStats(sampleOrders);
    } catch (error) {
      console.error('Error cargando pedidos:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (orderList: Order[]) => {
    setStats({
      total: orderList.length,
      pendiente: orderList.filter(o => o.status === 'pendiente').length,
      en_proceso: orderList.filter(o => o.status === 'en_proceso').length,
      enviado: orderList.filter(o => o.status === 'enviado').length,
      entregado: orderList.filter(o => o.status === 'entregado').length,
      cancelado: orderList.filter(o => o.status === 'cancelado').length,
      revenue: orderList
        .filter(o => o.status === 'entregado')
        .reduce((sum, o) => sum + Number(o.total_amount), 0)
    });
  };

  const filteredOrders = orders.filter(order => {
    const matchesStatus = selectedStatus === 'all' || order.status === selectedStatus;
    const matchesSearch = !searchTerm ||
      order.guest_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.guest_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.guest_phone.includes(searchTerm);
    return matchesStatus && matchesSearch;
  });

  const getStatusColor = (status: string) => {
    const colors = {
      pendiente: 'bg-yellow-100 text-yellow-800',
      en_proceso: 'bg-blue-100 text-blue-800',
      enviado: 'bg-purple-100 text-purple-800',
      entregado: 'bg-green-100 text-green-800',
      cancelado: 'bg-red-100 text-red-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (status: string) => {
    const icons = {
      pendiente: <Clock className="w-4 h-4" />,
      en_proceso: <Package className="w-4 h-4" />,
      enviado: <Truck className="w-4 h-4" />,
      entregado: <CheckCircle className="w-4 h-4" />,
      cancelado: <XCircle className="w-4 h-4" />
    };
    return icons[status as keyof typeof icons] || null;
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Gestión de Pedidos</h1>
            <p className="text-gray-600">
              Administra y realiza seguimiento de todos los pedidos
            </p>
          </div>
          <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 font-medium flex items-center gap-2">
            <Download className="w-4 h-4" />
            Exportar Reporte
          </button>
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
              <Package className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Pendientes</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.pendiente}</p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Entregados</p>
              <p className="text-2xl font-bold text-green-600">{stats.entregado}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
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
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por cliente, email o teléfono..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 p-3 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
            />
          </div>
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
                  ? 'bg-yellow-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Pendientes
            </button>
            <button
              onClick={() => setSelectedStatus('entregado')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedStatus === 'entregado'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Entregados
            </button>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando pedidos...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="p-12 text-center text-gray-600">
            <Package className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <p className="text-lg font-medium mb-2">No hay pedidos</p>
            <p className="text-sm">
              {searchTerm || selectedStatus !== 'all'
                ? 'No se encontraron pedidos con los filtros aplicados'
                : 'Aún no hay pedidos registrados en el sistema'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">ID</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">Fecha</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">Cliente</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">Contacto</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">Total</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">Estado</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => (
                  <tr
                    key={order.id}
                    className="border-b hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4 text-sm font-mono text-gray-600">
                      #{order.id.slice(0, 8)}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {new Date(order.created_at).toLocaleDateString('es-CO')}
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium">{order.guest_name}</p>
                      <p className="text-sm text-gray-600">{order.guest_address}</p>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <p>{order.guest_phone}</p>
                      <p className="text-gray-600">{order.guest_email}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-bold text-green-600">
                        ${Number(order.total_amount).toLocaleString('es-CO')}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1 w-fit ${getStatusColor(order.status)}`}>
                        {getStatusIcon(order.status)}
                        {order.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 font-medium">
                        Ver detalles
                      </button>
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
