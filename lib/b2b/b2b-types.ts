/**
 * Tipos TypeScript para la sección B2B (Business to Business)
 * "Tus Aguacates" - E-commerce Platform
 */

// ============================================================================
// CATEGORIAS B2B
// ============================================================================

export interface B2BCategory {
  id: string;
  parent_id: string | null;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  sort_order: number;
  is_active: boolean;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface B2BCategoryFormData {
  parent_id?: string;
  name: string;
  slug?: string;
  description?: string;
  image_url?: string;
  sort_order?: number;
  is_active?: boolean;
}

// ============================================================================
// EMPRESAS B2B
// ============================================================================

export type BusinessType = 'restaurant' | 'retail' | 'distributor' | 'manufacturer' | 'other';
export type CompanyStatus = 'pending' | 'active' | 'inactive' | 'suspended';

export interface Address {
  street_address: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  additional_info?: string;
}

export interface B2BCompany {
  id: string;
  company_name: string;
  nit: string;
  business_type: BusinessType | null;
  industry: string | null;
  website_url: string | null;
  logo_url: string | null;

  // Contact info
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  billing_email: string | null;

  // Addresses (JSONB)
  business_address: Address;
  shipping_address: Address;
  billing_address: Address;

  // Order settings
  minimum_order_amount: number;

  // Status
  status: CompanyStatus;

  // User who created
  created_by_user_id: string | null;

  // Metadata
  notes: string | null;
  metadata: Record<string, any>;

  // Timestamps
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface B2BCompanyFormData {
  company_name: string;
  nit: string;
  business_type?: BusinessType;
  industry?: string;
  website_url?: string;
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  billing_email?: string;
  business_address: Address;
  shipping_address: Address;
  billing_address: Address;
  minimum_order_amount?: number;
}

// ============================================================================
// USUARIOS DE EMPRESA B2B
// ============================================================================

export type B2BUserRole = 'owner' | 'admin' | 'member' | 'viewer';
export type B2BUserStatus = 'active' | 'inactive' | 'pending';

export interface B2BCompanyUser {
  id: string;
  company_id: string;
  user_id: string;
  role: B2BUserRole;

  // Permissions
  can_place_orders: boolean;
  can_view_orders: boolean;
  can_manage_users: boolean;
  can_view_reports: boolean;

  // Status
  is_primary: boolean;
  status: B2BUserStatus;

  // Invitation
  invited_by: string | null;
  invited_at: string;
  accepted_at: string | null;

  created_at: string;
  updated_at: string;
}

export interface B2BCompanyWithUsers extends B2BCompany {
  users?: B2BCompanyUser[];
}

// ============================================================================
// PRODUCTOS B2B
// ============================================================================

export type B2BProductUnit = 'kg' | 'unit' | 'lb' | 'box' | 'case' | 'pallet';

export interface B2BProduct {
  id: string;
  sku: string;
  name: string;
  description: string | null;
  category_id: string | null;

  // Precios
  base_price: number;
  cost_price: number | null;

  // Inventario
  stock_quantity: number;
  minimum_order_quantity: number;
  unit: B2BProductUnit;

  // Estado
  is_active: boolean;
  is_featured: boolean;

  // Media
  main_image_url: string | null;
  images: string[];

  // Especificaciones
  specifications: Record<string, any>;
  benefits: string[];

  // Referencia B2C
  b2c_product_id: string | null;

  // Metadata
  metadata: Record<string, any>;

  // Timestamps
  created_at: string;
  updated_at: string;
  deleted_at: string | null;

  // Campos computados (no en BD)
  category?: B2BCategory;
  pricing_tiers?: B2BPricingTier[];
  applied_price_for_quantity?: (quantity: number) => B2BPricingResult;
}

export interface B2BProductFormData {
  sku: string;
  name: string;
  description?: string;
  category_id?: string;
  base_price: number;
  cost_price?: number;
  stock_quantity: number;
  minimum_order_quantity: number;
  unit: B2BProductUnit;
  is_active?: boolean;
  is_featured?: boolean;
  main_image_url?: string;
  images?: string[];
  specifications?: Record<string, any>;
  benefits?: string[];
  b2c_product_id?: string;
}

// ============================================================================
// PRICING TIERS (Precios por Volumen)
// ============================================================================

export interface B2BPricingTier {
  id: string;
  product_id: string;
  min_quantity: number;
  max_quantity: number | null;
  tier_name: string | null;
  price_per_unit: number;
  discount_percentage: number;
  priority: number;
  created_at: string;
  updated_at: string;
}

export interface B2BPricingTierFormData {
  product_id: string;
  min_quantity: number;
  max_quantity?: number;
  tier_name?: string;
  price_per_unit: number;
  discount_percentage?: number;
  priority?: number;
}

export interface B2BPricingResult {
  tier: B2BPricingTier | null;
  unit_price: number;
  discount_percentage: number;
  total_price: number;
  savings: number;
  quantity: number;
}

// ============================================================================
// PRECIOS ESPECIALES POR EMPRESA (Opcional - para futuro)
// ============================================================================

export interface B2BCompanyPricing {
  id: string;
  company_id: string;
  product_id: string;
  price_per_unit: number;
  valid_from: string;
  valid_until: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// PEDIDOS B2B
// ============================================================================

export type B2BOrderStatus = 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'on_hold';
export type B2BPaymentMethod = 'bold_pay' | 'transfer' | 'cash';
export type B2BPaymentStatus = 'pending' | 'partial' | 'completed' | 'failed' | 'refunded';

export interface GuestContactInfo {
  name: string;
  email: string;
  phone: string;
  company_name: string;
}

export interface B2BOrder {
  id: string;
  order_number: string;

