import { describe, expect, it } from 'vitest';
import { emptyStructuredAddress, formatStructuredAddress } from '@/lib/address-structured';
import { evaluateCoverage } from '@/lib/coverage';

describe('Fase 2 dirección estructurada', () => {
  it('formatea vía, número, complemento, barrio y ciudad sin mezclar notas', () => {
    expect(formatStructuredAddress({ ...emptyStructuredAddress, viaType: 'Carrera', viaNumber: '92 # 8A-76', complement: 'Torre 6 apto 822', neighborhood: 'Coruña', city: 'Bogotá' })).toBe('Carrera 92 # 8A-76, Torre 6 apto 822, Coruña, Bogotá');
  });
  it('marca sin_pin sin bloquear la captura', () => {
    const result = evaluateCoverage({ ...emptyStructuredAddress, viaNumber: '10 # 20-30', neighborhood: 'Chapinero' });
    expect(result.mode).toBe('shadow');
    expect(result.decision).toBe('dentro');
  });
  it('marca Chía como fuera en sombra', () => {
    const result = evaluateCoverage({ ...emptyStructuredAddress, city: 'Chía', viaNumber: '10 # 20-30', neighborhood: 'Centro' });
    expect(result.decision).toBe('fuera');
    expect(result.reasons).toContain('ciudad_excluida');
  });
  it('marca una zona lejana por distancia', () => {
    const result = evaluateCoverage({ ...emptyStructuredAddress, viaNumber: '10 # 20-30', neighborhood: 'Suba', latitude: 5.5, longitude: -75 });
    expect(result.decision).toBe('fuera');
    expect(result.reasons).toContain('distancia_superada');
  });
});
