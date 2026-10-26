import { describe, expect, it } from 'vitest';
import {
  buildGoogleMapsDirectionsUrl,
  buildWhatsAppUrl,
  deliveryDatesInRange,
  normalizeWhatsAppPhone,
} from '@/lib/admin-route';

describe('admin route corrections', () => {
  it('normalizes Colombian phones and rejects unusable values', () => {
    expect(normalizeWhatsAppPhone('+57 318-334-7828')).toBe('573183347828');
    expect(normalizeWhatsAppPhone('3183347828')).toBe('573183347828');
    expect(normalizeWhatsAppPhone('')).toBeNull();
    expect(normalizeWhatsAppPhone('12345')).toBeNull();
  });

  it('builds a WhatsApp link with the prefilled address message', () => {
    const url = buildWhatsAppUrl('318 334 7828', 'Carrera 14B #161-59, Bogotá');
    expect(url).toContain('https://wa.me/573183347828?text=');
    expect(decodeURIComponent(url || '')).toContain('Carrera 14B #161-59, Bogotá');
    expect(buildWhatsAppUrl('', 'Dirección')).toBeNull();
  });

  it('returns Tuesday and Friday delivery dates for a range', () => {
    expect(deliveryDatesInRange('2026-10-20', '2026-10-27')).toEqual(['2026-10-20', '2026-10-23', '2026-10-27']);
  });

  it('builds Google directions with origin, every waypoint and return destination', () => {
    const url = buildGoogleMapsDirectionsUrl('Corabastos, Bogotá', ['Calle 1 #1-1', 'Carrera 2 #2-2']);
    const parsed = new URL(url);
    expect(parsed.searchParams.get('origin')).toBe('Corabastos, Bogotá');
    expect(parsed.searchParams.get('destination')).toBe('Corabastos, Bogotá');
    expect(parsed.searchParams.get('waypoints')).toBe('Calle 1 #1-1|Carrera 2 #2-2');
  });
});
