/**
 * =====================================================
 * CHAT HISTORY SERVICE - El Mayordomo "Magistral"
 * =====================================================
 *
 * Servicio para persistir y recuperar historial de chat.
 * Proporciona memoria a largo plazo para el Mayordomo.
 *
 * Features:
 * - Persistencia en Supabase
 * - Cache local (localStorage) como fallback
 * - Gestión de sesiones de chat
 * - Sincronización entre dispositivos
 */

import { supabase } from '@/lib/supabase';

// =====================================================
// TIPOS
// =====================================================

export interface ChatMessage {
  id: string;
  sessionId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  messageType: 'text' | 'products' | 'options' | 'action';
  metadata?: Record<string, unknown>;
  cartContext?: {
    itemCount: number;
    total: number;
    items: Array<{ name: string; qty: number }>;
  };
  pageContext?: string;
  createdAt: Date;
}

export interface ChatSession {
  id: string;
  userId: string | null;
  guestId: string | null;
  startedAt: Date;
  endedAt: Date | null;
  initialPage: string;
  deviceType: string;
  isProactive: boolean;
  metadata: Record<string, unknown>;
}

export interface ChatContext {
  session: ChatSession | null;
  messages: ChatMessage[];
  userPreferences: UserPreferences | null;
  recentPurchases: RecentPurchase[];
}

export interface UserPreferences {
  preferredCategories: string[];
  dietaryPreferences: string[];
  purchaseFrequency: string | null;
  avgOrderValue: number | null;
  favoriteProducts: string[];
}

export interface RecentPurchase {
  id: string;
  total: number;
  createdAt: Date;
}

// =====================================================
// CONSTANTES
// =====================================================

const LOCAL_STORAGE_KEY = 'mayordomo_chat_history';
const LOCAL_STORAGE_SESSION_KEY = 'mayordomo_session_id';
const MAX_LOCAL_MESSAGES = 50;
const MAX_CONTEXT_MESSAGES = 20;

// =====================================================
// CLASE PRINCIPAL
// =====================================================

export class ChatHistoryService {
  private currentSessionId: string | null = null;
  private userId: string | null = null;
  private guestId: string | null = null;
  private isOnline: boolean = true;

  constructor() {
    // Generar guest ID si no existe
    if (typeof window !== 'undefined') {
      this.guestId = localStorage.getItem('mayordomo_guest_id');
      if (!this.guestId) {
        this.guestId = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        localStorage.setItem('mayordomo_guest_id', this.guestId);
      }

      // Restaurar sesión si existe
      this.currentSessionId = localStorage.getItem(LOCAL_STORAGE_SESSION_KEY);

      // Detectar estado de conexión
      window.addEventListener('online', () => { this.isOnline = true; });
      window.addEventListener('offline', () => { this.isOnline = false; });
    }
  }

  // =====================================================
  // API PÚBLICA - SESIONES
  // =====================================================

  /**
   * Iniciar nueva sesión de chat
   */
  async startSession(options: {
    userId?: string | null;
    initialPage: string;
    deviceType: string;
    isProactive?: boolean;
  }): Promise<ChatSession> {
    this.userId = options.userId || null;

    const sessionData = {
      user_id: this.userId,
      guest_id: this.userId ? null : this.guestId,
      initial_page: options.initialPage,
      device_type: options.deviceType,
      is_proactive: options.isProactive || false,
      metadata: {},
    };

    try {
      if (this.isOnline) {
        const { data, error } = await supabase
          .from('chat_sessions')
          .insert(sessionData)
          .select()
          .single();

        if (error) throw error;

        this.currentSessionId = data.id;
        if (typeof window !== 'undefined') {
          localStorage.setItem(LOCAL_STORAGE_SESSION_KEY, data.id);
        }

        return this.mapSessionFromDb(data);
      }
    } catch (error) {
      console.error('[ChatHistory] Error creating session in DB:', error);
    }

    // Fallback: sesión local
    const localSession: ChatSession = {
      id: `local_${Date.now()}`,
      userId: this.userId,
      guestId: this.guestId,
      startedAt: new Date(),
      endedAt: null,
      initialPage: options.initialPage,
      deviceType: options.deviceType,
      isProactive: options.isProactive || false,
      metadata: {},
    };

    this.currentSessionId = localSession.id;
    if (typeof window !== 'undefined') {
      localStorage.setItem(LOCAL_STORAGE_SESSION_KEY, localSession.id);
    }

    return localSession;
  }

