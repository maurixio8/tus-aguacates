# 🎨 Diagrama Visual - Arquitectura de Flujos n8n

## 🌐 Ecosistema de Flujos

```
╔═══════════════════════════════════════════════════════════════════╗
║                    N8N WORKFLOW ECOSYSTEM                        ║
║                    Tus Aguacates                                  ║
╚═══════════════════════════════════════════════════════════════════╝

┌─────────────────────────────────────────────────────────────────────┐
│  📱 EXTERNO                                                         │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐           │
│  │  Clientes   │    │  Webhooks   │    │  APIs       │           │
│  │  WhatsApp   │    │  Externos   │    │  Externas   │           │
│  └──────┬──────┘    └──────┬──────┘    └──────┬──────┘           │
│         │                  │                  │                   │
│         ▼                  ▼                  ▼                   │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐           │
│  │   YCloud    │────│  Tienda Web │────│  Supabase   │           │
│  │   (WhatsApp)│    │  (Vercel)   │    │   (Cloud)   │           │
│  └──────┬──────┘    └──────┬──────┘    └──────┬──────┘           │
│         │                  │                  │                   │
│         └──────────────────┼──────────────────┘                   │
│                            │                                      │
└────────────────────────────┼──────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│  ⚙️ N8N AUTOMATION ENGINE                                          │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │  🤖 AGENTE LUZ (Atención al Cliente)                         │  │
│  │  ┌─────────────────────────────────────────────────────────┐ │  │
│  │  │  📥 Webhook YCloud                                       │ │  │
│  │  │       │                                                 │ │  │
│  │  │       ▼                                                 │ │  │
│  │  │  🧠 Pre-procesamiento (Detectar modo admin/cliente)     │ │  │
│  │  │       │                                                 │ │  │
│  │  │       ▼                                                 │ │  │
│  │  │  ❓ ¿Es Media? → Filtrar imágenes/videos                │ │  │
│  │  │       │                                                 │ │  │
│  │  │       ├──────────► 📤 Respuesta "Solo texto"             │ │  │
│  │  │       │                                                 │ │  │
│  │  │       ▼                                                 │ │  │
│  │  │  🤖 DeepSeek IA (Procesar mensaje)                      │ │  │
│  │  │       │                                                 │ │  │
│  │  │       ├─► 🔍 BuscarProductos (Supabase)                  │ │  │
│  │  │       ├─► 🛒 AnadirAlCarrito (PostgreSQL)                │ │  │
│  │  │       ├─► 📊 ConsultarPedido (Supabase)                   │ │  │
│  │  │       ├─► 👤 GuardarNombreCliente (PostgreSQL)           │ │  │
│  │  │       ├─► 📞 EscalarServicio (Notificar humano)          │ │  │
│  │  │       ├─► 🏷️ Etiquetar (YCloud)                           │ │  │
│  │  │       └─► 🗑️ BorrarMemoria (PostgreSQL)                  │ │  │
│  │  │             │                                            │ │  │
│  │  │             ▼                                            │ │  │
│  │  │  📤 Enviar Respuesta YCloud → WhatsApp                  │ │  │
│  │  └─────────────────────────────────────────────────────────┘ │  │
│  │                                                             │  │
│  │  Versiones: v6.5 (Actual) │ v6.4 │ v6.3 │ v6.2 │ v5 │ v4 │ v3│  │
│  └─────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │  🔄 SINCRONIZACIÓN DE DATOS                                  │  │
│  │  ┌─────────────────────────────────────────────────────────┐ │  │
│  │  │  ⏰ Schedule (Cada 1 hora)                              │ │  │
│  │  │       │                                                 │ │  │
│  │  │       ▼                                                 │ │  │
│  │  │  📥 Obtener Productos (Supabase)                       │ │  │
│  │  │       │                                                 │ │  │
│  │  │       ▼                                                 │ │  │
│  │  │  🔄 Transformar Datos                                   │ │  │
│  │  │       │                                                 │ │  │
│  │  │       ▼                                                 │ │  │
│  │  │  📤 Insertar en PostgreSQL (productos_tienda)           │ │  │
│  │  │       │                                                 │ │  │
│  │  │       ▼                                                 │ │  │
│  │  │  ✅ Confirmar Sincronización                            │ │  │
│  │  └─────────────────────────────────────────────────────────┘ │  │
│  │                                                             │  │
│  │  Variantes:                                                 │  │
│  │  • workflow-sync-productos.json (v1)                       │  │
│  │  • workflow-sync-productos-v2.json (v2 - mejorada)         │  │
│  │  • workflow-sync-clientes-local-to-supabase.json          │  │
│  │  • workflow-sync-clientes-supabase-to-local.json          │  │
│  │  • workflow-sync-clientes-bucle-robusto.json              │  │
│  └─────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │  🔔 RECORDATORIOS Y RECUPERACIÓN                             │  │
│  │  ┌─────────────────────────────────────────────────────────┐ │  │
│  │  │  ⏰ Schedule (4x/día: 9am, 1pm, 5pm, 9pm)              │ │  │
│  │  │       │                                                 │ │  │
│  │  │       ▼                                                 │ │  │
│  │  │  🔍 Buscar Carritos Abandonados (>2h, <23h)             │ │  │
│  │  │       │                                                 │ │  │
│  │  │       ▼                                                 │ │  │
│  │  │  🧮 Calcular Total del Carrito                           │ │  │
│  │  │       │                                                 │ │  │
│  │  │       ▼                                                 │ │  │
│  │  │  🔧 Preparar Mensaje Personalizado                       │ │  │
│  │  │       │                                                 │ │  │
│  │  │       ▼                                                 │ │  │
│  │  │  📦 Dividir en Lotes (1 cliente a la vez)              │ │  │
│  │  │       │                                                 │ │  │
│  │  │       ▼                                                 │ │  │
│  │  │  📤 Enviar Recordatorio (YCloud → WhatsApp)            │ │  │
│  │  │       │                                                 │ │  │
│  │  │       ▼                                                 │ │  │
│  │  │  ✅ Registrar Envío (recordatorios_enviados)            │ │  │
│  │  └─────────────────────────────────────────────────────────┘ │  │
│  └─────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │  📢 MARKETING Y CAMPAÑAS                                      │  │
│  │  ┌─────────────────────────────────────────────────────────┐ │  │
│  │  │  ▶️ Trigger Manual                                       │ │  │
│  │  │       │                                                 │ │  │
│  │  │       ▼                                                 │ │  │
│  │  │  📋 Obtener Clientes (PostgreSQL)                        │ │  │
│  │  │       │                                                 │ │  │
│  │  │       ▼                                                 │ │  │
│  │  │  🔧 Preparar Mensajes (Template de WhatsApp)            │ │  │
│  │  │       │                                                 │ │  │
│  │  │       ▼                                                 │ │  │
│  │  │  📦 Dividir en Lotes                                     │ │  │
│  │  │       │                                                 │ │  │
│  │  │       ▼                                                 │ │  │
│  │  │  📤 Enviar Campaña (YCloud → WhatsApp)                 │ │  │
│  │  └─────────────────────────────────────────────────────────┘ │  │
│  │                                                             │  │
│  │  Campañas:                                                  │  │
│  │  • campana-500-clientes-invitatienda.json (Lanzamiento)    │  │
│  │  • campana-navidad-151-clientes.json (Navidad)             │  │
│  │  • campana-masiva-anti-duplicados.json (General)           │  │
│  └─────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │  📊 AUDITORÍA Y MONITORIZACIÓN                               │  │
│  │  ┌─────────────────────────────────────────────────────────┐ │  │
│  │  │  🎯 Webhook Trigger / Schedule Diario                  │ │  │
│  │  │       │                                                 │ │  │
│  │  │       ▼                                                 │ │  │
│  │  │  📦 Obtener Pedidos (Supabase)                          │ │  │
│  │  │       │                                                 │ │  │
│  │  │       ▼                                                 │ │  │
│  │  │  💰 Obtener Catálogo Actual (Supabase)                  │ │  │
│  │  │       │                                                 │ │  │
│  │  │       ▼                                                 │ │  │
│  │  │  🔍 Comparar y Detectar Problemas                        │ │  │
│  │  │       │                                                 │ │  │
│  │  │       ├─► Productos eliminados                          │ │  │
│  │  │       ├─► Precios desactualizados                        │ │  │
│  │  │       ├─► Variantes inexistentes                        │ │  │
│  │  │       └─► Estados inválidos                             │ │  │
│  │  │             │                                            │ │  │
│  │  │             ▼                                            │ │  │
│  │  │  📊 Generar Reporte JSON                               │ │  │
│  │  └─────────────────────────────────────────────────────────┘ │  │
│  │                                                             │  │
│  │  Flujos:                                                    │  │
│  │  • workflow-auditoria-pedidos.json (Manual)                 │  │
│  │  • workflow-audit-integrity-daily.json (Diario)             │  │
│  │  • monitor-escalados-workflow.json (Manual)                │  │
│  └─────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │  🛒 AUTOMATIZACIÓN DE PEDIDOS                                │  │
│  │  ┌─────────────────────────────────────────────────────────┐ │  │
│  │  │  📥 Webhook (Tienda Web)                                │ │  │
│  │  │       │                                                 │ │  │
│  │  │       ▼                                                 │ │  │
│  │  │  🤖 IA Limpieza Datos (GPT-4o-mini)                     │ │  │
│  │  │       │                                                 │ │  │
│  │  │       ├─► Corregir emojis                               │ │  │
│  │  │       ├─► Capitalizar nombres                          │ │  │
│  │  │       ├─► Estandarizar direcciones                      │ │  │
│  │  │       └─► Detectar posible fraude                      │ │  │
│  │  │             │                                            │ │  │
│  │  │             ▼                                            │ │  │
│  │  │  🔔 Formatear Notificación                              │ │  │
│  │  │       │                                                 │ │  │
│  │  │       ▼                                                 │ │  │
│  │  │  🔔 Enviar Notificación (Slack/Telegram/Email)         │ │  │
│  │  └─────────────────────────────────────────────────────────┘ │  │
│  │                                                             │  │
│  │  Flujos:                                                    │  │
│  │  • automation-pedidos-web.json (Webhook)                    │  │
│  │  • workflow-confirmar-prepedido.json (Manual)               │  │
│  └─────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │  🔧 HELPERS Y UTILIDADES                                     │  │
│  │  ┌─────────────────────────────────────────────────────────┐ │  │
│  │  │  • mcp-helper-workflow.json (Integración MCP)            │ │  │
│  │  │  • mcp-helper-v2.json (MCP v2)                           │ │  │
│  │  │  • workflow-auto-etiquetar-ycloud.json (Auto etiquetado) │ │  │
│  │  │  • workflow-procesar-buffer.json (Procesar buffer)      │ │  │
│  │  └─────────────────────────────────────────────────────────┘ │  │
│  └─────────────────────────────────────────────────────────────┘  │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│  🗄️ BASES DE DATOS                                                 │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │  ☁️ SUPABASE (Cloud)                                          │  │
│  │  ┌─────────────────────────────────────────────────────────┐ │  │
│  │  │  • products (Catálogo de productos)                      │ │  │
│  │  │  • guest_orders (Pedidos de invitados)                  │ │  │
│  │  │  • orders (Pedidos registrados)                         │ │  │
│  │  │  • order_items (Items de pedido)                        │ │  │
│  │  │  • customers (Clientes)                                  │ │  │
│  │  │  • categories (Categorías)                               │ │  │
│  │  │  • variants (Variantes de producto)                      │ │  │
│  │  │  • auth.users (Usuarios autenticados)                   │ │  │
│  │  │                                                             │ │  │
│  │  │  Funciones RPC:                                            │ │  │
│  │  │  • search_products(search_term)                          │ │  │
│  │  └─────────────────────────────────────────────────────────┘ │  │
│  └─────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │  🐘 POSTGRESQL (Local)                                        │  │
│  │  ┌─────────────────────────────────────────────────────────┐ │  │
│  │  │  • clientes (Clientes de WhatsApp)                      │ │  │
│  │  │  │  ├─ id, nombre, telefono                             │ │  │
│  │  │  │  ├─ pre_pedido (JSON carrito)                         │ │  │
│  │  │  │  ├─ estado_conversacion (NUEVO, EN_PEDIDO, etc.)      │ │  │
│  │  │  │  └─ updated_at                                        │ │  │
│  │  │                                                             │ │  │
│  │  │  • productos_tienda (Productos sincronizados)            │ │  │
│  │  │  │  ├─ supabase_id, name, slug                         │ │  │
│  │  │  │  ├─ price, discount_price                            │ │  │
│  │  │  │  ├─ category_name, category_id                       │ │  │
│  │  │  │  └─ main_image_url, stock, is_active                   │ │  │
│  │  │                                                             │ │  │
│  │  │  • recordatorios_enviados (Historial de recordatorios)   │ │  │
│  │  │  │  ├─ cliente_telefono                                 │ │  │
│  │  │  │  ├─ tipo (carrito_abandonado)                         │ │  │
│  │  │  │  └─ created_at                                        │ │  │
│  │  └─────────────────────────────────────────────────────────┘ │  │
│  └─────────────────────────────────────────────────────────────┘  │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│  🔌 INTEGRACIONES EXTERNAS                                           │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │  📱 YCLOUD (WhatsApp)                                          │  │
│  │  ┌─────────────────────────────────────────────────────────┐ │  │
│  │  │  • API: POST https://api.ycloud.com/v2/whatsapp/messages │ │  │
│  │  │  • Eventos:                                              │ │  │
│  │  │    └─ whatsapp.inbound_message.received                  │ │  │
│  │  │  • Templates:                                             │ │  │
│  │  │    ├─ invitatienda (Lanzamiento tienda)                  │ │  │
│  │  │    └─ Otros templates de WhatsApp                        │ │  │
│  │  └─────────────────────────────────────────────────────────┘ │  │
│  └─────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │  🤖 INTELIGENCIA ARTIFICIAL                                   │  │
│  │  ┌─────────────────────────────────────────────────────────┐ │  │
│  │  │  • DeepSeek (Modelo principal)                           │ │  │
│  │  │    └─ Procesamiento de mensajes de WhatsApp             │ │  │
│  │  │                                                             │ │  │
│  │  │  • GPT-4o-mini (Opcional)                                 │ │  │
│  │  │    └─ Limpieza de datos de pedidos web                  │ │  │
│  │  └─────────────────────────────────────────────────────────┘ │  │
│  └─────────────────────────────────────────────────────────────┘  │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘

═════════════════════════════════════════════════════════════════════════
```

