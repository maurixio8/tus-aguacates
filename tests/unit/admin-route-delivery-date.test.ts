import { describe, expect, it } from 'vitest';
import { derivedDeliveryDate, nextDeliveryDate, addressParts, createdDateOf } from '@/lib/admin-route';

describe('fechas del dashboard de pedidos y ruta', () => {
  it('filtra por la fecha visible del pedido en Bogotá, no por la fecha futura de entrega', () => {
    expect(createdDateOf({ created_at: '2026-10-20T04:30:00.000Z' })).toBe('2026-10-19');
    expect(createdDateOf({ created_at: '2026-10-23T05:00:00.000Z' })).toBe('2026-10-23');
  });

  const cases = [
    ['lunes 26 de octubre', '2026-10-26T15:00:00Z', '2026-10-27'],
    ['martes antes de las 6:00', '2026-10-27T10:59:00Z', '2026-10-27'],
    ['martes desde las 6:00', '2026-10-27T11:00:00Z', '2026-10-30'],
    ['miércoles', '2026-10-28T15:00:00Z', '2026-10-30'],
    ['jueves', '2026-10-29T15:00:00Z', '2026-10-30'],
    ['viernes antes de las 6:00', '2026-10-30T10:59:00Z', '2026-10-30'],
    ['viernes desde las 6:00', '2026-10-30T11:00:00Z', '2026-11-03'],
    ['sábado', '2026-10-31T15:00:00Z', '2026-11-03'],
    ['domingo', '2026-11-01T15:00:00Z', '2026-11-03'],
  ] as const;

  it.each(cases)('deriva %s correctamente', (_label, createdAt, expected) => {
    expect(derivedDeliveryDate(createdAt)).toBe(expected);
  });

  it('usa el mismo corte para la fecha por defecto de la ruta', () => {
    expect(nextDeliveryDate(new Date('2026-10-27T10:59:00Z'))).toBe('2026-10-27');
    expect(nextDeliveryDate(new Date('2026-10-27T11:00:00Z'))).toBe('2026-10-30');
  });

  it('no convierte null en coordenadas 0,0', () => {
    expect(addressParts({ delivery_address: 'Carrera 14b #161' }).latitude).toBeNull();
    expect(addressParts({ delivery_address: 'Carrera 14b #161' }).longitude).toBeNull();
  });
});
