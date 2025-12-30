/**
 * PRODUCTOS B2B PARA EMPRESAS - TUS AGUACATES
 *
 * Catálogo especializado para restaurantes, hoteles, catering y empresas.
 * ~30 productos de alta rotación con precios escalonados por volumen.
 */

export interface BusinessProductVariant {
  id: string;
  name: string;
  price: number;
  minKg: number;
  maxKg: number;
  pricePerKg: number;
  tier: 'tier1' | 'tier2' | 'tier3';
}

export interface BusinessProduct {
  id: string;
  name: string;
  description: string;
  category: string;
  categorySlug: string;
  unit: string;
  image?: string;
  variants: BusinessProductVariant[];
  available_for: 'business' | 'both';
  is_active: boolean;
  ripeness?: 'verde' | 'pinton' | 'maduro';
  ripenessDescription?: string;
  daysToRipen?: string;
}

// ============================================
// AGUACATES - 4 VARIEDADES x 3 ESTADOS = 12 PRODUCTOS
// ============================================

const AGUACATES_BUSINESS: BusinessProduct[] = [
  // AGUACATE HASS
  {
    id: 'b2b-aguacate-hass-verde',
    name: 'Aguacate Hass Verde',
    description: 'Aguacate Hass en estado verde, ideal para maduración controlada. Madura en 4-7 días.',
    category: 'Aguacates', categorySlug: 'aguacates', unit: 'kg',
    ripeness: 'verde', ripenessDescription: 'Madura en 4-7 días', daysToRipen: '4-7 días',
    available_for: 'business', is_active: true,
    variants: [
      { id: 'hass-verde-t1', name: '5-20 kg', price: 45000, minKg: 5, maxKg: 20, pricePerKg: 9000, tier: 'tier1' },
      { id: 'hass-verde-t2', name: '20-100 kg', price: 160000, minKg: 20, maxKg: 100, pricePerKg: 8000, tier: 'tier2' },
      { id: 'hass-verde-t3', name: '100-300 kg', price: 700000, minKg: 100, maxKg: 300, pricePerKg: 7000, tier: 'tier3' },
    ]
  },
  {
    id: 'b2b-aguacate-hass-pinton',
    name: 'Aguacate Hass Pintón',
    description: 'Aguacate Hass pintón, listo para consumo en 1-3 días.',
    category: 'Aguacates', categorySlug: 'aguacates', unit: 'kg',
    ripeness: 'pinton', ripenessDescription: 'Listo en 1-3 días', daysToRipen: '1-3 días',
    available_for: 'business', is_active: true,
    variants: [
      { id: 'hass-pinton-t1', name: '5-20 kg', price: 50000, minKg: 5, maxKg: 20, pricePerKg: 10000, tier: 'tier1' },
      { id: 'hass-pinton-t2', name: '20-100 kg', price: 180000, minKg: 20, maxKg: 100, pricePerKg: 9000, tier: 'tier2' },
      { id: 'hass-pinton-t3', name: '100-300 kg', price: 800000, minKg: 100, maxKg: 300, pricePerKg: 8000, tier: 'tier3' },
    ]
  },
  {
    id: 'b2b-aguacate-hass-maduro',
    name: 'Aguacate Hass Maduro',
    description: 'Aguacate Hass maduro, listo para consumo inmediato. Máximo 2-3 días.',
    category: 'Aguacates', categorySlug: 'aguacates', unit: 'kg',
    ripeness: 'maduro', ripenessDescription: 'Consumo inmediato', daysToRipen: '0-2 días',
    available_for: 'business', is_active: true,
    variants: [
      { id: 'hass-maduro-t1', name: '5-20 kg', price: 55000, minKg: 5, maxKg: 20, pricePerKg: 11000, tier: 'tier1' },
      { id: 'hass-maduro-t2', name: '20-100 kg', price: 200000, minKg: 20, maxKg: 100, pricePerKg: 10000, tier: 'tier2' },
      { id: 'hass-maduro-t3', name: '100-300 kg', price: 900000, minKg: 100, maxKg: 300, pricePerKg: 9000, tier: 'tier3' },
    ]
  },
  // AGUACATE PAPELILLO / LORENA
  {
    id: 'b2b-aguacate-papelillo-verde',
    name: 'Aguacate Papelillo Verde',
    description: 'Aguacate Papelillo (Lorena) verde. Madura en ~5 días.',
    category: 'Aguacates', categorySlug: 'aguacates', unit: 'kg',
    ripeness: 'verde', ripenessDescription: 'Madura en ~5 días', daysToRipen: '~5 días',
    available_for: 'business', is_active: true,
    variants: [
      { id: 'papelillo-verde-t1', name: '5-20 kg', price: 40000, minKg: 5, maxKg: 20, pricePerKg: 8000, tier: 'tier1' },
      { id: 'papelillo-verde-t2', name: '20-100 kg', price: 140000, minKg: 20, maxKg: 100, pricePerKg: 7000, tier: 'tier2' },
      { id: 'papelillo-verde-t3', name: '100-300 kg', price: 600000, minKg: 100, maxKg: 300, pricePerKg: 6000, tier: 'tier3' },
    ]
  },
  {
    id: 'b2b-aguacate-papelillo-pinton',
    name: 'Aguacate Papelillo Pintón',
    description: 'Aguacate Papelillo (Lorena) pintón. Listo en 1-3 días.',
    category: 'Aguacates', categorySlug: 'aguacates', unit: 'kg',
    ripeness: 'pinton', ripenessDescription: 'Listo en 1-3 días', daysToRipen: '1-3 días',
    available_for: 'business', is_active: true,
    variants: [
      { id: 'papelillo-pinton-t1', name: '5-20 kg', price: 45000, minKg: 5, maxKg: 20, pricePerKg: 9000, tier: 'tier1' },
      { id: 'papelillo-pinton-t2', name: '20-100 kg', price: 160000, minKg: 20, maxKg: 100, pricePerKg: 8000, tier: 'tier2' },
      { id: 'papelillo-pinton-t3', name: '100-300 kg', price: 700000, minKg: 100, maxKg: 300, pricePerKg: 7000, tier: 'tier3' },
    ]
  },
  {
    id: 'b2b-aguacate-papelillo-maduro',
    name: 'Aguacate Papelillo Maduro',
    description: 'Aguacate Papelillo (Lorena) maduro, consumo inmediato.',
    category: 'Aguacates', categorySlug: 'aguacates', unit: 'kg',
    ripeness: 'maduro', ripenessDescription: 'Consumo inmediato', daysToRipen: '0-2 días',
    available_for: 'business', is_active: true,
    variants: [
      { id: 'papelillo-maduro-t1', name: '5-20 kg', price: 50000, minKg: 5, maxKg: 20, pricePerKg: 10000, tier: 'tier1' },
      { id: 'papelillo-maduro-t2', name: '20-100 kg', price: 180000, minKg: 20, maxKg: 100, pricePerKg: 9000, tier: 'tier2' },
      { id: 'papelillo-maduro-t3', name: '100-300 kg', price: 800000, minKg: 100, maxKg: 300, pricePerKg: 8000, tier: 'tier3' },
    ]
  },
  // AGUACATE SEMIL
  {
    id: 'b2b-aguacate-semil-verde',
    name: 'Aguacate Semil Verde',
    description: 'Aguacate Semil verde. Madura en ~6 días.',
    category: 'Aguacates', categorySlug: 'aguacates', unit: 'kg',
    ripeness: 'verde', ripenessDescription: 'Madura en ~6 días', daysToRipen: '~6 días',
    available_for: 'business', is_active: true,
    variants: [
      { id: 'semil-verde-t1', name: '5-20 kg', price: 42000, minKg: 5, maxKg: 20, pricePerKg: 8400, tier: 'tier1' },
      { id: 'semil-verde-t2', name: '20-100 kg', price: 148000, minKg: 20, maxKg: 100, pricePerKg: 7400, tier: 'tier2' },
      { id: 'semil-verde-t3', name: '100-300 kg', price: 640000, minKg: 100, maxKg: 300, pricePerKg: 6400, tier: 'tier3' },
    ]
  },
  {
    id: 'b2b-aguacate-semil-pinton',
    name: 'Aguacate Semil Pintón',
    description: 'Aguacate Semil pintón. Listo en 1-3 días.',
    category: 'Aguacates', categorySlug: 'aguacates', unit: 'kg',
    ripeness: 'pinton', ripenessDescription: 'Listo en 1-3 días', daysToRipen: '1-3 días',
    available_for: 'business', is_active: true,
    variants: [
      { id: 'semil-pinton-t1', name: '5-20 kg', price: 47000, minKg: 5, maxKg: 20, pricePerKg: 9400, tier: 'tier1' },
      { id: 'semil-pinton-t2', name: '20-100 kg', price: 168000, minKg: 20, maxKg: 100, pricePerKg: 8400, tier: 'tier2' },
      { id: 'semil-pinton-t3', name: '100-300 kg', price: 740000, minKg: 100, maxKg: 300, pricePerKg: 7400, tier: 'tier3' },
    ]
  },
  {
    id: 'b2b-aguacate-semil-maduro',
    name: 'Aguacate Semil Maduro',
    description: 'Aguacate Semil maduro, consumo inmediato.',
    category: 'Aguacates', categorySlug: 'aguacates', unit: 'kg',
    ripeness: 'maduro', ripenessDescription: 'Consumo inmediato', daysToRipen: '0-2 días',
    available_for: 'business', is_active: true,
    variants: [
      { id: 'semil-maduro-t1', name: '5-20 kg', price: 52000, minKg: 5, maxKg: 20, pricePerKg: 10400, tier: 'tier1' },
      { id: 'semil-maduro-t2', name: '20-100 kg', price: 188000, minKg: 20, maxKg: 100, pricePerKg: 9400, tier: 'tier2' },
      { id: 'semil-maduro-t3', name: '100-300 kg', price: 840000, minKg: 100, maxKg: 300, pricePerKg: 8400, tier: 'tier3' },
    ]
  },
  // AGUACATE CHOQUETTE
  {
    id: 'b2b-aguacate-choquette-verde',
    name: 'Aguacate Choquette Verde',
    description: 'Aguacate Choquette verde, variedad grande y cremosa.',
    category: 'Aguacates', categorySlug: 'aguacates', unit: 'kg',
    ripeness: 'verde', ripenessDescription: 'Madura en 5-7 días', daysToRipen: '5-7 días',
    available_for: 'business', is_active: true,
    variants: [
      { id: 'choquette-verde-t1', name: '5-20 kg', price: 48000, minKg: 5, maxKg: 20, pricePerKg: 9600, tier: 'tier1' },
      { id: 'choquette-verde-t2', name: '20-100 kg', price: 172000, minKg: 20, maxKg: 100, pricePerKg: 8600, tier: 'tier2' },
      { id: 'choquette-verde-t3', name: '100-300 kg', price: 760000, minKg: 100, maxKg: 300, pricePerKg: 7600, tier: 'tier3' },
    ]
  },
  {
    id: 'b2b-aguacate-choquette-pinton',
    name: 'Aguacate Choquette Pintón',
    description: 'Aguacate Choquette pintón. Listo en 1-3 días.',
    category: 'Aguacates', categorySlug: 'aguacates', unit: 'kg',
    ripeness: 'pinton', ripenessDescription: 'Listo en 1-3 días', daysToRipen: '1-3 días',
    available_for: 'business', is_active: true,
    variants: [
      { id: 'choquette-pinton-t1', name: '5-20 kg', price: 53000, minKg: 5, maxKg: 20, pricePerKg: 10600, tier: 'tier1' },
      { id: 'choquette-pinton-t2', name: '20-100 kg', price: 192000, minKg: 20, maxKg: 100, pricePerKg: 9600, tier: 'tier2' },
      { id: 'choquette-pinton-t3', name: '100-300 kg', price: 860000, minKg: 100, maxKg: 300, pricePerKg: 8600, tier: 'tier3' },
    ]
  },
  {
    id: 'b2b-aguacate-choquette-maduro',
    name: 'Aguacate Choquette Maduro',
    description: 'Aguacate Choquette maduro, textura cremosa excepcional.',
    category: 'Aguacates', categorySlug: 'aguacates', unit: 'kg',
    ripeness: 'maduro', ripenessDescription: 'Consumo inmediato', daysToRipen: '0-2 días',
    available_for: 'business', is_active: true,
    variants: [
      { id: 'choquette-maduro-t1', name: '5-20 kg', price: 58000, minKg: 5, maxKg: 20, pricePerKg: 11600, tier: 'tier1' },
      { id: 'choquette-maduro-t2', name: '20-100 kg', price: 212000, minKg: 20, maxKg: 100, pricePerKg: 10600, tier: 'tier2' },
      { id: 'choquette-maduro-t3', name: '100-300 kg', price: 960000, minKg: 100, maxKg: 300, pricePerKg: 9600, tier: 'tier3' },
    ]
  },
];

