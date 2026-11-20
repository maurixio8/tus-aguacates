import { describe, expect, it } from 'vitest';
import { isHistoricalRouteEligible, isDeliveredRouteOrder, routeDateRange } from '@/lib/route-history';
import { isRouteEligible, nextDeliveryDate } from '@/lib/admin-route';

describe('historical routes are delivery-date reads, not active work', () => {
  it('preserves Tuesday-Friday after Friday 06:00 COT', () => {
    expect(nextDeliveryDate(new Date('2026-11-20T11:01:00Z'))).toBe('2026-11-24');
    expect(routeDateRange(new URLSearchParams('active=0&desde=2026-11-17&hasta=2026-11-20'), '2026-11-24')).toEqual({ active: false, desde: '2026-11-17', hasta: '2026-11-20' });
  });
  it('keeps explicit active mode separate from the requested range', () => {
    expect(routeDateRange(new URLSearchParams('active=1&desde=2026-11-17&hasta=2026-11-20'), '2026-11-24')).toEqual({ active: true, desde: '2026-11-24', hasta: '2026-11-24' });
  });
  it.each(['delivered', 'entregado', 'completado'])('shows %s without restoring it to the active route', status => {
    const row = { status, created_at: '2026-11-12T16:00:00Z' };
    const before = JSON.stringify(row);
    expect(isHistoricalRouteEligible(row)).toBe(true);
    expect(isDeliveredRouteOrder(row)).toBe(true);
    expect(isRouteEligible(row)).toBe(false);
    expect(JSON.stringify(row)).toBe(before);
  });
  it('detects completion in either status column and timestamps', () => {
    expect(isDeliveredRouteOrder({ status: 'pending', order_status: 'entregado' })).toBe(true);
    expect(isHistoricalRouteEligible({ status: 'pending', delivered_at: '2026-11-17T20:00:00Z' })).toBe(true);
  });
  it.each(['cancelado','cancelled','pausado_confirmacion'])('does not restore %s', status => {
    expect(isHistoricalRouteEligible({ status })).toBe(false);
  });
  it('defaults a one-sided range to that same delivery day', () => {
    expect(routeDateRange(new URLSearchParams('active=0&hasta=2026-11-17'), '2026-11-24')).toEqual({ active: false, desde: '2026-11-17', hasta: '2026-11-17' });
  });
  it.each(['active=0&desde=2026-02-30','active=0&desde=2026-11-20&hasta=2026-11-17'])('rejects malformed ranges: %s', query => {
    expect(() => routeDateRange(new URLSearchParams(query), '2026-11-24')).toThrow('Rango de entrega inválido');
  });
});
