'use client';

import { useEffect, useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Ticket,
  Tag,
  Truck,
  ShoppingCart,
  AlertTriangle,
  CheckCircle,
  Info,
  Zap,
  RefreshCw,
  Calendar,
  DollarSign,
  Percent,
  Package
} from 'lucide-react';

interface CouponPerformance {
  code: string;
  uses: number;
  totalDiscount: number;
  type: string;
  conversionRate: number;
}

interface ProductOffer {
  name: string;
  originalPrice: number;
  salePrice: number;
  discountPercent: number;
  category: string;
}

interface Recommendation {
  type: 'success' | 'warning' | 'info' | 'action';
  title: string;
  description: string;
  impact: string;
}

interface IncentivesAnalysis {
  period: { from: string; to: string };
  coupons: {
    total: number;
    active: number;
    usageInPeriod: number;
    totalDiscountGiven: number;
    avgDiscountPerUse: number;
    usageRate: number;
    topPerformers: CouponPerformance[];
    unused: { code: string; description: string }[];
  };
  productOffers: {
    productsOnSale: number;
    avgDiscountPercent: number;
    potentialImpact: number;
    topOffers: ProductOffer[];
  };
  orders: {
    totalOrders: number;
    ordersWithDiscount: number;
    ordersWithoutDiscount: number;
    avgOrderWithDiscount: number;
    avgOrderWithoutDiscount: number;
    couponUsageRate: number;
  };
  shipping: {
    freeShippingThreshold: number;
    standardShippingCost: number;
    ordersQualifiedForFreeShipping: number;
    freeShippingRate: number;
    ordersCloseToFreeShipping: number;
  };
  recommendations: Recommendation[];
}

