'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { getLastOrder } from '@/lib/recommendations';
import type { Order } from '@/lib/supabase';
import Link from 'next/link';
import { Package, Clock, CheckCircle, RefreshCw } from 'lucide-react';

export function LastOrderSummary() {
  const { user } = useAuth();
  const [lastOrder, setLastOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadLastOrder() {
      if (!user) return;

      setLoading(true);
      try {
        const order = await getLastOrder(user.id);
        setLastOrder(order);
      } catch (error) {
        console.error('Error loading last order:', error);
      } finally {
        setLoading(false);
      }
    }

    loadLastOrder();
  }, [user]);

  if (!user || !lastOrder) {
    return null;
  }

  if (loading) {
    return (
      <section className="py-8 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto animate-pulse">
            <div className="bg-white rounded-xl p-6">
              <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('es-CO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completado':
      case 'entregado':
      case 'pagado':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'en_preparacion':
      case 'pendiente':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      default:
        return <Package className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusText = (status: string) => {
    const statusMap: Record<string, string> = {
      pendiente: 'Pendiente',
      en_preparacion: 'En preparación',
      pagado: 'Pagado',
      completado: 'Completado',
      entregado: 'Entregado',
      cancelado: 'Cancelado',
    };
    return statusMap[status] || status;
  };

  const itemCount = lastOrder.order_data?.items?.length || 0;

  return (
    <section className="py-8 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-display font-bold text-verde-bosque-700 mb-4 text-center">
            Tu último pedido
          </h2>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  {getStatusIcon(lastOrder.status)}
                  <span className="font-semibold text-lg text-verde-bosque-700">
                    Pedido #{lastOrder.id.slice(0, 8)}
                  </span>
                </div>
                <p className="text-sm text-gray-600">
                  {formatDate(lastOrder.created_at)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-verde-aguacate">
                  {formatPrice(lastOrder.total_amount)}
                </p>
                <p className="text-sm text-gray-600">
                  {itemCount} {itemCount === 1 ? 'producto' : 'productos'}
                </p>
              </div>
            </div>

            <div className="border-t pt-4 mb-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Estado:</span>
                <span className="font-semibold text-verde-bosque-700">
                  {getStatusText(lastOrder.status)}
                </span>
              </div>
              {lastOrder.payment_method && (
                <div className="flex items-center justify-between text-sm mt-2">
                  <span className="text-gray-600">Método de pago:</span>
                  <span className="font-semibold text-verde-bosque-700 capitalize">
                    {lastOrder.payment_method}
                  </span>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <Link
                href="/cuenta"
                className="flex-1 bg-verde-aguacate hover:bg-verde-bosque-700 text-white font-bold py-2 px-4 rounded-lg transition-all text-center flex items-center justify-center gap-2"
              >
                <Package className="w-4 h-4" />
                Ver Detalles
              </Link>
              <Link
                href="/productos"
                className="flex-1 bg-white hover:bg-gray-50 text-verde-bosque-700 font-bold py-2 px-4 rounded-lg transition-all border-2 border-verde-aguacate text-center flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Pedir Nuevamente
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
