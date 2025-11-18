'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Product } from '@/lib/supabase';
import ManualOrderForm from './components/ManualOrderForm';
import { ArrowLeft, Plus } from 'lucide-react';

interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

export default function PedidosManualPage() {
  const router = useRouter();
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (adminUser) {
      loadProducts();
    }
  }, [adminUser]);

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/admin/me');
      const data = await response.json();

      if (data.success && data.user) {
        setAdminUser(data.user);
      } else {
        router.push('/admin/login');
      }
    } catch (error) {
      console.error('Auth check error:', error);
      router.push('/admin/login');
    } finally {
      setAuthLoading(false);
    }
  };

  const loadProducts = async () => {
    try {
      setProductsLoading(true);
      const response = await fetch('/api/admin/products?limit=1000');
      const data = await response.json();

      if (data.data) {
        setProducts(data.data.filter((p: Product) => p.is_active));
      }
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setProductsLoading(false);
    }
  };

  const handleOrderCreated = () => {
    setShowForm(false);
    setSuccessMessage('✅ Pedido creado exitosamente');
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (!adminUser) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-6">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-200 rounded-lg transition"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-3xl font-bold text-gray-900">Pedidos Manuales</h1>
          </div>

          {successMessage && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-800">
              {successMessage}
            </div>
          )}

          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
            >
              <Plus className="w-5 h-5" />
              Nuevo Pedido Manual
            </button>
          )}
        </div>

        {/* Formulario */}
        {showForm && (
          <div className="mb-8">
            <ManualOrderForm
              products={products}
              onSuccess={handleOrderCreated}
              onCancel={() => setShowForm(false)}
            />
          </div>
        )}

        {/* Info */}
        {!showForm && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-lg shadow border-l-4 border-green-600">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">📝 Crear Pedido Manual</h2>
              <p className="text-gray-600">
                Crea pedidos manualmente para clientes sin cuenta en el sistema.
                Los datos se guardan en la base de datos y puedes enviar el resumen por WhatsApp.
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow border-l-4 border-blue-600">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">📱 Enviar por WhatsApp</h2>
              <p className="text-gray-600">
                Una vez creado el pedido, recibirás un link para enviar el resumen
                al teléfono del cliente directamente por WhatsApp.
              </p>
            </div>
          </div>
        )}

        {productsLoading && showForm && (
          <div className="flex items-center justify-center p-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
          </div>
        )}
      </div>
    </div>
  );
}
