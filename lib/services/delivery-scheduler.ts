import { BannerConfig } from '@/lib/types/banner';
import {
  getNowInColombia,
  addDaysFromToday,
  getDayNameInSpanish
} from '@/lib/utils/colombia-date';

export interface DeliverySchedule {
  nextDeliveryDate: Date;
  deadlineDate: Date;
  timeLeft: string;
  hoursLeft: number;
  minutesLeft: number;
  isUrgent: boolean;
}

// Configuración para entregas martes y viernes con corte a 10AM
const DEFAULT_CONFIG: BannerConfig = {
  cutoffHour: 10, // 10AM
  deliveryDays: [2, 5], // Martes (2), Viernes (5)
  timezone: 'America/Bogota'
};

export class DeliveryScheduler {
  private config: BannerConfig;

  constructor(config: Partial<BannerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Calcula la siguiente fecha de entrega basado en el día y hora actual
   * usando el nuevo horario de corte de 10AM
   * IMPORTANTE: Ahora usa zona horaria de Colombia correctamente
   */
  getNextDeliveryDate(): Date {
    // Usar funciones de Colombia para obtener fecha/hora correcta
    const colombiaTime = getNowInColombia();
    const dayOfWeek = colombiaTime.dayOfWeek; // 0 = Domingo, 1 = Lunes, etc.
    const hour = colombiaTime.hour;
    const currentMinutes = colombiaTime.minute;

    // Determinar si ya pasó la hora de corte de hoy
    const hasPassedCutoff = hour > this.config.cutoffHour ||
      (hour === this.config.cutoffHour && currentMinutes > 0);

    let daysUntilDelivery: number;

    // Lógica actualizada para corte a 10AM
    switch (dayOfWeek) {
      case 0: // Domingo -> Martes (2 días)
        daysUntilDelivery = 2;
        break;
      case 1: // Lunes -> Martes (1 día)
        daysUntilDelivery = 1;
        break;
      case 2: // Martes
        // Si es martes antes de 10AM, entrega hoy
        // Si es martes después de 10AM, próxima entrega viernes (3 días)
        daysUntilDelivery = hasPassedCutoff ? 3 : 0;
        break;
      case 3: // Miércoles -> Viernes (2 días)
        daysUntilDelivery = 2;
        break;
      case 4: // Jueves -> Viernes (1 día)
        daysUntilDelivery = 1;
        break;
      case 5: // Viernes
        // Si es viernes antes de 10AM, entrega hoy
        // Si es viernes después de 10AM, próxima entrega martes (4 días)
        daysUntilDelivery = hasPassedCutoff ? 4 : 0;
        break;
      case 6: // Sábado -> Martes (3 días)
        daysUntilDelivery = 3;
        break;
      default:
        daysUntilDelivery = 1;
    }

    // Usar addDaysFromToday para calcular la fecha de entrega correctamente
    const deliveryDate = addDaysFromToday(daysUntilDelivery);

    // Si es hoy y ya pasó el cutoff, mover al siguiente día de entrega
    if (daysUntilDelivery === 0 && hasPassedCutoff) {
      deliveryDate.setDate(deliveryDate.getDate() + this.getNextDeliveryDayOffset(dayOfWeek));
    }

    return deliveryDate;
  }

  /**
   * Obtiene el siguiente día de entrega (en días desde hoy)
   */
  private getNextDeliveryDayOffset(currentDay: number): number {
    const sortedDeliveryDays = [...this.config.deliveryDays].sort();

    for (const deliveryDay of sortedDeliveryDays) {
      if (deliveryDay > currentDay) {
        return deliveryDay - currentDay;
      }
    }

    // Si no hay más días de entrega esta semana, ir a la siguiente semana
    return 7 - currentDay + sortedDeliveryDays[0];
  }

  /**
   * Calcula el deadline (hora de corte) para la siguiente entrega
   * IMPORTANTE: Usa zona horaria de Colombia
   */
  getDeadlineDate(): Date {
    const deliveryDate = this.getNextDeliveryDate();
    const deadline = new Date(deliveryDate);
    const colombiaTime = getNowInColombia();

    // Si la entrega es hoy, el deadline es hoy a las 10AM
    const isDeliveryToday = deliveryDate.toDateString() === colombiaTime.date.toDateString();

    if (isDeliveryToday && colombiaTime.hour < this.config.cutoffHour) {
      deadline.setHours(this.config.cutoffHour, 0, 0, 0);
    } else {
      // Si no, el deadline es el día de entrega anterior a las 10AM
      const deliveryDayOfWeek = deliveryDate.getDay();
      let previousDay = deliveryDayOfWeek - 1;

      if (previousDay < 0) previousDay = 6; // Si es lunes, el día anterior es domingo

      deadline.setDate(deliveryDate.getDate() - 1);
      deadline.setHours(this.config.cutoffHour, 0, 0, 0);
    }

    return deadline;
  }

  /**
   * Calcula el tiempo restante para el deadline
   * IMPORTANTE: Usa zona horaria de Colombia
   */
  getTimeRemaining(): DeliverySchedule {
    const colombiaTime = getNowInColombia();
    const now = colombiaTime.date;
    const deadline = this.getDeadlineDate();
    const deliveryDate = this.getNextDeliveryDate();

    // Si el deadline ya pasó, mover al siguiente
    if (now > deadline) {
      const nextDeadline = new Date(deadline);
      nextDeadline.setDate(nextDeadline.getDate() + this.getNextDeliveryDayOffset(deadline.getDay()));

      const diff = nextDeadline.getTime() - now.getTime();
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      return {
        nextDeliveryDate: deliveryDate,
        deadlineDate: nextDeadline,
        timeLeft: `${hours}h ${minutes}m`,
        hoursLeft: hours,
        minutesLeft: minutes,
        isUrgent: hours < 2
      };
    }

    const diff = deadline.getTime() - now.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    return {
      nextDeliveryDate: deliveryDate,
      deadlineDate: deadline,
      timeLeft: `${hours}h ${minutes}m`,
      hoursLeft: hours,
      minutesLeft: minutes,
      isUrgent: hours < 2
    };
  }

  /**
   * Formatea la fecha de entrega para mostrar en el banner
   * IMPORTANTE: Usa zona horaria de Colombia
   */
  formatDeliveryDate(deliveryDate?: Date): string {
    const date = deliveryDate || this.getNextDeliveryDate();
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      day: 'numeric',
      month: 'short',
      timeZone: 'America/Bogota'
    };
    return date.toLocaleDateString('es-CO', options);
  }

  /**
   * Verifica si hay entrega hoy
   * IMPORTANTE: Usa zona horaria de Colombia
   */
  hasDeliveryToday(): boolean {
    const colombiaTime = getNowInColombia();
    const deliveryDate = this.getNextDeliveryDate();
    return deliveryDate.toDateString() === colombiaTime.date.toDateString();
  }

  /**
   * Obtiene los días de entrega formateados
   */
  getDeliveryDays(): string[] {
    const dayNames = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
    return this.config.deliveryDays.map(day => dayNames[day]);
  }
}

// Exportar una instancia por defecto para uso sencillo
export const defaultScheduler = new DeliveryScheduler();