  // Empresa (nullable para guests)
  company_id: string | null;
  company?: B2BCompany;

  // Usuario (nullable para guests)
  user_id: string | null;

  // Info guest (JSONB)
  guest_contact_info: GuestContactInfo | null;

  // Estado
  status: B2BOrderStatus;

  // Montos
  subtotal: number;
  tax: number;
  shipping_fee: number;
  discount: number;
  total: number;

  // Pago (solo pago inmediato, SIN crédito)
  payment_method: B2BPaymentMethod | null;
  payment_status: B2BPaymentStatus;
  payment_reference: string | null;

  // Envío
  shipping_address: Address | null;
  shipping_address_id: string | null;
  delivery_notes: string | null;
  requested_delivery_date: Date | null;

  // Notas
  order_notes: string | null;
  internal_notes: string | null;
  customer_purchase_order: string | null;

  // Items (lazy loaded)
  items?: B2BOrderItem[];

  // Timestamps
  created_at: string;
  updated_at: string;
  confirmed_at: string | null;
  shipped_at: string | null;
  delivered_at: string | null;
  cancelled_at: string | null;
  deleted_at: string | null;
}

export interface B2BOrderFormData {
  company_id?: string;
  guest_contact_info?: GuestContactInfo;
  shipping_address?: Address;
  shipping_address_id?: string;
  delivery_notes?: string;
  requested_delivery_date?: Date;
  order_notes?: string;
  customer_purchase_order?: string;
  payment_method: B2BPaymentMethod;
}

// ============================================================================
// ITEMS DE PEDIDO B2B
// ============================================================================

export interface B2BOrderItem {
  id: string;
  order_id: string;
  product_id: string;

  // Snapshot del producto al momento del pedido
  product_snapshot: {
    id: string;
    sku: string;
    name: string;
    unit: B2BProductUnit;
    main_image_url: string | null;
  };

  // Snapshot del pricing tier aplicado
  pricing_tier_snapshot: {
    id: string;
    tier_name: string | null;
    min_quantity: number;
    max_quantity: number | null;
  } | null;

  // Cantidad y pricing
  quantity: number;
  unit_price: number;
  discount_percentage: number;
  subtotal: number;

  // Tier aplicado
  applied_tier_id: string | null;
  applied_tier_name: string | null;

  created_at: string;
}

// ============================================================================
// PEDIDOS RECURRENTES B2B
// ============================================================================

export type RecurringFrequencyType = 'daily' | 'weekly' | 'biweekly' | 'monthly';
export type RecurringStatus = 'active' | 'paused' | 'cancelled';
export type DeliveryDayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

export interface RecurringOrderItem {
  product_id: string;
  quantity: number;
  notes?: string;
}

export interface B2BRecurringOrder {
  id: string;
  company_id: string;
  company?: B2BCompany;
  user_id: string;
  name: string;

  // Programación
  frequency_type: RecurringFrequencyType;
  frequency_interval: number;
  delivery_day_of_week: DeliveryDayOfWeek | null;
  delivery_day_of_month: number | null;

  // Estado
  is_active: boolean;
  status: RecurringStatus;

  // Plantilla de pedido
  items: RecurringOrderItem[];
  shipping_address: Address | null;
  delivery_notes: string | null;

  // Fechas de entrega
  next_delivery_date: Date | null;
  last_delivery_date: Date | null;

  // Metadata
  metadata: Record<string, any>;

