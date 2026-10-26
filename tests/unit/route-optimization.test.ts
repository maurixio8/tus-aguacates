import { describe, expect, it } from 'vitest';
import { splitNorthSouthBalanced, csvForRoute, parseGoogleDuration, reorderStopsByWaypointIndex } from '@/lib/route-optimization';

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
    expect(csv.split('\n')).toHaveLength(2);
    expect(csv).toContain('Norte');
    expect(csv).toContain('Mauricio');
  });

  it('parses Routes API duration strings', () => {
    expect(parseGoogleDuration('123.5s')).toBe(124);
    expect(parseGoogleDuration(undefined)).toBe(0);
  });
});
