'use client';

import { useEffect, useState } from 'react';
import {
  Search,
  Building2,
  Mail,
  Phone,
  MapPin,
  CheckCircle,
  Clock,
  XCircle,
  Users,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from 'lucide-react';

interface Company {
  id: string;
  company_name: string;
  nit: string;
  business_type: string;
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  status: 'pending' | 'active' | 'inactive' | 'suspended';
  user_count?: number;
  created_at: string;
}

const statusConfig: Record<string, { label: string; color: string; bgColor: string; icon: any }> = {
  pending: { label: 'Pendiente', color: 'text-yellow-700', bgColor: 'bg-yellow-100', icon: Clock },
  active: { label: 'Activo', color: 'text-green-700', bgColor: 'bg-green-100', icon: CheckCircle },
  inactive: { label: 'Inactivo', color: 'text-gray-700', bgColor: 'bg-gray-100', icon: XCircle },
  suspended: { label: 'Suspendido', color: 'text-red-700', bgColor: 'bg-red-100', icon: XCircle },
};

export default function B2BCompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    page_size: 20,
    total: 0,
    total_pages: 1,
  });
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    loadCompanies();
  }, [search, status, pagination.page]);

  const loadCompanies = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', pagination.page.toString());
      params.set('page_size', pagination.page_size.toString());
      if (search) params.set('search', search);
      if (status) params.set('status', status);
      params.set('_t', Date.now().toString());

      const response = await fetch(`/api/admin/b2b/companies?${params}`, {
        credentials: 'include',
        cache: 'no-store',
      });

      const data = await response.json();

      if (data.success) {
        setCompanies(data.data || []);
        setPagination(prev => ({
          ...prev,
          total: data.meta?.pagination?.total || 0,
          total_pages: data.meta?.pagination?.total_pages || 1,
        }));
      } else {
        showToast('Error al cargar empresas', 'error');
      }
    } catch (error) {
      console.error('Error cargando empresas:', error);
      showToast('Error de conexión', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (companyId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/admin/b2b/companies?id=${companyId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        loadCompanies();
        showToast('Estado actualizado correctamente', 'success');
      } else {
        showToast('Error al actualizar estado', 'error');
      }
    } catch (error) {
      console.error('Error actualizando estado:', error);
      showToast('Error de conexión', 'error');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Empresas B2B</h1>
        <p className="text-gray-600 mt-1">Gestión de empresas clientes</p>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Búsqueda */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar por nombre, NIT, contacto..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPagination(prev => ({ ...prev, page: 1 }));
              }}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
            />
          </div>

          {/* Estado */}
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPagination(prev => ({ ...prev, page: 1 }));
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
          >
            <option value="">Todos los estados</option>
            {Object.entries(statusConfig).map(([key, config]) => (
              <option key={key} value={key}>{config.label}</option>
            ))}
          </select>

          {/* Stats */}
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Building2 className="w-5 h-5" />
            <span>{pagination.total} empresas registradas</span>
          </div>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg ${
          toast.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
        }`}>
          {toast.message}
        </div>
      )}

      {/* Lista de empresas */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-green-600 animate-spin" />
          </div>
        ) : companies.length === 0 ? (
          <div className="text-center py-12">
            <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No hay empresas registradas</p>
            <p className="text-sm text-gray-500 mt-1">
              {search || status ? 'Intenta con otros filtros' : 'Las empresas se registrarán aquí'}
            </p>
          </div>
        ) : (
          <>
            {/* Desktop view */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Empresa</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">NIT</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Contacto</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Usuarios</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Estado</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Registrado</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {companies.map((company) => {
                    const StatusIcon = statusConfig[company.status]?.icon;
                    return (
                      <tr key={company.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div>
                            <p className="font-semibold text-gray-900">{company.company_name}</p>
                            <p className="text-xs text-gray-500 capitalize">{company.business_type}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">{company.nit}</td>
                        <td className="px-4 py-3">
                          <div className="space-y-1">
                            <p className="text-sm text-gray-900">{company.contact_name}</p>
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              <Mail className="w-3 h-3" />
                              {company.contact_email}
                            </div>
                            {company.contact_phone && (
                              <div className="flex items-center gap-2 text-xs text-gray-500">
                                <Phone className="w-3 h-3" />
                                {company.contact_phone}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1 text-sm text-gray-600">
                            <Users className="w-4 h-4" />
                            {company.user_count || 0}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                            statusConfig[company.status]?.bgColor
                          } ${statusConfig[company.status]?.color}`}>
                            <StatusIcon className="w-3 h-3" />
                            {statusConfig[company.status]?.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {formatDate(company.created_at)}
                        </td>
                        <td className="px-4 py-3">
                          <select
                            value={company.status}
                            onChange={(e) => handleUpdateStatus(company.id, e.target.value)}
                            className="text-sm border border-gray-300 rounded-lg px-2 py-1 focus:ring-2 focus:ring-green-500"
                          >
                            {Object.entries(statusConfig).map(([key, config]) => (
                              <option key={key} value={key}>{config.label}</option>
                            ))}
                          </select>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile view */}
            <div className="md:hidden space-y-4 p-4">
              {companies.map((company) => (
                <div key={company.id} className="bg-white rounded-lg border border-gray-200 p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-gray-900">{company.company_name}</h3>
                      <p className="text-sm text-gray-500">{company.nit}</p>
                    </div>
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                      statusConfig[company.status]?.bgColor
                    } ${statusConfig[company.status]?.color}`}>
                      {statusConfig[company.status]?.label}
                    </span>
                  </div>
                  <div className="space-y-1 text-sm text-gray-600">
                    <p>{company.contact_name}</p>
                    <p>{company.contact_email}</p>
                  </div>
                  <div className="mt-3">
                    <select
                      value={company.status}
                      onChange={(e) => handleUpdateStatus(company.id, e.target.value)}
                      className="w-full text-sm border border-gray-300 rounded-lg px-2 py-1 focus:ring-2 focus:ring-green-500"
                    >
                      {Object.entries(statusConfig).map(([key, config]) => (
                        <option key={key} value={key}>{config.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
              ))}
            </div>

            {/* Paginación */}
            <div className="bg-gray-50 px-4 py-3 border-t border-gray-200 flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Mostrando <span className="font-semibold">{(pagination.page - 1) * pagination.page_size + 1}</span> a{' '}
                <span className="font-semibold">{Math.min(pagination.page * pagination.page_size, pagination.total)}</span> de{' '}
                <span className="font-semibold">{pagination.total}</span> empresas
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                  disabled={pagination.page === 1}
                  className="p-2 rounded-lg border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <span className="px-3 py-1 text-sm text-gray-700">
                  Página {pagination.page} de {pagination.total_pages}
                </span>
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                  disabled={pagination.page === pagination.total_pages}
                  className="p-2 rounded-lg border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
