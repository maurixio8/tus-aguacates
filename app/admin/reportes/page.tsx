'use client';

import { useEffect, useState } from 'react';
import {
  BarChart3,
  TrendingUp,
  Package,
  DollarSign,
  Calendar,
  Download,
  RefreshCw
} from 'lucide-react';

interface SalesSummary {
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  ordersByStatus: Record<string, number>;
}

interface TopProduct {
  name: string;
  quantity: number;
  revenue: number;
}

interface CategorySales {
  category: string;
  revenue: number;
  orders: number;
}

interface DailySales {
  date: string;
  revenue: number;
  orders: number;
}

export default function ReportsPage() {
  const [dateFrom, setDateFrom] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date.toISOString().split('T')[0];
  });
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().split('T')[0]);
  const [salesSummary, setSalesSummary] = useState<SalesSummary | null>(null);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [salesByCategory, setSalesByCategory] = useState<CategorySales[]>([]);
  const [dailySales, setDailySales] = useState<DailySales[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReports();
  }, [dateFrom, dateTo]);

  const loadReports = async () => {
    setLoading(true);
    try {
      const filters = `dateFrom=${dateFrom}&dateTo=${dateTo}`;

      const [summaryRes, productsRes, categoryRes, dailyRes] = await Promise.all([
        fetch(`/api/admin/reports/?type=sales_summary&${filters}`, { credentials: 'include' }),
        fetch(`/api/admin/reports/?type=top_products&${filters}`, { credentials: 'include' }),
        fetch(`/api/admin/reports/?type=sales_by_category&${filters}`, { credentials: 'include' }),
        fetch(`/api/admin/reports/?type=daily_sales&${filters}`, { credentials: 'include' }),
      ]);

      const [summary, products, categories, daily] = await Promise.all([
        summaryRes.json(),
        productsRes.json(),
        categoryRes.json(),
        dailyRes.json(),
      ]);

      if (summary.success) setSalesSummary(summary.report);
      if (products.success) setTopProducts(products.report?.products || []);
      if (categories.success) setSalesByCategory(categories.report?.categories || []);
      if (daily.success) setDailySales(daily.report?.daily || []);
    } catch (error) {
      console.error('Error cargando reportes:', error);
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
    return new Date(dateString + 'T00:00:00').toLocaleDateString('es-CO', {
      month: 'short',
      day: 'numeric',
    });
  };

  // Calcular máximo para las barras
  const maxDailyRevenue = Math.max(...dailySales.map(d => d.revenue), 1);
  const maxProductRevenue = Math.max(...topProducts.map(p => p.revenue), 1);
  const maxCategoryRevenue = Math.max(...salesByCategory.map(c => c.revenue), 1);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Reportes y Análisis</h1>
          <p className="text-gray-600 mt-1">Insights de ventas y rendimiento del negocio</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-500" />
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none text-sm"
            />
            <span className="text-gray-500">-</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none text-sm"
            />
          </div>
          <button
            onClick={loadReports}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Resumen */}
      {salesSummary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Pedidos</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{salesSummary.totalOrders}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Ingresos Totales</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {formatCurrency(salesSummary.totalRevenue)}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Ticket Promedio</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {formatCurrency(salesSummary.averageOrderValue)}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-500 to-yellow-600 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Entregados</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {salesSummary.ordersByStatus?.entregado || 0}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
                <Package className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ventas Diarias */}
        {dailySales.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Ventas Diarias</h2>
            <div className="space-y-3">
              {dailySales.slice(-14).map((day) => (
                <div key={day.date} className="flex items-center gap-3">
                  <span className="text-sm text-gray-600 w-16">{formatDate(day.date)}</span>
                  <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-green-500 to-green-600 rounded-full transition-all duration-300"
                      style={{ width: `${(day.revenue / maxDailyRevenue) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-gray-900 w-28 text-right">
                    {formatCurrency(day.revenue)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Ventas por Categoría */}
        {salesByCategory.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Ventas por Categoría</h2>
            <div className="space-y-3">
              {salesByCategory.slice(0, 10).map((category) => (
                <div key={category.category} className="flex items-center gap-3">
                  <span className="text-sm text-gray-600 w-32 truncate">{category.category}</span>
                  <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-300"
                      style={{ width: `${(category.revenue / maxCategoryRevenue) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-gray-900 w-28 text-right">
                    {formatCurrency(category.revenue)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Productos Más Vendidos */}
      {topProducts.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Productos Más Vendidos</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">#</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Producto</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Cantidad</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Ingresos</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 w-1/3"></th>
                </tr>
              </thead>
              <tbody>
                {topProducts.slice(0, 15).map((product, index) => (
                  <tr key={product.name} className="border-b border-gray-100 last:border-b-0">
                    <td className="py-3 px-4">
                      <span
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                          index < 3
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {index + 1}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-medium text-gray-900">{product.name}</p>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className="text-gray-900">{product.quantity}</span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className="font-semibold text-green-600">{formatCurrency(product.revenue)}</span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-green-400 to-green-600 rounded-full"
                          style={{ width: `${(product.revenue / maxProductRevenue) * 100}%` }}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Estado de Pedidos */}
      {salesSummary?.ordersByStatus && Object.keys(salesSummary.ordersByStatus).length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Estado de Pedidos</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {Object.entries(salesSummary.ordersByStatus).map(([status, count]) => {
              const statusLabels: Record<string, { label: string; color: string }> = {
                pendiente: { label: 'Pendientes', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
                en_preparacion: { label: 'En Preparación', color: 'bg-blue-100 text-blue-700 border-blue-200' },
                listo_entrega: { label: 'Listos', color: 'bg-purple-100 text-purple-700 border-purple-200' },
                entregado: { label: 'Entregados', color: 'bg-green-100 text-green-700 border-green-200' },
                cancelado: { label: 'Cancelados', color: 'bg-red-100 text-red-700 border-red-200' },
              };
              const config = statusLabels[status] || { label: status, color: 'bg-gray-100 text-gray-700 border-gray-200' };

              return (
                <div
                  key={status}
                  className={`p-4 rounded-xl border ${config.color}`}
                >
                  <p className="text-sm font-medium">{config.label}</p>
                  <p className="text-2xl font-bold mt-1">{count}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Sin datos */}
      {!salesSummary && dailySales.length === 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <BarChart3 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No hay datos para el período seleccionado</p>
          <p className="text-sm text-gray-400 mt-1">Intenta seleccionar otro rango de fechas</p>
        </div>
      )}
    </div>
  );
}
