export const PURCHASE_JORNADA_REVIEWER_RULES = [
  { id: 'R1', name: 'buyer-only-access', description: 'Only a valid JWT with role buyer may read or mutate a jornada.' },
  { id: 'R2', name: 'source-order-lineage', description: 'Every line retains source_order_id and source_line_id.' },
  { id: 'R3', name: 'combo-expansion-first', description: 'Combos expand into individual products before quantity aggregation or zone assignment.' },
  { id: 'R4', name: 'avocado-zone', description: 'Every avocado variant, including Caja Selección 18 and Injerto 4 unidades, uses Bodega del Aguacate.' },
  { id: 'R5', name: 'cerezas-default-zone', description: 'Cerezas initializes to Bodega Popular.' },
  { id: 'R6', name: 'third-quality-rollup', description: 'Caja Selección 18 and Caja de 24 contribute to Calidad 3ra.' },
  { id: 'R7', name: 'non-negative-quantities', description: 'Requested and purchased quantities are non-negative; shortages are explicit.' },
  { id: 'R8', name: 'idempotent-replay', description: 'A source order line may be projected once per jornada; replay does not duplicate quantity.' },
] as const;

export type ReviewerRuleId = typeof PURCHASE_JORNADA_REVIEWER_RULES[number]['id'];
export type PurchaseJornadaStatus = 'draft' | 'open' | 'closed';

export interface PurchaseJornadaFixture {
  id: string;
  buyerId: string;
  deliveryDate: string;
  status: PurchaseJornadaStatus;
  reviewerRules: readonly ReviewerRuleId[];
  lines: Array<{
    sourceOrderId: string;
    sourceOrderLineId: string;
    productName: string;
    requestedQuantity: number;
    purchasedQuantity: number | null;
    zone: 'Bodega del Aguacate' | 'Bodega Popular';
  }>;
}

export const purchaseJornadaFixture: PurchaseJornadaFixture = {
  id: 'jornada-fixture-2026-11-14',
  buyerId: 'buyer-fixture-1',
  deliveryDate: '2026-11-15',
  status: 'open',
  reviewerRules: PURCHASE_JORNADA_REVIEWER_RULES.map((rule) => rule.id),
  lines: [
    {
      sourceOrderId: 'order-fixture-1',
      sourceOrderLineId: 'line-fixture-1',
      productName: 'Caja Selección 18',
      requestedQuantity: 2,
      purchasedQuantity: null,
      zone: 'Bodega del Aguacate',
    },
    {
      sourceOrderId: 'order-fixture-2',
      sourceOrderLineId: 'line-fixture-2',
      productName: 'Cerezas',
      requestedQuantity: 1,
      purchasedQuantity: null,
      zone: 'Bodega Popular',
    },
  ],
};
