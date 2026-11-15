// Configuración de proveedores y bodegas
// Sistema inteligente para optimizar compras

export interface Supplier {
  id: string;
  name: string;
  color: string;
  icon: string;
  order: number; // Orden en la ruta de compras
  location?: string;
}

export interface ProductSupplierMapping {
  productName: string;
  supplierId: string;
  priority: number; // 1 = principal, 2 = alternativo
  note?: string;
  sub_location_hint?: string;
  fallback_zone_id?: string;
  ghost?: boolean;
}

export const SUPPLIERS: Supplier[] = [
  {
    id: 'medio-fruver',
    name: 'Medio Frúver',
    color: 'blue',
    icon: '🍌',
    order: 1,
    location: 'Medio Frúver'
  },
  {
    id: 'hierbas',
    name: 'Bodega de Hierbas',
    color: 'green',
    icon: '🌿',
    order: 1,
    location: 'Ubicación 1'
  },
  {
    id: 'especies',
    name: 'Bodega de Especias',
    color: 'orange',
    icon: '🌶️',
    order: 2,
    location: 'Ubicación 2'
  },
  {
    id: 'reina',
    name: 'Bodega La Reina (Frutas)',
    color: 'red',
    icon: '🍎',
    order: 3,
    location: 'Corabastos - Puesto 30'
  },
  {
    id: 'aguacates',
    name: 'Bodega de Aguacates',
    color: 'purple',
    icon: '🥑',
    order: 4,
    location: 'Nuestra ubicación'
  },
  {
    id: 'popular',
    name: 'Bodega Popular',
    color: 'purple',
    icon: '🛒',
    order: 5,
    location: 'Mayorista / Minorista'
  }
];

