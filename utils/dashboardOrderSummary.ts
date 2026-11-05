import { formatAddressToString } from '@/utils/addressFormatter';
import { getWhatsAppSafeEmoji } from '@/utils/productEmojis';

export type DashboardSummaryOrder = {
  delivery_address?: unknown;
  shipping_address?: unknown;
  delivery_date?: string;
  city?: string;
  total?: number;
  total_amount?: number;
};

function formatMoney(amount: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(Number(amount || 0)).replace(/\u00a0/g, '');
}

function quantityLabel(itemName: string, quantity: number): string {
  const words: Record<number, string> = { 1: 'Una', 2: 'Dos', 3: 'Tres', 4: 'Cuatro', 5: 'Cinco', 6: 'Seis', 7: 'Siete', 8: 'Ocho', 9: 'Nueve', 10: 'Diez' };
  const count = Number.isFinite(quantity) ? Math.max(0, Math.trunc(quantity)) : 0;
  const countText = words[count] || String(count);
  if (/\bcaja(?:s)?\b/i.test(itemName)) return `${countText} ${count === 1 ? 'caja' : 'cajas'}`;
  if (count === 1) return '1';
  return `${count} unidades de`;
}

function formatDeliveryDate(deliveryDate?: string): string {
  const date = deliveryDate ? new Date(deliveryDate) : new Date(Date.now() + 24 * 60 * 60 * 1000);
  if (Number.isNaN(date.getTime())) return 'mañana';

  const parts = new Intl.DateTimeFormat('es-CO', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'America/Bogota',
  }).formatToParts(date);
  const getPart = (type: Intl.DateTimeFormatPartTypes): string => parts.find((part) => part.type === type)?.value || '';
  const formatted = `${getPart('weekday')} ${getPart('day')} de ${getPart('month')} de ${getPart('year')}`;

  return `mañana, ${formatted}`;
}

function getCity(order: DashboardSummaryOrder): string {
  if (order.city) return order.city;
  if (order.shipping_address && typeof order.shipping_address === 'object' && !Array.isArray(order.shipping_address)) {
    const address = order.shipping_address as { city?: string };
    return address.city || '';
  }
  return '';
}

export function generateDashboardOrderSummary(
  order: DashboardSummaryOrder,
  customerName: string,
  orderItems: any[],
): string {
  const address = typeof order.delivery_address === 'string'
    ? order.delivery_address
    : formatAddressToString(order.delivery_address || order.shipping_address);
  const city = getCity(order);
  const total = Number(order.total_amount ?? order.total ?? orderItems.reduce(
    (sum, item) => sum + Number(item.subtotal ?? ((item.unit_price ?? item.price ?? 0) * (item.quantity || 0))),
    0,
  ));
  const lines: string[] = [
    `Hola, ${customerName || 'cliente'} 😊`,
    '',
    `Te escribimos para confirmar tu pedido, programado para entrega ${formatDeliveryDate(order.delivery_date)}.`,
    '',
    'Productos:',
    '',
  ];

  orderItems.forEach((item: any) => {
    const itemName = item.product_snapshot?.name || item.products?.name || item.product_name || item.productName || item.name || 'Producto';
    const quantity = Number(item.quantity || 1);
    const variant = String(item.variantName || item.variant_value || item.variant_name || item.product_snapshot?.variant_value || item.product_snapshot?.variant_name || '').trim();
    const weight = item.weight ?? item.product_snapshot?.weight;
    const unit = item.unit || item.product_snapshot?.unit || '';
    const weightText = weight === null || weight === undefined || weight === '' ? '' : `${weight}${unit || 'g'}`;
    const details = [variant && `Presentación: ${variant}`, weightText && `Peso: ${weightText}`].filter(Boolean).join(' | ');
    const label = quantityLabel(itemName, quantity);
    const separator = label === '1' || label.endsWith(' de') ? ' ' : ': ';
    lines.push(`${getWhatsAppSafeEmoji(itemName)} ${label}${separator}${itemName}${details ? ` | ${details}` : ''}`);
    lines.push('');
  });

  lines.push(`Total a pagar: ${formatMoney(total)}`);
  lines.push('');
  lines.push('Dirección de entrega:');
  lines.push(address || 'Sin dirección');
  if (city) lines.push(city);
  lines.push('');
  lines.push('Por favor respóndenos confirmando si todo está correcto. Si necesitas hacer algún cambio o tienes alguna novedad, cuéntanos por este medio antes de la entrega.');

  return lines.join('\n');
}
