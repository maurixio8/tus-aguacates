'use client';

import { useEffect, useState } from 'react';
import { TrendingUp, ShoppingBag, Clock, Package, DollarSign, Users, Building2, ExternalLink } from 'lucide-react';
import Link from 'next/link';

interface B2BMetrics {
    today: {
        orders: number;
        revenue: number;
    };
    pending: {
        count: number;
    };
    week: {
        orders: number;
        revenue: number;
    };
    companies: {
        total: number;
        active: number;
        pendingApproval: number;
    };
    topProducts: Array<{ name: string; quantity: number; revenue: number }>;
    recentOrders: Array<{
        id: string;
        order_number: string;
        company_name: string;
        total: number;
        status: string;
        created_at: string;
    }>;
}

export default function AdminB2BDashboardPage() {
    const [metrics, setMetrics] = useState<B2BMetrics | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

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
            } else {
                setError(data.error || 'Error al cargar métricas B2B');
            }
        } catch (err) {
            console.error('Error cargando métricas B2B:', err);
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

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('es-CO', {
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'delivered':
            case 'entregado':
                return 'bg-green-100 text-green-700';
            case 'confirmed':
            case 'confirmado':
                return 'bg-blue-100 text-blue-700';
            case 'cancelled':
            case 'cancelado':
                return 'bg-red-100 text-red-700';
            case 'processing':
            case 'en_preparacion':
                return 'bg-purple-100 text-purple-700';
            case 'shipped':
            case 'en_camino':
                return 'bg-orange-100 text-orange-700';
            default:
                return 'bg-yellow-100 text-yellow-700';
        }
    };

    const getStatusLabel = (status: string) => {
        const labels: Record<string, string> = {
            pending: 'Pendiente',
            pendiente: 'Pendiente',
            confirmed: 'Confirmado',
            confirmado: 'Confirmado',
            processing: 'En Preparación',
            en_preparacion: 'En Preparación',
            shipped: 'En Camino',
            en_camino: 'En Camino',
            delivered: 'Entregado',
            entregado: 'Entregado',
            cancelled: 'Cancelado',
            cancelado: 'Cancelado',
        };
        return labels[status] || status;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
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
            name: 'Ventas B2B Hoy',
            value: formatCurrency(metrics?.today?.revenue || 0),
            subtext: `${metrics?.today?.orders || 0} pedidos`,
            icon: TrendingUp,
            color: 'from-amber-500 to-orange-500',
            bgColor: 'bg-amber-50',
            textColor: 'text-amber-700',
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
            name: 'Empresas Activas',
            value: metrics?.companies?.active || 0,
            subtext: `${metrics?.companies?.pendingApproval || 0} pendientes`,
            icon: Building2,
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
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Dashboard B2B</h1>
                    <p className="text-gray-600 mt-1">Resumen de ventas empresariales</p>
                </div>
                <Link
                    href="/empresas"
                    target="_blank"
                    className="flex items-center gap-2 px-4 py-2 bg-amber-100 text-amber-700 rounded-lg hover:bg-amber-200 transition-colors"
                >
                    <ExternalLink className="w-4 h-4" />
                    Ver Portal B2B
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
                            <ShoppingBag className="w-5 h-5 text-amber-600" />
                            <h2 className="text-lg font-semibold text-gray-900">Pedidos B2B Recientes</h2>
                        </div>
                        <Link href="/admin/empresas/pedidos" className="text-amber-600 hover:text-amber-700 text-sm font-medium">
                            Ver todos →
                        </Link>
                    </div>
                    {metrics?.recentOrders && metrics.recentOrders.length > 0 ? (
                        <div className="space-y-3">
                            {metrics.recentOrders.slice(0, 5).map((order) => (
                                <div
                                    key={order.id}
                                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                                >
                                    <div>
                                        <p className="font-medium text-gray-900">{order.company_name || 'Empresa'}</p>
                                        <p className="text-sm text-gray-500">#{order.order_number} • {formatDate(order.created_at)}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-semibold text-amber-600">{formatCurrency(order.total)}</p>
                                        <span className={`inline-block px-2 py-0.5 text-xs rounded-full ${getStatusColor(order.status)}`}>
                                            {getStatusLabel(order.status)}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-gray-500 text-center py-8">No hay pedidos B2B recientes</p>
                    )}
                </div>

                {/* Productos Más Vendidos B2B */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <Package className="w-5 h-5 text-amber-600" />
                            <h2 className="text-lg font-semibold text-gray-900">Productos Top B2B</h2>
                        </div>
                        <Link href="/admin/empresas/productos" className="text-amber-600 hover:text-amber-700 text-sm font-medium">
                            Ver todos →
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
                                        <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-700 text-xs font-bold flex items-center justify-center">
                                            {index + 1}
                                        </span>
                                        <div>
                                            <p className="font-medium text-gray-900">{product.name}</p>
                                            <p className="text-sm text-gray-500">{product.quantity} unidades</p>
                                        </div>
                                    </div>
                                    <p className="font-semibold text-amber-600">{formatCurrency(product.revenue)}</p>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-gray-500 text-center py-8">No hay datos de productos B2B</p>
                    )}
                </div>
            </div>

            {/* Acciones Rápidas */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Acciones Rápidas B2B</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Link
                        href="/admin/empresas/clientes"
                        className="flex flex-col items-center justify-center p-4 bg-amber-50 hover:bg-amber-100 rounded-xl transition-colors border border-amber-200"
                    >
                        <Users className="w-8 h-8 text-amber-600 mb-2" />
                        <span className="text-sm font-medium text-amber-700">Clientes B2B</span>
                    </Link>
                    <Link
                        href="/admin/empresas/pedidos"
                        className="flex flex-col items-center justify-center p-4 bg-yellow-50 hover:bg-yellow-100 rounded-xl transition-colors border border-yellow-200"
                    >
                        <ShoppingBag className="w-8 h-8 text-yellow-600 mb-2" />
                        <span className="text-sm font-medium text-yellow-700">Pedidos B2B</span>
                    </Link>
                    <Link
                        href="/admin/empresas/productos"
                        className="flex flex-col items-center justify-center p-4 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors border border-blue-200"
                    >
                        <Package className="w-8 h-8 text-blue-600 mb-2" />
                        <span className="text-sm font-medium text-blue-700">Productos B2B</span>
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
        </div>
    );
}
