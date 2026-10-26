export interface PurchaseComboComponent {
  name: string;
  quantity: number;
  unit: string;
  variant?: string;
  productId?: string;
  variantId?: string;
}

export type PurchaseComboMap = Record<string, PurchaseComboComponent[]>;

export function resolveComboComponents(
  productId: string | null | undefined,
  productName: string,
  byProductId: PurchaseComboMap,
  byName: PurchaseComboMap,
): PurchaseComboComponent[] | null {
  const idMatch = productId ? byProductId[productId] : undefined;
  if (idMatch) return idMatch;

  const key = productName.trim().toLowerCase();
  return byName[key] || Object.entries(byName).find(([comboKey]) => key.includes(comboKey))?.[1] || null;
}
