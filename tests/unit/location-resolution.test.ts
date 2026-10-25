import { describe, expect, it } from 'vitest';
import { formatNormalizedDeliveryAddress, normalizeDeliveryAddress } from '@/lib/location-resolution';

describe('corrección visible de direcciones', () => {
  it('muestra la forma corta y legible de una dirección corregida', () => {
    expect(formatNormalizedDeliveryAddress('carrera 26 numero 36', 'Bogotá')).toBe('Cra 26 # 36, Bogotá');
    expect(formatNormalizedDeliveryAddress('Cra. 26 No. 36', 'Bogotá')).toBe('Cra 26 # 36, Bogotá');
    expect(formatNormalizedDeliveryAddress('avenida carrera 68   numero 98a-41', 'Bogotá')).toBe('Av Cra 68 # 98a-41, Bogotá');
    expect(formatNormalizedDeliveryAddress('transversal 23A # 47-40 sur', 'Bogotá')).toBe('Tv 23A # 47-40 sur, Bogotá');
  });

  it('usa una clave estable para buscar sin borrar el texto original', () => {
    expect(normalizeDeliveryAddress('carrera 26 numero 36', 'Bogotá')).toBe('carrera 26 numero 36 bogota');
    expect(formatNormalizedDeliveryAddress('carrera 26 numero 36', 'Bogotá')).not.toBe('carrera 26 numero 36 bogota');
  });
});