  /**
   * Finalizar sesión actual
   */
  async endSession(): Promise<void> {
    if (!this.currentSessionId) return;

    try {
      if (this.isOnline && !this.currentSessionId.startsWith('local_')) {
        await supabase
          .from('chat_sessions')
          .update({ ended_at: new Date().toISOString() })
          .eq('id', this.currentSessionId);
      }
    } catch (error) {
      console.error('[ChatHistory] Error ending session:', error);
    }

    this.currentSessionId = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem(LOCAL_STORAGE_SESSION_KEY);
    }
  }

  /**
   * Obtener sesión actual o crear una nueva
   */
  async getOrCreateSession(options: {
    userId?: string | null;
    initialPage: string;
    deviceType: string;
  }): Promise<ChatSession> {
    // Si hay sesión activa, retornarla
    if (this.currentSessionId) {
      try {
        if (!this.currentSessionId.startsWith('local_')) {
          const { data } = await supabase
            .from('chat_sessions')
            .select('*')
            .eq('id', this.currentSessionId)
            .is('ended_at', null)
            .single();

          if (data) {
            return this.mapSessionFromDb(data);
          }
        }
      } catch (error) {
        // Sesión no encontrada, crear nueva
      }
    }

    return this.startSession(options);
  }

  // =====================================================
  // API PÚBLICA - MENSAJES
  // =====================================================

  /**
   * Guardar un mensaje
   */
  async saveMessage(message: Omit<ChatMessage, 'id' | 'sessionId' | 'createdAt'>): Promise<ChatMessage> {
    const fullMessage: ChatMessage = {
      ...message,
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      sessionId: this.currentSessionId || 'unknown',
      createdAt: new Date(),
    };

    // Guardar localmente siempre (cache)
    this.saveToLocalStorage(fullMessage);

    // Intentar guardar en Supabase
    try {
      if (this.isOnline && this.currentSessionId && !this.currentSessionId.startsWith('local_')) {
        const { data, error } = await supabase
          .from('chat_history')
          .insert({
            session_id: this.currentSessionId,
            user_id: this.userId,
            guest_id: this.userId ? null : this.guestId,
            role: message.role,
            content: message.content,
            message_type: message.messageType,
            metadata: message.metadata || {},
            cart_context: message.cartContext || null,
            page_context: message.pageContext || null,
          })
          .select()
          .single();

        if (!error && data) {
          fullMessage.id = data.id;
        }
      }
    } catch (error) {
      console.error('[ChatHistory] Error saving message to DB:', error);
    }

    return fullMessage;
  }

  /**
   * Obtener historial de mensajes de la sesión actual
   */
  async getSessionMessages(limit: number = MAX_CONTEXT_MESSAGES): Promise<ChatMessage[]> {
    // Primero intentar desde Supabase
    try {
      if (this.isOnline && this.currentSessionId && !this.currentSessionId.startsWith('local_')) {
        const { data, error } = await supabase
          .from('chat_history')
          .select('*')
          .eq('session_id', this.currentSessionId)
          .order('created_at', { ascending: false })
          .limit(limit);

        if (!error && data?.length) {
          return data.map(this.mapMessageFromDb).reverse();
        }
      }
    } catch (error) {
      console.error('[ChatHistory] Error fetching messages from DB:', error);
    }

    // Fallback: localStorage
    return this.getFromLocalStorage().slice(-limit);
  }

  /**
   * Obtener contexto completo del usuario para n8n
   */
  async getUserContext(): Promise<ChatContext> {
    const messages = await this.getSessionMessages();

    let userPreferences: UserPreferences | null = null;
    let recentPurchases: RecentPurchase[] = [];

    if (this.userId) {
      try {
        // Obtener preferencias del usuario
        const { data: contextData } = await supabase
          .from('user_context')
          .select('*')
          .eq('user_id', this.userId)
          .single();

        if (contextData) {
          userPreferences = {
            preferredCategories: contextData.preferred_categories || [],
            dietaryPreferences: contextData.dietary_preferences || [],
            purchaseFrequency: contextData.purchase_frequency,
            avgOrderValue: contextData.avg_order_value,
            favoriteProducts: contextData.favorite_products || [],
          };
        }

        // Obtener compras recientes
        const { data: ordersData } = await supabase
          .from('orders')
          .select('id, total, created_at')
          .eq('user_id', this.userId)
          .order('created_at', { ascending: false })
          .limit(3);

        if (ordersData) {
          recentPurchases = ordersData.map((o) => ({
            id: o.id,
            total: o.total,
            createdAt: new Date(o.created_at),
          }));
        }
      } catch (error) {
        console.error('[ChatHistory] Error fetching user context:', error);
      }
    }

    return {
      session: this.currentSessionId ? {
        id: this.currentSessionId,
        userId: this.userId,
        guestId: this.guestId,
        startedAt: new Date(),
        endedAt: null,
        initialPage: '',
        deviceType: '',
        isProactive: false,
        metadata: {},
      } : null,
      messages,
      userPreferences,
      recentPurchases,
    };
  }

  /**
   * Formatear mensajes para enviar a n8n
   */
  formatMessagesForN8n(messages: ChatMessage[], limit: number = 10): Array<{
    role: 'user' | 'assistant';
    content: string;
  }> {
    return messages
      .slice(-limit)
      .filter((m) => m.role !== 'system')
      .map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      }));
  }

  // =====================================================
  // HELPERS PRIVADOS
  // =====================================================

  private saveToLocalStorage(message: ChatMessage): void {
    if (typeof window === 'undefined') return;

    try {
      const existing = this.getFromLocalStorage();
      const updated = [...existing, message].slice(-MAX_LOCAL_MESSAGES);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error('[ChatHistory] Error saving to localStorage:', error);
    }
  }

  private getFromLocalStorage(): ChatMessage[] {
    if (typeof window === 'undefined') return [];

    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (!stored) return [];

      const messages = JSON.parse(stored);
      return messages.map((m: any) => ({
        ...m,
        createdAt: new Date(m.createdAt),
      }));
    } catch (error) {
      console.error('[ChatHistory] Error reading from localStorage:', error);
      return [];
    }
  }

  private mapMessageFromDb(row: any): ChatMessage {
    return {
      id: row.id,
      sessionId: row.session_id,
      role: row.role,
      content: row.content,
      messageType: row.message_type || 'text',
      metadata: row.metadata,
      cartContext: row.cart_context,
      pageContext: row.page_context,
      createdAt: new Date(row.created_at),
    };
  }

  private mapSessionFromDb(row: any): ChatSession {
    return {
      id: row.id,
      userId: row.user_id,
      guestId: row.guest_id,
      startedAt: new Date(row.started_at),
      endedAt: row.ended_at ? new Date(row.ended_at) : null,
      initialPage: row.initial_page,
      deviceType: row.device_type,
      isProactive: row.is_proactive,
      metadata: row.metadata || {},
    };
  }

  // =====================================================
  // UTILIDADES ESTÁTICAS
  // =====================================================

  /**
   * Limpiar historial local (para testing o logout)
   */
  static clearLocalHistory(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    localStorage.removeItem(LOCAL_STORAGE_SESSION_KEY);
  }
}

// =====================================================
// SINGLETON EXPORT
// =====================================================

export const chatHistoryService = new ChatHistoryService();
