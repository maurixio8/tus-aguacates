# 👁️ PASO 7: CREAR VISTAS DEL SISTEMA DE ESCALADOS

**Ejecutar en pgAdmin/DBeaver:**

```sql
-- =====================================================
-- CREAR VISTAS ÚTILES PARA ESCALADOS
-- =====================================================

-- 1. Vista de escalados pendientes con información de SLA
CREATE OR REPLACE VIEW vw_escalados_pendientes AS
SELECT 
    c.telefono,
    c.nombre,
    c.fecha_escalado,
    c.motivo_escalado,
    c.prioridad_escalado,
    ROUND(EXTRACT(EPOCH FROM (NOW() - c.fecha_escalado))/60, 1) as minutos_esperando,
    ROUND(EXTRACT(EPOCH FROM (NOW() - c.fecha_escalado))/60, 0) as minutos_esperando_int,
    
    -- SLA según prioridad
    CASE c.prioridad_escalado
        WHEN 'urgente' THEN 15
        WHEN 'alta' THEN 30
        WHEN 'normal' THEN 60
        ELSE 60
    END as sla_minutos,
    
    -- Estado de SLA
    CASE 
        WHEN ROUND(EXTRACT(EPOCH FROM (NOW() - c.fecha_escalado))/60) > 
             CASE c.prioridad_escalado
                WHEN 'urgente' THEN 15
                WHEN 'alta' THEN 30
                WHEN 'normal' THEN 60
                ELSE 60
             END
        THEN true
        ELSE false
    END as sla_excedido,
    
    -- Tiempo excedido
    CASE 
        WHEN ROUND(EXTRACT(EPOCH FROM (NOW() - c.fecha_escalado))/60) > 
             CASE c.prioridad_escalado
                WHEN 'urgente' THEN 15
                WHEN 'alta' THEN 30
                WHEN 'normal' THEN 60
                ELSE 60
             END
        THEN ROUND(EXTRACT(EPOCH FROM (NOW() - c.fecha_escalado))/60) - 
             CASE c.prioridad_escalado
                WHEN 'urgente' THEN 15
                WHEN 'alta' THEN 30
                WHEN 'normal' THEN 60
                ELSE 60
             END
        ELSE 0
    END as minutos_excedidos_sla,
    
    -- Preordenamiento
    CASE c.prioridad_escalado
        WHEN 'urgente' THEN 1
        WHEN 'alta' THEN 2
        WHEN 'normal' THEN 3
        ELSE 4
    END as orden_prioridad
    
FROM clientes c
WHERE c.estado_conversacion = 'ESCALADO'
ORDER BY 
    orden_prioridad ASC,
    c.fecha_escalado ASC;

-- Agregar comentarios a la vista
COMMENT ON VIEW vw_escalados_pendientes IS 
'Vista de clientes escalados pendientes con información de SLA y tiempo de espera.

Incluye:
- Tiempo esperando (en minutos)
- SLA según prioridad (urgente: 15min, alta: 30min, normal: 60min)
- Estado de SLA (excedido o no)
- Tiempo excedido (si aplica SLA)
- Ordenamiento por prioridad y fecha de escalado

Útil para el monitor de escalados.';

-- 2. Vista de métricas diarias
CREATE OR REPLACE VIEW vw_escalados_metricas_diarias AS
SELECT 
    fecha_reporte,
    SUM(total_escalados) as total_escalados,
    SUM(pendientes) as total_pendientes,
    SUM(atendidos) as total_atendidos,
    
    AVG(tiempo_promedio_minutos) as tiempo_promedio_global,
    
    SUM(urgentes) as total_urgentes,
    SUM(altos) as total_altos,
    SUM(normales) as total_normales,
    
    SUM(urgentees_excedidos) as total_urgentess_excedidos,
    SUM(altos_excedidos) as total_altos_excedidos,
    SUM(normales_excedidos) as total_normales_excedidos,
    
    -- Calcular total excedidos_sla como SUMA de las columnas que SÍ existen
    SUM(urgentess_excedidos) + SUM(altos_excedidos) + SUM(normales_excedidos) as total_excedidos_sla,
    
    -- Porcentaje dentro de SLA
    CASE 
        WHEN SUM(total_escalados) > 0 
        THEN ROUND(100.0 * (SUM(total_escalados) - (SUM(urgentess_excedidos) + SUM(altos_excedidos) + SUM(normales_excedidos))) / SUM(total_escalados), 2)
        ELSE 0
    END as porcentaje_dentro_sla
    
FROM escalados_metricas
GROUP BY fecha_reporte
ORDER BY fecha_reporte DESC;

-- Agregar comentarios a la vista
COMMENT ON VIEW vw_escalados_metricas_diarias IS 
'Vista de métricas diarias de escalados.

Incluye:
- Total de escalados por día
- Pendientes vs Atendidos
- Tiempo promedio de respuesta
- Distribución por prioridad
- SLA excedidos por prioridad
- Porcentaje dentro de SLA

Útil para análisis de rendimiento del servicio al cliente.';

-- 3. Vista de escalados atendidos
CREATE OR REPLACE VIEW vw_escalados_atendidos AS
SELECT 
    telefono,
    nombre,
    prioridad_escalado,
    fecha_escalado,
    fecha_atencion,
    motivo_escalado,
    resolucion,
    atendido_por,
    tiempo_respuesta_minutos,
    fecha_resolucion,
    ROUND(EXTRACT(EPOCH FROM (fecha_atencion - fecha_escalado))/60, 1) as minutos_real_esperando,
    
    -- Calcular si cumplió SLA
    CASE 
        WHEN ROUND(EXTRACT(EPOCH FROM (fecha_atencion - fecha_escalado))/60) > 
             CASE prioridad_escalado
                WHEN 'urgente' THEN 15
                WHEN 'alta' THEN 30
                WHEN 'normal' THEN 60
                ELSE 60
             END
        THEN false
        ELSE true
    END as cumplio_sla
    
FROM clientes
WHERE estado_conversacion = 'ATENDIDO'
  AND fecha_escalado IS NOT NULL
ORDER BY fecha_atencion DESC;

-- Agregar comentarios a la vista
COMMENT ON VIEW vw_escalados_atendidos IS 
'Vista de escalados que ya fueron atendidos.

Incluye:
- Tiempo de respuesta real
- Si cumplió con SLA o no
- Motivo y resolución
- Asesor que atendió

Útil para análisis de rendimiento y capacitación del equipo.';

-- 4. Vista de resumen ejecutivo diario
CREATE OR REPLACE VIEW vw_escalados_resumen_ejecutivo AS
SELECT 
    em.fecha_reporte,
    
    -- Métricas generales
    em.total_escalados,
    em.total_pendientes,
    em.total_atendidos,
    em.porcentaje_dentro_sla,
    em.tiempo_promedio_global as tiempo_promedio_respuesta,
    
    -- Distribución por prioridad
    em.total_urgentess as total_urgente_escalado,
    em.total_altos as total_alta_escalado,
    em.total_normales as total_normal_escalado,
    
    -- SLA por prioridad
    em.total_urgentess_excedidos as urgente_fuera_sla,
    em.total_altos_excedidos as alta_fuera_sla,
    em.total_normales_excedidos as normal_fuera_sla,
    
    -- Nivel de alerta del día
    CASE 
        WHEN (em.total_urgentess_excedidos > 0) THEN 'CRÍTICO'
        WHEN (em.total_altos_excedidos > em.total_altos * 0.2) THEN 'ALERTA'
        WHEN (em.total_normales_excedidos > em.total_normales * 0.3) THEN 'PRECAUCIÓN'
        WHEN (em.porcentaje_dentro_sla >= 95) THEN 'EXCELENTE'
        WHEN (em.porcentaje_dentro_sla >= 85) THEN 'BUENO'
        ELSE 'NECESITA MEJORA'
    END as nivel_alerta,
    
    -- Tendencia comparativa (con el día anterior)
    COALESCE(
        (SELECT AVG(porcentaje_dentro_sla) 
         FROM vw_escalados_metricas_diarias 
         WHERE fecha_reporte = em.fecha_reporte - INTERVAL '1 day')
        - em.porcentaje_dentro_sla,
        0
    ) as tendencia_comparativa
    
FROM vw_escalados_metricas_diarias em
ORDER BY em.fecha_reporte DESC;

-- Agregar comentarios a la vista
COMMENT ON VIEW vw_escalados_resumen_ejecutivo IS 
'Vista ejecutiva diaria de escalados.

Incluye:
- Nivel de alerta del día (CRÍTICO, ALERTA, PRECAUCIÓN, BUENO, EXCELENTE)
- Tendencia comparativa con el día anterior
- Métricas clave consolidadas

Ideal para reportes de dirección y toma de decisiones.';
```

**Click en Execute**

**Resultado esperado**: ✅ "Query returned successfully" sin errores

---
**¿Funcionó?** Responde con:
- ✅ "Sí, las 4 vistas se crearon" → Paso 8: Importar Monitor en n8n
- ❌ "No, dio error" → Pégame el error exacto
