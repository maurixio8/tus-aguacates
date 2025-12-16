// Tipos para el sistema de mensajes del banner

export interface BannerMessage {
  id: string;
  message_type: 'stock' | 'offer' | 'urgency' | 'promotion' | 'freshness' | 'seasonal' | 'quality' | 'combo';
  template_text: string;
  is_active: boolean;
  priority: number;
  display_conditions: DisplayConditions;
  created_at: string;
  updated_at: string;
}

export interface DisplayConditions {
  min_stock?: number;
  max_stock?: number;
  has_discount?: boolean;
  is_fresh?: boolean;
  category?: string;
  discount?: number;
  [key: string]: any;
}

export interface MessageVariables {
  stock?: number;
  product?: string;
  category?: string;
  discount?: number;
  [key: string]: string | number;
}

export interface DeliverySchedule {
  nextDeliveryDate: Date;
  deadlineDate: Date;
  timeLeft: string;
  hoursLeft: number;
  minutesLeft: number;
  isUrgent: boolean;
}

export interface BannerConfig {
  cutoffHour: number; // 10 para 10AM
  deliveryDays: number[]; // [2, 5] para martes (2) y viernes (5)
  timezone: string;
}

export interface RenderedMessage {
  id: string;
  text: string;
  type: BannerMessage['message_type'];
  priority: number;
  variables: MessageVariables;
}

// Opciones de configuración para el motor de mensajes
export interface MessageEngineConfig {
  refreshInterval: number; // milisegundos entre rotaciones
  cacheTimeout: number; // milisegundos para refrescar datos
  enableDataIntegration: boolean;
  fallbackMessages: string[];
}