## 🔄 Flujo de Datos - Atención al Cliente

```
Cliente ──► WhatsApp ──► YCloud ──► Webhook n8n
                                         │
                                         ▼
                                   Pre-procesamiento
                                   (Detectar modo)
                                         │
                    ┌────────────────────┴────────────────────┐
                    │                                         │
                    ▼                                         ▼
              Modo Cliente                            Modo Copiloto
                    │                                         │
                    ▼                                         ▼
              DeepSeek IA                          Herramientas Admin
                    │                                         │
                    ▼                                         ▼
           ┌─────────────────┐                    ┌────────────────┐
           │  Buscar         │                    │  Consultar     │
           │  Productos      │                    │  Pedidos       │
           │  (Supabase)     │                    │  (Supabase)    │
           └─────────────────┘                    └────────────────┘
                    │                                         │
                    ▼                                         ▼
           ┌─────────────────┐                    ┌────────────────┐
           │  Añadir         │                    │  Actualizar    │
           │  Carrito        │                    │  Cliente       │
           │  (PostgreSQL)   │                    │  (PostgreSQL)  │
           └─────────────────┘                    └────────────────┘
                    │                                         │
                    └────────────────┬────────────────────────┘
                                     │
                                     ▼
                            Generar Respuesta
                                     │
                                     ▼
                            Enviar a YCloud
                                     │
                                     ▼
                            WhatsApp ──► Cliente
```

## 🔄 Flujo de Datos - Sincronización

```
Supabase (Cloud) ──► n8n Sync Productos
                           │
                           ▼
                    Transformar Datos
                           │
                           ▼
               PostgreSQL Local (productos_tienda)
                           │
                           ▼
                   Agente Luz (Disponible offline)
```

## 🔄 Flujo de Datos - Recordatorio Carritos

```
Schedule (4x/día) ──► Buscar Carritos Abandonados
                           │
                           ├─► Estado: EN_PEDIDO
                           ├─► Pre_pedido: NO NULL
                           ├─► Inactivo: 2-23 horas
                           └─► No enviado hoy
                           │
                           ▼
                    Calcular Total
                           │
                           ▼
               Preparar Mensaje Personalizado
                           │
                           ▼
                    Enviar YCloud → WhatsApp
                           │
                           ▼
                   Registrar en recordatorios_enviados
```

---

**Última actualización:** Febrero 2026
**Versión:** 1.0
