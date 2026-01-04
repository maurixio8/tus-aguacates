'use client';

import { useEffect, useState } from 'react';
import { Search, ShoppingBag, Building2, Calendar, Clock, Package, ChevronDown, Eye } from 'lucide-react';
import Link from 'next/link';

interface B2BOrder {
    id: string;
    order_number: string;
    company_id: string;
    company_name: string;
    total: number;
    subtotal: number;
    status: string;
    payment_status: string;
    delivery_date: string | null;
    created_at: string;
    items_count: number;
}

export default function AdminB2BOrdersPage() {
    const [orders, setOrders] = useState<B2BOrder[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');

    useEffect(() => {
        loadOrders();
    }, []);

    const loadOrders = async () => {
        try {
            const response = await fetch('/api/admin/b2b/orders');
            const data = await response.json();
            if (data.success) {
                setOrders(data.orders || []);
            }
        } catch (error) {
            console.error('Error loading B2B orders:', error);
        } finally {
            setLoading(false);
        }
    };

    const updateOrderStatus = async (orderId: string, newStatus: string) => {
        try {
            const response = await fetch(`/api/admin/b2b/orders/${orderId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus }),
            });
            const data = await response.json();
            if (data.success) {
                setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
            }
        } catch (error) {
            console.error('Error updating order status:', error);
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
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const getStatusBadge = (status: string) => {
        const styles: Record<string, string> = {
            pending: 'bg-yellow-100 text-yellow-700',
            pendiente: 'bg-yellow-100 text-yellow-700',
            confirmed: 'bg-blue-100 text-blue-700',
            confirmado: 'bg-blue-100 text-blue-700',
            processing: 'bg-purple-100 text-purple-700',
            en_preparacion: 'bg-purple-100 text-purple-700',
            shipped: 'bg-orange-100 text-orange-700',
            en_camino: 'bg-orange-100 text-orange-700',
            delivered: 'bg-green-100 text-green-700',
            entregado: 'bg-green-100 text-green-700',
            cancelled: 'bg-red-100 text-red-700',
            cancelado: 'bg-red-100 text-red-700',
        };
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
        return (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] || 'bg-gray-100 text-gray-700'}`}>
                {labels[status] || status}
            </span>
        );
    };

    const filteredOrders = orders.filter(order => {
        const matchesSearch =
            order.order_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            order.company_name?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    // Calcular estadísticas
    const stats = {
        total: orders.length,
        pending: orders.filter(o => o.status === 'pending' || o.status === 'pendiente').length,
        processing: orders.filter(o => o.status === 'processing' || o.status === 'en_preparacion' || o.status === 'confirmed' || o.status === 'confirmado').length,
        delivered: orders.filter(o => o.status === 'delivered' || o.status === 'entregado').length,
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Pedidos B2B</h1>
                <p className="text-gray-600 mt-1">Gestiona los pedidos empresariales</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                    <p className="text-sm text-gray-600">Total Pedidos</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                </div>
                <div className="bg-yellow-50 rounded-xl border border-yellow-200 p-4">
                    <p className="text-sm text-yellow-700">Pendientes</p>
                    <p className="text-2xl font-bold text-yellow-700">{stats.pending}</p>
                </div>
                <div className="bg-blue-50 rounded-xl border border-blue-200 p-4">
                    <p className="text-sm text-blue-700">En Proceso</p>
                    <p className="text-2xl font-bold text-blue-700">{stats.processing}</p>
                </div>
                <div className="bg-green-50 rounded-xl border border-green-200 p-4">
                    <p className="text-sm text-green-700">Entregados</p>
                    <p className="text-2xl font-bold text-green-700">{stats.delivered}</p>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Buscar por número de pedido o empresa..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                        />
                    </div>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                    >
                        <option value="all">Todos los estados</option>
                        <option value="pending">Pendientes</option>
                        <option value="confirmed">Confirmados</option>
                        <option value="processing">En Preparación</option>
                        <option value="shipped">En Camino</option>
                        <option value="delivered">Entregados</option>
                        <option value="cancelled">Cancelados</option>
                    </select>
                </div>
            </div>

            {/* Orders List */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                {filteredOrders.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Pedido</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Empresa</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Total</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Estado</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Fecha</th>
                                    <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {filteredOrders.map((order) => (
                                    <tr key={order.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                                                    <ShoppingBag className="w-5 h-5 text-amber-600" />
                                                </div>
                                                <div>
                                                    <p className="font-medium text-gray-900">#{order.order_number}</p>
                                                    <p className="text-sm text-gray-500">{order.items_count || 0} productos</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <Building2 className="w-4 h-4 text-gray-400" />
                                                <span className="text-sm text-gray-900">{order.company_name || 'Empresa'}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="font-semibold text-gray-900">{formatCurrency(order.total)}</p>
                                        </td>
                                        <td className="px-6 py-4">{getStatusBadge(order.status)}</td>
                                        <td className="px-6 py-4 text-sm text-gray-600">{formatDate(order.created_at)}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-center gap-2">
                                                <select
                                                    value={order.status}
                                                    onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                                                    className="text-sm border border-gray-300 rounded-lg px-2 py-1 focus:ring-2 focus:ring-amber-500"
                                                >
                                                    <option value="pending">Pendiente</option>
                                                    <option value="confirmed">Confirmado</option>
                                                    <option value="processing">En Preparación</option>
                                                    <option value="shipped">En Camino</option>
                                                    <option value="delivered">Entregado</option>
                                                    <option value="cancelled">Cancelado</option>
                                                </select>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="text-center py-12">
                        <ShoppingBag className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-600">No se encontraron pedidos B2B</p>
                    </div>
                )}
            </div>
        </div>
    );
}