// Mapeo inicial de productos a proveedores
// NOTA: El usuario va a ir completando esto basado en experiencia real
export const PRODUCT_SUPPLIER_MAPPING: ProductSupplierMapping[] = [
  // === BODEGA DE HIERBAS ===
  {
    productName: 'diente de león',
    supplierId: 'hierbas',
    priority: 1
  },
  {
    productName: 'cebolla puerro',
    supplierId: 'hierbas',
    priority: 1
  },
  {
    productName: 'apio',
    supplierId: 'hierbas',
    priority: 1,
    note: 'Apio Entero paquete, tallos bandeja, bandeja'
  },
  {
    productName: 'perejil',
    supplierId: 'hierbas',
    priority: 1
  },
  {
    productName: 'cilantro',
    supplierId: 'hierbas',
    priority: 1
  },
  {
    productName: 'espinacas',
    supplierId: 'hierbas',
    priority: 1,
    note: 'Se compran en hierbas o especias'
  },
  {
    productName: 'tomate cherry',
    supplierId: 'hierbas',
    priority: 1
  },
  {
    productName: 'champiñones',
    supplierId: 'hierbas',
    priority: 1
  },
  {
    productName: 'germinados',
    supplierId: 'hierbas',
    priority: 1
  },

  // === BODEGA DE ESPECIAS ===
  {
    productName: 'cebolla',
    supplierId: 'especies',
    priority: 1,
    note: 'Cebolla cabezona blanca, Ocañera, Puerro, Larga malla'
  },
  {
    productName: 'tomate',
    supplierId: 'especies',
    priority: 1
  },
  {
    productName: 'limón',
    supplierId: 'especies',
    priority: 1,
    note: 'Limón Tahití y Limón Mandarina'
  },
  {
    productName: 'pepino',
    supplierId: 'especies',
    priority: 1
  },
  {
    productName: 'cohombro',
    supplierId: 'especies',
    priority: 1
  },
  {
    productName: 'pimentones',
    supplierId: 'especies',
    priority: 1
  },
  {
    productName: 'zanahoria',
    supplierId: 'especies',
    priority: 1
  },
  {
    productName: 'mandarina',
    supplierId: 'especies',
    priority: 1
  },
  {
    productName: 'mango',
    supplierId: 'especies',
    priority: 1,
    note: 'Mango Azúcar y Mango Común - para separar del apio'
  },
  {
    productName: 'banano',
    supplierId: 'especies',
    priority: 1,
    note: 'Banano criollo/bocadillo'
  },
  {
    productName: 'arándanos',
    supplierId: 'especies',
    priority: 2,
    note: 'A veces más barato aquí, pero también en Reina'
  },
  {
    productName: 'pasta de ajo',
    supplierId: 'especies',
    priority: 1
  },
  {
    productName: 'jengibre',
    supplierId: 'especies',
    priority: 2,
    note: 'A veces en Reina (Puesto 30)'
  },
  {
    productName: 'cúrcuma',
    supplierId: 'especies',
    priority: 2,
    note: 'A veces en Reina (Puesto 30)'
  },
  {
    productName: 'miel de abejas',
    supplierId: 'especies',
    priority: 2,
    note: 'Miel de Abejas 100% Natural'
  },

  // === BODEGA DE FRUTAS (REINA) ===
  {
    productName: 'mangostinos',
    supplierId: 'reina',
    priority: 1
  },
  {
    productName: 'sandía',
    supplierId: 'reina',
    priority: 1
  },
  {
    productName: 'duraznos',
    supplierId: 'reina',
    priority: 1
  },
  {
    productName: 'manzana',
    supplierId: 'reina',
    priority: 1
  },
  {
    productName: 'granadilla',
    supplierId: 'reina',
    priority: 1
  },
  {
    productName: 'toronja',
    supplierId: 'reina',
    priority: 1,
    note: 'Se vende por kilo, variantes: x1000 grs, x1kilo'
  },
  {
    productName: 'fresas',
    supplierId: 'reina',
    priority: 2,
    note: 'A veces disponible'
  },
  {
    productName: 'arándanos',
    supplierId: 'reina',
    priority: 1,
    note: 'Arándanos Orgánicos - Jessica (dentro de Reina)'
  },
  {
    productName: 'uva',
    supplierId: 'reina',
    priority: 1,
    note: 'Jessica: uvas sin semilla, uvas red glob'
  },
  {
    productName: 'peras',
    supplierId: 'reina',
    priority: 1
  },
  {
    productName: 'frambuesas',
    supplierId: 'reina',
    priority: 1
  },
  {
    productName: 'moras',
    supplierId: 'reina',
    priority: 1,
    note: 'Mora Real Norteamericana'
  },
  {
    productName: 'cerezas',
    supplierId: 'reina',
    priority: 1
  },
  {
    productName: 'batata',
    supplierId: 'reina',
    priority: 1
  },
  {
    productName: 'flor de jamaica',
    supplierId: 'reina',
    priority: 1
  },
  {
    productName: 'arándanos orgánicos',
    supplierId: 'reina',
    priority: 1,
    note: 'Jessica'
  },

  // === BODEGA DE AGUACATES ===
  {
    productName: 'aguacate',
    supplierId: 'aguacates',
    priority: 1,
    note: 'Último en el recorrido'
  },
  {
    productName: 'caja de aguacates',
    supplierId: 'aguacates',
    priority: 1
  },
  {
    productName: 'botella de aceite',
    supplierId: 'aguacates',
    priority: 1
  },
  {
    productName: 'combo',
    supplierId: 'aguacates',
    priority: 1,
    note: 'Combos que incluyen aguacates'
  },
  // === PRODUCTOS FALTANTES PARA AGREGAR ===
  {
    productName: 'uva red glob',
    supplierId: 'reina',
    priority: 1
  },
  {
    productName: 'uva blanca',
    supplierId: 'reina',
    priority: 1
  },
  {
    productName: 'tomate uvalina',
    supplierId: 'especies',
    priority: 1
  },
  {
    productName: 'naranja valencia',
    supplierId: 'reina',
    priority: 1,
    note: 'En malla, para separar del apio'
  },
  {
    productName: 'sandía grande',
    supplierId: 'reina',
    priority: 1,
    note: 'No se utiliza, solo Sandía Baby'
  },
  {
    productName: 'durazno rojo',
    supplierId: 'reina',
    priority: 1,
    note: 'No se utiliza, solo Duraznos'
  },
  {
    productName: 'melón',
    supplierId: 'reina',
    priority: 1,
    note: 'No se tiene en el sistema'
  },
];

