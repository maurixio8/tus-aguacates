# 🚀 GUÍA PASO A PASO: Implementación Completa de Mejoras de Escalados v2.0

**Fecha**: 8 de Febrero de 2026
**Tiempo estimado**: 30-45 minutos
**Nivel de dificultad**: Intermedio

---

## 📋 Pre-requisitos

Antes de comenzar, asegurate de tener:

- ✅ Node.js instalado
- ✅ PostgreSQL corriendo (contenedor Docker o local)
- ✅ Credenciales de n8n y PostgreSQL a mano
- ✅ Acceso a la instancia de n8n (https://dep-n8n.n8ntusaguacates.space)

---

## 🔍 Paso 1: Verificar Conexión a PostgreSQL

### Opción A: Usando Docker Desktop

1. **Abre Docker Desktop**
2. **Busca el contenedor de PostgreSQL**
   - Debe llamarse algo como `postgres`, `db`, `tus-aguacates`
3. **Click en "Logs"** para ver que esté corriendo

### Opción B: Usando pgAdmin o DBeaver

1. **Abre pgAdmin o DBeaver**
2. **Conecta a localhost:5432**
3. **Usuario**: `postgres`
4. **Contraseña**: `postgres` (o la que hayas configurado)
5. **Base de datos**: `tus_aguacates`

### Opción C: Usando terminal (si tienes psql)

```bash
# En PowerShell o CMD
cd "C:\Users\Usuario\Documents\proyecto tienda\tus-aguacates"

# Ejecutar query de prueba
node -e "
const { Pool } = require('pg');
const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'tus_aguacates',
  user: 'postgres',
  password: 'postgres'
});
pool.query('SELECT version()', (err, res) => {
  if (err) console.error('Error:', err.message);
  else console.log('✅ Conectado a PostgreSQL:', res.rows[0].version);
  pool.end();
});
"
```

**Si ves la versión de PostgreSQL, todo está bien. ✅**

---

## 🗄️ Paso 2: Ejecutar Script SQL de Mejoras

### 2.1 Verificar Dependencia pg

```bash
cd "C:\Users\Usuario\Documents\proyecto tienda\tus-aguacates"
npm list pg
```

**Si no está instalado:**
```bash
npm install pg
```

### 2.2 Actualizar Credenciales del Script

**Archivo**: `scripts/implementar-escalados-v2.js`

Abre el archivo y verifica que las credenciales sean correctas:

```javascript
const poolConfig = {
    host: 'localhost',        // Verificar host
    port: 5432,             // Verificar puerto
    database: 'tus_aguacates', // Verificar BD
    user: 'postgres',        // Verificar usuario
    password: 'postgres',    // ⚠️ CAMBIAR si es diferente
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
};
```

### 2.3 Ejecutar el Script

```bash
cd "C:\Users\Usuario\Documents\proyecto tienda\tus-aguacates"
node scripts/implementar-escalados-v2.js
```

**Salida esperada:**

```
🚀 Iniciando implementación de mejoras de escalados v2.0

🔄 Ejecutando script SQL de mejoras de escalados v2.0...

📝 Leyendo archivo SQL: .../implementar-escalados-v2.sql
📊 Tamaño del archivo: 25 KB

🔐 Iniciando transacción...
⚡ Ejecutando SQL...

✅ SQL ejecutado exitosamente!

🔍 Verificando columnas de escalados agregadas...

✅ Columnas agregadas:
  • atendido_por (character varying) - YES
  • fecha_escalado (timestamp without time zone) - NOT NULL
  • fecha_atencion (timestamp without time zone) - YES
  • fecha_resolucion (timestamp without time zone) - YES
  • motivo_escalado (text) - NOT NULL
  • notificado_escalado (boolean) - YES
  • prioridad_escalado (character varying) - NOT NULL
  • resolucion (text) - YES
  • tiempo_respuesta_minutos (integer) - YES

🔍 Verificando tablas nuevas...

✅ Tablas creadas:
  • escalados_log
  • escalados_metricas

🔍 Verificando funciones nuevas...

✅ Funciones creadas:
  • escalar_con_prioridad
  • marcar_escalado_atendido
  • reporte_escalados

🔍 Verificando vistas nuevas...

✅ Vistas creadas:
  • vw_escalados_metricas_diarias
  • vw_escalados_pendientes

🎉 Sistema de escalados v2.0 implementado exitosamente!

📌 Próximos pasos:
1. Importar workflow: monitor-escalados-v2.json en n8n
2. Activar el workflow
3. Actualizar Agente Luz v6.5 con herramienta mejorada
4. Probar el sistema de escalados

✅ Script finalizado
```

**Si hay errores, revisa la sección "Solución de Problemas" al final.**

---

## 🔌 Paso 3: Importar Workflow en n8n

### 3.1 Abrir n8n

1. **Ve a**: https://dep-n8n.n8ntusaguacates.space
2. **Inicia sesión** si es necesario
3. **Navega a**: Workflows

### 3.2 Importar Workflow Mejorado

1. **Click en**: "Workflows" → "Import from File"
2. **Selecciona**: `tus-aguacates/n8n-workflows/monitor-escalados-v2.json`
3. **Click en**: "Import"

### 3.3 Verificar Credenciales

En el workflow importado, verifica las credenciales:

1. **Nodo**: "🔍 Buscar Escalados Pendientes"
   - **Credencial PostgreSQL**: "Mi PostgreSQL Docker" o equivalente
   - Si no está configurada, créala con:
     - Host: `localhost`
     - Port: `5432`
     - Database: `tus_aguacates`
     - User: `postgres`
     - Password: `postgres` (o la tuya)

2. **Nodo**: "✅ Marcar como Notificados"
   - **Credencial PostgreSQL**: La misma que arriba

3. **Nodo**: "📝 Guardar en Log"
   - **Credencial PostgreSQL**: La misma que arriba

### 3.4 Activar Workflow

1. **Click en**: El botón "Activate" (esquina superior derecha)
2. **Verifica** que el workflow esté activo (debe aparecer un check verde ✅)
3. **Click en**: "Save" para guardar

**El workflow debería ejecutarse cada 5 minutos automáticamente.**

---

## 🤖 Paso 4: Actualizar Agente Luz v6.5

### 4.1 Exportar Workflow Actual

1. **Ve a**: Workflows → "🥑 Agente Luz v6.5 - Con Herramientas Admin Copiloto"
2. **Click en**: Los 3 puntos (⋮) → "Download"
3. **Guarda**: En `tus-aguacates/n8n-workflows/` como backup

### 4.2 Modificar Herramienta TOOL_EscalarServicioCliente

**En el workflow de n8n:**

1. **Busca el nodo**: "TOOL_EscalarServicioCliente"
2. **Edita la query**:

Copia este SQL:

```sql
UPDATE clientes
SET
    estado_conversacion = 'ESCALADO',
    fecha_escalado = NOW(),
    motivo_escalado = $1,
    prioridad_escalado =
        CASE
            WHEN LOWER($1) LIKE '%queja%' OR LOWER($1) LIKE '%molesto%' OR LOWER($1) LIKE '%urgente%' THEN 'urgente'
            WHEN LOWER($1) LIKE '%pago%' OR LOWER($1) LIKE '%comprobante%' OR LOWER($1) LIKE '%cobranza%' THEN 'alta'
            WHEN LOWER($1) LIKE '%problema%' OR LOWER($1) LIKE '%error%' OR LOWER($1) LIKE '%falla%' THEN 'alta'
            ELSE 'normal'
        END,
    notificado_escalado = false,
    atendido_por = NULL,
    fecha_atencion = NULL,
    tiempo_respuesta_minutos = NULL,
    resolucion = NULL,
    fecha_resolucion = NULL
WHERE telefono = '{{ $('1. Pre-procesamiento YCloud').first().json.from }}'
RETURNING
    nombre,
    telefono,
    estado_conversacion,
    prioridad_escalado,
    'Escalado con prioridad ' || 
    CASE 
        WHEN LOWER($1) LIKE '%queja%' OR LOWER($1) LIKE '%molesto%' OR LOWER($1) LIKE '%urgente%' THEN 'URGENTE'
        WHEN LOWER($1) LIKE '%pago%' OR LOWER($1) LIKE '%comprobante%' OR LOWER($1) LIKE '%cobranza%' THEN 'ALTA'
        WHEN LOWER($1) LIKE '%problema%' OR LOWER($1) LIKE '%error%' OR LOWER($1) LIKE '%falla%' THEN 'ALTA'
        ELSE 'NORMAL'
    END as mensaje_confirmacion;
```

3. **Pega el SQL** en el nodo "TOOL_EscalarServicioCliente"
4. **Click en**: "Done" o "Save"

### 4.3 Agregar Nodo de Mensaje al Cliente

**Después de TOOL_EscalarServicioCliente:**

1. **Click en**: El nodo "TOOL_EscalarServicioCliente"
2. **Click en**: El botón "+" para agregar un nodo después
3. **Selecciona**: "Code" → "Add Node"
4. **Nombre del nodo**: "💬 Mensaje al Cliente"
5. **Pega este código**:

```javascript
// Datos del escalado
const datos = $input.first().json;
const prioridad = datos.prioridad_escalado || 'normal';
const nombre = datos.nombre || 'cliente';

// Determinar tiempo estimado según prioridad
let tiempo_estimado;
let emoji_prioridad;

switch(prioridad) {
    case 'urgente':
        tiempo_estimado = 'menos de 15 minutos';
        emoji_prioridad = '🔴';
        break;
    case 'alta':
        tiempo_estimado = 'menos de 30 minutos';
        emoji_prioridad = '🟡';
        break;
    case 'normal':
        tiempo_estimado = 'menos de 1 hora';
        emoji_prioridad = '🟢';
        break;
    default:
        tiempo_estimado = 'lo antes posible';
        emoji_prioridad = '🟢';
}

// Preparar mensaje
const mensaje = `${emoji_prioridad} Entendido ${nombre} 👤

He escalado tu solicitud a nuestro equipo de atención al cliente.
Te contactarán en ${tiempo_estimado}.

📌 Número de caso: ${datos.telefono.slice(-4)}`;

// Preparar respuesta para WhatsApp
const contexto = $('1. Pre-procesamiento YCloud').first().json;

return [{
    json: {
        from: contexto.to,
        to: contexto.from,
        type: 'text',
        text: { body: mensaje }
    }
}];
```

6. **Click en**: "Done" o "Save"

### 4.4 Conectar Nodos

1. **Conecta**: "TOOL_EscalarServicioCliente" → "💬 Mensaje al Cliente"
2. **Conecta**: "💬 Mensaje al Cliente" → "📤 Preparar Respuesta"

**Importante**: El nodo "💬 Mensaje al Cliente" debe estar conectado al workflow existente.

### 4.5 Guardar y Activar

1. **Click en**: "Save" (esquina superior derecha)
2. **Click en**: "Activate"
3. **Verifica** que el workflow esté activo

---

## ✅ Paso 5: Pruebas del Sistema

### Prueba 1: Escalar un Cliente

1. **Envía un mensaje a tu número de WhatsApp**: "Quiero hablar con humano" o "Tengo una queja"
2. **Espera** la respuesta del Agente Luz
3. **Verifica** que te escale correctamente

**Deberías ver algo como:**
```
🔴 Entendido [Tu nombre] 👤

He escalado tu solicitud a nuestro equipo de atención al cliente.
Te contactarán en menos de 15 minutos.

📌 Número de caso: [4 últimos dígitos de tu teléfono]
```

### Prueba 2: Verificar Monitor

1. **Ve a n8n**: Workflows → "🔔 Monitor Escalados v2 - Con SLA"
2. **Click en**: "Executions" para ver si se ejecutó
3. **Deberías ver** una ejecución reciente (cada 5 minutos)

### Prueba 3: Verificar Notificación al Equipo

Si el monitor detectó tu escalado:

1. **Deberías recibir** un WhatsApp al número del admin (573203062007)
2. **Mensaje** con tu nombre, teléfono y prioridad

### Prueba 4: Verificar Base de Datos

1. **Ejecuta esta query** en PostgreSQL:

```sql
SELECT 
    nombre,
    telefono,
    prioridad_escalado,
    motivo_escalado,
    fecha_escalado,
    ROUND(EXTRACT(EPOCH FROM (NOW() - fecha_escalado))/60, 1) as minutos_esperando
FROM clientes
WHERE estado_conversacion = 'ESCALADO'
ORDER BY prioridad_escalado, fecha_escalado;
```

2. **Deberías ver** tu registro con la prioridad asignada

### Prueba 5: Verificar Vistas

1. **Ejecuta**:

```sql
SELECT * FROM vw_escalados_pendientes;
```

2. **Deberías ver** todos los escalados pendientes con información de SLA

---

## 🔧 Solución de Problemas

### Error: "Cannot find module 'pg'"

**Solución**:
```bash
cd "C:\Users\Usuario\Documents\proyecto tienda\tus-aguacates"
npm install pg
```

### Error: "Connection refused" o "Could not connect"

**Soluciones**:

1. **Verificar que PostgreSQL esté corriendo**:
   - Docker Desktop: Busca el contenedor "postgres"
   - Debe estar en estado "Running"

2. **Verificar puerto**:
   - Generalmente es 5432
   - Si usas Docker pooler, puede ser 6543

3. **Verificar credenciales**:
   - Usuario: `postgres`
   - Contraseña: `postgres` (o la que hayas configurado)
   - Database: `tus_aguacates`

4. **Probar conexión**:
   - Usa pgAdmin o DBeaver para probar la conexión
   - Si funciona ahí, el problema es en el script

### Error: "Column already exists" (columna ya existe)

**Solución**:
- El SQL usa `ADD COLUMN IF NOT EXISTS`, pero si aún así da error
- Ejecuta este SQL manualmente:

```sql
-- Verificar columnas existentes
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'clientes'
  AND column_name IN ('fecha_escalado', 'prioridad_escalado', 'motivo_escalado',
                    'atendido_por', 'fecha_atencion', 'tiempo_respuesta_minutos',
                    'resolucion', 'fecha_resolucion')
ORDER BY column_name;
```

- Si las columnas ya existen, continúa con el paso 3

### Error en n8n: "Workflow execution failed"

**Soluciones**:

1. **Verificar credenciales**:
   - Asegúrate de que la credencial PostgreSQL esté configurada
   - Prueba la conexión desde n8n

2. **Verificar query**:
   - Pega la query en pgAdmin o DBeaver
   - Ejecútala y verifica que funcione

3. **Verificar triggers**:
   - Asegúrate de que el nodo de schedule esté configurado
   - Debe ejecutarse cada 5 minutos

### No recibo notificaciones de WhatsApp

**Soluciones**:

1. **Verificar credenciales de YCloud**:
   - En el nodo "📱 Enviar Notificación Admin"
   - Verifica que la credencial esté configurada
   - API key correcta

2. **Verificar número del admin**:
   - El número debe ser: `573203062007`
   - Verifica que sea correcto

3. **Verificar que el workflow esté activo**:
   - En n8n, verifica que el workflow esté activo
   - Revisa las ejecuciones en "Executions"

---

## 📊 Monitoreo Después de la Implementación

### Primeros 15 minutos

- [ ] Verificar que el workflow de monitor se ejecutó
- [ ] Verificar que no hay errores en los logs
- [ ] Revisar ejecuciones en n8n

### Primera hora

- [ ] Monitorear escalados que lleguen
- [ ] Verificar que el equipo reciba notificaciones
- [ ] Verificar que los clientes reciban confirmación

### Primera semana

- [ ] Revisar métricas diarias
- [ ] Ajustar SLA si es necesario
- [ ] Analizar tiempos de respuesta
- [ ] Recibir feedback del equipo

---

## 📈 Métricas a Monitorear

### SLA Objetivos

- **🔴 URGENTE**: < 15 minutos (95% cumplimiento)
- **🟡 ALTA**: < 30 minutos (90% cumplimiento)
- **🟢 NORMAL**: < 60 minutos (85% cumplimiento)

### Queries de Monitoreo

**Escalados pendientes**:
```sql
SELECT * FROM vw_escalados_pendientes;
```

**Métricas de hoy**:
```sql
SELECT * FROM vw_escalados_metricas_diarias
WHERE fecha_reporte = CURRENT_DATE;
```

**Log de notificaciones**:
```sql
SELECT * FROM escalados_log
ORDER BY fecha DESC
LIMIT 20;
```

**Tiempo promedio de respuesta**:
```sql
SELECT 
    prioridad_escalado,
    COUNT(*) as total,
    AVG(tiempo_respuesta_minutos) as promedio,
    MAX(tiempo_respuesta_minutos) as maximo,
    MIN(tiempo_respuesta_minutos) as minimo
FROM clientes
WHERE fecha_atencion IS NOT NULL
GROUP BY prioridad_escalado
ORDER BY 
    CASE prioridad_escalado
        WHEN 'urgente' THEN 1
        WHEN 'alta' THEN 2
        WHEN 'normal' THEN 3
    END;
```

---

## 🎯 Checklist de Implementación Completa

- [ ] ✅ Paso 1: Verificar conexión a PostgreSQL
- [ ] ✅ Paso 2: Ejecutar script SQL de mejoras
- [ ] ✅ Paso 3: Importar workflow monitor-escalados-v2.json
- [ ] ✅ Paso 4: Actualizar TOOL_EscalarServicioCliente
- [ ] ✅ Paso 5: Agregar nodo de mensaje al cliente
- [ ] ✅ Paso 6: Activar workflows
- [ ] ✅ Paso 7: Prueba de escalado
- [ ] ✅ Paso 8: Verificar notificaciones
- [ ] ✅ Paso 9: Verificar base de datos
- [ ] ✅ Paso 10: Monitoreo durante primera hora

---

## 📞 Contacto y Soporte

Si tienes problemas durante la implementación:

1. **Revisa la sección "Solución de Problemas"**
2. **Verifica los logs de n8n** (Executions del workflow)
3. **Verifica los logs de PostgreSQL**
4. **Contacta a soporte técnico si es necesario**

---

**¡Éxito con la implementación! 🎉**

Recuerda monitorear el sistema durante la primera semana y ajustar según los datos reales.
