'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Package,
  CheckSquare,
  Square,
  ShoppingCart
} from 'lucide-react';

interface OrderItem {
  id: string;
  product_id: string;
  product_snapshot?: {
    name?: string;
    price?: number;
    main_image_url?: string;
    image?: string;
    variant_name?: string;
    variant_value?: string;
  };
  quantity: number;
  unit_price: number;
  subtotal: number;
  products?: {
    name?: string;
    main_image_url?: string;
  };
  product_name?: string;
  productName?: string;
  variantName?: string;
  variant_value?: string;
  price?: number;
}

interface Order {
  id: string;
  order_number: string;
  customer_name?: string;
  customer_phone?: string;
  customer_email?: string;
  status: string;
  created_at: string;
  order_items?: OrderItem[];
  items?: OrderItem[];
  order_type?: 'registered' | 'guest';
  order_data?: any;
}

interface ProductGrouped {
  // Clave única para agrupación
  grouping_key: string;
  // Nombre base del producto
  product_name: string;
  // Variante si existe (null si no hay)
  variant_name?: string;
  variant_value?: string;
  // Texto completo a mostrar
  display_name: string;
  // Precio unitario de venta
  unit_price: number;
  // Cantidad total
  total_quantity: number;
  // En cuántos pedidos aparece
  orders_count: number;
}