// ============================================
// FRUTAS TROPICALES - Los más usados en HORECA
// ============================================

const FRUTAS_TROPICALES_BUSINESS: BusinessProduct[] = [
  {
    id: 'b2b-limon-tahiti', name: 'Limón Tahití',
    description: 'Limón Tahití fresco, ideal para bebidas, coctelería y cocina.',
    category: 'Frutas Tropicales', categorySlug: 'frutas-tropicales', unit: 'kg',
    available_for: 'business', is_active: true,
    variants: [
      { id: 'limon-t1', name: '3-10 kg', price: 21000, minKg: 3, maxKg: 10, pricePerKg: 7000, tier: 'tier1' },
      { id: 'limon-t2', name: '10-50 kg', price: 65000, minKg: 10, maxKg: 50, pricePerKg: 6500, tier: 'tier2' },
      { id: 'limon-t3', name: '50-100 kg', price: 300000, minKg: 50, maxKg: 100, pricePerKg: 6000, tier: 'tier3' },
    ]
  },
  {
    id: 'b2b-naranja-valencia', name: 'Naranja Valencia',
    description: 'Naranja Valencia para jugo, ideal para desayunos en hoteles.',
    category: 'Frutas Tropicales', categorySlug: 'frutas-tropicales', unit: 'kg',
    available_for: 'business', is_active: true,
    variants: [
      { id: 'naranja-t1', name: '5-20 kg', price: 30000, minKg: 5, maxKg: 20, pricePerKg: 6000, tier: 'tier1' },
      { id: 'naranja-t2', name: '20-50 kg', price: 55000, minKg: 20, maxKg: 50, pricePerKg: 5500, tier: 'tier2' },
      { id: 'naranja-t3', name: '50-100 kg', price: 250000, minKg: 50, maxKg: 100, pricePerKg: 5000, tier: 'tier3' },
    ]
  },
  {
    id: 'b2b-banano-criollo', name: 'Banano Criollo',
    description: 'Banano criollo colombiano, esencial para desayunos y postres.',
    category: 'Frutas Tropicales', categorySlug: 'frutas-tropicales', unit: 'kg',
    available_for: 'business', is_active: true,
    variants: [
      { id: 'banano-t1', name: '5-20 kg', price: 20000, minKg: 5, maxKg: 20, pricePerKg: 4000, tier: 'tier1' },
      { id: 'banano-t2', name: '20-50 kg', price: 35000, minKg: 20, maxKg: 50, pricePerKg: 3500, tier: 'tier2' },
      { id: 'banano-t3', name: '50-100 kg', price: 150000, minKg: 50, maxKg: 100, pricePerKg: 3000, tier: 'tier3' },
    ]
  },
  {
    id: 'b2b-mango-azucar', name: 'Mango de Azúcar',
    description: 'Mango de azúcar dulce y aromático para postres y jugos.',
    category: 'Frutas Tropicales', categorySlug: 'frutas-tropicales', unit: 'kg',
    available_for: 'business', is_active: true,
    variants: [
      { id: 'mango-t1', name: '3-10 kg', price: 30000, minKg: 3, maxKg: 10, pricePerKg: 10000, tier: 'tier1' },
      { id: 'mango-t2', name: '10-30 kg', price: 85000, minKg: 10, maxKg: 30, pricePerKg: 8500, tier: 'tier2' },
      { id: 'mango-t3', name: '30-50 kg', price: 200000, minKg: 30, maxKg: 50, pricePerKg: 8000, tier: 'tier3' },
    ]
  },
  {
    id: 'b2b-lulo', name: 'Lulo',
    description: 'Lulo fresco para jugos, una de las frutas más demandadas.',
    category: 'Frutas Tropicales', categorySlug: 'frutas-tropicales', unit: 'kg',
    available_for: 'business', is_active: true,
    variants: [
      { id: 'lulo-t1', name: '3-10 kg', price: 30000, minKg: 3, maxKg: 10, pricePerKg: 10000, tier: 'tier1' },
      { id: 'lulo-t2', name: '10-30 kg', price: 85000, minKg: 10, maxKg: 30, pricePerKg: 8500, tier: 'tier2' },
      { id: 'lulo-t3', name: '30-50 kg', price: 200000, minKg: 30, maxKg: 50, pricePerKg: 8000, tier: 'tier3' },
    ]
  },
];

