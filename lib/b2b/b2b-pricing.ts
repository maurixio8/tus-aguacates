/**
 * Lógica de Precios por Volumen para B2B
 * "Tus Aguacates" - E-commerce Platform
 */

import type {
  B2BProduct,
  B2BPricingTier,
  B2BPricingResult,
  B2BCartItem,
} from './b2b-types';

/**
 * Obtiene el pricing tier aplicable para una cantidad dada de un producto
 */
export function getApplicableTier(
  product: B2BProduct,
  quantity: number
): B2BPricingTier | null {
  if (!product.pricing_tiers || product.pricing_tiers.length === 0) {
    return null;
  }

  // Filtrar tiers que aplican a la cantidad
  const applicableTiers = product.pricing_tiers.filter(
    (tier) =>
      quantity >= tier.min_quantity &&
      (tier.max_quantity === null || quantity <= tier.max_quantity)
  );

  if (applicableTiers.length === 0) {
    return null;
  }

  // Si hay múltiples tiers aplicables (no debería pasar con la restricción EXCLUDE),
  // usar el de mayor prioridad (menor número)
  applicableTiers.sort((a, b) => a.priority - b.priority);

  return applicableTiers[0];
}

/**
 * Calcula el precio para una cantidad dada de un producto B2B
 */
export function calculatePriceForQuantity(
  product: B2BProduct,
  quantity: number
): B2BPricingResult {
  const tier = getApplicableTier(product, quantity);

  let unitPrice: number;
  let discountPercentage: number;

  if (tier) {
    unitPrice = tier.price_per_unit;
    discountPercentage = tier.discount_percentage;
  } else {
    // Sin descuento, usar precio base
    unitPrice = product.base_price;
    discountPercentage = 0;
  }

  const totalPrice = unitPrice * quantity;
  const originalPrice = product.base_price * quantity;
  const savings = originalPrice - totalPrice;

  return {
    tier,
    unit_price: unitPrice,
    discount_percentage: discountPercentage,
    total_price: totalPrice,
    savings,
    quantity,
  };
}

/**
 * Calcula el precio unitario basado en un tier de pricing
 */
export function calculateTierUnitPrice(
  basePrice: number,
  discountPercentage: number
): number {
  if (discountPercentage <= 0 || discountPercentage > 100) {
    return basePrice;
  }

  const discountMultiplier = (100 - discountPercentage) / 100;
  return Math.round(basePrice * discountMultiplier * 100) / 100; // Redondear a 2 decimales
}

/**
 * Valida que un pricing tier no se solape con otros tiers del mismo producto
 */
export function validateTierNoOverlap(
  newTier: Omit<B2BPricingTier, 'id' | 'created_at' | 'updated_at'>,
  existingTiers: B2BPricingTier[]
): { valid: boolean; error?: string } {
  // Verificar solapamiento con tiers existentes
  const newRange = {
    min: newTier.min_quantity,
    max: newTier.max_quantity ?? Infinity,
  };

  for (const existing of existingTiers) {
    // Nota: newTier no tiene id, así que no podemos saltarnos el mismo tier
    // El caller debe asegurarse de no pasar el mismo tier que está en existingTiers

    const existingRange = {
      min: existing.min_quantity,
      max: existing.max_quantity ?? Infinity,
    };

    // Verificar solapamiento
    const overlaps = !(newRange.max <= existingRange.min || newRange.min >= existingRange.max);

    if (overlaps) {
      return {
        valid: false,
        error: `El rango de cantidad (${newTier.min_quantity}${newTier.max_quantity ? `-${newTier.max_quantity}` : '+'}) se solapa con el tier existente (${existing.min_quantity}${existing.max_quantity ? `-${existing.max_quantity}` : '+'})`,
      };
    }
  }

  return { valid: true };
}

/**
 * Ordena pricing tiers por cantidad (ascendente)
 */