export default function IncentivosPage() {
  const [dateFrom, setDateFrom] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date.toISOString().split('T')[0];
  });
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().split('T')[0]);
  const [analysis, setAnalysis] = useState<IncentivesAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAnalysis();
  }, [dateFrom, dateTo]);

  const loadAnalysis = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/incentives-analysis?dateFrom=${dateFrom}&dateTo=${dateTo}`, {
        credentials: 'include'
      });
      const data = await res.json();

      if (data.success) {
        setAnalysis(data.analysis);
      } else {
        setError(data.error || 'Error al cargar análisis');
      }
    } catch (err) {
      console.error('Error loading analysis:', err);
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

  const getRecommendationIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'warning': return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      case 'info': return <Info className="w-5 h-5 text-blue-600" />;
      case 'action': return <Zap className="w-5 h-5 text-purple-600" />;
      default: return <Info className="w-5 h-5 text-gray-600" />;
    }
  };

  const getRecommendationStyle = (type: string) => {
    switch (type) {
      case 'success': return 'bg-green-50 border-green-200';
      case 'warning': return 'bg-yellow-50 border-yellow-200';
      case 'info': return 'bg-blue-50 border-blue-200';
      case 'action': return 'bg-purple-50 border-purple-200';
      default: return 'bg-gray-50 border-gray-200';
    }
  };

  const getImpactBadge = (impact: string) => {
    switch (impact.toLowerCase()) {
      case 'alto': return 'bg-red-100 text-red-700';
      case 'medio': return 'bg-yellow-100 text-yellow-700';
      case 'bajo': return 'bg-green-100 text-green-700';
      case 'positivo': return 'bg-emerald-100 text-emerald-700';
      default: return 'bg-gray-100 text-gray-700';
    }
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
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <AlertTriangle className="w-12 h-12 text-red-500 mb-4" />
        <p className="text-gray-600">{error}</p>
        <button
          onClick={loadAnalysis}
          className="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
        >
          Reintentar
        </button>
      </div>
    );
  }

  if (!analysis) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Análisis de Incentivos</h1>
          <p className="text-gray-600 mt-1">Rendimiento de cupones, ofertas y promociones</p>
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
            onClick={loadAnalysis}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Uso de Cupones</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{analysis.coupons.usageInPeriod}</p>
              <p className="text-xs text-gray-500 mt-1">
                {analysis.orders.couponUsageRate.toFixed(1)}% de pedidos
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
              <Ticket className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Descuentos Otorgados</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {formatCurrency(analysis.coupons.totalDiscountGiven)}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                ~{formatCurrency(analysis.coupons.avgDiscountPerUse)} por uso
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Productos en Oferta</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{analysis.productOffers.productsOnSale}</p>
              <p className="text-xs text-gray-500 mt-1">
                {analysis.productOffers.avgDiscountPercent.toFixed(1)}% desc. promedio
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
              <Tag className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Envío Gratis</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {analysis.shipping.freeShippingRate.toFixed(1)}%
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {analysis.shipping.ordersQualifiedForFreeShipping} pedidos calificaron
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
              <Truck className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Recommendations */}
      {analysis.recommendations.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5 text-yellow-500" />
            Recomendaciones
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {analysis.recommendations.map((rec, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border ${getRecommendationStyle(rec.type)}`}
              >
                <div className="flex items-start gap-3">
                  {getRecommendationIcon(rec.type)}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium text-gray-900">{rec.title}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${getImpactBadge(rec.impact)}`}>
                        {rec.impact}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">{rec.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Coupons */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Ticket className="w-5 h-5 text-purple-500" />
            Cupones Más Usados
          </h2>
          {analysis.coupons.topPerformers.length > 0 ? (
            <div className="space-y-3">
              {analysis.coupons.topPerformers.map((coupon, index) => (
                <div key={coupon.code} className="flex items-center gap-3">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    index < 3 ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {index + 1}
                  </span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-900">{coupon.code}</span>
                      <span className="text-sm text-gray-500">{coupon.uses} usos</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500 capitalize">{coupon.type}</span>
                      <span className="text-green-600 font-medium">
                        {formatCurrency(coupon.totalDiscount)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No hay datos de cupones en este período</p>
          )}
        </div>

        {/* Order Comparison */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-blue-500" />
            Impacto en Pedidos
          </h2>
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Con Cupón</p>
                <p className="text-xl font-bold text-green-700">
                  {formatCurrency(analysis.orders.avgOrderWithDiscount)}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {analysis.orders.ordersWithDiscount} pedidos
                </p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Sin Cupón</p>
                <p className="text-xl font-bold text-gray-700">
                  {formatCurrency(analysis.orders.avgOrderWithoutDiscount)}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {analysis.orders.ordersWithoutDiscount} pedidos
                </p>
              </div>
            </div>

            {analysis.orders.avgOrderWithDiscount > 0 && analysis.orders.avgOrderWithoutDiscount > 0 && (
              <div className="flex items-center justify-center gap-2 text-sm">
                {analysis.orders.avgOrderWithDiscount > analysis.orders.avgOrderWithoutDiscount ? (
                  <>
                    <TrendingUp className="w-4 h-4 text-green-600" />
                    <span className="text-green-600 font-medium">
                      Cupones aumentan ticket promedio en {(
                        ((analysis.orders.avgOrderWithDiscount - analysis.orders.avgOrderWithoutDiscount) /
                        analysis.orders.avgOrderWithoutDiscount) * 100
                      ).toFixed(1)}%
                    </span>
                  </>
                ) : (
                  <>
                    <TrendingDown className="w-4 h-4 text-red-600" />
                    <span className="text-red-600 font-medium">
                      Cupones reducen ticket promedio en {(
                        ((analysis.orders.avgOrderWithoutDiscount - analysis.orders.avgOrderWithDiscount) /
                        analysis.orders.avgOrderWithoutDiscount) * 100
                      ).toFixed(1)}%
                    </span>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Product Offers */}
      {analysis.productOffers.topOffers.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Tag className="w-5 h-5 text-orange-500" />
            Productos en Oferta
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Producto</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Categoría</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Precio Original</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Precio Oferta</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Descuento</th>
                </tr>
              </thead>
              <tbody>
                {analysis.productOffers.topOffers.map((product, index) => (
                  <tr key={index} className="border-b border-gray-100 last:border-b-0">
                    <td className="py-3 px-4">
                      <p className="font-medium text-gray-900">{product.name}</p>
                    </td>
                    <td className="py-3 px-4 text-gray-600">{product.category}</td>
                    <td className="py-3 px-4 text-right text-gray-500 line-through">
                      {formatCurrency(product.originalPrice)}
                    </td>
                    <td className="py-3 px-4 text-right font-semibold text-green-600">
                      {formatCurrency(product.salePrice)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-sm font-medium">
                        -{product.discountPercent.toFixed(0)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Unused Coupons */}
      {analysis.coupons.unused.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-yellow-500" />
            Cupones Sin Utilizar
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {analysis.coupons.unused.map((coupon, index) => (
              <div key={index} className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="font-medium text-gray-900">{coupon.code}</p>
                <p className="text-sm text-gray-600 truncate">{coupon.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Shipping Stats */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Truck className="w-5 h-5 text-green-500" />
          Análisis de Envío Gratis
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">Umbral Envío Gratis</p>
            <p className="text-xl font-bold text-gray-900">
              {formatCurrency(analysis.shipping.freeShippingThreshold)}
            </p>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">Pedidos con Envío Gratis</p>
            <p className="text-xl font-bold text-green-700">
              {analysis.shipping.ordersQualifiedForFreeShipping}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {analysis.shipping.freeShippingRate.toFixed(1)}% del total
            </p>
          </div>
          <div className="text-center p-4 bg-yellow-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">Cerca del Envío Gratis</p>
            <p className="text-xl font-bold text-yellow-700">
              {analysis.shipping.ordersCloseToFreeShipping}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Oportunidad de upselling
            </p>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-xl p-6 text-white">
        <h2 className="text-lg font-semibold mb-4">Resumen del Período</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-green-200 text-sm">Total Pedidos</p>
            <p className="text-2xl font-bold">{analysis.orders.totalOrders}</p>
          </div>
          <div>
            <p className="text-green-200 text-sm">Cupones Activos</p>
            <p className="text-2xl font-bold">{analysis.coupons.active}</p>
          </div>
          <div>
            <p className="text-green-200 text-sm">Productos en Oferta</p>
            <p className="text-2xl font-bold">{analysis.productOffers.productsOnSale}</p>
          </div>
          <div>
            <p className="text-green-200 text-sm">Descuentos Totales</p>
            <p className="text-2xl font-bold">{formatCurrency(analysis.coupons.totalDiscountGiven)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
