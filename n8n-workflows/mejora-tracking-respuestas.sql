-- =====================================================
-- 📊 MEJORA 1: Agregar Tracking de Respuestas
-- =====================================================
-- Ejecutar en pgAdmin para agregar columnas de seguimiento
-- =====================================================

BEGIN;

-- 1. Agregar columnas de tracking a envios_campana
ALTER TABLE envios_campana 
ADD COLUMN IF NOT EXISTS respondio BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS fecha_respuesta TIMESTAMP,
ADD COLUMN IF NOT EXISTS mensaje_respuesta TEXT,
ADD COLUMN IF NOT EXISTS compro BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS fecha_compra TIMESTAMP;

-- 2. Crear índices para consultas rápidas
CREATE INDEX IF NOT EXISTS idx_envios_respondio 
ON envios_campana(campana_id, respondio);

CREATE INDEX IF NOT EXISTS idx_envios_compro 
ON envios_campana(campana_id, compro);

-- 3. Agregar columna ultima_compra a clientes (si no existe)
ALTER TABLE clientes 
ADD COLUMN IF NOT EXISTS ultima_compra TIMESTAMP;

-- 4. Verificar estructura final
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'envios_campana'
ORDER BY ordinal_position;

COMMIT;

-- =====================================================
-- 📊 CONSULTAS ÚTILES DESPUÉS DE IMPLEMENTAR
-- =====================================================

-- Ver quiénes respondieron a la campaña
-- SELECT * FROM envios_campana WHERE campana_id = 'invitatienda_enero_2026' AND respondio = true;

-- Ver estadísticas de campaña
-- SELECT 
--   campana_id,
--   COUNT(*) as total,
--   COUNT(CASE WHEN respondio THEN 1 END) as respondieron,
--   COUNT(CASE WHEN compro THEN 1 END) as compraron
-- FROM envios_campana
-- GROUP BY campana_id;
