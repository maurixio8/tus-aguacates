export interface PurchaseQuantityInput {
  productName: string;
  variantName?: string | null;
  totalQuantity: number;
  totalPhysicalUnits?: number;
  physicalUnitName?: string | null;
  smallestWeightGrams?: number;
  totalInSmallestUnits?: number;
  totalWeightDisplay?: string | null;
}

export function normalizePurchaseText(value: unknown): string {
  return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
}

export function extractPurchaseWeight(variant: string | null | undefined): number | null {
  const text = normalizePurchaseText(variant);
  if (!text) return null;
  if (/^(kilo|kilos|kg)$/.test(text)) return 1000;
  const match = text.match(/(\d+(?:\.\d+)?)\s*(kg|kilos?|g|gr|grs|gramos?|lb|libras?)/);
  if (!match) return null;
  const value = Number(match[1]);
  if (/kg|kilo/.test(match[2])) return value * 1000;
  if (/lb|libra/.test(match[2])) return value * 500;
  return value;
}

export function formatPurchaseWeight(grams: number): string {
  return grams >= 1000 && grams % 1000 === 0 ? `${grams / 1000} kg` : `${grams} g`;
}

export function presentationFromPurchaseVariant(variant: string | null | undefined, productName: string): { unit: string | null; multiplier: number } {
  const text = normalizePurchaseText(variant);
  const product = normalizePurchaseText(productName);
  if (product.includes('caja de') && product.includes('unidad')) return { unit: 'caja', multiplier: 1 };
  const kinds = ['bandeja', 'paquete', 'atado', 'bolsa', 'frasco', 'caja', 'unidad'];
  for (const kind of kinds) {
    if (text.includes(kind)) {
      const count = Number(text.match(new RegExp(`^(\\d+)\\s*${kind}`))?.[1] || 1);
      return { unit: kind, multiplier: count };
    }
  }
  return { unit: null, multiplier: 1 };
}

export function canonicalPurchaseVariantKey(productName: string, variant: string | null | undefined): string {
  const weight = extractPurchaseWeight(variant);
  if (weight) return `weight:${weight}`;
  const presentation = presentationFromPurchaseVariant(variant, productName);
  if (presentation.unit) return `unit:${presentation.unit}`;
  return normalizePurchaseText(variant) || 'sin-variante';
}

export function formatPurchaseQuantity(input: PurchaseQuantityInput): string {
  const variant = input.variantName || '';
  const weight = extractPurchaseWeight(variant) || input.smallestWeightGrams || null;
  const presentation = presentationFromPurchaseVariant(variant, input.productName);
  const physicalTotal = Number(input.totalPhysicalUnits ?? input.totalQuantity ?? 0);
  const unit = presentation.unit || (weight ? null : input.physicalUnitName ? normalizePurchaseText(input.physicalUnitName) : null);
  const count = input.totalPhysicalUnits !== undefined
    ? physicalTotal
    : Number(input.totalQuantity || 0) * (presentation.multiplier || 1);

  if (weight && unit) {
    const plural = count === 1 ? unit : unit === 'unidad' ? 'unidades' : `${unit}s`;
    return `${count} ${plural} de ${formatPurchaseWeight(weight)}`;
  }
  if (weight) {
    return count === 1 && weight === 1000 ? '1 kg' : `${count} x ${formatPurchaseWeight(weight)}`;
  }
  if (unit) {
    const plural = count === 1 ? unit : unit === 'unidad' ? 'unidades' : `${unit}s`;
    return `${count} ${plural}`;
  }
  if (input.totalWeightDisplay) return `${input.totalWeightDisplay} (${physicalTotal} unidades)`;
  return `${count} unidades`;
}
