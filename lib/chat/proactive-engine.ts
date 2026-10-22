/**
 * =====================================================
 * PROACTIVE ENGINE - El Mayordomo "Magistral"
 * =====================================================
 *
 * Motor de proactividad que detecta el contexto del usuario
 * y genera triggers inteligentes para iniciar conversaciones.
 *
 * Triggers soportados:
 * - Tiempo en página (inactividad)
 * - Usuario recurrente
 * - Carrito abandonado
 * - Navegación en categoría específica
 * - Hora del día (ofertas especiales)
 */

import { supabase } from '@/lib/supabase';

// =====================================================
// TIPOS
// =====================================================

export interface ProactiveContext {
  userId: string | null;
  isReturningUser: boolean;
  lastPurchase: {
    date: Date | null;
    products: string[];
  } | null;
  currentPage: string;
  timeOnPage: number; // segundos
  cartValue: number;
  cartItemCount: number;
  deviceType: 'mobile' | 'desktop' | 'tablet';
  hourOfDay: number;
  dayOfWeek: number;
  sessionCount: number;
}

export interface ProactiveTrigger {
  type: 'idle' | 'returning_user' | 'cart_reminder' | 'category_interest' | 'time_offer';
  priority: number; // 1-10, mayor = más importante
  message: string;
  suggestedIntent?: string;
  metadata?: Record<string, unknown>;
}

export interface ProactiveConfig {
  // Tiempos (en segundos)
  idleThreshold: number;        // Tiempo antes de mostrar ayuda
  cartAbandonThreshold: number; // Tiempo con carrito sin checkout

  // Toggles
  enableIdleTrigger: boolean;
  enableReturningUserTrigger: boolean;
  enableCartReminder: boolean;
  enableTimeOffers: boolean;

  // Cooldowns (evitar spam)
  triggerCooldown: number;      // Segundos entre triggers
  maxTriggersPerSession: number;
}

// =====================================================
// CONFIGURACIÓN DEFAULT
// =====================================================

const DEFAULT_CONFIG: ProactiveConfig = {
  idleThreshold: 30,           // 30 segundos de inactividad
  cartAbandonThreshold: 120,   // 2 minutos con carrito

  enableIdleTrigger: true,
  enableReturningUserTrigger: true,
  enableCartReminder: true,
  enableTimeOffers: true,

  triggerCooldown: 60,         // 1 minuto entre triggers
  maxTriggersPerSession: 3,
};

// =====================================================
// CLASE PRINCIPAL
// =====================================================

export class ProactiveEngine {
  private config: ProactiveConfig;
  private lastTriggerTime: number = 0;
  private triggerCount: number = 0;
  private listeners: Set<(trigger: ProactiveTrigger) => void> = new Set();

