import { describe, expect, it } from 'vitest';
import { getGeoapifyStructuredQuery } from '@/lib/location-geocoding';

describe('consulta estructurada de Geoapify', () => {
  it('separa Carrera 14B y 161-59 sin perder # ni -', () => {
    expect(getGeoapifyStructuredQuery('Carrera 14B # 161-59', 'Bogotá')).toMatchObject({
      street: 'carrera 14b',
      housenumber: '161-59',
      city: 'Bogotá',
      country: 'Colombia',
    });
  });

  it('separa La Fragua en calle y número estructurado', () => {
    expect(getGeoapifyStructuredQuery('Carrera 28 # 16-05 sur Barrio La Fragua', 'Bogotá')).toMatchObject({
      street: 'carrera 28',
      housenumber: '16-05',
    });
  });
});
