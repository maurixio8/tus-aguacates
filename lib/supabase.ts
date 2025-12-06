import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://gxqkmaaqoehydulksudj.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd4cWttYWFxb2VoeWR1bGtzdWRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI0NDI5NDQsImV4cCI6MjA3ODAxODk0NH0.XAR-ysQgt0ZkRZfIZx_DvpYMzmEMFsdAYK3EP1tc0mw";

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
  coupon_code?: string;
  address_id?: string; // Referencia a addresses table
  shipping_address?: any; // JSONB snapshot de la dirección
  shipping_address_id?: string; // Deprecated - usar address_id
  shipping_address_snapshot?: any; // Deprecated - usar shipping_address
  payment_method?: string;
  payment_status: 'pending' | 'completed' | 'failed' | 'refunded';
  notes?: string;
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
  phone?: string;
  avatar_url?: string;
  role: 'customer' | 'admin';
  created_at: string;
  updated_at: string;
}
