# 🗺️ DIAGRAMA DE CONECTIVIDAD - SISTEMA N8N TUS AGUACATES

**Fecha**: Febrero 2026  
**Versión**: 2.0  

---

## 📐 VISIÓN GENERAL

```
┌─────────────────────────────────────────────────────────────────┐
│                        TUS AGUACATES                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                    CLIENTE WHATSAPP                        │ │
│  └────────────────────┬───────────────────────────────────────┘ │
│                       ↓                                        │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                     YCloud API                              │ │
│  │  https://api.ycloud.com/v2/whatsapp/messages                │ │
│  │                                                             │ │
│  │  - Webhook Entrada                                          │ │
│  │  - API Send                                                 │ │
│  └────────────┬───────────────────────────────────────────────┘ │
│               ↓                                                │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                     N8N API                                 │ │
│  │  https://dep-n8n.n8ntusaguacates.space                      │ │
│  │                                                             │ │
│  │  - Webhook: /webhook/ycloud                                 │ │
│  │  - 46 Workflows                                              │ │
│  │  - 9 Activo                                                 │ │
│  └────────────┬───────────────────────────────────────────────┘ │
│               ↓                                                │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                   6 WORKFLOWS CRÍTICOS                      │ │
│  │                                                              │ │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐                  │ │
│  │  │ Agente   │  │ Sync     │  │ Confirm  │                  │ │
│  │  │ Luz v6.5 │→ │ Clientes │→ │ Pedido   │                  │ │
│  │  └──────────┘  └──────────┘  └──────────┘                  │ │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐                  │ │
│  │  │ Audit.   │  │ Recordar.|  │ Buffer   │                  │ │
│  │  │ Diario   │  │ Carritos │  │ Procesar │                  │ │
│  │  └──────────┘  └──────────┘  └──────────┘                  │ │
│  └────────────────────────────────────────────────────────────┘ │
│               ↓                                                │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                    4 SERVICIOS INTEGRADOS                   │ │
│  │                                                              │ │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐            │ │
│  │  │  SUPABASE  │  │   SUPABASE  │  │ POSTGRESQL │            │ │
│  │  │   Cuenta 1 │  │   Cuenta 2 │  │  (Docker)  │            │ │
│  │  │ - Productos│  │ - Clientes │  │ - Agente  │            │ │
│  │  │ - Variantes│  │ - Mensajes │  │ - Carritos │            │ │
│  │  │ - Imágenes │  │ - RPC      │  │ - Logs    │            │ │
│  │  └────────────┘  └────────────┘  └────────────┘            │ │
│  │                                                              │ │
│  │  ┌────────────┐  ┌────────────┐                            │ │
│  │  │  OPENAI    │  │  DEEPSEEK  │                            │ │
│  │  │ gpt-4.1    │  │ Search     │                            │ │
│  │  │ - Conversa │  │ - Prod.    │                            │ │
│  │  │ - Agent    │  │ - Preproc  │                            │ │
│  │  └────────────┘  └────────────┘                            │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📊 Diagrama General

```
┌─────────────────────────────────────────────────────────────────────┐
│                        TIENDA EN LÍNEA (Vercel)                     │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                     WEBHOOK ENDPOINTS                          │   │
│  ├──────────────────────────────────────────────────────────────┤   │
│  │                                                                │   │
│  │  1️⃣  /api/webhooks/confirmar-prepedido                        │   │
│  │     ↳ Disparado por: Agente Luz (WhatsApp)                     │   │
│  │     ↳ Destino: workflow-confirmar-prepedido.json               │   │
│  │     ↳ Acción: Crea pedido en Supabase                          │   │
│  │                                                                │   │
│  │  2️⃣  /api/webhooks/webhook-pedidos-web                        │   │
│  │     ↳ Disparado por: Checkout Completado                       │   │
│  │     ↳ Destino: automation-pedidos-web.json                     │   │
│  │     ↳ Acción: Limpieza IA + Notificación al equipo              │   │
│  │                                                                │   │
│  │  3️⃣  /api/webhooks/n8n-order-sync                              │   │
│  │     ↳ Disparado por: Checkout Completado                       │   │
│  │     ↳ Destino: Flujo n8n (configurable)                        │   │
│  │     ↳ Acción: Proxy a n8n (fire-and-forget)                    │   │
│  │                                                                │   │
│  └──────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
                            ↕ HTTPS
                            HTTPS
                            HTTPS
