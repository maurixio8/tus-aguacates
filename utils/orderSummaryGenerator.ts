// Utility to generate professional order summaries for WhatsApp
// Supports both registered orders and guest orders
import { getProductEmoji } from './productEmojis';
import type { AdminOrderType } from '@/lib/orders/operational';
import { formatAddressToString } from './addressFormatter';

const WHATSAPP_SAFE_EMOJIS: Record<string, string> = {
  '🫐': '🍇',
  '🫑': '🌶️',
  '🫛': '🌿',
  '🫘': '🌱',
  '🫚': '🌿',
  '🫒': '🥑',
  '🛍️': '🛒',
  '🟫': '🟤',
};

const getWhatsAppSafeEmoji = (productName: string): string => {
  const emoji = getProductEmoji(productName);
  return WHATSAPP_SAFE_EMOJIS[emoji] || emoji;
};

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
  // Extract order items based on order type
  let items: OrderItem[] = [];

  if (order.order_type === 'guest' && order.order_data?.items) {
    // Guest orders: extract from order_data.items
    items = order.order_data.items.map((item: any) => ({
      id: item.id || '',
      product_id: item.product_id || '',
      quantity: item.quantity,
      unit_price: item.price || 0,
      subtotal: (item.price || 0) * (item.quantity || 0),
      product_name: item.productName || item.name || 'Producto',
      variantName: item.variantValue || item.variant_name || item.variantType || ''
    }));
  } else if (order.order_items) {
    // Registered orders: extract from order_items
    items = order.order_items.map((item: OrderItem) => ({
      ...item,
      name: item.product_name || item.product_snapshot?.name || item.products?.name || 'Producto',
      variantName: item.variantName || (item as any).variant_value || (item as any).variant_name || ''
    }));
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
  // RULE: If order is placed on a delivery day BEFORE 10:00 AM, deliver SAME DAY
  //       Otherwise, calculate next delivery day
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
    const CUT_OFF_HOUR = 10; // 10:00 AM - orders before this can be delivered same day

    // Get order date and time
    const orderDate = new Date(order.created_at);
    const orderDayOfWeek = orderDate.getDay();
    const orderHour = orderDate.getHours();

    // Check if order was placed on a delivery day BEFORE cut-off time
    const isDeliveryDay = DELIVERY_DAYS.includes(orderDayOfWeek);
    const isBeforeCutOff = orderHour < CUT_OFF_HOUR;

    // If it's a delivery day and before 10 Am, deliver TODAY (same day)
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
    let currentDay = deliveryDate.getDay();

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
    if (!cleanName || cleanName.toLowerCase() === 'cliente') return '';
    return cleanName;
  };

  // Get greeting based on current hour (Colombia timezone UTC-5)
  const getGreeting = (): string => {
    const now = new Date();
    // Adjust for Colombia timezone (UTC-5)
    const colombiaHour = now.getHours(); // Assuming server is in Colombia time

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

    return variantName
      ? `${emoji} ${item.quantity}x ${itemName} (${variantName}) - ${formatCurrency(itemTotal)}`
      : `${emoji} ${item.quantity}x ${itemName} - ${formatCurrency(itemTotal)}`;
  }).join('\n');

  // Build compact financial summary.
  const financialLines = [`💚 *Total:* ${formatCurrency(total)}`];
  if (shippingCost > 0) {
    financialLines.push(`🚚 Domicilio: ${formatCurrency(shippingCost)}`);
  }
  if (hasDiscount && discount > 0) {
    financialLines.push(`🎁 Descuento aplicado: -${formatCurrency(discount)}`);
  }
  const financialSummary = financialLines.join('\n');

  // Generate delivery address - extract complete address for guest orders
  const extractedAddress = formatAddressToString(order.shipping_address) || order.delivery_address;
  let deliveryAddress = extractedAddress || 'N/A';

  // Compact customer-facing WhatsApp summary from dashboard.
  const message = `${greetingLine} 👋

🥑 Te compartimos tu pedido #${orderNumber}:

${productList}

${financialSummary}
📅 Entrega: ${formattedDeliveryDate}
📍 Dirección: ${deliveryAddress}

¿Está todo correcto? ✅`;

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