export function sortPricingTiersByQuantity(tiers: B2BPricingTier[]): B2BPricingTier[] {
  return [...tiers].sort((a, b) => {
    if (a.min_quantity !== b.min_quantity) {
      return a.min_quantity - b.min_quantity;
    }
    // Si tienen el mismo min, ordenar por max (null al final)
    const aMax = a.max_quantity ?? Infinity;
    const bMax = b.max_quantity ?? Infinity;
    return aMax - bMax;
  });
}

/**
 * Calcula el subtotal del carrito aplicando pricing tiers
 */
export function calculateCartPricing(cartItems: B2BCartItem[]): {
  subtotal: number;
  totalDiscount: number;
  total: number;
  appliedTiers: B2BPricingTier[];
} {
  let subtotal = 0;
  let totalDiscount = 0;
  const appliedTiers: B2BPricingTier[] = [];

  for (const item of cartItems) {
    const result = calculatePriceForQuantity(item.product, item.quantity);
    subtotal += item.product.base_price * item.quantity;
    totalDiscount += result.savings;

    if (item.applied_tier) {
      appliedTiers.push(item.applied_tier);
    }
  }

  return {
    subtotal,
    totalDiscount,
    total: subtotal - totalDiscount,
    appliedTiers,
  };
}

/**
 * Genera una tabla de precios para mostrar en la UI
 */
export function generatePricingTable(
  product: B2BProduct
): Array<{
  minQty: number;
  maxQty: number | null;
  unitPrice: number;
  discount: number;
  savings: number;
}> {
  if (!product.pricing_tiers || product.pricing_tiers.length === 0) {
    return [
      {
        minQty: product.minimum_order_quantity,
        maxQty: null,
        unitPrice: product.base_price,
        discount: 0,
        savings: 0,
      },
    ];
  }

  const sortedTiers = sortPricingTiersByQuantity(product.pricing_tiers);

  return sortedTiers.map((tier) => ({
    minQty: tier.min_quantity,
    maxQty: tier.max_quantity,
    unitPrice: tier.price_per_unit,
    discount: tier.discount_percentage,
    savings: Math.round((product.base_price - tier.price_per_unit) * 100) / 100,
  }));
}

/**
 * Calcula el siguiente tier para alcanzar un mejor precio
 */
export function getNextTierForSavings(
  product: B2BProduct,
  currentQuantity: number
): {
  currentTier: B2BPricingTier | null;
  nextTier: B2BPricingTier | null;
  additionalNeeded: number | null;
  potentialSavings: number | null;
} {
  const currentTier = getApplicableTier(product, currentQuantity);

  if (!product.pricing_tiers || product.pricing_tiers.length === 0) {
    return {
      currentTier: null,
      nextTier: null,
      additionalNeeded: null,
      potentialSavings: null,
    };
  }

  // Encontrar el siguiente tier con mejor descuento
  const sortedTiers = sortPricingTiersByQuantity(product.pricing_tiers);

  let nextTier: B2BPricingTier | null = null;

  for (const tier of sortedTiers) {
    // Buscar un tier que:
    // 1. Tenga un descuento mayor al actual
    // 2. Esté después de la cantidad actual
    if (
      tier.min_quantity > currentQuantity &&
      (!currentTier || tier.discount_percentage > currentTier.discount_percentage)
    ) {
      nextTier = tier;
      break;
    }
  }

  if (!nextTier) {
    return {
      currentTier,
      nextTier: null,
      additionalNeeded: null,
      potentialSavings: null,
    };
  }

  const additionalNeeded = nextTier.min_quantity - currentQuantity;
  const currentPricing = calculatePriceForQuantity(product, currentQuantity);
  const nextPricing = calculatePriceForQuantity(product, nextTier.min_quantity);
  const potentialSavings = currentPricing.total_price - nextPricing.total_price;

  return {
    currentTier,
    nextTier,
    additionalNeeded,
    potentialSavings,
  };
}

/**
 * Formatea un precio para mostrar en la UI
 */
export function formatPrice(price: number, currency: string = 'COP'): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

/**
 * Formatea un descuento para mostrar en la UI
 */
export function formatDiscount(discountPercentage: number): string {
  return `${discountPercentage.toFixed(0)}%`;
}
