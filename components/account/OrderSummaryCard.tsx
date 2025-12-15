'use client';

import { useState } from 'react';
import type { Order } from '@/lib/supabase';
import { formatCurrency } from '@/lib/utils';
import {
  ChevronRight,
  ChevronDown,
  Package,
  Clock,
  CheckCircle,
  RefreshCw,
  Truck,
  ShoppingBag
} from 'lucide-react';

// Usamos el mismo OrderItem que está definido en la página de cuenta
interface OrderItem {
  id: string;
  product_id: string;
  product_snapshot: {
    name: string;
    price: number;
    main_image_url?: string;
    image?: string;
    unit?: string;
  };
  quantity: number;
  unit_price: number;
  subtotal: number;
  product?: {
    id: string;
    name: string;
    price: number;
    main_image_url?: string;
    image?: string;
    unit?: string;
  };
}

interface OrderSummaryCardProps {
  order: Order & { items?: OrderItem[] };
  onRepeatOrder?: (order: Order & { items?: OrderItem[] }) => void;
  isRepeating?: boolean;
}

export function OrderSummaryCard({
  order,
  onRepeatOrder,
  isRepeating = false
}: OrderSummaryCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);


  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered':
        return <CheckCircle className="w-4 h-4 md:w-5 md:h-5 text-green-500" />;
      case 'shipped':
        return <Truck className="w-4 h-4 md:w-5 md:h-5 text-blue-500" />;
      case 'processing':
      case 'confirmed':
        return <Package className="w-4 h-4 md:w-5 md:h-5 text-yellow-500" />;
      case 'pending':
        return <Clock className="w-4 h-4 md:w-5 md:h-5 text-orange-500" />;
      case 'cancelled':
        return <Package className="w-4 h-4 md:w-5 md:h-5 text-red-500" />;
      default:
        return <Package className="w-4 h-4 md:w-5 md:h-5 text-gray-500" />;
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: 'Pendiente',
      confirmed: 'Confirmado',
      processing: 'En preparación',
      shipped: 'En camino',
      delivered: 'Entregado',
      cancelled: 'Cancelado',
    };
    return labels[status] || status;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('es-CO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(date);
  };

  // Calcular totales
  const totalItems = order.items?.reduce((sum, item) => sum + (item.quantity || 1), 0) || 0;
  const uniqueProducts = order.items?.length || 0;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden transition-all duration-200 hover:shadow-md">
      {/* Resumen del pedido (siempre visible) */}
      <div
        className="p-3 md:p-4 cursor-pointer select-none"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {/* Header del pedido - Layout móvil optimizado */}
        <div className="flex items-start justify-between gap-2 mb-2">
          {/* Lado izquierdo: icono + info */}
          <div className="flex items-start gap-2 md:gap-3 min-w-0 flex-1">
            <div className="p-1.5 md:p-2 bg-gray-50 rounded-lg flex-shrink-0">
              {getStatusIcon(order.status)}
            </div>
            <div className="min-w-0 flex-1">
              {/* Fecha - principal en móvil */}
              <h3 className="font-semibold text-gray-900 text-sm md:text-base">
                {formatDate(order.created_at)}
              </h3>
              {/* Número de pedido - solo últimos 4 chars en móvil, completo en desktop */}
              <p className="text-xs text-gray-500">
                <span className="md:hidden">
                  #{(order.order_number || order.id).slice(-4)}
                </span>
                <span className="hidden md:inline">
                  Pedido #{order.order_number || order.id.slice(0, 8)}
                </span>
              </p>
            </div>
          </div>

          {/* Lado derecho: precio + chevron */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="text-right">
              <p className="text-sm md:text-lg font-bold text-verde-bosque">
                {formatCurrency(order.total || order.total_amount || order.order_data?.total || 0)}
              </p>
              <p className="text-[10px] md:text-xs text-gray-500">
                {totalItems} {totalItems === 1 ? 'item' : 'items'}
              </p>
            </div>
            <div className={`transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}>
              <ChevronRight className="w-4 h-4 md:w-5 md:h-5 text-gray-400" />
            </div>
          </div>
        </div>

        {/* Badge de estado + info rápida - Segunda fila */}
        <div className="flex flex-wrap items-center gap-1.5 md:gap-2 text-[10px] md:text-xs">
          {/* Status badge */}
          <span className={`px-2 py-0.5 rounded-full font-medium ${order.status === 'delivered' ? 'bg-green-100 text-green-700' :
            order.status === 'shipped' ? 'bg-blue-100 text-blue-700' :
              order.status === 'processing' || order.status === 'confirmed' ? 'bg-yellow-100 text-yellow-700' :
                order.status === 'pending' ? 'bg-orange-100 text-orange-700' :
                  order.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                    'bg-gray-100 text-gray-700'
            }`}>
            {getStatusLabel(order.status)}
          </span>

          {/* Separador */}
          <span className="text-gray-300 hidden sm:inline">•</span>

          {/* Tipos de producto */}
          <span className="text-gray-600 hidden sm:flex items-center gap-1">
            <ShoppingBag className="w-3 h-3" />
            {uniqueProducts} tipo{uniqueProducts !== 1 ? 's' : ''}
          </span>

          {/* Método de pago (solo desktop) */}
          {order.payment_method && (
            <>
              <span className="text-gray-300 hidden md:inline">•</span>
              <span className="text-gray-600 hidden md:flex items-center gap-1">
                💳 {order.payment_method === 'daviplata' ? 'Daviplata' : 'Efectivo'}
              </span>
            </>
          )}

          {/* Estado de pago */}
          {order.payment_status && (
            <span className={`font-medium ml-auto ${order.payment_status === 'completed' ? 'text-green-600' :
              order.payment_status === 'failed' ? 'text-red-600' :
                'text-orange-600'
              }`}>
              {order.payment_status === 'completed' ? '✓ Pagado' :
                order.payment_status === 'failed' ? '✗ Fallido' :
                  '⏳ Pago pendiente'}
            </span>
          )}
        </div>
      </div>

      {/* Detalles expandibles */}
      {isExpanded && order.items && order.items.length > 0 && (
        <div className="border-t border-gray-200 bg-gray-50">
          <div className="p-3 md:p-4 space-y-3">
            {/* Lista de productos */}
            <div className="space-y-2">
              <h4 className="text-xs md:text-sm font-semibold text-gray-700">Productos:</h4>
              {order.items.map((item) => (
                <div key={item.id} className="flex items-center gap-2 md:gap-3 bg-white p-2 rounded-lg">
                  {/* Imagen del producto */}
                  <div className="w-8 h-8 md:w-10 md:h-10 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                    {item.product_snapshot?.main_image_url || item.product_snapshot?.image ? (
                      <img
                        src={item.product_snapshot.main_image_url || item.product_snapshot.image}
                        alt={item.product_snapshot?.name || 'Producto'}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-4 h-4 md:w-5 md:h-5 text-gray-400" />
                      </div>
                    )}
                  </div>
                  {/* Nombre y cantidad */}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs md:text-sm font-medium text-gray-900 truncate">
                      {item.product_snapshot?.name || 'Producto'}
                    </p>
                    <p className="text-[10px] md:text-xs text-gray-500">
                      {item.quantity} × {formatCurrency(item.unit_price)}
                    </p>
                  </div>
                  {/* Subtotal */}
                  <p className="text-xs md:text-sm font-semibold text-gray-900 flex-shrink-0">
                    {formatCurrency(item.subtotal)}
                  </p>
                </div>
              ))}
            </div>

            {/* Resumen de costos - Compacto en móvil */}
            <div className="bg-white p-2 md:p-3 rounded-lg border border-gray-200 text-xs md:text-sm space-y-1">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal:</span>
                <span>{formatCurrency(order.subtotal)}</span>
              </div>
              {(order.tax || 0) > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Impuestos:</span>
                  <span>{formatCurrency(order.tax)}</span>
                </div>
              )}
              {(order.shipping_fee || 0) > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Envío:</span>
                  <span>{formatCurrency(order.shipping_fee)}</span>
                </div>
              )}
              {(order.discount || 0) > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Descuento:</span>
                  <span>-{formatCurrency(order.discount)}</span>
                </div>
              )}
              <div className="border-t pt-1 mt-1">
                <div className="flex justify-between font-semibold text-sm md:text-base">
                  <span>Total:</span>
                  <span className="text-verde-bosque">{formatCurrency(order.total)}</span>
                </div>
              </div>
            </div>

            {/* Botón de repetir pedido */}
            {onRepeatOrder && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRepeatOrder(order);
                }}
                disabled={isRepeating}
                className="w-full flex items-center justify-center gap-2 bg-verde-bosque hover:bg-verde-bosque/90 disabled:bg-gray-300 text-white font-medium py-2.5 md:py-3 px-4 rounded-lg transition-colors text-sm md:text-base"
              >
                <RefreshCw className={`w-4 h-4 ${isRepeating ? 'animate-spin' : ''}`} />
                {isRepeating ? 'Preparando...' : 'Repetir pedido'}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}