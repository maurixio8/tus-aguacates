# 🚨 Mejoras al Sistema de Escalamiento a Humanos

## Problemas Actuales

1. **Monitor INACTIVO** - Workflow no está activo
2. **Sin SLA** - No hay tiempos de respuesta definidos
3. **Mensaje genérico** - Sin tiempo estimado al cliente
4. **Sin priorización** - Todos los escalados igual
5. **Sin seguimiento** - No se registra resolución

---

## Propuesta 1: Reactivar y Mejorar el Monitor

### Nuevas columnas en tabla `clientes`:

```sql
ALTER TABLE clientes
ADD COLUMN IF NOT EXISTS fecha_escalado TIMESTAMP,
ADD COLUMN IF NOT EXISTS notificado_escalado BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS prioridad_escalado VARCHAR(20) DEFAULT 'normal', -- baja, normal, alta, urgente
ADD COLUMN IF NOT EXISTS motivo_escalado TEXT,
ADD COLUMN IF NOT EXISTS atendido_por VARCHAR(100),
ADD COLUMN IF NOT EXISTS fecha_atencion TIMESTAMP,
ADD COLUMN IF NOT EXISTS tiempo_respuesta_minutos INTEGER;
```

---

## Propuesta 2: Mejorar la Herramienta de Escalado

### Nueva versión de TOOL_EscalarServicioCliente:

```sql
-- Query mejorado con priorización automática
UPDATE clientes
SET
    estado_conversacion = 'ESCALADO',
    fecha_escalado = NOW(),
    motivo_escalado = $1,
    prioridad_escalado =
        CASE
            WHEN LOWER($1) LIKE '%queja%' OR LOWER($1) LIKE '%molesto%' OR LOWER($1) LIKE '%urgente%' THEN 'urgente'
            WHEN LOWER($1) LIKE '%pago%' OR LOWER($1) LIKE '%comprobante%' THEN 'alta'
            WHEN LOWER($1) LIKE '%problema%' OR LOWER($1) LIKE '%error%' THEN 'alta'
            ELSE 'normal'
        END,
    notificado_escalado = false
WHERE telefono = '{{ $('1. Pre-procesamiento YCloud').first().json.from }}'
RETURNING
    nombre,
    telefono,
    estado_conversacion,
    prioridad_escalado,
    'Escalado con prioridad ' || CASE
        WHEN LOWER($1) LIKE '%queja%' OR LOWER($1) LIKE '%molesto%' OR LOWER($1) LIKE '%urgente%' THEN 'URGENTE'
        WHEN LOWER($1) LIKE '%pago%' OR LOWER($1) LIKE '%comprobante%' THEN 'ALTA'
        WHEN LOWER($1) LIKE '%problema%' OR LOWER($1) LIKE '%error%' THEN 'ALTA'
        ELSE 'NORMAL'
    END as mensaje_confirmacion;
```

### Descripción de herramienta mejorada:

```
Escalara la conversación a servicio al cliente humano.
Úsala cuando: cliente molesto, queja, comprobante de pago, problema técnico, o pide hablar con humano.

INPUT: motivo_escalado (Motivo del escalado)

PRIORIDAD AUTOMÁTICA:
- URGENTE: quejas, cliente molesto, urgente
- ALTA: pagos, comprobantes, problemas técnicos
- NORMAL: consulta general, pide hablar con humano
```

---

## Propuesta 3: Mensaje Mejorado al Cliente

### Nuevo nodo después de TOOL_EscalarServicioCliente:

```javascript
// Mensaje al cliente después de escalar
const prioridad = $input.first().json.prioridad_escalado || 'normal';
const nombre = $input.first().json.nombre || 'cliente';

let tiempo_estimado;
let mensaje;

switch(prioridad) {
    case 'urgente':
        tiempo_estimado = 'menos de 15 minutos';
        break;
    case 'alta':
        tiempo_estimado = 'menos de 30 minutos';
        break;
    default:
        tiempo_estimado = 'menos de 1 hora';
}

mensaje = `Entendido ${nombre} 👤

He escalado tu solicitud a nuestro equipo de atención al cliente.
Te contactarán en ${tiempo_estimado}.

📌 Número de caso: ${$input.first().json.telefono.slice(-4)}`;

return {
    json: {
        from: $json.to,
        to: $json.from,
        type: 'text',
        text: { body: mensaje }
    }
};
```

---

## Propuesta 4: Monitor Mejorado con SLA

### Nuevo workflow: `monitor-escalados-v2.json`

