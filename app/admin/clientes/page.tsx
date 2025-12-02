'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Customer, CreateCustomerInput } from '@/lib/types/customer';
import CustomerModal from './components/CustomerModal';

export default function ClientesPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [selectedCustomerOrders, setSelectedCustomerOrders] = useState<any[]>([]);
  const [showOrdersModal, setShowOrdersModal] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    loadCustomers();
  }, []);

  useEffect(() => {
    filterCustomers();
  }, [searchTerm, customers]);

  const loadCustomers = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCustomers(data || []);
    } catch (error) {
      console.error('Error al cargar clientes:', error);
      alert('Error al cargar los clientes');
    } finally {
      setIsLoading(false);
    }
  };

  const filterCustomers = () => {
    if (!searchTerm.trim()) {
      setFilteredCustomers(customers);
      return;
    }

    const term = searchTerm.toLowerCase();
    const filtered = customers.filter(
      (customer) =>
        customer.name.toLowerCase().includes(term) ||
        customer.phone.includes(term) ||
        (customer.email && customer.email.toLowerCase().includes(term))
    );
    setFilteredCustomers(filtered);
  };

  const handleSaveCustomer = async (customerData: CreateCustomerInput) => {
    try {
      if (selectedCustomer) {
        // Actualizar
        const { error } = await supabase
          .from('customers')
          .update(customerData)
          .eq('id', selectedCustomer.id);

        if (error) throw error;
      } else {
        // Crear nuevo
        const { error } = await supabase.from('customers').insert([customerData]);

        if (error) throw error;
      }

      await loadCustomers();
      setIsModalOpen(false);
      setSelectedCustomer(null);
    } catch (error: any) {
      console.error('Error al guardar cliente:', error);
      if (error.code === '23505') {
        throw new Error('Ya existe un cliente con ese número de teléfono');
      }
      throw error;
    }
  };

  const handleDeleteCustomer = async (customerId: string) => {
    if (!confirm('¿Estás seguro de eliminar este cliente?')) return;

    try {
      const { error } = await supabase.from('customers').delete().eq('id', customerId);

      if (error) throw error;
      await loadCustomers();
    } catch (error) {
      console.error('Error al eliminar cliente:', error);
      alert('Error al eliminar el cliente');
    }
  };

  const handleViewOrders = async (customer: Customer) => {
    try {
      const { data, error } = await supabase
        .from('guest_orders')
        .select('*')
        .eq('customer_id', customer.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setSelectedCustomer(customer);
      setSelectedCustomerOrders(data || []);
      setShowOrdersModal(true);
    } catch (error) {
      console.error('Error al cargar pedidos:', error);
      alert('Error al cargar los pedidos del cliente');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Gestión de Clientes</h1>
          <p className="text-gray-600">Administra tu base de clientes y su historial de pedidos</p>
        </div>

        {/* Barra de búsqueda y acciones */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex-1 w-full md:max-w-md">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Buscar por nombre, teléfono o email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <svg
                  className="absolute left-3 top-2.5 w-5 h-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
            </div>

            <button
              onClick={() => {
                setSelectedCustomer(null);
                setIsModalOpen(true);
              }}
              className="w-full md:w-auto bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Nuevo Cliente
            </button>
          </div>

          {/* Estadísticas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-sm text-blue-600 font-medium">Total Clientes</p>
              <p className="text-2xl font-bold text-blue-700">{customers.length}</p>
            </div>
            <div className="bg-green-50 p-3 rounded-lg">
              <p className="text-sm text-green-600 font-medium">Clientes con Email</p>
              <p className="text-2xl font-bold text-green-700">
                {customers.filter((c) => c.email).length}
              </p>
            </div>
            <div className="bg-purple-50 p-3 rounded-lg">
              <p className="text-sm text-purple-600 font-medium">Resultados de Búsqueda</p>
              <p className="text-2xl font-bold text-purple-700">{filteredCustomers.length}</p>
            </div>
          </div>
        </div>

        {/* Lista de clientes */}
        {isLoading ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
            <p className="mt-4 text-gray-600">Cargando clientes...</p>
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
            <h3 className="mt-2 text-lg font-medium text-gray-900">
              {searchTerm ? 'No se encontraron clientes' : 'No hay clientes registrados'}
            </h3>
            <p className="mt-1 text-gray-500">
              {searchTerm
                ? 'Intenta con otra búsqueda'
                : 'Comienza agregando tu primer cliente'}
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cliente
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contacto
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Direcciones
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Registrado
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredCustomers.map((customer) => (
                    <tr key={customer.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-green-100 rounded-full flex items-center justify-center">
                            <span className="text-green-600 font-semibold">
                              {customer.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{customer.name}</div>
                            {customer.notes && (
                              <div className="text-xs text-gray-500 truncate max-w-xs">
                                {customer.notes}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{customer.phone}</div>
                        {customer.email && (
                          <div className="text-sm text-gray-500">{customer.email}</div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {customer.addresses.length > 0 ? (
                            <div className="space-y-1">
                              {customer.addresses.slice(0, 2).map((addr, idx) => (
                                <div key={idx} className="flex items-start">
                                  {addr.isDefault && (
                                    <span className="text-green-600 mr-1">✓</span>
                                  )}
                                  <span className="text-xs">
                                    {addr.label && (
                                      <span className="font-medium">{addr.label}: </span>
                                    )}
                                    <span className="text-gray-600">{addr.address}</span>
                                  </span>
                                </div>
                              ))}
                              {customer.addresses.length > 2 && (
                                <span className="text-xs text-gray-500">
                                  +{customer.addresses.length - 2} más
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-gray-400 italic text-xs">
                              Sin direcciones
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{formatDate(customer.created_at)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleViewOrders(customer)}
                            className="text-blue-600 hover:text-blue-900"
                            title="Ver pedidos"
                          >
                            <svg
                              className="w-5 h-5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                              />
                            </svg>
                          </button>
                          <button
                            onClick={() => {
                              setSelectedCustomer(customer);
                              setIsModalOpen(true);
                            }}
                            className="text-indigo-600 hover:text-indigo-900"
                            title="Editar"
                          >
                            <svg
                              className="w-5 h-5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                              />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDeleteCustomer(customer.id)}
                            className="text-red-600 hover:text-red-900"
                            title="Eliminar"
                          >
                            <svg
                              className="w-5 h-5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Modal de cliente */}
      <CustomerModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedCustomer(null);
        }}
        onSave={handleSaveCustomer}
        customer={selectedCustomer}
      />

      {/* Modal de pedidos del cliente */}
      {showOrdersModal && selectedCustomer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">
                    Pedidos de {selectedCustomer.name}
                  </h2>
                  <p className="text-sm text-gray-600">
                    {selectedCustomerOrders.length} pedido(s) registrado(s)
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowOrdersModal(false);
                    setSelectedCustomer(null);
                    setSelectedCustomerOrders([]);
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              {selectedCustomerOrders.length === 0 ? (
                <div className="text-center py-12">
                  <svg
                    className="mx-auto h-12 w-12 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  <p className="mt-2 text-gray-600">Este cliente no tiene pedidos aún</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {selectedCustomerOrders.map((order) => (
                    <div key={order.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-semibold text-gray-800">
                            Pedido #{order.id.slice(0, 8)}
                          </p>
                          <p className="text-sm text-gray-600">
                            {formatDate(order.created_at)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-green-600">
                            {formatCurrency(order.total_amount)}
                          </p>
                          <span
                            className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                              order.status === 'completado'
                                ? 'bg-green-100 text-green-800'
                                : order.status === 'pendiente'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {order.status}
                          </span>
                        </div>
                      </div>
                      <div className="text-sm text-gray-600">
                        <p>
                          <strong>Método de pago:</strong> {order.payment_method || 'N/A'}
                        </p>
                        {order.delivery_date && (
                          <p>
                            <strong>Fecha de entrega:</strong> {formatDate(order.delivery_date)}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