export default function ListaComprasPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set());
  const [selectAll, setSelectAll] = useState(false);

  // Inicializar con últimos 10 días
  useEffect(() => {
    const today = new Date();
    const tenDaysAgo = new Date(today);
    tenDaysAgo.setDate(today.getDate() - 9);

    const formatDate = (date: Date) => date.toISOString().split('T')[0];
    setDateTo(formatDate(today));
    setDateFrom(formatDate(tenDaysAgo));
  }, []);

  // Cargar pedidos cuando cambian las fechas
  useEffect(() => {
    if (dateFrom && dateTo) {
      loadOrders();
    }
  }, [dateFrom, dateTo]);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('dateFrom', dateFrom);
      params.set('dateTo', dateTo);
      params.set('limit', '100');

      const response = await fetch(`/api/admin/orders?${params}`, {
        credentials: 'include',
      });
      const data = await response.json();

      if (data.success) {
        // Filtrar solo pedidos no cancelados
        const validOrders = (data.orders || []).filter(
          (order: Order) => order.status !== 'cancelled'
        );
        setOrders(validOrders);
        // Resetear selección cuando cambian los pedidos
        setSelectedOrders(new Set());
        setSelectAll(false);
      }
    } catch (error) {
      console.error('Error cargando pedidos:', error);
    } finally {
      setLoading(false);
    }
  };

  // Extraer items de order_data si no hay order_items
  const extractItemsFromOrder = (order: Order): OrderItem[] => {
    // Primero intentar con order_items
    if (order.order_items && order.order_items.length > 0) {
      return order.order_items;
    }

    // Luego con items
    if (order.items && order.items.length > 0) {
      return order.items;
    }

    // Finalmente extraer desde order_data (para pedidos de invitados)
    if (order.order_data?.items) {
      return order.order_data.items.map((item: any, index: number) => ({
        id: item.id || `item-${index}`,
        product_id: item.productId || item.product_id || `product-${index}`,
        product_snapshot: {
          name: item.productName || item.product_name || 'Producto',
          price: item.price || item.unit_price || 0,
          variant_name: item.variantName || item.variant_name || null,
          variant_value: item.variantValue || item.variant_value || null
        },
        quantity: item.quantity || 0,
        unit_price: item.price || item.unit_price || 0,
        subtotal: (item.quantity || 0) * (item.price || item.unit_price || 0),
        variantName: item.variantName || item.variant_name || null,
        variant_value: item.variantValue || item.variant_value || null
      }));
    }

    return [];
  };

  // Formatear precio para mostrar
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  // Calcular productos agrupados de los pedidos seleccionados
  const groupedProducts = useMemo(() => {
    const selectedOrdersList = orders.filter(order =>
      selectedOrders.has(order.id)
    );

    const productMap = new Map<string, ProductGrouped>();

    selectedOrdersList.forEach(order => {
      const items = extractItemsFromOrder(order);

      items.forEach(item => {
        // Extraer información del producto
        const productName =
          item.product_snapshot?.name ||
          item.products?.name ||
          item.product_name ||
          item.productName ||
          'Producto sin nombre';

        // Extraer variante si existe
        const variantName = item.product_snapshot?.variant_name || null;
        const variantValue = item.product_snapshot?.variant_value || null;

        // Precio unitario de venta
        const unitPrice = item.unit_price || item.price || 0;

        // Crear clave de agrupación: producto + variante + precio
        // Agrupamos por producto+variante, pero si hay diferente precio, se separa
        const variantKey = (variantName && variantValue)
          ? `${variantName}: ${variantValue}`
          : 'Sin variante';

        const groupingKey = `${productName}|${variantKey}|${unitPrice}`;

        // Verificar si ya existe este grupo
        if (productMap.has(groupingKey)) {
          const existing = productMap.get(groupingKey)!;
          existing.total_quantity += item.quantity;
          existing.orders_count += 1;
        } else {
          // Crear nombre a mostrar
          let displayName = productName;

          // Si hay variante separada, agregarla
          if (variantName && variantValue) {
            displayName = `${productName} (${variantName}: ${variantValue})`;
          }

          productMap.set(groupingKey, {
            grouping_key: groupingKey,
            product_name: productName,
            variant_name: variantName || undefined,
            variant_value: variantValue || undefined,
            display_name: displayName,
            unit_price: unitPrice,
            total_quantity: item.quantity,
            orders_count: 1
          });
        }
      });
    });

    return Array.from(productMap.values()).sort(
      (a, b) => b.total_quantity - a.total_quantity
    );
  }, [orders, selectedOrders]);

  // Toggle selección individual
  const toggleOrderSelection = (orderId: string) => {
    const newSelected = new Set(selectedOrders);
    if (newSelected.has(orderId)) {
      newSelected.delete(orderId);
    } else {
      newSelected.add(orderId);
    }
    setSelectedOrders(newSelected);

    // Actualizar estado de selectAll
    setSelectAll(newSelected.size === orders.length && orders.length > 0);
  };

  // Toggle seleccionar todos
  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedOrders(new Set());
    } else {
      setSelectedOrders(new Set(orders.map(o => o.id)));
    }
    setSelectAll(!selectAll);
  };

  // Calcular total de items en un pedido
  const getOrderItemCount = (order: Order): number => {
    const items = extractItemsFromOrder(order);
    return items.reduce((sum, item) => sum + item.quantity, 0);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
          Lista de Compras
        </h1>
        <p className="text-gray-600 mt-1">
          Genera una lista consolidada de productos para reabastecer inventario
        </p>
      </div>

      {/* Filtros de Fecha */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col md:flex-row md:items-end gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Desde
            </label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Hasta
            </label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => {
                const today = new Date();
                const tenDaysAgo = new Date(today);
                tenDaysAgo.setDate(today.getDate() - 9);
                setDateFrom(tenDaysAgo.toISOString().split('T')[0]);
                setDateTo(today.toISOString().split('T')[0]);
              }}
              className="px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Últimos 10 días
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <ShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No se encontraron pedidos en este rango de fechas</p>
        </div>
      ) : (
        <>
          {/* Resumen */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <p className="text-sm text-gray-600">Pedidos en el rango</p>
              <p className="text-2xl font-bold text-gray-900">{orders.length}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <p className="text-sm text-gray-600">Pedidos seleccionados</p>
              <p className="text-2xl font-bold text-green-600">{selectedOrders.size}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <p className="text-sm text-gray-600">Productos únicos</p>
              <p className="text-2xl font-bold text-blue-600">{groupedProducts.length}</p>
            </div>
          </div>

          {/* Lista de Pedidos con Checkbox */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Pedidos Disponibles</h2>
              <button
                onClick={toggleSelectAll}
                className="text-sm text-green-600 hover:text-green-700 font-medium transition-colors"
              >
                {selectAll ? 'Deseleccionar todos' : 'Seleccionar todos'}
              </button>
            </div>
            <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
              {orders.map(order => {
                const itemCount = getOrderItemCount(order);
                return (
                  <div
                    key={order.id}
                    className="p-4 flex items-center gap-3 hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => toggleOrderSelection(order.id)}
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleOrderSelection(order.id);
                      }}
                      className="flex-shrink-0"
                    >
                      {selectedOrders.has(order.id) ? (
                        <CheckSquare className="w-5 h-5 text-green-600" />
                      ) : (
                        <Square className="w-5 h-5 text-gray-400" />
                      )}
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">
                        {order.customer_name || 'Cliente'}
                      </p>
                      <p className="text-sm text-gray-500">
                        {itemCount} productos
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Estado vacío cuando no hay selección */}
          {selectedOrders.size === 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-8 text-center">
              <ShoppingCart className="w-12 h-12 text-blue-400 mx-auto mb-3" />
              <p className="text-blue-800 font-medium">
                Selecciona pedidos para generar la lista de compras
              </p>
            </div>
          )}

          {/* Lista Consolidada de Productos */}
          {selectedOrders.size > 0 && groupedProducts.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">
                  Lista de Compras
                </h2>
                <p className="text-sm text-gray-600">
                  Productos a comprar para suplir {selectedOrders.size} pedido{selectedOrders.size === 1 ? '' : 's'} seleccionado{selectedOrders.size === 1 ? '' : 's'}
                </p>
              </div>
              <div className="divide-y divide-gray-200">
                {groupedProducts.map(product => (
                  <div
                    key={product.grouping_key}
                    className="p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      {/* Info del producto */}
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                          <Package className="w-5 h-5 text-green-600" />
                        </div>
                        <div className="min-w-0 flex-1">
                          {/* Nombre del producto con variante */}
                          <p className="font-medium text-gray-900 text-base">
                            {product.display_name}
                          </p>

                          {/* Precio unitario y cantidad */}
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1">
                            <p className="text-sm text-green-700 font-semibold">
                              Precio: {formatPrice(product.unit_price)}
                            </p>
                            <p className="text-sm text-gray-600">
                              Cantidad: <span className="font-bold text-gray-900">{product.total_quantity}</span>
                            </p>
                            <p className="text-sm text-gray-500">
                              En {product.orders_count} pedido{product.orders_count === 1 ? '' : 's'}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Total destacado */}
                      <div className="text-right flex-shrink-0">
                        <p className="text-sm text-gray-500">Total</p>
                        <p className="text-2xl font-bold text-green-600">
                          {product.total_quantity}
                        </p>
                        <p className="text-sm text-gray-500">unidades</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Estado cuando hay pedidos seleccionados pero sin productos */}
          {selectedOrders.size > 0 && groupedProducts.length === 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-8 text-center">
              <Package className="w-12 h-12 text-yellow-400 mx-auto mb-3" />
              <p className="text-yellow-800 font-medium">
                Los pedidos seleccionados no contienen productos
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
