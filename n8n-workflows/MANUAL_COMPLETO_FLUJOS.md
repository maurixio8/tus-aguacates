# 🤖 Manual de Flujos de n8n - Tus Aguacates

> **Última actualización:** 8 de febrero de 2026  
> **Instancia n8n:** https://dep-n8n.n8ntusaguacates.space

---

## 📋 Índice

1. [¿Qué es n8n y por qué lo usamos?](#qué-es-n8n-y-por-qué-lo-usamos)
2. [Arquitectura de Conexión con la Tienda](#arquitectura-de-conexión-con-la-tienda)
3. [Categorías de Flujos](#categorías-de-flujos)
4. [Flujos Detallados](#flujos-detallados)
5. [Habilidades de Conexión con n8n](#habilidades-de-conexión-con-n8n)
6. [Configuración y Mantenimiento](#configuración-y-mantenimiento)
7. [Troubleshooting](#troubleshooting)

---

## ¿Qué es n8n y por qué lo usamos?

**n8n** es una plataforma de automatización de flujos de trabajo que nos permite conectar diferentes servicios y APIs. En Tus Aguacates, utilizamos n8n como el "cerebro" central que coordina:

- 🤖 **Agente Luz**: Nuestro asistente de atención al cliente por WhatsApp
- 🔄 **Sincronización de datos**: Entre Supabase, PostgreSQL local y otros sistemas
- 📊 **Automatización de marketing**: Recordatorios, campañas masivas
- 🛡️ **Auditoría y monitoreo**: Verificación de integridad de datos

---

## Arquitectura de Conexión con la Tienda

### Diagrama de Flujo de Datos

```
┌─────────────────────────────────────────────────────────────────┐
│                        Tienda Online                             │
│                   (tus-aguacates.com)                          │
│                              │                                  │
│                              │ API/Webhooks                     │
│                              ▼                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                    n8n Workflows                        │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌──────────────────┐  │   │
│  │  │ Agente Luz  │  │   Sincro    │  │  Marketing       │  │   │
│  │  │  (WhatsApp) │  │   Datos     │  │  Automations    │  │   │
│  │  └─────────────┘  └─────────────┘  └──────────────────┘  │   │
│  └──────────────────────────────────────────────────────────┘   │
│                              │                                  │
│              ┌───────────────┼───────────────┐                 │
│              ▼               ▼               ▼                 │
│  ┌─────────────────┐ ┌───────────────┐ ┌──────────────┐      │
│  │   Supabase      │ │  PostgreSQL    │ │   YCloud     │      │
│  │   (Productos,   │ │   Local       │ │  (WhatsApp)  │      │
│  │   Clientes,    │ │   (WhatsApp   │ │   API)       │      │
│  │   Pedidos)      │ │   Clientes)   │ │              │      │
│  └─────────────────┘ └───────────────┘ └──────────────┘      │
└─────────────────────────────────────────────────────────────────┘
```

### Puntos de Integración

| Sistema | Conexión con n8n | Propósito |
|---------|-----------------|-----------|
| **Tienda Online** | Webhooks API | Notificar eventos de pedidos, registros |
| **Supabase** | API REST | Sincronizar productos, clientes, pedidos |
| **PostgreSQL Local** | Conexión directa | Memoria del Agente Luz, pre-pedidos |
| **YCloud** | API WhatsApp | Envío/recepción de mensajes |
| **DeepSeek/OpenAI** | API AI | Inteligencia artificial del agente |

---

## Categorías de Flujos

### 🤖 1. Agente Luz (Atención al Cliente)

**Propósito:** Asistente virtual inteligente que atiende clientes por WhatsApp.

| Flujo | Archivo | Estado | Frecuencia |
|-------|---------|--------|------------|
| Agente Luz v6.5 | `Agente Luz v6.5 - Con Herramientas Admin Copiloto.json` | Activo | Webhook (tiempo real) |
| Copiloto de Operaciones | `Copiloto-Operaciones-v2-YCloud.json` | Activo | Webhook (tiempo real) |

**Funciones principales:**
- Atención al cliente 24/7
- Búsqueda de productos en catálogo
- Gestión de carritos de compra
- Escalado a agentes humanos cuando necesario
- Sistema de herramientas (tools) para consultar datos

### 🔄 2. Sincronización de Datos

**Propósito:** Mantener los datos actualizados entre diferentes sistemas.

| Flujo | Archivo | Estado | Frecuencia |
|-------|---------|--------|------------|
| Sync Productos | `workflow-sync-productos.json` | Activo | Cada hora |
| Sync Clientes → Local | `workflow-sync-clientes-supabase-to-local.json` | Activo | Cada hora |
| Sync Clientes ← Local | `workflow-sync-clientes-local-to-supabase.json` | Activo | Cada hora |

**Funciones principales:**
- Sincronización de productos con variantes
- Sincronización bidireccional de clientes
- Actualización de precios e inventario
- Normalización de datos de clientes

### 📊 3. Auditoría y Monitoreo

**Propósito:** Verificar integridad de datos y detectar problemas.

| Flujo | Archivo | Estado | Frecuencia |
|-------|---------|--------|------------|
| Auditoría Diaria | `workflow-audit-integrity-daily.json` | Activo | Diariamente (6 AM) |
| Auditoría Pedidos | `workflow-auditoria-pedidos.json` | Activo | Bajo demanda |
| Monitor Escalados | `monitor-escalados-workflow.json` | Activo | Continuo |

**Funciones principales:**
- Verificar consistencia entre sistemas
- Detectar discrepancias en datos
- Alertar sobre clientes escalados sin atención
- Generar reportes diarios

### 📣 4. Marketing y Automatizaciones

**Propósito:** Campañas de marketing y recordatorios automáticos.

| Flujo | Archivo | Estado | Frecuencia |
|-------|---------|--------|------------|
| Recordatorio Carritos | `workflow-recordatorio-carritos.json` | Activo | Cada 4 horas |
| Confirmar Pre-Pedido | `workflow-confirmar-prepedido.json` | Activo | Webhook |
| Campaña Masiva | `campana-masiva-anti-duplicados.json` | Ocasional | Manual |
| Auto-Etiquetar YCloud | `workflow-auto-etiquetar-ycloud.json` | Activo | Eventos nuevos |

**Funciones principales:**
- Recordatorios de carritos abandonados
- Confirmación de pre-pedidos
- Campañas de marketing masivas
- Etiquetado automático de clientes

### 🔧 5. Herramientas de Gestión

**Propósito:** Flujos de utilidad para administrar el sistema.

| Flujo | Archivo | Estado | Frecuencia |
|-------|---------|--------|------------|
| MCP Helper | `mcp-helper-workflow.json` | Activo | Webhook |
| Procesar Buffer | `workflow-procesar-buffer.json` | Activo | Bajo demanda |
| Tracking Respuestas | `workflow-tracking-respuestas.json` | Activo | Continuo |

**Funciones principales:**
- API para gestionar workflows desde otros sistemas
- Procesamiento de buffer de mensajes
- Tracking de respuestas del agente

---

## Flujos Detallados

### 🤖 Agente Luz v6.5

**Descripción:** Asistente virtual inteligente que atiende clientes por WhatsApp usando DeepSeek como motor de IA.

**Características:**
- Conversaciones contextuales con memoria
- Búsqueda de productos en Supabase
- Gestión de carritos de compra
- Escalado inteligente a humanos
- Herramientas de administración integradas

**Webhook de entrada:**
```
POST https://dep-n8n.n8ntusaguacates.space/webhook/agente-luz
```

**Herramientas disponibles:**
- `TOOL_BuscarProductos`: Buscar productos en catálogo
- `TOOL_ConsultarPedido`: Estado de pedido de cliente
- `TOOL_EscalarServicio`: Escalar a atención humana
- `TOOL_Admin`: Herramientas administrativas (solo para admin)

**Datos que consume:**
- Catálogo de productos (desde Supabase)
- Clientes y pre-pedidos (desde PostgreSQL local)
- Variantes de productos

**Datos que genera:**
- Pre-pedidos en PostgreSQL local
- Registro de interacciones
- Tickets de escalado

---

### 🔄 Sync Productos

**Descripción:** Sincroniza productos y variantes desde Supabase a PostgreSQL local.

**Frecuencia:** Cada hora

**Proceso:**
1. Obtiene productos activos de Supabase
2. Obtiene variantes de productos
3. Transforma datos al formato local
4. Limpia tablas locales (sincronización completa)
5. Inserta productos
6. Inserta variantes con referencias a productos

**Tablas afectadas:**
- `productos_tienda` (PostgreSQL local)
- `variantes_productos` (PostgreSQL local)

**Importancia:** El Agente Luz necesita los datos locales para búsquedas rápidas y sin latencia.

---

### 🔄 Sync Clientes (Bidireccional)

**Descripción:** Sincronización bidireccional de clientes entre Supabase y PostgreSQL local.

**Flujo Supabase → Local:**
1. Obtiene clientes de Supabase (con emails del registro web)
2. Normaliza teléfonos (formato internacional)
3. UPSERT en PostgreSQL local
4. Genera estadísticas de sincronización

**Flujo Local → Supabase:**
1. Encuentra clientes solo en local (de WhatsApp)
2. Crea registros en Supabase
3. Vincula `supabase_id` en local

**Importancia:** Permite unificar clientes de WhatsApp con clientes de la tienda online.

---

### 📊 Auditoría Diaria de Integridad

**Descripción:** Verifica consistencia de datos entre sistemas cada día a las 6 AM.

**Verificaciones:**
- Conteo de clientes (local vs Supabase)
- Conteo de productos (local vs Supabase)
- Conteo de variantes
- Detecta discrepancias mayores al 5%
- Genera reporte de alertas

**Trigger:**
- Automático: Cada día a las 6:00 AM
- Manual: `POST https://.../webhook/audit-integrity`

**Salida:** Reporte JSON con estado de cada sistema.

---

### 🛒 Recordatorio Carritos Abandonados

**Descripción:** Envía recordatorios automáticos a clientes con carritos abandonados.

**Frecuencia:** Cada 4 horas (9 AM, 1 PM, 5 PM, 9 PM)

**Criterios:**
- Estado de conversación: `EN_PEDIDO`
- Carrito con al menos 2 horas inactivo
- Máximo 23 horas de antigüedad (ventana de 24h WhatsApp)
- No se envió recordatorio en las últimas 20 horas

**Proceso:**
1. Busca clientes con carritos abandonados
2. Genera mensaje personalizado
3. Envía vía YCloud API
4. Registra recordatorio en tabla `recordatorios_enviados`
5. Actualiza contador de recordatorios

**Importancia:** Recuperación de carritos abandonados, aumento de conversión.

---

### 🔧 MCP Helper

**Descripción:** API web para gestionar workflows de n8n desde otros sistemas.

**Endpoints disponibles:**

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/webhook/mcp-helper/list` | Listar todos los workflows |
| GET | `/webhook/mcp-helper/get/{id}` | Obtener workflow específico |
| POST | `/webhook/mcp-helper/create` | Crear nuevo workflow |
| PUT | `/webhook/mcp-helper/update/{id}` | Actualizar workflow |
| POST | `/webhook/mcp-helper/activate/{id}` | Activar workflow |
| POST | `/webhook/mcp-helper/execute/{id}` | Ejecutar workflow manualmente |
| GET | `/webhook/mcp-helper/audit/{id}` | Auditar workflow |

**Importancia:** Permite integración programática con otros sistemas.

---

## Habilidades de Conexión con n8n

### ✅ Capacidades Actuales

Como asistente de IA, tengo las siguientes habilidades para trabajar con tu instancia de n8n:

#### 1. **Análisis de Workflows**
- Leer y entender archivos JSON de workflows de n8n
- Analizar estructura de nodos y conexiones
- Identificar credenciales requeridas
- Documentar flujo de datos

#### 2. **Gestión de Archivos**
- Crear nuevos workflows (archivos JSON)
- Modificar workflows existentes
- Optimizar estructura de nodos
- Exportar/importar workflows

#### 3. **Documentación**
- Crear manuales y guías
- Documentar endpoints de webhooks
- Explicar integraciones y dependencias
- Crear troubleshooting guides

#### 4. **Generación de Código**
- Generar scripts SQL para n8n
- Crear código JavaScript para nodos Code
- Generar queries para nodos Postgres
- Crear prompts para agentes de IA

#### 5. **Troubleshooting**
- Analizar errores de workflows
- Proponer soluciones a problemas
- Optimizar rendimiento
- Identificar cuellos de botella

### 🔌 Conexión MCP (Model Context Protocol)

**Estado actual:** No tengo una conexión MCP directa configurada con tu instancia de n8n.

**Lo que significa MCP:**
- MCP es un protocolo que permite a asistentes de IA interactuar directamente con sistemas externos
- Una conexión MCP me permitiría:
  - Listar workflows activos en tiempo real
  - Ejecutar workflows directamente
  - Monitorear logs y ejecuciones
  - Modificar workflows sin necesidad de archivos JSON

**Alternativa actual:** MCP Helper Workflow
Tu flujo `mcp-helper-workflow.json` implementa una API web que simula funcionalidad MCP mediante webhooks.

**Cómo usarlo actualmente:**
```bash
# Listar workflows
curl https://dep-n8n.n8ntusaguacates.space/webhook/mcp-helper/list

# Ejecutar workflow
curl -X POST https://.../webhook/mcp-helper/execute/{workflow-id}
```

**Para habilitar conexión MCP directa:**
Necesitarías configurar un servidor MCP que exponga las APIs de n8n. Esto requeriría:
1. Instalación de servidor MCP en tu infraestructura
2. Configuración de autenticación
3. Definición de herramientas MCP para cada función de n8n

---

## Configuración y Mantenimiento

### 📝 Variables de Entorno

Archivo: `tus-aguacates/n8n-workflows/.env.n8n`

```bash
# URL base de n8n
N8N_BASE_URL=https://dep-n8n.n8ntusaguacates.space

# API Key de n8n (de Settings > API)
N8N_API_KEY=tu_api_key_aqui

# URLs de servicios externos
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_ANON_KEY=tu_anon_key
YCLOUD_API_KEY=tu_ycloud_key
DEEPSEEK_API_KEY=tu_deepseek_key

# URLs de PostgreSQL (Docker local)
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=tus_aguacates
POSTGRES_USER=tus_aguacates
POSTGRES_PASSWORD=tu_password
```

### 🔑 Credenciales Configuradas en n8n

| Credencial | Tipo | ID | Estado |
|------------|------|----|--------|
| Supabase account 2 | Supabase API | oFlOZEZmGLS2kaKr | ✅ Activo |
| Mi PostgreSQL Docker | PostgreSQL | R6hc0vEZJhKQSi3G | ✅ Activo |
| YCloud API Key | Header Auth | (personalizado) | ✅ Activo |
| DeepSeek account 2 | OpenAI Compatible | 8BVSsLxHakKs5L6l | ✅ Activo |

### 🚀 Activación de Workflows

**Desde interfaz web de n8n:**
1. Ir a https://dep-n8n.n8ntusaguacates.space
2. Navegar a "Workflows"
3. Seleccionar el workflow
4. Click en el botón "Active" (toggle superior derecho)

**Vía API (usando MCP Helper):**
```bash
curl -X POST https://.../webhook/mcp-helper/activate/{workflow-id}
```

### 🔄 Actualización de Workflows

**Recomendaciones:**
1. Siempre hacer backup antes de modificar
2. Usar nombres de versiones (v1, v2, v3...)
3. Documentar cambios en los archivos `.md`
4. Probar en modo "Manual" antes de activar
5. Verificar logs de ejecución después de cambios

---

## Troubleshooting

### ❌ Problemas Comunes

#### 1. El Agente Luz no responde

**Causas posibles:**
- Workflow no está activo
- Webhook de YCloud no configurado
- Credenciales inválidas o expiradas
- Error en nodo de IA (DeepSeek)

**Soluciones:**
```bash
# Verificar si workflow está activo
curl https://dep-n8n.n8ntusaguacates.space/webhook/mcp-helper/list

# Verificar logs de última ejecución
# (En interfaz de n8n: Workflow > Executions)

# Probar webhook manualmente
curl -X POST https://.../webhook/agente-luz \
  -H "Content-Type: application/json" \
  -d '{"message":"test"}'
```

#### 2. Sincronización de productos falla

**Causas posibles:**
- Credenciales de Supabase inválidas
- Tablas locales no existen
- Estructura de datos cambió

**Soluciones:**
```sql
-- Verificar tablas existen
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public';

-- Contar productos en Supabase
SELECT COUNT(*) FROM products WHERE is_active = true;
```

#### 3. Errores de conexión a PostgreSQL

**Causas posibles:**
- Contenedor Docker no está corriendo
- Credenciales incorrectas
- Firewall bloqueando conexión

**Soluciones:**
```bash
# Verificar contenedor Docker
docker ps | grep postgres

# Probar conexión
psql -h localhost -U tus_aguacates -d tus_aguacates

# Verificar credenciales en n8n
# Settings > Credentials > Mi PostgreSQL Docker
```

#### 4. Recordatorios de carritos no se envían

**Causas posibles:**
- Credenciales YCloud inválidas
- Sin clientes con carritos abandonados
- Ya se envió recordatorio recientemente

**Soluciones:**
```sql
-- Verificar clientes con carritos
SELECT 
  telefono, 
  nombre, 
  updated_at, 
  EXTRACT(EPOCH FROM (NOW() - updated_at))/3600 as horas_inactivo
FROM clientes
WHERE estado_conversacion = 'EN_PEDIDO'
  AND pre_pedido IS NOT NULL;
```

### 📊 Monitoreo

**Métricas clave a monitorear:**

| Métrica | Cómo verificar | Alerta si |
|---------|----------------|-----------|
| Workflows activos | MCP Helper `/list` | < 80% activos |
| Ejecuciones fallidas | n8n UI > Executions | > 5% error rate |
| Latencia de Agente Luz | Log de ejecuciones | > 10s |
| Sincronización exitosa | Audit diario | < 95% coincidencia |
| Recordatorios enviados | `workflow-recordatorio` | 0 por 4 horas |

---

## 📞 Soporte y Contacto

**Documentación relacionada:**
- `README.md` - Guía general del agente v3
- `GUIA-SYNC-CLIENTES.md` - Sincronización de clientes
- `GUIA-SYNC-VARIANTES.md` - Sincronización de variantes
- `GUIA-INTEGRAR-COPILOTO.md` - Integración del copiloto
- `GUIA-MCP-HELPER.md` - API de gestión de workflows

**Guías de instalación específicas:**
- `GUIA-CONECTAR-N8N-SUPABASE.md` - Conexión n8n-Supabase
- `GUIA-SETUP-N8N-ANTIGRAVITY.md` - Setup con Antigravity

---

## 🔄 Cambios Recientes

### Febrero 2026
- Actualización de documentación completa
- Migración a workflow sync-productos.json simplificado
- Optimización de auditoría diaria

### Enero 2026
- Lanzamiento de Agente Luz v6.5 con herramientas admin
- Implementación de MCP Helper v2
- Optimización de recordatorios de carritos

---

**Versión del manual:** 1.0  
**Fecha de creación:** 8 de febrero de 2026  
**Autor:** opencode AI Assistant