  constructor(config: Partial<ProactiveConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  // =====================================================
  // API PÚBLICA
  // =====================================================

  /**
   * Suscribirse a triggers proactivos
   */
  subscribe(callback: (trigger: ProactiveTrigger) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  /**
   * Evaluar contexto y generar trigger si aplica
   */
  async evaluate(context: ProactiveContext): Promise<ProactiveTrigger | null> {
    // Verificar cooldown
    const now = Date.now();
    if (now - this.lastTriggerTime < this.config.triggerCooldown * 1000) {
      return null;
    }

    // Verificar límite de triggers
    if (this.triggerCount >= this.config.maxTriggersPerSession) {
      return null;
    }

    // Evaluar triggers en orden de prioridad
    const triggers: ProactiveTrigger[] = [];

    // 1. Usuario recurrente (prioridad alta)
    if (this.config.enableReturningUserTrigger) {
      const returningTrigger = this.evaluateReturningUser(context);
      if (returningTrigger) triggers.push(returningTrigger);
    }

    // 2. Carrito abandonado (prioridad alta)
    if (this.config.enableCartReminder) {
      const cartTrigger = this.evaluateCartAbandonment(context);
      if (cartTrigger) triggers.push(cartTrigger);
    }

    // 3. Ofertas por hora (prioridad media)
    if (this.config.enableTimeOffers) {
      const timeTrigger = this.evaluateTimeOffers(context);
      if (timeTrigger) triggers.push(timeTrigger);
    }

    // 4. Inactividad (prioridad baja)
    if (this.config.enableIdleTrigger) {
      const idleTrigger = this.evaluateIdleTime(context);
      if (idleTrigger) triggers.push(idleTrigger);
    }

    // Ordenar por prioridad y tomar el más importante
    triggers.sort((a, b) => b.priority - a.priority);
    const selectedTrigger = triggers[0] || null;

    if (selectedTrigger) {
      this.lastTriggerTime = now;
      this.triggerCount++;
      this.notifyListeners(selectedTrigger);
    }

    return selectedTrigger;
  }

  /**
   * Resetear contadores (llamar al cerrar chat)
   */
  reset(): void {
    this.triggerCount = 0;
    this.lastTriggerTime = 0;
  }

  // =====================================================
  // EVALUADORES DE TRIGGER
  // =====================================================

  private evaluateReturningUser(context: ProactiveContext): ProactiveTrigger | null {
    if (!context.isReturningUser || !context.lastPurchase) {
      return null;
    }

    const daysSinceLastPurchase = context.lastPurchase.date
      ? Math.floor((Date.now() - context.lastPurchase.date.getTime()) / (1000 * 60 * 60 * 24))
      : null;

    // Solo si pasaron 3-14 días desde última compra
    if (daysSinceLastPurchase === null || daysSinceLastPurchase < 3 || daysSinceLastPurchase > 14) {
      return null;
    }

    const productNames = context.lastPurchase.products.slice(0, 2).join(' y ');

    return {
      type: 'returning_user',
      priority: 9,
      message: productNames
        ? `¡Qué gusto verte de nuevo! La última vez llevaste ${productNames}. ¿Quieres repetir tu pedido? 🥑`
        : '¡Hola de nuevo! Veo que ya nos conoces. ¿En qué puedo ayudarte hoy?',
      suggestedIntent: 'repeat_order',
      metadata: { daysSinceLastPurchase, lastProducts: context.lastPurchase.products },
    };
  }

  private evaluateCartAbandonment(context: ProactiveContext): ProactiveTrigger | null {
    if (context.cartItemCount === 0 || context.timeOnPage < this.config.cartAbandonThreshold) {
      return null;
    }

    const formattedTotal = new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(context.cartValue);

    return {
      type: 'cart_reminder',
      priority: 8,
      message: `Veo que tienes ${context.cartItemCount} producto${context.cartItemCount > 1 ? 's' : ''} en tu carrito (${formattedTotal}). ¿Te ayudo a completar tu pedido? 🛒`,
      suggestedIntent: 'checkout_help',
      metadata: { cartValue: context.cartValue, itemCount: context.cartItemCount },
    };
  }

  private evaluateTimeOffers(context: ProactiveContext): ProactiveTrigger | null {
    const hour = context.hourOfDay;
    const isWeekend = context.dayOfWeek === 0 || context.dayOfWeek === 6;

    // Ofertas matutinas (6-9 AM)
    if (hour >= 6 && hour < 9) {
      return {
        type: 'time_offer',
        priority: 6,
        message: '¡Buenos días! ☀️ Empezamos el día con aguacates frescos. ¿Te muestro las opciones recién llegadas?',
        suggestedIntent: 'intent_avocados',
        metadata: { timeSlot: 'morning' },
      };
    }

    // Ofertas de almuerzo (11 AM - 1 PM)
    if (hour >= 11 && hour < 13) {
      return {
        type: 'time_offer',
        priority: 5,
        message: '¿Pensando en el almuerzo? 🥗 Tengo opciones perfectas para tu ensalada o guacamole.',
        suggestedIntent: 'intent_lunch',
        metadata: { timeSlot: 'lunch' },
      };
    }

    // Ofertas de fin de semana
    if (isWeekend && hour >= 9 && hour < 12) {
      return {
        type: 'time_offer',
        priority: 7,
        message: '¡Fin de semana! 🎉 Es el momento perfecto para preparar algo especial. ¿Te muestro nuestros combos familiares?',
        suggestedIntent: 'intent_market',
        metadata: { timeSlot: 'weekend_morning' },
      };
    }

    return null;
  }

  private evaluateIdleTime(context: ProactiveContext): ProactiveTrigger | null {
    if (context.timeOnPage < this.config.idleThreshold) {
      return null;
    }

    // Mensajes según la página actual
    const pageMessages: Record<string, string> = {
      '/productos': '¿Buscas algo en particular? Puedo ayudarte a encontrar el producto perfecto. 🔍',
      '/aguacates': 'Veo que estás mirando nuestros aguacates. ¿Te cuento cuáles están en su punto? 🥑',
      '/carrito': '¿Tienes alguna duda sobre tu pedido? Estoy aquí para ayudarte. 🛒',
      '/': '¿Necesitas ayuda para encontrar algo? ¡Pregúntame lo que quieras!',
    };

    const message = pageMessages[context.currentPage] || pageMessages['/'];

    return {
      type: 'idle',
      priority: 3,
      message,
      metadata: { page: context.currentPage, idleTime: context.timeOnPage },
    };
  }

  // =====================================================
  // HELPERS
  // =====================================================

  private notifyListeners(trigger: ProactiveTrigger): void {
    this.listeners.forEach((callback) => {
      try {
        callback(trigger);
      } catch (error) {
        console.error('[ProactiveEngine] Error in listener:', error);
      }
    });
  }
}

// =====================================================
// FUNCIONES DE UTILIDAD
// =====================================================

/**
 * Detectar tipo de dispositivo
 */
export function getDeviceType(): 'mobile' | 'desktop' | 'tablet' {
  if (typeof window === 'undefined') return 'desktop';

  const width = window.innerWidth;
  if (width < 768) return 'mobile';
  if (width < 1024) return 'tablet';
  return 'desktop';
}

/**
 * Obtener datos del usuario desde Supabase para contexto proactivo
 */
export async function getUserProactiveData(userId: string | null): Promise<{
  isReturningUser: boolean;
  lastPurchase: { date: Date | null; products: string[] } | null;
  sessionCount: number;
}> {
  if (!userId) {
    // Verificar localStorage para usuarios no autenticados
    const visited = typeof window !== 'undefined' && localStorage.getItem('chatbot_visited_v2');
    return {
      isReturningUser: !!visited,
      lastPurchase: null,
      sessionCount: visited ? 2 : 1,
    };
  }

  try {
    // Obtener última orden
    const { data: orders } = await supabase
      .from('orders')
      .select('id, created_at, order_items(product_name)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1);

    // Obtener contexto del usuario (si existe)
    const { data: userContext } = await supabase
      .from('user_context')
      .select('total_chats')
      .eq('user_id', userId)
      .single();

    const lastOrder = orders?.[0];
    const lastPurchase = lastOrder
      ? {
        date: new Date(lastOrder.created_at),
        products: (lastOrder.order_items as any[])?.map((i) => i.product_name) || [],
      }
      : null;

    return {
      isReturningUser: !!lastPurchase || (userContext?.total_chats || 0) > 0,
      lastPurchase,
      sessionCount: userContext?.total_chats || 1,
    };
  } catch (error) {
    console.error('[ProactiveEngine] Error fetching user data:', error);
    return {
      isReturningUser: false,
      lastPurchase: null,
      sessionCount: 1,
    };
  }
}

// =====================================================
// SINGLETON EXPORT
// =====================================================

export const proactiveEngine = new ProactiveEngine();
