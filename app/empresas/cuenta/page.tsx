'use client';

/**
 * Dashboard de Cuenta B2B
 * "Tus Aguacates" - E-commerce Platform
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useB2BCartStore } from '@/lib/b2b/b2b-cart-store';
import { formatPrice } from '@/lib/b2b/b2b-pricing';

interface B2BOrder {
  id: string;
  order_number: string;
  status: string;
  total: number;
  created_at: string;
  items: Array<{
    quantity: number;
    product_name: string;
  }>;
}

export default function B2BAccountPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [company, setCompany] = useState<any>(null);
  const [recentOrders, setRecentOrders] = useState<B2BOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch user session
      const { data: { user } } = await fetch('/api/auth/session').then(r => r.json());
      if (!user) {
        // Redirect to catalog since registration is optional
        router.push('/empresas/catalogo');
        return;
      }
      setUser(user);

      // Fetch company info
      const companyRes = await fetch('/api/b2b/companies?user_id=' + user.id);
      if (companyRes.ok) {
        const companyData = await companyRes.json();
        if (companyData.data && companyData.data.length > 0) {
          setCompany(companyData.data[0]);
        }
      }

      // Fetch recent orders
      const ordersRes = await fetch('/api/b2b/orders?page=1&page_size=5');
      if (ordersRes.ok) {
        const ordersData = await ordersRes.json();
        setRecentOrders(ordersData.data || []);
      }
    } catch (error) {
      console.error('Error fetching account data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Mi Cuenta</h1>

      {/* Información de la empresa */}
      {company ? (
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Información de la Empresa
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Nombre</p>
              <p className="font-medium text-gray-800">{company.company_name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">NIT</p>
              <p className="font-medium text-gray-800">{company.nit}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Contacto</p>
              <p className="font-medium text-gray-800">{company.contact_name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Email</p>
              <p className="font-medium text-gray-800">{company.contact_email}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Teléfono</p>
              <p className="font-medium text-gray-800">{company.contact_phone}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Estado</p>
              <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                company.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
              }`}>
                {company.status === 'active' ? 'Activa' : company.status}
              </span>
            </div>
          </div>
          <div className="mt-4">
            <Link
              href="/empresas/cuenta/perfil"
              className="text-green-600 hover:text-green-700 font-semibold text-sm"
            >
              Editar perfil →
            </Link>
          </div>
        </div>
      ) : (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-green-800 mb-2">
            Compra como invitado
          </h2>
          <p className="text-green-700 mb-4">
            Puedes comprar directamente desde el catálogo sin necesidad de registrarte. Opcionalmente puedes registrar tu empresa para acceder a funcionalidades adicionales.
          </p>
          <Link
            href="/empresas/catalogo"
            className="inline-block bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-lg"
          >
            Ir al Catálogo
          </Link>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-8">
        {/* Pedidos Recientes */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-800">
              Pedidos Recientes
            </h2>
            <Link href="/empresas/pedidos" className="text-green-600 hover:text-green-700 text-sm">
              Ver todos →
            </Link>
          </div>

          {recentOrders.length === 0 ? (
            <p className="text-gray-600 text-center py-8">
              No hay pedidos aún
            </p>
          ) : (
            <div className="space-y-4">
              {recentOrders.map((order) => (
                <div key={order.id} className="border-b border-gray-100 pb-4 last:border-0">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold text-gray-800">{order.order_number}</p>
                      <p className="text-sm text-gray-600">
                        {new Date(order.created_at).toLocaleDateString('es-CO')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-600">
                        {formatPrice(order.total)}
                      </p>
                      <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                        order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                        order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {order.status === 'pending' ? 'Pendiente' :
                         order.status === 'confirmed' ? 'Confirmado' :
                         order.status === 'processing' ? 'Procesando' :
                         order.status === 'shipped' ? 'Enviado' :
                         order.status === 'delivered' ? 'Entregado' :
                         order.status === 'cancelled' ? 'Cancelado' : order.status}
                      </span>
                    </div>
                  </div>
                  <Link
                    href={`/empresas/pedidos/${order.id}`}
                    className="text-green-600 hover:text-green-700 text-sm mt-2 inline-block"
                  >
                    Ver detalles →
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Acciones Rápidas */}
        <div className="space-y-4">
          <Link
            href="/empresas/catalogo"
            className="block bg-white rounded-lg shadow p-6 hover:shadow-lg transition"
          >
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              🛒 Ir al Catálogo
            </h3>
            <p className="text-gray-600 text-sm">
              Realiza un nuevo pedido
            </p>
          </Link>

          <Link
            href="/empresas/pedidos"
            className="block bg-white rounded-lg shadow p-6 hover:shadow-lg transition"
          >
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              📦 Mis Pedidos
            </h3>
            <p className="text-gray-600 text-sm">
              Historial completo de pedidos
            </p>
          </Link>

          <Link
            href="/empresas/cuenta/direcciones"
            className="block bg-white rounded-lg shadow p-6 hover:shadow-lg transition"
          >
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              📍 Direcciones
            </h3>
            <p className="text-gray-600 text-sm">
              Gestiona tus direcciones de envío
            </p>
          </Link>

          {company && (
            <Link
              href="/empresas/recurrentes"
              className="block bg-white rounded-lg shadow p-6 hover:shadow-lg transition"
            >
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                🔄 Pedidos Recurrentes
              </h3>
              <p className="text-gray-600 text-sm">
                Configura pedidos automáticos
              </p>
            </Link>
          )}

          <Link
            href="/empresas/reportes"
            className="block bg-white rounded-lg shadow p-6 hover:shadow-lg transition"
          >
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              📊 Reportes
            </h3>
            <p className="text-gray-600 text-sm">
              Estadísticas de compras
            </p>
          </Link>
        </div>
      </div>
    </div>
  );
}