```
Frecuencia: Cada 5 minutos

1. 🔍 Buscar Escalados No Notificados
   - Prioridad: urgente > alta > normal
   - Orden: prioridad, fecha_escalado

2. 📊 Análisis de SLA
   - Urgente: > 15 min sin atención → ALERTA CRÍTICA
   - Alta: > 30 min sin atención → ALERTA
   - Normal: > 60 min sin atención → RECORDATORIO

3. 📱 Notificaciones al Equipo

   A. Prioridad URGENTE (WhatsApp + Email)
      Mensaje: "🚨 URGENTE - [Nombre] esperando [X] min"
      Incluye: motivo, teléfono, tiempo esperando

   B. Prioridad ALTA (WhatsApp)
      Mensaje: "⚠️ Alta prioridad - [Nombre] esperando [X] min"

   C. Prioridad NORMAL (WhatsApp cada 30 min)
      Mensaje: "📋 Normal - [Nombre] esperando [X] min"

4. ✅ Marcar como Notificados

5. 📊 Reporte de Métricas
   - Tiempo promedio de respuesta
   - Total escalados por día/semana
   - Distribución por prioridad
```

---

## Propuesta 5: Dashboard de Escalados

### Nuevo workflow: `dashboard-escalados.json`

```
Trigger: Webhook (manual o cada hora)

1. 📊 Métricas de Hoy
   - Total escalados
   - Pendientes de atención
   - Atendidos
   - Tiempo promedio de respuesta
   - Escalados por prioridad

2. 🔢 Clientes Esperando Más de SLA
   - Urgentes > 15 min
   - Altos > 30 min
   - Normales > 60 min

3. 📈 Tendencias
   - Comparación con días anteriores
   - Horas pico de escalados
   - Motivos más frecuentes

4. 📱 Enviar Reporte al Admin
   Formato:
   ```
   📊 REPORTESCALADOS - [FECHA]

   📌 RESUMEN DEL DÍA:
   • Total escalados: XX
   • Pendientes: XX
   • Atendidos: XX
   • Tiempo promedio: XX min

   🔴 URGENTES esperando: XX
   🟡 ALTOS esperando: XX
   🟢 NORMALES esperando: XX

   ⚠️ SLA EXCEDIDO: XX clientes
   ```

5. 📊 Guardar métricas en tabla:
   CREATE TABLE escalados_metricas (
       id SERIAL PRIMARY KEY,
       fecha TIMESTAMP DEFAULT NOW(),
       total_escalados INTEGER,
       pendientes INTEGER,
       atendidos INTEGER,
       tiempo_promedio_minutos NUMERIC,
       urgentes_excedidos INTEGER,
       altos_excedidos INTEGER,
       normales_excedidos INTEGER
   );
```

---

## Propuesta 6: Herramienta para Marcar como Atendido

### Nueva herramienta: TOOL_MarcarAtendido

```sql
-- Marcar un escalado como atendido por el equipo
UPDATE clientes
SET
    atendido_por = $1,  -- Nombre del asesor
    fecha_atencion = NOW(),
    tiempo_respuesta_minutos = ROUND(EXTRACT(EPOCH FROM (NOW() - fecha_escalado))/60),
    estado_conversacion = 'ATENDIDO',
    prioridad_escalado = NULL,
    notificado_escalado = false
WHERE estado_conversacion = 'ESCALADO'
  AND telefono LIKE '%' || RIGHT($2, 10) || '%'
RETURNING
    nombre,
    tiempo_respuesta_minutos,
    'Atendido por ' || $1 || '. Tiempo de respuesta: ' ||
    ROUND(EXTRACT(EPOCH FROM (NOW() - fecha_escalado))/60) || ' minutos' as mensaje;
```

### Descripción:

```
Marcar un cliente escalado como ATENDIDO por el equipo humano.
Usar cuando un asesor toma el caso del cliente.

INPUTS:
- asesor: Nombre del asesor que atiende
- telefono: Teléfono del cliente (últimos dígitos)
```

---

## Propuesta 7: Integración con Copiloto

### Nuevo comando en Copiloto:

```
"¿Cuántos escalados hay?"
→ TOOL_ADMIN_EscaladosPendientes()

"Lista los escalados urgentes"
→ TOOL_ADMIN_EscaladosPorPrioridad('urgente')

"Marca el 3161932558 como atendido por Mauricio"
→ TOOL_MarcarAtendido(asesor='Mauricio', telefono='3161932558')

"Reporte de escalados de hoy"
→ TOOL_ADMIN_ReporteEscalados()
```

---

## Plan de Implementación

### Fase 1: Crítica (HOY)
- ✅ Activar workflow monitor-escalados
- ✅ Agregar columnas SLA a tabla clientes
- ✅ Mejorar TOOL_EscalarServicioCliente con prioridad
- ✅ Mejorar mensaje al cliente

### Fase 2: Mejoras (Esta semana)
- ✅ Crear monitor-escalados-v2 con SLA
- ✅ Crear dashboard de escalados
- ✅ Crear herramienta TOOL_MarcarAtendido
- ✅ Agregar comandos al Copiloto

