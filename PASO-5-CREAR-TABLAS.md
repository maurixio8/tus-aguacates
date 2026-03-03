# 📊 PASO 5: CREAR TABLAS DE MÉTRICAS Y LOGS

**Ejecutar en pgAdmin/DBeaver:**

```sql
-- =====================================================
-- CREAR TABLA DE MÉTRICAS DE ESCALADOS
-- =====================================================

CREATE TABLE IF NOT EXISTS escalados_metricas (
    id SERIAL PRIMARY KEY,
    fecha TIMESTAMP DEFAULT NOW(),
    fecha_reporte DATE DEFAULT CURRENT_DATE,
    hora INTEGER DEFAULT EXTRACT(HOUR FROM NOW()),
    
    -- Contadores
    total_escalados INTEGER DEFAULT 0,
    pendientes INTEGER DEFAULT 0,
    atendidos INTEGER DEFAULT 0,
    
    -- Por prioridad
    urgentes INTEGER DEFAULT 0,
    altos INTEGER DEFAULT 0,
    normales INTEGER DEFAULT 0,
    
    -- SLA
    tiempo_promedio_minutos NUMERIC(10,2) DEFAULT 0,
    urgentes_excedidos INTEGER DEFAULT 0,
    altos_excedidos INTEGER DEFAULT 0,
    normales_excedidos INTEGER DEFAULT 0,
    
    -- Alertas
    alerta_nivel VARCHAR(20),
    
    created_at TIMESTAMP DEFAULT NOW()
);

-- Índices para métricas
CREATE INDEX IF NOT EXISTS idx_escalados_metricas_fecha 
ON escalados_metricas(fecha_reporte DESC);
CREATE INDEX IF NOT EXISTS idx_escalados_metricas_hora 
ON escalados_metricas(fecha_reporte, hora);
```

**Click en Execute**

**Resultado esperado**: ✅ "Query returned successfully"

---
**¿Funcionó?** Responde con:
- ✅ "Sí" si funcionó
- ❌ "No" con el error si falló
