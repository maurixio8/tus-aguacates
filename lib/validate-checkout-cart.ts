export interface CheckoutValidationItem {
  product: { id: string };
  variant?: { id: string } | null;
  price: number;
  quantity: number;
}

export interface CheckoutValidationResult {
  valid: boolean;
  error?: string;
  invalidItems?: Array<{ name: string; reason: string; currentPrice?: number }>;
}

export async function validateCheckoutCart(items: CheckoutValidationItem[]): Promise<CheckoutValidationResult> {
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

  return data;
}

export function formatCartValidationError(result: CheckoutValidationResult): string {
  if (!result.invalidItems?.length) return result.error || 'No pudimos validar el carrito.';
  const details = result.invalidItems
    .map(item => `${item.name}: ${item.reason}${item.currentPrice !== undefined ? ` (ahora $${item.currentPrice.toLocaleString('es-CO')})` : ''}`)
    .join(' · ');
  return `${result.error || 'Tu carrito está desactualizado.'} ${details}`;
}