// ============================================
// FRUTOS ROJOS - Alta demanda en pastelería
// ============================================

const FRUTOS_ROJOS_BUSINESS: BusinessProduct[] = [
  {
    id: 'b2b-fresas-premium', name: 'Fresas Premium',
    description: 'Fresas premium para postres, decoración y coctelería.',
    category: 'Frutos Rojos', categorySlug: 'frutos-rojos', unit: 'kg',
    available_for: 'business', is_active: true,
    variants: [
      { id: 'fresas-t1', name: '3-10 kg', price: 36000, minKg: 3, maxKg: 10, pricePerKg: 12000, tier: 'tier1' },
      { id: 'fresas-t2', name: '10-30 kg', price: 102000, minKg: 10, maxKg: 30, pricePerKg: 10200, tier: 'tier2' },
      { id: 'fresas-t3', name: '30-50 kg', price: 240000, minKg: 30, maxKg: 50, pricePerKg: 9600, tier: 'tier3' },
    ]
  },
  {
    id: 'b2b-arandanos', name: 'Arándanos Orgánicos',
    description: 'Arándanos orgánicos, superfood muy demandado.',
    category: 'Frutos Rojos', categorySlug: 'frutos-rojos', unit: 'kg',
    available_for: 'business', is_active: true,
    variants: [
      { id: 'arandanos-t1', name: '1-5 kg', price: 75000, minKg: 1, maxKg: 5, pricePerKg: 75000, tier: 'tier1' },
      { id: 'arandanos-t2', name: '5-15 kg', price: 337500, minKg: 5, maxKg: 15, pricePerKg: 67500, tier: 'tier2' },
      { id: 'arandanos-t3', name: '15-30 kg', price: 900000, minKg: 15, maxKg: 30, pricePerKg: 60000, tier: 'tier3' },
    ]
  },
  {
    id: 'b2b-mora', name: 'Mora de Castilla',
    description: 'Mora de castilla fresca para jugos, postres y salsas.',
    category: 'Frutos Rojos', categorySlug: 'frutos-rojos', unit: 'kg',
    available_for: 'business', is_active: true,
    variants: [
      { id: 'mora-t1', name: '3-10 kg', price: 27000, minKg: 3, maxKg: 10, pricePerKg: 9000, tier: 'tier1' },
      { id: 'mora-t2', name: '10-30 kg', price: 76500, minKg: 10, maxKg: 30, pricePerKg: 8500, tier: 'tier2' },
      { id: 'mora-t3', name: '30-50 kg', price: 200000, minKg: 30, maxKg: 50, pricePerKg: 8000, tier: 'tier3' },
    ]
  },
];