/** Authoritative exact routing for the current 25-item purchase list. */
export const PURCHASE_PRODUCT_SUPPLIER_MAPPING: ProductSupplierMapping[] = [
  { productName: 'Maracuyá', supplierId: 'especies', priority: 1, sub_location_hint: '📍 Alero Sur' },
  { productName: 'Lechuga Hidropónica', supplierId: 'hierbas', priority: 1 },
  { productName: 'Mandarina', supplierId: 'especies', priority: 1, sub_location_hint: '📍 Alero Sur' },
  { productName: 'Coliflor', supplierId: 'hierbas', priority: 1 },
  { productName: 'Plátano verde', supplierId: 'hierbas', priority: 1 },
  { productName: 'Batata Rosada', supplierId: 'especies', priority: 1 },
  { productName: 'Brócoli', supplierId: 'hierbas', priority: 1 },
  { productName: 'Eucalipto', supplierId: 'hierbas', priority: 1 },
  { productName: 'Mazorca desgranada fresca', supplierId: 'especies', priority: 1 },
  { productName: 'Rúcula', supplierId: 'hierbas', priority: 1 },
  { productName: 'Ajo Nacional', supplierId: 'especies', priority: 1 },
  { productName: 'Auyama Sakata', supplierId: 'especies', priority: 1 },
  { productName: 'Chiles', supplierId: 'especies', priority: 1 },
  { productName: 'Cidra', supplierId: 'especies', priority: 1 },
  { productName: 'Ciruela nacional', supplierId: 'reina', priority: 1 },
  { productName: 'Espárragos', supplierId: 'hierbas', priority: 1 },
  { productName: 'Granada', supplierId: 'reina', priority: 1 },
  { productName: 'Kale crespo', supplierId: 'hierbas', priority: 1 },
  { productName: 'Red Globe nacional', supplierId: 'reina', priority: 1 },
  { productName: 'Sandía Baby', supplierId: 'reina', priority: 1 },
  { productName: 'Acelga', supplierId: 'hierbas', priority: 1 },
  { productName: 'Albahaca', supplierId: 'hierbas', priority: 1 },
  { productName: 'Arveja en vaina', supplierId: 'especies', priority: 1 },
  { productName: 'Berenjena', supplierId: 'hierbas', priority: 1, fallback_zone_id: 'especies' },
  { productName: 'Cebollín', supplierId: 'hierbas', priority: 1 },
];

export const DEFINITIVE_PRODUCT_SUPPLIER_MAPPING: ProductSupplierMapping[] = [
  { productName: 'Banano criollo', supplierId: 'medio-fruver', priority: 1 },
  { productName: 'Mango Azúcar', supplierId: 'medio-fruver', priority: 1 },
  { productName: 'Mango Común', supplierId: 'medio-fruver', priority: 1 },
  { productName: 'Papa sabanera', supplierId: 'medio-fruver', priority: 1 },
  { productName: 'Limón Tahití', supplierId: 'especies', priority: 1, sub_location_hint: '📍 Costado Sur' },
  { productName: 'Limón Mandarino', supplierId: 'especies', priority: 1, sub_location_hint: '📍 Costado Sur' },
  { productName: 'Tomate chonto', supplierId: 'especies', priority: 1, sub_location_hint: '📍 Alero Sur' },
  { productName: 'Tomate chonto tamaño mixto', supplierId: 'especies', priority: 1, sub_location_hint: '📍 Alero Sur' },
  { productName: 'Cebolla cabezona blanca', supplierId: 'especies', priority: 1 },
  { productName: 'Cebolla larga', supplierId: 'especies', priority: 1, sub_location_hint: '📍 Alero Sur' },
  { productName: 'Zanahoria', supplierId: 'especies', priority: 1, sub_location_hint: '📍 Alero Sur' },
  { productName: 'Pepino cohombro', supplierId: 'especies', priority: 1, sub_location_hint: '📍 Alero Sur' },
  { productName: 'Pimentón', supplierId: 'especies', priority: 1, sub_location_hint: '📍 Alero Sur' },
  { productName: 'Agraz', supplierId: 'especies', priority: 1, note: 'Paquete de 125g' },
  { productName: 'Tomate uvalina', supplierId: 'hierbas', priority: 1 },
  { productName: 'Tomate cherry', supplierId: 'hierbas', priority: 1 },
  { productName: 'Banano bocadillo', supplierId: 'reina', priority: 1 },
  { productName: 'Naranja Valencia', supplierId: 'reina', priority: 1, note: 'Mallas' },
  { productName: 'Fresas Premium', supplierId: 'reina', priority: 1 },
  { productName: 'Fresa Económica', supplierId: 'reina', priority: 1 },
  { productName: 'Frambuesas', supplierId: 'reina', priority: 1 },
  { productName: 'Moras', supplierId: 'reina', priority: 1 },
  { productName: 'Mora Real Norteamericana', supplierId: 'reina', priority: 1 },
  { productName: 'Uvas', supplierId: 'reina', priority: 1 },
  { productName: 'Manzanas', supplierId: 'reina', priority: 1 },
  { productName: 'Peras', supplierId: 'reina', priority: 1 },
  { productName: 'Kiwi', supplierId: 'reina', priority: 1 },
  { productName: 'Granadilla', supplierId: 'reina', priority: 1 },
  { productName: 'Toronja', supplierId: 'reina', priority: 1 },
  { productName: 'Duraznos', supplierId: 'popular', priority: 1, sub_location_hint: '📍 Mayorista' },
  { productName: 'Arándanos Orgánicos', supplierId: 'popular', priority: 1, sub_location_hint: '📍 Minorista', fallback_zone_id: 'reina' },
  { productName: 'Mangostinos', supplierId: 'popular', priority: 1, sub_location_hint: '📍 Minorista', fallback_zone_id: 'reina' },
  { productName: 'Piña', supplierId: 'unresolved', priority: 1, ghost: true },
  { productName: 'Semillas de Jessica', supplierId: 'unresolved', priority: 1, ghost: true },
];