### Fase 3: Optimización (Próxima semana)
- ✅ Analizar métricas
- ✅ Ajustar SLA según datos reales
- ✅ Optimizar tiempos de respuesta
- ✅ Crear reportes semanales

---

## Métricas de Éxito

### SLA Objetivos:
- **Urgente**: < 15 minutos
- **Alta**: < 30 minutos
- **Normal**: < 60 minutos

### Métricas a Monitorear:
1. % de escalados atendidos dentro de SLA
2. Tiempo promedio de respuesta por prioridad
3. Total de escalados por día
4. Motivos más frecuentes de escalado
5. % de clientes que vuelven a escalar

---

## Scripts SQL para Implementación

### 1. Agregar columnas SLA:

```sql
-- Agregar columnas para gestión de escalados
ALTER TABLE clientes
ADD COLUMN IF NOT EXISTS fecha_escalado TIMESTAMP,
ADD COLUMN IF NOT EXISTS notificado_escalado BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS prioridad_escalado VARCHAR(20) DEFAULT 'normal' CHECK (prioridad_escalado IN ('baja', 'normal', 'alta', 'urgente')),
ADD COLUMN IF NOT EXISTS motivo_escalado TEXT,
ADD COLUMN IF NOT EXISTS atendido_por VARCHAR(100),
ADD COLUMN IF NOT EXISTS fecha_atencion TIMESTAMP,
ADD COLUMN IF NOT EXISTS tiempo_respuesta_minutos INTEGER;

-- Crear índices para búsquedas
CREATE INDEX IF NOT EXISTS idx_clientes_estado_escalado ON clientes(estado_conversacion)
WHERE estado_conversacion = 'ESCALADO';
CREATE INDEX IF NOT EXISTS idx_clientes_prioridad_escalado ON clientes(prioridad_escalado)
WHERE prioridad_escalado IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_clientes_fecha_escalado ON clientes(fecha_escalado)
WHERE fecha_escalado IS NOT NULL;
```

### 2. Crear tabla de métricas:

```sql
-- Tabla para almacenar métricas de escalados
CREATE TABLE IF NOT EXISTS escalados_metricas (
    id SERIAL PRIMARY KEY,
    fecha TIMESTAMP DEFAULT NOW(),
    fecha_reporte DATE DEFAULT CURRENT_DATE,
    total_escalados INTEGER DEFAULT 0,
    pendientes INTEGER DEFAULT 0,
    atendidos INTEGER DEFAULT 0,
    tiempo_promedio_minutos NUMERIC DEFAULT 0,
    urgentes INTEGER DEFAULT 0,
    altos INTEGER DEFAULT 0,
    normales INTEGER DEFAULT 0,
    urgentes_excedidos INTEGER DEFAULT 0,
    altos_excedidos INTEGER DEFAULT 0,
    normales_excedidos INTEGER DEFAULT 0
);

-- Índice
CREATE INDEX IF NOT EXISTS idx_escalados_metricas_fecha ON escalados_metricas(fecha_reporte);
```

### 3. Query para reporte de escalados:

```sql
-- Reporte de escalados pendientes
SELECT
    prioridad_escalado,
    COUNT(*) as cantidad,
    MIN(fecha_escalado) as escalado_más_antiguo,
    ROUND(EXTRACT(EPOCH FROM (NOW() - MAX(fecha_escalado)))/60) as minutos_esperando,
    string_agg(nombre || ' (' || telefono || ')', E'\n' ORDER BY fecha_escalado) as clientes
FROM clientes
WHERE estado_conversacion = 'ESCALADO'
GROUP BY prioridad_escalado
ORDER BY
    CASE prioridad_escalado
        WHEN 'urgente' THEN 1
        WHEN 'alta' THEN 2
        WHEN 'normal' THEN 3
        ELSE 4
    END;
```

---

## Resumen de Archivos a Crear/Modificar

1. **Modificar**: `Agente Luz v6.5 - Con Herramientas Admin Copiloto.json`
   - Actualizar TOOL_EscalarServicioCliente
   - Agregar nodo de mensaje al cliente

2. **Modificar**: `monitor-escalados-workflow.json`
   - Activar workflow
   - Mejorar lógica de notificaciones con SLA
   - Agregar alertas de SLA excedido

3. **Crear**: `dashboard-escalados.json` (nuevo)
   - Reportes diarios de escalados
   - Métricas de SLA

4. **Crear**: Herramienta TOOL_MarcarAtendido (nuevo nodo)
   - Marcar escalados como atendidos
   - Calcular tiempos de respuesta

5. **Crear**: `scripts/sql/mejoras-escalados.sql`
   - Todas las modificaciones de BD

---

## ¿Quieres que proceda con la implementación?

Puedo:
1. Crear los workflows mejorados
2. Generar los scripts SQL
3. Actualizar el Agente Luz v6.5
4. Crear el dashboard de métricas

¿Por dónde empezamos?
