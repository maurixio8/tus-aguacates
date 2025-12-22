import { createClient } from '@supabase/supabase-js';

// Obtener variables de entorno
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Faltan variables de entorno de Supabase. Asegúrate de configurar NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY');
}

// Configuración mejorada para persistencia de sesión extendida
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    // Configurar flujo de PKCE para mayor seguridad
    flowType: 'pkce',
  }
});

// Función para configurar persistencia extendida cuando "Recordarme" está activado
export function configureExtendedSession(rememberMe: boolean = false) {
  if (typeof window === 'undefined') return;
  
  if (rememberMe) {
    // Usar localStorage para persistencia extendida
    localStorage.setItem('supabase.auth.persistSession', 'true');
    localStorage.setItem('supabase.auth.autoRefreshToken', 'true');
  } else {
    // Usar sessionStorage para sesión temporal
    sessionStorage.setItem('supabase.auth.persistSession', 'true');
    sessionStorage.setItem('supabase.auth.autoRefreshToken', 'true');
  }
}

// Types
export interface ProductVariant {
  id: string;
  product_id: string;
  variant_name: string;
  variant_value: string;
  price_adjustment: number;
  stock_quantity: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  category_id: string;
  price: number;
  discount_price?: number;
  unit: string;
  weight?: number;
  min_quantity: number;
  main_image_url?: string;
  images?: string[];
  stock: number;
  reserved_stock: number;
  is_featured: boolean;
  is_organic?: boolean;
  is_active: boolean;
  benefits?: string[];
  rating: number;
  review_count: number;
  slug: string;
  sku?: string;
  created_at: string;
  updated_at: string;
  variants?: ProductVariant[];
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  image_url?: string;
  slug: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CartItem {
  id: string;
  user_id: string;
  product_id: string;
  quantity: number;
  price_snapshot: number;
  created_at: string;
  updated_at: string;
  product?: Product;
}

export interface Address {
  id: string;
  user_id: string;
  label: string; // "Casa", "Trabajo", "Oficina", etc.
  full_name: string;
  phone: string;
  street_address: string;
  city: string;
  state: string;
  postal_code?: string;
  additional_info?: string; // Referencias, instrucciones de entrega
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: string;
  order_number: string;
  user_id: string;
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  subtotal: number;
  tax: number;
  shipping_fee: number;
  discount: number;
  total: number;
  total_amount?: number; // Alias para total, usado en admin
  coupon_code?: string;
  address_id?: string; // Referencia a addresses table
  shipping_address?: any; // JSONB snapshot de la dirección
  shipping_address_id?: string; // Deprecated - usar address_id
  shipping_address_snapshot?: any; // Deprecated - usar shipping_address
  payment_method?: string;
  payment_status: 'pending' | 'completed' | 'failed' | 'refunded';
  notes?: string;
  order_data?: any; // JSON con items, subtotal, discount, shipping, total, etc.
  created_at: string;
  updated_at: string;
  confirmed_at?: string;
  shipped_at?: string;
  delivered_at?: string;
  cancelled_at?: string;
  created_from_guest?: boolean; // Indica si se creó desde pedido invitado
  guest_order_id?: string; // ID del pedido invitado original
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  product_snapshot: any;
  quantity: number;
  unit_price: number;
  subtotal: number;
  created_at: string;
}

export interface Profile {
  id: string;
  full_name?: string;
  preferred_name?: string;
  phone?: string;
  avatar_url?: string;
  role: 'customer' | 'admin';
  preferred_payment_method?: 'daviplata' | 'efectivo';
  created_at: string;
  updated_at: string;
}

// Subscription interfaces
export interface Subscription {
  id: string;
  user_id: string;
  name: string;
  frequency_days: number;
  status: 'active' | 'paused' | 'cancelled' | 'expired';
  next_delivery_date: string;
  last_delivery_date?: string;
  start_date: string;
  end_date?: string;
  address_id: string;
  shipping_address_snapshot?: any;
  payment_method: 'daviplata' | 'efectivo';
  fixed_products: SubscriptionProduct[];
  optional_products: SubscriptionProduct[];
  product_preferences: Record<string, any>;
  base_total: number;
  shipping_fee: number;
  estimated_total: number;
  total_deliveries: number;
  successful_deliveries: number;
  failed_deliveries: number;
  notification_days_before: number;
  email_notifications: boolean;
  whatsapp_notifications: boolean;
  created_at: string;
  updated_at: string;
  cancelled_at?: string;
  cancellation_reason?: string;
  notes?: string;
  tags?: string[];
  metadata?: Record<string, any>;
}

export interface SubscriptionProduct {
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  variant_id?: string;
  variant_name?: string;
  product_image?: string;
  is_optional?: boolean;
}

export interface SubscriptionDelivery {
  id: string;
  subscription_id: string;
  order_id?: string;
  delivery_date: string;
  scheduled_date: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  products_snapshot: SubscriptionProduct[];
  total_amount: number;
  shipping_fee: number;
  processed_at?: string;
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded';
  paid_at?: string;
  notification_sent: boolean;
  notification_sent_at?: string;
  created_at: string;
  updated_at: string;
  error_message?: string;
  retry_count: number;
  next_retry_at?: string;
}

export interface SubscriptionModification {
  id: string;
  subscription_id: string;
  modification_type: 'products' | 'address' | 'payment' | 'frequency' | 'pause' | 'resume' | 'cancel';
  old_values?: Record<string, any>;
  new_values?: Record<string, any>;
  modified_by?: string;
  modified_at: string;
  reason?: string;
}