// ============================================
// GOURMET / VERDURAS - Esenciales en cocina
// ============================================

const GOURMET_BUSINESS: BusinessProduct[] = [
  {
    id: 'b2b-tomate-chonto', name: 'Tomate Chonto',
    description: 'Tomate chonto fresco, ingrediente básico.',
    category: 'Gourmet', categorySlug: 'gourmet', unit: 'kg',
    available_for: 'business', is_active: true,
    variants: [
      { id: 'tomate-t1', name: '5-20 kg', price: 20000, minKg: 5, maxKg: 20, pricePerKg: 4000, tier: 'tier1' },
      { id: 'tomate-t2', name: '20-50 kg', price: 35000, minKg: 20, maxKg: 50, pricePerKg: 3500, tier: 'tier2' },
      { id: 'tomate-t3', name: '50-100 kg', price: 150000, minKg: 50, maxKg: 100, pricePerKg: 3000, tier: 'tier3' },
    ]
  },
  {
    id: 'b2b-cebolla-cabezona', name: 'Cebolla Cabezona Blanca',
    description: 'Cebolla cabezona blanca, esencial en cocina profesional.',
    category: 'Gourmet', categorySlug: 'gourmet', unit: 'kg',
    available_for: 'business', is_active: true,
    variants: [
      { id: 'cebolla-t1', name: '5-20 kg', price: 17500, minKg: 5, maxKg: 20, pricePerKg: 3500, tier: 'tier1' },
      { id: 'cebolla-t2', name: '20-50 kg', price: 30000, minKg: 20, maxKg: 50, pricePerKg: 3000, tier: 'tier2' },
      { id: 'cebolla-t3', name: '50-100 kg', price: 125000, minKg: 50, maxKg: 100, pricePerKg: 2500, tier: 'tier3' },
    ]
  },
  {
    id: 'b2b-pimenton', name: 'Pimentón Mixto',
    description: 'Pimentón rojo, verde y amarillo para todo tipo de platos.',
    category: 'Gourmet', categorySlug: 'gourmet', unit: 'kg',
    available_for: 'business', is_active: true,
    variants: [
      { id: 'pimenton-t1', name: '3-10 kg', price: 27000, minKg: 3, maxKg: 10, pricePerKg: 9000, tier: 'tier1' },
      { id: 'pimenton-t2', name: '10-30 kg', price: 76500, minKg: 10, maxKg: 30, pricePerKg: 8500, tier: 'tier2' },
      { id: 'pimenton-t3', name: '30-50 kg', price: 200000, minKg: 30, maxKg: 50, pricePerKg: 8000, tier: 'tier3' },
    ]
  },
  {
    id: 'b2b-zanahoria', name: 'Zanahoria',
    description: 'Zanahoria fresca para ensaladas, sopas y guarniciones.',
    category: 'Gourmet', categorySlug: 'gourmet', unit: 'kg',
    available_for: 'business', is_active: true,
    variants: [
      { id: 'zanahoria-t1', name: '5-20 kg', price: 15000, minKg: 5, maxKg: 20, pricePerKg: 3000, tier: 'tier1' },
      { id: 'zanahoria-t2', name: '20-50 kg', price: 25000, minKg: 20, maxKg: 50, pricePerKg: 2500, tier: 'tier2' },
      { id: 'zanahoria-t3', name: '50-100 kg', price: 100000, minKg: 50, maxKg: 100, pricePerKg: 2000, tier: 'tier3' },
    ]
  },
  {
    id: 'b2b-ajo', name: 'Ajo Nacional',
    description: 'Ajo nacional fresco, ingrediente esencial.',
    category: 'Gourmet', categorySlug: 'gourmet', unit: 'kg',
    available_for: 'business', is_active: true,
    variants: [
      { id: 'ajo-t1', name: '1-5 kg', price: 40000, minKg: 1, maxKg: 5, pricePerKg: 40000, tier: 'tier1' },
      { id: 'ajo-t2', name: '5-15 kg', price: 175000, minKg: 5, maxKg: 15, pricePerKg: 35000, tier: 'tier2' },
      { id: 'ajo-t3', name: '15-30 kg', price: 450000, minKg: 15, maxKg: 30, pricePerKg: 30000, tier: 'tier3' },
    ]
  },
  {
    id: 'b2b-champinones', name: 'Champiñones Enteros',
    description: 'Champiñones blancos frescos, versátiles.',
    category: 'Gourmet', categorySlug: 'gourmet', unit: 'kg',
    available_for: 'business', is_active: true,
    variants: [
      { id: 'champinones-t1', name: '2-5 kg', price: 60000, minKg: 2, maxKg: 5, pricePerKg: 30000, tier: 'tier1' },
      { id: 'champinones-t2', name: '5-15 kg', price: 130000, minKg: 5, maxKg: 15, pricePerKg: 26000, tier: 'tier2' },
      { id: 'champinones-t3', name: '15-30 kg', price: 360000, minKg: 15, maxKg: 30, pricePerKg: 24000, tier: 'tier3' },
    ]
  },
  {
    id: 'b2b-lechuga', name: 'Lechuga Hidropónica',
    description: 'Lechuga hidropónica premium para ensaladas.',
    category: 'Gourmet', categorySlug: 'gourmet', unit: 'unidad',
    available_for: 'business', is_active: true,
    variants: [
      { id: 'lechuga-t1', name: '10-30 unidades', price: 45000, minKg: 10, maxKg: 30, pricePerKg: 4500, tier: 'tier1' },
      { id: 'lechuga-t2', name: '30-60 unidades', price: 80000, minKg: 30, maxKg: 60, pricePerKg: 4000, tier: 'tier2' },
      { id: 'lechuga-t3', name: '60-100 unidades', price: 175000, minKg: 60, maxKg: 100, pricePerKg: 3500, tier: 'tier3' },
    ]
  },
];

