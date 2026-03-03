# 📚 Manual de Flujos de n8n - Tus Aguacates

## 📖 Índice

1. [Introducción](#introducción)
2. [Arquitectura General](#arquitectura-general)
3. [Categorías de Flujos](#categorías-de-flujos)
4. [Flujos por Categoría](#flujos-por-categoría)
5. [Conexión con la Tienda Online](#conexión-con-la-tienda-online)
6. [Habilidades y Capacidades](#habilidades-y-capacidades)

---

## Introducción

Este manual documenta todos los flujos de n8n utilizados en **Tus Aguacates** para automatizar la operación del negocio y conectar la tienda online con WhatsApp, gestión de pedidos, sincronización de datos y más.

### ¿Qué es n8n?

n8n es una plataforma de automatización de workflows que permite conectar diferentes servicios y aplicaciones mediante nodos visuales. En Tus Aguacates, usamos n8n como el "cerebro" de automatizaciones que conectan:

- 🛒 La tienda online (tus-aguacates.vercel.app)
- 💬 WhatsApp (vía YCloud)
- 🗄️ Bases de datos (Supabase y PostgreSQL local)
- 🤖 Inteligencia Artificial (DeepSeek, OpenAI, Anthropic)

---

## Arquitectura General

```
┌─────────────────────────────────────────────────────────────┐
│                    🏪 Tienda Online                          │
│              (Next.js + Supabase)                           │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                      n8n Platform                           │
│                   (https://dep-n8n.n8ntusaguacates.space)    │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ 1. 🤖 AGENTE DE ATENCIÓN (WhatsApp)                   │ │
│  │    - Agente Luz v6.5 (Principal)                      │ │
│  │    - Procesador de Buffer                             │ │
│  │    - Tracking de Respuestas                           │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ 2. 🔄 SINCRONIZACIÓN DE DATOS                          │ │
│  │    - Sync Productos (Supabase ↔ Local)                │ │
│  │    - Sync Clientes (Supabase ↔ Local)                 │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ 3. 📦 GESTIÓN DE PEDIDOS                              │ │
│  │    - Confirmar Pre-Pedido → Supabase                  │ │
│  │    - Auditoría de Pedidos Históricos                 │ │
│  │    - Automation de Pedidos Web                       │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ 4. 📢 MARKETING Y CAMPAÑAS                             │ │
│  │    - Recordatorio Carritos Abandonados                │ │
│  │    - Campañas Masivas                                  │ │
│  │    - Auto-etiquetar YCloud                             │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ 5. 🛡️ MONITOREO Y AUDITORÍA                           │ │
│  │    - Auditoría Diaria de Integridad                   │ │
│  │    - Monitor de Escalados                             │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ 6. 🔧 HERRAMIENTAS DE ADMINISTRACIÓN                  │ │
│  │    - MCP Helper                                        │ │
│  │    - Herramientas Admin Copiloto                       │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

---

## Categorías de Flujos

### 1. 🤖 AGENTE DE ATENCIÓN (WhatsApp)
Flujos que gestionan la conversación con clientes a través de WhatsApp.

### 2. 🔄 SINCRONIZACIÓN DE DATOS
Flujos que mantienen sincronizados los datos entre Supabase y bases de datos locales.

### 3. 📦 GESTIÓN DE PEDIDOS
Flujos relacionados con el procesamiento y gestión de pedidos.

### 4. 📢 MARKETING Y CAMPAÑAS
Flujos de marketing, campañas masivas y recordatorios.

### 5. 🛡️ MONITOREO Y AUDITORÍA
Flujos de monitoreo, auditoría y alertas.

### 6. 🔧 HERRAMIENTAS DE ADMINISTRACIÓN
Flujos auxiliares para administración y desarrollo.

---

## Flujos por Categoría

### 1. 🤖 AGENTE DE ATENCIÓN (WhatsApp)

#### 🥑 Agente Luz v6.5 - Con Herramientas Admin Copiloto
**Archivo**: `agente-luz-v6.5-admin-copiloto.json`

**Propósito**: Agente de IA principal que atiende a clientes por WhatsApp. Es el cerebro de la atención al cliente.

**Funcionalidades**:
- Recibe mensajes de WhatsApp vía webhook de YCloud
- Procesa mensajes con DeepSeek (IA)
- Responde automáticamente con opciones y productos
- Soporta dos modos:
  - **Modo Cliente**: Atención normal para compradores
  - **Modo Copiloto**: Herramientas de administración para el director (Mauricio)

**Herramientas del Agente**:
- `TOOL_BuscarProductos`: Busca productos en el catálogo
- `TOOL_ConsultarPedido`: Consulta estado de pedidos
- `TOOL_AgregarAlCarrito`: Añade productos al carrito
- `TOOL_EscalarServicio`: Escala problemas a soporte humano

**Conexión con la tienda**: 
- Lee productos de Supabase
- Crea pre-pedidos en base local
- Genera enlaces a la tienda online para checkout

**Estado**: ✅ Activo (Principal)

---

#### ⏰ Procesador de Buffer - Mensajes Agrupados
**Archivo**: `workflow-procesar-buffer.json`

**Propósito**: Agrupa mensajes rápidos del mismo cliente para evitar respuestas fragmentadas.

**Funcionalidades**:
- Ejecuta cada 10 segundos
- Agrupa mensajes del mismo cliente enviados en menos de 30 segundos
- Combina los mensajes en uno solo
- Reenvía al agente principal

**Conexión con la tienda**: Indirecta (mejora la experiencia de usuario en WhatsApp)

**Estado**: ✅ Activo

---

#### 📊 Tracking de Respuestas
**Archivo**: `workflow-tracking-respuestas.json`

**Propósito**: Registra y analiza las respuestas enviadas por el agente para métricas y mejora.

**Funcionalidades**:
- Registra cada respuesta enviada
- Calcula tiempos de respuesta
- Genera estadísticas de efectividad

**Estado**: 🟡 Requiere verificación

---

### 2. 🔄 SINCRONIZACIÓN DE DATOS

#### 🔄 Sync Productos Supabase → Local
**Archivo**: `workflow-sync-productos.json` y `workflow-sync-productos-v2.json`

**Propósito**: Sincroniza el catálogo de productos desde Supabase a la base de datos local.

**Funcionalidades**:
- Ejecuta cada hora
- Lee todos los productos de Supabase (tabla `products`)
- Transforma los datos al formato local
- Limpia y reemplaza la tabla local `productos_tienda`
- Incluye variantes de productos

**Flujo**:
1. Schedule trigger (cada hora)
2. Obtener productos de Supabase
3. Transformar datos
4. Limpiar tabla local
5. Insertar productos

**Conexión con la tienda**: 
- Asegura que el agente de WhatsApp tenga el catálogo actualizado
- Permite búsquedas rápidas en base local

**Estado**: ✅ Activo

---

#### 🔄 Sync Clientes Local → Supabase
**Archivo**: `workflow-sync-clientes-local-to-supabase.json`

**Propósito**: Sincroniza clientes desde la base local hacia Supabase.

**Funcionalidades**:
- Ejecuta cada hora
- Busca clientes que solo existen localmente
- Normaliza teléfonos a formato E.164 (+57...)
- Crea o actualiza clientes en Supabase (UPSERT)
- Guarda el ID de Supabase en local

**Conexión con la tienda**: 
- Mantiene sincronizada la base de clientes entre WhatsApp y la tienda

**Estado**: ✅ Activo

---

#### 🔄 Sync Clientes Supabase → Local
**Archivos**: 
- `workflow-sync-clientes-supabase-to-local.json`
- `workflow-sync-clientes-supabase-to-local-PART-2.json`

**Propósito**: Sincroniza clientes desde Supabase hacia la base local.

**Funcionalidades**:
- Ejecuta cada hora
- Obtiene clientes actualizados de Supabase
- Actualiza datos en local
- Incluye métricas de compras

**Estado**: ✅ Activo

---

#### 🔄 Sync Clientes Bucle Robusto
**Archivo**: `workflow-sync-clientes-bucle-robusto.json`

**Propósito**: Versión mejorada de sincronización de clientes con manejo de errores y reintentos.

**Estado**: 🟡 En desarrollo

---

### 3. 📦 GESTIÓN DE PEDIDOS

#### 📦 Confirmar Pre-Pedido → Supabase (CON VERIFICACIÓN)
**Archivo**: `workflow-confirmar-prepedido.json`

**Propósito**: Convierte un pre-pedido de WhatsApp en un pedido formal en Supabase.

**Funcionalidades**:
- Webhook que recibe confirmación de pre-pedido
- Valida que el pre-pedido existe
- Obtiene precios actuales de Supabase
- Crea el pedido en Supabase (`guest_orders` o `orders`)
- Genera enlace de pago/checkout
- Envía confirmación al cliente

**Flujo**:
1. Webhook confirmar-prepedido
2. Obtener pre-pedido local
3. Validar que tiene items
4. Obtener precios actualizados de Supabase
5. Calcular total
6. Crear pedido en Supabase
7. Generar enlace
8. Enviar confirmación

**Conexión con la tienda**: 
- Crea pedidos que aparecen en la tienda
- Genera enlaces de pago para checkout

**Estado**: ✅ Activo

---

#### 🔍 Auditoría de Pedidos Históricos
**Archivo**: `workflow-auditoria-pedidos.json`

**Propósito**: Revisa y audita los pedidos históricos para detectar inconsistencias.

**Funcionalidades**:
- Obtiene todos los pedidos de Supabase
- Compara con catálogo actual
- Detecta productos discontinuados
- Genera reporte de inconsistencias

**Conexión con la tienda**: 
- Mantiene la integridad de los datos de pedidos

**Estado**: 🟡 Manual

---

#### 🚀 Automation de Pedidos Web
**Archivo**: `automation-pedidos-web.json`

**Propósito**: Automatiza procesos relacionados con pedidos que llegan por la tienda web.

**Funcionalidades**:
- Webhook que recibe notificaciones de pedidos web
- Envía confirmación por WhatsApp
- Actualiza inventario
- Notifica al equipo

**Estado**: 🟡 En desarrollo

---

### 4. 📢 MARKETING Y CAMPAÑAS

#### 🛒 Recordatorio Carritos Abandonados
**Archivo**: `workflow-recordatorio-carritos.json`

**Propósito**: Envía recordatorios a clientes que tienen carritos abandonados en WhatsApp.

**Funcionalidades**:
- Ejecuta cada 4 horas (9am, 1pm, 5pm, 9pm)
- Busca clientes con carritos activos por más de 2 horas
- Filtra clientes que ya recibieron recordatorio hoy
- Envía mensaje personalizado con botones
- Registra el recordatorio enviado

**Mensaje**:
```
Hola [Nombre] 👋

¿Olvidaste algo? Vi que tienes productos en tu carrito:

• [Lista de productos]

💰 Total: $X

🚚 Si completas ahora, te llega el [Día]

¿Qué te gustaría hacer?
```

**Conexión con la tienda**: 
- Recupera ventas potenciales de WhatsApp
- Convierte conversaciones en pedidos

**Estado**: ✅ Activo

---

#### 🏷️ Auto-etiquetar YCloud
**Archivo**: `workflow-auto-etiquetar-ycloud.json`

**Propósito**: Etiqueta automáticamente los contactos en YCloud según su historial de compras.

**Funcionalidades**:
- Busca clientes con historial de compras
- Aplica etiquetas según categoría (Nuevo, Recurrente, VIP, etc.)
- Actualiza en YCloud

**Estado**: 🟡 En desarrollo

---

#### 📢 Campaña 500 Clientes Invitatienda
**Archivo**: `campana-500-clientes-invitatienda.json`

**Propósito**: Campaña masiva para invitar 500 clientes a la tienda.

**Estado**: ✅ Completada

---

#### 🎄 Campaña Navidad 151 Clientes
**Archivo**: `campana-navidad-151-clientes.json`

**Propósito**: Campaña navideña para 151 clientes seleccionados.

**Estado**: ✅ Completada

---

#### 🧹 Campaña Masiva Anti-Duplicados
**Archivo**: `campana-masiva-anti-duplicados.json`

**Propósito**: Limpieza de contactos duplicados para campañas masivas.

**Estado**: ✅ Completada

---

### 5. 🛡️ MONITOREO Y AUDITORÍA

#### 🛡️ Auditoría Diaria de Integridad
**Archivo**: `workflow-audit-integrity-daily.json`

**Propósito**: Ejecuta una auditoría automática de la integridad de datos cada día.

**Funcionalidades**:
- Ejecuta cada día a las 6:00 AM
- Cuenta registros en local y Supabase
- Compara:
  - Clientes local vs Supabase
  - Productos local vs Supabase
  - Variantes local vs Supabase
- Genera alertas si hay diferencias significativas
- Envía reporte al equipo

**Conexión con la tienda**: 
- Asegura que los datos estén sincronizados
- Previene problemas de inventario o clientes

**Estado**: ✅ Activo

---

#### 📊 Monitor de Escalados
**Archivo**: `monitor-escalados-workflow.json`

**Propósito**: Monitorea cuando el agente escala casos a soporte humano.

**Funcionalidades**:
- Detecta escalados
- Notifica al equipo
- Registra métricas de escalados

**Estado**: 🟡 En desarrollo

---

### 6. 🔧 HERRAMIENTAS DE ADMINISTRACIÓN

#### 🔧 MCP Helper
**Archivos**: 
- `mcp-helper-workflow.json`
- `mcp-helper-v2.json`

**Propósito**: Workflow auxiliar para el protocolo MCP (Model Context Protocol).

**Funcionalidades**:
- Sirve como puente entre el agente y herramientas externas
- Permite ejecutar acciones específicas
- Maneja respuestas formateadas

**Estado**: ✅ Activo

---

#### 🛠️ Herramientas Admin Copiloto
**Archivo**: `herramientas-admin-copiloto.json`

**Propósito**: Conjunto de herramientas para el modo administrador (Copiloto).

**Funcionalidades**:
- Consultas de datos
- Análisis de métricas
- Gestión de clientes
- Reportes

**Estado**: ✅ Activo

---

#### 📋 Nodos Copiloto para Agregar
**Archivo**: `nodos-copiloto-para-agregar.json`

**Propósito**: Plantillas de nodos para agregar al agente principal.

**Estado**: 📋 Plantilla

---

#### 🔧 Nodo Pulidor de Respuestas
**Archivo**: `nodo-pulidor-respuestas.json`

**Propósito**: Mejora el tono y formato de las respuestas del agente.

**Estado**: 🟡 En desarrollo

---

## Conexión con la Tienda Online

### Flujo de Datos: Tienda ↔ n8n ↔ WhatsApp

```
Cliente por WhatsApp
    ↓
YCloud (WhatsApp API)
    ↓
n8n - Agente Luz v6.5
    ↓
┌─────────────────────────────────┐
│ Consulta productos Supabase     │
│ Crea/actualiza en base local    │
│ Genera pre-pedido               │
└─────────────────────────────────┘
    ↓
Respuesta con:
- Productos del catálogo
- Enlace a tienda online
- Botones de acción
    ↓
Cliente puede:
- Agregar al carrito en WhatsApp
- Ir a tienda online a completar pedido
- Continuar conversación
```

### Puntos de Integración

| Componente | Integración con n8n | Propósito |
|------------|---------------------|-----------|
| **Catálogo (Supabase)** | Sync Productos | Sincronizar inventario y precios |
| **Clientes (Supabase)** | Sync Clientes | Unificar base de clientes |
| **Pedidos (Supabase)** | Confirmar Pre-Pedido | Convertir conversación en pedido |
| **Webhooks de Tienda** | Automation Pedidos Web | Notificar pedidos de la web |
| **YCloud (WhatsApp)** | Agente Luz | Canal de comunicación |

---

## Habilidades y Capacidades

### 🤖 Capacidades de IA en n8n

1. **Modelos de IA utilizados**:
   - **DeepSeek**: Principal para razonamiento y respuestas
   - OpenAI GPT: (opcional, para tareas específicas)
   - Anthropic Claude: (opcional, para tareas específicas)

2. **Herramientas del Agente (Tools)**:
   - Búsqueda de productos con filtros
   - Cálculo de totales y envíos
   - Gestión de carritos
   - Consulta de estados de pedido
   - Escalado a humanos

3. **Características del Agente**:
   - Conversación con memoria histórica
   - Detección de intención
   - Respuestas contextuales
   - Soporte de multimedia (limitado)
   - Modo administrador para el director

### 🔄 Automatizaciones Programadas

| Workflow | Frecuencia | Horario (UTC-5) |
|----------|-----------|-----------------|
| Sync Productos | Cada hora | Todas las horas |
| Sync Clientes | Cada hora | Todas las horas |
| Auditoría Diaria | Diario | 6:00 AM |
| Recordatorio Carritos | Cada 4 horas | 9am, 1pm, 5pm, 9pm |
| Procesador Buffer | Cada 10 seg | Continuo |

### 🔌 Conexiones Externas

#### Supabase
- **URL**: Configurada en credenciales
- **Tablas usadas**:
  - `products`: Catálogo de productos
  - `customers`: Clientes
  - `guest_orders`: Pedidos de invitados
  - `orders`: Pedidos formales

#### PostgreSQL Local
- **Host**: Docker local
- **Tablas usadas**:
  - `clientes`: Clientes de WhatsApp
  - `productos_tienda`: Catálogo local
  - `variantes_productos`: Variantes
  - `mensaje_buffer`: Buffer de mensajes
  - `recordatorios_enviados`: Historial de recordatorios

#### YCloud (WhatsApp)
- **API**: https://api.ycloud.com/v2/whatsapp
- **Webhook**: Recibe mensajes entrantes
- **Envío**: Envía mensajes salientes

---

## 📋 Resumen de Estados

| Flujo | Estado | Frecuencia | Prioridad |
|------|--------|-----------|-----------|
| Agente Luz v6.5 | ✅ Activo | Webhook | Alta |
| Procesador Buffer | ✅ Activo | 10s | Alta |
| Tracking Respuestas | 🟡 Revisión | Evento | Media |
| Sync Productos | ✅ Activo | 1h | Alta |
| Sync Clientes Local→Supabase | ✅ Activo | 1h | Alta |
| Sync Clientes Supabase→Local | ✅ Activo | 1h | Alta |
| Confirmar Pre-Pedido | ✅ Activo | Webhook | Alta |
| Auditoría Pedidos | 🟡 Manual | Manual | Baja |
| Automation Pedidos Web | 🟡 Desarrollo | Webhook | Media |
| Recordatorio Carritos | ✅ Activo | 4h | Alta |
| Auto-etiquetar YCloud | 🟡 Desarrollo | Diario | Baja |
| Campañas | ✅ Completadas | Una vez | Baja |
| Auditoría Diaria | ✅ Activo | Diario (6am) | Alta |
| Monitor Escalados | 🟡 Desarrollo | Evento | Media |
| MCP Helper | ✅ Activo | Evento | Alta |
| Herramientas Admin | ✅ Activo | Manual | Media |

**Leyenda**:
- ✅ Activo: Funcionando correctamente
- 🟡 En desarrollo/Revisión: Pendiente de mejoras
- 📋 Plantilla: Plantilla para uso futuro

---

## 🚀 Próximos Pasos

### Mejoras Pendientes

1. **Agente Luz**:
   - [ ] Soporte completo de multimedia (imágenes)
   - [ ] Mejor detección de intención
   - [ ] Respuestas más personalizadas

2. **Sincronización**:
   - [ ] Bucle robusto de clientes
   - [ ] Detección de conflictos en productos

3. **Marketing**:
   - [ ] Auto-etiquetado completo
   - [ ] Campañas automatizadas

4. **Auditoría**:
   - [ ] Monitor de escalados activo
   - [ ] Alertas automáticas por email/Slack

---

## 📞 Soporte

Para preguntas sobre los flujos:
- Revisar la guía específica en `GUIA-*.md`
- Consultar los scripts SQL asociados
- Verificar logs en n8n

---

**Última actualización**: Febrero 2026  
**Versión del manual**: 1.0  
**n8n URL**: https://dep-n8n.n8ntusaguacates.space  
**Tienda**: https://tus-aguacates.vercel.app
