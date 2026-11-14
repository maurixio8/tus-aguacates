import { describe, expect, it } from 'vitest';
import { PURCHASE_JORNADA_REVIEWER_RULES, purchaseJornadaFixture } from '@/tests/fixtures/purchase-jornada';

describe('purchase jornada design fixture', () => {
  it('contains exactly the eight approved reviewer rules', () => {
    expect(PURCHASE_JORNADA_REVIEWER_RULES).toHaveLength(8);
    expect(new Set(purchaseJornadaFixture.reviewerRules).size).toBe(8);
  });

  it('keeps source lineage, explicit quantities, and initial zones parseable', () => {
    expect(purchaseJornadaFixture.lines.every((line) => line.sourceOrderId && line.sourceOrderLineId)).toBe(true);
    expect(purchaseJornadaFixture.lines.every((line) => line.requestedQuantity >= 0)).toBe(true);
    expect(purchaseJornadaFixture.lines.map((line) => line.zone)).toEqual([
      'Bodega del Aguacate',
      'Bodega Popular',
    ]);
  });
});
