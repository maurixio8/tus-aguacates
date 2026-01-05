'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Building2,
  Package,
  ShoppingCart,
  Users,
  TrendingUp,
  DollarSign,
  Settings,
  Tag,
  MessageSquare,
  Image as ImageIcon,
  Ticket,
  Layers
} from 'lucide-react';

interface B2BMetrics {
  companies: {
    active: number;
    pending: number;
    total: number;
  };
  products: {
    active: number;
    total: number;
  };
  orders: {
    today: number;
    month: number;
    pending: number;
  };
  revenue: {
    today: number;
    month: number;
  };
  topProducts: Array<{ name: string; quantity: number; revenue: number }>;
}

export default function B2BDashboardPage() {
  const [metrics, setMetrics] = useState<B2BMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMetrics();
  }, []);

  const loadMetrics = async () => {
    try {
      const response = await fetch('/api/admin/b2b/metrics', {
        credentials: 'include',
      });
      const data = await response.json();

      if (data.success) {
        setMetrics(data.metrics);
      }
    } catch (err) {
      console.error('Error cargando métricas B2B:', err);
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

  const stats = [
    {
      name: 'Empresas Activas',
      value: metrics?.companies?.active || 0,
      subtext: `${metrics?.companies?.pending || 0} pendientes`,
      icon: Building2,
      color: 'from-emerald-500 to-emerald-600',
      bgColor: 'bg-emerald-50',
      textColor: 'text-emerald-700',
    },
    {
      name: 'Pedidos del Mes',
      value: metrics?.orders?.month || 0,
      subtext: `${metrics?.orders?.pending || 0} pendientes`,
      icon: ShoppingCart,
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-700',
    },
    {
      name: 'Ventas del Mes',
      value: formatCurrency(metrics?.revenue?.month || 0),
      subtext: `${metrics?.orders?.today || 0} pedidos hoy`,
      icon: DollarSign,
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-700',
    },
    {
      name: 'Productos B2B',
      value: metrics?.products?.active || 0,
      subtext: 'Productos activos',
      icon: Package,
      color: 'from-orange-500 to-orange-600',
      bgColor: 'bg-orange-50',
      textColor: 'text-orange-700',
    },
  ];

  const quickActions = [
    {
      name: 'Productos B2B',
      description: 'Gestionar catálogo y precios',
      href: '/admin/empresas/productos-b2b',
      icon: Package,
      color: 'bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-700',
    },
    {
      name: 'Pedidos B2B',
      description: 'Ver y gestionar pedidos',
      href: '/admin/empresas/pedidos-b2b',
      icon: ShoppingCart,
      color: 'bg-green-50 hover:bg-green-100 border-green-200 text-green-700',
    },
    {
      name: 'Empresas',
      description: 'Gestionar empresas y usuarios',
      href: '/admin/empresas/empresas-clientes',
      icon: Users,
      color: 'bg-purple-50 hover:bg-purple-100 border-purple-200 text-purple-700',
    },
    {
      name: 'Categorías B2B',
      description: 'Organizar categorías',
      href: '/admin/empresas/categorias-b2b',
      icon: Layers,
      color: 'bg-orange-50 hover:bg-orange-100 border-orange-200 text-orange-700',
    },
    {
      name: 'Slides B2B',
      description: 'Gestionar carrusel',
      href: '/admin/empresas/slides-b2b',
      icon: ImageIcon,
      color: 'bg-pink-50 hover:bg-pink-100 border-pink-200 text-pink-700',
    },
    {
      name: 'Banner Mensajes',
      description: 'Mensajes emergentes',
      href: '/admin/empresas/banner-mensajes-b2b',
      icon: MessageSquare,
      color: 'bg-yellow-50 hover:bg-yellow-100 border-yellow-200 text-yellow-700',
    },
    {
      name: 'Cupones B2B',
      description: 'Descuentos empresariales',
      href: '/admin/empresas/cupones-b2b',
      icon: Ticket,
      color: 'bg-red-50 hover:bg-red-100 border-red-200 text-red-700',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Empresas B2B</h1>
        <p className="text-gray-600 mt-1">Panel de administración de ventas empresariales</p>
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

      {/* Productos Más Vendidos B2B */}
      {metrics?.topProducts && metrics.topProducts.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-green-600" />
            <h2 className="text-lg font-semibold text-gray-900">Productos Más Vendidos B2B (Hoy)</h2>
          </div>
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
        </div>
      )}

      {/* Accesos Rápidos */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Gestión B2B</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.name}
                href={action.href}
                className={`flex flex-col items-center justify-center p-4 rounded-xl transition-colors border ${action.color}`}
              >
                <Icon className="w-8 h-8 mb-2" />
                <span className="text-sm font-medium text-center">{action.name}</span>
                <span className="text-xs text-center mt-1 opacity-75">{action.description}</span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Información */}
      <div className="bg-gradient-to-r from-emerald-50 to-blue-50 rounded-xl border border-emerald-200 p-6">
        <div className="flex items-start gap-3">
          <Building2 className="w-6 h-6 text-emerald-600 mt-1" />
          <div>
            <h3 className="font-semibold text-gray-900">Sección Empresas B2B</h3>
            <p className="text-sm text-gray-600 mt-1">
              Gestiona el catálogo de productos mayoristas, pedidos empresariales, empresas registradas,
              y contenido específico para el canal B2B. Los productos B2B usan precios por volumen (pricing tiers)
              en lugar de variantes.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
