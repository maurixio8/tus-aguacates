import { describe, it, expect } from 'vitest';
import { buyerPurchaseCycle, buyerPurchaseCycleForDeliveryDate } from '../../lib/buyer-cycle';

describe('buyer jornada remains available after the order cutoff', () => {
  it.each(['2026-11-20T05:59:00-05:00','2026-11-20T06:00:00-05:00','2026-11-20T06:01:00-05:00','2026-11-20T17:59:00-05:00'])('keeps Friday at %s', (now) => {
    expect(buyerPurchaseCycle(new Date(now)).deliveryDate).toBe('2026-11-20');
  });
  it('hands off Friday at 18:00, not at the 06:00 data cutoff', () => {
    expect(buyerPurchaseCycle(new Date('2026-11-20T18:00:00-05:00')).deliveryDate).toBe('2026-11-24');
  });
  it.each(['2026-11-17T05:59:00-05:00','2026-11-17T06:00:00-05:00','2026-11-17T17:59:00-05:00'])('preserves the existing Tuesday contract at %s', (now) => {
    expect(buyerPurchaseCycle(new Date(now)).deliveryDate).toBe('2026-11-17');
  });
  it('hands off Tuesday at 18:00', () => {
    expect(buyerPurchaseCycle(new Date('2026-11-17T18:00:00-05:00')).deliveryDate).toBe('2026-11-20');
  });
  it('does not expand the Friday order population into the next Tuesday cycle', () => {
    const cycle = buyerPurchaseCycle(new Date('2026-11-20T06:00:00-05:00'));
    expect(cycle.startsAt.toISOString()).toBe('2026-11-17T11:00:00.000Z');
    expect(cycle.endsAt.toISOString()).toBe('2026-11-20T11:00:00.000Z');
    expect(buyerPurchaseCycleForDeliveryDate('2026-11-20')).toEqual(cycle);
  });
});
