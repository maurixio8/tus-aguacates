import { describe, expect, it } from 'vitest';
import { splitNorthSouthBalanced, csvForRoute, parseGoogleDuration, reorderStopsByWaypointIndex } from '@/lib/route-optimization';
import { formatOperationalSummary } from '@/utils/orderSummaryGenerator';

const stop = (id: string, latitude: number, longitude: number) => ({ id, address: id, deliveryDate: '2026-10-27', latitude, longitude, coverage: 'dentro' });

describe('phase 4 route optimization helpers', () => {
  it('splits north/south with both groups and a deterministic balance score', () => {
    const result = splitNorthSouthBalanced([
      stop('n1', 4.80, -74.1),
      stop('n2', 4.78, -74.2),
      stop('s1', 4.55, -74.1),
      stop('s2', 4.53, -74.2),
    ]);
    expect(result.north).toHaveLength(2);
    expect(result.south).toHaveLength(2);
    expect(result.score).toBeGreaterThanOrEqual(0);
  });

  it('applies the provider waypoint order and falls back safely on invalid indices', () => {
    const stops = [stop('a', 4.7, -74.1), stop('b', 4.6, -74.2), stop('c', 4.8, -74.0)];
    expect(reorderStopsByWaypointIndex(stops, [2, 0, 1]).map(item => item.id)).toEqual(['c', 'a', 'b']);
    expect(reorderStopsByWaypointIndex(stops, [-1, 0, 1]).map(item => item.id)).toEqual(['a', 'b', 'c']);
  });
  it('writes one CSV row per stop and keeps the driver/group label', () => {
    const csv = csvForRoute({ stops: [stop('A', 4.7, -74.1)], group: 'Norte', driver: 'Mauricio' });
    expect(csv.split('\n').length).toBeGreaterThanOrEqual(3);
    expect(csv).toContain('Norte');
    expect(csv).toContain('Mauricio');
  });

  it('uses one shared operational summary in the route note', () => {
    const csv = csvForRoute({ stops: [{ ...stop('A', 4.7, -74.1), orderNumber: 'INV-A', customerName: 'Cliente', deliveryDate: '2026-10-27', items: [{ name: 'Banano', quantity: 2, price: 7500, variantName: '1 kilo' }], totalAmount: 15000, paymentStatus: 'pending' }], group: 'Compacta', driver: 'Mauricio' });
    expect(csv).toContain('PEDIDO: INV-A');
    expect(csv).toContain('2 x Banano');
    expect(csv).toContain('Variante: 1 kilo');
  });

  it('formats the complete summary contract for the driver', () => {
    const summary = formatOperationalSummary({ id: 'abc12345', order_number: 'INV-123', customer_name: 'Cliente', delivery_address: 'Calle 1', payment_status: 'pending', payment_method: 'contraentrega', delivery_date: '2026-10-27', items: [{ name: 'Caja Hass', quantity: 1, price: 19600, variantName: '24 unidades' }], total_amount: 19600 });
    expect(summary).toContain('PEDIDO: INV-123');
    expect(summary).toContain('DIRECCIÓN: Calle 1');
    expect(summary).toContain('1 x Caja Hass');
    expect(summary).toContain('TOTAL A PAGAR');
  });

  it('keeps unlimited export as the default contract', () => {
    const csv = csvForRoute({ stops: Array.from({ length: 11 }, (_, index) => stop(String(index), 4.7, -74.1)), group: 'Compacta', driver: 'Mauricio' });
    expect((csv.match(/\n/g) || []).length).toBeGreaterThan(11);
  });

  it('parses Routes API duration strings', () => {
    expect(parseGoogleDuration('123.5s')).toBe(124);
    expect(parseGoogleDuration(undefined)).toBe(0);
  });
});
