-- =====================================================
-- 🚨 MEJORAS AL SISTEMA DE ESCALADO A HUMANOS
-- =====================================================
-- Versión: 2.0
-- Fecha: 2026-02-08
-- Objetivo: Implementar SLA, priorización y seguimiento
-- =====================================================

-- =====================================================
-- 1. AGREGAR COLUMNAS DE GESTIÓN DE ESCALADOS
-- =====================================================

-- Agregar columnas de SLA y seguimiento
ALTER TABLE clientes
ADD COLUMN IF NOT EXISTS fecha_escalado TIMESTAMP,
ADD COLUMN IF NOT EXISTS notificado_escalado BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS prioridad_escalado VARCHAR(20) DEFAULT 'normal',
ADD COLUMN IF NOT EXISTS motivo_escalado TEXT,
ADD COLUMN IF NOT EXISTS atendido_por VARCHAR(100),
ADD COLUMN IF NOT EXISTS fecha_atencion TIMESTAMP,
ADD COLUMN IF NOT EXISTS tiempo_respuesta_minutos INTEGER,
ADD COLUMN IF NOT EXISTS resolucion TEXT,
ADD COLUMN IF NOT EXISTS fecha_resolucion TIMESTAMP;

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

-- =====================================================
-- 2. CREAR ÍNDICES PARA MEJORAR RENDIMIENTO
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

-- =====================================================
-- 3. CREAR TABLA DE MÉTRICAS DE ESCALADOS
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

-- =====================================================
-- 4. CREAR TABLA DE LOG DE ESCALADOS
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

-- =====================================================
-- 5. CREAR VISTAS ÚTILES
-- =====================================================

-- Vista de escalados pendientes con información de SLA
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

-- Vista de métricas diarias
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
    
    SUM(urgentes_excedidos) as total_urgentes_excedidos,
    SUM(altos_excedidos) as total_altos_excedidos,
    SUM(normales_excedidos) as total_normales_excedidos,
    
    SUM(excedidos_sla) as total_excedidos_sla,
    
    -- Porcentaje dentro de SLA
    CASE 
        WHEN SUM(total_escalados) > 0 
        THEN ROUND(100.0 * (SUM(total_escalados) - SUM(excedidos_sla)) / SUM(total_escalados), 2)
        ELSE 0
    END as porcentaje_dentro_sla
    
FROM escalados_metricas
GROUP BY fecha_reporte
ORDER BY fecha_reporte DESC;

-- =====================================================
-- 6. CREAR FUNCIONES ÚTILES
-- =====================================================

-- Función para marcar un escalado como atendido
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

-- Función para obtener reporte de escalados
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

-- Función para escalar con prioridad automática
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

-- =====================================================
-- 7. LIMPIEZA Y MANTENIMIENTO
-- =====================================================

-- Función para limpiar datos antiguos de métricas (más de 30 días)
CREATE OR REPLACE FUNCTION limpiar_escalados_metricas()
RETURNS INTEGER AS $$
BEGIN
    DELETE FROM escalados_log
    WHERE fecha < NOW() - INTERVAL '30 days';
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 8. COMENTARIOS Y DOCUMENTACIÓN
-- =====================================================

COMMENT ON TABLE clientes IS 
'Tabla de clientes de Tus Aguacates. Incluye gestión de escalados a humanos con SLA y priorización.';

COMMENT ON COLUMN clientes.fecha_escalado IS 
'Fecha en que el cliente fue escalado a atención humana';

COMMENT ON COLUMN clientes.prioridad_escalado IS 
'Prioridad del escalado: baja, normal, alta, urgente. Asignada automáticamente según el motivo.';

COMMENT ON COLUMN clientes.motivo_escalado IS 
'Motivo por el cual el cliente fue escalado';

COMMENT ON COLUMN clientes.atendido_por IS 
'Nombre del asesor que atendió el escalado';

COMMENT ON COLUMN clientes.tiempo_respuesta_minutos IS 
'Tiempo en minutos desde el escalado hasta la atención por humano';

COMMENT ON TABLE escalados_metricas IS 
'Tabla para almacenar métricas de escalados por intervalos (cada 5 minutos)';

COMMENT ON TABLE escalados_log IS 
'Log de notificaciones enviadas por el monitor de escalados';

COMMENT ON VIEW vw_escalados_pendientes IS 
'Vista de clientes escalados pendientes con información de SLA y tiempo de espera';

COMMENT ON FUNCTION escalar_con_prioridad IS 
'Escalada un cliente a atención humana con asignación automática de prioridad según el motivo';

COMMENT ON FUNCTION marcar_escalado_atendido IS 
'Marca un escalado como atendido por un asesor y calcula el tiempo de respuesta';

-- =====================================================
-- 9. VERIFICACIÓN
-- =====================================================

-- Mostrar resumen de cambios
DO $$
DECLARE
    v_contador INTEGER;
BEGIN
    -- Verificar columnas agregadas
    SELECT COUNT(*) INTO v_contador
    FROM information_schema.columns
    WHERE table_name = 'clientes'
      AND column_name IN ('fecha_escalado', 'prioridad_escalado', 'motivo_escalado', 'atendido_por');
    
    RAISE NOTICE '✅ Columnas de escalados agregadas: %', v_contador;
    
    -- Verificar índices
    SELECT COUNT(*) INTO v_contador
    FROM pg_indexes
    WHERE tablename = 'clientes'
      AND indexname LIKE '%escalado%';
    
    RAISE NOTICE '✅ Índices de escalados creados: %', v_contador;
    
    -- Verificar tablas nuevas
    SELECT COUNT(*) INTO v_contador
    FROM information_schema.tables
    WHERE table_name IN ('escalados_metricas', 'escalados_log');
    
    RAISE NOTICE '✅ Tablas de métricas creadas: %', v_contador;
    
    -- Verificar funciones
    SELECT COUNT(*) INTO v_contador
    FROM pg_proc
    WHERE proname IN ('escalar_con_prioridad', 'marcar_escalado_atendido', 'reporte_escalados');
    
    RAISE NOTICE '✅ Funciones de escalados creadas: %', v_contador;
    
    -- Verificar vistas
    SELECT COUNT(*) INTO v_contador
    FROM information_schema.views
    WHERE table_name LIKE 'vw_escalados%';
    
    RAISE NOTICE '✅ Vistas de escalados creadas: %', v_contador;
    
    RAISE NOTICE '';
    RAISE NOTICE '🎉 Sistema de escalados v2.0 implementado exitosamente!';
    RAISE NOTICE '';
    RAISE NOTICE '📌 Próximos pasos:';
    RAISE NOTICE '1. Activar workflow "monitor-escalados-v2.json"';
    RAISE NOTICE '2. Importar herramienta mejorada TOOL_EscalarServicioCliente';
    RAISE NOTICE '3. Crear workflow de dashboard de escalados';
    RAISE NOTICE '4. Monitorear métricas durante primera semana';
END $$;
