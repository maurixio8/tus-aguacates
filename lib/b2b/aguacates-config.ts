/**
 * CONFIGURACION DE AGUACATES B2B - TUS AGUACATES
 *
 * Este archivo contiene los precios y configuracion de aguacates para venta mayorista.
 * Los precios se pueden modificar semanalmente segun el mercado.
 *
 * ESTRUCTURA:
 * - Variedad: Hass, Papelillo, Semil, Choquette
 * - Calibre: Jumbo (solo Hass), Primera, Segunda
 * - Madurez: Verde, Pinton, Maduro
 */

// ============================================
// TIPOS
// ============================================

export type AguacateVariedad = 'hass' | 'papelillo' | 'semil' | 'choquette';
export type AguacateCalibre = 'jumbo' | 'primera' | 'segunda';
export type AguacateMadurez = 'verde' | 'pinton' | 'maduro';

export interface AguacatePrecio {
  precioKg: number; // Precio por kg
  disponible: boolean;
}

export interface AguacateCalibreInfo {
  nombre: string;
  descripcion: string;
  pesoMinimo: number; // gramos
  pesoMaximo: number | null; // null = sin limite
  precios: {
    verde: AguacatePrecio;
    pinton: AguacatePrecio;
    maduro: AguacatePrecio;
  };
}

export interface AguacateVariedadConfig {
  id: AguacateVariedad;
  nombre: string;
  nombreCompleto: string;
  descripcion: string;
  imagen?: string;
  calibres: Partial<Record<AguacateCalibre, AguacateCalibreInfo>>;
}

// ============================================
// CONFIGURACION DE VARIEDADES Y PRECIOS
// (Modificar estos valores semanalmente)
// ============================================

export const AGUACATES_CONFIG: Record<AguacateVariedad, AguacateVariedadConfig> = {
  hass: {
    id: 'hass',
    nombre: 'Hass',
    nombreCompleto: 'Aguacate Hass',
    descripcion: 'El clasico aguacate de piel rugosa, cremoso y versatil. El mas popular en restaurantes.',
    imagen: '/images/products/aguacate-hass.jpg',
    calibres: {
      jumbo: {
        nombre: 'Jumbo',
        descripcion: 'Los mas grandes, ideales para presentaciones especiales',
        pesoMinimo: 210,
        pesoMaximo: null,
        precios: {
          verde: { precioKg: 12000, disponible: true },
          pinton: { precioKg: 13000, disponible: true },
          maduro: { precioKg: 14000, disponible: true },
        }
      },
      primera: {
        nombre: 'Primera',
        descripcion: 'Calibre estandar premium para uso profesional',
        pesoMinimo: 160,
        pesoMaximo: 210,
        precios: {
          verde: { precioKg: 9000, disponible: true },
          pinton: { precioKg: 10000, disponible: true },
          maduro: { precioKg: 11000, disponible: true },
        }
      },
      segunda: {
        nombre: 'Segunda',
        descripcion: 'Calibre economico, ideal para guacamole y preparaciones',
        pesoMinimo: 0,
        pesoMaximo: 160,
        precios: {
          verde: { precioKg: 7000, disponible: true },
          pinton: { precioKg: 8000, disponible: true },
          maduro: { precioKg: 9000, disponible: true },
        }
      }
    }
  },

  papelillo: {
    id: 'papelillo',
    nombre: 'Papelillo',
    nombreCompleto: 'Aguacate Papelillo (Lorena)',
    descripcion: 'Piel delgada y suave, sabor mantequilloso. Muy apreciado en la costa.',
    imagen: '/images/products/aguacate-papelillo.jpg',
    calibres: {
      primera: {
        nombre: 'Primera',
        descripcion: 'Calibre grande, piel fina y pulpa abundante',
        pesoMinimo: 400,
        pesoMaximo: null,
        precios: {
          verde: { precioKg: 8000, disponible: true },
          pinton: { precioKg: 9000, disponible: true },
          maduro: { precioKg: 10000, disponible: true },
        }
      },
      segunda: {
        nombre: 'Segunda',
        descripcion: 'Calibre mediano, excelente relacion calidad-precio',
        pesoMinimo: 200,
        pesoMaximo: 400,
        precios: {
          verde: { precioKg: 6000, disponible: true },
          pinton: { precioKg: 7000, disponible: true },
          maduro: { precioKg: 8000, disponible: true },
        }
      }
    }
  },

  semil: {
    id: 'semil',
    nombre: 'Semil',
    nombreCompleto: 'Aguacate Semil',
    descripcion: 'Textura unica y semilla pequena. Popular en el Eje Cafetero.',
    imagen: '/images/products/aguacate-semil.jpg',
    calibres: {
      primera: {
        nombre: 'Primera',
        descripcion: 'Calibre grande con semilla pequena',
        pesoMinimo: 400,
        pesoMaximo: null,
        precios: {
          verde: { precioKg: 8400, disponible: true },
          pinton: { precioKg: 9400, disponible: true },
          maduro: { precioKg: 10400, disponible: true },
        }
      },
      segunda: {
        nombre: 'Segunda',
        descripcion: 'Calibre mediano, ideal para uso diario',
        pesoMinimo: 200,
        pesoMaximo: 400,
        precios: {
          verde: { precioKg: 6400, disponible: true },
          pinton: { precioKg: 7400, disponible: true },
          maduro: { precioKg: 8400, disponible: true },
        }
      }
    }
  },

  choquette: {
    id: 'choquette',
    nombre: 'Choquette',
    nombreCompleto: 'Aguacate Choquette',
    descripcion: 'El mas grande de todos, textura cremosa excepcional. Impresiona en cualquier mesa.',
    imagen: '/images/products/aguacate-choquette.jpg',
    calibres: {
      primera: {
        nombre: 'Primera',
        descripcion: 'Calibre extra grande, presentacion premium',
        pesoMinimo: 600,
        pesoMaximo: null,
        precios: {
          verde: { precioKg: 9600, disponible: true },
          pinton: { precioKg: 10600, disponible: true },
          maduro: { precioKg: 11600, disponible: true },
        }
      },
      segunda: {
        nombre: 'Segunda',
        descripcion: 'Calibre grande, excelente para restaurantes',
        pesoMinimo: 300,
        pesoMaximo: 600,
        precios: {
          verde: { precioKg: 7600, disponible: true },
          pinton: { precioKg: 8600, disponible: true },
          maduro: { precioKg: 9600, disponible: true },
        }
      }
    }
  }
};

