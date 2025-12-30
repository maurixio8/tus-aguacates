-- ============================================================================
-- MIGRACIÓN: Crear tablas B2B para sección de empresas
-- Fecha: 2025-01-28
-- Descripción: Crea todas las tablas necesarias para la sección B2B
--              (Business to Business) sin sistema de crédito
-- ============================================================================

-- ============================================================================
-- 1. TABLA: b2b_categories - Categorías B2B
-- ============================================================================
CREATE TABLE IF NOT EXISTS b2b_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  parent_id UUID REFERENCES b2b_categories(id) ON DELETE SET NULL,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  image_url TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Índices para b2b_categories
CREATE INDEX IF NOT EXISTS idx_b2b_categories_parent ON b2b_categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_b2b_categories_active ON b2b_categories(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_b2b_categories_slug ON b2b_categories(slug);

-- Trigger para updated_at
CREATE TRIGGER update_b2b_categories_updated_at BEFORE UPDATE ON b2b_categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 2. TABLA: b2b_companies - Perfiles de empresas (para clientes registrados)
-- ============================================================================
CREATE TABLE IF NOT EXISTS b2b_companies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_name VARCHAR(255) NOT NULL,
  nit VARCHAR(50) NOT NULL UNIQUE,
  business_type VARCHAR(50) CHECK (business_type IN ('restaurant', 'retail', 'distributor', 'manufacturer', 'other')),
  industry VARCHAR(100),
  website_url VARCHAR(255),
  logo_url TEXT,

  -- Información de contacto
  contact_name VARCHAR(255) NOT NULL,
  contact_email VARCHAR(255) NOT NULL,
  contact_phone VARCHAR(50) NOT NULL,
  billing_email VARCHAR(255),

  -- Direcciones (JSONB para flexibilidad)
  business_address JSONB DEFAULT '{}'::jsonb,
  shipping_address JSONB DEFAULT '{}'::jsonb,
  billing_address JSONB DEFAULT '{}'::jsonb,

  -- Monto mínimo de pedido para esta empresa
  minimum_order_amount DECIMAL(10,2) DEFAULT 100000 CHECK (minimum_order_amount >= 0),

  -- Estado de la cuenta
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('pending', 'active', 'inactive', 'suspended')),

  -- Usuario que creó la empresa (puede ser NULL para empresas creadas por admin)
  created_by_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,

  -- Notas y metadata
  notes TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),

  -- Soft delete
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- Índices para b2b_companies
CREATE INDEX IF NOT EXISTS idx_b2b_companies_nit ON b2b_companies(nit) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_b2b_companies_status ON b2b_companies(status);
CREATE INDEX IF NOT EXISTS idx_b2b_companies_contact_email ON b2b_companies(contact_email);
CREATE INDEX IF NOT EXISTS idx_b2b_companies_created_by ON b2b_companies(created_by_user_id);

-- Trigger para updated_at
CREATE TRIGGER update_b2b_companies_updated_at BEFORE UPDATE ON b2b_companies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 3. TABLA: b2b_company_users - Usuarios vinculados a empresas
-- ============================================================================
CREATE TABLE IF NOT EXISTS b2b_company_users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES b2b_companies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member', 'viewer')),

  -- Permisos
  can_place_orders BOOLEAN DEFAULT true,
  can_view_orders BOOLEAN DEFAULT true,
  can_manage_users BOOLEAN DEFAULT false,
  can_view_reports BOOLEAN DEFAULT false,

  -- Estado
  is_primary BOOLEAN DEFAULT false,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending')),

  -- Invitación
  invited_by UUID REFERENCES profiles(id),
  invited_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  accepted_at TIMESTAMP WITH TIME ZONE,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),

  UNIQUE(company_id, user_id)
);

-- Índices para b2b_company_users
CREATE INDEX IF NOT EXISTS idx_b2b_company_users_company ON b2b_company_users(company_id);
CREATE INDEX IF NOT EXISTS idx_b2b_company_users_user ON b2b_company_users(user_id);
CREATE INDEX IF NOT EXISTS idx_b2b_company_users_status ON b2b_company_users(status);

