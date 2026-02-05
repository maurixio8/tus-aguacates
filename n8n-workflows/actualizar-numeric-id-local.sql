-- =====================================================
-- 🛠️ ACTUALIZACIÓN DE PRODUCTOS (PG ADMIN / LOCAL)
-- Ejecuta este script en tu base de datos local (n8n_db)
-- para incluir el nuevo ID numérico que creamos.
-- =====================================================

-- 1. Agregar columna numeric_id a la tabla local de productos
ALTER TABLE productos_tienda 
ADD COLUMN IF NOT EXISTS numeric_id INTEGER;

-- 2. (Opcional) Si quieres que sea auto-incremental localmente también:
-- (Nota: n8n lo traerá de Supabase automáticamente si actualizamos el flujo)

SELECT 'Tabla productos_tienda actualizada con numeric_id' as resultado;