export function normalizeSupplierProductName(productName: string): string {
  return productName.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();
}

export function isUnresolvedPurchaseProduct(productName: string): boolean {
  const normalizedName = normalizeSupplierProductName(productName);
  return DEFINITIVE_PRODUCT_SUPPLIER_MAPPING.some(mapping => mapping.ghost && normalizeSupplierProductName(mapping.productName) === normalizedName);
}

export function findPurchaseSupplierForProduct(productName: string): ProductSupplierMapping | null {
  const normalizedName = normalizeSupplierProductName(productName);
  const definitive = DEFINITIVE_PRODUCT_SUPPLIER_MAPPING.find(mapping => normalizeSupplierProductName(mapping.productName) === normalizedName);
  if (definitive?.ghost) return null;
  if (definitive) return definitive;
  const exact = PURCHASE_PRODUCT_SUPPLIER_MAPPING.find(mapping => normalizeSupplierProductName(mapping.productName) === normalizedName);
  if (exact) return exact;
  const historical = findSupplierForProduct(productName);
  return historical ? { ...historical } : null;
}

// Función para encontrar el proveedor de un producto
export function findSupplierForProduct(productName: string): ProductSupplierMapping | null {
  const normalizedName = productName.toLowerCase().trim();

  // Buscar coincidencia exacta
  let mapping = PRODUCT_SUPPLIER_MAPPING.find(
    m => m.productName.toLowerCase() === normalizedName
  );

  // Si no hay exacta, buscar parcial
  if (!mapping) {
    mapping = PRODUCT_SUPPLIER_MAPPING.find(
      m => normalizedName.includes(m.productName.toLowerCase()) ||
        m.productName.toLowerCase().includes(normalizedName)
    );
  }

  return mapping || null;
}

// Función para obtener el proveedor por ID
export function getSupplierById(supplierId: string): Supplier | undefined {
  return SUPPLIERS.find(s => s.id === supplierId);
}

// Función para guardar preferencias en localStorage
export function saveSupplierPreferences(preferences: Record<string, string>) {
  try {
    localStorage.setItem('supplier-preferences', JSON.stringify(preferences));
  } catch (error) {
    console.error('Error saving supplier preferences:', error);
  }
}

// Función para cargar preferencias desde localStorage
export function loadSupplierPreferences(): Record<string, string> {
  try {
    const saved = localStorage.getItem('supplier-preferences');
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (error) {
    console.error('Error loading supplier preferences:', error);
  }
  return {};
}