-- Trigger para updated_at
CREATE TRIGGER update_b2b_company_users_updated_at BEFORE UPDATE ON b2b_company_users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 4. TABLA: b2b_products - Catálogo B2B separado
-- ============================================================================
CREATE TABLE IF NOT EXISTS b2b_products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sku VARCHAR(100) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category_id UUID REFERENCES b2b_categories(id) ON DELETE SET NULL,

  -- Precios B2B (sin IVA incluido)
  base_price DECIMAL(10,2) NOT NULL CHECK (base_price >= 0),
  cost_price DECIMAL(10,2) CHECK (cost_price >= 0),

  -- Inventario
  stock_quantity INTEGER DEFAULT 0 CHECK (stock_quantity >= 0),
  minimum_order_quantity INTEGER DEFAULT 1 CHECK (minimum_order_quantity > 0),
  unit VARCHAR(20) NOT NULL CHECK (unit IN ('kg', 'unit', 'lb', 'box', 'case', 'pallet')),

  -- Estado del producto
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,

  -- Media
  main_image_url TEXT,
  images JSONB DEFAULT '[]'::jsonb,

  -- Especificaciones
  specifications JSONB DEFAULT '{}'::jsonb,
  benefits JSONB DEFAULT '[]'::jsonb,

  -- Referencia opcional a producto B2C
  b2c_product_id UUID REFERENCES products(id) ON DELETE SET NULL,

  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),

  -- Soft delete
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- Índices para b2b_products
CREATE INDEX IF NOT EXISTS idx_b2b_products_category ON b2b_products(category_id);
CREATE INDEX IF NOT EXISTS idx_b2b_products_active ON b2b_products(is_active) WHERE deleted_at IS NULL AND is_active = true;
CREATE INDEX IF NOT EXISTS idx_b2b_products_featured ON b2b_products(is_featured) WHERE is_featured = true AND deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_b2b_products_sku ON b2b_products(sku);
CREATE INDEX IF NOT EXISTS idx_b2b_products_b2c_ref ON b2b_products(b2c_product_id);

-- Trigger para updated_at
CREATE TRIGGER update_b2b_products_updated_at BEFORE UPDATE ON b2b_products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 5. TABLA: b2b_pricing_tiers - Precios por volumen
-- ============================================================================
CREATE TABLE IF NOT EXISTS b2b_pricing_tiers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES b2b_products(id) ON DELETE CASCADE,

  -- Rango de cantidades
  min_quantity INTEGER NOT NULL CHECK (min_quantity > 0),
  max_quantity INTEGER CHECK (max_quantity > min_quantity OR max_quantity IS NULL),
  tier_name VARCHAR(100),

  -- Precio para este rango
  price_per_unit DECIMAL(10,2) NOT NULL CHECK (price_per_unit > 0),
  discount_percentage DECIMAL(5,2) CHECK (discount_percentage >= 0 AND discount_percentage <= 100),

  -- Prioridad (menor número = mayor prioridad)
  priority INTEGER DEFAULT 0,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Índices para b2b_pricing_tiers
CREATE INDEX IF NOT EXISTS idx_b2b_pricing_tiers_product ON b2b_pricing_tiers(product_id);
CREATE INDEX IF NOT EXISTS idx_b2b_pricing_tiers_quantity ON b2b_pricing_tiers(product_id, min_quantity, max_quantity);
CREATE INDEX IF NOT EXISTS idx_b2b_pricing_tiers_priority ON b2b_pricing_tiers(priority);

-- Trigger para updated_at
CREATE TRIGGER update_b2b_pricing_tiers_updated_at BEFORE UPDATE ON b2b_pricing_tiers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 6. TABLA: b2b_orders - Pedidos B2B
-- ============================================================================
CREATE TABLE IF NOT EXISTS b2b_orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_number VARCHAR(50) NOT NULL UNIQUE,

  -- Empresa (puede ser NULL para pedidos guest)
  company_id UUID REFERENCES b2b_companies(id) ON DELETE SET NULL,

  -- Usuario que hizo el pedido (puede ser NULL para guests)
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,

  -- Información de contacto para guests (JSONB)
  guest_contact_info JSONB,

  -- Estado del pedido
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN (
    'pending', 'confirmed', 'processing', 'shipped',
    'delivered', 'cancelled', 'on_hold'
  )),

  -- Montos
  subtotal DECIMAL(12,2) NOT NULL CHECK (subtotal >= 0),
  tax DECIMAL(10,2) DEFAULT 0 CHECK (tax >= 0),
  shipping_fee DECIMAL(10,2) DEFAULT 0 CHECK (shipping_fee >= 0),
  discount DECIMAL(10,2) DEFAULT 0 CHECK (discount >= 0),
  total DECIMAL(12,2) NOT NULL CHECK (total >= 0),

  -- Pago (solo pago inmediato, sin crédito)
  payment_method VARCHAR(20) CHECK (payment_method IN ('bold_pay', 'transfer', 'cash')),
  payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN (
    'pending', 'partial', 'completed', 'failed', 'refunded'
  )),
  payment_reference VARCHAR(255),

  -- Envío
  shipping_address JSONB,
  shipping_address_id UUID REFERENCES addresses(id),
  delivery_notes TEXT,
  requested_delivery_date DATE,

  -- Notas y referencias
  order_notes TEXT,
  internal_notes TEXT,
  customer_purchase_order VARCHAR(100),

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  confirmed_at TIMESTAMP WITH TIME ZONE,
  shipped_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  cancelled_at TIMESTAMP WITH TIME ZONE,

  -- Soft delete
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- Índices para b2b_orders
CREATE INDEX IF NOT EXISTS idx_b2b_orders_company ON b2b_orders(company_id);
CREATE INDEX IF NOT EXISTS idx_b2b_orders_user ON b2b_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_b2b_orders_status ON b2b_orders(status);
CREATE INDEX IF NOT EXISTS idx_b2b_orders_payment_status ON b2b_orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_b2b_orders_created ON b2b_orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_b2b_orders_number ON b2b_orders(order_number);

