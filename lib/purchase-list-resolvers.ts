export interface PurchaseComboComponent {
  name: string;
  quantity: number;
  unit: string;
  variant?: string;
  productId?: string;
  variantId?: string;
}

export type PurchaseComboMap = Record<string, PurchaseComboComponent[]>;

export interface PurchaseInputLine {
  name: string;
  quantity: number;
  unit: string;
  variant?: string;
  productId?: string;
  variantId?: string;
  isCombo?: boolean;
  components?: PurchaseInputLine[];
}

export type PurchaseZone = 'Bodega del Aguacate' | 'Bodega Popular';

export interface AggregatedPurchaseLine {
  key: string;
  name: string;
  quantity: number;
  unit: string;
  zone: PurchaseZone;
}

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

function normalizePurchaseName(name: string): string {
  return name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase().replace(/\s+/g, ' ');
}

function isAvocado(name: string): boolean {
  const normalized = normalizePurchaseName(name);
  return /\b(aguacate|aguacates|hass|injerto|avocado)\b/.test(normalized);
}

function canonicalPurchaseName(name: string): string {
  const normalized = normalizePurchaseName(name);
  if (/caja\s+(seleccion\s+18|de\s*18|18\b)/.test(normalized) || /caja\s+de\s*24\b/.test(normalized)) {
    return 'Calidad 3ra';
  }
  return name.trim();
}

export function assignPurchaseZone(line: Pick<PurchaseInputLine, 'name'>): PurchaseZone {
  const normalized = normalizePurchaseName(line.name);
  return isAvocado(line.name) || normalized === 'calidad 3ra' || /caja\s+(seleccion\s+18|de\s*18|18\b|de\s*24\b)/.test(normalized)
    ? 'Bodega del Aguacate'
    : 'Bodega Popular';
}

export function expandPurchaseLines(lines: PurchaseInputLine[]): PurchaseInputLine[] {
  return lines.flatMap((line) => {
    if (!line.isCombo || !line.components?.length) {
      return [{ ...line, name: canonicalPurchaseName(line.name) }];
    }
    return expandPurchaseLines(line.components).map((component) => ({
      ...component,
      quantity: component.quantity * line.quantity,
    }));
  });
}

export function aggregatePurchaseLines(lines: PurchaseInputLine[]): AggregatedPurchaseLine[] {
  const aggregate = new Map<string, AggregatedPurchaseLine>();
  for (const line of expandPurchaseLines(lines)) {
    const name = canonicalPurchaseName(line.name);
    const key = `${normalizePurchaseName(name)}|${normalizePurchaseName(line.unit)}`;
    const existing = aggregate.get(key);
    if (existing) {
      existing.quantity += line.quantity;
    } else {
      aggregate.set(key, {
        key,
        name,
        quantity: line.quantity,
        unit: line.unit,
        zone: assignPurchaseZone({ name }),
      });
    }
  }
  return [...aggregate.values()];
}