// ============================================
// INFORMACION DE MADUREZ
// ============================================

export const MADUREZ_INFO: Record<AguacateMadurez, {
  nombre: string;
  descripcion: string;
  diasParaConsumo: string;
  color: string;
  colorBg: string;
}> = {
  verde: {
    nombre: 'Verde',
    descripcion: 'Ideal para madurar en tu negocio',
    diasParaConsumo: '4-7 dias',
    color: 'text-green-700',
    colorBg: 'bg-green-100',
  },
  pinton: {
    nombre: 'Pinton',
    descripcion: 'Listo para consumo en pocos dias',
    diasParaConsumo: '1-3 dias',
    color: 'text-yellow-700',
    colorBg: 'bg-yellow-100',
  },
  maduro: {
    nombre: 'Maduro',
    descripcion: 'Listo para consumo inmediato',
    diasParaConsumo: '0-2 dias',
    color: 'text-orange-700',
    colorBg: 'bg-orange-100',
  },
};

// ============================================
// VOLUMENES Y DESCUENTOS POR CANTIDAD
// ============================================

export interface VolumenDescuento {
  minKg: number;
  maxKg: number;
  nombre: string;
  descuento: number; // Porcentaje de descuento
}

export const VOLUMENES_DESCUENTO: VolumenDescuento[] = [
  { minKg: 5, maxKg: 20, nombre: '5-20 kg', descuento: 0 },
  { minKg: 20, maxKg: 100, nombre: '20-100 kg', descuento: 10 },
  { minKg: 100, maxKg: 300, nombre: '100-300 kg', descuento: 20 },
];

// ============================================
// FUNCIONES HELPER
// ============================================

/**
 * Obtiene el precio por kg para una configuracion especifica
 */
export function getPrecioAguacate(
  variedad: AguacateVariedad,
  calibre: AguacateCalibre,
  madurez: AguacateMadurez
): number | null {
  const config = AGUACATES_CONFIG[variedad];
  if (!config) return null;

  const calibreConfig = config.calibres[calibre];
  if (!calibreConfig) return null;

  const precio = calibreConfig.precios[madurez];
  if (!precio || !precio.disponible) return null;

  return precio.precioKg;
}

/**
 * Calcula el precio total con descuento por volumen
 */
export function calcularPrecioTotal(
  variedad: AguacateVariedad,
  calibre: AguacateCalibre,
  madurez: AguacateMadurez,
  cantidadKg: number
): { precioKg: number; precioKgConDescuento: number; total: number; descuento: number } | null {
  const precioBase = getPrecioAguacate(variedad, calibre, madurez);
  if (precioBase === null) return null;

  // Encontrar el nivel de descuento
  const volumen = VOLUMENES_DESCUENTO.find(
    v => cantidadKg >= v.minKg && cantidadKg <= v.maxKg
  );

  const descuento = volumen?.descuento || 0;
  const precioKgConDescuento = precioBase * (1 - descuento / 100);
  const total = precioKgConDescuento * cantidadKg;

  return {
    precioKg: precioBase,
    precioKgConDescuento,
    total,
    descuento,
  };
}

/**
 * Obtiene los calibres disponibles para una variedad
 */
export function getCalibresDisponibles(variedad: AguacateVariedad): AguacateCalibre[] {
  const config = AGUACATES_CONFIG[variedad];
  if (!config) return [];
  return Object.keys(config.calibres) as AguacateCalibre[];
}

/**
 * Verifica si una combinacion esta disponible
 */
export function isDisponible(
  variedad: AguacateVariedad,
  calibre: AguacateCalibre,
  madurez: AguacateMadurez
): boolean {
  const config = AGUACATES_CONFIG[variedad];
  if (!config) return false;

  const calibreConfig = config.calibres[calibre];
  if (!calibreConfig) return false;

  return calibreConfig.precios[madurez]?.disponible ?? false;
}

/**
 * Obtiene todas las variedades disponibles
 */
export function getVariedadesDisponibles(): AguacateVariedadConfig[] {
  return Object.values(AGUACATES_CONFIG);
}

/**
 * Formatea el rango de peso para mostrar
 */
export function formatearRangoPeso(calibre: AguacateCalibreInfo): string {
  if (calibre.pesoMaximo === null) {
    return `> ${calibre.pesoMinimo}g`;
  }
  if (calibre.pesoMinimo === 0) {
    return `< ${calibre.pesoMaximo}g`;
  }
  return `${calibre.pesoMinimo}g - ${calibre.pesoMaximo}g`;
}
