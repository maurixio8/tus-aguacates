/**
 * =====================================================
 * CHAT SERVICES - El Mayordomo "Magistral"
 * =====================================================
 *
 * Exportaciones centralizadas de los servicios de chat.
 */

// Servicios principales
export { ChatHistoryService, chatHistoryService } from './chat-history-service';
export {
  ProactiveEngine,
  proactiveEngine,
  getDeviceType,
  getUserProactiveData,
} from './proactive-engine';

// Tipos
export type {
  ChatMessage,
  ChatSession,
  ChatContext,
  UserPreferences,
  RecentPurchase,
} from './chat-history-service';

export type {
  ProactiveContext,
  ProactiveTrigger,
  ProactiveConfig,
} from './proactive-engine';
