export interface PackageConversion {
  packages: number;
  remainderGrams: number;
  packageGrams: 125 | 250 | 500;
}

export interface AvocadoCalculation {
  units: number;
  kilos: number;
  grams: number;
}

export interface CashChangeCalculation {
  total: number;
  received: number;
  change: number;
  missing: number;
  canClose: boolean;
}

export function convertGramsToPackages(totalGrams: number, packageGrams: PackageConversion['packageGrams']): PackageConversion {
  const safeTotal = Math.max(0, Math.round(totalGrams));
  return {
    packages: Math.ceil(safeTotal / packageGrams),
    remainderGrams: safeTotal % packageGrams,
    packageGrams,
  };
}

export function calculateAvocadoUnitsAndKilos(units: number, averageUnitGrams: number): AvocadoCalculation {
  const safeUnits = Math.max(0, Math.round(units));
  const grams = safeUnits * Math.max(0, averageUnitGrams);
  return { units: safeUnits, grams, kilos: grams / 1000 };
}

export function calculateCashChange(total: number, received: number): CashChangeCalculation {
  const safeTotal = Math.max(0, Math.round(total));
  const safeReceived = Math.max(0, Math.round(received));
  return {
    total: safeTotal,
    received: safeReceived,
    change: Math.max(0, safeReceived - safeTotal),
    missing: Math.max(0, safeTotal - safeReceived),
    canClose: safeReceived >= safeTotal,
  };
}
