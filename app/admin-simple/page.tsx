'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://lkqwdzqkgqqlvnrynlhb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxrcXdkenFrZ3FxbHZucnlubGhiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQwMDgzMDksImV4cCI6MjA0OTU4NDMwOX0.zb_b9XK1p5BJ-p0ZpJ5kk8G48sKqgPe-Sv-v5ZGYQkY';

const supabase = createClient(supabaseUrl, supabaseKey);

interface Product {
  id: string;
  name: string;
  price: number;
  main_image_url?: string;
  description?: string;
  category?: string;
}

export default function AdminPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    customer_name: '',
    customer_phone: '',
    customer_email: '',
    delivery_address: '',
    delivery_notes: '',
    payment_method: 'efectivo',
    product_id: '',
    quantity: 1,
    price: 0
  });
  const [result, setResult] = useState<{ success: boolean; message: string; data?: any } | null>(null);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('name')
        .limit(50);

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error loading products:', error);
      setResult({
        success: false,
        message: 'Error cargando productos: ' + (error as Error).message
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleProductChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const productId = e.target.value;
    const product = products.find(p => p.id === productId);

    if (product) {
      setFormData(prev => ({
        ...prev,
        product_id: productId,
        price: product.price,
        quantity: prev.quantity
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setResult(null);

    // Validaciones
    if (!formData.customer_name.trim()) {
      setResult({ success: false, message: 'El nombre del cliente es requerido' });
      return;
    }

    if (!formData.customer_phone.trim()) {
      setResult({ success: false, message: 'El teléfono del cliente es requerido' });
      return;
    }

    if (!formData.delivery_address.trim()) {
      setResult({ success: false, message: 'La dirección de entrega es requerida' });
      return;
    }

    if (!formData.product_id) {
      setResult({ success: false, message: 'Debes seleccionar un producto' });
      return;
    }

    try {
      const response = await fetch('/api/admin/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customer_name: formData.customer_name.trim(),
          customer_phone: formData.customer_phone.trim(),
          customer_email: formData.customer_email.trim() || null,
          delivery_address: formData.delivery_address.trim(),
          delivery_notes: formData.delivery_notes.trim() || null,
          payment_method: formData.payment_method,
          items: [{
            product_id: formData.product_id,
            quantity: formData.quantity,
            price: formData.price,
            product_name: products.find(p => p.id === formData.product_id)?.name || 'Producto'
          }],
          total_amount: (formData.price * formData.quantity) + 7400 // + envío
        })
      });

      const data = await response.json();

      if (response.ok) {
        setResult({
          success: true,
          message: '✅ Pedido creado exitosamente!',
          data: data
        });

        // Limpiar formulario
        setFormData({
          customer_name: '',
          customer_phone: '',
          customer_email: '',
          delivery_address: '',
          delivery_notes: '',
          payment_method: 'efectivo',
          product_id: '',
          quantity: 1,
          price: 0
        });
      } else {
        setResult({
          success: false,
          message: data.details || data.error || 'Error al crear el pedido'
        });
      }

    } catch (error) {
      console.error('Error creating order:', error);
      setResult({
        success: false,
        message: 'Error de conexión: ' + (error as Error).message
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
          🛠️ Administración - Crear Pedido
        </h1>

        <div className="bg-white rounded-lg shadow-md p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Información del Cliente */}
            <div className="border-b pb-4">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">👤 Información del Cliente</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre del Cliente *
                  </label>
                  <input
                    type="text"
                    name="customer_name"
                    value={formData.customer_name}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Juan Pérez"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Teléfono *
                  </label>
                  <input
                    type="tel"
                    name="customer_phone"
                    value={formData.customer_phone}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="3001234567"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email (opcional)
                  </label>
                  <input
                    type="email"
                    name="customer_email"
                    value={formData.customer_email}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="cliente@email.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Método de Pago
                  </label>
                  <select
                    name="payment_method"
                    value={formData.payment_method}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="efectivo">Efectivo</option>
                    <option value="transferencia">Transferencia</option>
                    <option value="tarjeta">Tarjeta</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Dirección de Entrega */}
            <div className="border-b pb-4">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">📍 Dirección de Entrega</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Dirección Completa *
                  </label>
                  <textarea
                    name="delivery_address"
                    value={formData.delivery_address}
                    onChange={handleInputChange}
                    required
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Calle 100 #45-67, Bogotá, Cundinamarca"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notas de Entrega (opcional)
                  </label>
                  <textarea
                    name="delivery_notes"
                    value={formData.delivery_notes}
                    onChange={handleInputChange}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Entregar después de las 5:00 pm, llamar al llegar"
                  />
                </div>
              </div>
            </div>

            {/* Selección de Producto */}
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-4">📦 Producto</h2>

              {loading ? (
                <div className="text-center py-4">Cargando productos...</div>
              ) : (
                <>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Selecciona un Producto *
                    </label>
                    <select
                      value={formData.product_id}
                      onChange={handleProductChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="">-- Selecciona un producto --</option>
                      {products.map((product) => (
                        <option key={product.id} value={product.id}>
                          {product.name} - ${new Intl.NumberFormat('es-CO').format(product.price)}
                        </option>
                      ))}
                    </select>
                  </div>

                  {formData.product_id && (
                    <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-md">
                      <div>
                        <p className="font-medium text-green-800">
                          {products.find(p => p.id === formData.product_id)?.name}
                        </p>
                        <p className="text-sm text-green-600">
                          Precio unitario: ${new Intl.NumberFormat('es-CO').format(formData.price)}
                        </p>
                      </div>
                      <div className="text-right">
                        <div>
                          <label className="block text-sm text-gray-600">Cantidad:</label>
                          <input
                            type="number"
                            min="1"
                            value={formData.quantity}
                            onChange={(e) => setFormData(prev => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))}
                            className="w-20 px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <p className="text-sm text-green-700 font-medium mt-1">
                          Total: ${new Intl.NumberFormat('es-CO').format(formData.price * formData.quantity)}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Subtotal:</span>
                      <span className="font-medium">${new Intl.NumberFormat('es-CO').format(formData.price * formData.quantity)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Envío:</span>
                      <span className="font-medium">$7,400</span>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-blue-200">
                      <span className="font-semibold text-gray-800">Total:</span>
                      <span className="font-bold text-lg text-green-600">
                        ${new Intl.NumberFormat('es-CO').format((formData.price * formData.quantity) + 7400)}
                      </span>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Botón de Envío */}
            <div>
              <button
                type="submit"
                className="w-full bg-green-600 text-white py-3 px-4 rounded-md hover:bg-green-700 font-medium focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                disabled={loading || !formData.product_id}
              >
                🚀 Crear Pedido
              </button>
            </div>
          </form>

          {/* Resultado */}
          {result && (
            <div className={`mt-6 p-4 rounded-md ${result.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
              <div className="flex items-center">
                <span className={`text-2xl mr-2 ${result.success ? '✅' : '❌'}`}></span>
                <div>
                  <p className={`font-medium ${result.success ? 'text-green-800' : 'text-red-800'}`}>
                    {result.message}
                  </p>
                  {result.success && result.data && (
                    <p className="text-sm text-green-600 mt-1">
                      Pedido ID: {result.data.data?.id || 'N/A'}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Enlace a Ver Pedidos */}
        <div className="mt-6 text-center">
          <a
            href="/admin-simple/ver-pedidos"
            className="text-blue-600 hover:text-blue-800 underline"
          >
            👥 Ver Pedidos Existentes
          </a>
        </div>
      </div>
    </div>
  );
}