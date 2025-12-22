'use client';

import { useState } from 'react';
import type { Order } from '@/lib/supabase';
import { formatCurrency } from '@/lib/utils';
import {
  X,
  ShoppingCart,
  AlertTriangle,
  CheckCircle,
  Package
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

interface ReorderConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  order: Order & { items?: OrderItem[] };
  isProcessing: boolean;
}

export function ReorderConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  order,
  isProcessing
}: ReorderConfirmDialogProps) {
  if (!isOpen) return null;

  // Agrupar items por nombre para ver si hay duplicados
  const groupedItems = order.items?.reduce((acc, item) => {
    const name = item.product_snapshot?.name || 'Producto sin nombre';
    if (!acc[name]) {
      acc[name] = {
        ...item,
        totalQuantity: 0,
        occurrences: 0
      };
    }
    acc[name].totalQuantity += item.quantity || 1;
    acc[name].occurrences += 1;
    return acc;
  }, {} as Record<string, OrderItem & { totalQuantity: number; occurrences: number }>) || {};

  const totalItems = Object.values(groupedItems).reduce((sum, item) => sum + item.totalQuantity, 0);
  const uniqueProducts = Object.keys(groupedItems).length;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-verde-aguacate" />
              Repetir Pedido
            </h2>
            <button
              onClick={onClose}
              disabled={isProcessing}
              className="p-1 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-amber-800">
              <p className="font-medium mb-1">¿Estás seguro de repetir este pedido?</p>
              <p>Se agregarán todos los productos de tu pedido anterior al carrito como un nuevo pedido.</p>
            </div>
          </div>
        </div>

        {/* Contenido del pedido a repetir */}
        <div className="p-6">
          {/* Información del pedido original */}
          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">
              Pedido original: <span className="font-semibold text-gray-900">
                #{order.order_number || order.id.slice(0, 8)}
              </span>
            </p>
            <p className="text-sm text-gray-600">
              Realizado el: {new Date(order.created_at).toLocaleDateString('es-CO', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
            <p className="text-sm font-semibold text-verde-bosque mt-2">
              Total del nuevo pedido: {formatCurrency(order.total)}
            </p>
          </div>

          {/* Resumen de productos */}
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <Package className="w-4 h-4" />
              Resumen del pedido
            </h3>
            <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
              <span>{uniqueProducts} tipo{uniqueProducts !== 1 ? 's' : ''} de producto</span>
              <span>{totalItems} producto{totalItems !== 1 ? 's' : ''} en total</span>
            </div>

            {/* Lista de productos agrupados */}
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {Object.entries(groupedItems).map(([name, item]) => (
                <div key={name} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                  {item.product_snapshot?.main_image_url || item.product_snapshot?.image ? (
                    <img
                      src={item.product_snapshot.main_image_url || item.product_snapshot.image}
                      alt={name}
                      className="w-10 h-10 object-cover rounded"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-gray-200 rounded flex items-center justify-center">
                      <Package className="w-5 h-5 text-gray-400" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{name}</p>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span>Cantidad: {item.totalQuantity}</span>
                      {item.occurrences > 1 && (
                        <span className="text-amber-600">
                          ({item.occurrences} veces en el pedido original)
                        </span>
                      )}
                      {item.product_snapshot?.unit && (
                        <span>por {item.product_snapshot.unit}</span>
                      )}
                    </div>
                  </div>
                  <p className="text-sm font-semibold text-gray-900">
                    {formatCurrency(item.unit_price * item.totalQuantity)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Advertencia sobre inventario */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-blue-800">
                La disponibilidad de los productos puede haber cambiado desde tu último pedido.
              </p>
            </div>
          </div>
        </div>

        {/* Botones de acción */}
        <div className="p-6 border-t border-gray-200 flex gap-3">
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 text-gray-700 font-medium rounded-lg transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={isProcessing}
            className="flex-1 px-4 py-2.5 bg-gradient-to-r from-yellow-400 to-yellow-600 hover:from-yellow-500 hover:to-yellow-700 disabled:bg-gray-300 text-verde-bosque-700 font-medium rounded-lg transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg transform hover:scale-105 border-2 border-verde-aguacate disabled:border-gray-400"
          >
            {isProcessing ? (
              <>
                <div className="w-4 h-4 border-2 border-verde-bosque-700 border-t-transparent rounded-full animate-spin"></div>
                Agregando al carrito...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4" />
                Confirmar repetición
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}