┌─────────────────────────────────────────────────────────────────────┐
│                        N8N (Instalación Local)                      │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                   WEBHOOK NODES                                │   │
│  ├──────────────────────────────────────────────────────────────┤   │
│  │                                                                │   │
│  │  📥 Webhook YCloud                                            │   │
│  │  ID: tus-aguacates-ycloud-v4                                   │   │
│  │  Path: /ycloud                                                │   │
│  │  Acción: Recibe mensajes de WhatsApp                           │   │
│  │  Flujo: Agente-Luz-v6-Mejorado.json                           │   │
│  │                                                                │   │
│  │  🎯 Webhook Confirmar Pre-Pedido                             │   │
│  │  ID: confirmar-prepedido                                      │   │
│  │  Path: /confirmar-prepedido                                    │   │
│  │  Acción: Confirma y crea pedido en Supabase                   │   │
│  │  Flujo: workflow-confirmar-prepedido.json                     │   │
│  │                                                                │   │
│  │  📝 Webhook Pedido Web                                        │   │
│  │  ID: webhook-pedidos-web                                      │   │
│  │  Path: /webhook-pedidos-web                                    │   │
│  │  Acción: Procesa pedidos web con IA                           │   │
│  │  Flujo: automation-pedidos-web.json                           │   │
│  │                                                                │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                   DATABASE NODES                               │   │
│  ├──────────────────────────────────────────────────────────────┤   │
│  │                                                                │   │
│  │  📥 Supabase (Products & Customers)                            │   │
│  │  Credencial: Supabase account 2                                │   │
│  │  Tablas: products, customers, orders                           │   │
│  │  Flujo: workflow-sync-clientes-supabase-to-local.json         │   │
│  │                                                                │   │
│  │  💾 PostgreSQL Local (productos_tienda, clientes)             │   │
│  │  Credencial: Mi PostgreSQL Docker                             │   │
│  │  Tablas: productos_tienda, clientes, recordatorios_enviados  │   │
│  │  Flujo: workflow-sync-clientes-supabase-to-local.json         │   │
│  │                                                                │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                   EXTERNAL SERVICES                            │   │
│  ├──────────────────────────────────────────────────────────────┤   │
│  │                                                                │   │
│  │  📱 YCloud API                                                │   │
│  │  Método: HTTP Header Auth                                      │   │
│  │  Header: X-API-Key                                            │   │
│  │  URL: https://api.ycloud.com/v2/whatsapp/messages              │   │
│  │  Flujo: Agente-Luz-v6-Mejorado.json                           │   │
│  │                                                                │   │
│  │  🤖 DeepSeek IA                                                │   │
│  │  Modelo: DeepSeek                                              │   │
│  │  URL: https://api.deepseek.com/v1                             │   │
│  │  Flujo: Agente-Luz-v6-Mejorado.json                           │   │
│  │                                                                │   │
│  │  🧠 GPT-4o-mini IA                                             │   │
│  │  Modelo: gpt-4o-mini                                           │   │
│  │  URL: https://api.openai.com/v1                               │   │
│  │  Flujo: automation-pedidos-web.json                           │   │
│  │                                                                │   │
│  └──────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 🔗 Cadenas de Conexión

### 📱 Cadenas de Atención al Cliente

```
1. Cliente (WhatsApp)
    ↓
2. Webhook YCloud (/ycloud)
    ↓
3. Agente-Luz v6.5 (n8n)
    ├─> Pre-procesamiento YCloud
    ├─> DeepSeek IA
    ├─> Ejecutar Herramientas
    │   ├─> TOOL_BuscarProductos (Supabase)
    │   ├─> TOOL_AnadirAlCarrito (PostgreSQL)
    │   └─> TOOL_CalcularTotalPrePedido (PostgreSQL)
    ├─> FORMATEAR RESPUESTA (para cliente)
    └─> YCloud API (enviar respuesta)
    ↓
4. Cliente (WhatsApp - respuesta)
```

