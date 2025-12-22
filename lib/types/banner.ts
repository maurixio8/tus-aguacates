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
  stock?: number | string;
  product?: string;
  category?: string;
  discount?: number;
  [key: string]: string | number | undefined;
}

export interface BannerConfig {
  cutoffHour: number; // 10 para 10AM
  deliveryDays: number[]; // [2, 5] para martes (2) y viernes (5)
  timezone: string;
}

// Opciones de configuración para el motor de mensajes
export interface MessageEngineConfig {
  refreshInterval: number; // milisegundos entre rotaciones
  cacheTimeout: number; // milisegundos para refrescar datos
  enableDataIntegration: boolean;
  fallbackMessages: string[];
}