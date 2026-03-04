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
}

export const SUPPLIERS: Supplier[] = [
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
    productName: 'semillas',
    supplierId: 'reina',
    priority: 1,
    note: 'Chía, linaza - Jessica'
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
    productName: 'piña',
    supplierId: 'reina',
    priority: 1
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
