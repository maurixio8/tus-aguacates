'use client';

import { useEffect, useState } from 'react';
import { TrendingUp, DollarSign, Building2, ShoppingBag, Package, Calendar } from 'lucide-react';

interface B2BReportData {
    summary: {
        totalRevenue: number;
        totalOrders: number;
        totalCompanies: number;
        avgOrderValue: number;
    };
    monthlyRevenue: Array<{ month: string; revenue: number; orders: number }>;
    topCompanies: Array<{ name: string; orders: number; revenue: number }>;
    topProducts: Array<{ name: string; quantity: number; revenue: number }>;
}

export default function AdminB2BReportsPage() {
    const [data, setData] = useState<B2BReportData | null>(null);
    const [loading, setLoading] = useState(true);
    const [period, setPeriod] = useState<'week' | 'month' | 'year'>('month');

    useEffect(() => {
        loadReportData();
    }, [period]);

    const loadReportData = async () => {
        setLoading(true);
        try {
            const response = await fetch(`/api/admin/b2b/reports?period=${period}`);
            const result = await response.json();
            if (result.success) {
                setData(result.data);
            }
        } catch (error) {
            console.error('Error loading B2B reports:', error);
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
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
            </div>
        );
    }

    const summary = data?.summary || {
        totalRevenue: 0,
        totalOrders: 0,
        totalCompanies: 0,
        avgOrderValue: 0,
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Reportes B2B</h1>
                    <p className="text-gray-600 mt-1">Análisis de ventas empresariales</p>
                </div>
                <div className="flex gap-2">
                    {(['week', 'month', 'year'] as const).map((p) => (
                        <button
                            key={p}
                            onClick={() => setPeriod(p)}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${period === p
                                    ? 'bg-amber-600 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            {p === 'week' ? 'Semana' : p === 'month' ? 'Mes' : 'Año'}
                        </button>
                    ))}
                </div>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Ingresos B2B</p>
                            <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(summary.totalRevenue)}</p>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
                            <DollarSign className="w-6 h-6 text-white" />
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Pedidos B2B</p>
                            <p className="text-2xl font-bold text-gray-900 mt-1">{summary.totalOrders}</p>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                            <ShoppingBag className="w-6 h-6 text-white" />
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Empresas Activas</p>
                            <p className="text-2xl font-bold text-gray-900 mt-1">{summary.totalCompanies}</p>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
                            <Building2 className="w-6 h-6 text-white" />
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Ticket Promedio</p>
                            <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(summary.avgOrderValue)}</p>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
                            <TrendingUp className="w-6 h-6 text-white" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Top Companies */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <Building2 className="w-5 h-5 text-amber-600" />
                        <h2 className="text-lg font-semibold text-gray-900">Empresas Top</h2>
                    </div>
                    {data?.topCompanies && data.topCompanies.length > 0 ? (
                        <div className="space-y-3">
                            {data.topCompanies.slice(0, 5).map((company, index) => (
                                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-700 text-xs font-bold flex items-center justify-center">
                                            {index + 1}
                                        </span>
                                        <div>
                                            <p className="font-medium text-gray-900">{company.name}</p>
                                            <p className="text-sm text-gray-500">{company.orders} pedidos</p>
                                        </div>
                                    </div>
                                    <p className="font-semibold text-amber-600">{formatCurrency(company.revenue)}</p>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-gray-500 text-center py-8">No hay datos de empresas</p>
                    )}
                </div>

                {/* Top Products B2B */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <Package className="w-5 h-5 text-amber-600" />
                        <h2 className="text-lg font-semibold text-gray-900">Productos Top B2B</h2>
                    </div>
                    {data?.topProducts && data.topProducts.length > 0 ? (
                        <div className="space-y-3">
                            {data.topProducts.slice(0, 5).map((product, index) => (
                                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center">
                                            {index + 1}
                                        </span>
                                        <div>
                                            <p className="font-medium text-gray-900">{product.name}</p>
                                            <p className="text-sm text-gray-500">{product.quantity} unidades</p>
                                        </div>
                                    </div>
                                    <p className="font-semibold text-blue-600">{formatCurrency(product.revenue)}</p>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-gray-500 text-center py-8">No hay datos de productos</p>
                    )}
                </div>
            </div>

            {/* Monthly Revenue Chart Placeholder */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center gap-2 mb-4">
                    <Calendar className="w-5 h-5 text-amber-600" />
                    <h2 className="text-lg font-semibold text-gray-900">Tendencia de Ventas B2B</h2>
                </div>
                {data?.monthlyRevenue && data.monthlyRevenue.length > 0 ? (
                    <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
                        {data.monthlyRevenue.map((item, index) => (
                            <div key={index} className="text-center p-3 bg-gray-50 rounded-lg">
                                <p className="text-xs text-gray-500">{item.month}</p>
                                <p className="text-lg font-bold text-gray-900 mt-1">{formatCurrency(item.revenue)}</p>
                                <p className="text-xs text-gray-500">{item.orders} pedidos</p>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12 text-gray-500">
                        <TrendingUp className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <p>No hay datos de tendencias disponibles</p>
                    </div>
                )}
            </div>
        </div>
    );
}