---

### 📦 Cadenas de Pedidos Web

```
1. Cliente (Web - Checkout completado)
   ↓
2. Endpoint: /api/webhooks/webhook-pedidos-web
   ↓
3. automation-pedidos-web.json (n8n)
   ├─> GPT-4o-mini IA (limpieza de datos)
   │   ├─> cliente_nombre_corregido
   │   ├─> direccion_formateada
   │   ├─> resumen_pedido_limpio
   │   ├─> alerta_posible_fraude
   │   └─> mensaje_equipo
   ├─> FORMATEAR NOTIFICACIÓN (Markdown)
   └─> NOTIFICAR AL EQUIPO (Slack/Telegram/WhatsApp)
   ↓
4. Equipo de despacho (notificación)
```

---

### 🔄 Cadenas de Sincronización

#### Clientes: Supabase → Local

```
1. Schedule Trigger (cada hora)
   ↓
2. workflow-sync-clientes-supabase-to-local.json (n8n)
   ├─> 📥 Obtener Clientes Supabase (2000 items)
   ├─> 🔄 Transformar Clientes
   │   ├─> Normalizar teléfono (57 + 10 dígitos)
   │   ├─> Extraer datos (nombre, email, dirección, ciudad, totales)
   │   └─> Guardar en memoria estática
   ├─> 📤 Preparar para UPSERT
   └─> 💾 UPSERT Cliente (ON CONFLICT telefono)
       ├─> Crear nuevo cliente
       └─> Actualizar cliente existente
   ↓
3. Verificar Sincronización (conteo y estado)
```

#### Productos: Supabase → Local

```
1. Schedule Trigger (cada hora)
   ↓
2. workflow-sync-productos.json (n8n)
   ├─> 📥 Obtener Productos Supabase (500 items)
   ├─> 🔄 Transformar Datos
   │   ├─> Mapear campos (supabase_id, name, slug, price, etc.)
   │   └─> Normalizar categorías
   ├─> 🗑️ Limpiar Tabla (DELETE FROM productos_tienda)
   └─> 💾 Insertar Productos
   ↓
3. Verificar Total (contar productos activos)
```

---

### 🎯 Cadenas de Confirmación de Pre-Pedido

```
1. Cliente (WhatsApp - envía pedido)
   ↓
2. Webhook YCloud (/ycloud)
   ↓
3. Agente-Luz-v6-Mejorado.json (n8n)
   ├─> Pre-procesamiento YCloud
   ├─> DeepSeek IA
   ├─> Procesar comando del cliente
   └─> 🎯 Lanzar Webhook Confirmar Pre-Pedido
       ↓
4. workflow-confirmar-prepedido.json (n8n)
   ├─> 📥 Obtener Pre-Pedido (por teléfono)
   ├─> 🔀 ¿Tiene Pre-Pedido?
   ├─> 📋 Obtener Productos de Supabase (por nombres)
   ├─> 🔀 ¿Los productos coinciden?
   │   ├─> SÍ → 💾 Crear Pedido en Supabase
   │   └─> NO → Notificar error al cliente
   └─> ✅ Respuesta al cliente
   ↓
5. Cliente (WhatsApp - confirmación)
```

---

### 📢 Cadenas de Marketing

```
1. Campaña Activada
   ↓
2. flujo de campaña (ej: campana-navidad-151-clientes.json)
   ├─> 📥 Obtener clientes objetivo
   ├─> 📧 Procesar datos
   ├─> 📱 Enviar a YCloud (WhatsApp)
   └─> 💾 Registrar envíos
   ↓
3. Clientes (reciben mensajes personalizados)
```

---

### 🔄 Cadenas de Recordatorios

```
1. Schedule Trigger (4x/día: 9:00, 13:00, 17:00, 21:00)
   ↓
2. workflow-recordatorio-carritos.json (n8n)
   ├─> 🔍 Buscar Carritos Abandonados
   │   ├─> estado_conversacion = 'EN_PEDIDO'
   │   ├─> pre_pedido IS NOT NULL
   │   ├─> > 2 horas inactivo
   │   ├─> < 23 horas inactivo
   │   └─> no enviado hoy
   ├─> 📧 Formatear Recordatorio (Markdown)
   └─> 📱 Enviar a YCloud (WhatsApp)
   ↓
3. Clientes (reciben recordatorios)
```

