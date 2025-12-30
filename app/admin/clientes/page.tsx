'use client';

import { useEffect, useState } from 'react';
import {
  Search,
  Plus,
  Edit,
  Trash2,
  Phone,
  Mail,
  MapPin,
  User,
  X,
  Save,
  ChevronLeft,
  ChevronRight,
  ShoppingBag,
  Calendar,
  AlertCircle,
  CheckCircle,
  Star,
  UserPlus,
  Users,
  TrendingUp,
  DollarSign,
  UserCheck
} from 'lucide-react';

interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  neighborhood?: string;
  city?: string;
  notes?: string;
  total_orders: number;
  total_spent: number;
  last_order_date?: string;
  is_active: boolean;
  created_at: string;
  is_guest?: boolean; // Flag para identificar clientes invitados
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface CustomerStats {
  total: number;
  registered: number;
  guests: number;
  withPhone: number;
  withEmail: number;
  withAddress: number;
  withName: number;
  incompleteData: number;
  totalSpent: number;
  totalOrders: number;
  avgTicket: number;
  recurring: number; // 2+ pedidos
  // Fuentes de datos
  fromCustomers: number;
  fromProfiles: number;
  fromGuestOrders: number;
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [allCustomers, setAllCustomers] = useState<Customer[]>([]); // Para estadísticas
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dataFilter, setDataFilter] = useState<string>(''); // Filtro de calidad de datos
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
  });
  const [stats, setStats] = useState<CustomerStats>({
    total: 0,
    registered: 0,
    guests: 0,
    withPhone: 0,
    withEmail: 0,
    withAddress: 0,
    withName: 0,
    incompleteData: 0,
    totalSpent: 0,
    totalOrders: 0,
    avgTicket: 0,
    recurring: 0,
    fromCustomers: 0,
    fromProfiles: 0,
    fromGuestOrders: 0
  });

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    neighborhood: '',
    city: 'Bogotá',
    notes: '',
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      loadCustomers();
    }, 300);
    return () => clearTimeout(timer);
  }, [search, pagination.page]);

  // Cargar estadísticas una vez al inicio
  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      // Cargar todos los clientes sin paginación para estadísticas (límite alto)
      const response = await fetch(`/api/admin/customers/?page=1&limit=10000`, {
        credentials: 'include',
      });
      const data = await response.json();

      if (data.success && data.data) {
        const allCust = data.data as (Customer & { source?: string })[];
        setAllCustomers(allCust);

        // Calcular estadísticas
        const registered = allCust.filter(c => !c.is_guest).length;
        const guests = allCust.filter(c => c.is_guest).length;
        const withPhone = allCust.filter(c => c.phone && c.phone !== 'Sin teléfono').length;
        const withEmail = allCust.filter(c => c.email).length;
        const withAddress = allCust.filter(c => c.address).length;

        // Validación de nombre: excluir nombres genéricos y vacíos
        const withName = allCust.filter(c => {
          if (!c.name || c.name.trim() === '') return false;

          const nameLower = c.name.toLowerCase().trim();

          // Lista de palabras/frases que indican nombre genérico
          const genericTerms = [
            'cliente',
            'whatsapp',
            'usuario',
            'invitado',
            'guest',
            'user',
            'sin nombre',
            'desconocido',
            'unknown',
            'pendiente'
          ];

          // Si el nombre contiene algún término genérico, no es válido
          return !genericTerms.some(term => nameLower.includes(term));
        }).length;

        const incompleteData = allCust.filter(c => {
          // Verificar si tiene nombre válido (no genérico)
          let hasName = false;
          if (c.name && c.name.trim() !== '') {
            const nameLower = c.name.toLowerCase().trim();
            const genericTerms = [
              'cliente',
              'whatsapp',
              'usuario',
              'invitado',
              'guest',
              'user',
              'sin nombre',
              'desconocido',
              'unknown',
              'pendiente'
            ];
            hasName = !genericTerms.some(term => nameLower.includes(term));
          }

          return !c.email ||
            !c.address ||
            !c.phone ||
            c.phone === 'Sin teléfono' ||
            !hasName;
        }).length;

        const totalSpent = allCust.reduce((sum, c) => sum + (c.total_spent || 0), 0);
        const totalOrders = allCust.reduce((sum, c) => sum + (c.total_orders || 0), 0);
        const recurring = allCust.filter(c => c.total_orders >= 2).length;
        const avgTicket = totalOrders > 0 ? totalSpent / totalOrders : 0;

        // Obtener fuentes de datos de la respuesta
        const fromCustomers = data.sources?.customers || allCust.filter(c => c.source === 'customers').length;
        const fromProfiles = data.sources?.profiles || allCust.filter(c => c.source === 'profiles').length;
        const fromGuestOrders = data.sources?.guests || allCust.filter(c => c.source === 'guest_orders').length;

        setStats({
          total: data.pagination?.total || allCust.length,
          registered,
          guests,
          withPhone,
          withEmail,
          withAddress,
          withName,
          incompleteData,
          totalSpent,
          totalOrders,
          avgTicket,
          recurring,
          fromCustomers,
          fromProfiles,
          fromGuestOrders
        });
      }
    } catch (error) {
      console.error('Error cargando estadísticas:', error);
    }
  };

  const loadCustomers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', pagination.page.toString());
      params.set('limit', pagination.limit.toString());
      if (search) params.set('search', search);

      const response = await fetch(`/api/admin/customers/?${params}`, {
        credentials: 'include',
      });
      const data = await response.json();

      if (data.success) {
        setCustomers(data.data || []);
        setPagination(prev => ({
          ...prev,
          total: data.pagination?.total || 0,
          totalPages: data.pagination?.totalPages || 1,
        }));
      }
    } catch (error) {
      console.error('Error cargando clientes:', error);
      showNotification('error', 'Error al cargar clientes');
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  const openCreateModal = () => {
    setEditingCustomer(null);
    setFormData({
      name: '',
      phone: '',
      email: '',
      address: '',
      neighborhood: '',
      city: 'Bogotá',
      notes: '',
    });
    setShowModal(true);
  };

  const openEditModal = (customer: Customer) => {
    setEditingCustomer(customer);
    setFormData({
      name: customer.name,
      phone: customer.phone,
      email: customer.email || '',
      address: customer.address || '',
      neighborhood: customer.neighborhood || '',
      city: customer.city || 'Bogotá',
      notes: customer.notes || '',
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim() || !formData.phone.trim()) {
      showNotification('error', 'Nombre y teléfono son requeridos');
      return;
    }

    setSaving(true);
    try {
      const url = editingCustomer
        ? `/api/admin/customers/?id=${editingCustomer.id}`
        : '/api/admin/customers/';

      const response = await fetch(url, {
        method: editingCustomer ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        showNotification('success', editingCustomer ? 'Cliente actualizado' : 'Cliente creado');
        setShowModal(false);
        loadCustomers();
      } else {
        showNotification('error', data.error || 'Error al guardar');
      }
    } catch (error) {
      console.error('Error guardando cliente:', error);
      showNotification('error', 'Error de conexión');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (customer: Customer) => {
    if (!confirm(`¿Eliminar a ${customer.name}?`)) return;

    try {
      const response = await fetch(`/api/admin/customers/?id=${customer.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      const data = await response.json();

      if (data.success) {
        showNotification('success', 'Cliente eliminado');
        loadCustomers();
      } else {
        showNotification('error', data.error || 'Error al eliminar');
      }
    } catch (error) {
      console.error('Error eliminando cliente:', error);
      showNotification('error', 'Error de conexión');
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
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      {/* Notificación */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 ${notification.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
          }`}>
          {notification.type === 'success' ? (
            <CheckCircle className="w-5 h-5" />
          ) : (
            <AlertCircle className="w-5 h-5" />
          )}
          <span className="font-medium">{notification.message}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Gestión de Clientes</h1>
          <p className="text-gray-600 mt-1">Administra tu base de clientes</p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
        >
          <Plus className="w-5 h-5" />
          Nuevo Cliente
        </button>
      </div>

      {/* Estadísticas de Clientes */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {/* Total de Clientes */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              <p className="text-xs text-gray-500">Total Clientes</p>
            </div>
          </div>
        </div>

        {/* Registrados vs Invitados */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
              <UserCheck className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.registered}</p>
              <p className="text-xs text-gray-500">Registrados</p>
              <p className="text-xs text-purple-600">{stats.guests} invitados</p>
            </div>
          </div>
        </div>

        {/* Clientes Recurrentes */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center">
              <Star className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.recurring}</p>
              <p className="text-xs text-gray-500">Recurrentes</p>
              <p className="text-xs text-gray-400">(2+ pedidos)</p>
            </div>
          </div>
        </div>

        {/* Total Ventas */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-lg font-bold text-gray-900">{formatCurrency(stats.totalSpent)}</p>
              <p className="text-xs text-gray-500">Total Ventas</p>
            </div>
          </div>
        </div>

        {/* Ticket Promedio */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-lg font-bold text-gray-900">{formatCurrency(stats.avgTicket)}</p>
              <p className="text-xs text-gray-500">Ticket Promedio</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filtros de Calidad de Datos */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-700">Filtros de Calidad de Datos</h3>
          {dataFilter && (
            <button
              onClick={() => setDataFilter('')}
              className="text-xs text-gray-500 hover:text-gray-700 underline"
            >
              Limpiar filtro
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-3 text-sm">
          {/* Con email */}
          <button
            onClick={() => setDataFilter(dataFilter === 'withEmail' ? '' : 'withEmail')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${dataFilter === 'withEmail'
              ? 'bg-blue-600 text-white shadow-md'
              : 'bg-blue-50 hover:bg-blue-100 border border-blue-200'
              }`}
          >
            <Mail className="w-4 h-4" />
            <span className={dataFilter === 'withEmail' ? 'text-white' : 'text-gray-600'}>Con email:</span>
            <span className={`font-semibold ${dataFilter === 'withEmail' ? 'text-white' : 'text-blue-600'}`}>{stats.withEmail}</span>
            <span className={dataFilter === 'withEmail' ? 'text-blue-100' : 'text-gray-400'}>({stats.total > 0 ? Math.round((stats.withEmail / stats.total) * 100) : 0}%)</span>
          </button>

          {/* Sin email */}
          <button
            onClick={() => setDataFilter(dataFilter === 'noEmail' ? '' : 'noEmail')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${dataFilter === 'noEmail'
              ? 'bg-red-600 text-white shadow-md'
              : 'bg-red-50 hover:bg-red-100 border border-red-200'
              }`}
          >
            <Mail className="w-4 h-4" />
            <span className={dataFilter === 'noEmail' ? 'text-white' : 'text-gray-600'}>Sin email:</span>
            <span className={`font-semibold ${dataFilter === 'noEmail' ? 'text-white' : 'text-red-600'}`}>{stats.total - stats.withEmail}</span>
          </button>

          {/* Con dirección */}
          <button
            onClick={() => setDataFilter(dataFilter === 'withAddress' ? '' : 'withAddress')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${dataFilter === 'withAddress'
              ? 'bg-orange-600 text-white shadow-md'
              : 'bg-orange-50 hover:bg-orange-100 border border-orange-200'
              }`}
          >
            <MapPin className="w-4 h-4" />
            <span className={dataFilter === 'withAddress' ? 'text-white' : 'text-gray-600'}>Con dirección:</span>
            <span className={`font-semibold ${dataFilter === 'withAddress' ? 'text-white' : 'text-orange-600'}`}>{stats.withAddress}</span>
            <span className={dataFilter === 'withAddress' ? 'text-orange-100' : 'text-gray-400'}>({stats.total > 0 ? Math.round((stats.withAddress / stats.total) * 100) : 0}%)</span>
          </button>

          {/* Sin dirección */}
          <button
            onClick={() => setDataFilter(dataFilter === 'noAddress' ? '' : 'noAddress')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${dataFilter === 'noAddress'
              ? 'bg-red-600 text-white shadow-md'
              : 'bg-red-50 hover:bg-red-100 border border-red-200'
              }`}
          >
            <MapPin className="w-4 h-4" />
            <span className={dataFilter === 'noAddress' ? 'text-white' : 'text-gray-600'}>Sin dirección:</span>
            <span className={`font-semibold ${dataFilter === 'noAddress' ? 'text-white' : 'text-red-600'}`}>{stats.total - stats.withAddress}</span>
          </button>

          {/* Con nombre */}
          <button
            onClick={() => setDataFilter(dataFilter === 'withName' ? '' : 'withName')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${dataFilter === 'withName'
              ? 'bg-teal-600 text-white shadow-md'
              : 'bg-teal-50 hover:bg-teal-100 border border-teal-200'
              }`}
          >
            <User className="w-4 h-4" />
            <span className={dataFilter === 'withName' ? 'text-white' : 'text-gray-600'}>Con nombre:</span>
            <span className={`font-semibold ${dataFilter === 'withName' ? 'text-white' : 'text-teal-600'}`}>{stats.withName}</span>
            <span className={dataFilter === 'withName' ? 'text-teal-100' : 'text-gray-400'}>({stats.total > 0 ? Math.round((stats.withName / stats.total) * 100) : 0}%)</span>
          </button>

          {/* Sin nombre - PRIORIDAD para completar datos */}
          <button
            onClick={() => setDataFilter(dataFilter === 'noName' ? '' : 'noName')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all border-2 ${dataFilter === 'noName'
              ? 'bg-amber-600 text-white shadow-lg border-amber-700 ring-2 ring-amber-300'
              : 'bg-amber-50 hover:bg-amber-100 border-amber-400 hover:border-amber-500'
              }`}
          >
            <AlertCircle className="w-4 h-4" />
            <span className={dataFilter === 'noName' ? 'text-white font-semibold' : 'text-amber-800 font-medium'}>⚠️ Sin nombre:</span>
            <span className={`font-bold ${dataFilter === 'noName' ? 'text-white' : 'text-amber-700'}`}>{stats.total - stats.withName}</span>
            {(stats.total - stats.withName) > 0 && (
              <span className={`text-xs px-1.5 py-0.5 rounded ${dataFilter === 'noName' ? 'bg-amber-500 text-white' : 'bg-amber-200 text-amber-800'}`}>
                Prioridad
              </span>
            )}
          </button>

          {/* Datos incompletos */}
          <button
            onClick={() => setDataFilter(dataFilter === 'incomplete' ? '' : 'incomplete')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${dataFilter === 'incomplete'
              ? 'bg-purple-600 text-white shadow-md'
              : 'bg-purple-50 hover:bg-purple-100 border border-purple-200'
              }`}
          >
            <AlertCircle className="w-4 h-4" />
            <span className={dataFilter === 'incomplete' ? 'text-white' : 'text-gray-600'}>Datos Incompletos:</span>
            <span className={`font-semibold ${dataFilter === 'incomplete' ? 'text-white' : 'text-purple-600'}`}>{stats.incompleteData}</span>
          </button>
        </div>
        {/* Fuentes de datos */}
        <div className="mt-3 pt-3 border-t border-gray-200 flex flex-wrap gap-4 text-xs">
          <span className="text-gray-500 font-medium">Fuentes de datos:</span>
          <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">
            Tabla Customers: {stats.fromCustomers}
          </span>
          <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full">
            Usuarios Registrados: {stats.fromProfiles}
          </span>
          <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full">
            Pedidos Invitados: {stats.fromGuestOrders}
          </span>
        </div>
      </div>

      {/* Búsqueda */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nombre, teléfono o email..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPagination(prev => ({ ...prev, page: 1 }));
            }}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
          />
        </div>
      </div>

      {/* Alerta de clientes VIP invitados */}
      {(() => {
        const vipGuests = customers.filter(c => c.is_guest && c.total_orders >= 3);
        if (vipGuests.length > 0) {
          return (
            <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                    <UserPlus className="w-5 h-5 text-purple-600" />
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-purple-900 mb-1">
                    ¡Tienes {vipGuests.length} cliente{vipGuests.length > 1 ? 's' : ''} VIP sin cuenta!
                  </h3>
                  <p className="text-sm text-purple-700 mb-2">
                    {vipGuests.length > 1 ? 'Estos clientes han' : 'Este cliente ha'} hecho 3 o más pedidos sin registrarse. Convertirlos en clientes registrados te permitirá:
                  </p>
                  <ul className="text-sm text-purple-600 space-y-1 mb-3">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      Seguimiento completo de sus pedidos
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      Enviarles promociones y descuentos personalizados
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      Mejor experiencia de compra para ellos
                    </li>
                  </ul>
                  <p className="text-xs text-purple-600">
                    💡 <strong>Consejo:</strong> Busca clientes con el badge morado "¡Convertir!" y haz clic en Editar para crearles una cuenta.
                  </p>
                </div>
              </div>
            </div>
          );
        }
        return null;
      })()}

      {/* Tabla de clientes */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
          </div>
        ) : (() => {
          // Aplicar filtro de calidad de datos
          // Si hay filtro activo, usar TODOS los clientes (allCustomers), no solo la página actual
          const baseCustomers = dataFilter ? allCustomers : customers;

          const filteredCustomers = dataFilter ? baseCustomers.filter(customer => {
            // Función helper para verificar si tiene nombre válido (no genérico)
            const hasName = (name: string) => {
              if (!name || name.trim() === '') return false;

              const nameLower = name.toLowerCase().trim();

              // Lista de palabras/frases que indican nombre genérico
              const genericTerms = [
                'cliente',
                'whatsapp',
                'usuario',
                'invitado',
                'guest',
                'user',
                'sin nombre',
                'desconocido',
                'unknown',
                'pendiente'
              ];

              // Si el nombre contiene algún término genérico, no es válido
              return !genericTerms.some(term => nameLower.includes(term));
            };

            switch (dataFilter) {
              case 'withPhone':
                return customer.phone && customer.phone !== 'Sin teléfono';
              case 'noPhone':
                return !customer.phone || customer.phone === 'Sin teléfono';
              case 'withEmail':
                return !!customer.email;
              case 'noEmail':
                return !customer.email;
              case 'withAddress':
                return !!customer.address;
              case 'noAddress':
                return !customer.address;
              case 'withName':
                return hasName(customer.name);
              case 'noName':
                return !hasName(customer.name);
              case 'incomplete':
                return !customer.email ||
                  !customer.address ||
                  !customer.phone ||
                  customer.phone === 'Sin teléfono' ||
                  !hasName(customer.name);
              default:
                return true;
            }
          }) : baseCustomers;

          return filteredCustomers.length === 0 ? (
            <div className="text-center py-12">
              <User className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No se encontraron clientes con este filtro</p>
              <p className="text-gray-400 text-sm mt-1">Intenta con otro filtro</p>
            </div>
          ) : (
            <>
              {/* Vista móvil */}
              <div className="lg:hidden divide-y divide-gray-200">
                {filteredCustomers.map((customer) => (
                  <div key={customer.id} className="p-4 hover:bg-gray-50">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-gray-900">{customer.name}</p>
                          {customer.total_orders >= 2 && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                              <Star className="w-3 h-3" />
                              Cliente recurrente
                            </span>
                          )}
                          {customer.is_guest && customer.total_orders >= 3 && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                              <UserPlus className="w-3 h-3" />
                              ¡Convertir!
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {customer.phone}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        {/* Botón de WhatsApp */}
                        {customer.phone && customer.phone !== 'Sin teléfono' && (
                          <a
                            href={`https://wa.me/57${customer.phone.replace(/\D/g, '')}?text=Hola ${customer.name}, te escribimos de Tus Aguacates`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 bg-green-100 hover:bg-green-200 rounded-lg"
                            title="Abrir WhatsApp"
                          >
                            <Phone className="w-4 h-4 text-green-600" />
                          </a>
                        )}
                        <button
                          onClick={() => openEditModal(customer)}
                          className="p-2 hover:bg-gray-100 rounded-lg"
                        >
                          <Edit className="w-4 h-4 text-gray-600" />
                        </button>
                        <button
                          onClick={() => handleDelete(customer)}
                          className="p-2 hover:bg-red-50 rounded-lg"
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </button>
                      </div>
                    </div>
                    {customer.address && (
                      <p className="text-sm text-gray-500 flex items-center gap-1 mb-2">
                        <MapPin className="w-3 h-3" />
                        {customer.address}
                      </p>
                    )}
                    <div className="flex gap-4 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <ShoppingBag className="w-3 h-3" />
                        {customer.total_orders} pedidos
                      </span>
                      <span className="font-medium text-green-600">
                        {formatCurrency(customer.total_spent || 0)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Vista desktop */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Cliente</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Contacto</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Dirección</th>
                      <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Pedidos</th>
                      <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Total Gastado</th>
                      <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredCustomers.map((customer) => (
                      <tr key={customer.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <p className="font-semibold text-gray-900">{customer.name}</p>
                            {customer.total_orders >= 2 && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                <Star className="w-3 h-3" />
                                Recurrente
                              </span>
                            )}
                            {customer.is_guest && customer.total_orders >= 3 && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                <UserPlus className="w-3 h-3" />
                                ¡Convertir!
                              </span>
                            )}
                          </div>
                          {customer.last_order_date && (
                            <p className="text-xs text-gray-500 flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              Último pedido: {formatDate(customer.last_order_date)}
                            </p>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm text-gray-900 flex items-center gap-1">
                            <Phone className="w-3 h-3 text-gray-400" />
                            {customer.phone}
                          </p>
                          {customer.email && (
                            <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                              <Mail className="w-3 h-3 text-gray-400" />
                              {customer.email}
                            </p>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {customer.address ? (
                            <p className="text-sm text-gray-600 max-w-xs truncate">{customer.address}</p>
                          ) : (
                            <span className="text-sm text-gray-400">Sin dirección</span>
                          )}
                          {customer.neighborhood && (
                            <p className="text-xs text-gray-500">{customer.neighborhood}</p>
                          )}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                            <ShoppingBag className="w-3 h-3" />
                            {customer.total_orders}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="font-semibold text-green-600">
                            {formatCurrency(customer.total_spent || 0)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-2">
                            {/* Botón de WhatsApp */}
                            {customer.phone && customer.phone !== 'Sin teléfono' && (
                              <a
                                href={`https://wa.me/57${customer.phone.replace(/\D/g, '')}?text=Hola ${customer.name}, te escribimos de Tus Aguacates`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-1"
                                title="Abrir WhatsApp"
                              >
                                <Phone className="w-4 h-4" />
                                WhatsApp
                              </a>
                            )}
                            <button
                              onClick={() => openEditModal(customer)}
                              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                            >
                              Editar
                            </button>
                            <button
                              onClick={() => handleDelete(customer)}
                              className="px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg text-sm font-medium transition-colors"
                            >
                              Eliminar
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Paginación */}
              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
                  <p className="text-sm text-gray-600">
                    Mostrando {((pagination.page - 1) * pagination.limit) + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} de {pagination.total}
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                      disabled={pagination.page === 1}
                      className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                      disabled={pagination.page >= pagination.totalPages}
                      className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              )}
            </>
          );
        })()}
      </div>

      {/* Modal de crear/editar cliente */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                {editingCustomer ? 'Editar Cliente' : 'Nuevo Cliente'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre completo *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                  placeholder="Nombre del cliente"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Teléfono / WhatsApp *
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                  placeholder="300 123 4567"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Correo electrónico
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                  placeholder="cliente@ejemplo.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Dirección
                </label>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  rows={2}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none resize-none"
                  placeholder="Calle, número, edificio, apartamento..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Barrio
                  </label>
                  <input
                    type="text"
                    value={formData.neighborhood}
                    onChange={(e) => setFormData({ ...formData, neighborhood: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                    placeholder="Barrio"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ciudad
                  </label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                    placeholder="Bogotá"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notas
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={2}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none resize-none"
                  placeholder="Notas adicionales sobre el cliente..."
                />
              </div>
            </div>

            <div className="flex gap-3 p-4 border-t border-gray-200">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-2.5 border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg font-medium transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 px-4 py-2.5 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    {editingCustomer ? 'Actualizar' : 'Crear Cliente'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
