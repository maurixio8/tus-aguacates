import { formatAddressToString } from '@/utils/addressFormatter';
import { getWhatsAppSafeEmoji } from '@/utils/productEmojis';

export type DashboardSummaryOrder = {
  delivery_address?: unknown;
  shipping_address?: unknown;
  total?: number;
  total_amount?: number;
};

function formatMoney(amount: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(Number(amount || 0));
}

function quantityLabel(itemName: string, quantity: number): string {
  const words: Record<number, string> = { 1: 'Una', 2: 'Dos', 3: 'Tres', 4: 'Cuatro', 5: 'Cinco', 6: 'Seis', 7: 'Siete', 8: 'Ocho', 9: 'Nueve', 10: 'Diez' };
  const count = Number.isFinite(quantity) ? Math.max(0, Math.trunc(quantity)) : 0;
  const countText = words[count] || String(count);
  if (/\bcaja(?:s)?\b/i.test(itemName)) return `${countText} ${count === 1 ? 'caja' : 'cajas'}`;
  if (count === 1) return '1';
  return `${count} unidades de`;
}

export function generateDashboardOrderSummary(
  order: DashboardSummaryOrder,
  customerName: string,
  orderItems: any[],
): string {
  const summaryLines: string[] = [];
  const address = typeof order.delivery_address === 'string'
    ? order.delivery_address
    : formatAddressToString(order.delivery_address || order.shipping_address);
  summaryLines.push(`DIRECCIÓN: ${address || 'Sin dirección'}`);
  summaryLines.push(`CLIENTE: ${customerName || 'Sin nombre'}`);
  summaryLines.push('');
  summaryLines.push('PRODUCTOS:');

  orderItems.forEach((item: any) => {
    const itemName = item.product_snapshot?.name || item.products?.name || item.product_name || item.productName || item.name || 'Producto';
    const quantity = Number(item.quantity || 1);
    const variant = String(item.variantName || item.variant_value || item.variant_name || item.product_snapshot?.variant_value || item.product_snapshot?.variant_name || '').trim();
    const weight = item.weight ?? item.product_snapshot?.weight;
    const unit = item.unit || item.product_snapshot?.unit || '';
    const weightText = weight === null || weight === undefined || weight === '' ? '' : `${weight}${unit || 'g'}`;
    const details = [variant && `Variante: ${variant}`, weightText && `Peso: ${weightText}`].filter(Boolean).join(' | ');
    const label = quantityLabel(itemName, quantity);
    const separator = label === '1' || label.endsWith(' de') ? ' ' : ': ';
    summaryLines.push(`${getWhatsAppSafeEmoji(itemName)} ${label}${separator}${itemName}${details ? ` | ${details}` : ''}`);
    summaryLines.push('');
  });

  const subtotal = Number(orderItems.reduce((sum, item) => sum + Number(item.subtotal ?? ((item.unit_price ?? item.price ?? 0) * (item.quantity || 0))), 0));
  const total = Number(order.total_amount ?? order.total ?? subtotal);
  summaryLines.push('');
  summaryLines.push(`TOTAL A PAGAR: ${formatMoney(total)}`);
  return summaryLines.join('\n');
}
