export type AdminOrderType = 'registered' | 'guest' | 'admin_manual';
export type CanonicalOrderStatus =
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled';
export type CanonicalPaymentStatus =
  | 'pending'
  | 'paid'
  | 'failed'
  | 'refunded';

const ORDER_STATUS_MAP: Record<string, CanonicalOrderStatus> = {
  pending: 'pending',
  pendiente: 'pending',
  confirmed: 'confirmed',
  confirmada: 'confirmed',
  confirmado: 'confirmed',
  processing: 'processing',
  procesando: 'processing',
  en_preparacion: 'processing',
  en_preparación: 'processing',
  shipped: 'shipped',
  listo_entrega: 'shipped',
  en_camino: 'shipped',
  delivered: 'delivered',
  entregado: 'delivered',
  completado: 'delivered',
  complete: 'delivered',
  completed: 'delivered',
  cancelled: 'cancelled',
  canceled: 'cancelled',
  cancelado: 'cancelled',
};

const PAYMENT_STATUS_MAP: Record<string, CanonicalPaymentStatus> = {
  pending: 'pending',
  pendiente: 'pending',
  paid: 'paid',
  payment_approved: 'paid',
  approved: 'paid',
  pagado: 'paid',
  completed: 'paid',
  completado: 'paid',
  failed: 'failed',
  rejected: 'failed',
  rechazado: 'failed',
  cancelled: 'failed',
  canceled: 'failed',
  cancelado: 'failed',
  refunded: 'refunded',
  reembolsado: 'refunded',
};

export function normalizeOrderStatus(status?: string | null): CanonicalOrderStatus {
  if (!status) return 'pending';
  return ORDER_STATUS_MAP[status.toLowerCase().trim()] || 'pending';
}

export function normalizePaymentStatus(status?: string | null): CanonicalPaymentStatus {
  if (!status) return 'pending';
  return PAYMENT_STATUS_MAP[status.toLowerCase().trim()] || 'pending';
}

export function getOrderTypeLabel(orderType?: string | null): string {
  switch (orderType) {
    case 'registered':
      return 'Cliente registrado';
    case 'guest':
      return 'Cliente invitado';
    case 'admin_manual':
      return 'Creado en dashboard';
    default:
      return 'Origen no definido';
  }
}

export function buildOperationalFlags(order: {
  customer_name?: string | null;
  customer_phone?: string | null;
  delivery_address?: string | null;
  order_items?: Array<unknown> | null;
}): string[] {
  const flags: string[] = [];

  if (!order.customer_name?.trim()) {
    flags.push('missing_customer_name');
  }

  if (!order.customer_phone?.trim()) {
    flags.push('missing_customer_phone');
  }

  if (!order.delivery_address?.trim()) {
    flags.push('missing_delivery_address');
  }

  if (!order.order_items || order.order_items.length === 0) {
    flags.push('missing_items');
  }

  return flags;
}
