// Utility to generate professional order summaries for WhatsApp
// Supports both registered orders and guest orders
import { getWhatsAppSafeEmoji } from './productEmojis';
import type { AdminOrderType } from '@/lib/orders/operational';
import { formatAddressToString } from './addressFormatter';

// Usa getWhatsAppSafeEmoji desde productEmojis.ts

export interface OrderItem {
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
  // Peso y unidad para empaque
  weight?: number | null;
  unit?: string | null;
}

export interface Order {
  id: string;
  order_number?: string;
  user_id?: string | null;
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
  delivery_address?: string;
  order_data?: {
    items?: OrderItem[];
  };
  order_items?: OrderItem[];
  status: string;
  subtotal?: number;
  total?: number;
  total_amount?: number;
  shipping_address?: string | {
    street_address?: string;
    address?: string;
    city?: string;
    state?: string;
    department?: string;
    postal_code?: string;
    phone?: string;
  };
  delivery_notes?: string;
  order_type?: AdminOrderType;
  created_at: string;
  updated_at?: string;
}

export function generateOrderSummary(order: Order): string {
  // getProductEmoji se importa desde ./productEmojis.ts
  // Extract order items - TRY ALL SOURCES (fix 2026-05-07: summaries were empty)
  let items: OrderItem[] = [];

  // Priority 1: order_items (most common for registered users)
  if (order.order_items && order.order_items.length > 0) {
    items = order.order_items.map((item: OrderItem) => ({
      ...item,
      name: item.product_name || item.product_snapshot?.name || item.products?.name || 'Producto',
      variantName: item.variantName || (item as any).variant_value || (item as any).variant_name || ''
    }));
  }
  // Priority 2: order_data.items (guest orders)
  else if (order.order_data?.items && order.order_data.items.length > 0) {
    items = order.order_data.items.map((item: any) => ({
      id: item.id || '',
      product_id: item.product_id || '',
      quantity: item.quantity,
      unit_price: item.price || 0,
      subtotal: (item.price || 0) * (item.quantity || 0),
      product_name: item.productName || item.name || item.product_name || 'Producto',
      variantName: item.variantName || item.variant_value || item.variant_name || item.variantType || '',
      weight: item.weight || null,
      unit: item.unit || null
    }));
  }
  // Priority 3: items (fallback)
  else if ((order as any).items && (order as any).items.length > 0) {
    items = (order as any).items.map((item: any) => ({
      id: item.id || '',
      product_id: item.product_id || item.productId || '',
      quantity: item.quantity,
      unit_price: item.price || item.unit_price || 0,
      subtotal: item.subtotal || (item.price || 0) * (item.quantity || 0),
      product_name: item.productName || item.name || item.product_name || 'Producto',
      variantName: item.variantName || item.variant_value || item.variant_name || '',
      weight: item.weight || null,
      unit: item.unit || null
    }));
  }

  // DEBUG: Log if no items found (helps identify data issues)
  if (items.length === 0) {
    console.error('[generateOrderSummary] NO ITEMS FOUND for order:', {
      orderId: order.id,
      orderNumber: order.order_number,
      has_order_items: !!order.order_items,
      order_items_count: order.order_items?.length || 0,
      has_order_data: !!order.order_data,
      order_data_items_count: order.order_data?.items?.length || 0,
      has_items: !!(order as any).items,
      items_count: (order as any).items?.length || 0
    });
  }

  // Extract shipping cost from order_data if available (same logic as calculateOrderSummary)
  let shippingCost = 0;
  let discount = 0;
  
  if (order.order_type === 'guest' && order.order_data) {
    const orderData = order.order_data as any;
    shippingCost = orderData.shipping_cost || orderData.shippingFee || orderData.shipping || 0;
    discount = orderData.discount || orderData.discount_amount || 0;
  } else {
    shippingCost = (order as any).shipping_fee || (order as any).shipping_cost || 0;
    discount = (order as any).discount || (order as any).discount_amount || 0;
  }

  // Calculate totals
  const subtotal = order.subtotal || items.reduce((sum, item) => sum + (item.subtotal || 0), 0);
  const total = order.total || order.total_amount || (subtotal + shippingCost - discount);
  const hasDiscount = discount > 0;

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount);
  };

  // Generate order number
  const orderNumber = order.order_number || `INV-${order.id.slice(-8)}`;

  // Generate delivery date based on delivery days: TUESDAY (2) and FRIDAY (5) only
  // RULE: If order is placed on a delivery day BEFORE 10:00 AM Bogotá (UTC-5), deliver SAME DAY
  //       Otherwise, calculate next delivery day
  //
  // IMPORTANT: Convert from UTC (how Supabase stores timestamps) to Bogotá time explicitly
  // so the logic works correctly on Vercel (UTC runtime) AND client-side (any browser TZ).
  const toBogotaDate = (dateStr: string): Date => {
    const utcDate = new Date(dateStr);
    return new Date(utcDate.getTime() - 5 * 60 * 60 * 1000); // UTC-5
  };
  const getBogotaHours = (d: Date): number => d.getUTCHours();
  const getBogotaDay = (d: Date): number => d.getUTCDay();

  const getDeliveryDate = (): string => {
    // If order has explicit delivery_date, use it
    if ((order as any).delivery_date) {
      const deliveryDate = new Date((order as any).delivery_date);
      return deliveryDate.toLocaleDateString('es-ES', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    }

    // Delivery days: Tuesday (2) and Friday (5)
    const DELIVERY_DAYS = [2, 5]; // Tuesday = 2, Friday = 5
    const CUT_OFF_HOUR = 10; // 10:00 AM Bogotá - orders before this can be delivered same day

    // Get order date and time in Bogotá (UTC-5)
    const orderDate = toBogotaDate(order.created_at);
    const orderDayOfWeek = getBogotaDay(orderDate);
    const orderHour = getBogotaHours(orderDate);

    // Check if order was placed on a delivery day BEFORE cut-off time
    const isDeliveryDay = DELIVERY_DAYS.includes(orderDayOfWeek);
    const isBeforeCutOff = orderHour < CUT_OFF_HOUR;

    // If it's a delivery day and before 10 AM Bogotá, deliver TODAY (same day)
    if (isDeliveryDay && isBeforeCutOff) {
      return orderDate.toLocaleDateString('es-ES', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    }

    // Otherwise, find the NEXT delivery day
    const deliveryDate = new Date(orderDate);
    let currentDay = getBogotaDay(deliveryDate);

    // Advance to next day and keep going until we hit a delivery day
    let maxIterations = 7; // Safety limit
    do {
      deliveryDate.setDate(deliveryDate.getDate() + 1);
      currentDay = deliveryDate.getDay();
      maxIterations--;
    } while (!DELIVERY_DAYS.includes(currentDay) && maxIterations > 0);

    return deliveryDate.toLocaleDateString('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const formattedDeliveryDate = getDeliveryDate();

  // Customer name must come from the order/dashboard data. Never fall back to "Cliente".
  const getCustomerDisplayName = (fullName: string | undefined): string => {
    const cleanName = fullName?.trim();
    if (!cleanName) return '';
    const lower = cleanName.toLowerCase();
    if (lower === 'cliente' || lower === 'sin nombre registrado' || lower === 'sin nombre') return '';
    return cleanName;
  };

  // Get greeting based on current hour in Colombia (UTC-5)
  const getGreeting = (): string => {
    const now = new Date();
    const bogotaNow = new Date(now.getTime() - 5 * 60 * 60 * 1000);
    const colombiaHour = bogotaNow.getUTCHours();

    if (colombiaHour >= 5 && colombiaHour < 12) {
      return '¡Buenos días';
    } else if (colombiaHour >= 12 && colombiaHour < 18) {
      return '¡Buenas tardes';
    } else {
      return '¡Buenas noches';
    }
  };

  const customerDisplayName = getCustomerDisplayName(order.customer_name);
  const greeting = getGreeting();
  const greetingLine = customerDisplayName
    ? `${greeting}, ${customerDisplayName}!`
    : `${greeting}!`;

  // Build compact product list for customer WhatsApp message.
  // Keep emojis, but normalize newer ones that can render as question marks on some devices.
  const productList = items.map((item) => {
    const itemName = (item as any).name || item.product_name || item.product_snapshot?.name || item.products?.name || 'Producto';
    const variantName = item.variantName || (item as any).variant_value || '';
    const itemTotal = item.subtotal || (item.unit_price * item.quantity);
    const emoji = getWhatsAppSafeEmoji(itemName);
    const weight = item.weight || null;
    const unit = item.unit || null;

    // Build weight/unit suffix
    let weightSuffix = '';
    if (weight) {
      weightSuffix = ` | ${weight}${unit || 'g'}`;
    } else if (unit) {
      weightSuffix = ` | ${unit}`;
    }

    return variantName
      ? `${emoji} ${item.quantity}x ${itemName} (${variantName}) - ${formatCurrency(itemTotal)}${weightSuffix}`
      : `${emoji} ${item.quantity}x ${itemName} - ${formatCurrency(itemTotal)}${weightSuffix}`;
  }).join('\n');

  // Build compact financial summary.
  const financialLines = [];
  financialLines.push("🟢 *Total:* " + formatCurrency(total));
  if (shippingCost > 0) {
    financialLines.push("🚚 Domicilio: " + formatCurrency(shippingCost));
  }
  if (hasDiscount && discount > 0) {
    financialLines.push("🏷️ Descuento aplicado: -" + formatCurrency(discount));
  }
  const financialSummary = financialLines.join('\n');

  // Generate delivery address - extract complete address for guest orders
  // NOTA: delivery_address (actualizado desde dashboard) tiene prioridad sobre shipping_address
  const extractedAddress = order.delivery_address || formatAddressToString(order.shipping_address);
  let deliveryAddress = extractedAddress || 'N/A';

  // Compact customer-facing WhatsApp summary from dashboard.
  // Mensaje limpio con salto de línea real (\n) para que WhatsApp muestre bien el formato
  const message = greetingLine + "\n\n📋 *Resumen Pedido #" + orderNumber + "*\n\n" + productList + "\n\n" + financialSummary + "\n📅 *Entrega:* " + formattedDeliveryDate + "\n📍 *Dirección:* " + deliveryAddress + "\n\n¿Está todo correcto? ¡Gracias por tu compra! 🙌";

  return message;
}

// Function to generate WhatsApp URL with encoded message
export function generateWhatsAppURL(phoneNumber: string, message: string): string {
  // Clean phone number (remove non-digits and add country code if needed)
  const cleanPhone = phoneNumber.replace(/\D/g, '');
  const fullPhone = cleanPhone.startsWith('57') ? cleanPhone : `57${cleanPhone}`;

  // Encode message for WhatsApp URL
  const encodedMessage = encodeURIComponent(message);

  return `https://wa.me/${fullPhone}?text=${encodedMessage}`;
}
