export interface ShippingQuote {
  cost: number;
  freeShipping: boolean;
  freeShippingMin: number;
  amountForFreeShipping: number;
  location: string;
  estimatedDays: number;
  message: string;
}

export function normalizeLocation(value: string): string {
  return String(value || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
}

export function calculateShippingQuote(subtotal: number, location = 'Bogotá'): ShippingQuote {
  if (!Number.isFinite(subtotal) || subtotal < 0) {
    throw new Error('Subtotal inválido');
  }
  const normalized = normalizeLocation(location);
  const isChia = normalized === 'chia';
  const shippingCost = isChia ? 13000 : 7400;
  const freeShippingMin = isChia ? 0 : 68900;
  const freeShipping = !isChia && subtotal >= freeShippingMin;
  const cost = freeShipping ? 0 : shippingCost;
  return {
    cost,
    freeShipping,
    freeShippingMin,
    amountForFreeShipping: isChia ? 0 : Math.max(0, freeShippingMin - subtotal),
    location,
    estimatedDays: freeShipping ? 2 : 1,
    message: freeShipping ? '¡Envío GRATIS en tu pedido!' : `Envío: $${shippingCost.toLocaleString('es-CO')}`,
  };
}
