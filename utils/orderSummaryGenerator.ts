// Utility to generate professional order summaries for WhatsApp
// Supports both registered orders and guest orders

export interface OrderItem {
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
  price?: number;
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
  order_type?: 'registered' | 'guest';
  created_at: string;
  updated_at?: string;
}

export function generateOrderSummary(order: Order): string {
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
      product_name: item.productName || item.name || 'Producto'
    }));
  } else if (order.order_items) {
    // Registered orders: extract from order_items
    items = order.order_items.map((item: OrderItem) => ({
      ...item,
      name: item.product_name || item.product_snapshot?.name || item.products?.name || 'Producto'
    }));
  }

  // Calculate totals
  const subtotal = order.subtotal || items.reduce((sum, item) => sum + (item.subtotal || 0), 0);
  const total = order.total || order.total_amount || 0;
  const shippingCost = total - subtotal;

  // Check if there's a discount (when shipping is negative or less than expected)
  const expectedShipping = 7400; // Costo de envío estándar
  const hasDiscount = shippingCost < expectedShipping || shippingCost < 0;
  const discountAmount = hasDiscount ? Math.abs(shippingCost - expectedShipping) : 0;

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

  // Generate delivery date (2-3 business days from now)
  const deliveryDate = new Date();
  deliveryDate.setDate(deliveryDate.getDate() + 3);
  const formattedDeliveryDate = deliveryDate.toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  // Get first name only from customer name
  const getFirstName = (fullName: string | undefined): string => {
    if (!fullName) return 'Cliente';
    const firstName = fullName.trim().split(' ')[0];
    // Capitalize first letter
    return firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase();
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

  const firstName = getFirstName(order.customer_name);
  const greeting = getGreeting();

  // Helper function to format variant name
  const formatVariantName = (item: OrderItem): string => {
    const snapshot = item.product_snapshot || {};
    const variantName = snapshot.variant_name || item.variantName;
    const variantValue = snapshot.variant_value;

    // Si tenemos ambos campos separados, combinarlos
    if (variantName && variantValue) {
      return `${variantName}: ${variantValue}`;
    }
    // Si solo tenemos variant_value (el valor específico)
    if (variantValue) {
      return variantValue;
    }
    // Si solo tenemos variant_name
    if (variantName) {
      return variantName;
    }
    return '';
  };

  // Build product list
  const productList = items.map((item, index) => {
    const itemName = (item as any).name || item.product_name || item.product_snapshot?.name || item.products?.name || 'Producto';
    const variantName = formatVariantName(item);
    const itemTotal = item.subtotal || (item.unit_price * item.quantity);

    // Format: "• 2x Zanahoria (1 kg) - $10,000" or "• 1x Cebolla - $3,000"
    const productDisplay = variantName
      ? `• ${item.quantity}x ${itemName} (${variantName}) - ${formatCurrency(itemTotal)}`
      : `• ${item.quantity}x ${itemName} - ${formatCurrency(itemTotal)}`;

    return productDisplay;
  }).join('\n');

  // Build financial summary based on whether there's a discount
  let financialSummary = '';

  if (hasDiscount && discountAmount > 0) {
    financialSummary = `💰 *Resumen:*
• Subtotal: ${formatCurrency(subtotal)}
• Envío: ${formatCurrency(expectedShipping)}
• Descuento: -${formatCurrency(discountAmount)}
💚 *Total:* ${formatCurrency(total)}`;
  } else {
    const shippingText = shippingCost === 0 ? 'GRATIS 🎉' : formatCurrency(shippingCost);
    financialSummary = `💰 *Resumen:*
• Subtotal: ${formatCurrency(subtotal)}
• Envío: ${shippingText}
💚 *Total:* ${formatCurrency(total)}`;
  }

  // Generate delivery address
  let deliveryAddress = order.delivery_address || 'N/A';

  if (!order.delivery_address && order.shipping_address) {
    if (typeof order.shipping_address === 'string') {
      // Try to parse JSON string
      try {
        const parsed = JSON.parse(order.shipping_address);
        deliveryAddress = parsed.address || parsed.street_address || order.shipping_address;
      } catch {
        deliveryAddress = order.shipping_address;
      }
    } else {
      // It's already an object
      deliveryAddress = order.shipping_address.address ||
        order.shipping_address.street_address ||
        'N/A';
    }
  }

  // Build complete message with emojis and proper structure
  const message = `Hola ${firstName}! 👋
Hemos recibido tu pedido exitosamente y aquí está el resumen:

📋 *PEDIDO #${orderNumber}*

👤 *DATOS DEL CLIENTE*
Nombre: ${order.customer_name || 'Cliente'}
📍 Dirección: ${deliveryAddress}${order.customer_phone ? `\n📱 Teléfono: ${order.customer_phone}` : ''}

🛒 *PRODUCTOS*
━━━━━━━━━━━━━━━━━━━━━

${items.map((item, index) => {
    const itemName = (item as any).name || item.product_name || item.product_snapshot?.name || item.products?.name || 'Producto';
    const variantName = formatVariantName(item);
    const variantInfo = variantName ? ` - ${variantName}` : '';

    return `${index + 1}. ${itemName}${variantInfo}
   • Cantidad: ${item.quantity}
   • Precio: ${formatCurrency(item.unit_price)}`;
  }).join('\n\n')}

━━━━━━━━━━━━━━━━━━━━━

💰 *RESUMEN*
Subtotal: ${formatCurrency(subtotal)}
Envío: ${shippingCost === 0 ? 'GRATIS 🎉' : formatCurrency(shippingCost)}

✨ *TOTAL: ${formatCurrency(total)}*

━━━━━━━━━━━━━━━━━━━━━
${firstName}, por favor confírmame si toda la información de tu pedido está correcta. 📝

Muchas gracias por tu compra! 💚
En breve nos pondremos en contacto contigo para coordinar la entrega. 🚚`;

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