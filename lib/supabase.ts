import { createClient } from '@supabase/supabase-js';

// Obtener variables de entorno
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Faltan variables de entorno de Supabase. Asegúrate de configurar NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

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
  type: 'shipping' | 'billing';
  street: string;
  number: string;
  apartment?: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  is_default: boolean;
  notes?: string;
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