-- Trigger para updated_at
CREATE TRIGGER update_b2b_orders_updated_at BEFORE UPDATE ON b2b_orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 7. TABLA: b2b_order_items - Items de pedido B2B
-- ============================================================================
CREATE TABLE IF NOT EXISTS b2b_order_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES b2b_orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES b2b_products(id),

  -- Snapshot del producto y pricing tier al momento del pedido
  product_snapshot JSONB NOT NULL,
  pricing_tier_snapshot JSONB,

  -- Cantidad y pricing
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price DECIMAL(10,2) NOT NULL CHECK (unit_price >= 0),
  discount_percentage DECIMAL(5,2) DEFAULT 0,
  subtotal DECIMAL(12,2) NOT NULL CHECK (subtotal >= 0),

  -- Tier aplicado
  applied_tier_id UUID REFERENCES b2b_pricing_tiers(id),
  applied_tier_name VARCHAR(100),

  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Índices para b2b_order_items
CREATE INDEX IF NOT EXISTS idx_b2b_order_items_order ON b2b_order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_b2b_order_items_product ON b2b_order_items(product_id);
CREATE INDEX IF NOT EXISTS idx_b2b_order_items_tier ON b2b_order_items(applied_tier_id);

-- ============================================================================
-- 8. TABLA: b2b_recurring_orders - Pedidos recurrentes (solo registrados)
-- ============================================================================
CREATE TABLE IF NOT EXISTS b2b_recurring_orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES b2b_companies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,

  -- Programación
  frequency_type VARCHAR(20) NOT NULL CHECK (frequency_type IN ('daily', 'weekly', 'biweekly', 'monthly')),
  frequency_interval INTEGER DEFAULT 1,
  delivery_day_of_week VARCHAR(20) CHECK (delivery_day_of_week IN (
    'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'
  )),
  delivery_day_of_month INTEGER CHECK (delivery_day_of_month BETWEEN 1 AND 31),

  -- Estado
  is_active BOOLEAN DEFAULT true,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'paused', 'cancelled')),

  -- Plantilla de pedido
  items JSONB NOT NULL,
  shipping_address JSONB,
  delivery_notes TEXT,

  -- Fechas de entrega
  next_delivery_date DATE,
  last_delivery_date DATE,

  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  paused_at TIMESTAMP WITH TIME ZONE,
  cancelled_at TIMESTAMP WITH TIME ZONE
);

-- Índices para b2b_recurring_orders
CREATE INDEX IF NOT EXISTS idx_b2b_recurring_orders_company ON b2b_recurring_orders(company_id);
CREATE INDEX IF NOT EXISTS idx_b2b_recurring_orders_user ON b2b_recurring_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_b2b_recurring_orders_active ON b2b_recurring_orders(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_b2b_recurring_orders_next_delivery ON b2b_recurring_orders(next_delivery_date);
CREATE INDEX IF NOT EXISTS idx_b2b_recurring_orders_status ON b2b_recurring_orders(status);

-- Trigger para updated_at
CREATE TRIGGER update_b2b_recurring_orders_updated_at BEFORE UPDATE ON b2b_recurring_orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- RLS POLICIES (Row Level Security)
-- ============================================================================

-- Habilitar RLS en todas las tablas
ALTER TABLE b2b_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE b2b_companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE b2b_company_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE b2b_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE b2b_pricing_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE b2b_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE b2b_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE b2b_recurring_orders ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS: b2b_categories (público para lectura, solo admin para escritura)
-- ============================================================================
CREATE POLICY "Todos pueden ver categorías B2B activas"
  ON b2b_categories FOR SELECT USING (is_active = true);

CREATE POLICY "Solo admins pueden gestionar categorías B2B"
  ON b2b_categories FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- ============================================================================
-- RLS: b2b_companies
-- ============================================================================
CREATE POLICY "Usuarios pueden ver su propia empresa"
  ON b2b_companies FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM b2b_company_users
      WHERE b2b_company_users.company_id = b2b_companies.id
      AND b2b_company_users.user_id = auth.uid()
      AND b2b_company_users.status = 'active'
    )
  );

