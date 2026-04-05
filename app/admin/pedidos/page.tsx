'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Filter,
  ChevronLeft,
  ChevronRight,
  Package,
  Clock,
  Phone,
  MapPin,
  User,
  Calendar,
  CheckCircle,
  XCircle,
  Truck,
  ChefHat,
  Trash2,
  AlertTriangle,
  FileText,
  Copy,
  Check,
  ClipboardList
} from 'lucide-react';
import {
  getOrderTypeLabel,
  normalizeOrderStatus,
  normalizePaymentStatus,
  type AdminOrderType,
} from '@/lib/orders/operational';
import { generateOrderSummary, generateWhatsAppURL } from '@/utils/orderSummaryGenerator';
import { formatAddressToString } from '@/utils/addressFormatter';
import EditOrderModal from '@/components/admin/EditOrderModal';
import { Edit } from 'lucide-react';

interface OrderItem {
  id: string;
  product_id: string;
  product_snapshot?: {
    name?: string;
    price?: number;
    main_image_url?: string;
    image?: string;
    description?: string;
  };
  quantity: number;
  unit_price: number;
  subtotal: number;
  products?: {
    name?: string;
    main_image_url?: string;
    description?: string;
  };
  product_name?: string;
  productName?: string;
  variantName?: string;
  price?: number;
  description?: string;
}

