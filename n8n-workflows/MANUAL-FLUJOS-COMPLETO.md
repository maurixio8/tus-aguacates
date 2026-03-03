# 📚 MANUAL DE WORKFLOWS N8N - Tus Aguacates

> **Última actualización:** Febrero 2026  
> **Versión:** 1.0

---

## 📋 Índice

1. [Introducción](#introducción)
2. [Arquitectura General](#arquitectura-general)
3. [Categorías de Workflows](#categorías-de-workflows)
4. [Flujos Principales Detallados](#flujos-principales-detallados)
5. [Credenciales Requeridas](#credenciales-requeridas)
6. [Diagrama de Integraciones](#diagrama-de-integraciones)
7. [Troubleshooting Común](#troubleshooting-común)

---

## 🎯 Introducción

Este manual documenta todos los flujos de n8n que automatizan la tienda online **Tus Aguacates**. Los workflows se integran con:

- **YCloud**: Proveedor de WhatsApp
- **Supabase**: Base de datos del e-commerce
- **PostgreSQL Local**: Base de datos de n8n y WhatsApp
- **DeepSeek/OpenAI**: Modelos de IA para el agente Luz

### Propósito del Sistema

Automatizar:
- ✅ Atención al cliente por WhatsApp (Agente Luz)
- ✅ Sincronización de productos y clientes
- ✅ Procesamiento de pedidos
- ✅ Auditoría de datos
- ✅ Recordatorios de carritos abandonados

---

## 🏗️ Arquitectura General

```
┌─────────────────────────────────────────────────────────────┐
│                     YCLOUD (WhatsApp)                       │
│                  API + Webhooks                            │
└────────────────────┬───────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                    N8N (Automatización)                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │
│  │ Agente Luz   │  │ Sincronización│  │  Auditoría   │   │
│  │  (Principal) │  │   Prod/Clie  │  │   Datos      │   │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘   │
└─────────┼──────────────────┼──────────────────┼───────────┘
          │                  │                  │
          ▼                  ▼                  ▼
┌──────────────────┐  ┌──────────────┐  ┌──────────────┐
│ PostgreSQL Local │  │  Supabase    │  │ DeepSeek AI  │
│   (n8n Docker)   │  │ (E-commerce) │  │   OpenAI     │
└──────────────────┘  └──────────────┘  └──────────────┘
```

---

## 📁 Categorías de Workflows

### 1. 🤖 Atención al Cliente (WhatsApp)

| Workflow | Propósito | Estado | Frecuencia |
|----------|-----------|--------|------------|
| `🥑 Agente Luz v6.5` | Agente IA de WhatsApp principal | Activo | Webhook |
| `workflow-procesar-buffer` | Agrupa mensajes rápidos (10s) | Activo | Cada 10s |

### 2. 🔄 Sincronización de Datos

| Workflow | Propósito | Estado | Frecuencia |
|----------|-----------|--------|------------|
| `workflow-sync-productos.json` | Productos: Supabase → Local | Activo | Cada hora |
| `workflow-sync-clientes-supabase-to-local.json` | Clientes: Supabase → Local | Activo | Cada hora |
| `workflow-sync-clientes-local-to-supabase.json` | Clientes: Local → Supabase | Activo | Cada hora |
| `sync-productos-variantes-completo.json` | Productos + Variantes | Activo | Cada 30 min |

### 3. 🛒 Pedidos y Carritos

| Workflow | Propósito | Estado | Frecuencia |
|----------|-----------|--------|------------|
| `workflow-confirmar-prepedido.json` | Confirmar pre-pedido WhatsApp → Tienda | Activo | Webhook |
| `workflow-recordatorio-carritos.json` | Recordatorios de carritos abandonados | Inactivo | Cada 4h |

### 4. 📊 Auditoría y Monitoreo

| Workflow | Propósito | Estado | Frecuencia |
|----------|-----------|--------|------------|
| `workflow-audit-integrity-daily.json` | Auditoría diaria de integridad | Inactivo | Cada día 6 AM |
| `workflow-auditoria-pedidos.json` | Auditoría de precios en pedidos | Inactivo | Manual/Webhook |
| `workflow-tracking-respuestas.json` | Tracking de campañas | Activo | Webhook |

### 5. 🏷️ Etiquetado Automático

| Workflow | Propósito | Estado | Frecuencia |
|----------|-----------|--------|------------|
| `workflow-auto-etiquetar-ycloud.json` | Etiquetar contactos en YCloud | Inactivo | Cada 5 min |

---

## 🔬 Flujos Principales Detallados

### 1. 🥑 Agente Luz v6.5 - Con Herramientas Admin Copiloto

**Archivo:** `🥑 Agente Luz v6.5 - Con Herramientas Admin Copiloto (1).json`

#### Propósito
Agente de inteligencia artificial que atiende clientes por WhatsApp automáticamente. Es el corazón del sistema de atención al cliente.

#### Características Principales
- **Entrada:** Webhook de YCloud (mensajes entrantes de WhatsApp)
- **Modelo IA:** DeepSeek u OpenAI (según configuración)
- **Memoria:** Postgres Chat Memory (30 mensajes de contexto)
- **Herramientas:** Múltiples tools para interactuar con la base de datos

#### Nodos Principales

| Nodo | Función |
|------|---------|
| `📥 Webhook YCloud` | Recibe mensajes de YCloud |
| `1. Pre-procesamiento YCloud` | Detecta si es cliente o director (modo copiloto) |
| `2. Obtener Cliente` | Busca/crea cliente en PostgreSQL |
| `❓ ¿Busca Producto?` | Detecta si cliente busca productos |
| `3. Búsqueda Automática Productos` | Busca productos en PostgreSQL |
| `4. Merge Datos + Productos` | Combina datos cliente + productos |
| `🧠 Postgres Chat Memory` | Memoria de conversación |
| `🤖 Agente Luz v4` | Agente de IA principal |
| `📤 Preparar Respuesta` | Formatea respuesta de WhatsApp |
| `📱 Enviar WhatsApp YCloud` | Envía mensaje por YCloud API |

#### Herramientas del Agente (Tools)

| Herramienta | Descripción |
|-------------|-------------|
| `TOOL_AnadirAlCarrito` | Agrega producto al pre-pedido del cliente |
| `TOOL_CalcularTotalPrePedido` | Calcula total del carrito |
| `TOOL_GuardarNombreCliente` | Guarda nombre del cliente |
| `TOOL_GuardarDireccionCliente` | Guarda dirección de entrega |
| `TOOL_CambiarEstadoCliente` | Cambia estado de conversación |
| `TOOL_BuscarProductos` | Búsqueda manual de productos |
| `TOOL_ObtenerVariantes` | Obtiene variantes/presentaciones |
| `TOOL_ConsultarEstadoPedido` | Consulta estado del pedido |
| `TOOL_EscalarServicioCliente` | Escala a humano |

#### Herramientas del Copiloto (Admin)

| Herramienta | Descripción |
|-------------|-------------|
| `TOOL_ADMIN_ConsultarCliente` | Consulta datos de un cliente |
| `TOOL_ADMIN_ActualizarNombre` | Actualiza nombre de cliente |
| `TOOL_ADMIN_CambiarEstadoCliente` | Cambia estado de conversación |
| `TOOL_ADMIN_VaciarCarrito` | Vacia carrito de cliente |
| `TOOL_ListarClientesSinNombre` | Lista clientes sin nombre |
| `TOOL_ADMIN_ResumenCarritos` | Estadísticas de carritos |
| `TOOL_ADMIN_ConfirmarPedido` | Confirma pre-pedido a pedido real |

#### Estados de Conversación del Cliente

```
NUEVO
  ↓ (cliente da nombre)
NOMBRE_SOLICITADO
  ↓ (atención activa)
ATENCION_LUZ
  ↓ (cliente agrega productos)
EN_PEDIDO
  ↓ (cliente confirma)
PEDIDO_CONFIRMADO
  ↓ (o)
PEDIDO_ONLINE
  ↓ (si hay problema)
ESCALADO
```

#### Flujo de Ejecución Típico

1. **Cliente envía mensaje** → Llega a Webhook YCloud
2. **Pre-procesamiento** → Detecta si es cliente normal o director (Mauricio)
3. **Obtener Cliente** → Busca en BD o crea nuevo registro
4. **Búsqueda de productos** → Si menciona producto, busca automáticamente
5. **Agente IA** → Analiza contexto y decide qué herramienta usar
6. **Preparar respuesta** → Formatea con emojis y formato WhatsApp
7. **Enviar respuesta** → Envía por YCloud API

#### Modo Copiloto (Solo Director)

Si el número del remitente está en `['573203062007', '3203062007']`:
- Entrar en modo de administración
- Permite consultar clientes, actualizar datos, vaciar carritos
- Usa GPT-4.1-mini para comandos

#### Credenciales Requeridas

| Credencial | Descripción |
|------------|-------------|
| `Postgres account` / `Mi PostgreSQL Docker` | Base de datos local |
| `YCloud account` | API de WhatsApp |
| `OpenAi n8n` | Modelo IA para copiloto |
| `DeepSeek account 2` | Modelo IA para agente Luz |

#### Problemas Conocidos

- **Problema:** Mensajes con media no soportados
  - **Solución:** El flujo detecta y responde que solo acepta texto

- **Problema:** Memoria muy larga puede afectar respuestas
  - **Solución:** Chat memory limitado a 30 mensajes

---

### 2. ⏰ Procesador de Buffer - Mensajes Agrupados

**Archivo:** `workflow-procesar-buffer.json`

#### Propósito
Agrupa múltiples mensajes rápidos del mismo cliente en uno solo para evitar spam al agente.

#### Funcionamiento
- Ejecuta cada 10 segundos
- Busca mensajes en tabla `mensaje_buffer` sin procesar
- Agrupa mensajes con ≥30 segundos de inactividad
- Llama al webhook principal con el mensaje combinado
- Marca los mensajes como procesados

#### Nodos Principales

| Nodo | Función |
|------|---------|
| `⏰ Schedule Trigger (10s)` | Ejecuta cada 10 segundos |
| `📦 Obtener Mensajes Listos` | Consulta mensajes listos en buffer |
| `❓ ¿Hay mensajes?` | Verifica si hay mensajes pendientes |
| `📤 Preparar Payload` | Formatea para enviar a webhook principal |
| `🔗 Llamar Webhook Principal` | Envía a Agente Luz |
| `✅ Marcar Procesados` | Marca mensajes como procesados |

#### SQL Principal

```sql
WITH ultimos_mensajes AS (
    SELECT 
        cliente_telefono,
        MAX(timestamp) as ultimo_mensaje
    FROM mensaje_buffer
    WHERE procesado = false
    GROUP BY cliente_telefono
    HAVING MAX(timestamp) < NOW() - INTERVAL '30 seconds'
),
mensajes_agrupados AS (
    SELECT 
        mb.cliente_telefono,
        STRING_AGG(mb.mensaje, ' ' ORDER BY mb.timestamp) as mensaje_combinado,
        MIN(mb.timestamp) as primer_mensaje,
        MAX(mb.timestamp) as ultimo_mensaje,
        COUNT(*) as total_mensajes,
        ARRAY_AGG(mb.id ORDER BY mb.timestamp) as mensaje_ids
    FROM mensaje_buffer mb
    INNER JOIN ultimos_mensajes um ON mb.cliente_telefono = um.cliente_telefono
    WHERE mb.procesado = false
    GROUP BY mb.cliente_telefono
)
SELECT 
    cliente_telefono,
    mensaje_combinado,
    primer_mensaje,
    ultimo_mensaje,
    total_mensajes,
    mensaje_ids
FROM mensajes_agrupados
ORDER BY ultimo_mensaje ASC
LIMIT 10;
```

#### Credenciales Requeridas

| Credencial | Descripción |
|------------|-------------|
| `Mi PostgreSQL Docker` | Base de datos local |

---

### 3. 🔄 Sync Productos Supabase → Local

**Archivo:** `workflow-sync-productos.json`

#### Propósito
Sincroniza productos de Supabase (tienda online) a PostgreSQL local (n8n) cada hora.

#### Funcionamiento
1. Obtiene productos de Supabase (tabla `products`)
2. Transforma al formato local
3. Limpia tabla local `productos_tienda`
4. Inserta productos actualizados
5. Verifica total de productos activos

#### Nodos Principales

| Nodo | Función |
|------|---------|
| `⏰ Cada Hora` | Ejecuta cada hora |
| `📥 Obtener Productos Supabase` | Trae productos de Supabase |
| `🔄 Transformar Datos` | Convierte al formato local |
| `🗑️ Limpiar Tabla` | Elimina datos anteriores |
| `💾 Insertar Productos` | Inserta productos nuevos |
| `✅ Verificar Total` | Cuenta productos activos |

#### Transformación de Campos

| Campo Supabase | Campo Local | Notas |
|----------------|-------------|-------|
| `id` | `supabase_id` | UUID |
| `name` | `name` | Nombre del producto |
| `price` | `price` | Precio |
| `discount_price` | `discount_price` | Precio con descuento |
| `main_image_url` | `main_image_url` | URL de imagen |
| `category` | `category_name` | Categoría |
| `stock` | `stock` | Cantidad disponible |
| `is_active` | `is_active` | Si está activo |

#### Credenciales Requeridas

| Credencial | Descripción |
|------------|-------------|
| `Supabase account 2` | API de Supabase |
| `Mi PostgreSQL Docker` | PostgreSQL local |

---

### 4. 🔄 Sync Clientes (Bidireccional)

#### 4.1 Supabase → Local

**Archivo:** `workflow-sync-clientes-supabase-to-local.json`

**Propósito:** Trae clientes registrados en la tienda online a la base de datos local de WhatsApp.

**Funcionamiento:**
1. Obtiene clientes de Supabase (tabla `customers`)
2. Transforma formato
3. UPSERT en PostgreSQL local (no duplica)
4. Actualiza datos si ya existe (por teléfono)

**Campos sincronizados:**
- `supabase_id` (UUID de Supabase)
- `telefono` (normalizado con prefijo 57)
- `nombre`, `email`, `direccion`
- `total_pedidos`, `total_gastado`
- `is_active`

#### 4.2 Local → Supabase

**Archivo:** `workflow-sync-clientes-local-to-supabase.json`

**Propósito:** Envía clientes nuevos de WhatsApp a Supabase.

**Funcionamiento:**
1. Busca clientes sin `supabase_id` en local
2. Prepara formato para Supabase (E.164)
3. UPSERT en Supabase (tabla `customers`)
4. Vincula `supabase_id` en local

**Credenciales Requeridas:**
- `Supabase account 2`
- `Mi PostgreSQL Docker`

---

### 5. 📦 Confirmar Pre-Pedido → Supabase

**Archivo:** `workflow-confirmar-prepedido.json`

#### Propósito
Convierte un pre-pedido de WhatsApp (en carrito local) en un pedido real en la tienda online (Supabase).

#### Funcionamiento

1. **Recibe webhook** con número de teléfono
2. **Busca pre-pedido** en PostgreSQL local
3. **Verifica precios** contra catálogo actual de Supabase
4. **Corrige discrepancias** si hay
5. **Crea pedido** en Supabase (tabla `guest_orders`)
6. **Limpia carrito** local
7. **Etiqueta contacto** en YCloud
8. **Notifica admin** por WhatsApp

#### Nodos Principales

| Nodo | Función |
|------|---------|
| `🎯 Webhook Confirmar` | Recibe teléfono del cliente |
| `📥 Obtener Pre-Pedido` | Busca en PostgreSQL local |
| `🔀 ¿Tiene Pre-Pedido?` | Verifica si existe |
| `💰 Obtener Precios Supabase` | Trae catálogo actual |
| `🔍 Verificar Precios` | Compara y corrige |
| `📤 Crear en Supabase` | Crea pedido en tienda |
| `🧹 Limpiar Carrito` | Vacía carrito local |
| `🏷️ Etiquetar en YCloud` | Agrega etiqueta "CONFIRMADOS" |
| `📢 Notificar Admin` | Envia WhatsApp al admin |

#### Verificación de Precios

```javascript
// Compara cada item del carrito con precio actual
if (precioCarrito !== precioReal) {
    // Corrige al precio real
    precioFinal = precioReal;
    hayDiscrepancias = true;
}
```

#### Credenciales Requeridas

| Credencial | Descripción |
|------------|-------------|
| `Supabase account 2` | API de Supabase |
| `Mi PostgreSQL Docker` | PostgreSQL local |
| `YCloud account` | WhatsApp API |

---

### 6. 🛒 Recordatorio Carritos Abandonados

**Archivo:** `workflow-recordatorio-carritos.json`

#### Propósito
Envía recordatorios automáticos a clientes que tienen carritos abandonados por más de 2 horas.

#### Funcionamiento

1. Ejecuta cada 4 horas (9 AM, 1 PM, 5 PM, 9 PM)
2. Busca clientes con estado `EN_PEDIDO` y carrito no vacío
3. Filtra por tiempo: entre 2 y 23 horas de inactividad
4. No envía si ya se envió hoy
5. Envía mensaje interactivo con botones
6. Registra envío en `recordatorios_enviados`

#### SQL Principal

```sql
SELECT 
  c.id,
  c.telefono,
  c.nombre,
  c.pre_pedido,
  c.updated_at,
  c.estado_conversacion,
  COALESCE(
    (SELECT SUM((item->>'precio')::numeric * COALESCE((item->>'cantidad')::int, 1))
     FROM jsonb_array_elements(c.pre_pedido) AS item
    ), 0
  ) as total_carrito,
  EXTRACT(EPOCH FROM (NOW() - c.updated_at)) / 3600 as horas_inactivo
FROM clientes c
WHERE c.estado_conversacion = 'EN_PEDIDO'
  AND c.pre_pedido IS NOT NULL
  AND jsonb_array_length(c.pre_pedido) > 0
  AND c.updated_at < NOW() - INTERVAL '2 hours'
  AND c.updated_at > NOW() - INTERVAL '23 hours'
  AND NOT EXISTS (
    SELECT 1 FROM recordatorios_enviados r
    WHERE r.cliente_telefono = c.telefono
      AND r.tipo = 'carrito_abandonado'
      AND r.created_at > NOW() - INTERVAL '20 hours'
  )
ORDER BY c.updated_at DESC
LIMIT 20;
```

#### Mensaje de Recordatorio

```
Hola {nombre} 👋

¿Olvidaste algo? Vi que tienes productos en tu carrito:

{lista de productos}

💰 Total: $${total}

🚚 Si completas ahora, te llega el {proxima_entrega}

¿Qué te gustaría hacer?

[✅ Completar Pedido] [🛒 Ver Carrito] [❌ Cancelar]
```

#### Credenciales Requeridas

| Credencial | Descripción |
|------------|-------------|
| `Mi PostgreSQL Docker` | PostgreSQL local |
| `YCloud account` | WhatsApp API |

---

### 7. 🛡️ Auditoría Diaria de Integridad

**Archivo:** `workflow-audit-integrity-daily.json`

#### Propósito
Verifica la integridad de datos cada día a las 6 AM y genera alertas si hay problemas.

#### Funcionamiento

1. Ejecuta cada día a las 6 AM
2. Cuenta registros en:
   - PostgreSQL local (clientes, productos, variantes)
   - Supabase (customers, products)
3. Compara conteos
4. Detecta anomalías
5. Genera alertas si hay problemas
6. Responde con JSON del reporte

#### Nodos Principales

| Nodo | Función |
|------|---------|
| `⏰ Cada día 6:00 AM` | Trigger diario |
| `📊 Contar Registros Local` | Cuenta en PostgreSQL |
| `📊 Contar Clientes Supabase` | Cuenta en Supabase |
| `📊 Contar Productos Supabase` | Cuenta en Supabase |
| `🔍 Analizar Integridad` | Compara y detecta problemas |
| `🔀 ¿Hay Problemas?` | Verifica anomalías |
| `📤 Respuesta` | Responde con reporte |

#### Problemas Detectados

- ⚠️ 0 clientes en PostgreSQL local
- ⚠️ 0 productos en PostgreSQL local
- ⚠️ 0 variantes en PostgreSQL local

#### Credenciales Requeridas

| Credencial | Descripción |
|------------|-------------|
| `Mi PostgreSQL Docker` | PostgreSQL local |
| `Supabase account 2` | Supabase API |

---

### 8. 🔍 Auditoría de Pedidos Históricos

**Archivo:** `workflow-auditoria-pedidos.json`

#### Propósito
Analiza todos los pedidos históricos y detecta discrepancias de precios con el catálogo actual.

#### Funcionamiento

1. Obtiene todos los pedidos de Supabase
2. Obtiene catálogo actual de productos
3. Compara cada item de cada pedido
4. Detecta:
   - Productos con precios diferentes
   - Monto total de discrepancias
5. Genera reporte detallado
6. Envía reporte por WhatsApp al admin

#### Nodos Principales

| Nodo | Función |
|------|---------|
| `🎯 Iniciar Auditoría` | Webhook manual |
| `📦 Obtener Todos los Pedidos` | Supabase guest_orders |
| `💰 Obtener Catálogo Actual` | Supabase products |
| `🔍 Analizar Discrepancias` | Compara precios |
| `📢 Enviar Reporte al Admin` | WhatsApp al admin |
| `✅ Respuesta con Reporte` | Webhook response |

#### Métricas Reportadas

- Total de pedidos analizados
- Pedidos con discrepancias
- Total de discrepancias
- Monto total de diferencia (COP)

#### Credenciales Requeridas

| Credencial | Descripción |
|------------|-------------|
| `Supabase account 2` | Supabase API |
| `YCloud account` | WhatsApp API |

---

### 9. 📊 Tracking Respuestas Campaña

**Archivo:** `workflow-tracking-respuestas.json`

#### Propósito
Marca automáticamente cuando un cliente responde a una campaña de marketing.

#### Funcionamiento

1. Recibe webhook de mensaje entrante
2. Busca si el cliente tiene envío pendiente en `envios_campana`
3. Si tiene, marca como respondió
4. Guarda mensaje de respuesta
5. Timestamp de respuesta

#### SQL Principal

```sql
UPDATE envios_campana
SET 
  respondio = true,
  fecha_respuesta = NOW(),
  mensaje_respuesta = '...'
WHERE id = {envio_id}
RETURNING id, telefono, campana_id, respondio;
```

#### Credenciales Requeridas

| Credencial | Descripción |
|------------|-------------|
| `Mi PostgreSQL Docker` | PostgreSQL local |

---

### 10. 🏷️ Auto-Etiquetar YCloud por Estado

**Archivo:** `workflow-auto-etiquetar-ycloud.json`

#### Propósito
Etiqueta automáticamente contactos en YCloud según su estado de conversación.

#### Funcionamiento

1. Ejecuta cada 5 minutos
2. Busca clientes sin etiquetar
3. Mapea estado a etiqueta YCloud:
   - `PEDIDO_CONFIRMADO` → "Pre-pedido WhatsApp"
   - `PEDIDO_ONLINE` → "Pedido Tienda"
   - Otros → "Confirmado"
4. Agrega etiqueta via YCloud API
5. Marca como etiquetado en local

#### Nodos Principales

| Nodo | Función |
|------|---------|
| `⏰ Cada 5 minutos` | Trigger recurrente |
| `📋 Clientes sin etiquetar` | Busca pendientes |
| `🏷️ Etiquetar en YCloud` | Agrega etiqueta |
| `✅ Marcar como etiquetado` | Actualiza local |

#### Credenciales Requeridas

| Credencial | Descripción |
|------------|-------------|
| `Mi PostgreSQL Docker` | PostgreSQL local |
| `YCloud account` | WhatsApp API |

---

## 🔐 Credenciales Requeridas

### PostgreSQL Local

- **ID:** `R6hc0vEZJhKQSi3G`
- **Nombre:** `Mi PostgreSQL Docker`
- **Uso:** Base de datos local de n8n
- **Tablas principales:**
  - `clientes`
  - `productos_tienda`
  - `variantes_productos`
  - `mensaje_buffer`
  - `envios_campana`
  - `recordatorios_enviados`

### Supabase

- **ID:** `oFlOZEZmGLS2kaKr`
- **Nombre:** `Supabase account 2`
- **Uso:** E-commerce backend
- **Tablas principales:**
  - `products`
  - `customers`
  - `guest_orders`

### YCloud

- **ID:** `9YuNWHvIcXFwYdOX` (o `YCloudCredentials`)
- **Nombre:** `YCloud account`
- **Uso:** API de WhatsApp
- **Endpoints:**
  - `https://api.ycloud.com/v2/whatsapp/messages`
  - `https://api.ycloud.com/v2/contacts`

### OpenAI

- **ID:** `p4UlhhKKCmj1z4ji`
- **Nombre:** `OpenAi n8n`
- **Uso:** Modelo GPT-4.1-mini para Copiloto

### DeepSeek

- **ID:** `8BVSsLxHakKs5L6l`
- **Nombre:** `DeepSeek account 2`
- **Uso:** Modelo IA para Agente Luz

---

## 🔗 Diagrama de Integraciones

### Flujo de Mensajes WhatsApp

```
Cliente WhatsApp
      ↓
YCloud API (webhook)
      ↓
n8n: 📥 Webhook YCloud
      ↓
n8n: 1. Pre-procesamiento YCloud
      ↓
n8n: 2. Obtener Cliente
      ↓
n8n: 3. Búsqueda Automática Productos (opcional)
      ↓
n8n: 🧠 Postgres Chat Memory
      ↓
n8n: 🤖 Agente Luz v4 (IA)
      ├─→ TOOL_AnadirAlCarrito → PostgreSQL
      ├─→ TOOL_BuscarProductos → PostgreSQL
      ├─→ TOOL_ObtenerVariantes → PostgreSQL
      ├─→ TOOL_CalcularTotalPrePedido → PostgreSQL
      ├─→ TOOL_GuardarNombreCliente → PostgreSQL
      └─→ TOOL_CambiarEstadoCliente → PostgreSQL
      ↓
n8n: 📤 Preparar Respuesta
      ↓
n8n: 📱 Enviar WhatsApp YCloud
      ↓
Cliente WhatsApp (respuesta)
```

### Flujo de Pedido WhatsApp → Tienda

```
Cliente confirma pedido (WhatsApp)
      ↓
n8n: 🤖 Agente Luz detecta confirmación
      ↓
Admin: "Confirma el pedido"
      ↓
n8n: 🎯 Webhook Confirmar
      ↓
n8n: 📥 Obtener Pre-Pedido (PostgreSQL)
      ↓
n8n: 💰 Obtener Precios Supabase
      ↓
n8n: 🔍 Verificar Precios (comparar)
      ↓
n8n: 📤 Crear en Supabase (guest_orders)
      ↓
n8n: 🧹 Limpiar Carrito (PostgreSQL)
      ↓
n8n: 🏷️ Etiquetar en YCloud (CONFIRMADOS)
      ↓
n8n: 📢 Notificar Admin (WhatsApp)
      ↓
Admin recibe confirmación
```

### Flujo de Sincronización Productos

```
Tienda Online (Supabase)
      ↓ (cada hora)
n8n: 📥 Obtener Productos Supabase
      ↓
n8n: 🔄 Transformar Datos
      ↓
n8n: 🗑️ Limpiar Tabla (PostgreSQL)
      ↓
n8n: 💾 Insertar Productos (PostgreSQL)
      ↓
Agente Luz puede buscar productos actualizados
```

---

## 🐛 Troubleshooting Común

### Problema: Agente no responde

**Síntomas:**
- Cliente envía mensaje y no recibe respuesta
- No hay logs en n8n

**Posibles causas:**
1. Webhook de YCloud no activo
   - **Solución:** Activar workflow en n8n
   - **Verificar:** URL del webhook configurada en YCloud

2. YCloud no está enviando mensajes
   - **Solución:** Verificar configuración de webhook en YCloud Dashboard
   - **Evento:** `whatsapp.inbound_message.received`

3. Error en pre-procesamiento
   - **Solución:** Revisar logs del nodo "1. Pre-procesamiento YCloud"
   - **Verificar:** Número de teléfono está en formato correcto

---

### Problema: Cliente no encuentra productos

**Síntomas:**
- Agente dice "No encontré productos"
- Búsqueda no devuelve resultados

**Posibles causas:**
1. Sincronización de productos falló
   - **Solución:** Ejecutar manualmente "Sync Productos"
   - **Verificar:** Hay productos en `productos_tienda`

2. SQL de búsqueda tiene error
   - **Solución:** Revisar nodo "3. Búsqueda Automática Productos"
   - **Verificar:** Query SQL es correcta

3. Productos no están activos
   - **Solución:** Verificar `is_active = true` en productos
   - **Verificar:** Stock > 0

---

### Problema: Pedido no se confirma

**Síntomas:**
- Admin llama webhook confirmar-prepedido
- No se crea pedido en Supabase

**Posibles causas:**
1. Pre-pedido no existe en local
   - **Solución:** Verificar cliente tiene `pre_pedido` no vacío
   - **Verificar:** Estado del cliente es `EN_PEDIDO`

2. Diferencia de precios
   - **Solución:** Verificar si workflow corrige precios
   - **Verificar:** Catálogo de Supabase está actualizado

3. Error en Upsert Supabase
   - **Solución:** Revisar credenciales de Supabase
   - **Verificar:** Tabla `guest_orders` existe

---

### Problema: Carrito se duplica

**Síntomas:**
- Cliente tiene ítems duplicados en carrito
- Total incorrecto

**Posibles causas:**
1. Agente agrega mismo producto múltiples veces
   - **Solución:** Agregar lógica para verificar si ya existe
   - **Tool:** `TOOL_AnadirAlCarrito` debe verificar duplicados

2. Buffer agrupa mensajes incorrectamente
   - **Solución:** Ajustar tiempo de 30s en buffer
   - **Verificar:** Workflow `workflow-procesar-buffer`

---

### Problema: Recordatorios no se envían

**Síntomas:**
- Clientes con carrito abandonado no reciben recordatorio
- Workflow se ejecuta pero no envía mensajes

**Posibles causas:**
1. Workflow inactivo
   - **Solución:** Activar workflow `workflow-recordatorio-carritos`

2. Clientes no cumplen condiciones
   - **Verificar:**
     - Estado es `EN_PEDIDO`
     - Tiempo entre 2 y 23 horas
     - No se envió hoy

3. Error en YCloud API
   - **Solución:** Verificar credenciales de YCloud
   - **Verificar:** Número de teléfono es válido

---

### Problema: Sincronización de clientes falla

**Síntomas:**
- Clientes de Supabase no aparecen en local
- O viceversa

**Posibles causas:**
1. Teléfono no normalizado
   - **Solución:** Verificar formato E.164 (+57XXXXXXXXXX)
   - **Workflow:** "Sync Clientes" normaliza números

2. Conflicto en UPSERT
   - **Solución:** Verificar `ON CONFLICT (telefono)` funciona
   - **Verificar:** Índice en columna `telefono`

3. Columna `supabase_id` no existe
   - **Solución:** Ejecutar migración SQL:
     ```sql
     ALTER TABLE clientes ADD COLUMN IF NOT EXISTS supabase_id UUID;
     ```

---

## 📞 Soporte

Para problemas específicos, revisar:
1. **Logs de n8n:** Cada nodo muestra output detallado
2. **SQL:** Verificar queries en nodos de PostgreSQL
3. **Credenciales:** Verificar que todas estén configuradas
4. **Webhooks:** Verificar que estén activos en n8n

---

## 📝 Changelog

### v1.0 (Febrero 2026)
- Documentación inicial de 10 workflows principales
- Agregada arquitectura general
- Agregados diagramas de flujo
- Agregada sección de troubleshooting

---

## 🎓 Recursos Adicionales

- **Guía de instalación Agente Luz:** `README.md`
- **Guía de sync variantes:** `GUIA-SYNC-VARIANTES.md`
- **Guía de sync clientes:** `GUIA-SYNC-CLIENTES.md`
- **Guía de setup n8n:** `GUIA-SETUP-N8N-ANTIGRAVITY.md`

---

**Fin del Manual**
