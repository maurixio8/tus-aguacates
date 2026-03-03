# 🔍 DIAGNÓSTICO - Columnas Existentes

**Ejecutar esto en pgAdmin/DBeaver para verificar el estado actual:**

```sql
-- VERIFICAR COLUMNAS EN LA TABLA CLIENTES
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'clientes'
  AND column_name IN ('fecha_escalado', 'notificado_escalado', 'prioridad_escalado', 
                    'motivo_escalado', 'atendido_por', 'fecha_atencion',
                    'tiempo_respuesta_minutos', 'resolucion', 'fecha_resolucion')
ORDER BY column_name;
```

## 📊 RESULTADOS POSIBLES:

### Caso 1: NO se creó ninguna columna
Si la query no retorna nada, significa que **NINGUNA** de las columnas del PASO 1 se creó.

**Solución**: Re-ejecutar el PASO 1 con el SQL corregido de abajo.

### Caso 2: Se crearon algunas columnas pero no otras
Si retorna algunas columnas pero faltan, significa que el ALTER TABLE falló en algún punto y no lo mostró.

**Solución**: Ejecutar solo los ALTER COLUMN que faltan.

### Caso 3: Todas las columnas existen
Si retorna las 9 columnas, entonces el problema es que el índice del PASO 3 no puede referenciar una columna inexistente (lo cual no tiene sentido).

**Solución**: Verificar que la tabla se llame exactamente `clientes`.

---

## 🔧 SOLUCIÓN: EJECUTAR PASO 1 CORREGIDO

Si la consulta de diagnóstico devuelve vacío o faltan columnas, ejecuta esto:

```sql
-- =====================================================
-- PASO 1 CORREGIDO: CREAR COLUMNAS DE ESCALADOS
-- =====================================================

-- Crear columnas UNO POR UNO para identificar errores
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS fecha_escalado TIMESTAMP;
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS notificado_escalado BOOLEAN DEFAULT false;
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS prioridad_escalado VARCHAR(20) DEFAULT 'normal';
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS motivo_escalado TEXT;
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS atendido_por VARCHAR(100);
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS fecha_atencion TIMESTAMP;
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS tiempo_respuesta_minutos INTEGER;
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS resolucion TEXT;
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS fecha_resolucion TIMESTAMP;

-- Agregar constraint para prioridad válida
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'chk_prioridad_escalado'
    ) THEN
        ALTER TABLE clientes
        ADD CONSTRAINT chk_prioridad_escalado
        CHECK (prioridad_escalado IN ('baja', 'normal', 'alta', 'urgente'));
    END IF;
END $$;
```

**Después de ejecutar, ejecuta la consulta de diagnóstico nuevamente para verificar.**

---

## 📋 CHECKLIST

Antes de continuar con el PASO 3 (índices), marca cada ítem:

- [ ] Ejecuté la consulta de diagnóstico
- [ ] Todas las 9 columnas aparecen en el resultado
- [ ] El constraint `chk_prioridad_escalado` existe (verificar en pg_constraint)

Si alguno de estos no está marcado, necesito el error específico para poder corregirlo.
