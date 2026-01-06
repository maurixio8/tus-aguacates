-- =====================================================
-- 🥑 Script de Enriquecimiento de Clientes
-- =====================================================
-- Ejecutar en pgAdmin paso a paso
-- =====================================================

-- =====================================================
-- PASO 1: Verificar estado actual
-- =====================================================
SELECT 
  COUNT(*) as total_clientes,
  COUNT(CASE WHEN nombre IS NOT NULL AND TRIM(nombre) != '' THEN 1 END) as con_nombre,
  COUNT(CASE WHEN nombre IS NULL OR TRIM(nombre) = '' THEN 1 END) as sin_nombre,
  COUNT(CASE WHEN direccion IS NOT NULL AND TRIM(direccion) != '' THEN 1 END) as con_direccion
FROM clientes;

-- =====================================================
-- PASO 2: Normalizar teléfonos (quitar espacios y +)
-- =====================================================
UPDATE clientes 
SET telefono = REGEXP_REPLACE(REPLACE(telefono, '+', ''), '\s+', '', 'g')
WHERE telefono ~ '[\s+]';

-- Verificar normalización
SELECT LEFT(telefono, 15) as ejemplo_formato, COUNT(*) 
FROM clientes 
GROUP BY LEFT(telefono, 15) 
ORDER BY COUNT(*) DESC 
LIMIT 10;

-- =====================================================
-- PASO 3: Crear tabla temporal para CSV
-- =====================================================
DROP TABLE IF EXISTS csv_clientes_temp;

CREATE TABLE csv_clientes_temp (
    id VARCHAR(100),
    country_calling_code VARCHAR(10),
    email VARCHAR(200),
    name VARCHAR(300),
    phone_number VARCHAR(50),
    external_identifiers TEXT,
    available_points INTEGER,
    used_points INTEGER,
    order_count_delivery INTEGER,
    order_count_onsite INTEGER,
    order_count_table INTEGER,
    order_count_takeaway INTEGER,
    turbo_sales_unsubscribed BOOLEAN,
    address_0_id VARCHAR(100),
    address_0_area_id VARCHAR(100),
    address_0_area_name VARCHAR(200),
    address_0_created_at TIMESTAMP,
    address_0_client_id VARCHAR(100),
    address_0_address TEXT,
    address_0_latitude DECIMAL(10,7),
    address_0_longitude DECIMAL(10,7),
    address_0_default BOOLEAN,
    address_0_verified BOOLEAN,
    address_0_complement TEXT,
    address_0_reference TEXT,
    status VARCHAR(50),
    type VARCHAR(50),
    created_at TIMESTAMP,
    unsubscribed_reorder BOOLEAN,
    unsubscribed_abandoned BOOLEAN,
    unsubscribed_get_loyalty BOOLEAN,
    inbound_activated_at TIMESTAMP,
    source VARCHAR(50)
    -- (hay más columnas de direcciones adicionales que no necesitamos)
);

-- =====================================================
-- PASO 4: Importar CSV (hacer en pgAdmin)
-- =====================================================
-- En pgAdmin:
-- 1. Click derecho en tabla csv_clientes_temp
-- 2. Import/Export Data...
-- 3. Seleccionar archivo: clientes_final (2).csv
-- 4. Options: Header=Yes, Delimiter=comma, Quote="
-- 5. Columns: seleccionar solo las primeras 33 columnas

-- =====================================================
-- PASO 5: Verificar importación
-- =====================================================
SELECT COUNT(*) as total_importados FROM csv_clientes_temp;
SELECT name, phone_number, email 
FROM csv_clientes_temp 
WHERE name IS NOT NULL AND name != '' 
LIMIT 10;

-- =====================================================
-- PASO 6: Enriquecer nombres (solo donde están vacíos)
-- =====================================================
UPDATE clientes c
SET 
    nombre = csv.name
FROM csv_clientes_temp csv
WHERE REGEXP_REPLACE(c.telefono, '[^0-9]', '', 'g') 
      LIKE '%' || REGEXP_REPLACE(csv.phone_number, '[^0-9]', '', 'g')
  AND csv.name IS NOT NULL 
  AND TRIM(csv.name) != ''
  AND (c.nombre IS NULL OR TRIM(c.nombre) = '');

-- Verificar cuántos se actualizaron
SELECT 
  COUNT(*) as total_clientes,
  COUNT(CASE WHEN nombre IS NOT NULL AND TRIM(nombre) != '' THEN 1 END) as con_nombre_ahora
FROM clientes;

-- =====================================================
-- PASO 7: Enriquecer emails (solo donde están vacíos)
-- =====================================================
UPDATE clientes c
SET 
    email = csv.email
FROM csv_clientes_temp csv
WHERE REGEXP_REPLACE(c.telefono, '[^0-9]', '', 'g') 
      LIKE '%' || REGEXP_REPLACE(csv.phone_number, '[^0-9]', '', 'g')
  AND csv.email IS NOT NULL 
  AND TRIM(csv.email) != ''
  AND (c.email IS NULL OR TRIM(c.email) = '');

-- =====================================================
-- PASO 8: Enriquecer direcciones (solo donde están vacías)
-- =====================================================
UPDATE clientes c
SET 
    direccion = csv.address_0_address
FROM csv_clientes_temp csv
WHERE REGEXP_REPLACE(c.telefono, '[^0-9]', '', 'g') 
      LIKE '%' || REGEXP_REPLACE(csv.phone_number, '[^0-9]', '', 'g')
  AND csv.address_0_address IS NOT NULL 
  AND TRIM(csv.address_0_address) != ''
  AND (c.direccion IS NULL OR TRIM(c.direccion) = '');

-- =====================================================
-- PASO 9: Verificación final
-- =====================================================
SELECT 
  COUNT(*) as total_clientes,
  COUNT(CASE WHEN nombre IS NOT NULL AND TRIM(nombre) != '' THEN 1 END) as con_nombre,
  COUNT(CASE WHEN email IS NOT NULL AND TRIM(email) != '' THEN 1 END) as con_email,
  COUNT(CASE WHEN direccion IS NOT NULL AND TRIM(direccion) != '' THEN 1 END) as con_direccion
FROM clientes;

-- Ejemplos de clientes enriquecidos
SELECT id, nombre, telefono, email, LEFT(direccion, 50) as direccion
FROM clientes 
WHERE nombre IS NOT NULL AND nombre != ''
ORDER BY id DESC
LIMIT 20;

-- =====================================================
-- PASO 10: Limpiar tabla temporal
-- =====================================================
DROP TABLE IF EXISTS csv_clientes_temp;

-- =====================================================
-- ¡LISTO! Los workflows de sincronización propagarán
-- los datos a Supabase en la próxima hora.
-- =====================================================
