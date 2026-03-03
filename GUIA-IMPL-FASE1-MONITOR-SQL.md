# 🚀 IMPLEMENTACIÓN COMPLETA - FASE 1: Monitor de Escalados + SQL

**Fecha**: 8 de Febrero de 2026
**Prioridad**: 🔴 CRÍTICA
**Tiempo estimado**: 30 minutos

---

## 🎯 OBJETIVO DE ESTA FASE

1. ✅ Importar el monitor de escalados v2 en n8n
2. ✅ Ejecutar script SQL para agregar columnas de priorización y SLA
3. ✅ Verificar que todo funciona correctamente

---

## 📋 PASO 1: Importar Monitor de Escalados v2 en n8n (10 min)

### Instrucciones:

1. **Abrir n8n**: Ve a https://dep-n8n.n8ntusaguacates.space/workflows

2. **Importar workflow**:
   - Click en el botón: **"Import from File"** (esquina superior derecha)
   - Busca y selecciona: `tus-aguacates/n8n-workflows/monitor-escalados-v2.json`
   - Click en **"Import"**

3. **Verificar nombre del workflow**:
   - El workflow importado debería llamarse: **"🔔 Monitor Escalados v2 - Con SLA"**

4. **Verificar credenciales**:

   **Nodo 1: "🔍 Buscar Escalados Pendientes"**
   - Click en el nodo
   - Seleccionar credencial: **"Mi PostgreSQL Docker"** (id: R6hc0vEZJhKQSi3G)
   - Click en **"Save"**

   **Nodo 2: "✅ Marcar como Notificados"**
   - Click en el nodo
   - Seleccionar credencial: **"Mi PostgreSQL Docker"** (id: R6hc0vEZJhKQSi3G)
   - Click en **"Save"**

   **Nodo 3: "📝 Guardar en Log"**
   - Click en el nodo
   - Seleccionar credencial: **"Mi PostgreSQL Docker"** (id: R6hc0vEZJhKQSi3G)
   - Click en **"Save"**

   **Nodo 4: "📱 Enviar Notificación Admin"**
   - Click en el nodo
   - Verificar credencial: **"Header Auth YCloud"** (id: uvgBRxvMXP6aXlIT)
   - Click en **"Save"**

5. **Activar el workflow**:
   - Click en el botón: **"Activate"** (esquina superior derecha)
   - Verificar que aparezca un check verde ✅

6. **Verificar que se ejecuta**:
   - Click en la pestaña: **"Executions"**
   - Deberías ver una ejecución reciente (cada 5 minutos)

---

## 📋 PASO 2: Ejecutar Script SQL en PostgreSQL (15 min)

### Opción A: Usando el Script de Node.js (RECOMENDADO)

#### 2.1 Instalar dependencia pg (si no está instalada)

```bash
cd "C:\Users\Usuario\Documents\proyecto tienda\tus-aguacates"
npm install pg
```

#### 2.2 Verificar credenciales del script

**Archivo**: `scripts/implementar-escalados-v2.js`

**Abrir el archivo y verificar estas líneas**:

```javascript
const poolConfig = {
    host: 'localhost',        // Ajustar si es diferente
    port: 5432,             // Ajustar si es diferente
    database: 'tus_aguacates', // Ajustar si es diferente
    user: 'postgres',        // Ajustar si es diferente
    password: 'postgres',    // ⚠️ CAMBIAR si es diferente
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
};
```

**Si tus credenciales son diferentes**, actualiza el archivo.

#### 2.3 Ejecutar el script

```bash
cd "C:\Users\Usuario\Documents\proyecto tienda\tus-aguacates"
node scripts/implementar-escalados-v2.js
```

**Salida esperada**:

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
  • prioridad_escalado (character varying) - YES
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
  • vw_escalados_pendientes
  • vw_escalados_metricas_diarias

🎉 Sistema de escalados v2.0 implementado exitosamente!

📌 Próximos pasos:
1. Importar workflow: monitor-escalados-v2.json en n8n
2. Activar el workflow
3. Actualizar Agente Luz v6.5 con herramienta mejorada
4. Probar el sistema de escalados

