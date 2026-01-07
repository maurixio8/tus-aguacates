-- ================================================
-- 🧹 LIMPIEZA DE CLIENTES DUPLICADOS EN SUPABASE
-- ================================================
-- Este script elimina duplicados manteniendo el registro más completo

-- Paso 1: Ver cuántos duplicados hay
SELECT 
  phone, 
  COUNT(*) as duplicados,
  COUNT(DISTINCT name) as nombres_diferentes,
  COUNT(DISTINCT email) as emails_diferentes
FROM customers 
WHERE phone IS NOT NULL AND phone != ''
GROUP BY phone 
HAVING COUNT(*) > 1
ORDER BY duplicados DESC
LIMIT 20;

-- ================================================
-- Paso 2: Identificar el "mejor" registro por teléfono
-- Criterio: Mayor total_spent, luego mayor total_orders, luego más reciente
-- ================================================

-- Ver qué se va a mantener vs eliminar para un teléfono específico
SELECT 
  id, phone, name, email, total_orders, total_spent, created_at,
  ROW_NUMBER() OVER (
    PARTITION BY phone 
    ORDER BY 
      COALESCE(total_spent, 0) DESC,
      COALESCE(total_orders, 0) DESC,
      created_at DESC
  ) as rango
FROM customers 
WHERE phone LIKE '%3203062007%'
ORDER BY rango;

-- ================================================
-- Paso 3: BACKUP antes de eliminar (IMPORTANTE)
-- ================================================

-- Crear tabla de respaldo
CREATE TABLE IF NOT EXISTS customers_backup_duplicados AS
SELECT * FROM customers WHERE false; -- Estructura vacía

-- Insertar todos los duplicados antes de eliminar
INSERT INTO customers_backup_duplicados
SELECT c.* 
FROM customers c
INNER JOIN (
  SELECT phone 
  FROM customers 
  WHERE phone IS NOT NULL AND phone != ''
  GROUP BY phone 
  HAVING COUNT(*) > 1
) dups ON c.phone = dups.phone;

-- ================================================
-- Paso 4: ELIMINAR duplicados (mantener solo rango = 1)
-- ⚠️ EJECUTAR CON CUIDADO
-- ================================================

-- Primero ver cuántos se van a eliminar
SELECT COUNT(*) as registros_a_eliminar
FROM customers c
WHERE c.id NOT IN (
  SELECT DISTINCT ON (phone) id
  FROM customers
  WHERE phone IS NOT NULL AND phone != ''
  ORDER BY phone, 
    COALESCE(total_spent, 0) DESC,
    COALESCE(total_orders, 0) DESC,
    created_at DESC
)
AND c.phone IN (
  SELECT phone FROM customers 
  WHERE phone IS NOT NULL AND phone != ''
  GROUP BY phone HAVING COUNT(*) > 1
);

-- EJECUTAR LA ELIMINACIÓN
DELETE FROM customers 
WHERE id NOT IN (
  SELECT DISTINCT ON (phone) id
  FROM customers
  WHERE phone IS NOT NULL AND phone != ''
  ORDER BY phone, 
    COALESCE(total_spent, 0) DESC,
    COALESCE(total_orders, 0) DESC,
    created_at DESC
)
AND phone IN (
  SELECT phone FROM customers 
  WHERE phone IS NOT NULL AND phone != ''
  GROUP BY phone HAVING COUNT(*) > 1
);

-- ================================================
-- Paso 5: AGREGAR RESTRICCIÓN UNIQUE para evitar futuros duplicados
-- ================================================

-- Verificar que ya no hay duplicados
SELECT phone, COUNT(*) 
FROM customers 
WHERE phone IS NOT NULL AND phone != ''
GROUP BY phone 
HAVING COUNT(*) > 1;

-- Si no hay duplicados, agregar restricción
ALTER TABLE customers 
ADD CONSTRAINT customers_phone_unique UNIQUE (phone);

-- ================================================
-- Paso 6: Verificación final
-- ================================================
SELECT 
  COUNT(*) as total_clientes,
  COUNT(DISTINCT phone) as telefonos_unicos,
  COUNT(name) as con_nombre,
  COUNT(email) as con_email
FROM customers;
