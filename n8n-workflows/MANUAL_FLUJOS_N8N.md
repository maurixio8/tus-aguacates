# 📚 Manual Completo de Flujos n8n - Tus Aguacates

**Versión:** 2.0  
**Fecha:** 08 Febrero 2026  
**Última actualización:** 08 Feb 2026  
**Autores:** Equipo de Automatización n8n

---

## 📋 Índice

1. [Introducción](#introducción)
2. [Arquitectura General](#arquitectura-general)
3. [Categorías de Flujos](#categorías-de-flujos)
4. [Credenciales Requeridas](#credenciales-requeridas)
5. [Flujo por Flujo](#flujo-por-flujo)
6. [Troubleshooting Común](#troubleshooting-común)
7. [Guías de Instalación](#guías-de-instalación)
8. [Apéndices](#apéndices)
   - [Glosario](#glosario)
   - [Referencias SQL](#referencias-sql)
   - [Contacto](#contacto)

---

## 🎯 Introducción

### ¿Qué es este manual?

Este manual documenta **TODOS** los flujos de n8n que operan en **Tus Aguacates**, una tienda en línea de productos frescos (aguacates, fresas, champiñones, etc.). El objetivo es que cualquier persona que entre al proyecto pueda entender qué hacen los flujos, cómo funcionan, y cómo mantenerlos.

### ¿Qué es n8n?

n8n es una plataforma de automatización de flujos de trabajo open-source que permite conectar diferentes servicios y aplicaciones sin código (o con poco código). En **Tus Aguacates**, n8n actúa como el "cerebro" que conecta:

- **WhatsApp** (YCloud) ← → **Tienda Online** (Supabase)
- **WhatsApp** (YCloud) ← → **Base de Datos Local** (PostgreSQL)
- **Marketing Masivo** → **Clientes**
- **Monitorización** → **Reportes**

### Propósito de los Flujos

Los flujos de n8n en este proyecto sirven para:

| Función | Descripción | Flujo Principal |
|---------|-------------|-----------------|
| **Atención al Cliente** | Bot de WhatsApp 24/7 que responde preguntas y ayuda a hacer pedidos | Agente Luz v6.5 |
| **Sincronización de Datos** | Mantiene inventario y clientes sincronizados entre sistemas | Sync Productos, Sync Clientes |
| **Marketing** | Envía campañas masivas a clientes | Campaña 500 Clientes |
| **Recuperación de Ventas** | Recupera carritos abandonados | Recordatorio Carritos |
| **Operaciones** | Herramientas administrativas para el dueño | Copiloto de Operaciones |
| **Auditoría** | Monitoriza integridad de datos | Auditoría Pedidos |

### ¿Cómo leer este manual?

1. **Principiante:** Lee [Introducción](#introducción), [Arquitectura General](#arquitectura-general), y [Categorías de Flujos](#categorías-de-flujos)
2. **Desarrollador:** Lee [Flujo por Flujo](#flujo-por-flujo) y [Referencias SQL](#referencias-sql)
3. **Soporte:** Lee [Troubleshooting Común](#troubleshooting-común)
4. **Configuración:** Lee [Guías de Instalación](#guías-de-instalación)

---

## 🏗️ Arquitectura General

### Diagrama de Arquitectura

```
┌─────────────────────────────────────────────────────────────────┐
│                    SISTEMA TUS AGUACATES                        │
│                                                                │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                   CLIENTES                               │  │
│  │                                                          │  │
│  │  ┌────────────┐       ┌────────────┐       ┌───────────┐│  │
│  │  │ WhatsApp  │       │ Web Store  │       │ Registro  ││  │
│  │  │ (YCloud)  │       │ (Vercel)   │       │  Email    ││  │
│  │  └─────┬──────┘       └──────┬─────┘       └─────┬─────┘│  │
│  └────────┼─────────────────────┼─────────────────────┼──────┘  │
│           │                     │                     │        │
│           ▼                     ▼                     ▼        │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                      N8N AUTOMATION                       │  │
│  │                                                            │  │
│  │  ┌──────────────────────────────────────────────────┐   │  │
│  │  │  🤖 AGENTE LUZ v6.5 (Bot de WhatsApp)            │   │  │
│  │  │  - Atención al cliente 24/7                       │   │  │
│  │  │  - Búsqueda de productos                          │   │  │
│  │  │  - Gestión de carritos                            │   │  │
│  │  │  - Escalado a humanos                             │   │  │
│  │  │  - 🧠 Copiloto (herramientas admin)              │   │  │
│  │  └──────────────────────────────────────────────────┘   │  │
│  │                                                            │  │
│  │  ┌──────────────────────────────────────────────────┐   │  │
│  │  │  🔄 SYNC SYSTEMS (Sincronización)               │   │  │
│  │  │  - Productos: Supabase ↔ PostgreSQL              │   │  │
│  │  │  - Clientes: Web ↔ WhatsApp ↔ Base de Datos      │   │  │
│  │  └──────────────────────────────────────────────────┘   │  │
│  │                                                            │  │
│  │  ┌──────────────────────────────────────────────────┐   │  │
│  │  │  📢 MARKETING (Campañas)                         │   │  │
│  │  │  - Lanzamiento de tienda                         │   │  │
│  │  │  - Campañas especiales                           │   │  │
│  │  │  - Recordatorios de carritos                    │   │  │
│  │  └──────────────────────────────────────────────────┘   │  │
│  │                                                            │  │
│  │  ┌──────────────────────────────────────────────────┐   │  │
│  │  │  📊 AUDITORÍA & MONITORIZACIÓN                   │   │  │
│  │  │  - Integridad de datos                           │   │  │
│  │  │  - Reportes diarios                              │   │  │
│  │  │  - Alertas de problemas                          │   │  │
│  │  └──────────────────────────────────────────────────┘   │  │
│  │                                                            │  │
│  └──────────────────────────────────────────────────────────┘  │
│           │                     │                     │        │
│           ▼                     ▼                     ▼        │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    BASES DE DATOS                        │  │
│  │                                                           │  │
│  │  ┌─────────────────┐       ┌─────────────────────┐      │  │
│  │  │   SUPABASE      │       │    POSTGRESQL       │      │  │
│  │  │   (Cloud)       │       │     (Local)         │      │  │
│  │  │                 │       │                     │      │  │
│  │  │ • products      │       │ • clientes          │      │  │
│  │  │ • customers     │◄──────│ • productos_local   │      │  │
│  │  │ • guest_orders  │       │ • pre_pedidos       │      │  │
│  │  │ • categories    │       │ • recordatorios_enviados│    │  │
│  │  └─────────────────┘       └─────────────────────┘      │  │
│  │                                                           │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                │
└─────────────────────────────────────────────────────────────────┘
```

### Conexiones Externas

```
n8n
├─► YCloud API (WhatsApp Business)
│   ├─ Mensajes entrantes (webhook)
│   └─ Mensajes salientes (HTTP POST)
│
├─► Supabase API (Base de datos cloud)
│   ├─ REST API (products, customers, orders)
│   └─ RPC Functions (search_products, get_variants)
│
├─► PostgreSQL (Base de datos local Docker)
│   ├─ Clientes (WhatsApp)
│   ├─ Productos (copia local)
│   └─ Pre-pedidos (carritos en progreso)
│
├─► DeepSeek API (Modelo de IA)
│   └─ Procesamiento de lenguaje natural
│
└─► Tienda Web (Webhooks)
    └─ Notificaciones de pedidos
```

---

## 📂 Categorías de Flujos

### 1. 🤖 Agente Luz (Atención al Cliente)

**Propósito:** Sistema principal de IA para atención al cliente por WhatsApp 24/7.

**Resumen de Versiones:**

| Versión | Fecha | Estado | Cambios Principales |
|---------|-------|--------|---------------------|
| v3 | Dic 2024 | 🔄 Reemplazado | Migración a YCloud, integración con Supabase |
| v4 | Dic 2024 | 🔄 Reemplazado | Integración del Copiloto en el mismo flujo |
| v5 | Dic 2024 | 🔄 Reemplazado | Mejoras en pre-procesamiento y buffer |
| v6.2 | Ene 2026 | 🔄 Reemplazado | Correcciones de errores |
| v6.3 | Ene 2026 | 🔄 Reemplazado | Búsqueda mejorada con normalización de plulares |
| v6.4 | Ene 2026 | 🔄 Reemplazado | Variantes completas de productos |
| v6.5 | Ene 2026 | ✅ Activo | Herramientas de Admin Copiloto |

**Archivos:**

| Flujo | Versión | Estado | Descripción |
|-------|---------|--------|-------------|
| `🥑 Agente Luz v6.5 - Con Herramientas Admin Copiloto.json` | 6.5 | ✅ Activo | Versión más reciente con herramientas admin y copiloto |
| `Agente Luz v6.5 - Con Herramientas Admin Copiloto (1).json` | 6.5 | ✅ Activo | Copia de seguridad de la versión 6.5 |
| `agente-luz-v6.5-admin-copiloto.json` | 6.5 | 🔄 Reemplazado | Versión previa de 6.5 |
| `agente-luz-v6.4-variantes-completas.json` | 6.4 | 🔄 Reemplazado | Soporte completo de variantes |
| `agente-luz-v6.3-busqueda-mejorada.json` | 6.3 | 🔄 Reemplazado | Mejoras en búsqueda de productos |
| `agente-luz-v6.2-corregido.json` | 6.2 | 🔄 Reemplazado | Correcciones de errores |
| `agente-luz-v6-Mejorado.json` | 6.0 | 🔄 Reemplazado | Versión mejorada |
| `Agente-Luz-v5-Hibrido-Copiloto.json` | 5.0 | 🔄 Reemplazado | Versión híbrida con copiloto |
| `agente-luz-v5-con-copiloto-TEMP.json` | 5.0 | 🔄 Reemplazado | Versión temporal |
| `agente-luz-v4-hibrido.json` | 4.0 | 🔄 Reemplazado | Versión híbrida |
| `agente-luz-v3-ycloud.json` | 3.0 | 🔄 Reemplazado | Primera versión con YCloud |
| `agente-whatsapp-mvp.json` | MVP | 🔄 Reemplazado | Versión mínima viable |
| `unico 316 (2).json` | Legacy | 🔄 Reemplazado | Versión original con WAHA |

**Componentes del Agente Luz:**

```
📥 Webhook YCloud
   ↓
1. Pre-procesamiento (detecta tipo de mensaje, modo admin/cliente)
   ↓
❓ ¿Es Media? (filtra imágenes, audio, video, sticker)
   ↓ Si/No
   ↓ Si: Respuesta "solo texto soportado"
   ↓ No: Continúa
   ↓
❓ ¿Es Copiloto? (detecta si es el dueño)
   ↓ Si/No
   ↓ Si: → Copiloto (herramientas admin)
   ↓ No: → Agente IA (atención al cliente)
   ↓
🧠 Agente IA (DeepSeek)
   ├─ System Message (prompt de atención al cliente)
   ├─ Herramientas (function calling)
   │   ├─ TOOL_BuscarProductos
   │   ├─ TOOL_ConsultarPedido
   │   ├─ TOOL_AnadirAlCarrito
   │   ├─ TOOL_CalcularTotalPrePedido
   │   ├─ TOOL_GuardarNombreCliente
   │   ├─ TOOL_CambiarEstadoCliente
   │   ├─ TOOL_EscalarServicio
   │   ├─ TOOL_Etiquetar
   │   └─ TOOL_BorrarMemoria
   └─ Memoria (buffer window)
   ↓
📤 Preparar Respuesta YCloud
   ↓
📱 Enviar WhatsApp YCloud
```

**Estados del Cliente:**

```
NUEVO
   ↓
NOMBRE_SOLICITADO
   ↓
ATENCION_LUZ
   ├─→ EN_PEDIDO → PEDIDO_FINALIZADO
   └─→ ESCALADO
```

**Herramientas del Agente:**

| Herramienta | Descripción | Parámetros |
|-------------|-------------|------------|
| `TOOL_BuscarProductos` | Busca productos en Supabase | `termino_busqueda` |
| `TOOL_BuscarConocimiento` | Consulta información de la empresa | `pregunta` |
| `TOOL_GuardarNombreCliente` | Guarda nombre del cliente | `nombre` |
| `TOOL_AnadirAlCarrito` | Añade producto al pre-pedido | `producto_id`, `cantidad` |
| `TOOL_CalcularTotalPrePedido` | Calcula total del carrito | Ninguno |
| `TOOL_CambiarEstadoCliente` | Cambia estado del cliente | `nuevo_estado` |
| `TOOL_ConsultarPedido` | Consulta pedidos existentes | `pedido_id` |
| `TOOL_EscalarServicio` | Escala a humano | `motivo` |
| `TOOL_Etiquetar` | Etiqueta cliente en YCloud | `etiqueta` |
| `TOOL_BorrarMemoria` | Borra memoria del chat | Ninguno |

**Características Especiales:**

- **Detección de múltiples productos:** Entiende "aguacates y fresas"
- **Respuestas interactivas:** Botones y listas en WhatsApp
- **Soporte de variantes:** Maneja variantes de productos (tamaño, presentación)
- **Prefijo de modo cliente:** El dueño puede usar `>` para interactuar como cliente
- **Copia de seguridad de memoria:** Usa Buffer Window para mantener contexto
- **Escalado inteligente:** Detecta cuándo escalar a humano

---

### 2. 🔄 Sincronización de Datos

**Propósito:** Mantener datos sincronizados entre Supabase, PostgreSQL y sistemas externos.

**Archivos:**

| Flujo | Frecuencia | Estado | Descripción |
|-------|-----------|--------|-------------|
| `workflow-sync-productos.json` | Cada 1 hora | ✅ Activo | Sincroniza productos de Supabase a PostgreSQL local |
| `workflow-sync-productos-v2-simple.json` | Manual | ✅ Activo | Sincronización v2 simple con mejor manejo de errores |
| `sync-productos-variantes-completo.json` | Manual | ✅ Activo | Sincronización completa con variantes |
| `sync-productos-listo.json` | Manual | ✅ Activo | Versión lista de sincronización de productos |
| `workflow-sync-clientes-local-to-supabase.json` | Manual | ✅ Activo | Sincroniza clientes de local a Supabase |
| `workflow-sync-clientes-supabase-to-local.json` | Manual | ✅ Activo | Sincroniza clientes de Supabase a local |
| `workflow-sync-clientes-supabase-to-local-PART-2` | Manual | ✅ Activo | Parte 2 de sincronización de clientes |
| `workflow-sync-clientes-bucle-robusto.json` | Manual | ✅ Activo | Versión robusta con bucle de reintento |
| `workflow-sync-FIXED.json` | Manual | ✅ Activo | Versión corregida de sincronización |

**Flujo de Sincronización de Productos:**

```
⏰ Trigger (Schedule)
   ↓
📥 Obtener Productos Supabase
   ├─ SELECT * FROM products
   ├─ ORDER BY created_at DESC
   └─ LIMIT 500
   ↓
🔄 Transformar Datos
   ├─ Mapear campos
   ├─ Normalizar datos
   └─ Agregar metadata
   ↓
📤 Insertar/Actualizar en PostgreSQL
   ├─ UPSERT en tabla productos_local
   ├─ ON CONFLICT (supabase_id) DO UPDATE
   └─ Retornar resultados
```

**Datos Sincronizados de Productos:**

- `supabase_id` - ID original de Supabase (UUID)
- `nombre` - Nombre del producto
- `slug` - Slug de URL
- `descripcion` - Descripción
- `precio` - Precio base (NUMERIC)
- `precio_descuento` - Precio con descuento
- `nombre_categoria` - Nombre de categoría
- `id_categoria` - ID de categoría
- `url_imagen_principal` - URL de imagen principal
- `stock` - Stock disponible (INTEGER)
- `activo` - Estado activo/inactivo (BOOLEAN)
- `destacado` - Producto destacado (BOOLEAN)
- `disponible_para` - Disponibilidad (web/whatsapp/both)
- `unidad` - Unidad de medida
- `organico` - Es orgánico (BOOLEAN)
- `peso` - Peso
- `cantidad_minima` - Cantidad mínima

**Flujo de Sincronización de Clientes:**

```
📥 Obtener Clientes desde Origen
   ├─ Supabase: SELECT * FROM customers
   └─ PostgreSQL: SELECT * FROM clientes
   ↓
🔄 Transformar Datos
   ├─ Normalizar teléfonos (quitar +, espacios)
   ├─ Mapear campos
   └─ Enrich con datos adicionales
   ↓
📤 Insertar/Actualizar en Destino
   ├─ UPSERT (INSERT ON CONFLICT UPDATE)
   ├─ Vincular supabase_id si aplica
   └─ Retornar resultados
```

**Datos Sincronizados de Clientes:**

- `telefono` - Número de teléfono (clave única)
- `nombre` - Nombre del cliente
- `email` - Correo electrónico (opcional)
- `direccion` - Dirección de entrega (opcional)
- `estado_conversacion` - Estado actual de la conversación
- `total_pedidos` - Total de pedidos realizados
- `total_gastado` - Monto total gastado
- `supabase_id` - ID vinculado a Supabase (opcional)
- `activo` - Cliente activo/inactivo

**Campos de Vinculación:**

```sql
-- En PostgreSQL local
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS supabase_id UUID;
CREATE INDEX IF NOT EXISTS idx_clientes_supabase_id ON clientes(supabase_id);

-- Para vincular
UPDATE clientes c
SET supabase_id = s.id
FROM customers s
WHERE REPLACE(REPLACE(c.telefono, '+', ''), ' ', '') = REPLACE(REPLACE(s.phone, '+', ''), ' ', '');
```

---

### 3. 🛒 Automatización de Pedidos

**Propósito:** Procesar pedidos web y notificar al equipo.

**Archivos:**

| Flujo | Trigger | Estado | Descripción |
|-------|---------|--------|-------------|
| `automation-pedidos-web.json` | Webhook | 🔄 Configurar | Recibe pedidos web, limpia datos y notifica |
| `workflow-confirmar-prepedido.json` | Manual | ✅ Activo | Confirma pre-pedidos desde WhatsApp |
| `workflow-procesar-buffer.json` | Manual | ✅ Activo | Procesa buffer de mensajes |

**Flujo de Pedidos Web:**

```
📥 Webhook (POST)
   ↓
🧹 Limpiar Datos
   ├─ Validar campos
   ├─ Normalizar formatos
   └─ Sanear datos
   ↓
📦 Obtener Detalles del Pedido
   ├─ Cliente
   ├─ Productos
   └─ Total
   ↓
💰 Procesar Pago
   ├─ Verificar método de pago
   └─ Validar monto
   ↓
📧 Notificar al Cliente
   ├─ Email de confirmación
   └─ WhatsApp de confirmación
   ↓
📊 Registrar en Base de Datos
   ├─ Guardar pedido
   └─ Actualizar inventario
   ↓
📱 Notificar al Equipo
   └─ Mensaje al dueño
```

---

### 4. 📢 Marketing y Campañas

**Propósito:** Enviar campañas masivas a clientes.

**Archivos:**

| Flujo | Trigger | Estado | Descripción |
|-------|---------|--------|-------------|
| `campana-500-clientes-invitatienda.json` | Manual | ✅ Activo | Campaña de lanzamiento de tienda (500 clientes) |
| `campana-navidad-151-clientes.json` | Manual | ✅ Activo | Campaña navideña (151 clientes) |
| `campana-masiva-anti-duplicados.json` | Manual | ✅ Activo | Campaña masiva con prevención de duplicados |

**Flujo de Campaña:**

```
▶️ Iniciar Campaña (Manual)
   ↓
📋 Obtener Segmento de Clientes
   ├─ Criterios de segmentación
   │   ├─ Activos
   │   ├─ Con nombre
   │   ├─ Teléfono válido
   │   └─ Ordenados por pedidos/gasto
   ├─ Límite (ej: 500)
   └─ Filtros adicionales
   ↓
🔧 Preparar Mensajes
   ├─ Template de WhatsApp
   ├─ Personalización (nombre, etc.)
   └─ Añadir imágenes/multimedia
   ↓
📦 Dividir en Lotes
   ├─ Lote 1: 1-50
   ├─ Lote 2: 51-100
   └─ ...
   ↓
📤 Enviar Mensaje YCloud
   ├─ HTTP POST a YCloud API
   ├─ Headers: X-API-Key
   └─ Body: JSON con mensaje
   ↓
✅ Registrar Envíos
   ├─ Marcar como enviado
   ├─ Guardar fecha/hora
   └─ Registrar respuesta
```

**Template de Campaña (Ejemplo):**

```
🥑 Hola [Nombre],

¡Te invitamos a conocer nuestra nueva tienda online! 

🛒 Visítanos en: tus-aguacates.vercel.app

✨ Beneficios:
• Ahorra tiempo pidiendo desde tu celular
• Catálogo completo de productos frescos
• Entrega a domicilio

💚 Tus Aguacates - Frescos y Deliciosos
```

**Criterios de Segmentación:**

- **Cliente activo:** `activo = true`
- **Teléfono válido:** Longitud ≥ 10 dígitos
- **Nombre disponible:** `nombre IS NOT NULL AND nombre != ''`
- **Ordenado por:** `total_pedidos DESC, total_gastado DESC`
- **Límite:** 500 clientes (configurable)

---

### 5. 🔔 Recordatorios y Recuperación

**Propósito:** Recuperar ventas mediante recordatorios automáticos.

**Archivos:**

| Flujo | Trigger | Estado | Descripción |
|-------|---------|--------|-------------|
| `workflow-recordatorio-carritos.json` | Cada 4 horas | ✅ Activo | Envía recordatorios de carritos abandonados |

**Flujo de Recordatorios:**

```
⏰ Trigger (Schedule: 9am, 1pm, 5pm, 9pm hora Colombia)
   ↓
🔍 Buscar Carritos Abandonados
   ├─ Estado del cliente: EN_PEDIDO
   ├─ Pre-pedido tiene productos
   ├─ Inactivo por 2-23 horas
   ├─ No se ha enviado recordatorio hoy
   └─ Límite: 20 clientes por ejecución
   ↓
🔧 Preparar Mensajes
   ├─ Template de recordatorio
   ├─ Personalizar (nombre, productos)
   └─ Añadir botón de acción
   ↓
📦 Dividir en Lotes
   └─ Lotes de 1 para evitar rate limiting
   ↓
📤 Enviar Recordatorio YCloud
   ├─ HTTP POST a YCloud API
   └─ Body: JSON con mensaje
   ↓
✅ Registrar Envío
   ├─ Insertar en recordatorios_enviados
   └─ Marcar fecha/hora
```

**Criterios de Selección:**

```sql
SELECT c.telefono, c.nombre, pp.*
FROM clientes c
JOIN pre_pedidos pp ON pp.cliente_id = c.id
WHERE c.estado_conversacion = 'EN_PEDIDO'
  AND pp.productos IS NOT NULL AND pp.productos != '[]'::jsonb
  AND pp.ultima_actualizacion < NOW() - INTERVAL '2 hours'
  AND pp.ultima_actualizacion > NOW() - INTERVAL '23 hours'
  AND NOT EXISTS (
    SELECT 1 FROM recordatorios_enviados re
    WHERE re.cliente_id = c.id
      AND re.fecha_envio::date = CURRENT_DATE
  )
  AND c.activo = true
LIMIT 20;
```

**Template de Recordatorio:**

```
🥑 ¡Hola [Nombre]!

Veo que dejaste algunos productos en tu carrito. 
¿Te gustaría completar tu pedido?

🛒 [Ver Carrito] - https://tus-aguacates.vercel.app/carrito

[📞 Contactar] - https://wa.me/57XXXXXXXXXX

💚 Tus Aguacates
```

---

### 6. 📊 Auditoría y Monitorización

**Propósito:** Monitorizar integridad de datos y generar reportes.

**Archivos:**

| Flujo | Trigger | Estado | Descripción |
|-------|---------|--------|-------------|
| `workflow-auditoria-pedidos.json` | Webhook | ✅ Activo | Auditoría de pedidos históricos |
| `workflow-audit-integrity-daily.json` | Diario | ✅ Activo | Auditoría diaria de integridad |
| `monitor-escalados-workflow.json` | Manual | ✅ Activo | Monitoriza casos escalados |
| `workflow-tracking-respuestas.json` | Manual | ✅ Activo | Rastrea respuestas de campañas |

**Flujo de Auditoría de Pedidos:**

```
🎯 Iniciar Auditoría (Webhook)
   ↓
📦 Obtener Todos los Pedidos
   ├─ Supabase: guest_orders
   ├─ Filtrar por rango de fechas
   └─ Ordenar por fecha
   ↓
💰 Obtener Catálogo Actual
   ├─ Supabase: products
   ├─ Incluye variantes
   └─ Precios actuales
   ↓
🔍 Comparar y Detectar
   ├─ Productos eliminados en pedidos
   ├─ Precios desactualizados
   ├─ Variantes inexistentes
   ├─ Estados inválidos
   └─ Datos inconsistentes
   ↓
📊 Generar Reporte
   ├─ Formato JSON
   ├─ Estadísticas
   ├─ Problemas encontrados
   └─ Recomendaciones
   ↓
📧 Notificar al Equipo
   └─ Email con reporte
```

**Problemas Detectados:**

1. **Productos eliminados:** Productos en pedidos que ya no existen
2. **Precios desactualizados:** Precios en pedidos diferentes a precios actuales
3. **Variantes inexistentes:** Variantes en pedidos que no existen en catálogo
4. **Estados inválidos:** Estados de pedido que no corresponden al flujo
5. **Datos inconsistentes:** Datos que no coinciden entre sistemas

---

### 7. 🔧 Helpers y Utilidades

**Propósito:** Flujos de soporte y mantenimiento.

**Archivos:**

| Flujo | Trigger | Estado | Descripción |
|-------|---------|--------|-------------|
| `mcp-helper-workflow.json` | Manual | ✅ Activo | Helper para integración MCP |
| `mcp-helper-v2.json` | Manual | ✅ Activo | Helper MCP v2 |
| `workflow-auto-etiquetar-ycloud.json` | Manual | ✅ Activo | Etiquetado automático en YCloud |
| `nodo-pulidor-respuestas.json` | Componente | ✅ Activo | Nodo para pulir respuestas de IA |
| `nodos-copiloto-para-agregar.json` | Componente | ✅ Activo | Nodos del copiloto para importar |
| `herramientas-admin-copiloto.json` | Componente | ✅ Activo | Herramientas administrativas |

---

## 🔐 Credenciales Requeridas

### Credenciales Principales

| Credencial | Tipo | ID (Ejemplo) | Descripción |
|------------|------|-------------|-------------|
| **YCloud API Key** | HTTP Header Auth | `YCloudApi` | API key para WhatsApp YCloud |
| **Supabase API Key** | HTTP Header Auth | `Supabase account 2` | API key de Supabase (anon/service) |
| **Supabase DB** | Postgres | `Supabase - Tus Aguacates` | Conexión directa a PostgreSQL Supabase |
| **PostgreSQL Docker** | PostgreSQL | `R6hc0vEZJhKQSi3G` | PostgreSQL local (Docker) |
| **DeepSeek API** | HTTP Request | `DeepSeek account 2` | Modelo de IA DeepSeek |
| **OpenAI API** | OpenAI | - | GPT-4o-mini (opcional, alternativo) |

### Headers de Credenciales

#### YCloud
- **Header Name:** `X-API-Key`
- **Header Value:** Tu API key de YCloud Dashboard

#### Supabase
- **Header Name:** `apikey`
- **Header Value:** Tu anon key o service role key

#### DeepSeek
- **Header Name:** `Authorization`
- **Header Value:** `Bearer YOUR_API_KEY`

### Configuración de Credenciales

#### Paso 1: Credencial YCloud

1. Ve a [YCloud Dashboard](https://dashboard.ycloud.com)
2. Navega a Settings → API Keys
3. Copia tu API key
4. En n8n: Credentials → New Credential
5. Tipo: "HTTP Header Auth"
6. Name: `YCloudApi`
7. Header Name: `X-API-Key`
8. Header Value: [Pegar API key]

#### Paso 2: Credencial Supabase

1. Ve a [Supabase Dashboard](https://app.supabase.com)
2. Navega a Settings → API
3. Copia "anon" key o "service_role" key
4. En n8n: Credentials → New Credential
5. Tipo: "HTTP Header Auth"
6. Name: `Supabase account 2`
7. Header Name: `apikey`
8. Header Value: [Pegar API key]

#### Paso 3: Credencial Supabase DB

1. En Supabase Dashboard → Settings → Database
2. Copia Connection String
   - Host: `db.[tu-proyecto].supabase.co`
   - Port: `5432` (o `6543` para pooler)
   - Database: `postgres`
   - User: `postgres`
   - Password: [Tu password]
3. En n8n: Credentials → New Credential
4. Tipo: "Postgres"
5. Name: `Supabase - Tus Aguacates`
6. Configurar campos del connection string
7. SSL: Activado

#### Paso 4: Credencial PostgreSQL Local

1. En n8n: Credentials → New Credential
2. Tipo: "Postgres"
3. Name: `Mi PostgreSQL Docker`
4. Host: `localhost` o tu host
5. Port: `5432`
6. Database: `tus_aguacates`
7. User: `postgres`
8. Password: [Tu contraseña]

#### Paso 5: Credencial DeepSeek

1. Ve a [DeepSeek Platform](https://platform.deepseek.com)
2. Copia tu API key
3. En n8n: Credentials → New Credential
4. Tipo: "HTTP Header Auth"
5. Name: `DeepSeek account 2`
6. Header Name: `Authorization`
7. Header Value: `Bearer [Pegar API key]`

---

## 📖 Flujo por Flujo

### 🤖 1. Agente Luz v6.5 - Con Herramientas Admin Copiloto

**Archivo:** `🥑 Agente Luz v6.5 - Con Herramientas Admin Copiloto.json`

**Propósito:**
Sistema de atención al cliente por WhatsApp impulsado por IA (DeepSeek). Responde preguntas de clientes, busca productos, gestiona carritos y escala a humanos cuando es necesario. Incluye un "Copiloto" que permite al dueño gestionar datos mediante comandos de WhatsApp.

**Trigger:**
- Webhook HTTP (recibe mensajes de YCloud)

**Principales Nodos:**

1. **📥 Webhook YCloud**
   - Recibe mensajes entrantes de WhatsApp
   - HTTP Method: POST
   - Path: ycloud
   - Response Mode: responseNode

2. **✅ Responder OK**
   - Responde inmediatamente al webhook (200 OK)
   - Previene timeouts de YCloud

3. **1. Pre-procesamiento YCloud** (Code Node)
   - Filtra mensajes
   - Detecta modo admin/cliente
   - Prepara contexto
   - Detecta múltiples productos
   - Normaliza texto

4. **❓ ¿Es Media?** (IF Node)
   - Filtra imágenes/videos no soportados
   - Condiciones: esImagen, esDocumento, esAudio, esVideo, esSticker

5. **🧠 Agente Luz (DeepSeek)** (AI Agent)
   - Procesa mensajes con IA
   - System Message: Prompt de atención al cliente
   - Tools: Function calling
   - Memory: Buffer Window (sessionKey: based on phone number)

6. **🧠 Copiloto de Operaciones** (AI Agent - Solo para dueño)
   - Herramientas administrativas
   - Detecta comandos del dueño
   - Solo funciona desde número de Mauricio

7. **🔧 Herramientas Agente** (Postgres Tools)
   - TOOL_BuscarProductos
   - TOOL_BuscarConocimiento
   - TOOL_GuardarNombreCliente
   - TOOL_AnadirAlCarrito
   - TOOL_CalcularTotalPrePedido
   - TOOL_CambiarEstadoCliente
   - TOOL_ConsultarPedido
   - TOOL_EscalarServicio
   - TOOL_Etiquetar
   - TOOL_BorrarMemoria

8. **📤 Enviar Respuesta YCloud** (HTTP Request)
   - Envia respuesta a WhatsApp
   - POST a `https://api.ycloud.com/v2/whatsapp/messages`
   - Headers: X-API-Key

**Modos de Operación:**

- **Modo Cliente (prefijo `>`):**
  - El dueño puede interactuar como cliente
  - Ejemplo: `>Quiero 2kg de aguacates`
  - Útil para pruebas y debug

- **Modo Copiloto (número de Mauricio):**
  - Mensajes desde `+57 320 306 2007` activan modo admin
  - Comandos disponibles:
    - "Dame los clientes sin nombre"
    - "Actualizar datos de [teléfono] con nombre [nombre]"
    - "Cuántos clientes tenemos en total"
    - "Mostrar clientes con más pedidos"

**Herramientas del Agente:**

| Herramienta | Función | SQL / Código |
|-------------|---------|--------------|
| `TOOL_BuscarProductos` | Busca productos en Supabase | `SELECT * FROM search_products($1)` |
| `TOOL_BuscarConocimiento` | Consulta información de la empresa | Query PostgreSQL local |
| `TOOL_GuardarNombreCliente` | Guarda nombre del cliente | `UPDATE clientes SET nombre = $1 WHERE telefono = $2` |
| `TOOL_AnadirAlCarrito` | Añade productos al pre-pedido | Insert/Update en pre_pedidos |
| `TOOL_CalcularTotalPrePedido` | Calcula total del carrito | SUM de productos en pre_pedidos |
| `TOOL_CambiarEstadoCliente` | Cambia estado del cliente | `UPDATE clientes SET estado_conversacion = $1` |
| `TOOL_ConsultarPedido` | Consulta pedidos existentes | SELECT FROM guest_orders |
| `TOOL_EscalarServicio` | Escala a humano | Notifica al dueño |
| `TOOL_Etiquetar` | Etiqueta cliente en YCloud | Llama YCloud API |
| `TOOL_BorrarMemoria` | Borra memoria del chat | Limpia buffer window |

**Estados del Cliente:**

```
NUEVO → NOMBRE_SOLICITADO → ATENCION_LUZ → EN_PEDIDO → PEDIDO_FINALIZADO
                                       ↓
                                   ESCALADO
```

**Configuración del Webhook YCloud:**

1. Activa el flujo en n8n
2. Copia la URL del webhook (nodo "📥 Webhook YCloud")
3. En YCloud Dashboard → Webhooks → Add Webhook
4. Event: `whatsapp.inbound_message.received`
5. URL: La URL copiada de n8n
6. Activa el webhook

**Dependencias:**

- Función Supabase `search_products(search_term)`
- Tabla PostgreSQL: `clientes`
- Tabla PostgreSQL: `recordatorios_enviados`
- Tabla PostgreSQL: `pre_pedidos`

**Características Especiales:**

- **Detección de múltiples productos:**
  ```javascript
  // Entiende "aguacates y fresas"
  const separadores = /\s+(?:y|o|,)\s+/gi;
  const tieneMultiplesProductos = separadores.test(terminoBusqueda);
  ```

- **Normalización de plulares:**
  ```javascript
  // Aguacates → Aguacate
  if (palabra.endsWith('s') && palabra.length > 3) {
      return palabra.slice(0, -1);
  }
  ```

- **Lista de palabras a ignorar:**
  - Artículos (el, la, los, las)
  - Verbos (quiero, necesito, buscar)
  - Preposiciones (de, en, con)
  - Pronombres (yo, tú, me, te)
  - Adverbios (muy, más, también)
  - Y muchos más...

- **Saludos inteligentes:**
  ```javascript
  // Según hora Colombia (UTC-5)
  if (horaCol < 12) saludo = 'Buenos días';
  else if (horaCol < 19) saludo = 'Buenas tardes';
  else saludo = 'Buenas noches';
  ```

---

### 🔄 2. Sync Productos Supabase → Local

**Archivo:** `workflow-sync-productos.json`

**Propósito:**
Sincroniza el catálogo de productos desde Supabase hacia PostgreSQL local cada hora para asegurar disponibilidad offline y rapidez en búsquedas.

**Trigger:**
- Schedule (cada 1 hora)
- Cron: `0 * * * *` (cada hora en punto)

**Principales Nodos:**

1. **⏰ Cada Hora** (Schedule Trigger)
   - Trigger programado
   - Ejecuta cada hora

2. **📥 Obtener Productos Supabase** (HTTP Request)
   - GET desde Supabase REST API
   - Endpoint: `/rest/v1/products`
   - Query Parameters:
     - `select`: `*`
     - `order`: `created_at.desc`
     - `limit`: `500`
   - Headers: `apikey`

3. **🔄 Transformar Datos** (Code Node)
   - Transforma al formato PostgreSQL
   - Mapea campos:
     - `id` → `supabase_id`
     - `name` → `nombre`
     - `price` → `precio`
     - `discount_price` → `precio_descuento`
     - `is_active` → `activo`
     - `is_featured` → `destacado`
     - etc.

4. **📤 Insertar en PostgreSQL** (Postgres)
   - UPSERT en tabla `productos_tienda`
   - Query:
     ```sql
     INSERT INTO productos_tienda (
       supabase_id, nombre, slug, descripcion, precio, precio_descuento,
       nombre_categoria, id_categoria, url_imagen_principal, stock, activo,
       destacado, disponible_para, unidad, organico, peso, cantidad_minima
     ) VALUES (
       $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17
     )
     ON CONFLICT (supabase_id) DO UPDATE SET
       nombre = EXCLUDED.nombre,
       precio = EXCLUDED.precio,
       -- ... otros campos
     ```

**Datos Sincronizados:**

| Campo PostgreSQL | Campo Supabase | Tipo | Descripción |
|-----------------|----------------|------|-------------|
| `supabase_id` | `id` | UUID | ID original de Supabase |
| `nombre` | `name` | VARCHAR(255) | Nombre del producto |
| `slug` | `slug` | VARCHAR(255) | Slug de URL |
| `descripcion` | `description` | TEXT | Descripción |
| `precio` | `price` | NUMERIC | Precio base |
| `precio_descuento` | `discount_price` | NUMERIC | Precio con descuento |
| `nombre_categoria` | `categories.name` | VARCHAR(100) | Nombre de categoría |
| `id_categoria` | `category_id` | INTEGER | ID de categoría |
| `url_imagen_principal` | `main_image_url` | VARCHAR(500) | URL de imagen principal |
| `stock` | `stock` | INTEGER | Stock disponible |
| `activo` | `is_active` | BOOLEAN | Estado activo/inactivo |
| `destacado` | `is_featured` | BOOLEAN | Producto destacado |
| `disponible_para` | `available_for` | VARCHAR(20) | Disponibilidad (web/whatsapp/both) |
| `unidad` | `unit` | VARCHAR(20) | Unidad de medida |
| `organico` | `is_organic` | BOOLEAN | Es orgánico |
| `peso` | `weight` | NUMERIC | Peso |
| `cantidad_minima` | `min_quantity` | INTEGER | Cantidad mínima |

**Tabla PostgreSQL:**

```sql
CREATE TABLE IF NOT EXISTS productos_tienda (
    id SERIAL PRIMARY KEY,
    supabase_id UUID UNIQUE,
    nombre VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE,
    descripcion TEXT,
    precio NUMERIC NOT NULL,
    precio_descuento NUMERIC,
    nombre_categoria VARCHAR(100),
    id_categoria INTEGER,
    url_imagen_principal VARCHAR(500),
    stock INTEGER DEFAULT 0,
    activo BOOLEAN DEFAULT true,
    destacado BOOLEAN DEFAULT false,
    disponible_para VARCHAR(20) DEFAULT 'both',
    unidad VARCHAR(20),
    organico BOOLEAN DEFAULT false,
    peso NUMERIC,
    cantidad_minima INTEGER DEFAULT 1,
    ultima_actualizacion TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_productos_tienda_supabase_id ON productos_tienda(supabase_id);
CREATE INDEX IF NOT EXISTS idx_productos_tienda_activo ON productos_tienda(activo);
```

---

### 🛒 3. Recordatorio Carritos Abandonados

**Archivo:** `workflow-recordatorio-carritos.json`

**Propósito:**
Recupera ventas enviando recordatorios automáticos a clientes que dejaron carritos abandonados por más de 2 horas.

**Trigger:**
- Schedule (4 veces al día: 9am, 1pm, 5pm, 9pm hora Colombia)
- Cron: `0 9,13,17,21 * * *` (UTC-5)

**Principales Nodos:**

1. **⏰ Cada 4 Horas** (Schedule Trigger)
   - Trigger programado
   - Ejecuta 4 veces al día

2. **🔍 Buscar Carritos Abandonados** (Postgres)
   - Consulta PostgreSQL
   - Query:
     ```sql
     SELECT c.telefono, c.nombre, pp.productos, pp.ultima_actualizacion
     FROM clientes c
     JOIN pre_pedidos pp ON pp.cliente_id = c.id
     WHERE c.estado_conversacion = 'EN_PEDIDO'
       AND pp.productos IS NOT NULL AND pp.productos != '[]'::jsonb
       AND pp.ultima_actualizacion < NOW() - INTERVAL '2 hours'
       AND pp.ultima_actualizacion > NOW() - INTERVAL '23 hours'
       AND NOT EXISTS (
         SELECT 1 FROM recordatorios_enviados re
         WHERE re.cliente_id = c.id
           AND re.fecha_envio::date = CURRENT_DATE
       )
       AND c.activo = true
     LIMIT 20;
     ```

3. **🔧 Preparar Mensajes** (Code Node)
   - Prepara mensaje personalizado
   - Formato:
     ```
     🥑 ¡Hola [Nombre]!

     Veo que dejaste algunos productos en tu carrito.
     ¿Te gustaría completar tu pedido?

     🛒 [Ver Carrito]
     ```

4. **📦 Dividir en Lotes** (Split in Batches)
   - Envía en lotes de 1
   - Evita rate limiting de YCloud

5. **📤 Enviar Recordatorio YCloud** (HTTP Request)
   - Envía via YCloud API
   - POST `https://api.ycloud.com/v2/whatsapp/messages`
   - Headers: X-API-Key
   - Body:
     ```json
     {
       "to": "+57XXXXXXXXXX",
       "type": "text",
       "text": {
         "body": "[Mensaje personalizado]"
       }
     }
     ```

6. **✅ Registrar Envío** (Postgres)
   - Guarda en `recordatorios_enviados`
   - Insert:
     ```sql
     INSERT INTO recordatorios_enviados (cliente_id, fecha_envio, mensaje)
     VALUES ($1, NOW(), $2);
     ```

**Criterios de Selección:**

- Estado del cliente: `EN_PEDIDO`
- Pre-pedido tiene productos
- Inactivo por 2-23 horas
- No se ha enviado recordatorio hoy
- Límite: 20 clientes por ejecución

**Tabla recordatorios_enviados:**

```sql
CREATE TABLE IF NOT EXISTS recordatorios_enviados (
    id SERIAL PRIMARY KEY,
    cliente_id INTEGER REFERENCES clientes(id),
    fecha_envio TIMESTAMP NOT NULL DEFAULT NOW(),
    mensaje TEXT,
    respuesta TEXT,
    exitoso BOOLEAN DEFAULT true
);

CREATE INDEX IF NOT EXISTS idx_recordatorios_enviados_cliente ON recordatorios_enviados(cliente_id);
CREATE INDEX IF NOT EXISTS idx_recordatorios_enviados_fecha ON recordatorios_enviados(fecha_envio);
```

---

### 📊 4. Auditoría de Pedidos Históricos

**Archivo:** `workflow-auditoria-pedidos.json`

**Propósito:**
Auditoría manual de pedidos para detectar inconsistencias en datos de productos, precios y estados.

**Trigger:**
- Webhook HTTP (manual)

**Principales Nodos:**

1. **🎯 Iniciar Auditoría** (Webhook)
   - Webhook trigger
   - Method: POST
   - Recibe parámetros (rango de fechas)

2. **📦 Obtener Todos los Pedidos** (HTTP Request)
   - Fetch desde Supabase
   - Endpoint: `/rest/v1/guest_orders`
   - Query Parameters:
     - `select`: `*`
     - `order`: `created_at.desc`
   - Headers: `apikey`

3. **💰 Obtener Catálogo Actual** (HTTP Request)
   - Fetch productos actuales
   - Endpoint: `/rest/v1/products`
   - Include: categories, variants

4. **🔍 Comparar y Detectar** (Code Node)
   - Compara datos y detecta problemas:
     - Productos eliminados en pedidos
     - Precios desactualizados
     - Variantes inexistentes
     - Estados inválidos

5. **📊 Generar Reporte** (Code Node)
   - Crea reporte JSON:
     ```json
     {
       "fecha_auditoria": "2026-02-08",
       "total_pedidos": 1234,
       "problemas_encontrados": {
         "productos_eliminados": 5,
         "precios_desactualizados": 23,
         "variantes_inexistentes": 7,
         "estados_invalidos": 12
       },
       "detalles": [...]
     }
     ```

**Problemas Detectados:**

1. **Productos eliminados:**
   - Productos en pedidos que ya no existen
   - Síntoma: product_id no en productos actuales

2. **Precios desactualizados:**
   - Precios en pedidos diferentes a precios actuales
   - Síntoma: order_price != current_price

3. **Variantes inexistentes:**
   - Variantes en pedidos que no existen en catálogo
   - Síntoma: variant_id no en variantes actuales

4. **Estados inválidos:**
   - Estados de pedido que no corresponden al flujo
   - Síntoma: status no en ['pending', 'paid', 'completed', 'cancelled']

---

### 📢 5. Campaña Nueva Tienda - 500 Clientes

**Archivo:** `campana-500-clientes-invitatienda.json`

**Propósito:**
Campaña de lanzamiento de tienda enviando mensajes personalizados a 500 mejores clientes.

**Trigger:**
- Manual

**Principales Nodos:**

1. **▶️ Iniciar Campaña** (Manual Trigger)
   - Trigger manual
   - Botón de ejecución

2. **📋 Obtener 500 Clientes** (Postgres)
   - Consulta PostgreSQL
   - Query:
     ```sql
     SELECT telefono, nombre, total_pedidos, total_gastado
     FROM clientes
     WHERE activo = true
       AND LENGTH(REPLACE(REPLACE(telefono, '+', ''), ' ', '')) >= 10
       AND nombre IS NOT NULL
       AND nombre != ''
     ORDER BY total_pedidos DESC, total_gastado DESC
     LIMIT 500;
     ```

3. **🔧 Preparar Mensajes** (Code Node)
   - Prepara template de WhatsApp
   - Personaliza con nombre del cliente
   - Formato:
     ```
     🥑 Hola [Nombre],

     ¡Te invitamos a conocer nuestra nueva tienda online!

     🛒 Visítanos en: tus-aguacates.vercel.app

     ✨ Beneficios:
     • Ahorra tiempo pidiendo desde tu celular
     • Catálogo completo de productos frescos
     • Entrega a domicilio

     💚 Tus Aguacates - Frescos y Deliciosos
     ```

4. **📦 Dividir en Lotes** (Split in Batches)
   - Envía en lotes de 1
   - Evita rate limiting de YCloud

5. **📤 Enviar Mensaje YCloud** (HTTP Request)
   - Envía via YCloud API
   - POST `https://api.ycloud.com/v2/whatsapp/messages`
   - Body:
     ```json
     {
       "from": "57XXXXXXXXXX",
       "to": "+57XXXXXXXXXX",
       "type": "text",
       "text": {
         "body": "[Mensaje personalizado]"
       }
     }
     ```

**Template:**
- Template name: `invitatienda`
- Header: Imagen de campaña
- Body: Personalizado con nombre del cliente

**Criterios de Selección:**
- Cliente activo (`activo = true`)
- Teléfono válido (≥10 dígitos)
- Nombre no vacío
- Ordenado por: total_pedidos DESC, total_gastado DESC

---

### 🔧 6. MCP Helper Workflow

**Archivo:** `mcp-helper-workflow.json`

**Propósito:**
Helper para integración con MCP (Model Context Protocol) para conectar sistemas externos con n8n.

**Trigger:**
- Manual

**Casos de Uso:**
- Conectar sistemas externos
- Procesar callbacks de APIs
- Manejar eventos externos

---

## 🛠️ Troubleshooting Común

### Error: "Invalid API Key" (YCloud)

**Síntomas:**
- Error al enviar mensajes de WhatsApp
- Código de error HTTP 401
- Mensaje: "Authentication failed"

**Solución:**
1. Verifica que el header sea `X-API-Key` (con X mayúscula)
2. Confirma que la API key es correcta en YCloud Dashboard
3. Verifica que la credencial está configurada en n8n
4. Revisa que la API key no haya expirado

**Pasos de diagnóstico:**
```bash
# Probar API key con curl
curl -X POST "https://api.ycloud.com/v2/whatsapp/messages" \
  -H "X-API-Key: [TU_API_KEY]" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "573001234567",
    "type": "text",
    "text": {"body": "Prueba"}
  }'
```

---

### Error: "Function not found" (Supabase)

**Síntomas:**
- El agente no puede buscar productos
- Error en función RPC de Supabase
- Mensaje: "function search_products(search_term) does not exist"

**Solución:**
1. Ejecuta `supabase-search-function.sql` en el SQL Editor de Supabase
2. Verifica: `SELECT * FROM search_products('aguacate');`
3. Confirma que la credencial de Supabase es correcta
4. Revisa que la función tenga permisos (GRANT EXECUTE)

**Pasos de diagnóstico:**
```sql
-- Verificar que la función existe
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name = 'search_products';

-- Probar la función
SELECT * FROM search_products('aguacate');
```

---

### El agente no responde

**Síntomas:**
- El flujo se ejecuta pero no hay respuesta en WhatsApp
- Webhook recibe el mensaje pero no hay output
- Logs muestran ejecución pero sin envío

**Solución:**
1. Verifica que el webhook esté activo en n8n
2. Revisa los logs del flujo en n8n
3. Confirma que el webhook está configurado en YCloud
4. Verifica que el trigger en YCloud es `whatsapp.inbound_message.received`
5. Chequea que las credenciales de YCloud sean correctas
6. Revisa que el número de YCloud esté verificado

**Pasos de diagnóstico:**
1. Ir a n8n → Workflows → Agente Luz v6.5
2. Click en "Executions" → Ver última ejecución
3. Verificar si hay errores en algún nodo
4. Click en cada nodo para ver input/output
5. Chequear nodo "📤 Enviar Respuesta YCloud"

---

### Sincronización de productos falla

**Síntomas:**
- Los productos no se actualizan en PostgreSQL local
- Workflow de sync no ejecuta
- Error de conexión a Supabase

**Solución:**
1. Verifica que el trigger del schedule esté activo
2. Confirma que la credencial de Supabase es válida
3. Revisa los logs para ver errores específicos
4. Verifica que la tabla `productos_tienda` existe en PostgreSQL
5. Chequea que el host de Supabase sea accesible

**Pasos de diagnóstico:**
```sql
-- Verificar tabla
\d productos_tienda

-- Verificar última sincronización
SELECT MAX(ultima_actualizacion) FROM productos_tienda;

-- Contar productos
SELECT COUNT(*) FROM productos_tienda;
```

---

### Webhook no recibe mensajes

**Síntomas:**
- El webhook no se activa cuando llega un mensaje de WhatsApp
- YCloud muestra "Webhook failed" o "Webhook timeout"
- No aparece ejecución en n8n

**Solución:**
1. Activa el flujo en n8n
2. Copia la URL del webhook
3. En YCloud Dashboard → Webhooks → Add Webhook
4. Event: `whatsapp.inbound_message.received`
5. URL: La URL copiada de n8n
6. Confirma que el webhook esté activo en YCloud
7. Verifica que el endpoint HTTP sea POST

**Pasos de diagnóstico:**
```bash
# Probar webhook manualmente
curl -X POST "[URL_WEBHOOK]" \
  -H "Content-Type: application/json" \
  -d '{
    "whatsappInboundMessage": {
      "from": "573001234567",
      "to": "573009876543",
      "type": "text",
      "text": {"body": "Prueba"}
    }
  }'
```

---

### Error de conexión a PostgreSQL

**Síntomas:**
- Error al conectarse a PostgreSQL local
- Mensaje: "Connection refused" o "Could not connect"
- Timeout en operaciones de DB

**Solución:**
1. Verifica que el contenedor de Docker esté corriendo
2. Confirma que el puerto sea el correcto (5432)
3. Revisa credenciales (user, password, database)
4. Verifica que PostgreSQL acepte conexiones externas
5. Prueba conexión con otro cliente (pgAdmin, DBeaver)

**Pasos de diagnóstico:**
```bash
# Verificar contenedor Docker
docker ps | grep postgres

# Verificar logs
docker logs [nombre_contenedor]

# Probar conexión con psql
psql -h localhost -p 5432 -U postgres -d tus_aguacates
```

---

## 📚 Guías de Instalación

### Guía 1: Conectar n8n con Supabase

**Archivo:** `GUIA-CONECTAR-N8N-SUPABASE.md`

**Paso 1: Obtener credenciales de Supabase**

1. Ve a tu Dashboard de Supabase: https://app.supabase.com
2. Selecciona tu proyecto "Tus Aguacates"
3. Ve a Settings > API
4. Copia:
   - Project URL: `https://tu-project.supabase.co`
   - anon key: `eyJ...` (para REST API)
   - service_role key: `eyJ...` (para operaciones admin)

**Paso 2: Crear credencial HTTP en n8n**

1. En n8n, ve a **Credentials** (menú lateral)
2. Click en **Add Credential**
3. Busca y selecciona **Header Auth**
4. Configura:
   - **Name:** `Supabase account 2`
   - **Credential Type:** Header Auth
   - **Name:** `apikey`
   - **Value:** [Pegar anon key o service_role key]
5. Click en **Save**

**Paso 3: Crear credencial PostgreSQL en n8n**

1. En n8n, ve a **Credentials** → **Add Credential**
2. Selecciona **Postgres**
3. Configura:
   - **Name:** `Supabase - Tus Aguacates`
   - **Host:** `db.[tu-proyecto].supabase.co`
   - **Database:** `postgres`
   - **User:** `postgres`
   - **Password:** [Tu password de Supabase]
   - **Port:** `5432` (o `6543` para pooler)
   - **SSL:** ✅ Activado
4. Click en **Save**

**Paso 4: Probar conexión**

1. Crea un workflow de prueba
2. Agrega nodo **Postgres**
3. Selecciona credencial `Supabase - Tus Aguacates`
4. Query:
   ```sql
   SELECT COUNT(*) as total, COUNT(CASE WHEN is_active THEN 1 END) as activos
   FROM products;
   ```
5. Ejecuta workflow

---

### Guía 2: Configurar YCloud

**Archivo:** `GUIA-SETUP-N8N-ANTIGRAVITY.md`

**Paso 1: Obtener API key de YCloud**

1. Ve a [YCloud Dashboard](https://dashboard.ycloud.com)
2. Navega a **Settings** → **API Keys**
3. Click en **Create API Key**
4. Dale un nombre (ej: "n8n Integration")
5. Copia la API key generada

**Paso 2: Crear credencial en n8n**

1. En n8n, ve a **Credentials** → **Add Credential**
2. Selecciona **Header Auth**
3. Configura:
   - **Name:** `YCloudApi`
   - **Credential Type:** Header Auth
   - **Name:** `X-API-Key`
   - **Value:** [Pegar API key de YCloud]
4. Click en **Save**

**Paso 3: Configurar número de WhatsApp**

1. En YCloud Dashboard → **WhatsApp** → **Senders**
2. Asegúrate de tener un número verificado
3. Copia el número (ej: `573009876543`)

---

### Guía 3: Configurar Webhook YCloud

**Paso 1: Activar flujo de Agente Luz en n8n**

1. Ve a n8n → **Workflows**
2. Abre **🥑 Agente Luz v6.5**
3. Click en el toggle superior derecho para activar
4. El workflow debe mostrar "Active"

**Paso 2: Copiar URL del webhook**

1. En el workflow, busca el nodo **📥 Webhook YCloud**
2. Click derecho en el nodo → **Copy Webhook URL**
3. Guarda la URL (ej: `https://dep-n8n.n8ntusaguacates.space/webhook/ycloud`)

**Paso 3: Configurar webhook en YCloud**

1. En YCloud Dashboard → **Webhooks** → **Add Webhook**
2. Configura:
   - **Name:** `n8n Webhook`
   - **Event:** `whatsapp.inbound_message.received`
   - **URL:** [Pegar URL copiada de n8n]
   - **Method:** `POST`
   - **Headers:** (vacío, YCloud agrega automáticamente)
3. Click en **Save**

**Paso 4: Activar webhook**

1. En la lista de webhooks, busca "n8n Webhook"
2. Click en el toggle para activar
3. El webhook debe mostrar "Active"

---

### Guía 4: Crear Función de Búsqueda en Supabase

**Archivo:** `supabase-search-function.sql`

**Paso 1: Abrir SQL Editor**

1. En Supabase Dashboard → **SQL Editor**
2. Click en **New Query**

**Paso 2: Ejecutar SQL**

1. Copia el contenido de `supabase-search-function.sql`
2. Pega en el editor
3. Click en **Run**

**Paso 3: Verificar función**

1. En una nueva query, ejecuta:
   ```sql
   SELECT * FROM search_products('aguacate');
   ```
2. Deberías ver resultados de productos que contengan "aguacate"

**Paso 4: Crear índices adicionales**

```sql
-- Índice para búsqueda full-text
CREATE INDEX IF NOT EXISTS idx_products_search_fts
ON products USING gin(to_tsvector('spanish', name || ' ' || description));

-- Índice para búsqueda por slug
CREATE INDEX IF NOT EXISTS idx_products_slug
ON products(slug);
```

---

### Guía 5: Configurar PostgreSQL Local

**Paso 1: Iniciar contenedor Docker**

```bash
# Iniciar PostgreSQL
docker start postgres_tus_aguacates

# Si no existe, crearlo
docker run --name postgres_tus_aguacates \
  -e POSTGRES_PASSWORD=tu_password \
  -e POSTGRES_DB=tus_aguacates \
  -p 5432:5432 \
  -d postgres:15
```

**Paso 2: Crear tablas necesarias**

```sql
-- Tabla clientes
CREATE TABLE IF NOT EXISTS clientes (
    id SERIAL PRIMARY KEY,
    telefono VARCHAR(20) UNIQUE NOT NULL,
    nombre VARCHAR(100),
    email VARCHAR(255),
    direccion TEXT,
    estado_conversacion VARCHAR(50) DEFAULT 'NUEVO',
    total_pedidos INTEGER DEFAULT 0,
    total_gastado NUMERIC DEFAULT 0,
    supabase_id UUID,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_clientes_telefono ON clientes(telefono);
CREATE INDEX IF NOT EXISTS idx_clientes_supabase_id ON clientes(supabase_id);
CREATE INDEX IF NOT EXISTS idx_clientes_estado ON clientes(estado_conversacion);

-- Tabla productos_local
CREATE TABLE IF NOT EXISTS productos_local (
    id SERIAL PRIMARY KEY,
    supabase_id UUID UNIQUE,
    nombre VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE,
    descripcion TEXT,
    precio NUMERIC NOT NULL,
    precio_descuento NUMERIC,
    nombre_categoria VARCHAR(100),
    id_categoria INTEGER,
    url_imagen_principal VARCHAR(500),
    stock INTEGER DEFAULT 0,
    activo BOOLEAN DEFAULT true,
    destacado BOOLEAN DEFAULT false,
    disponible_para VARCHAR(20) DEFAULT 'both',
    unidad VARCHAR(20),
    organico BOOLEAN DEFAULT false,
    peso NUMERIC,
    cantidad_minima INTEGER DEFAULT 1,
    ultima_actualizacion TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_productos_local_supabase_id ON productos_local(supabase_id);
CREATE INDEX IF NOT EXISTS idx_productos_local_activo ON productos_local(activo);

-- Tabla pre_pedidos
CREATE TABLE IF NOT EXISTS pre_pedidos (
    id SERIAL PRIMARY KEY,
    cliente_id INTEGER REFERENCES clientes(id),
    productos JSONB NOT NULL DEFAULT '[]'::jsonb,
    total NUMERIC DEFAULT 0,
    ultima_actualizacion TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pre_pedidos_cliente ON pre_pedidos(cliente_id);

-- Tabla recordatorios_enviados
CREATE TABLE IF NOT EXISTS recordatorios_enviados (
    id SERIAL PRIMARY KEY,
    cliente_id INTEGER REFERENCES clientes(id),
    fecha_envio TIMESTAMP NOT NULL DEFAULT NOW(),
    mensaje TEXT,
    respuesta TEXT,
    exitoso BOOLEAN DEFAULT true
);

CREATE INDEX IF NOT EXISTS idx_recordatorios_enviados_cliente ON recordatorios_enviados(cliente_id);
CREATE INDEX IF NOT EXISTS idx_recordatorios_enviados_fecha ON recordatorios_enviados(fecha_envio);
```

**Paso 3: Crear credencial en n8n**

1. En n8n, ve a **Credentials** → **Add Credential**
2. Selecciona **Postgres**
3. Configura:
   - **Name:** `Mi PostgreSQL Docker`
   - **Host:** `localhost`
   - **Database:** `tus_aguacates`
   - **User:** `postgres`
   - **Password:** `tu_password`
   - **Port:** `5432`
   - **SSL:** ❌ Desactivado (localhost)
4. Click en **Save**

---

## 📚 Apéndices

### Glosario

| Término | Definición |
|---------|------------|
| **n8n** | Plataforma de automatización de workflows open-source |
| **YCloud** | Proveedor de WhatsApp Business API |
| **Supabase** | Plataforma de base de datos PostgreSQL en la nube |
| **Webhook** | URL que recibe notificaciones HTTP |
| **RPC (Remote Procedure Call)** | Función invocable remotamente en Supabase |
| **DeepSeek** | Modelo de lenguaje artificial (LLM) usado por el agente |
| **Pre-pedido** | Carrito temporal en conversación WhatsApp |
| **Estado de conversación** | Fase actual del cliente en el flujo |
| **Escalado** | Transferencia de conversación a humano |
| **UPSERT** | Operación que inserta o actualiza según existencia |
| **MCP (Model Context Protocol)** | Protocolo para integración con herramientas |
| **Antigravity** | Extensión de VS Code con soporte MCP |
| **Buffer Window** | Memoria de sesión para el agente IA |
| **Function Calling** | Técnica donde el LLM llama funciones externas |
| **Rate Limiting** | Límite de solicitudes por unidad de tiempo |
| **Docker** | Plataforma de contenedores para PostgreSQL local |
| **UUID** | Identificador único universal |
| **JSONB** | Formato JSON binario optimizado para PostgreSQL |
| **Cron** | Sintaxis para tareas programadas |
| **REST API** | API usando protocolo HTTP |
| **Header Auth** | Autenticación usando headers HTTP |

---

### Referencias SQL

#### Función de búsqueda en Supabase

```sql
CREATE OR REPLACE FUNCTION search_products(search_term TEXT)
RETURNS TABLE (
  id UUID,
  name VARCHAR,
  slug VARCHAR,
  description TEXT,
  price NUMERIC,
  discount_price NUMERIC,
  category_name VARCHAR,
  main_image_url VARCHAR,
  stock INTEGER,
  is_active BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.name,
    p.slug,
    p.description,
    p.price,
    p.discount_price,
    c.name as category_name,
    p.main_image_url,
    p.stock,
    p.is_active
  FROM products p
  LEFT JOIN categories c ON p.category_id = c.id
  WHERE p.is_active = true
    AND (
      p.name ILIKE '%' || search_term || '%'
      OR p.description ILIKE '%' || search_term || '%'
      OR c.name ILIKE '%' || search_term || '%'
    )
  ORDER BY
    CASE WHEN p.name ILIKE search_term THEN 1 ELSE 2 END,
    p.name;
END;
$$ LANGUAGE plpgsql;
```

#### Consulta de clientes para campañas

```sql
-- Mejores clientes para campañas
SELECT
  telefono,
  COALESCE(nombre, 'Cliente') as nombre,
  total_pedidos,
  total_gastado
FROM clientes
WHERE activo = true
  AND LENGTH(REPLACE(REPLACE(telefono, '+', ''), ' ', '')) >= 10
  AND (nombre IS NOT NULL AND nombre != '')
  AND (email IS NOT NULL AND email != '')
ORDER BY
  total_pedidos DESC,
  total_gastado DESC
LIMIT 500;
```

#### Consulta de carritos abandonados

```sql
-- Carritos abandonados para recordatorios
SELECT
  c.telefono,
  c.nombre,
  pp.productos,
  pp.total,
  pp.ultima_actualizacion
FROM clientes c
JOIN pre_pedidos pp ON pp.cliente_id = c.id
WHERE c.estado_conversacion = 'EN_PEDIDO'
  AND pp.productos IS NOT NULL
  AND pp.productos != '[]'::jsonb
  AND pp.ultima_actualizacion < NOW() - INTERVAL '2 hours'
  AND pp.ultima_actualizacion > NOW() - INTERVAL '23 hours'
  AND NOT EXISTS (
    SELECT 1 FROM recordatorios_enviados re
    WHERE re.cliente_id = c.id
      AND re.fecha_envio::date = CURRENT_DATE
  )
  AND c.activo = true
ORDER BY pp.ultima_actualizacion ASC
LIMIT 20;
```

#### Sincronización de clientes

```sql
-- Vincular clientes de PostgreSQL con Supabase
UPDATE clientes c
SET supabase_id = s.id,
    email = COALESCE(s.email, c.email),
    updated_at = NOW()
FROM customers s
WHERE REPLACE(REPLACE(c.telefono, '+', ''), ' ', '') = REPLACE(REPLACE(s.phone, '+', ''), ' ', '')
  AND c.supabase_id IS NULL;

-- Crear clientes en Supabase desde PostgreSQL
INSERT INTO customers (phone, email, created_at)
SELECT
  REPLACE(REPLACE(telefono, '+', ''), ' ', ''),
  email,
  created_at
FROM clientes c
WHERE NOT EXISTS (
  SELECT 1 FROM customers s
  WHERE REPLACE(REPLACE(s.phone, '+', ''), ' ', '') = REPLACE(REPLACE(c.telefono, '+', ''), ' ', '')
);
```

---

### Contacto

**Soporte Técnico:**
- Documentación: https://docs.n8n.io
- YCloud API: https://docs.ycloud.com
- Supabase Documentation: https://supabase.com/docs

**Equipo de Automatización:**
- Última actualización: Febrero 2026
- Versión del manual: 2.0
- Archivos relacionados:
  - `GUIA-CONECTAR-N8N-SUPABASE.md`
  - `GUIA-SETUP-N8N-ANTIGRAVITY.md`
  - `GUIA-INTEGRAR-COPILOTO.md`
  - `GUIA-SYNC-CLIENTES.md`

---

**Fin del Manual**

Este manual es un documento vivo que se actualiza regularmente. Si encuentras errores o tienes sugerencias, por favor contáctanos.
