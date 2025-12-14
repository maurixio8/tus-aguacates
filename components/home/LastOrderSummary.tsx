'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { getLastOrder } from '@/lib/recommendations';
import { supabase } from '@/lib/supabase';
import type { Order } from '@/lib/supabase';
import Link from 'next/link';
import { Package, Clock, CheckCircle, RefreshCw } from 'lucide-react';

export function LastOrderSummary() {
  const { user } = useAuth();
  const [lastOrder, setLastOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [orderItems, setOrderItems] = useState<any[]>([]);

  useEffect(() => {
    async function loadLastOrder() {
      if (!user) return;

      setLoading(true);
      try {
        const order = await getLastOrder(user.id);
        setLastOrder(order);

        // Cargar los items del pedido
        if (order) {
          const { data: items, error } = await supabase
            .from('order_items')
            .select('*')
            .eq('order_id', order.id);

          if (!error && items) {
            setOrderItems(items);
          }
        }
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

  const getStatusIcon = (status: string, paymentStatus?: string) => {
    // Si el estado del pedido es entregado/completado, mostramos check
    if (status === 'delivered' || status === 'entregado' || status === 'delivered') {
      return <CheckCircle className="w-5 h-5 text-green-500" />;
    }
    // Si está pendiente o en preparación, mostramos reloj
    if (status === 'pending' || status === 'pendiente' ||
        status === 'processing' || status === 'en_preparacion') {
      return <Clock className="w-5 h-5 text-yellow-500" />;
    }
    // Si está cancelado, mostramos paquete gris
    if (status === 'cancelled' || status === 'cancelado') {
      return <Package className="w-5 h-5 text-gray-500" />;
    }
    // Por defecto, mostramos paquete
    return <Package className="w-5 h-5 text-blue-500" />;
  };

  const getStatusText = (status: string) => {
    const statusMap: Record<string, string> = {
      pending: 'Pendiente',
      pendiente: 'Pendiente',
      processing: 'En preparación',
      en_preparacion: 'En preparación',
      confirmed: 'Confirmado',
      confirmado: 'Confirmado',
      shipped: 'En camino',
      en_camino: 'En camino',
      delivered: 'Entregado',
      entregado: 'Entregado',
      cancelled: 'Cancelado',
      cancelado: 'Cancelado',
    };
    return statusMap[status] || status;
  };

  // Calcular el total de items
  const totalItems = orderItems.reduce((sum, item) => sum + (item.quantity || 1), 0);

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
                  {getStatusIcon(lastOrder.status, lastOrder.payment_status)}
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
                  {formatPrice(lastOrder.total)}
                </p>
                <p className="text-sm text-gray-600">
                  {totalItems} {totalItems === 1 ? 'producto' : 'productos'} ({orderItems.length} tipos)
                </p>
              </div>
            </div>

            <div className="border-t pt-4 mb-4">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-gray-600">Estado del pedido:</span>
                <span className="font-semibold text-verde-bosque-700">
                  {getStatusText(lastOrder.status)}
                </span>
              </div>
              {lastOrder.payment_status && (
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-gray-600">Estado del pago:</span>
                  <span className={`font-semibold ${
                    lastOrder.payment_status === 'completed' ? 'text-green-600' :
                    lastOrder.payment_status === 'failed' ? 'text-red-600' :
                    'text-yellow-600'
                  }`}>
                    {lastOrder.payment_status === 'completed' ? 'Completado' :
                     lastOrder.payment_status === 'failed' ? 'Fallido' :
                     lastOrder.payment_status === 'pending' ? 'Pendiente' :
                     lastOrder.payment_status === 'refunded' ? 'Reembolsado' :
                     lastOrder.payment_status}
                  </span>
                </div>
              )}
              {lastOrder.payment_method && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Método de pago:</span>
                  <span className="font-semibold text-verde-bosque-700 capitalize">
                    {lastOrder.payment_method === 'daviplata' ? 'Daviplata' :
                     lastOrder.payment_method === 'efectivo' ? 'Efectivo contra entrega' :
                     lastOrder.payment_method}
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
                href="/tienda"
                className="flex-1 bg-white hover:bg-gray-50 text-verde-bosque-700 font-bold py-2 px-4 rounded-lg transition-all border-2 border-verde-aguacate text-center flex items-center justify-center gap-2"
                prefetch={false}
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
