# 🔄 VISUALIZACIÓN DEL SISTEMA N8N TUS AGUACATES

## 🏗️ ARQUITECTURA GENERAL

```
══════════════════════════════════════════════════════════════════════════════
                    SISTEMA DE AUTOMATIZACIÓN N8N - TUS AGUACATES
══════════════════════════════════════════════════════════════════════════════

CLIENTE WHATSAPP
     │
     │ 1. ENVÍA MENSAJE
     ▼
┌─────────────────────────────────────────────────────────────┐
│                 YCLOUD (API WHATSAPP)                        │
│  • Webhook: whatsapp.inbound_message.received               │
│  • Evento: Mensaje entrante                                   │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│           N8N WORKFLOW: 🥑 AGENTE LUZ v6.5                   │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ 1. 📥 Webhook YCloud                                  │  │
│  │ 2. 🧠 Pre-procesamiento                               │  │
│  │     • Detecta: Cliente vs Director (Mauricio)         │  │
│  │ 3. 👤 Obtener Cliente                                 │  │
│  │     • Busca en PostgreSQL                             │  │
│  │     • Crea si no existe                                │  │
│  │ 4. 🔍 Búsqueda Automática (si menciona producto)      │  │
│  │ 5. 🧠 Postgres Chat Memory                            │  │
│  │     • 30 mensajes de contexto                         │  │
│  │ 6. 🤖 Agente IA (DeepSeek/OpenAI)                     │  │
│  │     • Analiza contexto                                │  │
│  │     • Decide herramienta a usar                       │  │
│  │ 7. 🛠️ Herramientas Disponibles:                       │  │
│  │     • TOOL_BuscarProductos → PostgreSQL               │  │
│  │     • TOOL_AnadirAlCarrito → PostgreSQL               │  │
│  │     • TOOL_GuardarNombreCliente → PostgreSQL         │  │
│  │     • TOOL_CalcularTotalPrePedido → PostgreSQL        │  │
│  │     • TOOL_ObtenerVariantes → PostgreSQL              │  │
│  │     • TOOL_ConsultarEstadoPedido → PostgreSQL        │  │
│  │     • TOOL_ADMIN_* (solo para director)              │  │
│  │ 8. 📤 Preparar Respuesta                               │  │
│  │     • Formatea con emojis                             │  │
│  │     • Timeline de mensajes                            │  │
│  │ 9. 📱 Enviar WhatsApp YCloud                          │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│              POSTGRESQL LOCAL (Base de datos WhatsApp)        │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Tablas:                                               │  │
│  │ • clientes (estado, pre_pedido, conversación)        │  │
│  │ • mensaje_buffer (mensajes agrupados)                 │  │
│  │ • recordatorios_enviados                              │  │
│  │ • envios_campana                                      │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                    POSTGRESQL LOCAL (Lógica)                  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Funciones:                                            │  │
│  │ • TOOL_BuscarProductos → SQL queries                 │  │
│  │ • TOOL_AnadirAlCarrito → UPDATE clientes             │  │
│  │ • TOOL_GuardarNombreCliente → UPDATE clientes        │  │
│  │ • TOOL_CalcularTotalPrePedido → SUM() carrito        │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘

══════════════════════════════════════════════════════════════════════════════
                    FLUJO SEPARADO: SYNC DE DATOS
══════════════════════════════════════════════════════════════════════════════

┌─────────────────────────────────────────────────────────────┐
│           WORKFLOW: 🔄 SYNC PRODUCTOS                        │
│  • Frecuencia: Cada 1 hora                                  │
│  • Trigger: Schedule (1h)                                    │
└─────────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────┐
│              SUPABASE (E-commerce)                           │
│  Tabla: products                                             │
│  • id, name, price, discount_price, main_image_url,         │
│    category, stock, is_active                               │
└────────────────────┬────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────┐
│           WORKFLOW: 🔄 TRANSFORMACIÓN                        │
│  • Obtén productos de Supabase                                │
│  • Transforma al formato local                                │
│  • Limpia tabla local                                         │
│  • Inserta productos actualizados                             │
└────────────────────┬────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────┐
│            POSTGRESQL LOCAL (Base de datos Productos)        │
│  Tabla: productos_tienda                                     │
│  • supabase_id, name, price, discount_price,                │
│    main_image_url, category_name, stock, is_active          │
└─────────────────────────────────────────────────────────────┘

══════════════════════════════════════════════════════════════════════════════
                    FLUJO SEPARADO: SYNC CLIENTES
══════════════════════════════════════════════════════════════════════════════

┌─────────────────────────────────────────────────────────────┐
│           WORKFLOW: 👥 SYNC CLIENTES SUPABASE → LOCAL         │
│  • Frecuencia: Cada 1 hora                                    │
│  • Trigger: Schedule (1h)                                    │
└─────────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────┐
│              SUPABASE (E-commerce)                           │
│  Tabla: customers                                             │
│  • supabase_id, telefono, nombre, email, direccion,        │
│    total_pedidos, total_gastado, is_active                   │
└────────────────────┬────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────┐
│           WORKFLOW: 🔄 TRANSFORMACIÓN UPSERT                  │
│  • UPSERT en PostgreSQL local                                │
│  • No duplica por teléfono                                   │
│  • Actualiza si ya existe                                     │
│  • Vincula supabase_id                                        │
└────────────────────┬────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────┐
│            POSTGRESQL LOCAL (Base de datos Clientes)         │
│  Tabla: clientes                                             │
│  • supabase_id, telefono, nombre, email, direccion,        │
│    pre_pedido, estado_conversacion, updated_at              │
└─────────────────────────────────────────────────────────────┘

══════════════════════════════════════════════════════════════════════════════
                    FLUJO SEPARADO: SYNC CLIENTES (REVERSE)
══════════════════════════════════════════════════════════════════════════════

┌─────────────────────────────────────────────────────────────┐
│           WORKFLOW: 👥 SYNC CLIENTES LOCAL → SUPABASE         │
│  • Frecuencia: Cada 1 hora                                    │
│  • Trigger: Schedule (1h)                                    │
└─────────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────┐
│           WORKFLOW: 🔄 FILTRADO Y PREPARACIÓN                │
│  • Busca clientes sin supabase_id                             │
│  • Normaliza teléfono a E.164 (57XXXXXXXXXX)                  │
│  • Prepara formato para Supabase                               │
└────────────────────┬────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────┐
│           WORKFLOW: 🔄 UPSERT SUPABASE                       │
│  • UPSERT en Supabase                                         │
│  • Tabla: customers                                           │
│  • Vincula supabase_id en local                               │
└─────────────────────────────────────────────────────────────┘

══════════════════════════════════════════════════════════════════════════════
                    FLUJO SEPARADO: CONFIRMAR PEDIDO
══════════════════════════════════════════════════════════════════════════════

┌─────────────────────────────────────────────────────────────┐
│           WORKFLOW: 📦 CONFIRMAR PRE-PEDIDO                  │
│  • Trigger: Webhook (manual)                                  │
│  • Desde Agente Luz (Mauricio)                                │
└─────────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────┐
│           📥 WEBHOOK: Obtener Pre-Pedido                     │
│  • Recibe: telefono del cliente                               │
│  • Busca en PostgreSQL local                                  │
└─────────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────┐
│           💰 OBTENER PRECIOS SUPABASE                         │
│  • Trae catálogo actual de productos de Supabase              │
│  • Comparar precios del carrito con precios actuales          │
└─────────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────┐
│           🔍 VERIFICAR PRECIOS (INTEGRIDAD)                  │
│  • Detecta discrepancias                                       │
│  • Corrige al precio real                                      │
│  • Registra alertas si hay diferencias                        │
└─────────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────┐
│           📤 CREAR EN SUPABASE                               │
│  • Crea pedido en tabla guest_orders                          │
│  • Convierte pre_pedido real → pedido final                    │
│  • Actualiza stock                                            │
└────────────────────┬────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────┐
│           🧹 LIMPIAR CARRITO (LOCAL)                         │
│  • Vacía pre_pedido en PostgreSQL local                        │
│  • Cambia estado de cliente a PEDIDO_ONLINE                    │
└─────────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────┐
│           🏷️ ETIQUETAR YCLOUD                                │
│  • Agrega etiqueta "CONFIRMADOS"                              │
│  • Marca contacto en YCloud                                    │
└─────────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────┐
│           📢 NOTIFICAR ADMIN (WHATSAPP)                      │
│  • Envia mensaje al admin (Mauricio)                          │
│  • Detalles del pedido confirmado                              │
│  • Vía YCloud API                                             │
└─────────────────────────────────────────────────────────────┘

══════════════════════════════════════════════════════════════════════════════
                    FLUJO SEPARADO: BUFFER Y MENSAJES
══════════════════════════════════════════════════════════════════════════════

┌─────────────────────────────────────────────────────────────┐
│           WORKFLOW: ⏰ PROCESADOR DE BUFFER                  │
│  • Frecuencia: Cada 10 segundos                               │
│  • Trigger: Schedule (10s)                                    │
└─────────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────┐
│           📦 OBTENER MENSAJES LISTOS                          │
│  • SQL: Busca mensajes en mensaje_buffer                      │
│  • Agrupa por cliente                                        │
│  • Tiempo de inactividad ≥ 30 segundos                        │
└─────────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────┐
│           📤 PREPARAR PAYLOAD                                │
│  • Combina mensajes del cliente                               │
│  • Formatea para enviar a webhook principal                    │
└─────────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────┐
│           🔗 LLAMAR WEBHOOK PRINCIPAL                        │
│  • Envía a Agente Luz                                         │
│  • Trata los mensajes combinados como uno solo                │
└─────────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────┐
│           ✅ MARCAR PROCESADOS                               │
│  • Actualiza mensaje_buffer con procesado = true              │
│  • Registra timestamp                                        │
└─────────────────────────────────────────────────────────────┘

══════════════════════════════════════════════════════════════════════════════
                    FLUJO SEPARADO: RECORDATORIOS
══════════════════════════════════════════════════════════════════════════════

┌─────────────────────────────────────────────────────────────┐
│           WORKFLOW: 🛒 RECORDATORIOS CARROS ABANDONADOS       │
│  • Frecuencia: Cada 4 horas (9 AM, 1 PM, 5 PM, 9 PM)        │
│  • Trigger: Schedule (4h)                                     │
└─────────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────┐
│           📋 FILTRADO DE CLIENTES                             │
│  • Estado: EN_PEDIDO                                          │
│  • Tiempo inactividad: 2 - 23 horas                           │
│  • Carrito no vacío                                           │
│  • No enviado hoy                                            │
└─────────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────┐
│           📝 FORMATEAR MENSAJE                                │
│  • Saludo personalizado                                       │
│  • Lista de productos en carrito                              │
│  • Total del carrito                                          │
│  • Próxima entrega                                           │
│  • Botones interactivos                                       │
└─────────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────┐
│           📱 ENVIAR WHATSAPP                                 │
│  • Vía YCloud API                                             │
│  • Registra envío en recordatorios_enviados                   │
└─────────────────────────────────────────────────────────────┘

══════════════════════════════════════════════════════════════════════════════
                    HERRAMIENTAS DEL AGENTE LUZ
══════════════════════════════════════════════════════════════════════════════

┌─────────────────────────────────────────────────────────────┐
│           🛠️ TOOL_BuscarProductos                              │
│  → PostgreSQL local                                           │
│  → Busca productos por nombre, categoría, variantes           │
│  → Devuelve resultados con imagen, precio, stock              │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│           🛠️ TOOL_AnadirAlCarrito                             │
│  → PostgreSQL local                                           │
│  → Agrega item al pre_pedido del cliente                      │
│  → Calcula total del carrito                                  │
│  → Actualiza estado a EN_PEDIDO                               │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│           🛠️ TOOL_GuardarNombreCliente                        │
│  → PostgreSQL local                                           │
│  → Guarda nombre del cliente en campo nombre                  │
│  → Actualiza estado a NOMBRE_SOLICITADO                       │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│           🛠️ TOOL_GuardarDireccionCliente                     │
│  → PostgreSQL local                                           │
│  → Guarda dirección de entrega                                │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│           🛠️ TOOL_CalcularTotalPrePedido                      │
│  → PostgreSQL local                                           │
│  → Calcula SUM(precio * cantidad) del carrito                 │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│           🛠️ TOOL_ObtenerVariantes                             │
│  → PostgreSQL local                                           │
│  → Obtiene variantes de un producto                            │
│  → Lista presentación, precio, stock                          │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│           🛠️ TOOL_ConsultarEstadoPedido                       │
│  → PostgreSQL local                                           │
│  → Consulta estado del pedido                                  │
│  → Devuelve detalles: ID, items, total, fecha                 │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│           🛠️ TOOL_EscalarServicioCliente                      │
│  → PostgreSQL local                                           │
│  → Cambia estado a ESCALADO                                    │
│  → Envía notificación al director                              │
└─────────────────────────────────────────────────────────────┘

══════════════════════════════════════════════════════════════════════════════
                    HERRAMIENTAS DEL COPILOTO (ADMIN)
══════════════════════════════════════════════════════════════════════════════

┌─────────────────────────────────────────────────────────────┐
│           🛠️ TOOL_ADMIN_ConsultarCliente                       │
│  → PostgreSQL local                                           │
│  → Consulta datos de un cliente específico                     │
│  → Devuelve: nombre, telefono, pre_pedido, estado             │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│           🛠️ TOOL_ADMIN_ActualizarNombre                       │
│  → PostgreSQL local                                           │
│  → Actualiza nombre de cliente                                 │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│           🛠️ TOOL_ADMIN_CambiarEstadoCliente                  │
│  → PostgreSQL local                                           │
│  → Cambia estado de conversación                               │
│  → Estados: NUEVO, NOMBRE_SOLICITADO, ATENCION_LUZ,           │
│              EN_PEDIDO, PEDIDO_CONFIRMADO, PEDIDO_ONLINE,     │
│              ESCALADO                                       │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│           🛠️ TOOL_ADMIN_VaciarCarrito                          │
│  → PostgreSQL local                                           │
│  → Vacía el pre_pedido del cliente                             │
│  → Resetea estado a ATENCION_LUZ                              │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│           🛠️ TOOL_ListarClientesSinNombre                      │
│  → PostgreSQL local                                           │
│  → Lista clientes sin nombre                                   │
│  → Útil para seguir con clientes no identificados              │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│           🛠️ TOOL_ADMIN_ResumenCarritos                        │
│  → PostgreSQL local                                           │
│  → Estadísticas de carritos:                                  │
│    • Total clientes con pre_pedido                            │
│    • Total items en carritos                                   │
│    • Monto total del carrito                                   │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│           🛠️ TOOL_ADMIN_ConfirmarPedido                        │
│  → PostgreSQL local + Supabase                                │
│  → Convierte pre_pedido a pedido real                           │
│  → Similar a workflow-confirmar-prepedido                      │
│  → Notifica al director                                         │
└─────────────────────────────────────────────────────────────┘

══════════════════════════════════════════════════════════════════════════════
                    ESTADOS DE CONVERSACIÓN DEL CLIENTE
══════════════════════════════════════════════════════════════════════════════

CLIENTE NUEVO
   ↓ (cliente da nombre)
CLIENTE CON NOMBRE (NOMBRE_SOLICITADO)
   ↓ (atención activa)
ATENCIÓN ACTIVA (ATENCION_LUZ)
   ↓ (cliente agrega productos)
CLIENTE EN PEDIDO (EN_PEDIDO)
   ↓ (cliente confirma pedido)
CLIENTE CON PEDIDO CONFIRMADO (PEDIDO_CONFIRMADO)
   ↓ (o envía pedido por web)
CLIENTE CON PEDIDO EN LÍNEA (PEDIDO_ONLINE)
   ↓ (si hay problema)
CLIENTE ESCALADO (ESCALADO)

NOTA: También hay estados para:
- Buffering (si el cliente envía mensajes muy rápidos)
- Recording (si está en proceso de grabación de video)

══════════════════════════════════════════════════════════════════════════════

📊 RESUMEN DE WORKFLOWS ACTIVOS
─────────────────────────────────────────────────────────────────────────

✅ ACTIVO (4 workflows):
1. 🥑 Agente Luz v6.5 (atención al cliente)
2. ⏰ Procesador de Buffer
3. 🔄 Sync Productos
4. 👥 Sync Clientes (bidireccional)
5. 📦 Confirmar Pre-Pedido
6. 📊 Tracking Respuestas

⚪ INACTIVO (9 workflows):
1. 🛒 Recordatorios Carritos
2. 🛡️ Auditoría Diaria
3. 🔍 Auditoría de Pedidos
4. 🏷️ Auto-Etiquetado YCloud

─────────────────────────────────────────────────────────────────────────