CREATE POLICY "Admins pueden ver todas las empresas B2B"
  ON b2b_companies FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Usuarios pueden crear su empresa"
  ON b2b_companies FOR INSERT WITH CHECK (created_by_user_id = auth.uid());

CREATE POLICY "Usuarios pueden actualizar su empresa"
  ON b2b_companies FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM b2b_company_users
      WHERE b2b_company_users.company_id = b2b_companies.id
      AND b2b_company_users.user_id = auth.uid()
      AND b2b_company_users.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Admins pueden gestionar empresas B2B"
  ON b2b_companies FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- ============================================================================
-- RLS: b2b_company_users
-- ============================================================================
CREATE POLICY "Usuarios pueden ver usuarios de su empresa"
  ON b2b_company_users FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM b2b_company_users AS cu
      WHERE cu.company_id = b2b_company_users.company_id
      AND cu.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins pueden ver todos los usuarios B2B"
  ON b2b_company_users FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Usuarios pueden invitarse a su empresa"
  ON b2b_company_users FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM b2b_company_users
      WHERE b2b_company_users.company_id = b2b_company_users.company_id
      AND b2b_company_users.user_id = auth.uid()
      AND b2b_company_users.role IN ('owner', 'admin')
    )
  );

-- ============================================================================
-- RLS: b2b_products (público para lectura, solo admin para escritura)
-- ============================================================================
CREATE POLICY "Todos pueden ver productos B2B activos"
  ON b2b_products FOR SELECT USING (is_active = true AND deleted_at IS NULL);

CREATE POLICY "Solo admins pueden gestionar productos B2B"
  ON b2b_products FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- ============================================================================
-- RLS: b2b_pricing_tiers
-- ============================================================================
CREATE POLICY "Todos pueden ver pricing tiers B2B"
  ON b2b_pricing_tiers FOR SELECT USING (true);

CREATE POLICY "Solo admins pueden gestionar pricing tiers B2B"
  ON b2b_pricing_tiers FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- ============================================================================
-- RLS: b2b_orders
-- ============================================================================
CREATE POLICY "Usuarios pueden ver sus pedidos B2B"
  ON b2b_orders FOR SELECT USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM b2b_company_users
      WHERE b2b_company_users.company_id = b2b_orders.company_id
      AND b2b_company_users.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins pueden ver todos los pedidos B2B"
  ON b2b_orders FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Usuarios pueden crear pedidos B2B"
  ON b2b_orders FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins pueden gestionar pedidos B2B"
  ON b2b_orders FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- ============================================================================
-- RLS: b2b_order_items
-- ============================================================================
CREATE POLICY "Usuarios pueden ver items de sus pedidos B2B"
  ON b2b_order_items FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM b2b_orders
      WHERE b2b_orders.id = b2b_order_items.order_id
      AND (b2b_orders.user_id = auth.uid() OR b2b_orders.company_id IN (
        SELECT company_id FROM b2b_company_users WHERE user_id = auth.uid()
      ))
    )
  );

CREATE POLICY "Admins pueden ver todos los items B2B"
  ON b2b_order_items FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- ============================================================================
-- RLS: b2b_recurring_orders
-- ============================================================================
CREATE POLICY "Usuarios pueden ver pedidos recurrentes de su empresa"
  ON b2b_recurring_orders FOR SELECT USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM b2b_company_users
      WHERE b2b_company_users.company_id = b2b_recurring_orders.company_id
      AND b2b_company_users.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins pueden ver todos los pedidos recurrentes B2B"
  ON b2b_recurring_orders FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Usuarios pueden crear pedidos recurrentes B2B"
  ON b2b_recurring_orders FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Usuarios pueden actualizar sus pedidos recurrentes B2B"
  ON b2b_recurring_orders FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Admins pueden gestionar pedidos recurrentes B2B"
  ON b2b_recurring_orders FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- ============================================================================
