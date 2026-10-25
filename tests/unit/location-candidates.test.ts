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

  it('mapea Google ROOFTOP con número y tipos válidos a FUERTE', () => {
    const [candidate] = classifyLocationCandidates([{
      ...inside, label: 'Cl. 108 #8b-17, Bogotá', confidence: 'alta', provider: 'google', locationType: 'ROOFTOP', hasStreetNumber: true, types: ['street_address'], partialMatch: false, multipleResults: false,
    }], 'Calle 108 # 8B-17', 'Bogotá');
    expect(candidate.level).toBe('fuerte');
    expect(candidate.recommended).toBe(true);
  });

  it('mapea Google RANGE_INTERPOLATED o partial_match a AMBIGUO', () => {
    const candidates = classifyLocationCandidates([
      { ...inside, label: 'interpolada', confidence: 'media', provider: 'google', locationType: 'RANGE_INTERPOLATED', hasStreetNumber: true, types: ['street_address'], partialMatch: false, multipleResults: false },
      { ...inside, longitude: -74.101, label: 'parcial', confidence: 'media', provider: 'google', locationType: 'ROOFTOP', hasStreetNumber: true, types: ['street_address'], partialMatch: true, multipleResults: false },
    ], 'Carrera 14B # 161-59', 'Bogotá');
    expect(candidates.every(candidate => candidate.level === 'ambiguo')).toBe(true);
    expect(candidates.every(candidate => candidate.recommended === false)).toBe(true);
  });

  it('mapea Google sin número o GEOMETRIC_CENTER a CALLE', () => {
    const [candidate] = classifyLocationCandidates([{
      ...inside, label: 'Carrera 14B', confidence: 'baja', provider: 'google', locationType: 'GEOMETRIC_CENTER', hasStreetNumber: false, types: ['route'], partialMatch: false, multipleResults: false,
    }], 'Carrera 14B # 161-59', 'Bogotá');
    expect(candidate.level).toBe('calle');
    expect(candidate.recommended).toBe(false);
  });

  it('trata varios resultados Google como AMBIGUO aunque uno sea ROOFTOP', () => {
    const [candidate] = classifyLocationCandidates([{
      ...inside, label: 'resultado 1', confidence: 'media', provider: 'google', locationType: 'ROOFTOP', hasStreetNumber: true, types: ['street_address'], partialMatch: false, multipleResults: true,
    }], 'Carrera 13 # 152-80', 'Bogotá');
    expect(candidate.level).toBe('ambiguo');
    expect(candidate.recommended).toBe(false);
  });

  it('mantiene una ubicación fuera de polígonos como no recomendada', () => {
    const [candidate] = classifyLocationCandidates([{ ...geo({ locality: 'Localidad Usme' }), ...outside }], 'Carrera 14B # 161-59', 'Bogotá');
    expect(candidate.coverage).toBe('por_confirmar');
    expect(candidate.recommended).toBe(false);
    expect(candidate.coverageLabel).toContain('por confirmar');
  });
});
