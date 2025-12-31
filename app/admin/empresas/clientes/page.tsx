'use client';

import { useEffect, useState } from 'react';
import {
  Search,
  Building2,
  Phone,
  Mail,
  MapPin,
  ShoppingBag,
  TrendingUp,
  Calendar,
  User,
  FileText
} from 'lucide-react';

interface B2BClient {
  id: string;
  name: string;
  email: string;
  phone: string;
  company_name: string;
  nit?: string;
  address?: string;
  city?: string;
  total_orders: number;
  total_spent: number;
  last_order_date?: string;
}

export default function B2BClientsPage() {
  const [clients, setClients] = useState<B2BClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/empresas/clients', {
        credentials: 'include',
      });
      const data = await response.json();

      if (data.success) {
        setClients(data.clients || []);
      }
    } catch (error) {
      console.error('Error cargando clientes B2B:', error);
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
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const filteredClients = clients.filter(client => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      client.name?.toLowerCase().includes(searchLower) ||
      client.company_name?.toLowerCase().includes(searchLower) ||
      client.email?.toLowerCase().includes(searchLower) ||
      client.nit?.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
          <Building2 className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Clientes Empresariales</h1>
          <p className="text-gray-600 mt-1">Gestiona tus clientes B2B</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <Building2 className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Clientes</p>
              <p className="text-2xl font-bold text-gray-900">{clients.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Ventas B2B</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(clients.reduce((sum, c) => sum + c.total_spent, 0))}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <ShoppingBag className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Pedidos</p>
              <p className="text-2xl font-bold text-gray-900">
                {clients.reduce((sum, c) => sum + c.total_orders, 0)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Búsqueda */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nombre, empresa, NIT..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          />
        </div>
      </div>

      {/* Lista de Clientes */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredClients.length === 0 ? (
          <div className="text-center py-12">
            <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No hay clientes empresariales</p>
            <p className="text-gray-400 text-sm mt-2">
              Los clientes que realicen pedidos B2B aparecerán aquí automáticamente
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredClients.map((client) => (
              <div key={client.id} className="p-4 lg:p-6 hover:bg-gray-50 transition-colors">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  {/* Info del cliente */}
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <Building2 className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{client.company_name || 'Sin nombre'}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <User className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-600">{client.name}</span>
                      </div>
                      {client.nit && (
                        <div className="flex items-center gap-2 mt-1">
                          <FileText className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-500">NIT: {client.nit}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Contacto */}
                  <div className="flex flex-wrap gap-4 lg:gap-6">
                    {client.email && (
                      <a href={`mailto:${client.email}`} className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700">
                        <Mail className="w-4 h-4" />
                        {client.email}
                      </a>
                    )}
                    {client.phone && (
                      <a href={`tel:${client.phone}`} className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700">
                        <Phone className="w-4 h-4" />
                        {client.phone}
                      </a>
                    )}
                    {client.city && (
                      <span className="flex items-center gap-2 text-sm text-gray-500">
                        <MapPin className="w-4 h-4" />
                        {client.city}
                      </span>
                    )}
                  </div>

                  {/* Stats */}
                  <div className="flex gap-6 lg:text-right">
                    <div>
                      <p className="text-xs text-gray-500">Pedidos</p>
                      <p className="font-semibold text-gray-900">{client.total_orders}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Total Compras</p>
                      <p className="font-semibold text-blue-600">{formatCurrency(client.total_spent)}</p>
                    </div>
                    {client.last_order_date && (
                      <div>
                        <p className="text-xs text-gray-500">Último Pedido</p>
                        <p className="text-sm text-gray-600">{formatDate(client.last_order_date)}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
