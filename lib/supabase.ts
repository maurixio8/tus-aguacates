import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://gxqkmaaqoehydulksudj.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd4cWttYWFxb2VoeWR1bGtzdWRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI0NDI5NDQsImV4cCI6MjA3ODAxODk0NH0.XAR-ysQgt0ZkRZfIZx_DvpYMzmEMFsdAYK3EP1tc0mw";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types
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
  is_active: boolean;
  benefits?: string[];
  rating: number;
  review_count: number;
  slug: string;
  sku?: string;
  created_at: string;
  updated_at: string;
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
