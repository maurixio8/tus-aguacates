-- =====================================================
-- 🔧 FIX: Verificar y arreglar estados antes del constraint
-- =====================================================
-- Ejecuta este script PRIMERO para ver qué estados existen
-- =====================================================

-- 1. Ver qué estados hay actualmente
SELECT estado_conversacion, COUNT(*) as cantidad
FROM clientes
GROUP BY estado_conversacion
ORDER BY cantidad DESC;

-- =====================================================
-- SI HAY ESTADOS QUE NO ESTÁN EN LA LISTA, ACTUALÍZALOS:
-- Estados válidos: NUEVO, ATENCION_LUZ, EN_PEDIDO, CONFIRMANDO, 
--                  PAGANDO, COMPLETADO, ESCALADO, PEDIDO_ONLINE
-- =====================================================

-- 2. Convertir estados NULL o vacíos a ATENCION_LUZ
UPDATE clientes 
SET estado_conversacion = 'ATENCION_LUZ'
WHERE estado_conversacion IS NULL OR estado_conversacion = '';

-- 3. Convertir cualquier estado desconocido a ATENCION_LUZ
UPDATE clientes 
SET estado_conversacion = 'ATENCION_LUZ'
WHERE estado_conversacion NOT IN (
    'NUEVO', 'ATENCION_LUZ', 'EN_PEDIDO', 'CONFIRMANDO', 
    'PAGANDO', 'COMPLETADO', 'ESCALADO', 'PEDIDO_ONLINE'
);

-- 4. Verificar que ya no hay estados inválidos
SELECT estado_conversacion, COUNT(*) as cantidad
FROM clientes
GROUP BY estado_conversacion;

-- =====================================================
-- AHORA sí puedes ejecutar el constraint:
-- =====================================================

-- 5. Agregar el constraint
ALTER TABLE clientes
DROP CONSTRAINT IF EXISTS chk_estado_conversacion;

ALTER TABLE clientes
ADD CONSTRAINT chk_estado_conversacion 
CHECK (estado_conversacion IN (
    'NUEVO',
    'ATENCION_LUZ',
    'EN_PEDIDO',
    'CONFIRMANDO',
    'PAGANDO',
    'COMPLETADO',
    'ESCALADO',
    'PEDIDO_ONLINE'
));

SELECT 'Constraint aplicado correctamente ✅' as resultado;