  // Timestamps
  created_at: string;
  updated_at: string;
  paused_at: string | null;
  cancelled_at: string | null;
}

export interface B2BRecurringOrderFormData {
  name: string;
  frequency_type: RecurringFrequencyType;
  frequency_interval?: number;
  delivery_day_of_week?: DeliveryDayOfWeek;
  delivery_day_of_month?: number;
  items: RecurringOrderItem[];
  shipping_address?: Address;
  delivery_notes?: string;
}

// ============================================================================
// CARRITO B2B
// ============================================================================

export interface B2BCartItem {
  product_id: string;
  product: B2BProduct;
  quantity: number;
  unit_price: number;
  applied_tier: B2BPricingTier | null;
  subtotal: number;
  discount_percentage: number;
}

export interface B2BCartState {
  items: B2BCartItem[];
  company_id: string | null;
  is_guest: boolean;
  guest_info: GuestContactInfo | null;
  minimum_order_amount: number;

  // Actions
  addItem: (product: B2BProduct, quantity: number) => void;
  removeItem: (product_id: string) => void;
  updateQuantity: (product_id: string, quantity: number) => void;
  clearCart: () => void;
  setCompany: (company_id: string | null) => void;
  setGuestInfo: (info: GuestContactInfo) => void;
  setIsGuest: (is_guest: boolean) => void;

  // Getters
  getSubtotal: () => number;
  getTotal: () => number;
  getTotalItems: () => number;
  meetsMinimumOrder: () => boolean;
  getAppliedTiers: () => B2BPricingTier[];
}

// ============================================================================
// FILTROS Y PAGINACIÓN
// ============================================================================

export interface B2BProductFilters {
  category_id?: string;
  search?: string;
  is_active?: boolean;
  is_featured?: boolean;
  min_price?: number;
  max_price?: number;
  unit?: B2BProductUnit;
  sort_by?: 'name' | 'price' | 'created_at' | 'stock_quantity';
  sort_order?: 'asc' | 'desc';
  page?: number;
  page_size?: number;
}

export interface B2BProductPaginatedResponse {
  data: B2BProduct[];
  pagination: {
    total: number;
    page: number;
    page_size: number;
    total_pages: number;
    has_next: boolean;
    has_previous: boolean;
  };
}

export interface B2BOrderFilters {
  company_id?: string;
  user_id?: string;
  status?: B2BOrderStatus;
  payment_status?: B2BPaymentStatus;
  date_from?: string;
  date_to?: string;
  order_number?: string;
  sort_by?: 'created_at' | 'total' | 'order_number';
  sort_order?: 'asc' | 'desc';
  page?: number;
  page_size?: number;
}

export interface B2BOrderPaginatedResponse {
  data: B2BOrder[];
  pagination: {
    total: number;
    page: number;
    page_size: number;
    total_pages: number;
    has_next: boolean;
    has_previous: boolean;
  };
}

// ============================================================================
// REPORTES Y ESTADÍSTICAS
// ============================================================================

export interface B2BSalesSummary {
  period: string;
  total_orders: number;
  total_sales: number;
  average_order_value: number;
  total_products_sold: number;
  top_products: Array<{
    product_id: string;
    product_name: string;
    total_quantity: number;
    total_revenue: number;
  }>;
}

export interface B2BCompanyStats {
  company_id: string;
  company_name: string;
  total_orders: number;
  total_spent: number;
  average_order_value: number;
  last_order_date: string | null;
  favorite_products: Array<{
    product_id: string;
    product_name: string;
    order_count: number;
    total_quantity: number;
  }>;
}

// ============================================================================
// ERRORES Y VALIDACIONES
// ============================================================================

export class B2BValidationError extends Error {
  constructor(
    message: string,
    public field: string,
    public code: string
  ) {
    super(message);
    this.name = 'B2BValidationError';
  }
}

export class B2BMinimumOrderError extends Error {
  constructor(
    public current_total: number,
    public minimum_amount: number
  ) {
    super(`El monto mínimo de pedido es $${minimum_amount.toLocaleString()}. Current: $${current_total.toLocaleString()}`);
    this.name = 'B2BMinimumOrderError';
  }
}

export class B2BInsufficientStockError extends Error {
  constructor(
    public product_name: string,
    public requested: number,
    public available: number
  ) {
    super(`Stock insuficiente para ${product_name}. Solicitado: ${requested}, Disponible: ${available}`);
    this.name = 'B2BInsufficientStockError';
  }
}

// ============================================================================
// RESPUESTAS API
// ============================================================================

export interface B2BApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code: string;
    details?: any;
  };
  meta?: {
    timestamp: string;
    request_id: string;
  };
}

export interface B2BCheckoutRequest {
  items: Array<{
    product_id: string;
    quantity: number;
  }>;
  company_id?: string;
  guest_contact_info?: GuestContactInfo;
  shipping_address?: Address;
  shipping_address_id?: string;
  delivery_notes?: string;
  requested_delivery_date?: string;
  order_notes?: string;
  customer_purchase_order?: string;
  payment_method: B2BPaymentMethod;
}

export interface B2BCheckoutResponse {
  order: B2BOrder;
  payment_url?: string;
  payment_reference?: string;
}