---

## 📊 Mapa de Dependencias

### Flujo Principal (Agente Luz)

```
Agente-Luz-v6-Mejorado.json
├── Disparador: Webhook YCloud
├── Dependencias:
│   ├── YCloud API (enviar/recepción mensajes)
│   ├── DeepSeek IA (respuestas)
│   ├── Supabase (consultar productos)
│   └── PostgreSQL (cliente, carrito, estado)
└── Llama a:
    ├── workflow-confirmar-prepedido.json (webhook)
    └── automation-pedidos-web.json (por error o integración)
```

---

### Flujo de Pedidos Web

```
automation-pedidos-web.json
├── Disparador: Webhook Pedido Web
├── Dependencias:
│   ├── GPT-4o-mini IA (limpieza de datos)
│   └── Sistema de notificación (Slack/Telegram/WhatsApp)
└── No depende de otros flujos
```

---

### Flujo de Sincronización

```
workflow-sync-clientes-supabase-to-local.json
├── Disparador: Schedule Trigger (cada hora)
├── Dependencias:
│   ├── Supabase (obtener clientes)
│   └── PostgreSQL Local (guardar clientes)
└── No depende de otros flujos
```

---

## 🔑 API Keys y Credenciales

### YCloud
- **Header**: `X-API-Key`
- **Base URL**: `https://api.ycloud.com/v2/whatsapp/messages`

### Supabase (2 Instancias)
- **Instancia 1 (Tienda Web)**:
  - **ID**: `oFlOZEZmGLS2kaKr` (comentado)
  - **Tablas**: `products`, `variants`, `images`, `shipping_plans`
  - **Credencial n8n**: `Supabase account 2`

- **Instancia 2 (Clientes y Mensajes)**:
  - **Credencial n8n**: `Supabase account 2`
  - **Tablas**: `customers`, `orders`, `messages`
  - **RPC Functions**: `search_products(term)`, `get_client_history(phone)`

### PostgreSQL Docker
- **ID**: `R6hc0vEZJhKQSi3G`
- **Tablas**: `clientes`, `pre_pedidos`, `agent_logs`, `cart_reminders`
- **Credencial n8n**: `Mi PostgreSQL Docker`

### DeepSeek
- **ID**: `8BVSsLxHakKs5L6l`
- **Model**: `DeepSeek`
- **URL**: `https://api.deepseek.com/v1`

### OpenAI
- **Model**: `gpt-4.1-mini`
- **ID**: `8BVSsLxHakKs5L6l`
- **URL**: `https://api.openai.com/v1`

### n8n
- **URL**: `https://dep-n8n.n8ntusaguacates.space`
- **Webhook Principal**: `/webhook/ycloud`

---

## 🚦 Estados de Flujo

### Webhooks Activos

| Webhook | Flujo n8n | Estado | Uso | Prioridad |
|---------|-----------|--------|-----|-----------|
| `/webhook/ycloud` | Agente Luz v6.5 | ✅ Activo | Atención al cliente WhatsApp | 🔴 CRÍTICO |
| `/confirmar-prepedido` | workflow-confirmar-prepedido.json | ✅ Activo | Confirmación de pedidos | 🔴 CRÍTICO |
| `/webhook-pedidos-web` | automation-pedidos-web.json | ✅ Activo | Pedidos web | 🟡 MEDIA |

### Flujos Activos (9)

