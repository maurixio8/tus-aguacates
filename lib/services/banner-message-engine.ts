import { BannerMessage, MessageVariables, MessageEngineConfig, DisplayConditions } from '@/lib/types/banner';

export interface RenderedMessage {
  id: string;
  text: string;
  type: BannerMessage['message_type'];
  priority: number;
  variables: MessageVariables;
}
import { supabase } from '@/lib/supabase';

// Configuración por defecto para el motor de mensajes
const DEFAULT_CONFIG: MessageEngineConfig = {
  refreshInterval: 30000, // 30 segundos entre rotaciones
  cacheTimeout: 300000, // 5 minutos para refrescar datos
  enableDataIntegration: true,
  fallbackMessages: [
    'Solo 23 cajas de aguacates disponibles hoy',
    'Las frutas tropicales están más baratas esta semana',
    '¡Últimas unidades de productos frescos!',
    'Calidad Premium garantizada en todos nuestros productos'
  ]
};

export class BannerMessageEngine {
  private config: MessageEngineConfig;
  private cache: Map<string, any> = new Map();
  private currentMessageIndex = 0;
  private messages: BannerMessage[] = [];

  constructor(config: Partial<MessageEngineConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Carga los mensajes desde la base de datos
   */
  async loadMessages(): Promise<BannerMessage[]> {
    try {
      const { data, error } = await supabase
        .from('banner_messages')
        .select('*')
        .eq('is_active', true)
        .order('priority', { ascending: false });

      if (error) {
        console.error('Error loading banner messages:', error);
        return [];
      }

      this.messages = data || [];
      return this.messages;
    } catch (error) {
      console.error('Error in loadMessages:', error);
      return [];
    }
  }

  /**
   * Obtiene productos con bajo stock para mensajes de tipo stock
   */
  private async getLowStockProducts(): Promise<MessageVariables[]> {
    if (!this.config.enableDataIntegration) return [];

    try {
      const cacheKey = 'low_stock_products';
      const cached = this.cache.get(cacheKey);

      if (cached && (Date.now() - cached.timestamp) < this.config.cacheTimeout) {
        return cached.data;
      }

      const { data, error } = await supabase
        .from('products')
        .select('name, stock, category_id')
        .lt('stock', 50)
        .gt('stock', 0)
        .order('stock', { ascending: true })
        .limit(5);

      if (error) {
        console.error('Error fetching low stock products:', error);
        return [];
      }

      const products = (data || []).map(product => ({
        stock: product.stock || 0,
        product: product.name || '',
        category: product.category_id || ''
      }));

      this.cache.set(cacheKey, {
        data: products,
        timestamp: Date.now()
      });

      return products;
    } catch (error) {
      console.error('Error in getLowStockProducts:', error);
      return [];
    }
  }

  /**
   * Obtiene productos con descuento para mensajes de tipo oferta
   */
  private async getDiscountedProducts(): Promise<MessageVariables[]> {
    if (!this.config.enableDataIntegration) return [];

    try {
      const cacheKey = 'discounted_products';
      const cached = this.cache.get(cacheKey);

      if (cached && (Date.now() - cached.timestamp) < this.config.cacheTimeout) {
        return cached.data;
      }

      const { data, error } = await supabase
        .from('products')
        .select('name, discount_price, price, category_id')
        .not('discount_price', 'is', null)
        .lt('discount_price', 'price')
        .limit(5);

      if (error) {
        console.error('Error fetching discounted products:', error);
        return [];
      }

      const products = (data || []).map(product => {
        const discount = Math.round(((product.price - product.discount_price) / product.price) * 100);
        return {
          product: product.name || '',
          discount: discount,
          category: product.category_id || ''
        };
      });

      this.cache.set(cacheKey, {
        data: products,
        timestamp: Date.now()
      });

      return products;
    } catch (error) {
      console.error('Error in getDiscountedProducts:', error);
      return [];
    }
  }

  /**
   * Obtiene categorías con productos en descuento
   */
  private async getDiscountedCategories(): Promise<MessageVariables[]> {
    if (!this.config.enableDataIntegration) return [];

    try {
      const cacheKey = 'discounted_categories';
      const cached = this.cache.get(cacheKey);

      if (cached && (Date.now() - cached.timestamp) < this.config.cacheTimeout) {
        return cached.data;
      }

      const { data, error } = await supabase
        .from('products')
        .select('category_id, discount_price, price')
        .not('discount_price', 'is', null)
        .lt('discount_price', 'price');

      if (error) {
        console.error('Error fetching discounted categories:', error);
        return [];
      }

      const categoryDiscounts = new Map();
      (data || []).forEach(product => {
        const discount = Math.round(((product.price - product.discount_price) / product.price) * 100);
        if (!categoryDiscounts.has(product.category_id) || categoryDiscounts.get(product.category_id) < discount) {
          categoryDiscounts.set(product.category_id, discount);
        }
      });

      const categories = Array.from(categoryDiscounts.entries()).map(([category, discount]) => ({
        category,
        discount
      }));

      this.cache.set(cacheKey, {
        data: categories,
        timestamp: Date.now()
      });

      return categories;
    } catch (error) {
      console.error('Error in getDiscountedCategories:', error);
      return [];
    }
  }

  /**
   * Reemplaza las variables en un template
   */
  private replaceTemplateVariables(template: string, variables: MessageVariables): string {
    let result = template;

    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      result = result.replace(regex, String(value));
    });

