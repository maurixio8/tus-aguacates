# 📝 PASO 6: CREAR TABLA DE LOG DE ESCALADOS

**Ejecutar en pgAdmin/DBeaver:**

```sql
-- =====================================================
-- CREAR TABLA DE LOG DE ESCALADOS
-- =====================================================

CREATE TABLE IF NOT EXISTS escalados_log (
    id SERIAL PRIMARY KEY,
    fecha TIMESTAMP DEFAULT NOW(),
    total_escalados INTEGER DEFAULT 0,
    urgentes INTEGER DEFAULT 0,
    altos INTEGER DEFAULT 0,
    normales INTEGER DEFAULT 0,
    excedidos_sla INTEGER DEFAULT 0,
    alerta_nivel VARCHAR(20),
    detalles TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Índices para log
CREATE INDEX IF NOT EXISTS idx_escalados_log_fecha 
ON escalados_log(fecha DESC);
```

**Click en Execute**

**Resultado esperado**: ✅ "Query returned successfully"

---
**¿Funcionó?** Responde con:
- ✅ "Sí" si funcionó
- ❌ "No" con el error si falló
