import { describe, expect, it } from 'vitest';
import { getCheckoutRecoveryCopy, getCheckoutRecoveryState } from '@/lib/checkout-order-state';

describe('checkout recovery state', () => {
  it('treats a saved order without payment method as payment-method pending', () => {
    const state = getCheckoutRecoveryState({ status: 'pendiente', checkoutState: 'payment_method_pending' });
    expect(state).toBe('payment_method_pending');
    expect(getCheckoutRecoveryCopy(state, 'Johanna').title).toContain('guardado');
  });

  it('only treats an order as failed after payment evidence exists', () => {
    expect(getCheckoutRecoveryState({ status: 'pendiente', checkoutState: 'payment_method_pending' })).not.toBe('payment_failed');
    expect(getCheckoutRecoveryState({ status: 'pendiente', paymentFailedAt: '2026-11-11T16:00:00Z' })).toBe('payment_failed');
  });

  it('describes deferred payment as payment on delivery', () => {
    expect(getCheckoutRecoveryState({ status: 'pendiente', paymentMethod: 'nequi' })).toBe('deferred_payment');
  });
});
