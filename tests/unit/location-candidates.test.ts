import { describe, expect, it } from 'vitest';
import { classifyLocationCandidates } from '@/lib/location-candidates';

const inside = { latitude: 4.65, longitude: -74.1 };
const outside = { latitude: 4.5064071, longitude: -74.1164316 };

function geo(overrides: Record<string, unknown> = {}) {
  return { ...inside, label: 'Bogotá', confidence: 'media', provider: 'geoapify', matchType: 'full_match', confidenceBuildingLevel: 1, ...overrides };
}

describe('niveles de candidatos de ubicación y cobertura', () => {
  it('marca como FUERTE un full_match con confianza de edificio alta', () => {
    const [candidate] = classifyLocationCandidates([geo({ locality: 'Localidad Usaquén' })], 'Calle 108 # 8B-17', 'Bogotá');
    expect(candidate.level).toBe('fuerte');
    expect(candidate.levelLabel).toContain('FUERTE');
    expect(candidate.recommended).toBe(true);
  });

  it('marca La Fragua con varias localidades como AMBIGUO y no recomendado', () => {
    const candidates = classifyLocationCandidates([
      geo({ label: 'Carrera 28 16-05 · La Fragua', locality: 'Localidad Antonio Nariño', confidenceBuildingLevel: 0 }),
      geo({ label: 'Carrera 28 16-05 · Tunjuelito', locality: 'Localidad Tunjuelito', confidenceBuildingLevel: 0 }),
    ], 'Carrera 28 # 16-05 sur Barrio La Fragua', 'Bogotá');
    expect(candidates).toHaveLength(2);
    expect(candidates.every(candidate => candidate.level === 'ambiguo')).toBe(true);
    expect(candidates.every(candidate => candidate.recommended === false)).toBe(true);
    expect(candidates.every(candidate => candidate.multipleLocalities)).toBe(true);
  });

  it('marca match_by_street como CALLE sin confirmación exacta', () => {
    const [candidate] = classifyLocationCandidates([geo({ matchType: 'match_by_street', confidenceBuildingLevel: null, locality: 'Localidad Suba' })], 'Carrera 123A # 22G-78', 'Bogotá');
    expect(candidate.level).toBe('calle');
    expect(candidate.levelLabel).toContain('CALLE');
    expect(candidate.recommended).toBe(false);
  });

  it('mantiene una ubicación fuera de polígonos como no recomendada', () => {
    const [candidate] = classifyLocationCandidates([{ ...geo({ locality: 'Localidad Usme' }), ...outside }], 'Carrera 14B # 161-59', 'Bogotá');
    expect(candidate.coverage).toBe('por_confirmar');
    expect(candidate.recommended).toBe(false);
    expect(candidate.coverageLabel).toContain('por confirmar');
  });
});