| Flujo | Estado | Frecuencia | Prioridad |
|-------|--------|------------|-----------|
| Agente Luz v6.5 | ✅ Activo | Continuo | 🔴 CRÍTICO |
| workflow-sync-clientes-supabase-to-local | ✅ Activo | Hourly | 🔴 CRÍTICO |
| workflow-confirmar-prepedido | ✅ Activo | Continuo | 🔴 CRÍTICO |
| workflow-audit-integrity-daily | ✅ Activo | Diario (6 AM) | 🔴 CRÍTICO |
| workflow-recordatorio-carritos | ✅ Activo | 4x/día | 🔴 CRÍTICO |
| workflow-procesar-buffer | ✅ Activo | 10s interval | 🔴 CRÍTICO |
| workflow-auto-etiquetar-ycloud | ✅ Activo | Continuo | 🟡 MEDIA |
| workflow-auditoria-pedidos | ✅ Activo | Semanal | 🟡 MEDIA |
| monitor-escalados-workflow | ✅ Activo | Continuo | 🟡 MEDIA |

---

## 🔄 Datos Fluyendo

### Del Cliente al Sistema

```
WhatsApp Message
  → Webhook YCloud (/ycloud)
    → Agente-Luz-v6-Mejorado
      → DeepSeek IA
        → Herramientas (Supabase/PostgreSQL)
          → Cliente o Estado
```

### Del Sistema al Cliente

```
Pedido Web
  → Webhook Pedido Web
    → automation-pedidos-web
      → GPT-4o-mini
        → Notificación (Slack/Telegram/WhatsApp)
          → Equipo de despacho
```

### Sincronización de Datos

```
Supabase → PostgreSQL Local
  (cada hora)
    → workflow-sync-clientes-supabase-to-local
      → Normalización
        → UPSERT
          → PostgreSQL
            → Cliente Final
```

---

## 📱 Interacción de Usuario Final

### Flujo de Cliente (WhatsApp)

```
Cliente
  ↓ [Envía mensaje]
Webhook YCloud (/ycloud)
  ↓ [Procesa]
Agente-Luz-v6-Mejorado
  ↓ [Consultas]
  ├─> TOOL_BuscarProductos (Supabase)
  ├─> TOOL_BuscarConocimiento (PostgreSQL)
  ├─> TOOL_AnadirAlCarrito (PostgreSQL)
  └─> TOOL_CalcularTotalPrePedido (PostgreSQL)
  ↓ [Llama]
Webhook Confirmar Pre-Pedido (/confirmar-prepedido)
  ↓ [Confirma]
workflow-confirmar-prepedido
  ↓ [Guarda]
Supabase (orders table)
  ↓ [Responde]
Agente-Luz-v6-Mejorado
  ↓ [Responde]
Cliente (WhatsApp)
```

---

## 🎯 Resumen de Conexiones Críticas

### 1. Atención al Cliente (WhatsApp)
**Flujo**: `Agente-Luz-v6-Mejorado.json`
**Conexiones**:
- YCloud Webhook → n8n
- n8n → DeepSeek IA
- n8n → Supabase (productos)
- n8n → PostgreSQL (clientes)
- n8n → YCloud API (respuestas)

---

### 2. Pedidos Web
**Flujo**: `automation-pedidos-web.json`
**Conexiones**:
- Checkout Web → Webhook Pedido Web
- Webhook → GPT-4o-mini IA
- IA → Notificación (Slack/Telegram/WhatsApp)

---

### 3. Sincronización de Clientes
**Flujo**: `workflow-sync-clientes-supabase-to-local.json`
**Conexiones**:
- Schedule Trigger → Obtener Clientes Supabase
- Supabase → PostgreSQL (UPSERT)

---

### 4. Confirmación de Pre-Pedido
**Flujo**: `workflow-confirmar-prepedido.json`
**Conexiones**:
- Agente-Luz Webhook → Webhook Confirmar Pre-Pedido
- Webhook → Obtener Pre-Pedido (PostgreSQL)
- Webhook → Obtener Productos (Supabase)
- Webhook → Crear Pedido (Supabase)

---

## 🔄 Flujo de Datos Completo

