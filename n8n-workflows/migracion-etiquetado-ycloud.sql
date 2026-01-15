-- =====================================================
-- MIGRACIÓN: Agregar columna etiquetado_ycloud
-- =====================================================
-- Ejecutar en PostgreSQL local (el de n8n)
-- =====================================================

-- 1. Agregar columna para rastrear si el cliente ya fue etiquetado en YCloud
ALTER TABLE clientes 
ADD COLUMN IF NOT EXISTS etiquetado_ycloud BOOLEAN DEFAULT FALSE;

-- 2. Crear índice para búsqueda rápida de clientes sin etiquetar
CREATE INDEX IF NOT EXISTS idx_clientes_etiquetado 
ON clientes (estado_conversacion, etiquetado_ycloud) 
WHERE etiquetado_ycloud IS DISTINCT FROM true;

-- 3. (Opcional) Marcar como etiquetados a todos los clientes existentes
-- para que el workflow solo etiquete nuevos pedidos
-- UPDATE clientes SET etiquetado_ycloud = true WHERE estado_conversacion IN ('PEDIDO_CONFIRMADO', 'PEDIDO_ONLINE');

-- Verificar
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'clientes' AND column_name = 'etiquetado_ycloud';