// ============================================
// AROMÁTICAS
// ============================================

const AROMATICAS_BUSINESS: BusinessProduct[] = [
  {
    id: 'b2b-cilantro', name: 'Cilantro Fresco',
    description: 'Cilantro fresco, aromático esencial.',
    category: 'Aromáticas', categorySlug: 'aromaticas', unit: 'kg',
    available_for: 'business', is_active: true,
    variants: [
      { id: 'cilantro-t1', name: '1-3 kg', price: 24000, minKg: 1, maxKg: 3, pricePerKg: 24000, tier: 'tier1' },
      { id: 'cilantro-t2', name: '3-10 kg', price: 60000, minKg: 3, maxKg: 10, pricePerKg: 20000, tier: 'tier2' },
      { id: 'cilantro-t3', name: '10-20 kg', price: 180000, minKg: 10, maxKg: 20, pricePerKg: 18000, tier: 'tier3' },
    ]
  },
  {
    id: 'b2b-albahaca', name: 'Albahaca Fresca',
    description: 'Albahaca fresca para pastas y pizzas.',
    category: 'Aromáticas', categorySlug: 'aromaticas', unit: 'kg',
    available_for: 'business', is_active: true,
    variants: [
      { id: 'albahaca-t1', name: '0.5-2 kg', price: 60000, minKg: 0.5, maxKg: 2, pricePerKg: 60000, tier: 'tier1' },
      { id: 'albahaca-t2', name: '2-5 kg', price: 100000, minKg: 2, maxKg: 5, pricePerKg: 50000, tier: 'tier2' },
      { id: 'albahaca-t3', name: '5-10 kg', price: 225000, minKg: 5, maxKg: 10, pricePerKg: 45000, tier: 'tier3' },
    ]
  },
];