```
┌──────────────────────────────────────────────────────────────────┐
│                    CLIENTE (Usuario Final)                        │
└──────────────────────────────────────────────────────────────────┘
                             ↓
                 ┌─────────────────────┐
                 │  WhatsApp / Web     │
                 └─────────────────────┘
                             ↓
┌──────────────────────────────────────────────────────────────────┐
│                   N8N WORKFLOW SYSTEM                             │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │  1. AGENTE LUZ v6.5 (Principal)                               │ │
│  │     • Disparador: Webhook YCloud (/webhook/ycloud)           │ │
│  │     • IA: DeepSeek                                          │ │
│  │     • Herramientas: TOOL_BuscarProductos, TOOL_AnadirAlCarrito│ │
│  │     • Acción: Procesa mensajes, responde, confirma pedidos  │ │
│  │     • Dependencias: YCloud API, Supabase, PostgreSQL         │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │  2. AUTOMATIZACIÓN PEDIDOS WEB                               │ │
│  │     • Disparador: Webhook Pedido Web (/webhook-pedidos-web) │ │
│  │     • IA: GPT-4.1-mini (limpieza de datos)                  │ │
│  │     • Acción: Procesa pedidos, notifica al equipo           │ │
│  │     • Dependencias: OpenAI, Sistema de notificación          │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │  3. SINCRONIZACIÓN CLIENTES                                  │ │
│  │     • Disparador: Schedule Trigger (cada hora)              │ │
│  │     • Acción: Sincroniza clientes entre Supabase y PostgreSQL│ │
│  │     • Dependencias: Supabase, PostgreSQL Local              │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │  4. CONFIRMACIÓN PRE-PEDIDO                                  │ │
│  │     • Disparador: Webhook Confirmar Pre-Pedido              │ │
│  │     • Acción: Verifica y crea pedido en Supabase             │ │
│  │     • Dependencias: PostgreSQL, Supabase                    │ │
│  └─────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────┘
                             ↓
┌──────────────────────────────────────────────────────────────────┐
│                    EXTERNAL SERVICES                              │
│                                                                   │
│  📱 YCloud API          |  🤖 DeepSeek IA      |  🧠 GPT-4.1-mini │
│  📊 Supabase DB         |  💾 PostgreSQL Local |  📱 WhatsApp    │
└──────────────────────────────────────────────────────────────────┘
                             ↓
┌──────────────────────────────────────────────────────────────────┐
│                    CLIENTE (Respuesta)                            │
└──────────────────────────────────────────────────────────────────┘
```

---

## 📊 MÉTRICAS DEL SISTEMA

### Resumen General

| Métrica | Valor |
|---------|-------|
| Total de flujos | 46 JSON files |
| Flujos activos | 9 (20%) |
| Flujos en revisión | 6 (13%) |
| Flujos inactivos | 31 (67%) |
| Webhooks activos | 3 |
| Instancia n8n | dep-n8n.n8ntusaguacates.space |

### Performance

| Flujo | Frecuencia | Latencia | Éxito |
|-------|------------|----------|-------|
| Agente Luz | Continuo | 5-10s | 95%+ |
| Sync Clientes | Hourly | 5-10 min | 95%+ |
| Confirmar Pedido | Continuo | <1 min | 99%+ |
| Audit Diario | Diario | 5-10 min | 98%+ |
| Recordatorios | 4x/día | 5-10 min | 95%+ |
| Buffer | 10s | <1s | 99%+ |

### Traffic Mensual (Ejemplo)

| Métrica | Valor |
|---------|-------|
| WhatsApp entrantes | 50,000 |
| WhatsApp salientes | 45,000 |
| Tasa de respuesta | 90% |
| N8N procesados | 40,000 |
| Sync Clientes | 24 ejecuciones |
| Recordatorios | 2,000 enviados |
| Buffer | 500/min |

---

**Versión**: 2.0  
**Fecha**: Febrero 2026  
**Autor**: Sistema de documentación automática  
**Estado**: Completo y Actualizado

---

## 🔐 Seguridad

### HTTPS en Todas las Conexiones
- ✅ Webhooks YCloud: HTTPS
- ✅ Webhooks Web: HTTPS
- ✅ API Keys: No hardcoded
- ✅ Credenciales: Configuradas en n8n (no en código)

### Fire-And-Forget
- ✅ Webhook proxy (/n8n-order-sync): No bloquea checkout
- ✅ Los fallos no afectan la experiencia del usuario final

---

**Versión**: 1.0
**Fecha**: Enero 2026
**Autor**: Sistema de documentación automática
