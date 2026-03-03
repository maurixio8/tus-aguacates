# 🔧 PASO 7: CORREGIR VISTA DE MÉTRICAS (ERROR DE NOMBRE)

**Ejecutar en pgAdmin/DBeaver:**

```sql
-- =====================================================
-- CREAR VISTA DE MÉTRICAS DIARIAS - VERSIÓN CORREGIDA
-- =====================================================

-- 1. Primero, eliminar la vista incorrecta si existe
DROP VIEW IF EXISTS vw_escalados_metricas_diarias CASCADE;

-- 2. Crear la vista con nombres de columnas CORRECTOS
CREATE VIEW vw_escalados_metricas_diarias AS
SELECT 
    em.fecha_reporte,
    SUM(em.total_escalados) as total_escalados,
    SUM(em.pendientes) as total_pendientes,
    SUM(em.atendidos) as total_atendidos,
    
    AVG(em.tiempo_promedio_minutos) as tiempo_promedio_global,
    
    SUM(em.urgentes) as total_urgentes,
    SUM(em.altos) as total_altos,
    SUM(em.normales) as total_normales,
    
    SUM(em.urgentes_excedidos) as total_urgentes_excedidos,
    SUM(em.altos_excedidos) as total_altos_excedidos,
    SUM(em.normales_excedidos) as total_normales_excedidos,
    
    -- Calcular total excedidos_sla como SUMA de las columnas CORRECTAS
    SUM(em.urgentes_excedidos) + SUM(em.altos_excedidos) + SUM(em.normales_excedidos) as total_excedidos_sla,
    
    -- Porcentaje dentro de SLA
    CASE 
        WHEN SUM(em.total_escalados) > 0 
        THEN ROUND(100.0 * (SUM(em.total_escalados) - (SUM(em.urgentes_excedidos) + SUM(em.altos_excedidos) + SUM(em.normales_excedidos))) / SUM(em.total_escalados), 2)
        ELSE 0
    END as porcentaje_dentro_sla
    
FROM escalados_metricas em
GROUP BY em.fecha_reporte
ORDER BY em.fecha_reporte DESC;

-- Agregar comentario a la vista corregida
COMMENT ON VIEW vw_escalados_metricas_diarias IS 
'Vista de métricas diarias de escalados (CORREGIDA).

Incluye:
- Total de escalados por día
- Pendientes vs Atendidos
- Tiempo promedio de respuesta
- Distribución por prioridad
- SLA excedidos por prioridad (CORREGIDO: nombres de columnas con una sola "e")
- Porcentaje dentro de SLA
- Tendencia comparativa con días anteriores

IMPORTANTE: Los nombres de columnas son correctos:
- urgentes_excedidos (una "e")
- altos_excedidos (una "o")
- normales_excedidos (una "o")
';

-- Verificar que la vista se creó correctamente
SELECT '✅ Vista vw_escalados_metricas_diarias creada correctamente con nombres corregidos' as mensaje;
```

**Click en Execute**

**Resultado esperado**: ✅ "Query returned successfully" sin errores

---

## ✅ VERIFICACIÓN

**Luego de ejecutar**, ejecuta esta query para verificar:

```sql
-- Verificar que la vista funciona correctamente
SELECT 
    fecha_reporte,
    total_escalados,
    total_pendientes,
    total_atendidos,
    porcentaje_dentro_sla
FROM vw_escalados_metricas_diarias
WHERE fecha_reporte = CURRENT_DATE;
```

**Deberías ver 1 fila** con las métricas de hoy (probablemente con ceros).

---

**¿Funcionó?** Responde con:
- ✅ "Sí, todo funcionó" → Continuamos con importar monitor en n8n
- ❌ "No, dio error" → Pégame el error exacto
