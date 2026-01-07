-- =====================================================
-- 🥑 Script SIMPLIFICADO de Importación CSV
-- =====================================================
-- Este script usa COPY para importar solo las columnas necesarias
-- Ejecutar en pgAdmin
-- =====================================================

-- 1. Crear tabla con SOLO las columnas que necesitamos del CSV
DROP TABLE IF EXISTS csv_clientes_import;

CREATE TABLE csv_clientes_import (
    phone_number VARCHAR(50),
    name VARCHAR(300),
    email VARCHAR(200),
    address TEXT
);

-- 2. Importar datos usando SQL (copiar desde el CSV procesado)
-- Primero vamos a extraer los datos relevantes con un INSERT directo

-- Alternativa: Si prefieres usar pgAdmin GUI:
-- Click derecho en csv_clientes_import > Import/Export Data
-- Seleccionar el CSV y mapear solo estas 4 columnas

-- 3. Verificar que se importaron
SELECT COUNT(*) as total FROM csv_clientes_import;

-- 4. Ver ejemplos
SELECT * FROM csv_clientes_import LIMIT 10;