✅ Script finalizado
```

**Si hay errores**, revisa la sección "Solución de Problemas" al final de este documento.

---

### Opción B: Usando pgAdmin o DBeaver

#### 2.1 Abrir la herramienta

1. **Abrir pgAdmin o DBeaver**
2. **Conectar a tu PostgreSQL**:
   - Host: `localhost` o la IP de tu servidor
   - Puerto: `5432`
   - Database: `tus_aguacates`
   - User: `postgres`
   - Password: `postgres` (o la tuya)

#### 2.2 Ejecutar el script SQL

1. **Abrir el archivo**: `tus-aguacates/n8n-workflows/scripts/sql/implementar-escalados-v2.sql`
2. **Copiar TODO el contenido** del archivo
3. **En pgAdmin/DBeaver**:
   - Click derecho en la base de datos `tus_aguacates`
   - Click en **"Query Tool"** o **"SQL Editor"**
   - Pegar el SQL copiado
   - Click en **"Execute"** (▶️ o F5)
4. **Verificar la salida**:
   - Deberías ver muchos mensajes de "CREATE TABLE", "CREATE FUNCTION", "CREATE VIEW"
   - Al final debería aparecer: "🎉 Sistema de escalados v2.0 implementado exitosamente!"

---

## 📋 PASO 3: Verificar que todo funciona (5 min)

### 3.1 Verificar columnas creadas

**Ejecutar esta query** en pgAdmin/DBeaver:

```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'clientes'
  AND column_name IN ('fecha_escalado', 'prioridad_escalado', 'motivo_escalado',
                    'atendido_por', 'fecha_atencion', 'tiempo_respuesta_minutos',
                    'resolucion', 'fecha_resolucion', 'notificado_escalado')
ORDER BY column_name;
```

**Deberías ver**:
```
column_name            | data_type                      | is_nullable
-----------------------+---------------------------------+-------------
atendido_por           | character varying              | YES
fecha_atencion         | timestamp without time zone    | YES
fecha_escalado        | timestamp without time zone    | NO
fecha_resolucion       | timestamp without time zone    | YES
motivo_escalado        | text                          | NOT NULL
notificado_escalado    | boolean                       | YES
prioridad_escalado     | character varying              | NO
resolucion             | text                          | YES
tiempo_respuesta_minutos | integer                      | YES
```

### 3.2 Verificar tablas creadas

**Ejecutar esta query**:

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_name IN ('escalados_metricas', 'escalados_log')
ORDER BY table_name;
```

**Deberías ver**:
```
table_name
---------------
escalados_log
escalados_metricas
```

### 3.3 Verificar funciones creadas

**Ejecutar esta query**:

```sql
SELECT routine_name
FROM information_schema.routines
WHERE routine_name IN ('escalar_con_prioridad', 'marcar_escalado_atendido', 'reporte_escalados')
ORDER BY routine_name;
```

**Deberías ver**:
```
routine_name
-------------------------
escalar_con_prioridad
marcar_escalado_atendido
reporte_escalados
```

### 3.4 Verificar el monitor en n8n

1. **En n8n**, ir al workflow **"🔔 Monitor Escalados v2 - Con SLA"**
2. **Click en "Executions"**
3. **Deberías ver**:
   - Una ejecución reciente
   - Sin errores
   - Duración: menos de 10 segundos

---

## 📋 PASO 4: Prueba del Sistema (10 min)

### 4.1 Probar la función de escalamiento

**En pgAdmin/DBeaver, ejecutar**:

```sql
-- Simular que un cliente se escala
SELECT * FROM escalar_con_prioridad('573001234567', 'Tengo un problema con mi pedido y estoy muy molesto');
```

**Deberías ver**:
```
telefono      | nombre | prioridad | mensaje
--------------+--------+-----------+----------
573001234567 | NULL   | urgente   | Escalado con prioridad URGENTE. Motivo: Tengo un problema con mi pedido y estoy muy molesto
```

### 4.2 Verificar que el monitor detecte el escalado

**En pgAdmin/DBeaver, ejecutar**:

```sql
SELECT * FROM vw_escalados_pendientes;
```

**Deberías ver**:
```
telefono      | nombre | prioridad | minutos_esperando | sla_minutos | sla_excedido
--------------+--------+-----------+-------------------+--------------+--------------
573001234567 | NULL   | urgente   | 0.1               | 15           | false
```

### 4.3 Verificar que el monitor envíe la notificación

1. **En n8n**, ir al workflow del monitor
2. **Esperar 5 minutos** (el monitor se ejecuta cada 5 minutos)
3. **Click en "Executions"**
4. **Deberías ver una ejecución nueva** que:
   - Buscó el cliente escalado
   - Preparó el mensaje de notificación
   - Envió el WhatsApp al 573203062007
   - Marcó el cliente como notificado

5. **Verificar tu WhatsApp**:
   - Deberías recibir un mensaje como:
   ```
   🚨 CLIENTES ESCALADOS

   🔴 URGENTE (1):
     1. *Sin nombre*
        📱 573001234567
        ⏱️ 5 min ✅
        📝 Tengo un problema con mi pedido y estoy muy molesto

   📊 RESUMEN:
   • Total: 1
   • SLA excedidos: 0
   • En tiempo: 1
   ```

---

## 🧹 LIMPIEZA

### 4.4 Deshacer la prueba

**En pgAdmin/DBeaver, ejecutar**:

