/* eslint-disable @typescript-eslint/no-explicit-any */
import { evaluateCoverage } from '@/lib/coverage';

export type CandidateLevel = 'fuerte' | 'ambiguo' | 'calle';

function localityKey(candidate: any) {
  return String(candidate.locality || '').trim().toLowerCase();
}

function levelFor(candidate: any, multipleLocalities: boolean): CandidateLevel {
  if (candidate.matchType === 'match_by_street') return 'calle';
  if (multipleLocalities) return 'ambiguo';
  if (candidate.provider === 'geoapify') {
    return candidate.matchType === 'full_match' && Number(candidate.confidenceBuildingLevel) >= 1 ? 'fuerte' : 'ambiguo';
  }
  return candidate.confidence === 'alta' ? 'fuerte' : 'ambiguo';
}

export function classifyLocationCandidates(candidates: any[], address: string, city: string) {
  const localities = new Set(candidates.map(localityKey).filter(Boolean));
  const multipleLocalities = localities.size > 1;

  return candidates.map(candidate => {
    const result = evaluateCoverage({
      rawAddress: address,
      viaType: '', viaNumber: '', complement: '', neighborhood: '',
      city: city || 'Bogotá', deliveryNotes: '',
      latitude: Number(candidate.latitude), longitude: Number(candidate.longitude), pinConfidence: candidate.confidence,
    });
    const coverage = result.decision === 'dentro' ? 'dentro' : result.decision === 'fuera' ? 'fuera' : 'por_confirmar';
    const level = levelFor(candidate, multipleLocalities);
    const canRecommend = level === 'fuerte' && coverage === 'dentro' && !multipleLocalities;
    const levelLabel = level === 'fuerte'
      ? 'FUERTE · recomendado exacto'
      : level === 'calle'
        ? 'CALLE · sin número confirmado'
        : 'AMBIGUO · requiere revisión';
    return {
      ...candidate,
      level,
      levelLabel,
      multipleLocalities,
      coverage,
      coverageLabel: coverage === 'dentro' ? 'dentro de cobertura' : coverage === 'fuera' ? 'fuera de cobertura — no recomendado' : 'cobertura por confirmar',
      recommended: canRecommend,
      coverageReason: result.reasons[0] || null,
    };
  }).sort((a, b) => {
    const levelOrder: Record<string, number> = { fuerte: 0, ambiguo: 1, calle: 2 };
    return levelOrder[a.level] - levelOrder[b.level] || Number(b.recommended) - Number(a.recommended) || (a.provider === 'nominatim' ? -1 : 1);
  });
}
