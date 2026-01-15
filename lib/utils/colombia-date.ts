/**
 * Utilidades para manejo de fechas en zona horaria de Colombia (America/Bogota)
 *
 * IMPORTANTE: Este archivo centraliza todo el manejo de fechas para evitar
 * problemas de zona horaria. Colombia está en UTC-5 y no tiene horario de verano.
 *
 * Usar estas funciones en lugar de `new Date()` directamente para:
 * - Cálculo de fechas de entrega
 * - Verificar si es "hoy"
 * - Obtener el día de la semana actual
 * - Comparar fechas de pedidos
 */

const COLOMBIA_TIMEZONE = 'America/Bogota';

/**
 * Obtiene la fecha y hora actual en Colombia
 * @returns Objeto con información de fecha/hora en Colombia
 */
export function getNowInColombia(): {
  date: Date;
  year: number;
  month: number;
  day: number;
  dayOfWeek: number;
  hour: number;
  minute: number;
  second: number;
  dateString: string;
  timeString: string;
  dayName: string;
} {
  const now = new Date();

  // Usar Intl.DateTimeFormat para obtener los componentes en zona horaria de Colombia
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: COLOMBIA_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    weekday: 'long'
  });

  const parts = formatter.formatToParts(now);
  const getPart = (type: string) => parts.find(p => p.type === type)?.value || '';

  const year = parseInt(getPart('year'));
  const month = parseInt(getPart('month'));
  const day = parseInt(getPart('day'));
  const hour = parseInt(getPart('hour'));
  const minute = parseInt(getPart('minute'));
  const second = parseInt(getPart('second'));
  const dayName = getPart('weekday').toLowerCase();

  // Calcular día de la semana (0 = Domingo, 1 = Lunes, etc.)
  const dayOfWeekMap: Record<string, number> = {
    'sunday': 0,
    'monday': 1,
    'tuesday': 2,
    'wednesday': 3,
    'thursday': 4,
    'friday': 5,
    'saturday': 6
  };
  const dayOfWeek = dayOfWeekMap[dayName] ?? 0;

  // Crear una fecha que representa la hora en Colombia (para comparaciones)
  // Nota: Esta fecha tiene los valores correctos de Colombia pero está en UTC internamente
  const colombiaDate = new Date(year, month - 1, day, hour, minute, second);

  return {
    date: colombiaDate,
    year,
    month,
    day,
    dayOfWeek,
    hour,
    minute,
    second,
    dateString: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
    timeString: `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:${String(second).padStart(2, '0')}`,
    dayName
  };
}

/**
 * Obtiene solo la fecha actual en Colombia (YYYY-MM-DD)
 */
export function getTodayInColombia(): string {
  return getNowInColombia().dateString;
}

/**
 * Obtiene el día de la semana actual en Colombia (0-6)
 * 0 = Domingo, 1 = Lunes, 2 = Martes, etc.
 */
export function getDayOfWeekInColombia(): number {
  return getNowInColombia().dayOfWeek;
}

/**
 * Obtiene la hora actual en Colombia (0-23)
 */
export function getHourInColombia(): number {
  return getNowInColombia().hour;
}

/**
 * Obtiene los minutos actuales en Colombia (0-59)
 */
export function getMinuteInColombia(): number {
  return getNowInColombia().minute;
}

/**
 * Verifica si una fecha dada es "hoy" en Colombia
 */
export function isToday(date: Date | string): boolean {
  const today = getTodayInColombia();

  if (typeof date === 'string') {
    // Si es string, comparar directamente los primeros 10 caracteres (YYYY-MM-DD)
    return date.substring(0, 10) === today;
  }

  // Si es Date, convertir a string en formato Colombia
  const dateStr = formatDateInColombia(date, 'YYYY-MM-DD');
  return dateStr === today;
}

/**
 * Formatea una fecha en zona horaria de Colombia
 */
export function formatDateInColombia(
  date: Date | string,
  format: 'YYYY-MM-DD' | 'full' | 'short' | 'weekday' | 'datetime' = 'full'
): string {
  const d = typeof date === 'string' ? new Date(date) : date;

  const options: Intl.DateTimeFormatOptions = { timeZone: COLOMBIA_TIMEZONE };

  switch (format) {
    case 'YYYY-MM-DD':
      return d.toLocaleDateString('en-CA', { ...options, year: 'numeric', month: '2-digit', day: '2-digit' });
    case 'full':
      return d.toLocaleDateString('es-CO', { ...options, weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    case 'short':
      return d.toLocaleDateString('es-CO', { ...options, day: 'numeric', month: 'short' });
    case 'weekday':
      return d.toLocaleDateString('es-CO', { ...options, weekday: 'long' });
    case 'datetime':
      return d.toLocaleString('es-CO', { ...options, dateStyle: 'medium', timeStyle: 'short' });
    default:
      return d.toLocaleDateString('es-CO', options);
  }
}

/**
 * Obtiene el nombre del día de la semana en español
 */
export function getDayNameInSpanish(dayOfWeek?: number): string {
  const days = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
  const day = dayOfWeek ?? getDayOfWeekInColombia();
  return days[day];
}

/**
 * Crea una fecha para una fecha específica a medianoche en Colombia
 */
export function createColombiaDate(year: number, month: number, day: number, hour = 0, minute = 0): Date {
  // Crear fecha en UTC que corresponda a esa hora en Colombia
  // Colombia es UTC-5, así que sumamos 5 horas para compensar
  const utcDate = new Date(Date.UTC(year, month - 1, day, hour + 5, minute, 0, 0));
  return utcDate;
}

/**
 * Obtiene el inicio del día de hoy en Colombia (medianoche)
 */
export function getStartOfTodayInColombia(): Date {
  const { year, month, day } = getNowInColombia();
  return createColombiaDate(year, month, day, 0, 0);
}

/**
 * Obtiene el final del día de hoy en Colombia (23:59:59)
 */
export function getEndOfTodayInColombia(): Date {
  const { year, month, day } = getNowInColombia();
  return createColombiaDate(year, month, day, 23, 59);
}

/**
 * Calcula una fecha futura a partir de hoy en Colombia
 */
export function addDaysFromToday(days: number): Date {
  const { year, month, day } = getNowInColombia();
  const futureDate = new Date(year, month - 1, day + days);
  return futureDate;
}

/**
 * Debug: Muestra la información completa de fecha/hora actual
 */
export function debugColombiaTime(): void {
  const now = getNowInColombia();
  console.log('=== DEBUG: Hora en Colombia ===');
  console.log(`Fecha: ${now.dateString}`);
  console.log(`Hora: ${now.timeString}`);
  console.log(`Día de la semana: ${now.dayName} (${now.dayOfWeek})`);
  console.log(`Año: ${now.year}, Mes: ${now.month}, Día: ${now.day}`);
  console.log(`Hora: ${now.hour}, Minuto: ${now.minute}`);
  console.log('================================');
}