interface Order {
  id: string;
  order_number: string;
  customer_name?: string;
  customer_phone?: string;
  customer_email?: string;
  delivery_address?: string;
  delivery_notes?: string;
  notes?: string;
  status: string;
  payment_status?: string;
  total: number;
  total_amount?: number;
  subtotal?: number;
  shipping_fee?: number;
  shipping_cost?: number;
  discount?: number;
  discount_amount?: number;
  coupon_code?: string;
  created_at: string;
  delivery_date?: string;
  order_items?: OrderItem[];
  items?: OrderItem[];
  user_id?: string;
  shipping_address?: string;
  order_type?: AdminOrderType;
  order_data?: any;
  operational_flags?: string[];
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const statusConfig: Record<string, { label: string; color: string; bgColor: string; icon: any }> = {
  pending: {
    label: 'Pendiente',
    color: 'text-yellow-700',
    bgColor: 'bg-yellow-100 border-yellow-200',
    icon: Clock,
  },
  confirmed: {
    label: 'Confirmado',
    color: 'text-blue-700',
    bgColor: 'bg-blue-100 border-blue-200',
    icon: ChefHat,
  },
  processing: {
    label: 'En Preparación',
    color: 'text-purple-700',
    bgColor: 'bg-purple-100 border-purple-200',
    icon: Truck,
  },
  shipped: {
    label: 'En Camino',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100 border-blue-200',
    icon: Truck,
  },
  delivered: {
    label: 'Entregado',
    color: 'text-green-700',
    bgColor: 'bg-green-100 border-green-200',
    icon: CheckCircle,
  },
  cancelled: {
    label: 'Cancelado',
    color: 'text-red-700',
    bgColor: 'bg-red-100 border-red-200',
    icon: XCircle,
  },
};

const paymentStatusConfig: Record<string, { label: string; color: string; bgColor: string; icon: any }> = {
  pending: {
    label: 'Pendiente',
    color: 'text-yellow-700',
    bgColor: 'bg-yellow-100 border-yellow-200',
    icon: Clock,
  },
  paid: {
    label: 'Pagado',
    color: 'text-green-700',
    bgColor: 'bg-green-100 border-green-200',
    icon: CheckCircle,
  },
  completed: {
    label: 'Completado',
    color: 'text-green-700',
    bgColor: 'bg-green-100 border-green-200',
    icon: CheckCircle,
  },
  failed: {
    label: 'Fallido',
    color: 'text-red-700',
    bgColor: 'bg-red-100 border-red-200',
    icon: XCircle,
  },
  refunded: {
    label: 'Reembolsado',
    color: 'text-blue-700',
    bgColor: 'bg-blue-100 border-blue-200',
    icon: AlertTriangle,
  },
};

const orderTypeConfig: Record<AdminOrderType, { bgColor: string; textColor: string }> = {
  registered: {
    bgColor: 'bg-emerald-100 border-emerald-200',
    textColor: 'text-emerald-700',
  },
  guest: {
    bgColor: 'bg-amber-100 border-amber-200',
    textColor: 'text-amber-700',
  },
  admin_manual: {
    bgColor: 'bg-sky-100 border-sky-200',
    textColor: 'text-sky-700',
  },
};

interface OrderStats {
  pending: number;
  confirmed: number;
  processing: number;
  shipped: number;
  delivered: number;
  cancelled: number;
  total: number;
}

export default function OrdersPage() {
  const searchParams = useSearchParams();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState(searchParams.get('status') || '');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState(searchParams.get('payment_status') || '');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [quickFilter, setQuickFilter] = useState<string>('');
  const [customerDataFilter, setCustomerDataFilter] = useState<string>('');
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
  });
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [updatingOrder, setUpdatingOrder] = useState<string | null>(null);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [orderStats, setOrderStats] = useState<OrderStats>({
    pending: 0,
    confirmed: 0,
    processing: 0,
    shipped: 0,
    delivered: 0,
    cancelled: 0,
    total: 0
  });
  const [copiedItems, setCopiedItems] = useState<Set<string>>(new Set());

  // Copiar al portapapeles con feedback visual
  const copyToClipboard = async (text: string, itemId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedItems(new Set([...copiedItems, itemId]));
      setTimeout(() => {
        setCopiedItems(prev => {
          const newSet = new Set(prev);
          newSet.delete(itemId);
          return newSet;
        });
      }, 2000);
    } catch (err) {
      console.error('Error copiando:', err);
    }
  };

  // Extraer dirección como texto plano (usa utilidad compartida)
  const getAddressText = (order: Order): string => {
    const addr = order.shipping_address || order.delivery_address;
    return formatAddressToString(addr);
  };

  // Generar resumen del pedido para EMPAQUE (copiar al portapapeles)
  // Formato optimizado para verificación: lista de productos, variantes visibles, estado de pago, fecha entrega
  const getOrderSummaryText = (order: Order, customerName: string, orderItems: any[]): string => {
    // Formatear moneda
    const formatMoney = (amount: number) => {
      return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0
      }).format(amount);
    };

    // Formatear fecha
    const formatDateShort = (dateString: string) => {
      return new Date(dateString).toLocaleDateString('es-CO', {
        weekday: 'short',
        day: 'numeric',
        month: 'short'
      });
    };

    // Calcular totales desde los items
    const totalProducts = orderItems.reduce((sum, item) => sum + (item.quantity || 1), 0);

    // Obtener estado de pago
    const paymentStatus = order.payment_status || 'pending';
    const paymentLabel = paymentStatusConfig[normalizePaymentStatus(paymentStatus)]?.label || 'Pendiente';
    const isPaid = ['paid', 'completed', 'pagado', 'completado'].includes(paymentStatus.toLowerCase());

    // Obtener fecha de entrega
    const deliveryDate = order.delivery_date || '';

    // Construir resumen
    const lines: string[] = [];

    // ═══════════════════════════════════════
    // HEADER - Para empaque
    // ═══════════════════════════════════════
    lines.push('═══════════════════════════════════');
    lines.push(`📦 EMPAQUE - Pedido #${order.order_number || order.id.slice(-6).toUpperCase()}`);
    lines.push('═══════════════════════════════════');
    lines.push('');

    // ═══════════════════════════════════════
    // ESTADO DE PAGO - Destacado
    // ═══════════════════════════════════════
    if (isPaid) {
      lines.push('✅ PAGO: PAGADO');
    } else {
      lines.push('⚠️  PAGO: PENDIENTE - COBRAR AL ENTREGAR');
    }
    lines.push('');

    // ═══════════════════════════════════════
    // FECHA DE ENTREGA
    // ═══════════════════════════════════════
    if (deliveryDate) {
      lines.push(`📅 ENTREGA: ${formatDateShort(deliveryDate)}`);
      lines.push('');
    }

    // ═══════════════════════════════════════
    // CLIENTE
    // ═══════════════════════════════════════
    lines.push(`👤 CLIENTE: ${customerName.toUpperCase()}`);
    const customerPhone = order.customer_phone || '';
    if (customerPhone) {
      lines.push(`📞 Tel: ${customerPhone}`);
    }
    lines.push('');

    // ═══════════════════════════════════════
    // DIRECCIÓN COMPLETA
    // ═══════════════════════════════════════
    const address = getAddressText(order);
    lines.push('📍 DIRECCIÓN DE ENTREGA:');
    lines.push(`   ${address || '⚠️ Sin dirección'}`);
    lines.push('');

    // ═══════════════════════════════════════
    // PRODUCTOS - Lista para verificación
    // ═══════════════════════════════════════
    lines.push(`☑️ VERIFICAR PRODUCTOS (${totalProducts} items):`);
    lines.push('───────────────────────────────────');

    // Función para asignar emoticón según el producto
    const getProductEmoji = (productName: string): string => {
      const name = productName.toLowerCase();
      if (name.includes('aguacate') || name.includes('hass')) return '🥑';
      if (name.includes('limón') || name.includes('limon')) return '🍋';
      if (name.includes('mango')) return '🥭';
      if (name.includes('fresa')) return '🍓';
      if (name.includes('piña') || name.includes('pina')) return '🍍';
      if (name.includes('papaya')) return '🍈';
      if (name.includes('banano') || name.includes('plátano') || name.includes('platano')) return '🍌';
      if (name.includes('naranja') || name.includes('mandarina')) return '🍊';
      if (name.includes('manzana')) return '🍎';
      if (name.includes('uva')) return '🍇';
      if (name.includes('sandía') || name.includes('sandia')) return '🍉';
      if (name.includes('durazno') || name.includes('melocotón')) return '🍑';
      if (name.includes('cereza')) return '🍒';
      if (name.includes('pera')) return '🍐';
      if (name.includes('coco')) return '🥥';
      if (name.includes('kiwi')) return '🥝';
      if (name.includes('arándano') || name.includes('arandano') || name.includes('mora')) return '💜';
      if (name.includes('frambuesa')) return '🍓';
      if (name.includes('cidra')) return '🍈';
      if (name.includes('papa') || name.includes('patata')) return '🥔';
      if (name.includes('cebolla')) return '🧅';
      if (name.includes('ajo')) return '🧄';
      if (name.includes('zanahoria')) return '🥕';
      if (name.includes('maíz') || name.includes('maiz')) return '🌽';
      if (name.includes('tomate')) return '🍅';
      if (name.includes('lechuga') || name.includes('espinaca')) return '🥬';
      if (name.includes('brócoli') || name.includes('brocoli')) return '🥦';
      if (name.includes('champiñón') || name.includes('champinon') || name.includes('hongo')) return '🍄';
      if (name.includes('café') || name.includes('cafe')) return '☕';
      if (name.includes('miel')) return '🍯';
      if (name.includes('huevo')) return '🥚';
      if (name.includes('leche')) return '🥛';
      if (name.includes('queso')) return '🧀';
      if (name.includes('pan')) return '🥖';
      if (name.includes('carne') || name.includes('res')) return '🥩';
      if (name.includes('pollo')) return '🍗';
      if (name.includes('pescado') || name.includes('salmón')) return '🐟';
      if (name.includes('camarón') || name.includes('camaron')) return '🦐';
      return '📦'; // Default para productos sin categoría
    };

    orderItems.forEach((item, index) => {
      const itemName = item.product_snapshot?.name || item.products?.name || item.product_name || item.productName || 'Producto';
      const variant = item.product_snapshot?.variant_name || item.product_snapshot?.variant_value || item.variantName || '';
      const description = item.product_snapshot?.description || item.products?.description || item.description || '';
      const emoji = getProductEmoji(itemName);
      
      // Variante más visible en línea separada
      lines.push(`   ☐ ${emoji} ${item.quantity}x ${itemName}`);
      if (variant) {
        lines.push(`      ↳ Variante: ${variant}`);
      }
      // Mostrar descripción si existe (importante para combos)
      if (description) {
        lines.push(`      📋 Incluye: ${description}`);
      }
      lines.push('');
    });

    lines.push('───────────────────────────────────');

    // ═══════════════════════════════════════
    // DESGLOSE FINANCIERO (usando calculateOrderSummary)
    // ═══════════════════════════════════════
    const calculations = calculateOrderSummary(order, orderItems);
    
    lines.push('');
    lines.push('💵 RESUMEN DE PAGO:');
    
    // Subtotal de productos
    lines.push(`   Subtotal productos: ${formatMoney(calculations.subtotal)}`);
    
    // Envío
    if (calculations.shippingFee > 0) {
      lines.push(`   🚚 Domicilio: ${formatMoney(calculations.shippingFee)}`);
    } else {
      lines.push(`   🚚 Domicilio: GRATIS`);
    }
    
    // Descuento si existe
    if (calculations.discount > 0) {
      lines.push(`   🏷️ Descuento: -${formatMoney(calculations.discount)}`);
    }
    
    lines.push('   ─────────────────────');
    
    // Total final
    if (isPaid) {
      lines.push(`   💰 TOTAL: ${formatMoney(calculations.total)} (PAGADO)`);
    } else {
      lines.push(`   💰 TOTAL A COBRAR: ${formatMoney(calculations.total)}`);
    }

    // ═══════════════════════════════════════
    // NOTAS DE ENTREGA
    // ═══════════════════════════════════════
    const notes = order.delivery_notes || order.notes;
    if (notes) {
      lines.push('');
      lines.push('📝 NOTAS DE ENTREGA:');
      lines.push(`   ${notes}`);
    }

    lines.push('');
    lines.push('═══════════════════════════════════');

    return lines.join('\n');
  };

  // Funciones helper para calcular rangos de fechas
  const getDateRanges = () => {
    const today = new Date();
    // Usar fecha LOCAL (no UTC) para evitar problemas de timezone
    // Cuando son las 8PM en Colombia (UTC-5), UTC es 1AM del día siguiente
    const formatDateLocal = (date: Date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    // Hoy
    const todayRange = {
      from: formatDateLocal(today),
      to: formatDateLocal(today)
    };

    // Esta semana (lunes a domingo)
    const currentDay = today.getDay();
    const mondayOffset = currentDay === 0 ? -6 : 1 - currentDay;
    const monday = new Date(today);
    monday.setDate(today.getDate() + mondayOffset);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);

    const thisWeekRange = {
      from: formatDateLocal(monday),
      to: formatDateLocal(sunday)
    };

    // Semana pasada
    const lastMonday = new Date(monday);
    lastMonday.setDate(monday.getDate() - 7);
    const lastSunday = new Date(lastMonday);
    lastSunday.setDate(lastMonday.getDate() + 6);

    const lastWeekRange = {
      from: formatDateLocal(lastMonday),
      to: formatDateLocal(lastSunday)
    };

    // Últimos 7 días
    const last7Days = new Date(today);
    last7Days.setDate(today.getDate() - 6);

    const last7DaysRange = {
      from: formatDateLocal(last7Days),
      to: formatDateLocal(today)
    };

    // Últimos 30 días
    const last30Days = new Date(today);
    last30Days.setDate(today.getDate() - 29);

    const last30DaysRange = {
      from: formatDateLocal(last30Days),
      to: formatDateLocal(today)
    };

    // Este mes
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    const thisMonthRange = {
      from: formatDateLocal(firstDayOfMonth),
      to: formatDateLocal(lastDayOfMonth)
    };

    // Mes pasado
    const firstDayOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const lastDayOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);

    const lastMonthRange = {
      from: formatDateLocal(firstDayOfLastMonth),
      to: formatDateLocal(lastDayOfLastMonth)
    };

    return {
      today: todayRange,
      thisWeek: thisWeekRange,
      lastWeek: lastWeekRange,
      last7Days: last7DaysRange,
      last30Days: last30DaysRange,
      thisMonth: thisMonthRange,
      lastMonth: lastMonthRange
    };
  };

  // Calcular fecha del ciclo de entrega (viernes o martes 10AM hacia ahora)
  const getDeliveryCycleDate = (deliveryDay: 'friday' | 'tuesday') => {
    const now = new Date();
    const today = new Date();
    const targetDay = deliveryDay === 'friday' ? 5 : 2; // 5=viernes, 2=martes
    const currentDay = today.getDay();

    // Calcular cuántos días retroceder para llegar al último día de entrega
    let daysBack = currentDay - targetDay;
    if (daysBack < 0) daysBack += 7;
    if (daysBack === 0 && now.getHours() < 10) {
      // Si es hoy pero antes de las 10AM, usar el de la semana pasada
      daysBack = 7;
    }

    const deliveryDate = new Date(today);
    deliveryDate.setDate(today.getDate() - daysBack);
    deliveryDate.setHours(10, 0, 0, 0); // 10:00 AM

    // Formato YYYY-MM-DD
    const year = deliveryDate.getFullYear();
    const month = String(deliveryDate.getMonth() + 1).padStart(2, '0');
    const day = String(deliveryDate.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  };

  // Aplicar filtro rápido
  const applyQuickFilter = (filterType: string) => {
    const ranges = getDateRanges();
    setQuickFilter(filterType);

    // Formato fecha de hoy para "hasta"
    const formatToday = () => {
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    switch (filterType) {
      case 'today':
        setDateFrom(ranges.today.from);
        setDateTo(ranges.today.to);
        break;
      case 'sinceLastFriday':
        // Desde el viernes 10AM hasta ahora (pedidos para entregar el martes)
        setDateFrom(getDeliveryCycleDate('friday'));
        setDateTo(formatToday());
        break;
      case 'sinceLastTuesday':
        // Desde el martes 10AM hasta ahora (pedidos para entregar el viernes)
        setDateFrom(getDeliveryCycleDate('tuesday'));
        setDateTo(formatToday());
        break;
      case 'thisWeek':
        setDateFrom(ranges.thisWeek.from);
        setDateTo(ranges.thisWeek.to);
        break;
      case 'lastWeek':
        setDateFrom(ranges.lastWeek.from);
        setDateTo(ranges.lastWeek.to);
        break;
      case 'last7Days':
        setDateFrom(ranges.last7Days.from);
        setDateTo(ranges.last7Days.to);
        break;
      case 'last30Days':
        setDateFrom(ranges.last30Days.from);
        setDateTo(ranges.last30Days.to);
        break;
      case 'thisMonth':
        setDateFrom(ranges.thisMonth.from);
        setDateTo(ranges.thisMonth.to);
        break;
      case 'lastMonth':
        setDateFrom(ranges.lastMonth.from);
        setDateTo(ranges.lastMonth.to);
        break;
      default:
        setDateFrom('');
        setDateTo('');
    }

    setPagination(prev => ({ ...prev, page: 1 }));
  };

  useEffect(() => {
    loadOrders();
  }, [status, paymentStatusFilter, dateFrom, dateTo, pagination.page]);

  useEffect(() => {
    loadOrderStats();
  }, []);

  // Manejar parámetro ?id= para abrir un pedido específico automáticamente
  useEffect(() => {
    const orderId = searchParams.get('id');
    if (orderId && orders.length > 0) {
      // Expandir el pedido solicitado
      setExpandedOrder(orderId);

      // Hacer scroll al pedido después de un pequeño delay para que se renderice
      setTimeout(() => {
        const orderElement = document.getElementById(`order-${orderId}`);
        if (orderElement) {
          orderElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          // Agregar un efecto visual temporalmente
          orderElement.classList.add('ring-4', 'ring-green-500', 'ring-opacity-50');
          setTimeout(() => {
            orderElement.classList.remove('ring-4', 'ring-green-500', 'ring-opacity-50');
          }, 3000);
        }
      }, 300);
    }
  }, [orders, searchParams]);

  const loadOrderStats = async () => {
    try {
      const response = await fetch('/api/admin/orders/stats', {
        credentials: 'include',
      });
      const data = await response.json();
      if (data.success && data.stats) {
        setOrderStats(data.stats);
      }
    } catch (error) {
      console.error('Error cargando estadísticas:', error);
    }
  };

  const loadOrders = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', pagination.page.toString());
      params.set('limit', pagination.limit.toString());
      if (status) params.set('status', status);
      if (paymentStatusFilter) params.set('payment_status', paymentStatusFilter);
      if (dateFrom) params.set('dateFrom', dateFrom);
      if (dateTo) params.set('dateTo', dateTo);

      const response = await fetch(`/api/admin/orders?${params}`, {
        credentials: 'include',
      });
      const data = await response.json();

      if (data.success) {
        setOrders(data.orders || []);
        setPagination(prev => ({
          ...prev,
          total: data.pagination?.total || 0,
          totalPages: data.pagination?.totalPages || 1,
        }));
      }
    } catch (error) {
      console.error('Error cargando pedidos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    setUpdatingOrder(orderId);
    try {
      const response = await fetch(`/api/admin/orders?id=${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await response.json();

      if (data.success) {
        loadOrders();
        loadOrderStats(); // Refresh stats after status update
      } else {
        alert(data.error || 'Error al actualizar el estado');
      }
    } catch (error) {
      console.error('Error actualizando estado:', error);
      alert('Error al actualizar el estado del pedido');
    } finally {
      setUpdatingOrder(null);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'America/Bogota' // Forzar timezone de Colombia
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('es-CO', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'America/Bogota' // Forzar timezone de Colombia
    });
  };

  // Función para obtener datos del cliente
  const getCustomerInfo = (order: Order) => {
    // Primero intentar con los datos directos del pedido
    if (order.customer_name) {
      return {
        name: order.customer_name,
        phone: order.customer_phone,
        email: order.customer_email
      };
    }

    // Si hay shipping_address, extraer de allí
    if (order.shipping_address) {
      try {
        const address = JSON.parse(order.shipping_address);
        return {
          name: 'Cliente',
          phone: address.phone || null,
          email: order.customer_email
        };
      } catch {
        // Error parseando JSON
      }
    }

    // Valor por defecto
    return {
      name: 'Cliente',
      phone: null,
      email: order.customer_email
    };
  };

  // Función para verificar si los datos del cliente están completos
  const hasCustomerDataIssue = (order: Order, filterType: string) => {
    const customerInfo = getCustomerInfo(order);

    switch (filterType) {
      case 'noName':
        return !customerInfo.name || customerInfo.name === 'Cliente';
      case 'noEmail':
        return !customerInfo.email;
      case 'noPhone':
        return !customerInfo.phone;
      case 'incomplete':
        return !customerInfo.name ||
          customerInfo.name === 'Cliente' ||
          !customerInfo.email ||
          !customerInfo.phone;
      default:
        return true;
    }
  };

  const calculateOrderSummary = (order: Order, orderItems: OrderItem[]) => {
    // Calcular subtotal desde items si no está disponible
    const itemsSubtotal = orderItems.reduce((sum, item) => {
      const itemTotal = (item.unit_price || item.price || 0) * item.quantity;
      return sum + itemTotal;
    }, 0);

    // Usar subtotal de la orden si existe, sino calcular desde items
    const subtotal = order.subtotal || itemsSubtotal;

    // Para pedidos de invitados, intentar extraer costo de envío y descuento del order_data
    let shippingFee = 0;
    let discount = 0;
    let couponCode = null;

    if (order.order_type === 'guest' && order.order_data) {
      // Para invitados, extraer datos del order_data si existen
      const orderData = order.order_data as any;
      shippingFee = orderData.shipping_cost || orderData.shippingFee || orderData.shipping || 0;
      discount = orderData.discount || orderData.discount_amount || 0;
      couponCode = orderData.coupon_code || orderData.couponCode || null;
    } else {
      // Para usuarios registrados, usar campos directos
      shippingFee = (order as any).shipping_fee || (order as any).shipping_cost || 0;
      discount = (order as any).discount || (order as any).discount_amount || 0;
      couponCode = (order as any).coupon_code || null;
    }

    // Calcular total o usar existente
    const calculatedTotal = subtotal + shippingFee - discount;
    const total = order.total || order.total_amount || calculatedTotal;

    // Verificar si hay inconsistencia
    const hasDiscrepancy = Math.abs(calculatedTotal - total) > 100; // Diferencia mayor a $100

    // Determinar si es un pedido calculado (invitado con datos limitados)
    const isEstimated = order.order_type === 'guest' && !order.subtotal && !order.shipping_fee;

    return {
      subtotal,
      shippingFee,
      discount,
      couponCode,
      total,
      hasDiscount: discount > 0,
      hasFreeShipping: shippingFee === 0 && subtotal > 0,
      hasDiscrepancy,
      isEstimated,
      calculatedTotal
    };
  };

  const clearFilters = () => {
    setStatus('');
    setDateFrom('');
    setDateTo('');
    setQuickFilter('');
    setCustomerDataFilter('');
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const deleteOrder = async (orderId: string, orderNumber: string) => {
    if (!confirm(`¿Estás seguro de que deseas eliminar el pedido ${orderNumber}?\n\nEsta acción no se puede deshacer.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      const data = await response.json();

      if (data.success) {
        alert('Pedido eliminado exitosamente');
        loadOrders();
      } else {
        alert(data.error || 'Error al eliminar el pedido');
      }
    } catch (error) {
      console.error('Error eliminando pedido:', error);
      alert('Error al eliminar el pedido');
    }
  };

  const handleSaveOrderEdit = async (items: any[], newTotal: number, customerData?: any): Promise<boolean> => {
    if (!editingOrder) return false;

    try {
      const response = await fetch(`/api/admin/orders?id=${editingOrder.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ items, total: newTotal, customerData }),
      });

      const data = await response.json();

      if (data.success) {
        loadOrders();
        return true;
      } else {
        alert(data.error || 'Error al guardar cambios');
        return false;
      }
    } catch (error) {
      console.error('Error guardando cambios:', error);
      alert('Error al guardar los cambios del pedido');
      return false;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Gestión de Pedidos</h1>
        <p className="text-gray-600 mt-1">Administra y da seguimiento a todos los pedidos</p>
      </div>

      {/* Quick Stats Panel */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        {/* Total */}
        <button
          onClick={() => { setStatus(''); setPagination(prev => ({ ...prev, page: 1 })); }}
          className={`p-4 rounded-xl border-2 transition-all ${status === ''
            ? 'bg-gray-100 border-gray-400 shadow-md'
            : 'bg-white border-gray-200 hover:border-gray-300'
            }`}
        >
          <div className="text-2xl font-bold text-gray-900">{orderStats.total}</div>
          <div className="text-xs text-gray-600">Total</div>
        </button>

        {/* Pending */}
        <button
          onClick={() => { setStatus('pending'); setPagination(prev => ({ ...prev, page: 1 })); }}
          className={`p-4 rounded-xl border-2 transition-all ${status === 'pending'
            ? 'bg-yellow-100 border-yellow-400 shadow-md'
            : 'bg-white border-gray-200 hover:border-yellow-300'
            }`}
        >
          <div className="text-2xl font-bold text-yellow-600">{orderStats.pending}</div>
          <div className="text-xs text-gray-600 flex items-center gap-1">
            <Clock className="w-3 h-3" /> Pendientes
          </div>
        </button>

        {/* Confirmed */}
        <button
          onClick={() => { setStatus('confirmed'); setPagination(prev => ({ ...prev, page: 1 })); }}
          className={`p-4 rounded-xl border-2 transition-all ${status === 'confirmed'
            ? 'bg-blue-100 border-blue-400 shadow-md'
            : 'bg-white border-gray-200 hover:border-blue-300'
            }`}
        >
          <div className="text-2xl font-bold text-blue-600">{orderStats.confirmed}</div>
          <div className="text-xs text-gray-600 flex items-center gap-1">
            <CheckCircle className="w-3 h-3" /> Confirmados
          </div>
        </button>

        {/* Processing */}
        <button
          onClick={() => { setStatus('processing'); setPagination(prev => ({ ...prev, page: 1 })); }}
          className={`p-4 rounded-xl border-2 transition-all ${status === 'processing'
            ? 'bg-purple-100 border-purple-400 shadow-md'
            : 'bg-white border-gray-200 hover:border-purple-300'
            }`}
        >
          <div className="text-2xl font-bold text-purple-600">{orderStats.processing}</div>
          <div className="text-xs text-gray-600 flex items-center gap-1">
            <ChefHat className="w-3 h-3" /> Preparación
          </div>
        </button>

        {/* Shipped */}
        <button
          onClick={() => { setStatus('shipped'); setPagination(prev => ({ ...prev, page: 1 })); }}
          className={`p-4 rounded-xl border-2 transition-all ${status === 'shipped'
            ? 'bg-blue-100 border-blue-400 shadow-md'
            : 'bg-white border-gray-200 hover:border-blue-300'
            }`}
        >
          <div className="text-2xl font-bold text-blue-500">{orderStats.shipped}</div>
          <div className="text-xs text-gray-600 flex items-center gap-1">
            <Truck className="w-3 h-3" /> En Camino
          </div>
        </button>

        {/* Delivered */}
        <button
          onClick={() => { setStatus('delivered'); setPagination(prev => ({ ...prev, page: 1 })); }}
          className={`p-4 rounded-xl border-2 transition-all ${status === 'delivered'
            ? 'bg-green-100 border-green-400 shadow-md'
            : 'bg-white border-gray-200 hover:border-green-300'
            }`}
        >
          <div className="text-2xl font-bold text-green-600">{orderStats.delivered}</div>
          <div className="text-xs text-gray-600 flex items-center gap-1">
            <CheckCircle className="w-3 h-3" /> Entregados
          </div>
        </button>

        {/* Cancelled */}
        <button
          onClick={() => { setStatus('cancelled'); setPagination(prev => ({ ...prev, page: 1 })); }}
          className={`p-4 rounded-xl border-2 transition-all ${status === 'cancelled'
            ? 'bg-red-100 border-red-400 shadow-md'
            : 'bg-white border-gray-200 hover:border-red-300'
            }`}
        >
          <div className="text-2xl font-bold text-red-600">{orderStats.cancelled}</div>
          <div className="text-xs text-gray-600 flex items-center gap-1">
            <XCircle className="w-3 h-3" /> Cancelados
          </div>
        </button>
      </div>

      {/* Active Orders Alert */}
      {(orderStats.pending + orderStats.confirmed + orderStats.processing + orderStats.shipped) > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-4">
          <div className="bg-amber-100 p-2 rounded-lg">
            <AlertTriangle className="w-6 h-6 text-amber-600" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-amber-800">
              {orderStats.pending + orderStats.confirmed + orderStats.processing + orderStats.shipped} pedidos activos requieren atención
            </p>
            <p className="text-sm text-amber-700">
              {orderStats.pending > 0 && `${orderStats.pending} pendientes • `}
              {orderStats.confirmed > 0 && `${orderStats.confirmed} confirmados • `}
              {orderStats.processing > 0 && `${orderStats.processing} en preparación • `}
              {orderStats.shipped > 0 && `${orderStats.shipped} en camino`}
            </p>
          </div>
        </div>
      )}

      {/* Recordatorio para marcar pedidos como entregados */}
      {(orderStats.pending + orderStats.confirmed + orderStats.processing + orderStats.shipped) >= 3 && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center gap-4">
          <div className="bg-blue-100 p-2 rounded-lg">
            <Package className="w-6 h-6 text-blue-600" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-blue-800">
              ¿Ya entregaste los pedidos?
            </p>
            <p className="text-sm text-blue-700">
              Recuerda marcar los pedidos como "Entregado" una vez que los hayas entregado. Esto ayuda a mantener el control de tu empresa.
            </p>
          </div>
          <button
            onClick={() => { setStatus('pending'); setPagination(prev => ({ ...prev, page: 1 })); }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-all"
          >
            Ver pedidos
          </button>
        </div>
      )}

      {/* Filtros */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 lg:p-6 space-y-4">
        {/* Filtros Rápidos de Fecha */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">Filtros Rápidos de Fecha</label>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => applyQuickFilter('today')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${quickFilter === 'today'
                ? 'bg-green-600 text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
            >
              Hoy
            </button>
            <button
              onClick={() => applyQuickFilter('sinceLastFriday')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${quickFilter === 'sinceLastFriday'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-blue-100 text-blue-700 hover:bg-blue-200 border border-blue-300'
                }`}
              title="Pedidos desde el viernes 10AM hasta ahora (para entregar el martes)"
            >
              🚚 Entrega Martes
            </button>
            <button
              onClick={() => applyQuickFilter('sinceLastTuesday')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${quickFilter === 'sinceLastTuesday'
                ? 'bg-purple-600 text-white shadow-md'
                : 'bg-purple-100 text-purple-700 hover:bg-purple-200 border border-purple-300'
                }`}
              title="Pedidos desde el martes 10AM hasta ahora (para entregar el viernes)"
            >
              🚚 Entrega Viernes
            </button>
            <button
              onClick={() => applyQuickFilter('thisWeek')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${quickFilter === 'thisWeek'
                ? 'bg-green-600 text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
            >
              Esta Semana
            </button>
            <button
              onClick={() => applyQuickFilter('lastWeek')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${quickFilter === 'lastWeek'
                ? 'bg-green-600 text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
            >
              Semana Pasada
            </button>
            <button
              onClick={() => applyQuickFilter('last7Days')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${quickFilter === 'last7Days'
                ? 'bg-green-600 text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
            >
              Últimos 7 Días
            </button>
            <button
              onClick={() => applyQuickFilter('last30Days')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${quickFilter === 'last30Days'
                ? 'bg-green-600 text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
            >
              Últimos 30 Días
            </button>
            <button
              onClick={() => applyQuickFilter('thisMonth')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${quickFilter === 'thisMonth'
                ? 'bg-green-600 text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
            >
              Este Mes
            </button>
            <button
              onClick={() => applyQuickFilter('lastMonth')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${quickFilter === 'lastMonth'
                ? 'bg-green-600 text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
            >
              Mes Pasado
            </button>
          </div>
        </div>

        {/* Filtros Tradicionales */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {/* Estado */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Estado</label>
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPagination(prev => ({ ...prev, page: 1 }));
              }}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
            >
              <option value="">Todos los estados</option>
              <option value="pending">Pendiente</option>
              <option value="confirmed">Confirmado</option>
              <option value="processing">En Preparación</option>
              <option value="shipped">En Camino</option>
              <option value="delivered">Entregado</option>
              <option value="cancelled">Cancelado</option>
            </select>
          </div>

          {/* Datos del Cliente */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Datos del Cliente</label>
            <select
              value={customerDataFilter}
              onChange={(e) => {
                setCustomerDataFilter(e.target.value);
                setPagination(prev => ({ ...prev, page: 1 }));
              }}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
            >
              <option value="">Todos los clientes</option>
              <option value="incomplete">Datos Incompletos</option>
              <option value="noName">Sin Nombre</option>
              <option value="noEmail">Sin Correo</option>
              <option value="noPhone">Sin Teléfono</option>
            </select>
          </div>

          {/* Estado de Pago */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Estado de Pago</label>
            <select
              value={paymentStatusFilter}
              onChange={(e) => {
                setPaymentStatusFilter(e.target.value);
                setPagination(prev => ({ ...prev, page: 1 }));
              }}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
            >
              <option value="">Todos los estados</option>
              <option value="pending">Pendiente</option>
              <option value="paid">Pagado</option>
              <option value="completed">Completado</option>
              <option value="failed">Fallido</option>
              <option value="refunded">Reembolsado</option>
            </select>
          </div>

          {/* Fecha Desde */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Desde (Personalizado)</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => {
                setDateFrom(e.target.value);
                setQuickFilter(''); // Limpiar filtro rápido cuando se usa fecha manual
                setPagination(prev => ({ ...prev, page: 1 }));
              }}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
            />
          </div>

          {/* Fecha Hasta */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Hasta (Personalizado)</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => {
                setDateTo(e.target.value);
                setQuickFilter(''); // Limpiar filtro rápido cuando se usa fecha manual
                setPagination(prev => ({ ...prev, page: 1 }));
              }}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
            />
          </div>

          {/* Limpiar filtros */}
          <div className="flex items-end">
            <button
              onClick={clearFilters}
              className="w-full px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <Filter className="w-5 h-5" />
              Limpiar
            </button>
          </div>
        </div>
      </div>

      {/* Lista de Pedidos */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
          </div>
        ) : (() => {
          // Aplicar filtro de datos de cliente si está activo
          const filteredOrders = customerDataFilter
            ? orders.filter(order => hasCustomerDataIssue(order, customerDataFilter))
            : orders;

          return filteredOrders.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
              <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No se encontraron pedidos</p>
            </div>
          ) : (
            <>
              {filteredOrders.map((order) => {
                const statusInfo = statusConfig[normalizeOrderStatus(order.status)] || statusConfig.pending;
                const StatusIcon = statusInfo.icon;

                // Función para extraer items de order_data si no hay order_items
                const extractItemsFromOrderData = (order: any) => {
                  // Primero intentar con order_items
                  if (order.order_items && order.order_items.length > 0) {
                    return order.order_items;
                  }

                  // Luego con items
                  if (order.items && order.items.length > 0) {
                    return order.items;
                  }

                  // Finalmente extraer desde order_data
                  if (order.order_data?.items) {
                    return order.order_data.items.map((item: any, index: number) => ({
                      id: `item-${index}`,
                      product_id: item.productId,
                      product_snapshot: {
                        name: item.productName,
                        price: item.price,
                        main_image_url: null,
                        unit: null
                      },
                      quantity: item.quantity,
                      unit_price: item.price,
                      subtotal: item.quantity * item.price
                    }));
                  }

                  return [];
                };

                const orderItems = extractItemsFromOrderData(order);
                const customerInfo = getCustomerInfo(order);

                const normalizedStatus = normalizeOrderStatus(order.status);
                const normalizedPaymentStatus = order.payment_status
                  ? normalizePaymentStatus(order.payment_status)
                  : null;
                const orderType = (order.order_type || 'registered') as AdminOrderType;
                const orderTypeInfo = orderTypeConfig[orderType] || orderTypeConfig.registered;
                const hasOperationalWarnings = (order.operational_flags?.length || 0) > 0;

                return (
                  <div
                    key={order.id}
                    id={`order-${order.id}`}
                    className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden transition-all"
                  >
                    <div className="p-4 lg:p-6">
                      {/* Header del pedido - Optimizado para móvil */}
                      <div className="flex items-start justify-between gap-4 mb-4">
                        <div className="flex items-start gap-3 min-w-0">
                          <div className={`p-2 rounded-lg ${statusInfo.bgColor} border flex-shrink-0`}>
                            <StatusIcon className={`w-5 h-5 ${statusInfo.color}`} />
                          </div>
                          <div className="min-w-0">
                            <h3 className="text-sm lg:text-lg font-bold text-gray-900 truncate">
                              {customerInfo.name}
                            </h3>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[10px] lg:text-xs font-mono text-gray-400 hidden lg:inline">
                                #{order.order_number || order.id.substring(0, 8)}
                              </span>
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] lg:text-xs font-medium ${statusConfig[normalizedStatus].bgColor} ${statusConfig[normalizedStatus].color} border`}>
                                {statusInfo.label}
                              </span>
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] lg:text-xs font-medium ${orderTypeInfo.bgColor} ${orderTypeInfo.textColor} border`}>
                                {getOrderTypeLabel(orderType)}
                              </span>
                              {normalizedPaymentStatus && paymentStatusConfig[normalizedPaymentStatus] && (
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] lg:text-xs font-medium ${paymentStatusConfig[normalizedPaymentStatus].bgColor} ${paymentStatusConfig[normalizedPaymentStatus].color} border`}>
                                  {paymentStatusConfig[normalizedPaymentStatus].icon && React.createElement(paymentStatusConfig[normalizedPaymentStatus].icon, { className: 'w-3 h-3 mr-1' })}
                                  {paymentStatusConfig[normalizedPaymentStatus].label}
                                </span>
                              )}
                              {hasOperationalWarnings && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] lg:text-xs font-medium bg-amber-100 text-amber-700 border border-amber-200">
                                  Revisar datos
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-lg lg:text-2xl font-bold text-green-600 leading-tight">
                            {formatCurrency(order.total || order.total_amount || 0)}
                          </p>
                          <p className="text-[10px] lg:text-sm text-gray-500 mt-1">
                            {formatDate(order.created_at)}
                          </p>
                        </div>
                      </div>

                      {/* Info del cliente - Vista compacta */}
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4 bg-gray-50/50 p-3 rounded-lg border border-gray-100">
                        <div className="flex items-start gap-2 col-span-2 md:col-span-1">
                          <User className="w-4 h-4 text-gray-400 mt-0.5" />
                          <div className="min-w-0">
                            <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Cliente</p>
                            <p className="font-medium text-gray-900 truncate">{customerInfo.name}</p>
                          </div>
                        </div>
                        {customerInfo.phone && (
                          <div className="flex items-start gap-2">
                            <Phone className="w-4 h-4 text-gray-400 mt-0.5" />
                            <div>
                              <p className="text-sm text-gray-500">Teléfono</p>
                              <a
                                href={`tel:${customerInfo.phone}`}
                                className="font-medium text-green-600 hover:text-green-700"
                              >
                                {customerInfo.phone}
                              </a>
                            </div>
                          </div>
                        )}
                        {order.delivery_date && (
                          <div className="flex items-start gap-2">
                            <Calendar className="w-4 h-4 text-gray-400 mt-0.5" />
                            <div>
                              <p className="text-sm text-gray-500">Fecha de Entrega</p>
                              <p className="font-medium text-gray-900">{formatDate(order.delivery_date)}</p>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Detalles expandibles */}
                      {expandedOrder === order.id && (
                        <div className="border-t border-gray-200 pt-4 mt-4 space-y-4">
                          {/* Dirección */}
                          <div className="flex items-start gap-2">
                            <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                            <div>
                              <p className="text-sm text-gray-500">Dirección de Entrega</p>
                              {(() => {
                                // Función auxiliar para formatear dirección (objeto o string)
                                const formatAddress = (addr: any): React.ReactElement => {
                                  if (!addr) return <p className="text-gray-500">No hay dirección registrada</p>;

                                  // Si es un string, intentar parsearlo como JSON
                                  if (typeof addr === 'string') {
                                    try {
                                      const parsed = JSON.parse(addr);
                                      return formatAddress(parsed); // Recursivamente formatear el objeto
                                    } catch {
                                      // Es un string simple, mostrarlo tal cual
                                      return <p className="text-gray-900">{addr}</p>;
                                    }
                                  }

                                  // Si es un objeto, extraer las propiedades
                                  if (typeof addr === 'object') {
                                    const streetAddress = addr.street_address || addr.address || addr.street || '';
                                    const city = addr.city || '';
                                    const state = addr.state || addr.department || '';
                                    const postalCode = addr.postal_code || '';
                                    const additionalInfo = addr.additional_info || '';

                                    // Si no hay datos útiles, mostrar mensaje vacío
                                    if (!streetAddress && !city) {
                                      return <p className="text-gray-500">No hay dirección registrada</p>;
                                    }

                                    return (
                                      <div className="text-gray-900">
                                        {streetAddress && <p>{streetAddress}</p>}
                                        {(city || state) && <p>{[city, state].filter(Boolean).join(', ')}</p>}
                                        {postalCode && <p>Código Postal: {postalCode}</p>}
                                        {additionalInfo && <p className="text-sm text-gray-600">Info: {additionalInfo}</p>}
                                      </div>
                                    );
                                  }

                                  return <p className="text-gray-500">No hay dirección registrada</p>;
                                };

                                // Intentar con shipping_address primero, luego delivery_address
                                if (order.shipping_address) {
                                  return formatAddress(order.shipping_address);
                                }
                                if (order.delivery_address) {
                                  return formatAddress(order.delivery_address);
                                }
                                return <p className="text-gray-500">No hay dirección registrada</p>;
                              })()}
                              {order.delivery_notes && (
                                <p className="text-sm text-gray-600 mt-1">
                                  <strong>Notas:</strong> {order.delivery_notes}
                                </p>
                              )}
                              {order.notes && (
                                <p className="text-sm text-gray-600 mt-1">
                                  <strong>Notas del pedido:</strong> {order.notes}
                                </p>
                              )}
                              {hasOperationalWarnings && (
                                <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                                  <strong>Alertas operativas:</strong> {order.operational_flags?.map((flag) => {
                                    switch (flag) {
                                      case 'missing_customer_name':
                                        return 'falta nombre';
                                      case 'missing_customer_phone':
                                        return 'falta telefono';
                                      case 'missing_delivery_address':
                                        return 'falta direccion';
                                      case 'missing_items':
                                        return 'faltan items';
                                      default:
                                        return flag;
                                    }
                                  }).join(', ')}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Productos */}
                          {orderItems.length > 0 && (
                            <div>
                              <p className="text-sm font-medium text-gray-700 mb-2">Productos del Pedido</p>
                              <div className="space-y-2">
                                {orderItems.map((item: any, index: number) => (
                                  <div
                                    key={index}
                                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                                  >
                                    <div>
                                      <p className="font-medium text-gray-900">
                                        {item.product_snapshot?.name ||
                                          item.products?.name ||
                                          item.product_name ||
                                          item.productName ||
                                          'Producto'}
                                      </p>
                                      {/* Mostrar variant - soportando diferentes nombres de campos */}
                                      {(item.variantName || item.variant_name || item.variant_value) && (
                                        <p className="text-sm text-gray-600">
                                          {item.variantName || item.variant_name || item.variant_value}
                                        </p>
                                      )}
                                    </div>
                                    <div className="text-right">
                                      <p className="font-semibold text-gray-900">
                                        {item.quantity} × {formatCurrency(item.unit_price || item.price || 0)}
                                      </p>
                                      <p className="text-sm text-gray-600">
                                        {formatCurrency(item.subtotal || ((item.price || 0) * item.quantity) || 0)}
                                      </p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Resumen Financiero Integrado */}
                          {orderItems.length > 0 && (() => {
                            const calculations = calculateOrderSummary(order, orderItems);
                            return (
                              <div className="mt-4 pt-4 border-t border-gray-200 space-y-2">
                                <p className="text-sm font-medium text-gray-700 mb-3">Resumen del Pedido</p>

                                {/* Subtotal de productos */}
                                <div className="flex justify-between items-center text-sm">
                                  <span className="text-gray-600">Subtotal productos:</span>
                                  <span className="font-medium text-gray-900">
                                    {formatCurrency(calculations.subtotal)}
                                  </span>
                                </div>

                                {/* Costo de envío */}
                                <div className="flex justify-between items-center text-sm">
                                  <span className="text-gray-600">Envío:</span>
                                  <span className={`font-medium ${calculations.shippingFee > 0 ? 'text-gray-900' : 'text-green-600'}`}>
                                    {calculations.shippingFee > 0 ? formatCurrency(calculations.shippingFee) : 'GRATIS'}
                                  </span>
                                </div>

                                {/* Descuentos (si aplica) */}
                                {calculations.discount > 0 && (
                                  <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-600">
                                      Descuento{calculations.couponCode ? ` (${calculations.couponCode})` : ''}:
                                    </span>
                                    <span className="font-medium text-red-600">
                                      -{formatCurrency(calculations.discount)}
                                    </span>
                                  </div>
                                )}

                                {/* Total final */}
                                <div className="flex justify-between items-center pt-2 border-t border-gray-300">
                                  <span className="text-base font-semibold text-gray-900">Total a pagar:</span>
                                  <span className="text-lg font-bold text-green-600">
                                    {formatCurrency(calculations.total)}
                                  </span>
                                </div>

                                {/* Indicadores especiales para el administrador */}
                                {calculations.isEstimated && (
                                  <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
                                    <strong>Nota:</strong> Valores calculados (pedido de invitado)
                                  </div>
                                )}

                                {calculations.hasDiscrepancy && (
                                  <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-800">
                                    <strong>Advertencia:</strong> Hay una diferencia de {formatCurrency(Math.abs(calculations.calculatedTotal - calculations.total))} entre el total calculado y el guardado
                                  </div>
                                )}

                                {calculations.hasFreeShipping && calculations.subtotal > 0 && (
                                  <div className="flex justify-between items-center text-xs text-green-600 mt-1">
                                    <span>Envío gratis aplicado</span>
                                    <span>✓</span>
                                  </div>
                                )}
                              </div>
                            );
                          })()}
                        </div>
                      )}

                      {/* Acciones */}
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mt-4 pt-4 border-t border-gray-200">
                        <button
                          onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                          className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors text-sm"
                        >
                          {expandedOrder === order.id ? 'Ocultar detalles' : 'Ver detalles'}
                        </button>

                        {/* Quick action buttons based on current status */}
                        {normalizedStatus === 'pending' && (
                          <button
                            onClick={() => handleUpdateStatus(order.id, 'confirmed')}
                            disabled={updatingOrder === order.id}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm disabled:opacity-50 flex items-center gap-2"
                          >
                            <CheckCircle className="w-4 h-4" />
                            Confirmar
                          </button>
                        )}
                        {normalizedStatus === 'confirmed' && (
                          <button
                            onClick={() => handleUpdateStatus(order.id, 'processing')}
                            disabled={updatingOrder === order.id}
                            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors text-sm disabled:opacity-50 flex items-center gap-2"
                          >
                            <ChefHat className="w-4 h-4" />
                            En Preparación
                          </button>
                        )}
                        {normalizedStatus === 'processing' && (
                          <button
                            onClick={() => handleUpdateStatus(order.id, 'shipped')}
                            disabled={updatingOrder === order.id}
                            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors text-sm disabled:opacity-50 flex items-center gap-2"
                          >
                            <Truck className="w-4 h-4" />
                            Enviar
                          </button>
                        )}
                        {(normalizedStatus === 'confirmed' || normalizedStatus === 'processing' || normalizedStatus === 'shipped') && (
                          <button
                            onClick={() => handleUpdateStatus(order.id, 'delivered')}
                            disabled={updatingOrder === order.id}
                            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm disabled:opacity-50 flex items-center gap-2"
                            title={normalizedStatus === 'shipped' ? 'Marcar como entregado' : 'Marcar como entregado (salta pasos)'}
                          >
                            <CheckCircle className="w-4 h-4" />
                            Marcar Entregado
                          </button>
                        )}

                        <div className="flex-1 sm:flex-none">
                          <select
                            value={order.status || 'pending'}
                            onChange={(e) => handleUpdateStatus(order.id, e.target.value)}
                            disabled={updatingOrder === order.id}
                            className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none disabled:opacity-50"
                          >
                            <option value="pending">Pendiente</option>
                            <option value="confirmed">Confirmado</option>
                            <option value="processing">En Preparación</option>
                            <option value="shipped">En Camino</option>
                            <option value="delivered">Entregado</option>
                            <option value="cancelled">Cancelado</option>
                          </select>
                        </div>

                        {updatingOrder === order.id && (
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-green-600"></div>
                        )}

                        {/* Copy buttons */}
                        <div className="flex gap-2">
                          {/* Copy Address button */}
                          {getAddressText(order) && (
                            <button
                              onClick={() => copyToClipboard(getAddressText(order), `addr-${order.id}`)}
                              className={`px-3 py-2 rounded-lg transition-colors text-sm flex items-center gap-1 ${copiedItems.has(`addr-${order.id}`)
                                ? 'bg-green-100 text-green-700'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                              title="Copiar dirección"
                            >
                              {copiedItems.has(`addr-${order.id}`) ? (
                                <>
                                  <Check className="w-4 h-4" />
                                  Copiado
                                </>
                              ) : (
                                <>
                                  <MapPin className="w-4 h-4" />
                                  Dirección
                                </>
                              )}
                            </button>
                          )}

                          {/* Copy Summary button */}
                          <button
                            onClick={() => copyToClipboard(getOrderSummaryText(order, customerInfo.name, orderItems), `sum-${order.id}`)}
                            className={`px-3 py-2 rounded-lg transition-colors text-sm flex items-center gap-1 ${copiedItems.has(`sum-${order.id}`)
                              ? 'bg-green-100 text-green-700'
                              : 'bg-blue-100 text-blue-600 hover:bg-blue-200'
                              }`}
                            title="Copiar resumen del pedido"
                          >
                            {copiedItems.has(`sum-${order.id}`) ? (
                              <>
                                <Check className="w-4 h-4" />
                                Copiado
                              </>
                            ) : (
                              <>
                                <ClipboardList className="w-4 h-4" />
                                Resumen
                              </>
                            )}
                          </button>
                        </div>

                        {/* WhatsApp buttons wrapper */}
                        {customerInfo.phone && (
                          <div className="flex gap-2">
                            {/* Basic WhatsApp button */}
                            <a
                              href={(() => {
                                const cleanPhone = customerInfo.phone.replace(/\D/g, '');
                                const fullPhone = cleanPhone.startsWith('57') ? cleanPhone : `57${cleanPhone}`;
                                return `https://wa.me/${fullPhone}?text=Hola ${customerInfo.name}, te escribimos de Tus Aguacates sobre tu pedido #${order.order_number || order.id.substring(0, 8)}`;
                              })()}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm text-center"
                            >
                              WhatsApp
                            </a>

                            {/* Order Summary WhatsApp button */}
                            <a
                              href={generateWhatsAppURL(
                                customerInfo.phone,
                                generateOrderSummary({
                                  ...order,
                                  order_type: order.user_id ? 'registered' : 'guest',
                                  customer_name: customerInfo.name,
                                  customer_phone: customerInfo.phone
                                })
                              )}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors text-sm text-center flex items-center gap-2"
                              title="Enviar resumen por WhatsApp"
                            >
                              <FileText className="w-4 h-4" />
                              WA Resumen
                            </a>

                            <a
                              href={(() => {
                                const cleanPhone = customerInfo.phone.replace(/\D/g, '');
                                const fullPhone = cleanPhone.startsWith('57') ? cleanPhone : `57${cleanPhone}`;
                                return `https://wa.me/${fullPhone}?text=${encodeURIComponent(`Hola ${customerInfo.name}, buenos días. Tu pedido está próximo a llegar. Ya está en la ruta de entrega para hoy y será entregado en el transcurso del día.`)}`;
                              })()}
                              className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm flex items-center gap-1"
                              target="_blank"
                              rel="noopener noreferrer"
                              title="Enviar mensaje de pedido en ruta"
                            >
                              🚚 En ruta
                            </a>

                            <a
                              href={(() => {
                                const cleanPhone = customerInfo.phone.replace(/\D/g, '');
                                const fullPhone = cleanPhone.startsWith('57') ? cleanPhone : `57${cleanPhone}`;
                                return `https://wa.me/${fullPhone}?text=${encodeURIComponent(`Hola ${customerInfo.name}, tu pedido está próximo a llegar. Llegará muy pronto.`)}`;
                              })()}
                              className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm flex items-center gap-1"
                              target="_blank"
                              rel="noopener noreferrer"
                              title="Enviar mensaje de llegada inminente"
                            >
                              📍 Llegando
                            </a>
                          </div>
                        )}

                        {/* Edit button - for all orders */}
                        <button
                          onClick={() => {
                            // Crear una copia del pedido con los items ya extraídos y formateados
                            const orderForEditing = {
                              ...order,
                              order_items: orderItems.map((item: any) => ({
                                id: item.id,
                                product_id: item.product_id,
                                variant_id: item.variant_id,
                                quantity: item.quantity,
                                unit_price: item.unit_price || item.price,
                                subtotal: item.subtotal || (item.quantity * (item.unit_price || item.price)),
                                product_snapshot: item.product_snapshot || {
                                  name: item.product_name,
                                  price: item.unit_price || item.price,
                                  variant_name: item.variant_name,
                                  variant_value: item.variant_name
                                },
                                product_name: item.product_name || item.product_snapshot?.name
                              }))
                            };
                            console.log('📝 [EDIT BUTTON] Preparando pedido para edición:', {
                              order_id: order.id,
                              order_number: order.order_number,
                              original_items_count: order.order_items?.length || 0,
                              extracted_items_count: orderItems.length,
                              orderForEditing
                            });
                            setEditingOrder(orderForEditing);
                          }}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm flex items-center gap-2"
                        >
                          <Edit className="w-4 h-4" />
                          Editar
                        </button>

                        {/* Delete button */}
                        <button
                          onClick={() => deleteOrder(order.id, order.id.substring(0, 8))}
                          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm flex items-center gap-2"
                        >
                          <Trash2 className="w-4 h-4" />
                          Eliminar
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Paginación */}
              {pagination.totalPages > 1 && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 lg:p-6">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-700">
                      Página {pagination.page} de {pagination.totalPages} | Total: {pagination.total} pedidos
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                        disabled={pagination.page === 1}
                        className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                        disabled={pagination.page === pagination.totalPages}
                        className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          );
        })()}
      </div>

      {/* Edit Order Modal */}
      {editingOrder && (
        <EditOrderModal
          order={editingOrder}
          isOpen={!!editingOrder}
          onClose={() => setEditingOrder(null)}
          onSave={handleSaveOrderEdit}
        />
      )}
    </div>
  );
}
