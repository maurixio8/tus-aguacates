# 🔧 PASO 6: CREAR FUNCIONES DEL SISTEMA DE ESCALADOS

**Ejecutar en pgAdmin/DBeaver:**

```sql
-- =====================================================
-- CREAR FUNCIONES ÚTILES PARA ESCALADOS
-- =====================================================

-- 1. Función para escalar con prioridad automática
CREATE OR REPLACE FUNCTION escalar_con_prioridad(
    p_telefono VARCHAR(20),
    p_motivo TEXT
)
RETURNS TABLE(
    telefono VARCHAR(20),
    nombre VARCHAR(255),
    prioridad VARCHAR(20),
    mensaje TEXT
) AS $$
DECLARE
    v_prioridad VARCHAR(20);
BEGIN
    -- Determinar prioridad automáticamente
    v_prioridad := 
        CASE 
            WHEN LOWER(p_motivo) LIKE '%queja%' OR 
                 LOWER(p_motivo) LIKE '%molesto%' OR 
                 LOWER(p_motivo) LIKE '%urgente%' 
            THEN 'urgente'
            WHEN LOWER(p_motivo) LIKE '%pago%' OR 
                 LOWER(p_motivo) LIKE '%comprobante%' OR 
                 LOWER(p_motivo) LIKE '%cobranza%' 
            THEN 'alta'
            WHEN LOWER(p_motivo) LIKE '%problema%' OR 
                 LOWER(p_motivo) LIKE '%error%' OR 
                 LOWER(p_motivo) LIKE '%falla%' 
            THEN 'alta'
            ELSE 'normal'
        END;
    
    RETURN QUERY
    UPDATE clientes
    SET
        estado_conversacion = 'ESCALADO',
        fecha_escalado = NOW(),
        motivo_escalado = p_motivo,
        prioridad_escalado = v_prioridad,
        notificado_escalado = false,
        atendido_por = NULL,
        fecha_atencion = NULL,
        tiempo_respuesta_minutos = NULL,
        resolucion = NULL,
        fecha_resolucion = NULL
    WHERE telefono = p_telefono
    RETURNING 
        telefono,
        nombre,
        v_prioridad as prioridad,
        'Escalado con prioridad ' || UPPER(v_prioridad) || '. Motivo: ' || p_motivo as mensaje;
END;
$$ LANGUAGE plpgsql;

-- 2. Función para marcar un escalado como atendido
CREATE OR REPLACE FUNCTION marcar_escalado_atendido(
    p_telefono VARCHAR(20),
    p_asesor VARCHAR(100),
    p_resolucion TEXT DEFAULT NULL
)
RETURNS TABLE(
    telefono VARCHAR(20),
    nombre VARCHAR(255),
    tiempo_respuesta_minutos INTEGER,
    mensaje TEXT
) AS $$
BEGIN
    RETURN QUERY
    UPDATE clientes
    SET
        atendido_por = p_asesor,
        fecha_atencion = NOW(),
        tiempo_respuesta_minutos = ROUND(EXTRACT(EPOCH FROM (NOW() - fecha_escalado))/60),
        estado_conversacion = 'ATENDIDO',
        prioridad_escalado = NULL,
        notificado_escalado = false,
        resolucion = p_resolucion,
        fecha_resolucion = NOW()
    WHERE estado_conversacion = 'ESCALADO'
      AND telefono LIKE '%' || RIGHT(p_telefono, 10) || '%'
    RETURNING 
        telefono,
        nombre,
        tiempo_respuesta_minutos,
        'Atendido por ' || p_asesor || 
        '. Tiempo de respuesta: ' ||
        ROUND(EXTRACT(EPOCH FROM (NOW() - fecha_escalado))/60) || 
        ' minutos' as mensaje;
END;
$$ LANGUAGE plpgsql;

-- 3. Función para obtener reporte de escalados
CREATE OR REPLACE FUNCTION reporte_escalados(p_fecha DATE DEFAULT CURRENT_DATE)
RETURNS TABLE(
    prioridad VARCHAR(20),
    cantidad INTEGER,
    pendientes INTEGER,
    atendidos INTEGER,
    tiempo_promedio NUMERIC,
    excedidos_sla INTEGER
) AS $$
BEGIN
    RETURN QUERY
    WITH prioridad_datos AS (
        SELECT
            prioridad_escalado,
            COUNT(*) as total,
            COUNT(CASE WHEN estado_conversacion = 'ESCALADO' THEN 1 END) as pendientes,
            COUNT(CASE WHEN estado_conversacion = 'ATENDIDO' THEN 1 END) as atendidos,
            AVG(tiempo_respuesta_minutos) as tiempo_promedio,
            COUNT(CASE 
                WHEN estado_conversacion = 'ESCALADO' AND 
                     ROUND(EXTRACT(EPOCH FROM (NOW() - fecha_escalado))/60) > 
                     CASE prioridad_escalado
                        WHEN 'urgente' THEN 15
                        WHEN 'alta' THEN 30
                        WHEN 'normal' THEN 60
                        ELSE 60
                     END
                THEN 1 
            END) as excedidos_sla
        FROM clientes
        WHERE fecha_escalado::date = p_fecha
          AND prioridad_escalado IS NOT NULL
        GROUP BY prioridad_escalado
    )
    SELECT
        COALESCE(prioridad, 'sin_prioridad'),
        COALESCE(total, 0),
        COALESCE(pendientes, 0),
        COALESCE(atendidos, 0),
        ROUND(COALESCE(tiempo_promedio, 0), 2),
        COALESCE(excedidos_sla, 0)
    FROM prioridad_datos
    ORDER BY 
        CASE prioridad
            WHEN 'urgente' THEN 1
            WHEN 'alta' THEN 2
            WHEN 'normal' THEN 3
            ELSE 4
        END;
END;
$$ LANGUAGE plpgsql;

-- 4. Función para limpiar datos antiguos de métricas (más de 30 días)
CREATE OR REPLACE FUNCTION limpiar_escalados_metricas()
RETURNS INTEGER AS $$
BEGIN
    DELETE FROM escalados_log
    WHERE fecha < NOW() - INTERVAL '30 days';
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Agregar comentarios a las funciones
COMMENT ON FUNCTION escalar_con_prioridad IS 
'Escalada un cliente a atención humana con asignación automática de prioridad según el motivo.

Prioridad: urgente (quejas, urgente), alta (pagos, problemas), normal (consultas)';

COMMENT ON FUNCTION marcar_escalado_atendido IS 
'Marca un escalado como atendido por un asesor y calcula el tiempo de respuesta en minutos.';

COMMENT ON FUNCTION reporte_escalados IS 
'Genera un reporte de escalados por fecha con métricas de SLA y tiempos de respuesta.';

COMMENT ON FUNCTION limpiar_escalados_metricas IS 
'Elimina registros de métricas y logs antiguos (más de 30 días) para mantenimiento.';
```

**Click en Execute**

**Resultado esperado**: ✅ "Query returned successfully" sin errores

---
**¿Funcionó?** Responde con:
- ✅ "Sí" si las 4 funciones se crearon
- ❌ "No" con el error si falló
