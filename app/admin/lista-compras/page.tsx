'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Package,
  CheckSquare,
  Square,
  ShoppingCart,
  ChevronDown,
  ChevronRight,
  Scale
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
  variant_name?: string;
  variant_value?: string;
  variantValue?: string;
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

// Variante individual dentro de un producto
interface VariantDetail {
  variant_name: string;
  unit_price: number;
  total_quantity: number;
  weight_per_unit_grams?: number;
  total_weight_grams?: number;
  total_weight_display?: string;
  orders_count: number;
}

// Producto padre con sus variantes agrupadas
interface ProductWithVariants {
  product_name: string;
  // Totales del producto (suma de todas las variantes)
  total_quantity: number;
  total_weight_grams?: number;
  total_weight_display?: string;
  total_orders_count: number;
  // Lista de variantes (si tiene)
  variants: VariantDetail[];
  // Si no tiene variantes, estos son los datos directos
  has_variants: boolean;
  single_unit_price?: number;
}

export default function ListaComprasPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set());
  const [selectAll, setSelectAll] = useState(false);
  const [expandedProducts, setExpandedProducts] = useState<Set<string>>(new Set());

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
      return order.order_data.items.map((item: any, index: number) => {
        // La variante puede venir como variantName (valor) o variant_name
        const variantInfo = item.variantName || item.variant_name || item.variantValue || item.variant_value || null;
        return {
          id: item.id || `item-${index}`,
          product_id: item.productId || item.product_id || `product-${index}`,
          product_snapshot: {
            name: item.productName || item.product_name || 'Producto',
            price: item.price || item.unit_price || 0,
            variant_name: variantInfo,
            variant_value: variantInfo
          },
          quantity: item.quantity || 0,
          unit_price: item.price || item.unit_price || 0,
          subtotal: (item.quantity || 0) * (item.price || item.unit_price || 0),
          variantName: variantInfo,
          variant_name: variantInfo,
          variant_value: variantInfo,
          variantValue: variantInfo
        };
      });
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

  // Extraer peso en gramos desde la variante
  // Busca patrones como: "1000grs", "500 gramos", "1kg", "0.5 kg", "250grs"
  const extractWeightFromVariant = (variantName: string | null): number | undefined => {
    if (!variantName) return undefined;

    // Patrones de búsqueda (en orden de especificidad)
    const patterns = [
      // "1000 grs", "500 gramos", "250 grs"
      /(\d+(?:\.\d+)?)\s*(?:grs|gramas|gr)\b/i,
      // "1 kg", "0.5 kg", "2 kilos"
      /(\d+(?:\.\d+)?)\s*(?:kg|kilos)\b/i,
      // "1000grs" (sin espacio)
      /(\d+(?:\.\d+)?)grs/i,
      // "X250grs" (formato especial)
      /x(\d+(?:\.\d+)?)grs/i,
    ];

    for (const pattern of patterns) {
      const match = variantName.match(pattern);
      if (match) {
        const value = parseFloat(match[1]);
        // Si está en kg, convertir a gramos
        if (/kg|kilos/i.test(variantName)) {
          return value * 1000;
        }
        return value;
      }
    }

    return undefined;
  };

  // Formatear peso total para mostrar
  const formatWeight = (grams: number): string => {
    if (grams >= 1000) {
      const kg = grams / 1000;
      // Si es entero, mostrar sin decimales, si no, con 1 decimal
      return kg % 1 === 0 ? `${kg.toFixed(0)} kg` : `${kg.toFixed(1)} kg`;
    }
    return `${grams} gr`;
  };

  // Calcular productos agrupados por producto padre con variantes
  const productsWithVariants = useMemo((): ProductWithVariants[] => {
    const selectedOrdersList = orders.filter(order =>
      selectedOrders.has(order.id)
    );

    // Primero agrupar por producto + variante (como antes)
    const variantMap = new Map<string, {
      product_name: string;
      variant_name: string | null;
      unit_price: number;
      total_quantity: number;
      weight_per_unit_grams?: number;
      total_weight_grams?: number;
      orders_count: number;
    }>();

    selectedOrdersList.forEach(order => {
      const items = extractItemsFromOrder(order);

      items.forEach(item => {
        const productName =
          item.product_snapshot?.name ||
          item.products?.name ||
          item.product_name ||
          item.productName ||
          'Producto sin nombre';

        const variantName =
          item.product_snapshot?.variant_name ||
          item.variant_name ||
          item.variantName ||
          null;
        const variantValue =
          item.product_snapshot?.variant_value ||
          item.variant_value ||
          item.variantName ||
          null;

        const unitPrice = item.unit_price || item.price || 0;
        const weightPerUnitGrams = extractWeightFromVariant(variantName || variantValue || null);
        const variantKey = variantName || variantValue || 'SIN_VARIANTE';
        const groupingKey = `${productName}|${variantKey}`;

        if (variantMap.has(groupingKey)) {
          const existing = variantMap.get(groupingKey)!;
          existing.total_quantity += item.quantity;
          existing.orders_count += 1;
          if (weightPerUnitGrams) {
            existing.total_weight_grams = (existing.total_weight_grams || 0) + weightPerUnitGrams * item.quantity;
          }
        } else {
          const initialWeight = weightPerUnitGrams ? weightPerUnitGrams * item.quantity : undefined;
          variantMap.set(groupingKey, {
            product_name: productName,
            variant_name: variantKey === 'SIN_VARIANTE' ? null : variantKey,
            unit_price: unitPrice,
            total_quantity: item.quantity,
            weight_per_unit_grams: weightPerUnitGrams,
            total_weight_grams: initialWeight,
            orders_count: 1
          });
        }
      });
    });

    // Ahora agrupar por producto padre
    const productMap = new Map<string, ProductWithVariants>();

    variantMap.forEach((variant) => {
      const { product_name, variant_name, unit_price, total_quantity, weight_per_unit_grams, total_weight_grams, orders_count } = variant;

      if (productMap.has(product_name)) {
        const existing = productMap.get(product_name)!;
        existing.total_quantity += total_quantity;
        existing.total_orders_count += orders_count;
        if (total_weight_grams) {
          existing.total_weight_grams = (existing.total_weight_grams || 0) + total_weight_grams;
        }

        // Agregar variante si tiene nombre
        if (variant_name) {
          existing.has_variants = true;
          existing.variants.push({
            variant_name,
            unit_price,
            total_quantity,
            weight_per_unit_grams,
            total_weight_grams,
            total_weight_display: total_weight_grams ? formatWeight(total_weight_grams) : undefined,
            orders_count
          });
        }
      } else {
        const hasVariant = variant_name !== null;
        productMap.set(product_name, {
          product_name,
          total_quantity,
          total_weight_grams,
          total_weight_display: total_weight_grams ? formatWeight(total_weight_grams) : undefined,
          total_orders_count: orders_count,
          variants: hasVariant ? [{
            variant_name: variant_name!,
            unit_price,
            total_quantity,
            weight_per_unit_grams,
            total_weight_grams,
            total_weight_display: total_weight_grams ? formatWeight(total_weight_grams) : undefined,
            orders_count
          }] : [],
          has_variants: hasVariant,
          single_unit_price: hasVariant ? undefined : unit_price
        });
      }
    });

    // Recalcular peso total display y ordenar variantes
    const result = Array.from(productMap.values()).map(product => {
      if (product.total_weight_grams) {
        product.total_weight_display = formatWeight(product.total_weight_grams);
      }
      // Ordenar variantes por cantidad descendente
      product.variants.sort((a, b) => b.total_quantity - a.total_quantity);
      return product;
    });

    // Ordenar productos por cantidad total descendente
    return result.sort((a, b) => b.total_quantity - a.total_quantity);
  }, [orders, selectedOrders]);

  // Toggle para expandir/colapsar producto
  const toggleProductExpanded = (productName: string) => {
    const newExpanded = new Set(expandedProducts);
    if (newExpanded.has(productName)) {
      newExpanded.delete(productName);
    } else {
      newExpanded.add(productName);
    }
    setExpandedProducts(newExpanded);
  };

  // Expandir todos los productos
  const expandAll = () => {
    const allProducts = new Set(productsWithVariants.filter(p => p.has_variants).map(p => p.product_name));
    setExpandedProducts(allProducts);
  };

  // Colapsar todos
  const collapseAll = () => {
    setExpandedProducts(new Set());
  };

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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <p className="text-sm text-gray-600">Pedidos en el rango</p>
              <p className="text-2xl font-bold text-gray-900">{orders.length}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <p className="text-sm text-gray-600">Pedidos seleccionados</p>
              <p className="text-2xl font-bold text-green-600">{selectedOrders.size}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <p className="text-sm text-gray-600">Productos</p>
              <p className="text-2xl font-bold text-blue-600">{productsWithVariants.length}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <p className="text-sm text-gray-600">Total unidades</p>
              <p className="text-2xl font-bold text-purple-600">
                {productsWithVariants.reduce((sum, p) => sum + p.total_quantity, 0)}
              </p>
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

          {/* Lista Consolidada de Productos - Agrupados por Producto Padre */}
          {selectedOrders.size > 0 && productsWithVariants.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    Lista de Compras
                  </h2>
                  <p className="text-sm text-gray-600">
                    Productos a comprar para suplir {selectedOrders.size} pedido{selectedOrders.size === 1 ? '' : 's'} seleccionado{selectedOrders.size === 1 ? '' : 's'}
                  </p>
                </div>
                {/* Botones expandir/colapsar */}
                {productsWithVariants.some(p => p.has_variants) && (
                  <div className="flex gap-2">
                    <button
                      onClick={expandAll}
                      className="text-xs px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
                    >
                      Expandir todo
                    </button>
                    <button
                      onClick={collapseAll}
                      className="text-xs px-3 py-1.5 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      Colapsar todo
                    </button>
                  </div>
                )}
              </div>
              <div className="divide-y divide-gray-200">
                {productsWithVariants.map(product => {
                  const isExpanded = expandedProducts.has(product.product_name);
                  const hasVariants = product.has_variants && product.variants.length > 0;

                  return (
                    <div key={product.product_name}>
                      {/* Producto Padre */}
                      <div
                        className={`p-4 transition-colors ${hasVariants ? 'cursor-pointer hover:bg-gray-50' : ''}`}
                        onClick={() => hasVariants && toggleProductExpanded(product.product_name)}
                      >
                        <div className="flex items-start justify-between gap-4">
                          {/* Info del producto */}
                          <div className="flex items-start gap-3 flex-1 min-w-0">
                            {/* Icono expandir/colapsar o package */}
                            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                              {hasVariants ? (
                                isExpanded ? (
                                  <ChevronDown className="w-5 h-5 text-green-600" />
                                ) : (
                                  <ChevronRight className="w-5 h-5 text-green-600" />
                                )
                              ) : (
                                <Package className="w-5 h-5 text-green-600" />
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              {/* Nombre del producto */}
                              <p className="font-semibold text-gray-900 text-base">
                                {product.product_name}
                              </p>

                              {/* Info adicional */}
                              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1">
                                {!hasVariants && product.single_unit_price && (
                                  <p className="text-sm text-green-700 font-semibold">
                                    Precio: {formatPrice(product.single_unit_price)}
                                  </p>
                                )}
                                {hasVariants && (
                                  <p className="text-sm text-blue-600 font-medium">
                                    {product.variants.length} variante{product.variants.length === 1 ? '' : 's'}
                                  </p>
                                )}
                                {product.total_weight_display && (
                                  <p className="text-sm text-gray-600 flex items-center gap-1">
                                    <Scale className="w-3.5 h-3.5" />
                                    {product.total_weight_display} total
                                  </p>
                                )}
                                <p className="text-sm text-gray-500">
                                  En {product.total_orders_count} pedido{product.total_orders_count === 1 ? '' : 's'}
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Total destacado */}
                          <div className="text-right flex-shrink-0">
                            <p className="text-sm text-gray-500">Total</p>
                            <p className="text-3xl font-bold text-green-600">
                              {product.total_quantity}
                            </p>
                            <p className="text-sm text-gray-500">unidades</p>
                          </div>
                        </div>
                      </div>

                      {/* Variantes expandidas */}
                      {hasVariants && isExpanded && (
                        <div className="bg-gray-50 border-t border-gray-100">
                          {product.variants.map((variant, idx) => (
                            <div
                              key={`${product.product_name}-${variant.variant_name}-${idx}`}
                              className="px-4 py-3 ml-12 mr-4 border-b border-gray-100 last:border-b-0"
                            >
                              <div className="flex items-center justify-between gap-4">
                                <div className="flex-1">
                                  <p className="font-medium text-gray-800">
                                    {variant.variant_name}
                                  </p>
                                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-0.5">
                                    <p className="text-sm text-green-700">
                                      {formatPrice(variant.unit_price)}
                                    </p>
                                    {variant.total_weight_display && (
                                      <p className="text-sm text-gray-500">
                                        ({variant.total_weight_display})
                                      </p>
                                    )}
                                    <p className="text-xs text-gray-400">
                                      {variant.orders_count} pedido{variant.orders_count === 1 ? '' : 's'}
                                    </p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="text-xl font-bold text-gray-700">
                                    {variant.total_quantity}
                                  </p>
                                  <p className="text-xs text-gray-400">unid.</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Estado cuando hay pedidos seleccionados pero sin productos */}
          {selectedOrders.size > 0 && productsWithVariants.length === 0 && (
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
