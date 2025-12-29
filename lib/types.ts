// Tipos unificados para todo el proyecto
// Este archivo resuelve conflictos entre lib/supabase.ts y lib/productStorage.ts

// Tipo unificado de ProductVariant que combina ambas definiciones
export interface UnifiedProductVariant {
  id: string;
  product_id: string;
  variant_name: string;
  variant_value: string;
  price_adjustment: number;
  stock_quantity?: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

// Tipo para disponibilidad de productos
export type ProductAvailability = 'both' | 'business' | 'retail';

// Tipo unificado de Product que combina ambos sistemas
export interface UnifiedProduct {
  // Campos requeridos (mínimo necesario)
  id: string;
  name: string;
  description: string;
  price: number;

  // Campos opcionales con tipos correctos
  category?: string;
  category_id?: string;
  discount_price?: number;
  unit?: string;
  weight?: number;
  min_quantity?: number;
  available_for?: ProductAvailability; // Indica dónde está disponible el producto
  
  // ✅ IMPORTANTE: Unificar campos de imagen
  // main_image_url es el campo estándar de Supabase
  // image es el campo usado en productStorage.ts
  // Ambos deben ser soportados para compatibilidad
  main_image_url?: string;
  image?: string;
  images?: string[];
  
  stock?: number;
  reserved_stock?: number;
  is_featured?: boolean;
  is_organic?: boolean;
  is_active?: boolean;
  benefits?: string[];
  rating?: number;
  review_count?: number;
  slug?: string;
  sku?: string;
  created_at?: string;
  updated_at?: string;
  
  // Campos adicionales para variantes
  variants?: UnifiedProductVariant[];
  hasVariants?: boolean;
  base_price?: number;
}

// Tipos extendidos para compatibilidad con Supabase
export interface Product extends UnifiedProduct {
  // Campos específicos de Supabase que siempre deben existir
  stock: number;
  reserved_stock: number;
  is_featured: boolean;
  is_active: boolean;
  rating: number;
  review_count: number;
  slug: string;
  created_at: string;
  updated_at: string;
}

// Tipos extendidos para compatibilidad con productStorage
export interface ProductStorage extends UnifiedProduct {
  // Campos específicos de productStorage
  category?: string;
  hasVariants?: boolean;
  base_price?: number;
}

// Helper para obtener la URL de imagen correcta
export function getProductImageUrl(product: UnifiedProduct): string {
  // Prioridad: main_image_url (Supabase) > image (productStorage) > string vacío
  return product.main_image_url || product.image || '';
}

// Helper para verificar si un producto tiene imagen válida
export function hasValidImage(product: UnifiedProduct): boolean {
  const imageUrl = getProductImageUrl(product);
  return !!imageUrl && imageUrl.trim() !== '';
}

// Helper para normalizar producto para el carrito
export function normalizeProductForCart(product: UnifiedProduct): UnifiedProduct {
  return {
    ...product,
    // Asegurar que main_image_url esté presente
    main_image_url: getProductImageUrl(product),
    // Valores por defecto para campos requeridos
    stock: product.stock ?? 100,
    reserved_stock: product.reserved_stock ?? 0,
    is_featured: product.is_featured ?? false,
    is_active: product.is_active ?? true,
    rating: product.rating ?? 0,
    review_count: product.review_count ?? 0,
    slug: product.slug ?? product.id,
    created_at: product.created_at ?? new Date().toISOString(),
    updated_at: product.updated_at ?? new Date().toISOString(),
  };
}

// Tipos para OrderItems con productos unificados
export interface OrderItemWithProduct {
  id: string;
  order_id: string;
  product_id: string;
  product_snapshot: any;
  quantity: number;
  unit_price: number;
  subtotal: number;
  created_at: string;
  // Producto completo si se hace JOIN
  product?: UnifiedProduct;
}

// Tipo para Order con items unificados
export interface OrderWithUnifiedItems {
  id: string;
  order_number: string;
  user_id: string;
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  subtotal: number;
  tax: number;
  shipping_fee: number;
  discount: number;
  total: number;
  coupon_code?: string;
  address_id?: string;
  shipping_address?: any;
  shipping_address_id?: string;
  shipping_address_snapshot?: any;
  payment_method?: string;
  payment_status: 'pending' | 'completed' | 'failed' | 'refunded';
  notes?: string;
  created_at: string;
  updated_at: string;
  confirmed_at?: string;
  shipped_at?: string;
  delivered_at?: string;
  cancelled_at?: string;
  created_from_guest?: boolean;
  guest_order_id?: string;
  // Items con productos unificados
  items?: OrderItemWithProduct[];
}

// Exportar también los tipos de Supabase para compatibilidad
export type {
  ProductVariant,
  Category,
  CartItem,
  Address,
  Order,
  Profile,
  Subscription,
  SubscriptionProduct,
  SubscriptionDelivery,
  SubscriptionModification
} from './supabase';