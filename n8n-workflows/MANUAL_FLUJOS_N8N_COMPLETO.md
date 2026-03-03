# 🥑 Manual de Flujos n8n - Tus Aguacates
## Sistema de Automatización E-commerce + WhatsApp

---

## 📋 Índice

1. [Resumen Ejecutivo](#resumen-ejecutivo)
2. [Arquitectura del Sistema](#arquitectura-del-sistema)
3. [Categorías de Workflows](#categorías-de-workflows)
4. [Conexión con la Tienda](#conexión-con-la-tienda)
5. [Detalles por Workflow](#detalles-por-workflow)
6. [Flujo de Datos Completo](#flujo-de-datos-completo)
7. [Configuración de Credenciales](#configuración-de-credenciales)
8. [Monitoreo y Mantenimiento](#monitoreo-y-mantenimiento)
9. [Solución de Problemas](#solución-de-problemas)
10. [Script de Gestión](#script-de-gestión)

---

## Resumen Ejecutivo

Este ecosistema de **n8n** automatiza la conexión entre:
- 🛒 **Tienda Online** (Next.js + Supabase)
- 💬 **WhatsApp Business** (via YCloud)
- 🤖 **IA de Atención al Cliente** (Agente Luz)
- 📊 **Base de Datos Local** (PostgreSQL Docker)

### Cantidad de Workflows
Total de workflows en la carpeta: **45 archivos JSON**

### Propósito Principal
Automatizar todo el ciclo del cliente: desde que te contacta por WhatsApp hasta que se completa el pedido y se gestiona el post-venta.

---

## Arquitectura del Sistema

```
┌─────────────────────────────────────────────────────────────┐
│                    🛒 TIENDA ONLINE                          │
│              (tus-aguacates.vercel.app)                    │
│                   Supabase Database                         │
│         - Products, Orders, Customers, Orders_Items         │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
        ┌──────────────────────────┐
        │   🔄 Sincronización       │
        │   - Sync Productos       │
        │   - Sync Clientes        │
        └───────────┬──────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────┐
│              🤖 AGENTE LUZ (WhatsApp AI)                     │
│                    (n8n Workflow)                           │
│         - YCloud Webhook → IA DeepSeek → YCloud API          │
│  - Busca productos, agrega al carrito, confirma pedidos      │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
        ┌──────────────────────────┐
        │   💾 PostgreSQL Local    │
        │   - clientes             │
        │   - productos_tienda     │
        │   - mensaje_buffer       │
        │   - variantes_productos  │
        └──────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│              📊 AUTOMATIZACIONES DE SOPORTE                   │
│                                                              │
│  🛒 Recordatorios carritos abandonados                      │
│  📦 Confirmar pre-pedidos → Supabase                        │
│  🔍 Auditoría de pedidos históricos                         │
│  🛡️ Auditoría diaria de integridad                          │
│  🔔 Monitor de clientes escalados                           │
│  🏷️ Auto-etiquetar YCloud                                  │
│  ⏰ Procesador de buffer (mensajes agrupados)                │
│  📊 Tracking de respuestas de campañas                      │
└─────────────────────────────────────────────────────────────┘
```

---

## Categorías de Workflows

### 1. 🤖 Agente WhatsApp (Luz) - 8 Workflows
El cerebro del sistema. Atiende clientes vía WhatsApp usando IA.

| Archivo | Versión | Descripción |
|---------|---------|-------------|
| `agente-luz-v3-ycloud.json` | v3 | Versión inicial con YCloud |
| `agente-luz-v4-hibrido.json` | v4 | Versión híbrida con copiloto |
| `agente-luz-v5-con-copiloto-TEMP.json` | v5 | Integración copiloto avanzada |
| `agente-luz-v6.2-corregido.json` | v6.2 | Correcciones de bugs |
| `agente-luz-v6.3-busqueda-mejorada.json` | v6.3 | Búsqueda de productos mejorada |
| `agente-luz-v6.4-variantes-completas.json` | v6.4 | Soporte completo de variantes |
| `agente-luz-v6.5-admin-copiloto.json` | v6.5 | Herramientas de admin + copiloto |
| `Agente Luz v6.5 - Con Herramientas Admin Copiloto.json` | v6.5 | Versión final copia |
| `Copiloto de Operaciones (13).json` | - | Copiloto standalone |
| `Copiloto-Operaciones-v2-YCloud.json` | v2 | Copiloto mejorado |

**Herramientas del Agente Luz:**
- `TOOL_BuscarProductos` - Busca en catálogo
- `TOOL_BuscarConocimiento` - Info de la empresa
- `TOOL_GuardarNombreCliente` - Guarda nombre del cliente
- `TOOL_AnadirAlCarrito` - Agrega al pre-pedido
- `TOOL_CalcularTotalPrePedido` - Calcula total del carrito
- `TOOL_CambiarEstadoCliente` - Cambia estado de conversación

---

### 2. 🔄 Sincronización de Datos - 5 Workflows
Manten los datos sincronizados entre Supabase y PostgreSQL local.

| Archivo | Descripción |
|---------|-------------|
| `workflow-sync-productos.json` | Sincroniza productos de Supabase → PostgreSQL local (cada hora) |
| `workflow-sync-productos-v2.json` | Versión mejorada con variantes |
| `workflow-sync-FIXED.json` | Versión corregida |
| `workflow-sync-clientes-supabase-to-local.json` | Sincroniza clientes Supabase → Local |
| `workflow-sync-clientes-supabase-to-local-PART-2.json` | Parte 2 de la sincronización de clientes |
| `workflow-sync-clientes-local-to-supabase.json` | Sincroniza clientes Local → Supabase |
| `workflow-sync-clientes-bucle-robusto.json` | Bucle robusto de sincronización de clientes |

**Flujo de Sync Productos:**
```
⏰ Cada Hora
    ↓
📥 Obtener Productos Supabase (API REST)
    ↓
🔄 Transformar Datos (adaptar campos)
    ↓
🗑️ Limpiar Tabla (DELETE FROM productos_tienda)
    ↓
💾 Insertar Productos (INSERT)
    ↓
✅ Verificar Total (SELECT COUNT)
```

---

### 3. 📦 Automatización de Pedidos - 4 Workflows
Gestiona el flujo completo de pedidos.

| Archivo | Descripción |
|---------|-------------|
| `workflow-confirmar-prepedido.json` | Convierte pre-pedidos del chat en órdenes reales en Supabase con verificación de precios |
| `workflow-recordatorio-carritos.json` | Envia recordatorios de carritos abandonados (cada 4 horas) |
| `automation-pedidos-web.json` | Limpieza de datos de pedidos web con IA |
| `fix-web-orders-flow.js` | Script para corregir problemas de pedidos web |

**Flujo de Confirmar Pre-Pedido:**
```
🎯 Webhook (confirma pedido)
    ↓
📥 Obtener Pre-Pedido (PostgreSQL local)
    ↓
💰 Obtener Precios Supabase (verificación)
    ↓
🔍 Verificar Precios (corrige si hay discrepancia)
    ↓
📤 Crear en Supabase (guest_orders)
    ↓
🧹 Limpiar Carrito (vacía pre_pedido)
    ↓
🏷️ Etiquetar en YCloud (marca como confirmado)
    ↓
📢 Notificar Admin (WhatsApp)
    ↓
✅ Respuesta OK
```

---

### 4. 🔍 Auditoría y Monitoreo - 3 Workflows
Mantienen la salud del sistema.

| Archivo | Descripción |
|---------|-------------|
| `workflow-auditoria-pedidos.json` | Compara pedidos históricos vs catálogo actual para detectar discrepancias de precios |
| `workflow-audit-integrity-daily.json` | Auditoría diaria de integridad (6:00 AM) que cuenta registros y detecta problemas |
| `monitor-escalados-workflow.json` | Monitorea clientes escalados y notifica al admin cada 5 minutos |

**Flujo de Auditoría Diaria:**
```
⏰ Cada día 6:00 AM (o webhook manual)
    ↓
📊 Contar Registros Local (clientes, productos, variantes)
    ↓
📊 Contar Clientes Supabase
    ↓
📊 Contar Productos Supabase
    ↓
🔗 Combinar Conteos
    ↓
🔍 Analizar Integridad (detecta 0 registros)
    ↓
🔀 ¿Hay Problemas?
    ├─ Sí → 🚨 Preparar Alerta → 📤 Respuesta
    └─ No → ✅ Log OK → 📤 Respuesta
```

---

### 5. 🏷️ Gestión de Etiquetas YCloud - 2 Workflows
Etiqueta automáticamente los contactos en YCloud.

| Archivo | Descripción |
|---------|-------------|
| `workflow-auto-etiquetar-ycloud.json` | Etiqueta clientes según estado del pedido (cada 5 minutos) |
| `workflow-tracking-respuestas.json` | Trackea respuestas a campañas de marketing |

**Etiquetas aplicadas:**
- `Pre-pedido WhatsApp` - Si estado_conversacion = 'PEDIDO_CONFIRMADO'
- `Pedido Tienda` - Si estado_conversacion = 'PEDIDO_ONLINE'
- `Confirmado` - Otros estados

---

### 6. ⏰ Procesamiento de Buffer - 1 Workflow
Agrupa mensajes rápidos del mismo cliente para evitar respuestas múltiples.

| Archivo | Descripción |
|---------|-------------|
| `workflow-procesar-buffer.json` | Procesa mensajes agrupados cada 10 segundos (espera 30s de inactividad) |

**Flujo del Buffer:**
```
⏰ Schedule Trigger (cada 10s)
    ↓
📦 Obtener Mensajes Listos (con >30s inactividad)
    ↓
❓ ¿Hay mensajes?
    ├─ Sí → 📤 Preparar Payload → 🔗 Llamar Webhook Principal → ✅ Marcar Procesados
    └─ No → ⏹️ Sin mensajes
```

---

### 7. 🧠 MCP Helper - 1 Workflow
API wrapper para gestionar workflows remotamente.

| Archivo | Descripción |
|---------|-------------|
| `mcp-helper-workflow.json` | API con endpoints para listar, obtener, crear, actualizar, activar, ejecutar y auditar workflows |

**Endpoints del MCP Helper:**
- `GET /webhook/mcp-helper/list` - Listar workflows
- `GET /webhook/mcp-helper/get/{id}` - Obtener workflow
- `POST /webhook/mcp-helper/create` - Crear workflow
- `PUT /webhook/mcp-helper/update/{id}` - Actualizar workflow
- `POST /webhook/mcp-helper/activate/{id}` - Activar workflow
- `POST /webhook/mcp-helper/execute/{id}` - Ejecutar workflow
- `GET /webhook/mcp-helper/audit/{id}` - Auditar workflow

---

### 8. 📢 Marketing y Campañas - 3 Workflows
Campañas masivas de marketing.

| Archivo | Descripción |
|---------|-------------|
| `campana-500-clientes-invitatienda.json` | Campaña para 500 clientes (invitar a la tienda) |
| `campana-masiva-anti-duplicados.json` | Campaña masiva con prevención de duplicados |
| `campana-navidad-151-clientes.json` | Campaña navideña para 151 clientes |

---

### 9. 🔧 Herramientas de Soporte - Múltiples Scripts
Scripts y utilidades de desarrollo.

| Archivo | Descripción |
|---------|-------------|
| `n8n_manager.py` | Script CLI para gestionar workflows vía API |
| `antigravity_config.json` | Configuración de Antigravity |
| `env.n8n.example` | Plantilla de variables de entorno |
| `setup-database.sql` | Script de configuración de base de datos |

**Guías de configuración:**
- `GUIA-CONECTAR-N8N-SUPABASE.md` - Conectar n8n a Supabase
- `GUIA-INTEGRAR-COPILOTO.md` - Integrar copiloto en Agente Luz
- `GUIA-SYNC-WORKFLOW.md` - Workflow de sincronización
- `GUIA-MCP-HELPER.md` - MCP Helper setup
- `GUIA-SETUP-N8N-ANTIGRAVITY.md` - Configuración Antigravity

---

## Conexión con la Tienda

### Integración Tienda Online → n8n

La tienda online (Next.js + Supabase) se conecta con n8n de varias maneras:

#### 1. **Pedidos Web → n8n**
Cuando un cliente hace un pedido en la tienda web:
```javascript
// La tienda envía al webhook
POST https://tu-n8n-url/webhook/webhook-pedidos-web
{
  "cliente_nombre": "Juan Pérez",
  "direccion": "Calle 123 #45-67",
  "items": [...],
  "total": 45000
}
```

#### 2. **Pre-Pedidos WhatsApp → Supabase**
El workflow `workflow-confirmar-prepedido.json` convierte pre-pedidos del chat en órdenes:
- Lee `pre_pedido` de PostgreSQL local
- Verifica precios contra Supabase
- Crea orden en `guest_orders` (Supabase)
- Limpia el carrito local
- Etiqueta el contacto en YCloud

#### 3. **Sincronización Bidireccional**
```
Tienda Online (Supabase) ←→ n8n ←→ PostgreSQL Local
         ↓                          ↓
    Products, Orders          clientes, productos_tienda
    Customers, Orders_Items    variantes_productos
```

### Estados del Cliente en el Sistema

```
NUEVO → NOMBRE_SOLICITADO → ATENCION_LUZ → EN_PEDIDO → PEDIDO_FINALIZADO
                                    ↓
                                ESCALADO
```

---

## Detalles por Workflow

### 🤖 Agente Luz v6.5 - Con Herramientas Admin Copiloto

**Propósito:** Atención al cliente automatizada vía WhatsApp con IA.

**Componentes principales:**
1. **Webhook YCloud** - Recibe mensajes de WhatsApp
2. **Pre-procesamiento** - Limpia y estructura el mensaje
3. **Agente IA (DeepSeek)** - Procesa y genera respuestas
4. **Herramientas** - Accede a bases de datos para buscar productos, gestionar carritos
5. **Post-procesamiento** - Formatea la respuesta con timeline
6. **YCloud API** - Envía respuesta a WhatsApp

**Flujo de un mensaje:**
```
📱 Cliente envía mensaje a WhatsApp
    ↓
📥 YCloud → Webhook n8n
    ↓
🔍 Pre-procesamiento (extrae teléfono, mensaje, contexto)
    ↓
🔀 ¿Es Comando Copiloto? (solo admin)
    ├─ Sí → 🧠 Agente Copiloto (herramientas admin)
    └─ No → 🤖 Agente Luz (herramientas cliente)
    ↓
📊 Acceso a datos (PostgreSQL local + Supabase)
    ↓
📝 Generar respuesta (DeepSeek)
    ↓
🎬 Formatear timeline (text, typing, products, buttons)
    ↓
📤 Enviar a YCloud API
    ↓
📱 Cliente recibe respuesta
```

**Herramientas de Admin (Copiloto):**
- Listar clientes sin nombre
- Actualizar datos de clientes
- Contar clientes totales
- Consultar pedidos específicos

**Herramientas de Cliente (Luz):**
- Buscar productos
- Ver variantes
- Agregar al carrito
- Confirmar pedido
- Consultar información de la empresa

---

### 🔄 Sync Productos

**Propósito:** Mantener el catálogo de productos sincronizado entre Supabase y PostgreSQL local.

**Frecuencia:** Cada hora

**Ejecución:**
```bash
# Ejecutar manualmente desde n8n
1. Click en "Execute Workflow"
2. Verificar que el último nodo muestre ~345 productos
3. Activar workflow
```

**Campos sincronizados:**
- `supabase_id` - ID original en Supabase
- `name`, `slug`, `description` - Info del producto
- `price`, `discount_price` - Precios
- `category_name`, `category_id` - Categoría
- `main_image_url` - Imagen
- `stock`, `is_active`, `is_featured` - Estado
- `available_for`, `unit`, `is_organic` - Atributos
- `weight`, `min_quantity` - Detalles
- `synced_from_supabase_at` - Timestamp de sincronización

---

### 📦 Confirmar Pre-Pedido

**Propósito:** Convertir un pre-pedido del chat en una orden real en Supabase.

**Webhook:** `POST /webhook/confirmar-prepedido`

**Cuerpo de la petición:**
```json
{
  "telefono": "573001234567"
}
```

**Proceso:**
1. Busca el pre-pedido del cliente en PostgreSQL local
2. Obtiene precios actuales de Supabase
3. Verifica cada producto del carrito
   - Si el precio cambió, lo corrige
4. Calcula total verificado
5. Crea orden en `guest_orders` (Supabase)
6. Limpia el `pre_pedido` local
7. Etiqueta contacto en YCloud como "CONFIRMADOS"
8. Notifica al admin por WhatsApp

**Respuesta:**
```json
{
  "success": true,
  "order_id": "abc123",
  "total": 45000
}
```

---

### 🛒 Recordatorio Carritos Abandonados

**Propósito:** Recordar a clientes que tienen productos en el carrito sin completar.

**Frecuencia:** Cada 4 horas (9:00 AM, 1:00 PM, 5:00 PM, 9:00 PM)

**Criterios de envío:**
- `estado_conversacion = 'EN_PEDIDO'`
- `pre_pedido` tiene productos
- Inactivo por más de 2 horas
- Menos de 23 horas (ventana de WhatsApp)
- No se envió recordatorio en las últimas 20 horas

**Mensaje enviado:**
```
Hola Juan 👋

¿Olvidaste algo? Vi que tienes productos en tu carrito:

• *Aguacate Hass* x3 - $16500
• *Fresas Premium* x1 - $8500

💰 *Total: $25,000*

🚚 Si completas ahora, te llega el *Martes*

¿Qué te gustaría hacer?

[✅ Completar Pedido] [🛒 Ver Carrito] [❌ Cancelar]
```

---

### 🔍 Auditoría de Pedidos Históricos

**Propósito:** Detectar discrepancias de precios en pedidos antiguos.

**Webhook:** `POST /webhook/auditoria-pedidos`

**Proceso:**
1. Obtiene todos los pedidos de `guest_orders`
2. Obtiene catálogo actual de `products`
3. Compara cada producto del pedido vs precio actual
4. Genera reporte de discrepancias
5. Envía reporte al admin por WhatsApp

**Reporte enviado:**
```
🔔 AUDITORÍA DE PEDIDOS

Total analizados: 50
Pedidos con discrepancias: 3
Total diferencias: -$15,000

Discrepancias detectadas:
• Pedido #123: Aguacate Hass $5000 → $5500 (+$500)
• Pedido #124: Fresas Premium $8000 → $8500 (+$500)
• Pedido #125: Cerezas $19000 → $20300 (+$1300)
```

---

### 🛡️ Auditoría Diaria de Integridad

**Propósito:** Verificar que el sistema tenga datos y esté funcionando.

**Frecuencia:** Cada día a las 6:00 AM (también vía webhook manual)

**Webhook:** `POST /webhook/audit-integrity`

**Verificaciones:**
- Contar clientes en PostgreSQL local
- Contar productos en PostgreSQL local
- Contar variantes en PostgreSQL local
- Verificar acceso a Supabase (opcional)

**Alertas si:**
- 0 clientes en PostgreSQL local
- 0 productos en PostgreSQL local
- 0 variantes en PostgreSQL local

**Respuesta si todo OK:**
```json
{
  "success": true,
  "estado": "✅ SALUDABLE",
  "conteos": {
    "local": {
      "clientes": 500,
      "productos": 345,
      "variantes": 892
    }
  }
}
```

---

### 🔔 Monitor de Clientes Escalados

**Propósito:** Notificar al admin cuando hay clientes esperando atención humana.

**Frecuencia:** Cada 5 minutos

**Proceso:**
1. Busca clientes con `estado_conversacion = 'ESCALADO'`
2. Filtra los no notificados
3. Prepara mensaje con lista de clientes
4. Envía notificación a admin por WhatsApp
5. Marca como notificados en PostgreSQL

**Mensaje enviado:**
```
🚨 CLIENTES ESPERANDO ATENCIÓN

1. *María González*
   📱 573201234567
   ⏱️ 15 min esperando

2. *Carlos López*
   📱 573209876543
   ⏱️ 8 min esperando

Total: 2 cliente(s)
```

---

### 🏷️ Auto-Etiquetar YCloud

**Propósito:** Etiquetar automáticamente contactos en YCloud según estado del pedido.

**Frecuencia:** Cada 5 minutos

**Etiquetas aplicadas:**
- `Pre-pedido WhatsApp` - Si `estado_conversacion = 'PEDIDO_CONFIRMADO'`
- `Pedido Tienda` - Si `estado_conversacion = 'PEDIDO_ONLINE'`
- `Confirmado` - Otros estados

**Filtros:**
- Solo clientes modificados en las últimas 2 horas
- Solo no etiquetados previamente

---

### ⏰ Procesador de Buffer

**Propósito:** Agrupar mensajes rápidos del mismo cliente para evitar múltiples respuestas.

**Frecuencia:** Cada 10 segundos

**Lógica:**
- Busca mensajes con >30s de inactividad
- Agrupa todos los mensajes del mismo cliente
- Combina los mensajes en uno solo
- Envía al webhook principal del Agente Luz
- Marca como procesados

**Ejemplo:**
```
Cliente envía:
10:00:01 - "Hola"
10:00:02 - "Quiero"
10:00:02 - "aguacates"
10:00:35 - "¿tienen?"

El buffer espera a que no haya mensajes por 30s
10:01:00 - Combina: "Hola Quiero aguacates ¿tienen?"
10:01:00 - Envía al Agente Luz
10:01:00 - Agente Luz responde una vez
```

---

### 📊 Tracking de Respuestas de Campañas

**Propósito:** Trackear qué clientes respondieron a campañas de marketing.

**Webhook:** `POST /webhook/tracking-respuesta-campana`

**Proceso:**
1. Recibe mensaje entrante de cliente
2. Busca si tiene envío pendiente de campaña
3. Si lo encuentra, marca como respondido
4. Guarda fecha y mensaje de respuesta

---

## Flujo de Datos Completo

### Ciclo de Vida de un Pedido WhatsApp

```
1️⃣ INICIO - Cliente Contacta
┌─────────────────────────────────────────────┐
│ Cliente → WhatsApp → YCloud → n8n Webhook   │
│                                             │
│ Mensaje: "Hola, quiero aguacates"          │
└──────────────────┬──────────────────────────┘
                   ↓
2️⃣ PROCESAMIENTO - Agente Luz
┌─────────────────────────────────────────────┐
│ 🔍 Pre-procesamiento                         │
│ - Extrae teléfono: 573001234567             │
│ - Busca cliente en PostgreSQL               │
│ - Obtiene historial de conversación         │
└──────────────────┬──────────────────────────┘
                   ↓
3️⃣ BÚSQUEDA - TOOL_BuscarProductos
┌─────────────────────────────────────────────┐
│ SELECT * FROM productos_tienda              │
│ WHERE name ILIKE '%aguacate%'                │
│                                             │
│ Resultado:                                   │
│ - Aguacate Hass ($5500)                      │
│ - Aguacate Fuerte ($5000)                    │
│ - Aguacate Criollo ($4500)                   │
└──────────────────┬──────────────────────────┘
                   ↓
4️⃣ RESPUESTA - IA Genera Timeline
┌─────────────────────────────────────────────┐
│ timeline: [                                  │
│   { type: "text", content: "¡Hola!..." },   │
│   { type: "products", items: [...] },      │
│   { type: "options", options: [...] }      │
│ ]                                           │
└──────────────────┬──────────────────────────┘
                   ↓
5️⃣ ADD TO CART - TOOL_AnadirAlCarrito
┌─────────────────────────────────────────────┐
│ UPDATE clientes                             │
│ SET pre_pedido = pre_pedido || '...'       │
│ WHERE telefono = '573001234567'            │
│                                             │
│ Carrito actual:                              │
│ [                                           │
│   { producto_id: 1, nombre: "Aguacate...", │
│     precio: 5500, cantidad: 3 },            │
│   { producto_id: 45, nombre: "Fresas...",  │
│     precio: 8500, cantidad: 1 }             │
│ ]                                           │
└──────────────────┬──────────────────────────┘
                   ↓
6️⃣ CONFIRMACIÓN - Cliente Responde "Confirmar"
┌─────────────────────────────────────────────┐
│ Cliente → WhatsApp → n8n                    │
│                                             │
│ Mensaje: "Confirmar"                        │
└──────────────────┬──────────────────────────┘
                   ↓
7️⃣ PROCESAR PEDIDO - workflow-confirmar-prepedido
┌─────────────────────────────────────────────┐
│ 1. Buscar pre_pedido en PostgreSQL           │
│ 2. Obtener precios actuales de Supabase      │
│ 3. Verificar precios (corregir si necesario)  │
│ 4. Calcular total: $25000                    │
│ 5. Crear orden en guest_orders (Supabase)    │
│ 6. Limpiar pre_pedido                        │
│ 7. Etiquetar en YCloud                       │
│ 8. Notificar admin                           │
└──────────────────┬──────────────────────────┘
                   ↓
8️⃣ FIN - Pedido Creado
┌─────────────────────────────────────────────┐
│ ✅ Pedido creado en Supabase                 │
│ 🆔 Order ID: guest_orders_abc123             │
│ 💰 Total: $25000                             │
│ 🏷️ Etiqueta: "CONFIRMADOS"                  │
│ 📢 Admin notificado por WhatsApp            │
└─────────────────────────────────────────────┘

9️⃣ MONITOREO - workflows activos
┌─────────────────────────────────────────────┐
│ • 🏷️ Auto-Etiquetar YCloud (cada 5 min)     │
│ • 🛒 Recordatorio Carritos (cada 4 horas)    │
│ • 🛡️ Auditoría Diaria (6:00 AM)              │
│ • 🔔 Monitor Escalados (cada 5 min)         │
└─────────────────────────────────────────────┘
```

---

## Configuración de Credenciales

### Credenciales Requeridas

| Credencial | Tipo | Uso |
|------------|------|-----|
| **PostgreSQL Docker** | n8n-nodes-base.postgres | Base de datos local (clientes, productos_tienda) |
| **Supabase account 2** | n8n-nodes-base.supabase | Tienda online (products, guest_orders) |
| **YCloud account** | httpRequest | API de WhatsApp |
| **DeepSeek account 2** | AI Agent | LLM para Agente Luz |
| **Header Auth YCloud** | httpHeaderAuth | Autenticación YCloud alternativa |
| **N8N API Key** | httpHeaderAuth | API pública de n8n |

### Configuración de Variables de Entorno

Crea archivo `tus-aguacates/n8n-workflows/.env.n8n`:

```env
# n8n API
N8N_BASE_URL=https://dep-n8n.n8ntusaguacates.space
N8N_API_KEY=tu-api-key-aqui

# Supabase
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_ANON_KEY=tu-anon-key
SUPABASE_SERVICE_KEY=tu-service-key

# PostgreSQL Local
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=tus_aguacates
POSTGRES_USER=postgres
POSTGRES_PASSWORD=tu-password

# YCloud
YCLOUD_API_KEY=tu-api-key-ycloud

# DeepSeek
DEEPSEEK_API_KEY=tu-api-key-deepseek
```

### Conectar Supabase en n8n

1. Ve a **Credentials** → **Add Credential**
2. Busca **Supabase**
3. Configura:
   ```
   API URL: https://tu-proyecto.supabase.co
   API Key: tu-anon-key
   ```
4. Nómbrala: "Supabase account 2"

### Conectar YCloud en n8n

1. Ve a **Credentials** → **Add Credential**
2. Busca **HTTP Header Auth**
3. Configura:
   ```
   Name: YCloud API Key
   Header Name: X-API-Key
   Header Value: tu-api-key-ycloud
   ```

---

## Monitoreo y Mantenimiento

### Workflows que Deben Estar Activos

| Workflow | Frecuencia | Prioridad |
|----------|-------------|-----------|
| Agente Luz v6.5 | On-demand (webhook) | 🔴 CRÍTICO |
| Sync Productos | Cada hora | 🟡 ALTA |
| Confirmar Pre-Pedido | On-demand (webhook) | 🔴 CRÍTICO |
| Recordatorio Carritos | Cada 4 horas | 🟡 ALTA |
| Auditoría Diaria | Cada día 6:00 AM | 🟢 MEDIA |
| Monitor Escalados | Cada 5 minutos | 🟡 ALTA |
| Auto-Etiquetar YCloud | Cada 5 minutos | 🟢 MEDIA |
| Procesador Buffer | Cada 10 segundos | 🔴 CRÍTICO |

### Dashboard de Monitoreo

Verifica estos KPIs regularmente:

```
📊 KPIs de Salud del Sistema
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🤖 Agente Luz
├─ Mensajes procesados hoy: [X]
├─ Tiempo de respuesta promedio: [X]s
├─ Escalados hoy: [X]
└─ Tasa de éxito: [X]%

📦 Pedidos
├─ Pedidos WhatsApp hoy: [X]
├─ Pedidos Web hoy: [X]
├─ Conversión carrito → pedido: [X]%
└─ Tickets promedio: $[X]

💾 Datos
├─ Clientes totales: [X]
├─ Productos activos: [X]
├─ Variantes: [X]
└─ Última sync: [X]

🚢 Sincronización
├─ Último sync productos: [X]h
├─ Último sync clientes: [X]h
└─ Discrepancias detectadas: [X]
```

### Logs Importantes

En la consola de n8n, monitorea:

1. **Errores de conexión** - Si hay fallas en Supabase o PostgreSQL
2. **Timeouts** - Si el Agente Luz tarda más de 10s
3. **Discrepancias de precios** - Si se detectan precios incorrectos
4. **Escalados sin atender** - Si hay clientes esperando >30 min

---

## Solución de Problemas

### Problema: Agente Luz no responde

**Diagnóstico:**
1. ¿El workflow está activo?
2. ¿El webhook de YCloud está configurado correctamente?
3. ¿Las credenciales de DeepSeek funcionan?

**Solución:**
```bash
# 1. Verificar workflow activo
# En n8n: Check toggle "Active"

# 2. Verificar webhook URL
# En n8n: Click en nodo Webhook → Copy Test URL
# En YCloud Dashboard: Verify webhook URL matches

# 3. Test credenciales DeepSeek
# En n8n: Credentials → DeepSeek account 2 → Test
```

### Problema: Productos desactualizados en Agente Luz

**Diagnóstico:**
1. ¿El workflow Sync Productos está activo?
2. ¿Cuándo fue la última ejecución exitosa?
3. ¿Hay errores en el nodo "Obtener Productos Supabase"?

**Solución:**
```bash
# 1. Ejecutar manualmente workflow Sync Productos
# En n8n: workflow-sync-productos.json → Execute Workflow

# 2. Verificar resultado
# El último nodo debería mostrar ~345 productos

# 3. Si hay errores, revisar credenciales Supabase
```

### Problema: Pre-pedidos no se convierten en órdenes

**Diagnóstico:**
1. ¿El workflow Confirmar Pre-Pedido está activo?
2. ¿El webhook está recibiendo peticiones?
3. ¿Hay errores en el nodo "Verificar Precios"?

**Solución:**
```bash
# 1. Test webhook manualmente
curl -X POST https://tu-n8n-url/webhook/confirmar-prepedido \
  -H "Content-Type: application/json" \
  -d '{"telefono": "573001234567"}'

# 2. Revisar logs en n8n
# Buscar errores en nodos: Pre-Pedido, Verificar Precios, Crear Supabase

# 3. Verificar que el cliente tiene pre_pedido
# En PostgreSQL: SELECT pre_pedido FROM clientes WHERE telefono = '...';
```

### Problema: Recordatorios no se envían

**Diagnóstico:**
1. ¿El workflow Recordatorio Carritos está activo?
2. ¿Hay clientes que cumplen los criterios?
3. ¿Hay errores en el nodo "Enviar WhatsApp"?

**Solución:**
```bash
# 1. Test query SQL manualmente
SELECT
  c.id, c.telefono, c.nombre,
  EXTRACT(EPOCH FROM (NOW() - c.updated_at))/3600 as horas_inactivo
FROM clientes c
WHERE c.estado_conversacion = 'EN_PEDIDO'
  AND c.pre_pedido IS NOT NULL
  AND c.updated_at < NOW() - INTERVAL '2 hours'
LIMIT 5;

# 2. Si hay resultados, ejecutar workflow manualmente
# En n8n: workflow-recordatorio-carritos.json → Execute Workflow

# 3. Revisar credenciales YCloud
```

### Problema: Auditoría detecta 0 productos

**Diagnóstico:**
1. ¿El workflow Sync Productos se ejecutó recientemente?
2. ¿Hay errores de conexión a Supabase?
3. ¿La tabla productos_tienda está vacía?

**Solución:**
```bash
# 1. Ejecutar workflow Sync Productos manualmente
# En n8n: workflow-sync-productos.json → Execute Workflow

# 2. Verificar resultado
# El nodo "Verificar Total" debe mostrar count > 0

# 3. Si sigue vacío, revisar credenciales Supabase
# En n8n: Credentials → Supabase account 2 → Test
```

---

## Script de Gestión

### n8n_manager.py

Script CLI para gestionar workflows vía API.

**Uso:**
```bash
cd tus-aguacates/scripts
python n8n_manager.py list                        # Lista todos los workflows
python n8n_manager.py get <workflow-id>          # Obtiene JSON de un workflow
python n8n_manager.py create <file.json>         # Crea workflow desde archivo
python n8n_manager.py update <id> <file.json>    # Actualiza workflow existente
python n8n_manager.py activate <id>              # Activa un workflow
python n8n_manager.py deactivate <id>            # Desactiva un workflow
python n8n_manager.py delete <id>                # Elimina un workflow
python n8n_manager.py run_webhook <url> [data]   # Ejecuta vía webhook
python n8n_manager.py audit <id>                 # Audita lógica del workflow
python n8n_manager.py export <id> <output.json>  # Exporta workflow a archivo
```

**Ejemplos:**
```bash
# Listar workflows activos
python n8n_manager.py list | grep "🟢"

# Auditar Agente Luz
python n8n_manager.py audit agente-luz-v6.5-id

# Activar workflow de sync
python n8n_manager.py activate workflow-sync-productos-id
```

**Output de auditoría:**
```
🔍 Auditoría: Agente Luz v6.5

   ID: abc123
   Estado: 🟢 Activo
   Total nodos: 45

📊 Tipos de nodos:
   • n8n-nodes-base.webhook: 1
   • n8n-nodes-base.code: 12
   • @n8n/n8n-nodes-langchain.chainLlm: 1
   • n8n-nodes-base.postgres: 8
   • n8n-nodes-base.httpRequest: 3

🎯 Triggers (1):
   • Webhook YCloud (n8n-nodes-base.webhook)

🤖 Nodos AI (1):
   • Agente Luz (@n8n/n8n-nodes-langchain.chainLlm)

💾 Nodos de BD (8):
   • TOOL_BuscarProductos (n8n-nodes-base.postgres)
   • TOOL_AnadirAlCarrito (n8n-nodes-base.postgres)
   ...

💡 Recomendaciones:
   • Considera agregar persistencia para conversaciones.
```

---

## 📚 Recursos Adicionales

### Documentación en la Carpeta

- `README.md` - Guía del Agente Luz v3
- `GUIA-CONECTAR-N8N-SUPABASE.md` - Conexión n8n ↔ Supabase
- `GUIA-INTEGRAR-COPILOTO.md` - Integrar Copiloto de Operaciones
- `GUIA-SYNC-WORKFLOW.md` - Configurar workflow de sincronización
- `GUIA-MCP-HELPER.md` - Configurar MCP Helper
- `GUIA-SETUP-N8N-ANTIGRAVITY.md` - Setup de Antigravity

### Archivos SQL

- `setup-database.sql` - Configuración inicial de BD
- `supabase-search-function.sql` - Función de búsqueda Supabase
- `query-busqueda-supabase.sql` - Query de búsqueda flexible
- `tool-buscar-productos-supabase.sql` - Tool de búsqueda de productos

### Scripts de Soporte

- `n8n_manager.py` - Gestión CLI de workflows
- `sync-productos-to-postgres.js` - Script de sync
- `procesar-csv-clientes.js` - Procesar CSV de clientes

---

## 🔐 Seguridad

### Buenas Prácticas

1. **Nunca commitear credenciales** - Usa `.env.n8n` y `.gitignore`
2. **Usar API Keys separadas** - No uses la service key de Supabase en n8n
3. **Limitar permisos** - Las credenciales de PostgreSQL deben ser de solo lectura cuando sea posible
4. **Logs sensibles** - No logear información personal de clientes
5. **HTTPS siempre** - Asegúrate que todos los webhooks usen HTTPS

### Archivos `.gitignore`

```gitignore
# Credenciales
.env.n8n
.env.local

# Logs
*.log

# Archivos temporales
*.tmp
```

---

## 🎯 Próximos Pasos

Para un nuevo desarrollador que entre al proyecto:

1. **Leer este manual** 📖
2. **Configurar variables de entorno** (.env.n8n)
3. **Importar workflows en n8n** (prioridad: Agente Luz, Sync Productos, Confirmar Pre-Pedido)
4. **Configurar credenciales** (Supabase, YCloud, DeepSeek, PostgreSQL)
5. **Testear Agente Luz** (enviar mensaje de prueba a WhatsApp)
6. **Activar workflows críticos** (marcar toggle Active)
7. **Configurar webhooks en YCloud** (apuntar a URL de n8n)
8. **Verificar sincronización** (ejecutar Sync Productos manualmente)
9. **Testear flujo completo** (desde contacto hasta pedido)
10. **Configurar monitoreo** (check dashboard de n8n diariamente)

---

## 📞 Soporte

Si tienes problemas:

1. Revisa los **logs en n8n** (Execution History)
2. Ejecuta `python n8n_manager.py audit <workflow-id>` para diagnósticos
3. Consulta las **guías en la carpeta** `n8n-workflows/`
4. Verifica que **todas las credenciales** están configuradas correctamente

---

**Versión:** 1.0
**Última actualización:** Febrero 2026
**Autores:** Equipo Tus Aguacates

---

🥑 **Tus Aguacates** - De la plaza a tu casa 🚚