```sql
-- Deshacer la prueba
UPDATE clientes
SET
    estado_conversacion = 'NUEVO',
    fecha_escalado = NULL,
    motivo_escalado = NULL,
    prioridad_escalado = NULL,
    notificado_escalado = false,
    atendido_por = NULL,
    fecha_atencion = NULL,
    tiempo_respuesta_minutos = NULL,
    resolucion = NULL,
    fecha_resolucion = NULL
WHERE telefono = '573001234567';
```

---

## ✅ CHECKLIST DE VERIFICACIÓN

Antes de continuar con la FASE 2, marca cada ítem:

- [ ] ✅ Workflow "🔔 Monitor Escalados v2 - Con SLA" importado en n8n
- [ ] ✅ Credenciales "Mi PostgreSQL Docker" configuradas en todos los nodos de BD
- [ ] ✅ Credencial "Header Auth YCloud" configurada
- [ ] ✅ Workflow activo (check verde ✅)
- [ ] ✅ Script SQL ejecutado exitosamente
- [ ] ✅ Columnas nuevas verificadas en tabla `clientes`
- [ ] ✅ Tablas nuevas (`escalados_metricas`, `escalados_log`) verificadas
- [ ] ✅ Funciones nuevas (`escalar_con_prioridad`, etc.) verificadas
- [ ] ✅ Vistas nuevas (`vw_escalados_pendientes`, etc.) verificadas
- [ ] ✅ Monitor se ejecuta cada 5 minutos (verificado en Executions)
- [ ] ✅ Prueba de escalamiento funcionó correctamente
- [ ] ✅ Notificación recibida en WhatsApp del admin
- [ ] ✅ Prueba deshecha (limpieza)

---

## 🛠️ SOLUCIÓN DE PROBLEMAS

### Error: "relation does not exist" (relación no existe)

**Causa**: La tabla `clientes` no existe o tiene otro nombre.

**Solución**:
```sql
-- Verificar qué tablas existen
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

Si la tabla no se llama `clientes`, actualiza el script SQL con el nombre correcto.

---

### Error: "column already exists" (columna ya existe)

**Causa**: Las columnas ya existen de una implementación anterior.

**Solución**:
```sql
-- Verificar columnas existentes
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'clientes'
  AND column_name IN ('fecha_escalado', 'prioridad_escalado', 'motivo_escalado');
```

Si ya existen, puedes continuar. El script SQL usa `ADD COLUMN IF NOT EXISTS`.

---

### Error: "permission denied" (permiso denegado)

**Causa**: El usuario de PostgreSQL no tiene permisos para crear tablas/columnas.

**Solución**:
```sql
-- Verificar permisos del usuario actual
SELECT current_user, has_schema_privilege('public', 'CREATE');

-- Si devuelve 'f', necesitas darle permisos:
GRANT ALL PRIVILEGES ON SCHEMA public TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO postgres;
```

---

### Error: "could not connect to server" (no se pudo conectar)

**Causa**: PostgreSQL no está corriendo o las credenciales son incorrectas.

**Solución**:
1. Verificar que PostgreSQL esté corriendo:
   - Docker Desktop: Busca el contenedor "postgres"
   - Debe estar en estado "Running"

2. Verificar credenciales:
   - Host: `localhost` (o IP del servidor)
   - Puerto: `5432`
   - Database: `tus_aguacates`
   - User: `postgres`
   - Password: `postgres` (o la tuya)

3. Probar conexión con pgAdmin o DBeaver

---

### Error: El workflow del monitor no se ejecuta

**Causa 1**: El workflow no está activo.
**Solución**: Click en "Activate" en n8n.

**Causa 2**: El nodo de schedule no está configurado.
**Solución**:
1. Click en el nodo "⏰ Cada 5 minutos"
2. Verificar que la configuración sea:
   - Interval: 5 minutes

**Causa 3**: El workflow tiene errores.
**Solución**:
1. Click en "Executions"
2. Ver el último error
3. Corregir según el mensaje de error

---

## 📌 PRÓXIMOS PASOS (Fase 2)

Una vez completada la Fase 1 y verificado en el checklist:

**Fase 2: Mejorar Escalamiento con Priorización**
- Actualizar TOOL_EscalarServicioCliente en Agente Luz v6.5
- Agregar nodo de mensaje al cliente
- Implementar lógica de priorización automática

**Fase 3: Arreglar Etiquetado de Pedidos**
- Verificar credencial de YCloud
- Arreglar TOOL_ConfirmarPedidoConEtiqueta
- Probar que etiquete correctamente

---

## 📞 CONTACTO Y SOPORTE

Si encuentras algún problema durante la implementación:

1. **Revisa la sección "Solución de Problemas" arriba**
2. **Verifica los logs de n8n** (Executions del workflow)
3. **Verifica los logs de PostgreSQL**

---

**¡Éxito con la implementación de la Fase 1! 🎉**

Una vez completada, avísame para continuar con la Fase 2.
