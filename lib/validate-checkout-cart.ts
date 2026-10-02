export interface CheckoutValidationItem {
  product: { id: string };
  variant?: { id: string } | null;
  price: number;
  quantity: number;
}

export interface CheckoutQuote {
  subtotal: number;
  shipping: number;
  total: number;
  free_shipping: boolean;
  amount_for_free_shipping: number;
  items: Array<Record<string, unknown>>;
}

export interface CheckoutValidationResult {
  valid: boolean;
  error?: string;
  invalidItems?: Array<{ name: string; reason: string; currentPrice?: number }>;
  quote?: CheckoutQuote;
}

export async function validateCheckoutCart(items: CheckoutValidationItem[], location = 'Bogotá', paymentMethod?: string): Promise<CheckoutValidationResult> {
  const response = await fetch('/api/checkout/validate-cart', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    cache: 'no-store',
    body: JSON.stringify({
      items: items.map(item => ({
        productId: item.product.id,
        variantId: item.variant?.id || null,
        price: item.price,
        quantity: item.quantity,
      })),
    }),
  });

  const data = await response.json().catch(() => ({
    valid: false,
    error: 'No pudimos verificar el carrito. Intenta de nuevo.',
  }));

  if (!response.ok) {
    return {
      valid: false,
      error: data.error || 'Tu carrito está desactualizado.',
      invalidItems: data.invalidItems || [],
    };
  }

  if (!data.valid) return data;

  const quoteResponse = await fetch('/api/checkout/quote', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    cache: 'no-store',
    body: JSON.stringify({
      items: items.map(item => ({
        productId: item.product.id,
        variantId: item.variant?.id || null,
        quantity: item.quantity,
      })),
      location,
      payment_method: paymentMethod || null,
    }),
  });
  const quoteData = await quoteResponse.json().catch(() => null);
  if (!quoteResponse.ok || !quoteData?.valid) {
    return {
      valid: false,
      error: quoteData?.error || 'No pudimos confirmar el precio y el domicilio del pedido.',
      invalidItems: quoteData?.invalidItems || [],
    };
  }

  return { ...data, quote: quoteData };
}

export function formatCartValidationError(result: CheckoutValidationResult): string {
  if (!result.invalidItems?.length) return result.error || 'No pudimos validar el carrito.';
  const details = result.invalidItems
    .map(item => `${item.name}: ${item.reason}${item.currentPrice !== undefined ? ` (ahora $${item.currentPrice.toLocaleString('es-CO')})` : ''}`)
    .join(' · ');
  return `${result.error || 'Tu carrito está desactualizado.'} ${details}`;
}