-- FUNCIONES AUXILIARES
-- ============================================================================

-- Función para generar número de pedido B2B
CREATE OR REPLACE FUNCTION generate_b2b_order_number()
RETURNS VARCHAR AS $$
DECLARE
  order_count INTEGER;
  order_number VARCHAR;
BEGIN
  -- Contar pedidos de hoy
  SELECT COUNT(*) INTO order_count
  FROM b2b_orders
  WHERE DATE(created_at) = CURRENT_DATE;

  -- Generar número: B2B-YYYYMMDD-XXXXX
  order_number := 'B2B-' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-' || LPAD((order_count + 1)::TEXT, 5, '0');

  RETURN order_number;
END;
$$ LANGUAGE plpgsql;

-- Trigger para auto-generar order_number
CREATE OR REPLACE FUNCTION set_b2b_order_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.order_number IS NULL OR NEW.order_number = '' THEN
    NEW.order_number := generate_b2b_order_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_b2b_order_number_trigger
  BEFORE INSERT ON b2b_orders
  FOR EACH ROW EXECUTE FUNCTION set_b2b_order_number();

-- Función para validar que no haya solapamiento de pricing tiers
CREATE OR REPLACE FUNCTION validate_b2b_pricing_tiers_no_overlap()
RETURNS TRIGGER AS $$
DECLARE
  overlapping_count INTEGER;
BEGIN
  -- Verificar si existe algún tier del mismo producto que se solape
  SELECT COUNT(*) INTO overlapping_count
  FROM b2b_pricing_tiers
  WHERE product_id = NEW.product_id
    AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
    AND (
      -- Caso 1: El nuevo tier está completamente dentro de un tier existente
      (NEW.min_quantity >= min_quantity AND
       (max_quantity IS NULL OR NEW.min_quantity <= max_quantity))
      OR
      -- Caso 2: Un tier existente está dentro del nuevo tier
      (min_quantity >= NEW.min_quantity AND
       (NEW.max_quantity IS NULL OR min_quantity <= NEW.max_quantity))
      OR
      -- Caso 3: Solapamiento parcial
      (NEW.min_quantity <= max_quantity AND
       NEW.max_quantity >= min_quantity)
    );

  IF overlapping_count > 0 THEN
    RAISE EXCEPTION 'Ya existe un pricing tier con rangos de cantidad solapados para este producto';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para validar solapamiento al insertar o actualizar
CREATE TRIGGER validate_b2b_pricing_tiers_overlap
  BEFORE INSERT OR UPDATE ON b2b_pricing_tiers
  FOR EACH ROW
  EXECUTE FUNCTION validate_b2b_pricing_tiers_no_overlap();

-- ============================================================================
-- COMENTARIOS PARA DOCUMENTACIÓN
-- ============================================================================
COMMENT ON TABLE b2b_categories IS 'Categorías de productos B2B';
COMMENT ON TABLE b2b_companies IS 'Perfiles de empresas/clientes B2B registrados';
COMMENT ON TABLE b2b_company_users IS 'Usuarios vinculados a empresas B2B';
COMMENT ON TABLE b2b_products IS 'Catálogo de productos B2B separado del B2C';
COMMENT ON TABLE b2b_pricing_tiers IS 'Precios por volumen para productos B2B';
COMMENT ON TABLE b2b_orders IS 'Pedidos B2B (soporta empresas registradas y guests)';
COMMENT ON TABLE b2b_order_items IS 'Items/lineas de pedidos B2B';
COMMENT ON TABLE b2b_recurring_orders IS 'Pedidos recurrentes/programables B2B (solo empresas registradas)';

COMMENT ON COLUMN b2b_companies.nit IS 'NIT único de la empresa (identificación tributaria colombiana)';
COMMENT ON COLUMN b2b_orders.guest_contact_info IS 'Información de contacto para pedidos sin registro (JSON: nombre, email, teléfono, empresa)';
COMMENT ON COLUMN b2b_pricing_tiers.min_quantity IS 'Cantidad mínima para aplicar este precio';
COMMENT ON COLUMN b2b_pricing_tiers.max_quantity IS 'Cantidad máxima (NULL = sin límite superior)';
COMMENT ON COLUMN b2b_pricing_tiers.discount_percentage IS 'Porcentaje de descuento aplicado';