    return result;
  }

  /**
   * Verifica si un mensaje cumple con las condiciones para mostrarse
   */
  private async meetsConditions(conditions: DisplayConditions): Promise<boolean> {
    if (!conditions || Object.keys(conditions).length === 0) return true;

    try {
      // Verificar condiciones de stock
      if (conditions.min_stock !== undefined || conditions.max_stock !== undefined) {
        const lowStockProducts = await this.getLowStockProducts();
        const hasMatchingStock = lowStockProducts.some(product => {
          const stock = Number(product.stock) || 0;
          return (conditions.min_stock === undefined || stock >= conditions.min_stock) &&
                 (conditions.max_stock === undefined || stock <= conditions.max_stock);
        });

        if (!hasMatchingStock) return false;
      }

      // Verificar condiciones de descuento
      if (conditions.has_discount) {
        const discountedProducts = await this.getDiscountedProducts();
        if (discountedProducts.length === 0) return false;
      }

      return true;
    } catch (error) {
      console.error('Error checking conditions:', error);
      return true; // En caso de error, permitir el mensaje
    }
  }

  /**
   * Genera variables para un tipo específico de mensaje
   */
  private async generateVariables(messageType: BannerMessage['message_type']): Promise<MessageVariables[]> {
    switch (messageType) {
      case 'stock':
        const lowStock = await this.getLowStockProducts();
        return lowStock.length > 0 ? lowStock : [{ stock: 23, product: 'aguacates', category: 'frutas' }];

      case 'offer':
        const discountedCategories = await this.getDiscountedCategories();
        return discountedCategories.length > 0 ? discountedCategories : [{ category: 'frutas tropicales', discount: 20 }];

      case 'urgency':
        const urgencyProducts = await this.getLowStockProducts();
        return urgencyProducts.slice(0, 3).map(p => ({ stock: p.stock, product: p.product }));

      case 'promotion':
        const promos = await this.getDiscountedProducts();
        return promos.slice(0, 3);

      case 'freshness':
        return [{ product: 'aguacates' }];

      case 'seasonal':
        return [{}];

      case 'quality':
        return [{ category: 'frutas frescas' }];

      case 'combo':
        const comboProducts = await this.getLowStockProducts();
        return comboProducts.slice(0, 2).map(p => ({
          stock: p.stock,
          product: p.product,
          discount: 15
        }));

      default:
        return [{}];
    }
  }

  /**
   * Obtiene el siguiente mensaje para mostrar
   */
  async getNextMessage(): Promise<RenderedMessage> {
    // Cargar mensajes si no están cargados
    if (this.messages.length === 0) {
      await this.loadMessages();
    }

    // Si no hay mensajes en BD, usar mensajes fallback
    if (this.messages.length === 0) {
      const fallbackText = this.config.fallbackMessages[this.currentMessageIndex % this.config.fallbackMessages.length];
      this.currentMessageIndex++;
      return {
        id: 'fallback',
        text: fallbackText,
        type: 'seasonal',
        priority: 0,
        variables: {}
      };
    }

    // Buscar el siguiente mensaje que cumpla las condiciones
    let attempts = 0;
    const maxAttempts = this.messages.length;

    while (attempts < maxAttempts) {
      const message = this.messages[this.currentMessageIndex % this.messages.length];
      this.currentMessageIndex++;

      if (await this.meetsConditions(message.display_conditions)) {
        const variablesList = await this.generateVariables(message.message_type);
        const variables = variablesList[0] || {};

        return {
          id: message.id,
          text: this.replaceTemplateVariables(message.template_text, variables),
          type: message.message_type,
          priority: message.priority,
          variables
        };
      }

      attempts++;
    }

    // Si ningún mensaje cumple las condiciones, usar fallback
    const fallbackText = this.config.fallbackMessages[0];
    return {
      id: 'fallback',
      text: fallbackText,
      type: 'seasonal',
      priority: 0,
      variables: {}
    };
  }

  /**
   * Inicia la rotación automática de mensajes
   */
  async startRotation(callback: (message: RenderedMessage) => void): Promise<NodeJS.Timeout> {
    // Obtener mensaje inicial
    const initialMessage = await this.getNextMessage();
    callback(initialMessage);

    // Configurar rotación periódica
    return setInterval(async () => {
      const message = await this.getNextMessage();
      callback(message);
    }, this.config.refreshInterval);
  }

  /**
   * Limpia el caché
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Obtiene todos los mensajes disponibles (para administración)
   */
  async getAllMessages(): Promise<BannerMessage[]> {
    await this.loadMessages();
    return [...this.messages];
  }
}

// Exportar una instancia por defecto
export const defaultMessageEngine = new BannerMessageEngine();