# 📄 PASO 4: CREAR ÍNDICES

**Ejecutar en pgAdmin/DBeaver:**

```sql
-- =====================================================
-- CREAR ÍNDICES PARA MEJORAR RENDIMIENTO EN CLIENTES
-- =====================================================

-- Índice para búsqueda de escalados
CREATE INDEX IF NOT EXISTS idx_clientes_estado_escalado 
ON clientes(estado_conversacion) 
WHERE estado_conversacion = 'ESCALADO';

-- Índice para prioridad
CREATE INDEX IF NOT EXISTS idx_clientes_prioridad_escalado 
ON clientes(prioridad_escalado, fecha_escalado DESC)
WHERE prioridad_escalado IS NOT NULL;

-- Índice para fecha de escalado
CREATE INDEX IF NOT EXISTS idx_clientes_fecha_escalado 
ON clientes(fecha_escalado DESC)
WHERE fecha_escalado IS NOT NULL;

-- Índice compuesto para monitor
CREATE INDEX IF NOT EXISTS idx_clientes_escalado_monitor 
ON clientes(estado_conversacion, notificado_escalado, prioridad_escalado, fecha_escalado)
WHERE estado_conversacion = 'ESCALADO';
```

**Click en Execute**

**Resultado esperado**: ✅ "Query returned successfully" sin errores

---
**¿Funcionó?** Responde con:
- ✅ "Sí" si todo funcionó
- ❌ "No" con el error si falló
