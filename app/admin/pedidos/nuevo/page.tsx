'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Customer, CustomerAddress } from '@/lib/types/customer';
import ProductSelector from '../components/ProductSelector';
import CustomerModal from '../../clientes/components/CustomerModal';

interface SelectedProduct {
  product: {
    id: string;
    name: string;
    price: number;
    category_id: string;
    main_image_url?: string;
    stock: number;
  };
  quantity: number;
}

export default function NuevoPedidoPage() {
  const router = useRouter();
  const supabase = createClient();

  // Estado del cliente
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerSearch, setCustomerSearch] = useState('');
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showNewCustomerForm, setShowNewCustomerForm] = useState(false);

  // Datos del cliente (para cliente nuevo sin guardar)
  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [guestAddress, setGuestAddress] = useState('');

  // Estado de productos
  const [selectedProducts, setSelectedProducts] = useState<SelectedProduct[]>([]);

  // Estado del pedido
  const [deliveryDate, setDeliveryDate] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('efectivo');
  const [notes, setNotes] = useState('');
  const [selectedAddress, setSelectedAddress] = useState<CustomerAddress | null>(null);

  // Estado UI
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('name');

      if (error) throw error;
      setCustomers(data || []);
    } catch (error) {
      console.error('Error al cargar clientes:', error);
    }
  };

  const handleSaveNewCustomer = async (customerData: any) => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .insert([customerData])
        .select()
        .single();

      if (error) throw error;

      await loadCustomers();
      setSelectedCustomer(data);
      setShowCustomerModal(false);
      setShowNewCustomerForm(false);

      // Seleccionar la primera dirección como predeterminada
      if (data.addresses && data.addresses.length > 0) {
        const defaultAddr = data.addresses.find((a: CustomerAddress) => a.isDefault) || data.addresses[0];
        setSelectedAddress(defaultAddr);
      }
    } catch (error: any) {
      console.error('Error al guardar cliente:', error);
      if (error.code === '23505') {
        alert('Ya existe un cliente con ese número de teléfono');
      } else {
        alert('Error al guardar el cliente');
      }
      throw error;
    }
  };

  const handleSelectCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setCustomerSearch('');
    setShowNewCustomerForm(false);

    // Seleccionar la dirección predeterminada
    if (customer.addresses && customer.addresses.length > 0) {
      const defaultAddr = customer.addresses.find(a => a.isDefault) || customer.addresses[0];
      setSelectedAddress(defaultAddr);
    }
  };

  const handleSubmitOrder = async () => {
    // Validaciones
    if (selectedProducts.length === 0) {
      alert('Debes agregar al menos un producto al pedido');
      return;
    }

    let customerName = '';
    let customerPhone = '';
    let customerEmail = '';
    let customerAddress = '';
    let customerId: string | null = null;

    if (selectedCustomer) {
      customerName = selectedCustomer.name;
      customerPhone = selectedCustomer.phone;
      customerEmail = selectedCustomer.email || '';
      customerAddress = selectedAddress?.address || '';
      customerId = selectedCustomer.id;
    } else if (showNewCustomerForm) {
      if (!guestName.trim() || !guestPhone.trim() || !guestAddress.trim()) {
        alert('Por favor completa los datos del cliente: Nombre, Teléfono y Dirección');
        return;
      }
      customerName = guestName;
      customerPhone = guestPhone;
      customerEmail = guestEmail;
      customerAddress = guestAddress;
    } else {
      alert('Debes seleccionar un cliente o crear uno nuevo');
      return;
    }

    setIsSubmitting(true);

    try {
      // Preparar los datos del pedido
      const orderData = {
        items: selectedProducts.map(sp => ({
          product_id: sp.product.id,
          name: sp.product.name,
          price: sp.product.price,
          quantity: sp.quantity,
          subtotal: sp.product.price * sp.quantity
        }))
      };

      const totalAmount = selectedProducts.reduce(
        (sum, sp) => sum + sp.product.price * sp.quantity,
        0
      );

      // Crear el pedido
      const { data: order, error: orderError } = await supabase
        .from('guest_orders')
        .insert([
          {
            customer_id: customerId,
            guest_name: customerName,
            guest_email: customerEmail,
            guest_phone: customerPhone,
            guest_address: customerAddress,
            order_data: orderData,
            total_amount: totalAmount,
            status: 'pendiente',
            payment_status: 'pendiente',
            payment_method: paymentMethod,
            delivery_date: deliveryDate || null,
            created_at: new Date().toISOString()
          }
        ])
        .select()
        .single();

      if (orderError) throw orderError;

      // Actualizar stock de productos
      for (const sp of selectedProducts) {
        const { error: stockError } = await supabase
          .from('products')
          .update({ stock: sp.product.stock - sp.quantity })
          .eq('id', sp.product.id);

        if (stockError) {
          console.error('Error al actualizar stock:', stockError);
        }
      }

      alert('¡Pedido creado exitosamente!');
      router.push('/admin/pedidos');
    } catch (error) {
      console.error('Error al crear pedido:', error);
      alert('Error al crear el pedido. Por favor intenta de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
      c.phone.includes(customerSearch)
  );

  const totalAmount = selectedProducts.reduce(
    (sum, sp) => sum + sp.product.price * sp.quantity,
    0
  );

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
          <div className="flex items-center gap-3 mb-2">
            <button
              onClick={() => router.back()}
              className="text-gray-600 hover:text-gray-900"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
            <h1 className="text-3xl font-bold text-gray-900">Crear Nuevo Pedido</h1>
          </div>
          <p className="text-gray-600 ml-9">
            Selecciona un cliente y agrega productos al pedido
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Columna izquierda - Cliente y Detalles */}
          <div className="lg:col-span-1 space-y-6">
            {/* Selector de Cliente */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Cliente</h2>

              {!selectedCustomer && !showNewCustomerForm ? (
                <>
                  {/* Búsqueda de cliente */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Buscar Cliente Existente
                    </label>
                    <input
                      type="text"
                      value={customerSearch}
                      onChange={(e) => setCustomerSearch(e.target.value)}
                      placeholder="Nombre o teléfono..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />

                    {customerSearch && filteredCustomers.length > 0 && (
                      <div className="mt-2 border border-gray-200 rounded-lg max-h-48 overflow-y-auto">
                        {filteredCustomers.map((customer) => (
                          <button
                            key={customer.id}
                            onClick={() => handleSelectCustomer(customer)}
                            className="w-full text-left px-3 py-2 hover:bg-gray-50 border-b last:border-b-0"
                          >
                            <div className="font-medium text-gray-900">{customer.name}</div>
                            <div className="text-sm text-gray-600">{customer.phone}</div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowCustomerModal(true)}
                      className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700"
                    >
                      Crear y Guardar Cliente
                    </button>
                    <button
                      onClick={() => setShowNewCustomerForm(true)}
                      className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
                    >
                      Cliente Sin Guardar
                    </button>
                  </div>
                </>
              ) : selectedCustomer ? (
                <div>
                  <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4 mb-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-bold text-gray-900">{selectedCustomer.name}</h3>
                        <p className="text-sm text-gray-600">{selectedCustomer.phone}</p>
                        {selectedCustomer.email && (
                          <p className="text-sm text-gray-600">{selectedCustomer.email}</p>
                        )}
                      </div>
                      <button
                        onClick={() => {
                          setSelectedCustomer(null);
                          setSelectedAddress(null);
                        }}
                        className="text-red-500 hover:text-red-700"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Selector de dirección */}
                  {selectedCustomer.addresses && selectedCustomer.addresses.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Dirección de Entrega
                      </label>
                      <div className="space-y-2">
                        {selectedCustomer.addresses.map((addr, idx) => (
                          <button
                            key={idx}
                            onClick={() => setSelectedAddress(addr)}
                            className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                              selectedAddress === addr
                                ? 'border-green-500 bg-green-50'
                                : 'border-gray-200 bg-white hover:border-gray-300'
                            }`}
                          >
                            {addr.label && (
                              <div className="text-xs font-semibold text-gray-600 uppercase mb-1">
                                {addr.label}
                              </div>
                            )}
                            <div className="text-sm text-gray-800">{addr.address}</div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-medium text-gray-900">Datos del Cliente</h3>
                    <button
                      onClick={() => setShowNewCustomerForm(false)}
                      className="text-sm text-red-600 hover:text-red-700"
                    >
                      Cancelar
                    </button>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nombre <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={guestName}
                        onChange={(e) => setGuestName(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                        placeholder="Nombre completo"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Teléfono <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="tel"
                        value={guestPhone}
                        onChange={(e) => setGuestPhone(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                        placeholder="+57 300 123 4567"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email (opcional)
                      </label>
                      <input
                        type="email"
                        value={guestEmail}
                        onChange={(e) => setGuestEmail(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                        placeholder="email@ejemplo.com"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Dirección <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        value={guestAddress}
                        onChange={(e) => setGuestAddress(e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                        placeholder="Dirección completa de entrega"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Detalles del Pedido */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Detalles del Pedido</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fecha de Entrega (opcional)
                  </label>
                  <input
                    type="date"
                    value={deliveryDate}
                    onChange={(e) => setDeliveryDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Método de Pago
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="efectivo">Efectivo</option>
                    <option value="transferencia">Transferencia</option>
                    <option value="tarjeta">Tarjeta</option>
                    <option value="nequi">Nequi</option>
                    <option value="daviplata">Daviplata</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notas (opcional)
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Instrucciones especiales, comentarios..."
                  />
                </div>
              </div>
            </div>

            {/* Resumen */}
            <div className="bg-green-50 border-2 border-green-500 rounded-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Resumen</h2>
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Productos:</span>
                  <span className="font-medium">{selectedProducts.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Items totales:</span>
                  <span className="font-medium">
                    {selectedProducts.reduce((sum, sp) => sum + sp.quantity, 0)}
                  </span>
                </div>
              </div>
              <div className="border-t-2 border-green-300 pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold text-gray-900">Total:</span>
                  <span className="text-3xl font-bold text-green-600">
                    {formatCurrency(totalAmount)}
                  </span>
                </div>
              </div>

              <button
                onClick={handleSubmitOrder}
                disabled={isSubmitting || selectedProducts.length === 0}
                className="w-full mt-6 bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-semibold"
              >
                {isSubmitting ? 'Creando Pedido...' : 'Crear Pedido'}
              </button>
            </div>
          </div>

          {/* Columna derecha - Selector de Productos */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Productos</h2>
              <ProductSelector
                selectedProducts={selectedProducts}
                onProductsChange={setSelectedProducts}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Modal de cliente */}
      <CustomerModal
        isOpen={showCustomerModal}
        onClose={() => setShowCustomerModal(false)}
        onSave={handleSaveNewCustomer}
        customer={null}
      />
    </div>
  );
}
