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
  CalendarX2,
  X
} from 'lucide-react';
import { generateOrderSummary, generateWhatsAppURL } from '@/utils/orderSummaryGenerator';
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
  price?: number;
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
  order_type?: 'registered' | 'guest';
  order_data?: any;
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

  // Estados para eliminación masiva
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [bulkDeleteDate, setBulkDeleteDate] = useState('');
  const [bulkDeletePreview, setBulkDeletePreview] = useState<{
    ordersCount: number;
    guestOrdersCount: number;
    totalCount: number;
    message: string;
  } | null>(null);
  const [bulkDeleteLoading, setBulkDeleteLoading] = useState(false);
  const [bulkDeleteError, setBulkDeleteError] = useState('');

  // Funciones helper para calcular rangos de fechas
  const getDateRanges = () => {
    const today = new Date();
    const formatDate = (date: Date) => date.toISOString().split('T')[0];

    // Hoy
    const todayRange = {
      from: formatDate(today),
      to: formatDate(today)
    };

    // Esta semana (lunes a domingo)
    const currentDay = today.getDay();
    const mondayOffset = currentDay === 0 ? -6 : 1 - currentDay;
    const monday = new Date(today);
    monday.setDate(today.getDate() + mondayOffset);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);

    const thisWeekRange = {
      from: formatDate(monday),
      to: formatDate(sunday)
    };

    // Semana pasada
    const lastMonday = new Date(monday);
    lastMonday.setDate(monday.getDate() - 7);
    const lastSunday = new Date(lastMonday);
    lastSunday.setDate(lastMonday.getDate() + 6);

    const lastWeekRange = {
      from: formatDate(lastMonday),
      to: formatDate(lastSunday)
    };

    // Últimos 7 días
    const last7Days = new Date(today);
    last7Days.setDate(today.getDate() - 6);

    const last7DaysRange = {
      from: formatDate(last7Days),
      to: formatDate(today)
    };

    // Últimos 30 días
    const last30Days = new Date(today);
    last30Days.setDate(today.getDate() - 29);

    const last30DaysRange = {
      from: formatDate(last30Days),
      to: formatDate(today)
    };

    // Este mes
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    const thisMonthRange = {
      from: formatDate(firstDayOfMonth),
      to: formatDate(lastDayOfMonth)
    };

    // Mes pasado
    const firstDayOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const lastDayOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);

    const lastMonthRange = {
      from: formatDate(firstDayOfLastMonth),
      to: formatDate(lastDayOfLastMonth)
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

  // Aplicar filtro rápido
  const applyQuickFilter = (filterType: string) => {
    const ranges = getDateRanges();
    setQuickFilter(filterType);

    switch (filterType) {
      case 'today':
        setDateFrom(ranges.today.from);
        setDateTo(ranges.today.to);
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
  }, [status, dateFrom, dateTo, pagination.page]);

  useEffect(() => {
    loadOrderStats();
  }, []);

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
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('es-CO', {
      hour: '2-digit',
      minute: '2-digit',
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
      shippingFee = orderData.shipping_cost || orderData.shippingFee || 0;
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

  // Funciones para eliminación masiva
  const handleBulkDeletePreview = async () => {
    if (!bulkDeleteDate) {
      setBulkDeleteError('Por favor selecciona una fecha');
      return;
    }

    setBulkDeleteLoading(true);
    setBulkDeleteError('');
    setBulkDeletePreview(null);

    try {
      const response = await fetch(`/api/admin/orders/bulk-delete?beforeDate=${bulkDeleteDate}`, {
        credentials: 'include',
      });
      const data = await response.json();

      if (data.success) {
        setBulkDeletePreview(data.preview);
      } else {
        setBulkDeleteError(data.error || 'Error al obtener vista previa');
      }
    } catch (error) {
      console.error('Error obteniendo preview:', error);
      setBulkDeleteError('Error de conexión');
    } finally {
      setBulkDeleteLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    if (!bulkDeleteDate || !bulkDeletePreview) return;

    const confirmMessage = `¿Estás SEGURO de que deseas eliminar ${bulkDeletePreview.totalCount} pedidos?\n\n` +
      `- ${bulkDeletePreview.ordersCount} pedidos de usuarios registrados\n` +
      `- ${bulkDeletePreview.guestOrdersCount} pedidos de invitados\n\n` +
      `Esta acción NO se puede deshacer.`;

    if (!confirm(confirmMessage)) return;

    // Segunda confirmación
    const finalConfirm = prompt(
      `Para confirmar, escribe "ELIMINAR" (en mayúsculas):`
    );

    if (finalConfirm !== 'ELIMINAR') {
      alert('Eliminación cancelada. No escribiste "ELIMINAR" correctamente.');
      return;
    }

    setBulkDeleteLoading(true);
    setBulkDeleteError('');

    try {
      const response = await fetch('/api/admin/orders/bulk-delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          beforeDate: bulkDeleteDate,
          confirmDelete: true
        }),
      });

      const data = await response.json();

      if (data.success) {
        alert(`${data.message}`);
        setShowBulkDeleteModal(false);
        setBulkDeleteDate('');
        setBulkDeletePreview(null);
        loadOrders();
        loadOrderStats();
      } else {
        setBulkDeleteError(data.error || 'Error al eliminar pedidos');
      }
    } catch (error) {
      console.error('Error eliminando pedidos:', error);
      setBulkDeleteError('Error de conexión');
    } finally {
      setBulkDeleteLoading(false);
    }
  };

  const closeBulkDeleteModal = () => {
    setShowBulkDeleteModal(false);
    setBulkDeleteDate('');
    setBulkDeletePreview(null);
    setBulkDeleteError('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Gestión de Pedidos</h1>
          <p className="text-gray-600 mt-1">Administra y da seguimiento a todos los pedidos</p>
        </div>
        <button
          onClick={() => setShowBulkDeleteModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm font-medium shadow-sm"
        >
          <CalendarX2 className="w-5 h-5" />
          Eliminar Pedidos Antiguos
        </button>
      </div>

      {/* Quick Stats Panel */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        {/* Total */}
        <button
          onClick={() => { setStatus(''); setPagination(prev => ({ ...prev, page: 1 })); }}
          className={`p-4 rounded-xl border-2 transition-all ${
            status === ''
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
          className={`p-4 rounded-xl border-2 transition-all ${
            status === 'pending'
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
          className={`p-4 rounded-xl border-2 transition-all ${
            status === 'confirmed'
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
          className={`p-4 rounded-xl border-2 transition-all ${
            status === 'processing'
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
          className={`p-4 rounded-xl border-2 transition-all ${
            status === 'shipped'
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
          className={`p-4 rounded-xl border-2 transition-all ${
            status === 'delivered'
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
          className={`p-4 rounded-xl border-2 transition-all ${
            status === 'cancelled'
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

      {/* Filtros */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 lg:p-6 space-y-4">
        {/* Filtros Rápidos de Fecha */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">Filtros Rápidos de Fecha</label>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => applyQuickFilter('today')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                quickFilter === 'today'
                  ? 'bg-green-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Hoy
            </button>
            <button
              onClick={() => applyQuickFilter('thisWeek')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                quickFilter === 'thisWeek'
                  ? 'bg-green-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Esta Semana
            </button>
            <button
              onClick={() => applyQuickFilter('lastWeek')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                quickFilter === 'lastWeek'
                  ? 'bg-green-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Semana Pasada
            </button>
            <button
              onClick={() => applyQuickFilter('last7Days')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                quickFilter === 'last7Days'
                  ? 'bg-green-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Últimos 7 Días
            </button>
            <button
              onClick={() => applyQuickFilter('last30Days')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                quickFilter === 'last30Days'
                  ? 'bg-green-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Últimos 30 Días
            </button>
            <button
              onClick={() => applyQuickFilter('thisMonth')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                quickFilter === 'thisMonth'
                  ? 'bg-green-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Este Mes
            </button>
            <button
              onClick={() => applyQuickFilter('lastMonth')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                quickFilter === 'lastMonth'
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
              const statusInfo = statusConfig[order.status] || statusConfig.pending;
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

              // Debug log
              console.log(`📦 [DEBUG] Pedido ${order.order_number}:`, {
                id: order.id,
                orderItemsCount: orderItems.length,
                orderItems: orderItems.map((item: any) => ({
                  id: item.id,
                  product_id: item.product_id,
                  quantity: item.quantity,
                  has_snapshot: !!item.product_snapshot,
                  snapshot_name: item.product_snapshot?.name,
                  has_products: !!item.products,
                  products_name: item.products?.name,
                  unit_price: item.unit_price,
                  price: item.price
                }))
              });

              return (
                <div
                  key={order.id}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
                >
                  <div className="p-4 lg:p-6">
                    {/* Header del pedido */}
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-4">
                      <div className="flex items-start gap-4">
                        <div className={`p-2 rounded-lg ${statusInfo.bgColor} border`}>
                          <StatusIcon className={`w-5 h-5 ${statusInfo.color}`} />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-gray-900">
                            Pedido #{order.order_number || order.id.substring(0, 8)}
                          </h3>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusInfo.bgColor} ${statusInfo.color} border`}>
                            {statusInfo.label}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-green-600">
                          {formatCurrency(order.total || order.total_amount || 0)}
                        </p>
                        <p className="text-sm text-gray-500">
                          {formatDate(order.created_at)} - {formatTime(order.created_at)}
                        </p>
                      </div>
                    </div>

                    {/* Info del cliente */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div className="flex items-start gap-2">
                        <User className="w-4 h-4 text-gray-400 mt-0.5" />
                        <div>
                          <p className="text-sm text-gray-500">Cliente</p>
                          <p className="font-medium text-gray-900">{customerInfo.name}</p>
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
                                    {item.variantName && (
                                      <p className="text-sm text-gray-600">{item.variantName}</p>
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
                      {order.status === 'pending' && (
                        <button
                          onClick={() => handleUpdateStatus(order.id, 'confirmed')}
                          disabled={updatingOrder === order.id}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm disabled:opacity-50 flex items-center gap-2"
                        >
                          <CheckCircle className="w-4 h-4" />
                          Confirmar
                        </button>
                      )}
                      {order.status === 'confirmed' && (
                        <button
                          onClick={() => handleUpdateStatus(order.id, 'processing')}
                          disabled={updatingOrder === order.id}
                          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors text-sm disabled:opacity-50 flex items-center gap-2"
                        >
                          <ChefHat className="w-4 h-4" />
                          En Preparación
                        </button>
                      )}
                      {order.status === 'processing' && (
                        <button
                          onClick={() => handleUpdateStatus(order.id, 'shipped')}
                          disabled={updatingOrder === order.id}
                          className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors text-sm disabled:opacity-50 flex items-center gap-2"
                        >
                          <Truck className="w-4 h-4" />
                          Enviar
                        </button>
                      )}
                      {(order.status === 'confirmed' || order.status === 'processing' || order.status === 'shipped') && (
                        <button
                          onClick={() => handleUpdateStatus(order.id, 'delivered')}
                          disabled={updatingOrder === order.id}
                          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm disabled:opacity-50 flex items-center gap-2"
                          title={order.status === 'shipped' ? 'Marcar como entregado' : 'Marcar como entregado (salta pasos)'}
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

                      {/* WhatsApp buttons wrapper */}
                      {customerInfo.phone && (
                        <div className="flex gap-2">
                          {/* Basic WhatsApp button */}
                          <a
                            href={`https://wa.me/57${customerInfo.phone.replace(/\D/g, '')}?text=Hola ${customerInfo.name}, te escribimos de Tus Aguacates sobre tu pedido #${order.order_number || order.id.substring(0, 8)}`}
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
                            title="Enviar resumen completo del pedido"
                          >
                            <FileText className="w-4 h-4" />
                            Resumen
                          </a>
                        </div>
                      )}

                      {/* Edit button - for all orders */}
                      <button
                        onClick={() => setEditingOrder(order)}
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

      {/* Modal de Eliminación Masiva */}
      {showBulkDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            {/* Header del Modal */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 rounded-lg">
                  <CalendarX2 className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Eliminar Pedidos Antiguos</h2>
                  <p className="text-sm text-gray-500">Elimina pedidos hasta una fecha específica</p>
                </div>
              </div>
              <button
                onClick={closeBulkDeleteModal}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Contenido del Modal */}
            <div className="p-6 space-y-6">
              {/* Advertencia */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <div className="flex gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-amber-800">Acción Irreversible</p>
                    <p className="text-sm text-amber-700 mt-1">
                      Esta acción eliminará permanentemente todos los pedidos creados hasta la fecha seleccionada.
                      Los datos de los clientes NO serán eliminados.
                    </p>
                  </div>
                </div>
              </div>

              {/* Selector de Fecha */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Eliminar pedidos hasta (incluyendo esta fecha):
                </label>
                <input
                  type="date"
                  value={bulkDeleteDate}
                  onChange={(e) => {
                    setBulkDeleteDate(e.target.value);
                    setBulkDeletePreview(null);
                    setBulkDeleteError('');
                  }}
                  max={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none text-lg"
                />
              </div>

              {/* Botón de Vista Previa */}
              <button
                onClick={handleBulkDeletePreview}
                disabled={!bulkDeleteDate || bulkDeleteLoading}
                className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {bulkDeleteLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-600"></div>
                    Calculando...
                  </>
                ) : (
                  <>
                    <Package className="w-5 h-5" />
                    Ver cuántos pedidos se eliminarán
                  </>
                )}
              </button>

              {/* Error */}
              {bulkDeleteError && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">
                  {bulkDeleteError}
                </div>
              )}

              {/* Vista Previa */}
              {bulkDeletePreview && (
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-3">
                  <p className="font-semibold text-gray-900">Resumen de eliminación:</p>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Pedidos de usuarios registrados:</span>
                      <span className="font-bold text-gray-900">{bulkDeletePreview.ordersCount}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Pedidos de invitados:</span>
                      <span className="font-bold text-gray-900">{bulkDeletePreview.guestOrdersCount}</span>
                    </div>
                    <div className="border-t border-gray-300 pt-2 flex justify-between items-center">
                      <span className="font-semibold text-gray-900">Total a eliminar:</span>
                      <span className="font-bold text-red-600 text-xl">{bulkDeletePreview.totalCount}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Botón de Eliminar */}
              {bulkDeletePreview && bulkDeletePreview.totalCount > 0 && (
                <button
                  onClick={handleBulkDelete}
                  disabled={bulkDeleteLoading}
                  className="w-full py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {bulkDeleteLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Eliminando...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-5 h-5" />
                      Eliminar {bulkDeletePreview.totalCount} pedidos
                    </>
                  )}
                </button>
              )}

              {/* Mensaje si no hay pedidos */}
              {bulkDeletePreview && bulkDeletePreview.totalCount === 0 && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-green-700 text-center">
                  <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-500" />
                  <p className="font-medium">No hay pedidos para eliminar</p>
                  <p className="text-sm mt-1">No existen pedidos creados hasta la fecha seleccionada.</p>
                </div>
              )}
            </div>

            {/* Footer del Modal */}
            <div className="p-6 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
              <button
                onClick={closeBulkDeleteModal}
                className="w-full py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl transition-colors font-medium"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