// ============================================
// SALUDABLES
// ============================================

const SALUDABLES_BUSINESS: BusinessProduct[] = [
  {
    id: 'b2b-jengibre', name: 'Jengibre Fresco',
    description: 'Jengibre fresco, superfood para bebidas y cocina.',
    category: 'Saludables', categorySlug: 'saludables', unit: 'kg',
    available_for: 'business', is_active: true,
    variants: [
      { id: 'jengibre-t1', name: '1-3 kg', price: 36000, minKg: 1, maxKg: 3, pricePerKg: 36000, tier: 'tier1' },
      { id: 'jengibre-t2', name: '3-10 kg', price: 96000, minKg: 3, maxKg: 10, pricePerKg: 32000, tier: 'tier2' },
      { id: 'jengibre-t3', name: '10-20 kg', price: 280000, minKg: 10, maxKg: 20, pricePerKg: 28000, tier: 'tier3' },
    ]
  },
];

// ============================================
// DESGRANADOS
// ============================================

const DESGRANADOS_BUSINESS: BusinessProduct[] = [
  {
    id: 'b2b-arveja', name: 'Arveja Desgranada',
    description: 'Arveja desgranada fresca, lista para cocinar.',
    category: 'Desgranados', categorySlug: 'desgranados', unit: 'kg',
    available_for: 'business', is_active: true,
    variants: [
      { id: 'arveja-t1', name: '3-10 kg', price: 36000, minKg: 3, maxKg: 10, pricePerKg: 12000, tier: 'tier1' },
      { id: 'arveja-t2', name: '10-30 kg', price: 102000, minKg: 10, maxKg: 30, pricePerKg: 10200, tier: 'tier2' },
      { id: 'arveja-t3', name: '30-50 kg', price: 240000, minKg: 30, maxKg: 50, pricePerKg: 9600, tier: 'tier3' },
    ]
  },
];

