import { describe, expect, it } from 'vitest';
import { emptyStructuredAddress, formatStructuredAddress } from '@/lib/address-structured';
import { evaluateCoverage } from '@/lib/coverage';

describe('Fase 2 dirección estructurada', () => {
  it('formatea vía, número, complemento, barrio y ciudad sin mezclar notas', () => {
    expect(formatStructuredAddress({ ...emptyStructuredAddress, viaType: 'Carrera', viaNumber: '92 # 8A-76', complement: 'Torre 6 apto 822', neighborhood: 'Coruña', city: 'Bogotá' })).toBe('Carrera 92 # 8A-76, Torre 6 apto 822, Coruña, Bogotá');
  });
  it('marca captura sin pin para confirmar sin bloquear', () => {
    const result = evaluateCoverage({ ...emptyStructuredAddress, viaNumber: '10 # 20-30', neighborhood: 'Chapinero' });
    expect(result.mode).toBe('shadow');
    expect(result.decision).toBe('confirmar');
    expect(result.reasons).toContain('sin_pin');
  });
  it('marca un punto dentro de un polígono verde como dentro', () => {
    const result = evaluateCoverage({ ...emptyStructuredAddress, viaNumber: '10 # 20-30', neighborhood: 'Centro', latitude: 4.65, longitude: -74.10 });
    expect(result.decision).toBe('dentro');
    expect(result.zone).toBeTruthy();
  });
  it('deja Chía sin polígono en confirmar durante sombra', () => {
    const result = evaluateCoverage({ ...emptyStructuredAddress, city: 'Chía', viaNumber: '10 # 20-30', neighborhood: 'Centro', latitude: 4.86, longitude: -74.05 });
    expect(result.decision).toBe('confirmar');
    expect(result.reasons).toContain('fuera_de_poligonos_confirmar');
  });
  it('marca una zona lejana por distancia', () => {
    const result = evaluateCoverage({ ...emptyStructuredAddress, viaNumber: '10 # 20-30', neighborhood: 'Suba', latitude: 5.5, longitude: -75 });
    expect(result.decision).toBe('confirmar');
    expect(result.reasons).toContain('fuera_de_poligonos_confirmar');
  });
});
