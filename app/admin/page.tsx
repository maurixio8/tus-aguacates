'use client';

import { useEffect, useState } from 'react';
import { TrendingUp, ShoppingBag, Clock, Package, DollarSign, Users, ChefHat } from 'lucide-react';

interface Metrics {
  today: {
    orders: number;
    revenue: number;
    topProducts: Array<{ name: string; quantity: number; revenue: number }>;
  };
  pending: {
    count: number;
  };
  tomorrow: {
    ordersCount: number;
    products: Array<{ name: string; quantity: number }>;
  };
  week: {
    orders: number;
    revenue: number;
  };
  categoryStats: Record<string, number>;
}

export default function AdminDashboardPage() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadMetrics();
  }, []);

  const loadMetrics = async () => {
    try {
      const response = await fetch('/api/admin/metrics', {
        credentials: 'include',
      });
      const data = await response.json();

      if (data.success) {
        setMetrics(data.metrics);
      } else {
        setError(data.error || 'Error al cargar métricas');
      }
    } catch (err) {
      console.error('Error cargando métricas:', err);
      setError('Error de conexión');
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
        <p className="text-red-700">{error}</p>
        <button
          onClick={loadMetrics}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          Reintentar
        </button>
      </div>
    );
  }

  const stats = [
    {
      name: 'Ventas Hoy',
      value: formatCurrency(metrics?.today?.revenue || 0),
      subtext: `${metrics?.today?.orders || 0} pedidos`,
      icon: TrendingUp,
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50',
      textColor: 'text-green-700',
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
      name: 'Entregas Mañana',
      value: metrics?.tomorrow?.ordersCount || 0,
      subtext: 'Pedidos programados',
      icon: Package,
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-700',
    },
    {
      name: 'Ventas Semana',
      value: formatCurrency(metrics?.week?.revenue || 0),
      subtext: `${metrics?.week?.orders || 0} pedidos`,
      icon: DollarSign,
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-700',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Resumen ejecutivo de Tus Aguacates</p>
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
        {/* Productos Más Vendidos Hoy */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <ShoppingBag className="w-5 h-5 text-green-600" />
            <h2 className="text-lg font-semibold text-gray-900">Productos Más Vendidos Hoy</h2>
          </div>
          {metrics?.today?.topProducts && metrics.today.topProducts.length > 0 ? (
            <div className="space-y-3">
              {metrics.today.topProducts.slice(0, 5).map((product, index) => (
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
            <p className="text-gray-500 text-center py-8">No hay ventas hoy</p>
          )}
        </div>

        {/* Productos para Entregar Mañana */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Package className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">Entregas para Mañana</h2>
          </div>
          {metrics?.tomorrow?.products && metrics.tomorrow.products.length > 0 ? (
            <div className="grid grid-cols-2 gap-3">
              {metrics.tomorrow.products.map((product, index) => (
                <div
                  key={index}
                  className="p-3 bg-blue-50 rounded-lg border border-blue-100"
                >
                  <p className="font-medium text-gray-900 text-sm">{product.name}</p>
                  <p className="text-xl font-bold text-blue-600 mt-1">
                    {product.quantity} <span className="text-sm font-normal">unidades</span>
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No hay entregas programadas</p>
          )}
        </div>
      </div>

      {/* Ventas por Categoría */}
      {metrics?.categoryStats && Object.keys(metrics.categoryStats).length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Ventas por Categoría (Últimos 7 días)</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Object.entries(metrics.categoryStats)
              .sort((a, b) => b[1] - a[1])
              .slice(0, 8)
              .map(([category, revenue]) => (
                <div key={category} className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600 truncate">{category}</p>
                  <p className="text-lg font-bold text-gray-900 mt-1">{formatCurrency(revenue)}</p>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Acciones Rápidas */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Acciones Rápidas</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <a
            href="/admin/crear-pedido"
            className="flex flex-col items-center justify-center p-4 bg-green-50 hover:bg-green-100 rounded-xl transition-colors border border-green-200"
          >
            <ShoppingBag className="w-8 h-8 text-green-600 mb-2" />
            <span className="text-sm font-medium text-green-700">Nuevo Pedido</span>
          </a>
          <a
            href="/admin/pedidos?status=pendiente"
            className="flex flex-col items-center justify-center p-4 bg-yellow-50 hover:bg-yellow-100 rounded-xl transition-colors border border-yellow-200"
          >
            <Clock className="w-8 h-8 text-yellow-600 mb-2" />
            <span className="text-sm font-medium text-yellow-700">Ver Pendientes</span>
          </a>
          <a
            href="/admin/productos"
            className="flex flex-col items-center justify-center p-4 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors border border-blue-200"
          >
            <Package className="w-8 h-8 text-blue-600 mb-2" />
            <span className="text-sm font-medium text-blue-700">Productos</span>
          </a>
          <a
            href="/admin/recetas/categorias"
            className="flex flex-col items-center justify-center p-4 bg-orange-50 hover:bg-orange-100 rounded-xl transition-colors border border-orange-200"
          >
            <ChefHat className="w-8 h-8 text-orange-600 mb-2" />
            <span className="text-sm font-medium text-orange-700">Cat. Recetas</span>
          </a>
          <a
            href="/admin/reportes"
            className="flex flex-col items-center justify-center p-4 bg-purple-50 hover:bg-purple-100 rounded-xl transition-colors border border-purple-200"
          >
            <TrendingUp className="w-8 h-8 text-purple-600 mb-2" />
            <span className="text-sm font-medium text-purple-700">Reportes</span>
          </a>
        </div>
      </div>
    </div>
  );
}