// ============================================
// EXPORTAR TODO
// ============================================

export const BUSINESS_PRODUCTS: BusinessProduct[] = [
  ...AGUACATES_BUSINESS,
  ...FRUTAS_TROPICALES_BUSINESS,
  ...FRUTOS_ROJOS_BUSINESS,
  ...GOURMET_BUSINESS,
  ...AROMATICAS_BUSINESS,
  ...SALUDABLES_BUSINESS,
  ...DESGRANADOS_BUSINESS,
];

export const BUSINESS_CATEGORIES = [
  { slug: 'aguacates', name: 'Aguacates', icon: '🥑' },
  { slug: 'frutas-tropicales', name: 'Frutas Tropicales', icon: '🍊' },
  { slug: 'frutos-rojos', name: 'Frutos Rojos', icon: '🍓' },
  { slug: 'gourmet', name: 'Gourmet', icon: '🍅' },
  { slug: 'aromaticas', name: 'Aromáticas', icon: '🌿' },
  { slug: 'saludables', name: 'Saludables', icon: '🥗' },
  { slug: 'desgranados', name: 'Desgranados', icon: '🌽' },
];

export function getBusinessProductsByCategory(categorySlug: string): BusinessProduct[] {
  return BUSINESS_PRODUCTS.filter(p => p.categorySlug === categorySlug && p.is_active);
}

export function getBusinessProductById(id: string): BusinessProduct | undefined {
  return BUSINESS_PRODUCTS.find(p => p.id === id);
}

export function getAguacatesB2B(): BusinessProduct[] {
  return AGUACATES_BUSINESS.filter(p => p.is_active);
}

console.log('📦 Productos B2B cargados:', BUSINESS_PRODUCTS.length, 'productos');
