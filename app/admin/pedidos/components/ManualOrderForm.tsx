'use client';

import { useState } from 'react';
import { Product } from '@/lib/supabase';
import { X, Plus, Trash2, Send } from 'lucide-react';

interface OrderItem {
  product_id: string;
  product_name: string;
  product_price: number;
  quantity: number;
}

interface ManualOrderFormProps {
  products: Product[];
  onSuccess: () => void;
  onCancel: () => void;
}

const SHIPPING_COST = 7400;
const TAX_RATE = 0.08; // 8%
const SITE_URL = 'https://tusaguacatescom.ola.click';

export default function ManualOrderForm({
  products,
  onSuccess,
  onCancel,
}: ManualOrderFormProps) {
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [serviceType, setServiceType] = useState('domicilio');
  const [paymentMethod, setPaymentMethod] = useState('efectivo');
  const [amountReceived, setAmountReceived] = useState(0);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [selectedQuantity, setSelectedQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPhoneOptions, setShowPhoneOptions] = useState(false);

  const calculateTotals = () => {
    const subtotal = orderItems.reduce((sum, item) => sum + item.product_price * item.quantity, 0);
    const tax = subtotal * TAX_RATE;
    const total = subtotal + tax + SHIPPING_COST;

    return { subtotal, tax, total };
  };

  const { subtotal, tax, total } = calculateTotals();

  const handleAddProduct = () => {
    if (!selectedProductId || selectedQuantity < 1) {
      setError('Selecciona un producto y cantidad válida');
      return;
    }

    const product = products.find((p) => p.id === selectedProductId);
    if (!product) {
      setError('Producto no encontrado');
      return;
    }

    if (product.stock < selectedQuantity) {
      setError(`Stock insuficiente. Disponible: ${product.stock}`);
      return;
    }

    const existingItem = orderItems.find((item) => item.product_id === selectedProductId);
    if (existingItem) {
      setError('Este producto ya está en el pedido. Actualiza la cantidad.');
      return;
    }

    setOrderItems([
      ...orderItems,
      {
        product_id: product.id,
        product_name: product.name,
        product_price: product.discount_price || product.price,
        quantity: selectedQuantity,
      },
    ]);

    setSelectedProductId('');
    setSelectedQuantity(1);
    setError('');
  };

  const handleRemoveProduct = (productId: string) => {
    setOrderItems(orderItems.filter((item) => item.product_id !== productId));
  };

  const updateQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity < 1) {
      handleRemoveProduct(productId);
      return;
    }

    const product = products.find((p) => p.id === productId);
    if (product && newQuantity > product.stock) {
      setError(`Stock insuficiente. Disponible: ${product.stock}`);
      return;
    }

    setOrderItems(
      orderItems.map((item) =>
        item.product_id === productId ? { ...item, quantity: newQuantity } : item
      )
    );
    setError('');
  };

  const validateForm = () => {
    if (!customerName.trim()) {
      setError('El nombre del cliente es requerido');
      return false;
    }
    if (!customerPhone.trim()) {
      setError('El teléfono del cliente es requerido');
      return false;
    }
    if (!customerEmail.trim()) {
      setError('El email del cliente es requerido');
      return false;
    }
    if (orderItems.length === 0) {
      setError('Agrega al menos un producto al pedido');
      return false;
    }
    return true;
  };

  const handleSaveOrder = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);
      setError('');

      const response = await fetch('/api/admin/manual-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          guest_name: customerName,
          guest_email: customerEmail,
          guest_phone: customerPhone,
          guest_address: customerAddress,
          items: orderItems,
          subtotal,
          tax,
          shipping_fee: SHIPPING_COST,
          total,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al crear el pedido');
      }

      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  const handleSendWhatsApp = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);

      // Calcular vuelto si es necesario
      const change = paymentMethod === 'efectivo' && amountReceived > total
        ? amountReceived - total
        : 0;

      // Primero guardar el pedido
      const saveResponse = await fetch('/api/admin/manual-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          guest_name: customerName,
          guest_email: customerEmail,
          guest_phone: customerPhone,
          guest_address: customerAddress,
          items: orderItems,
          subtotal,
          tax,
          shipping_fee: SHIPPING_COST,
          total,
          service_type: serviceType,
          payment_method: paymentMethod,
          amount_received: amountReceived,
          change,
        }),
      });

      const saveData = await saveResponse.json();

      if (!saveResponse.ok) {
        throw new Error(saveData.error || 'Error al crear el pedido');
      }

      // Luego enviar por WhatsApp
      const whatsappResponse = await fetch('/api/admin/whatsapp/send-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_name: customerName,
          customer_phone: customerPhone,
          customer_address: customerAddress,
          order_id: saveData.orderId,
          items: orderItems,
          subtotal,
          tax,
          shipping_fee: SHIPPING_COST,
          total,
          service_type: serviceType,
          payment_method: paymentMethod,
          amount_received: amountReceived,
          change,
          site_url: SITE_URL,
        }),
      });

      const whatsappData = await whatsappResponse.json();

      if (!whatsappResponse.ok) {
        throw new Error(whatsappData.error || 'Error al enviar WhatsApp');
      }

      // Abrir link de WhatsApp
      if (whatsappData.whatsappLink) {
        window.open(whatsappData.whatsappLink, '_blank');
      }

      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const formatPhone = (phone: string) => {
    // Remover caracteres que no sean números
    const cleaned = phone.replace(/\D/g, '');
    // Si empieza con 0, remover
    const withoutZero = cleaned.startsWith('0') ? cleaned.slice(1) : cleaned;
    // Si no tiene código de país, agregar +57
    if (withoutZero.length === 10) {
      return `+57${withoutZero}`;
    }
    return `+${withoutZero}`;
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-8 max-w-4xl">
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
          {error}
        </div>
      )}

      {/* Sección de Cliente */}
      <div className="mb-8">
        <h2 className="text-lg font-bold text-gray-900 mb-4">👤 Datos del Cliente</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nombre Completo *
            </label>
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Juan Pérez"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email *
            </label>
            <input
              type="email"
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
              placeholder="juan@example.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Teléfono WhatsApp * {customerPhone && <span className="text-xs text-green-600">{formatPhone(customerPhone)}</span>}
            </label>
            <div className="relative">
              <input
                type="tel"
                value={customerPhone}
                onChange={(e) => {
                  setCustomerPhone(e.target.value);
                  setShowPhoneOptions(true);
                }}
                onFocus={() => setShowPhoneOptions(true)}
                placeholder="3145678901"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              {showPhoneOptions && customerPhone && (
                <button
                  type="button"
                  onClick={() => setShowPhoneOptions(false)}
                  className="absolute right-2 top-2 text-gray-400 hover:text-gray-600"
                >
                  ✓
                </button>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-1">Formato: 10 dígitos sin código de país</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Dirección
            </label>
            <input
              type="text"
              value={customerAddress}
              onChange={(e) => setCustomerAddress(e.target.value)}
              placeholder="Calle 50 #10-20, Apto 302"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
        </div>
      </div>

      {/* Sección de Servicio y Pago */}
      <div className="mb-8">
        <h2 className="text-lg font-bold text-gray-900 mb-4">🔧 Servicio y Pago</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de Servicio *
            </label>
            <select
              value={serviceType}
              onChange={(e) => setServiceType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="domicilio">🚚 Domicilio</option>
              <option value="recogida">🏪 Recogida en tienda</option>
              <option value="envio">📦 Envío especial</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Método de Pago *
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="efectivo">💵 Efectivo</option>
              <option value="transferencia">💳 Transferencia</option>
              <option value="tarjeta">🏦 Tarjeta de crédito</option>
              <option value="pendiente">⏳ Pendiente</option>
            </select>
          </div>

          {paymentMethod === 'efectivo' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Monto Recibido
              </label>
              <input
                type="number"
                value={amountReceived || ''}
                onChange={(e) => setAmountReceived(parseFloat(e.target.value) || 0)}
                placeholder="100000"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          )}

          {paymentMethod === 'efectivo' && amountReceived > 0 && (
            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-sm text-blue-700">
                <strong>Total a pagar:</strong> {formatPrice(total)}<br/>
                <strong>Monto recibido:</strong> {formatPrice(amountReceived)}<br/>
                <strong>Vuelto:</strong> <span className="text-green-600 font-bold">{formatPrice(amountReceived - total)}</span>
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Sección de Productos */}
      <div className="mb-8">
        <h2 className="text-lg font-bold text-gray-900 mb-4">🛍️ Productos</h2>

        {/* Selector de producto */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Seleccionar Producto *
              </label>
              <select
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="">-- Elige un producto --</option>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name} ({formatPrice(product.discount_price || product.price)})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cantidad *
              </label>
              <input
                type="number"
                min="1"
                value={selectedQuantity}
                onChange={(e) => setSelectedQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div className="flex items-end">
              <button
                onClick={handleAddProduct}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50"
              >
                <Plus className="w-5 h-5" />
                Agregar
              </button>
            </div>
          </div>
        </div>

        {/* Tabla de productos agregados */}
        {orderItems.length > 0 && (
          <div className="overflow-x-auto mb-6">
            <table className="w-full text-sm">
              <thead className="bg-gray-100 border-b">
                <tr>
                  <th className="text-left p-3 font-semibold">Producto</th>
                  <th className="text-center p-3 font-semibold">Precio</th>
                  <th className="text-center p-3 font-semibold">Cantidad</th>
                  <th className="text-right p-3 font-semibold">Subtotal</th>
                  <th className="text-center p-3"></th>
                </tr>
              </thead>
              <tbody>
                {orderItems.map((item) => (
                  <tr key={item.product_id} className="border-b hover:bg-gray-50">
                    <td className="p-3">{item.product_name}</td>
                    <td className="text-center p-3">{formatPrice(item.product_price)}</td>
                    <td className="text-center p-3">
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => updateQuantity(item.product_id, parseInt(e.target.value))}
                        className="w-16 px-2 py-1 border border-gray-300 rounded text-center focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </td>
                    <td className="text-right p-3 font-semibold">
                      {formatPrice(item.product_price * item.quantity)}
                    </td>
                    <td className="text-center p-3">
                      <button
                        onClick={() => handleRemoveProduct(item.product_id)}
                        className="text-red-600 hover:text-red-800 transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {orderItems.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No hay productos en el pedido aún. Agrega al menos uno.
          </div>
        )}
      </div>

      {/* Resumen de totales */}
      {orderItems.length > 0 && (
        <div className="mb-8 border-t pt-6">
          <div className="max-w-sm ml-auto">
            <div className="flex justify-between mb-2 text-gray-700">
              <span>Subtotal:</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
            <div className="flex justify-between mb-2 text-gray-700">
              <span>Impuesto (8%):</span>
              <span>{formatPrice(tax)}</span>
            </div>
            <div className="flex justify-between mb-4 text-gray-700">
              <span>Envío:</span>
              <span>{formatPrice(SHIPPING_COST)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold text-gray-900 border-t pt-4">
              <span>Total:</span>
              <span className="text-green-600">{formatPrice(total)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Botones de acción */}
      <div className="flex gap-4 justify-end">
        <button
          onClick={onCancel}
          disabled={loading}
          className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
        >
          Cancelar
        </button>

        <button
          onClick={handleSaveOrder}
          disabled={loading || orderItems.length === 0}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
        >
          {loading ? '⏳ Guardando...' : '💾 Guardar Pedido'}
        </button>

        <button
          onClick={handleSendWhatsApp}
          disabled={loading || orderItems.length === 0}
          className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50"
        >
          <Send className="w-4 h-4" />
          {loading ? '⏳ Enviando...' : '📱 Guardar y WhatsApp'}
        </button>
      </div>
    </div>
  );
}
