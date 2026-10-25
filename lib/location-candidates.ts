/* eslint-disable @typescript-eslint/no-explicit-any */
import { evaluateCoverage } from '@/lib/coverage';

export function classifyLocationCandidates(candidates: any[], address: string, city: string) {
  return candidates.map(candidate => {
    const result = evaluateCoverage({
      rawAddress: address,
      viaType: '', viaNumber: '', complement: '', neighborhood: '',
      city: city || 'Bogotá', deliveryNotes: '',
      latitude: Number(candidate.latitude), longitude: Number(candidate.longitude), pinConfidence: candidate.confidence,
    });
    const coverage = result.decision === 'dentro' ? 'dentro' : result.decision === 'fuera' ? 'fuera' : 'por_confirmar';
    return {
      ...candidate,
      coverage,
      coverageLabel: coverage === 'dentro' ? 'dentro de cobertura · recomendado' : 'fuera de cobertura — no recomendado',
      recommended: coverage === 'dentro',
      coverageReason: result.reasons[0] || null,
    };
  }).sort((a, b) => Number(b.recommended) - Number(a.recommended));
}
