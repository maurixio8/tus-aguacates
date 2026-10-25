import { describe, expect, it } from 'vitest';
import { classifyLocationCandidates } from '@/lib/location-candidates';

describe('candidatos de ubicación y cobertura', () => {
  it('pone primero un punto dentro y deja fuera de cobertura como no recomendado', () => {
    const candidates = classifyLocationCandidates([
      { latitude: 4.5064071, longitude: -74.1164316, label: 'Tenerife / Usme', confidence: 'media', provider: 'nominatim' },
      { latitude: 4.65, longitude: -74.1, label: 'Bogotá zona verde', confidence: 'alta', provider: 'nominatim' },
    ], 'Cra 26 # 36', 'Bogotá');

    expect(candidates[0].recommended).toBe(true);
    expect(candidates[0].coverageLabel).toContain('dentro de cobertura');
    expect(candidates[1].recommended).toBe(false);
    expect(candidates[1].coverageLabel).toContain('no recomendado');
    expect(candidates[1].confidence).toBe('media');
  });
});
