'use client';

import { useEffect, useState } from 'react';
import { Search, Building2, Mail, Phone, Calendar, MoreHorizontal, Check, X, Eye } from 'lucide-react';
import Link from 'next/link';

interface B2BCompany {
    id: string;
    company_name: string;
    nit: string;
    contact_name: string;
    contact_email: string;
    contact_phone: string;
    status: 'pending' | 'pending_verification' | 'active' | 'inactive' | 'suspended';
    created_at: string;
    total_orders?: number;
    total_spent?: number;
}

export default function AdminB2BClientsPage() {
    const [companies, setCompanies] = useState<B2BCompany[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [selectedCompany, setSelectedCompany] = useState<B2BCompany | null>(null);

    useEffect(() => {
        loadCompanies();
    }, []);

    const loadCompanies = async () => {
        try {
            const response = await fetch('/api/admin/b2b/companies');
            const data = await response.json();
            if (data.success) {
                setCompanies(data.companies || []);
            }
        } catch (error) {
            console.error('Error loading B2B companies:', error);
        } finally {
            setLoading(false);
        }
    };

    const updateCompanyStatus = async (companyId: string, newStatus: string) => {
        try {
            const response = await fetch(`/api/admin/b2b/companies/${companyId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus }),
            });
            const data = await response.json();
            if (data.success) {
                setCompanies(prev => prev.map(c => c.id === companyId ? { ...c, status: newStatus as any } : c));
            }
        } catch (error) {
            console.error('Error updating company status:', error);
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
        });
    };

    const getStatusBadge = (status: string) => {
        const styles: Record<string, string> = {
            active: 'bg-green-100 text-green-700',
            pending: 'bg-yellow-100 text-yellow-700',
            pending_verification: 'bg-amber-100 text-amber-700',
            inactive: 'bg-gray-100 text-gray-700',
            suspended: 'bg-red-100 text-red-700',
        };
        const labels: Record<string, string> = {
            active: 'Activa',
            pending: 'Pendiente',
            pending_verification: 'Verificación',
            inactive: 'Inactiva',
            suspended: 'Suspendida',
        };
        return (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] || 'bg-gray-100 text-gray-700'}`}>
                {labels[status] || status}
            </span>
        );
    };

    const filteredCompanies = companies.filter(company => {
        const matchesSearch =
            company.company_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            company.nit?.includes(searchQuery) ||
            company.contact_email.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === 'all' || company.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

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
                <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Clientes B2B</h1>
                <p className="text-gray-600 mt-1">Gestiona las empresas registradas</p>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Buscar por nombre, NIT o email..."
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
                        <option value="active">Activas</option>
                        <option value="pending">Pendientes</option>
                        <option value="pending_verification">En verificación</option>
                        <option value="inactive">Inactivas</option>
                        <option value="suspended">Suspendidas</option>
                    </select>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                    <p className="text-sm text-gray-600">Total Empresas</p>
                    <p className="text-2xl font-bold text-gray-900">{companies.length}</p>
                </div>
                <div className="bg-green-50 rounded-xl border border-green-200 p-4">
                    <p className="text-sm text-green-700">Activas</p>
                    <p className="text-2xl font-bold text-green-700">{companies.filter(c => c.status === 'active').length}</p>
                </div>
                <div className="bg-yellow-50 rounded-xl border border-yellow-200 p-4">
                    <p className="text-sm text-yellow-700">Pendientes</p>
                    <p className="text-2xl font-bold text-yellow-700">{companies.filter(c => c.status === 'pending' || c.status === 'pending_verification').length}</p>
                </div>
                <div className="bg-gray-50 rounded-xl border border-gray-200 p-4">
                    <p className="text-sm text-gray-600">Inactivas</p>
                    <p className="text-2xl font-bold text-gray-600">{companies.filter(c => c.status === 'inactive' || c.status === 'suspended').length}</p>
                </div>
            </div>

            {/* Companies List */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                {filteredCompanies.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Empresa</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">NIT</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Contacto</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Estado</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Registro</th>
                                    <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {filteredCompanies.map((company) => (
                                    <tr key={company.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                                                    <Building2 className="w-5 h-5 text-amber-600" />
                                                </div>
                                                <div>
                                                    <p className="font-medium text-gray-900">{company.company_name}</p>
                                                    {company.total_orders !== undefined && (
                                                        <p className="text-sm text-gray-500">{company.total_orders} pedidos</p>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600">{company.nit || '-'}</td>
                                        <td className="px-6 py-4">
                                            <div>
                                                <p className="text-sm font-medium text-gray-900">{company.contact_name}</p>
                                                <p className="text-sm text-gray-500">{company.contact_email}</p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">{getStatusBadge(company.status)}</td>
                                        <td className="px-6 py-4 text-sm text-gray-600">{formatDate(company.created_at)}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-center gap-2">
                                                {(company.status === 'pending' || company.status === 'pending_verification') && (
                                                    <>
                                                        <button
                                                            onClick={() => updateCompanyStatus(company.id, 'active')}
                                                            className="p-1.5 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
                                                            title="Aprobar"
                                                        >
                                                            <Check className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => updateCompanyStatus(company.id, 'suspended')}
                                                            className="p-1.5 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                                                            title="Rechazar"
                                                        >
                                                            <X className="w-4 h-4" />
                                                        </button>
                                                    </>
                                                )}
                                                <button
                                                    onClick={() => setSelectedCompany(company)}
                                                    className="p-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                                                    title="Ver detalles"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="text-center py-12">
                        <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-600">No se encontraron empresas</p>
                    </div>
                )}
            </div>

            {/* Company Detail Modal */}
            {selectedCompany && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-200">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-bold text-gray-900">Detalles de Empresa</h2>
                                <button onClick={() => setSelectedCompany(null)} className="p-2 hover:bg-gray-100 rounded-lg">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <p className="text-sm text-gray-500">Nombre de Empresa</p>
                                <p className="font-medium text-gray-900">{selectedCompany.company_name}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">NIT</p>
                                <p className="font-medium text-gray-900">{selectedCompany.nit || 'No registrado'}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-gray-500">Contacto</p>
                                    <p className="font-medium text-gray-900">{selectedCompany.contact_name}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Estado</p>
                                    {getStatusBadge(selectedCompany.status)}
                                </div>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Email</p>
                                <p className="font-medium text-gray-900">{selectedCompany.contact_email}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Teléfono</p>
                                <p className="font-medium text-gray-900">{selectedCompany.contact_phone || 'No registrado'}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Fecha de Registro</p>
                                <p className="font-medium text-gray-900">{formatDate(selectedCompany.created_at)}</p>
                            </div>
                        </div>
                        <div className="p-6 border-t border-gray-200 flex gap-3">
                            {selectedCompany.status !== 'active' && (
                                <button
                                    onClick={() => {
                                        updateCompanyStatus(selectedCompany.id, 'active');
                                        setSelectedCompany(null);
                                    }}
                                    className="flex-1 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                                >
                                    Activar Empresa
                                </button>
                            )}
                            {selectedCompany.status === 'active' && (
                                <button
                                    onClick={() => {
                                        updateCompanyStatus(selectedCompany.id, 'inactive');
                                        setSelectedCompany(null);
                                    }}
                                    className="flex-1 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
                                >
                                    Desactivar
                                </button>
                            )}
                            <button
                                onClick={() => setSelectedCompany(null)}
                                className="flex-1 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                            >
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
