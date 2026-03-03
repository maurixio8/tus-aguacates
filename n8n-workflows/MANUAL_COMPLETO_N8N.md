# 📚 MANUAL COMPLETO - FLUJOS N8N - TUS AGUACATES

**Última actualización**: Febrero 2026  
**Versión**: 2.0  
**Estado**: Actualizado y completo  

---

## 📋 INDICE

1. [📋 Introducción](#introducción)
2. [🧠 Arquitectura General](#arquitectura-general)
3. [🗂️ Categorización de Flujos](#categorización-de-flujos)
4. [⚡ Flujos Críticos (Activos)](#flujos-críticos-activos)
5. [📝 Flujos en Revisión](#flujos-en-revisión)
6. [🧪 Flujos Inactivos](#flujos-inactivos)
7. [🔗 Integraciones](#integraciones)
8. [🔧 Guías de Configuración](#guías-de-configuración)
9. [🐛 Troubleshooting](#troubleshooting)
10. [📊 Estadísticas](#estadísticas)

---

## 📋 Introducción

Esta carpeta contiene **46 flujos de n8n** que automatizan operaciones de la tienda Tus Aguacates. El sistema está diseñado para:

- 📱 **Atención al cliente** por WhatsApp
- 🔄 **Sincronización de datos** entre Supabase y PostgreSQL
- 🛒 **Gestión de pedidos** y carritos
- 📢 **Marketing automático** (campañas y recordatorios)
- 🛡️ **Auditoría y monitoreo** de datos

---

## 🧠 Arquitectura General

### Sistema de Datos

```
┌─────────────────────────────────────────────────────────────┐
│                     TUS AGUACATES                            │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┐         ┌──────────────┐                  │
│  │   Supabase    │         │  PostgreSQL   │                  │
│  │  (Instancia 1)│         │    (Docker)   │                  │
│  │  - Tienda    │         │  - Agente    │                  │
│  │  - Clientes  │         │  - Carritos  │                  │
│  │  - Pedidos   │         │  - Historial │                  │
│  └──────────────┘         └──────────────┘                  │
│         ↕️ Sync Hourly                                          │
│  ┌──────────────┐         ┌──────────────┐                  │
│  │  Supabase    │         │  Supabase    │                  │
│  │  (Instancia 2)│         │    RPC       │                  │
│  │  - Clientes  │         │  - Funciones │                  │
│  │  - Mensajes  │         │  - Búsqueda  │                  │
│  └──────────────┘         └──────────────┘                  │
└─────────────────────────────────────────────────────────────┘
                         ↕️
                ┌────────────────┐
                │    n8n API     │
                │  dep-n8n.n8nt  │
                └────────────────┘
                         ↕️
                ┌────────────────┐
                │   YCloud API   │
                │  WhatsApp      │
                └────────────────┘
```

### Servicios Integrados

| Servicio | Propósito | Credenciales |
|----------|-----------|--------------|
| **Supabase 1** | Tienda web, productos | `TU_SUPABASE_KEY` |
| **Supabase 2** | Clientes, mensajes, RPC | `TU_SUPABASE_RPC_KEY` |
| **PostgreSQL** | Agente, carritos, logs | `R6hc0vEZJhKQSi3G` |
| **OpenAI** | Agente conversación | `8BVSsLxHakKs5L6l` |
| **YCloud** | WhatsApp API | X-API-Key header |

---

## 🗂️ Categorización de Flujos

### 1️⃣ 🤖 AGENTES IA

| Flujo | Estado | Propósito | Frecuencia |
|-------|--------|-----------|------------|
| `Agente Luz v6.5 - Con Herramientas Admin Copiloto.json` | ✅ Activo | Atención cliente WhatsApp con IA | Continuo |
| `Agente-Luz-v5-Hibrido-Copiloto.json` | ⏳ Revisión | v5 anterior | - |
| `agente-whatsapp-mvp.json` | ⏳ Revisión | MVP inicial | - |
| `agente-luz-v6.4-variantes-completas.json` | ❌ Inactivo | v4 con variantes | - |
| `agente-luz-v6.3-busqueda-mejorada.json` | ❌ Inactivo | v3 con búsqueda | - |
| `agente-luz-v6.2-corregido.json` | ❌ Inactivo | v2 corregido | - |

### 2️⃣ 🔄 SINCRONIZACIÓN

| Flujo | Estado | Propósito | Frecuencia |
|-------|--------|-----------|------------|
| `workflow-sync-clientes-supabase-to-local.json` | ✅ Activo | Sync clientes Supabase → Local | Hourly |
| `workflow-sync-clientes-local-to-supabase.json` | ⏳ Revisión | Sync Local → Supabase | Hourly |
| `workflow-sync-clientes-bucle-robusto.json` | ⏳ Revisión | Sync mejorado | Hourly |
| `workflow-sync-productos.json` | ⏳ Revisión | Sync productos | Hourly |
| `workflow-sync-productos-v2.json` | ⏳ Revisión | Sync productos v2 | Hourly |
| `workflow-sync-productos-v2-simple.json` | ⏳ Revisión | Sync productos simple | Hourly |
| `workflow-sync-productos-variantes-completo.json` | ⏳ Revisión | Sync variantes completo | Hourly |

### 3️⃣ 📦 AUTOMATIZACIÓN DE PEDIDOS

| Flujo | Estado | Propósito | Frecuencia |
|-------|--------|-----------|------------|
| `workflow-confirmar-prepedido.json` | ✅ Activo | Confirmar pre-pedido → Supabase | Continuo |
| `automation-pedidos-web.json` | ✅ Activo | Automatización pedidos web | Continuo |
| `workflow-auditoria-pedidos.json` | ✅ Activo | Auditoría pedidos históricos | Semanal |
| `workflow-audit-integrity-daily.json` | ✅ Activo | Auditoría diaria de integridad | Diario (6 AM) |
| `workflow-procesar-buffer.json` | ✅ Activo | Buffer de mensajes agrupados | Continuo (10s) |
| `fix-web-orders-flow.js` | ✅ Activo | Corrección flujos web | Manual |

### 4️⃣ 📢 MARKETING

| Flujo | Estado | Propósito | Frecuencia |
|-------|--------|-----------|------------|
| `workflow-recordatorio-carritos.json` | ✅ Activo | Recordatorios carritos abandonados | 4x/día |
| `workflow-auto-etiquetar-ycloud.json` | ✅ Activo | Auto-etiquetado en YCloud | Continuo |
| `monitor-escalados-workflow.json` | ✅ Activo | Monitor de uso de recursos | Continuo |
| `monitor-escalados-v2.json` | ✅ Activo | Monitor v2 de uso | Continuo |
| `campana-navidad-151-clientes.json` | ❌ Inactivo | Campaña Navidad | Pausado |
| `campana-500-clientes-invitatienda.json` | ❌ Inactivo | Campaña lanzamiento | Pausado |
| `campana-masiva-anti-duplicados.json` | ❌ Inactivo | Campaña masiva | Pausado |
| `test-carousel-navidad.json` | ❌ Inactivo | Test carousel | Pausado |

### 5️⃣ 🔧 LIMPIEZA Y MAINTENIMIENTO

| Flujo | Estado | Propósito | Frecuencia |
|-------|--------|-----------|------------|
| `nodo-pulidor-respuestas.json` | ⏳ Revisión | Pulidor de respuestas | - |
| `nodos-copiloto-para-agregar.json` | ⏳ Revisión | Nodos copiloto | - |
| `mcp-helper-workflow.json` | ⏳ Revisión | MCP helper | - |
| `mcp-helper-v2.json` | ⏳ Revisión | MCP helper v2 | - |

---

## ⚡ Flujos Críticos (Activos)

### 🔴 **ALTA PRIORIDAD** (Críticos)

#### 1. Agente Luz v6.5 - Con Herramientas Admin Copiloto
**Archivo**: `Agente Luz v6.5 - Con Herramientas Admin Copiloto.json`  
**Estado**: ✅ Activo  
**Frecuencia**: Continuo  

**Descripción**:
Agente de IA que atiende clientes por WhatsApp. Recibe mensajes vía webhook, procesa con DeepSeek, busca productos, gestiona carritos, y escala a humanos cuando es necesario.

**Flujo de Trabajo**:
```
YCloud Webhook 
  → Limpieza de datos (normalización)
  → Agente IA (DeepSeek) - decisiones
  → Herramientas (PostgresTool, SQL)
  → Formatear respuesta (timeline)
  → YCloud Send
  → Guardar logs
```

**Herramientas Disponibles**:
- `TOOL_BuscarProductos` - Busca productos en Supabase
- `TOOL_BuscarConocimiento` - Info de la empresa
- `TOOL_GuardarNombreCliente` - Guarda nombre
- `TOOL_AnadirAlCarrito` - Añade a pre_pedido
- `TOOL_CalcularTotalPrePedido` - Suma del carrito
- `TOOL_CambiarEstadoCliente` - Cambia estado
- `TOOL_AgentAction` - Acciones del agente

**Estados del Cliente**:
```
NUEVO → NOMBRE_SOLICITADO → ATENCION_LUZ → EN_PEDIDO → PEDIDO_FINALIZADO
                                     ↓
                                 ESCALADO
```

**Integraciones**:
- YCloud API (entradas y salidas)
- Supabase RPC Functions
- PostgreSQL
- OpenAI DeepSeek

---

#### 2. workflow-sync-clientes-supabase-to-local
**Archivo**: `workflow-sync-clientes-supabase-to-local.json`  
**Estado**: ✅ Activo  
**Frecuencia**: Cada hora  

**Descripción**:
Sincroniza clientes desde Supabase (instancia 2) hacia PostgreSQL (local). Se ejecuta hourly.

**Datos Movidos**:
- Clientes
- Telefonos (unique key)
- Estados de conversación
- Información adicional

**Error Handling**:
- UPSERT por teléfono
- Logs de sincronización
- Error tracking

---

#### 3. workflow-confirmar-prepedido
**Archivo**: `workflow-confirmar-prepedido.json`  
**Estado**: ✅ Activo  
**Frecuencia**: Continuo  

**Descripción**:
Procesa confirmaciones de pre-pedido desde WhatsApp. Verifica precios antes de confirmar.

**Flujo de Trabajo**:
```
YCloud Message
  → Validar estado del cliente
  → Buscar pre_pedido en PostgreSQL
  → Calcular precio actualizado
  → Verificar que no cambió de precio
  → Confirmar en Supabase (instancia 1)
  → Actualizar estado en PostgreSQL
  → Enviar confirmación a YCloud
  → Guardar log
```

**Validaciones**:
- Estado debe ser "EN_PEDIDO"
- Precio actual debe coincidir
- Telefono debe estar sincronizado

---

#### 4. workflow-audit-integrity-daily
**Archivo**: `workflow-audit-integrity-daily.json`  
**Estado**: ✅ Activo  
**Frecuencia**: Diario (6 AM)  

**Descripción**:
Auditoría diaria de integridad de datos. Ejecuta checks y reporta problemas.

**Checks Realizados**:
- Cliente sin nombre
- Pedido sin estado
- Duplicados en telefonos
- Carritos viejos sin procesar
- Datos incompletos

**Output**:
- Reporte en Supabase
- Notificaciones por email

---

#### 5. workflow-recordatorio-carritos
**Archivo**: `workflow-recordatorio-carritos.json`  
**Estado**: ✅ Activo  
**Frecuencia**: 4 veces por día  

**Descripción**:
Envía recordatorios de carritos abandonados a clientes.

**Lógica**:
1. Busca carritos sin procesar
2. Marca como enviado
3. Envía WhatsApp recordatorio
4. Espera 24h antes de nuevo recordatorio

**Criterios**:
- Carrito con >0 items
- Última modificación hace >24h
- Cliente no ha dado confirmación

---

#### 6. workflow-procesar-buffer
**Archivo**: `workflow-procesar-buffer.json`  
**Estado**: ✅ Activo  
**Frecuencia**: Continuo (cada 10s)  

**Descripción**:
Agrupa mensajes de clientes para procesarlos en batches. Mejora performance.

**Lógica**:
1. Lee mensajes en buffer (últimos 10)
2. Agrupa por cliente
3. Pre-procesa los mensajes
4. Envía al Agente Luz
5. Limpia buffer procesado

**Beneficios**:
- Reduce llamadas API
- Mejora latencia
- Maneja spikes de tráfico

---

### 🟡 **MEDIA PRIORIDAD**

#### 7. workflow-sync-clientes-local-to-supabase
**Archivo**: `workflow-sync-clientes-local-to-supabase.json`  
**Estado**: ⏳ Revisión  

**Descripción**:
Sincroniza clientes desde PostgreSQL (local) hacia Supabase (instancia 2). Se ejecuta hourly.

---

#### 8. workflow-sync-productos
**Archivo**: `workflow-sync-productos.json`  
**Estado**: ⏳ Revisión  

**Descripción**:
Sincroniza productos de la tienda web hacia Supabase.

---

#### 9. workflow-auditoria-pedidos
**Archivo**: `workflow-auditoria-pedidos.json`  
**Estado**: ✅ Activo  

**Descripción**:
Auditoría periódica de pedidos históricos para detectar errores y anomalías.

---

#### 10. workflow-auto-etiquetar-ycloud
**Archivo**: `workflow-auto-etiquetar-ycloud.json`  
**Estado**: ✅ Activo  

**Descripción**:
Automáticamente etiqueta clientes en YCloud según su comportamiento.

---

---

## 📝 Flujos en Revisión

| Flujo | Motivo | Notas |
|-------|--------|-------|
| `workflow-sync-clientes-local-to-supabase.json` | Mejora sincronización | Prioridad media |
| `workflow-sync-productos-v2.json` | Version mejorada | Pendiente de testing |
| `workflow-sync-clientes-bucle-robusto.json` | Alternativa robusta | Pendiente de testing |

---

## 🧪 Flujos Inactivos

### Agentes IA Anteriores
- `agente-luz-v3-ycloud.json`
- `agente-luz-v4-hibrido.json`
- `agente-luz-v5-con-copiloto-TEMP.json`

### Copilotos Operaciones
- `Copiloto de Operaciones (13).json`
- `Copiloto-Operaciones-v2-YCloud.json`

### Marketing
- `campana-navidad-151-clientes.json`
- `campana-500-clientes-invitatienda.json`
- `campana-masiva-anti-duplicados.json`
- `test-carousel-navidad.json`

### Referencia
- `unico 316 (2).json`

---

## 🔗 Integraciones

### 🗄️ Bases de Datos

#### Supabase
**Cuenta 1** (Tienda Web):
- Productos
- Variantes
- Imágenes
- Planes de envío

**Cuenta 2** (Clientes y Mensajes):
- Clientes
- Pedidos
- Mensajes
- RPC Functions (búsqueda)

#### PostgreSQL (Docker)
- Agente Luz
- Carritos
- Pre-pedidos
- Historial conversaciones
- Logs de n8n

### 📱 WhatsApp y Comunicación

#### YCloud API
**Base URL**: `https://api.ycloud.com/v2/whatsapp/messages`

**Endpoints**:
- `/contacts` - Gestión de contactos
- `/messages` - Envío y recepción
- `/webhooks` - Webhooks

**Autenticación**:
- Header: `X-API-Key`
- Value: Tu API key de YCloud

**Features**:
- Text messages
- Buttons interactivos
- Static templates
- File attachments

### 🤖 Inteligencia Artificial

#### OpenAI
- Modelo: `gpt-4.1-mini`
- API Key: `8BVSsLxHakKs5L6l`
- Uso: Agente conversación

#### DeepSeek
- API Key: `8BVSsLxHakKs5L6l`
- Uso: Búsqueda de productos, pre-procesamiento

### 🌐 Servicios Adicionales

#### Antigravity
- MCP configuration
- Workflow management
- Testing environments

#### Python Script
- `n8n_manager.py` - CLI para gestionar workflows
- Location: `../scripts/n8n_manager.py`

---

## 🔧 Guías de Configuración

### Conectar con n8n

**URL**: `https://dep-n8n.n8ntusaguacates.space`

**Configuración de Credenciales**:

```bash
# Crear archivo .env.n8n
N8N_BASE_URL=https://dep-n8n.n8ntusaguacates.space
N8N_API_KEY=tu-api-key-jwt
```

### Instalar Flujo

```bash
# Usar script
python ../scripts/n8n_manager.py create flujo.json

# O importar manualmente en n8n
1. Workflows → Import from File
2. Selecciona el archivo JSON
3. Actualiza credenciales marcadas
```

### Configurar Webhook en YCloud

1. Activa el flujo en n8n
2. Copia la URL del webhook
3. En YCloud Dashboard → Webhooks → Add Webhook
4. Event: `whatsapp.inbound_message.received`
5. URL: URL de n8n

---

## 🐛 Troubleshooting

### Problemas Comunes

#### 1. Agente no responde
**Solución**:
- Verifica que el webhook esté activo en n8n
- Revisa logs del flujo en n8n
- Verifica que YCloud webhooks apunten a n8n

#### 2. Error "Invalid API Key"
**Solución**:
- Verifica que el header sea `X-API-Key` (con X mayúscula)
- Revisa tu API key de YCloud
- Verifica que la API key esté configurada como credencial en n8n

#### 3. Error "Function not found" (Supabase)
**Solución**:
- Ejecuta `supabase-search-function.sql` en el SQL Editor de Supabase
- Verifica que la función RPC esté creada
- Revisa que el nombre de la función coincida

#### 4. Sincronización lenta
**Solución**:
- Verifica que el sync se ejecute hourly
- Revisa logs para ver si hay errores
- Considera optimizar queries SQL

#### 5. Duplicados en clientes
**Solución**:
- Ejecuta `clean-phone-numbers.sql`
- Verifica unique key en tabla clientes
- Revisa sync-clientes workflow

### Comandos de Debug

```bash
# Listar workflows
python ../scripts/n8n_manager.py list

# Ver estado de workflow
python ../scripts/n8n_manager.py audit <id>

# Ejecutar workflow manualmente
python ../scripts/n8n_manager.py run <id>
```

---

## 📊 Estadísticas

### Resumen General

| Métrica | Valor |
|---------|-------|
| Total de flujos | 46 JSON files |
| Flujos activos | 9 (20%) |
| Flujos en revisión | 6 (13%) |
| Flujos inactivos | 31 (67%) |
| Versiones de Agente Luz | 6+ (v6.5 actual) |
| Integraciones | 4 principales |
| Bases de datos | 2 sistemas |
| Plan de ejecución | Hourly, 4x/día, 10s |

### Plan de Ejecución

| Flujo | Frecuencia | Duración Estimada |
|-------|------------|-------------------|
| Sync Clientes | Hourly | 5-10 min |
| Sync Productos | Hourly | 3-5 min |
| Confirmar Pre-pedido | Continuo | <1 min |
| Pedidos Web | Continuo | <1 min |
| Recordatorios Carritos | 4x/día | 5-10 min |
| Procesar Buffer | 10s | <1 min |
| Auditoría Diaria | Diario | 5-10 min |
| Auto-etiquetar YCloud | Continuo | <1 min |

---

## 🚀 Punto de Entrada Principal

**Webhook**: `https://dep-n8n.n8ntusaguacates.space/webhook/ycloud`

Este webhook:
- Escucha mensajes de WhatsApp
- Procesa 100% de interacciones cliente
- Retorna respuesta inmediata
- Es el cerebro central de la operación

---

## 📚 Recursos Adicionales

### Archivos de Documentación

- `INDEX_FLUJOS.md` - Índice clasificado de flujos
- `HABILIDADES_N8N.md` - Capacidades del asistente con n8n
- `CAPACIDADES-N8N.md` - Capacidades técnicas
- `DIAGRAMA_ARQUITECTURA.md` - Diagramas visuales
- `DIAGRAMA_CONECTIVIDAD.md` - Diagrama de integraciones

### Guías Específicas

- `GUIA-CONECTAR-N8N-SUPABASE.md`
- `GUIA-SETUP-N8N-ANTIGRAVITY.md`
- `GUIA-INTEGRAR-COPILOTO.md`
- `GUIA-SYNC-VARIANTES.md`

### Scripts

- `n8n_manager.py` - Gestión workflows vía API
- Scripts SQL para setup de BD
- Scripts JS para transformación de datos

---

## 📞 Soporte

### Problemas
1. Revisa este manual
2. Chequea `INDEX_FLUJOS.md`
3. Lee `HABILIDADES_N8N.md`

### Crear/Modificar Flujos
1. Describe tus requerimientos
2. Comparte contexto
3. Itera según resultados

---

**Fin del Manual**  

Última actualización: Febrero 2026  
Versión: 2.0  
Estado: Completo y Actualizado
