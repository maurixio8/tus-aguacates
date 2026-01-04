-- ============================================================================
-- LIMPIEZA: Eliminar todos los objetos B2B existentes
-- Usar este script SOLO si quieres eliminar todo y empezar de cero
-- ============================================================================

-- Eliminar triggers primero (en orden inverso a su creación)
DROP TRIGGER IF EXISTS validate_b2b_pricing_tiers_overlap ON b2b_pricing_tiers;
DROP TRIGGER IF EXISTS set_b2b_order_number_trigger ON b2b_orders;
DROP TRIGGER IF EXISTS update_b2b_recurring_orders_updated_at ON b2b_recurring_orders;
DROP TRIGGER IF EXISTS update_b2b_order_items_updated_at ON b2b_order_items;
DROP TRIGGER IF EXISTS update_b2b_orders_updated_at ON b2b_orders;
DROP TRIGGER IF EXISTS update_b2b_pricing_tiers_updated_at ON b2b_pricing_tiers;
DROP TRIGGER IF EXISTS update_b2b_products_updated_at ON b2b_products;
DROP TRIGGER IF EXISTS update_b2b_company_users_updated_at ON b2b_company_users;
DROP TRIGGER IF EXISTS update_b2b_companies_updated_at ON b2b_companies;
DROP TRIGGER IF EXISTS update_b2b_categories_updated_at ON b2b_categories;

-- Eliminar funciones
DROP FUNCTION IF EXISTS validate_b2b_pricing_tiers_no_overlap();
DROP FUNCTION IF EXISTS set_b2b_order_number();
DROP FUNCTION IF EXISTS generate_b2b_order_number();

-- Eliminar políticas RLS (si existen)
DROP POLICY IF EXISTS "Todos pueden ver categorías B2B activas" ON b2b_categories;
DROP POLICY IF EXISTS "Solo admins pueden gestionar categorías B2B" ON b2b_categories;

DROP POLICY IF EXISTS "Usuarios pueden ver su propia empresa" ON b2b_companies;
DROP POLICY IF EXISTS "Admins pueden ver todas las empresas B2B" ON b2b_companies;
DROP POLICY IF EXISTS "Usuarios pueden crear su empresa" ON b2b_companies;
DROP POLICY IF EXISTS "Usuarios pueden actualizar su empresa" ON b2b_companies;
DROP POLICY IF EXISTS "Admins pueden gestionar empresas B2B" ON b2b_companies;

DROP POLICY IF EXISTS "Usuarios pueden ver usuarios de su empresa" ON b2b_company_users;
DROP POLICY IF EXISTS "Admins pueden ver todos los usuarios B2B" ON b2b_company_users;
DROP POLICY IF EXISTS "Usuarios pueden invitarse a su empresa" ON b2b_company_users;

DROP POLICY IF EXISTS "Todos pueden ver productos B2B activos" ON b2b_products;
DROP POLICY IF EXISTS "Solo admins pueden gestionar productos B2B" ON b2b_products;

DROP POLICY IF EXISTS "Todos pueden ver pricing tiers B2B" ON b2b_pricing_tiers;
DROP POLICY IF EXISTS "Solo admins pueden gestionar pricing tiers B2B" ON b2b_pricing_tiers;

DROP POLICY IF EXISTS "Usuarios pueden ver sus pedidos B2B" ON b2b_orders;
DROP POLICY IF EXISTS "Admins pueden ver todos los pedidos B2B" ON b2b_orders;
DROP POLICY IF EXISTS "Usuarios pueden crear pedidos B2B" ON b2b_orders;
DROP POLICY IF EXISTS "Admins pueden gestionar pedidos B2B" ON b2b_orders;

DROP POLICY IF EXISTS "Usuarios pueden ver items de sus pedidos B2B" ON b2b_order_items;
DROP POLICY IF EXISTS "Admins pueden ver todos los items B2B" ON b2b_order_items;

DROP POLICY IF EXISTS "Usuarios pueden ver pedidos recurrentes de su empresa" ON b2b_recurring_orders;
DROP POLICY IF EXISTS "Admins pueden ver todos los pedidos recurrentes B2B" ON b2b_recurring_orders;
DROP POLICY IF EXISTS "Usuarios pueden crear pedidos recurrentes B2B" ON b2b_recurring_orders;
DROP POLICY IF EXISTS "Usuarios pueden actualizar sus pedidos recurrentes B2B" ON b2b_recurring_orders;
DROP POLICY IF EXISTS "Admins pueden gestionar pedidos recurrentes B2B" ON b2b_recurring_orders;

-- Deshabilitar RLS en todas las tablas (antes de eliminarlas)
ALTER TABLE b2b_categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE b2b_companies DISABLE ROW LEVEL SECURITY;
ALTER TABLE b2b_company_users DISABLE ROW LEVEL SECURITY;
ALTER TABLE b2b_products DISABLE ROW LEVEL SECURITY;
ALTER TABLE b2b_pricing_tiers DISABLE ROW LEVEL SECURITY;
ALTER TABLE b2b_orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE b2b_order_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE b2b_recurring_orders DISABLE ROW LEVEL SECURITY;

-- Eliminar tablas en orden inverso (debido a foreign keys)
DROP TABLE IF EXISTS b2b_recurring_orders CASCADE;
DROP TABLE IF EXISTS b2b_order_items CASCADE;
DROP TABLE IF EXISTS b2b_orders CASCADE;
DROP TABLE IF EXISTS b2b_pricing_tiers CASCADE;
DROP TABLE IF EXISTS b2b_products CASCADE;
DROP TABLE IF EXISTS b2b_company_users CASCADE;
DROP TABLE IF EXISTS b2b_companies CASCADE;
DROP TABLE IF EXISTS b2b_categories CASCADE;

SELECT 'B2B objects cleaned up successfully' AS result;
