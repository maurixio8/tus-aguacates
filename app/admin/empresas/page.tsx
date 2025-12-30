'use client';

import { useEffect, useState } from 'react';
import {
  TrendingUp,
  ShoppingBag,
  Clock,
  Package,
  DollarSign,
  Users,
  Building2,
  ArrowUpRight,
  Calendar,
  Truck
} from 'lucide-react';
import Link from 'next/link';

interface B2BMetrics {
  today: {
    orders: number;
    revenue: number;
  };
  week: {
    orders: number;
    revenue: number;
  };
  month: {
    orders: number;
    revenue: number;
  };
  pending: {
    count: number;
  };
  recentOrders: Array<{
    id: string;
    order_number: string;
    customer_name: string;
    company_name?: string;
    total: number;
    status: string;
    created_at: string;
  }>;
  topProducts: Array<{
    name: string;
    quantity: number;
    revenue: number;
  }>;
  topClients: Array<{
    name: string;
    company: string;
    orders: number;
    total: number;
  }>;
}

export default function EmpresasAdminDashboard() {
  const [metrics, setMetrics] = useState<B2BMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadMetrics();
  }, []);

  const loadMetrics = async () => {
    try {
      const response = await fetch('/api/admin/empresas/metrics', {
        credentials: 'include',
      });
      const data = await response.json();

      if (data.success) {
        setMetrics(data.metrics);
      } else {
        // Si no hay API aún, usar datos de ejemplo
        setMetrics({
          today: { orders: 0, revenue: 0 },
          week: { orders: 0, revenue: 0 },
          month: { orders: 0, revenue: 0 },
          pending: { count: 0 },
          recentOrders: [],
          topProducts: [],
          topClients: []
        });
      }
    } catch (err) {
      console.error('Error cargando métricas B2B:', err);
      // Usar datos vacíos si hay error
      setMetrics({
        today: { orders: 0, revenue: 0 },
        week: { orders: 0, revenue: 0 },
        month: { orders: 0, revenue: 0 },
        pending: { count: 0 },
        recentOrders: [],
        topProducts: [],
        topClients: []
      });
    } finally {
      setLoading(false);
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
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; color: string }> = {
      pending: { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-700' },
      confirmed: { label: 'Confirmado', color: 'bg-blue-100 text-blue-700' },
      processing: { label: 'En Preparación', color: 'bg-purple-100 text-purple-700' },
      shipped: { label: 'En Camino', color: 'bg-blue-100 text-blue-600' },
      delivered: { label: 'Entregado', color: 'bg-green-100 text-green-700' },
      cancelled: { label: 'Cancelado', color: 'bg-red-100 text-red-700' },
    };
    const config = statusConfig[status] || statusConfig.pending;
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const stats = [
    {
      name: 'Ventas Hoy',
      value: formatCurrency(metrics?.today?.revenue || 0),
      subtext: `${metrics?.today?.orders || 0} pedidos`,
      icon: TrendingUp,
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-700',
    },
    {
      name: 'Pedidos Pendientes',
      value: metrics?.pending?.count || 0,
      subtext: 'Requieren atención',
      icon: Clock,
      color: 'from-yellow-500 to-yellow-600',
      bgColor: 'bg-yellow-50',
      textColor: 'text-yellow-700',
    },
    {
      name: 'Ventas Semana',
      value: formatCurrency(metrics?.week?.revenue || 0),
      subtext: `${metrics?.week?.orders || 0} pedidos`,
      icon: Calendar,
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50',
      textColor: 'text-green-700',
    },
    {
      name: 'Ventas del Mes',
      value: formatCurrency(metrics?.month?.revenue || 0),
      subtext: `${metrics?.month?.orders || 0} pedidos`,
      icon: DollarSign,
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-700',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            Dashboard B2B
          </h1>
          <p className="text-gray-600 mt-1">Gestión de ventas empresariales - Tus Aguacates</p>
        </div>
        <Link
          href="/admin/empresas/crear-pedido"
          className="hidden md:flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
        >
          <ShoppingBag className="w-5 h-5" />
          Nuevo Pedido B2B
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.name}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                  <p className="text-sm text-gray-500 mt-1">{stat.subtext}</p>
                </div>
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-sm`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Grid de contenido */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pedidos Recientes B2B */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-gray-900">Pedidos Recientes B2B</h2>
            </div>
            <Link
              href="/admin/empresas/pedidos"
              className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
            >
              Ver todos
              <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>
          {metrics?.recentOrders && metrics.recentOrders.length > 0 ? (
            <div className="space-y-3">
              {metrics.recentOrders.slice(0, 5).map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <Building2 className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        #{order.order_number || order.id.substring(0, 8)}
                      </p>
                      <p className="text-sm text-gray-500">
                        {order.company_name || order.customer_name || 'Cliente'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-blue-600">{formatCurrency(order.total)}</p>
                    <div className="mt-1">{getStatusBadge(order.status)}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <ShoppingBag className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No hay pedidos B2B recientes</p>
              <Link
                href="/admin/empresas/crear-pedido"
                className="mt-3 inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700"
              >
                Crear primer pedido
                <ArrowUpRight className="w-4 h-4" />
              </Link>
            </div>
          )}
        </div>

        {/* Productos Más Vendidos B2B */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Package className="w-5 h-5 text-green-600" />
              <h2 className="text-lg font-semibold text-gray-900">Top Productos B2B</h2>
            </div>
            <Link
              href="/admin/empresas/productos"
              className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
            >
              Ver catálogo
              <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>
          {metrics?.topProducts && metrics.topProducts.length > 0 ? (
            <div className="space-y-3">
              {metrics.topProducts.slice(0, 5).map((product, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-green-100 text-green-700 text-xs font-bold flex items-center justify-center">
                      {index + 1}
                    </span>
                    <div>
                      <p className="font-medium text-gray-900">{product.name}</p>
                      <p className="text-sm text-gray-500">{product.quantity} unidades</p>
                    </div>
                  </div>
                  <p className="font-semibold text-green-600">{formatCurrency(product.revenue)}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">Sin datos de productos</p>
            </div>
          )}
        </div>
      </div>

      {/* Mejores Clientes B2B */}
      {metrics?.topClients && metrics.topClients.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-purple-600" />
              <h2 className="text-lg font-semibold text-gray-900">Mejores Clientes Empresariales</h2>
            </div>
            <Link
              href="/admin/empresas/clientes"
              className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
            >
              Ver todos
              <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {metrics.topClients.slice(0, 4).map((client, index) => (
              <div
                key={index}
                className="p-4 bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl border border-purple-100"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-purple-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 truncate">{client.company || client.name}</p>
                    <p className="text-xs text-gray-500">{client.orders} pedidos</p>
                  </div>
                </div>
                <p className="text-lg font-bold text-purple-600">{formatCurrency(client.total)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Acciones Rápidas */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Acciones Rápidas</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link
            href="/admin/empresas/crear-pedido"
            className="flex flex-col items-center justify-center p-4 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors border border-blue-200"
          >
            <ShoppingBag className="w-8 h-8 text-blue-600 mb-2" />
            <span className="text-sm font-medium text-blue-700">Nuevo Pedido B2B</span>
          </Link>
          <Link
            href="/admin/empresas/pedidos?status=pending"
            className="flex flex-col items-center justify-center p-4 bg-yellow-50 hover:bg-yellow-100 rounded-xl transition-colors border border-yellow-200"
          >
            <Clock className="w-8 h-8 text-yellow-600 mb-2" />
            <span className="text-sm font-medium text-yellow-700">Ver Pendientes</span>
          </Link>
          <Link
            href="/admin/empresas/productos"
            className="flex flex-col items-center justify-center p-4 bg-green-50 hover:bg-green-100 rounded-xl transition-colors border border-green-200"
          >
            <Package className="w-8 h-8 text-green-600 mb-2" />
            <span className="text-sm font-medium text-green-700">Productos B2B</span>
          </Link>
          <Link
            href="/admin/empresas/reportes"
            className="flex flex-col items-center justify-center p-4 bg-purple-50 hover:bg-purple-100 rounded-xl transition-colors border border-purple-200"
          >
            <TrendingUp className="w-8 h-8 text-purple-600 mb-2" />
            <span className="text-sm font-medium text-purple-700">Reportes B2B</span>
          </Link>
        </div>
      </div>

      {/* Info B2B */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-6 text-white">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold mb-1">Portal de Ventas Empresariales</h3>
            <p className="text-blue-100 text-sm">
              Este dashboard está diseñado para gestionar pedidos B2B con precios mayoristas.
              Los pedidos de empresas se manejan de forma independiente a la tienda familiar.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <div className="bg-white/20 rounded-lg px-3 py-1.5 text-sm">
                <span className="opacity-80">Precios:</span> <strong>Mayoristas</strong>
              </div>
              <div className="bg-white/20 rounded-lg px-3 py-1.5 text-sm">
                <span className="opacity-80">Pedidos:</span> <strong>B2B</strong>
              </div>
              <div className="bg-white/20 rounded-lg px-3 py-1.5 text-sm">
                <span className="opacity-80">Clientes:</span> <strong>Empresariales</strong>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
