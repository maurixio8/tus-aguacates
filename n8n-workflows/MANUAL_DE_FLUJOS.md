# 🥑 Manual de Flujos de n8n - Tus Aguacates

**Última actualización**: Enero 2026

---

## 📋 Índice

1. [Introducción](#introducción)
2. [Categorías de Flujos](#categorías-de-flujos)
3. [Resumen de Conexiones](#resumen-de-conexiones)
4. [Detalles por Flujo](#detalles-por-flujo)
5. [Configuración de Credenciales](#configuración-de-credenciales)

---

## 🎯 Introducción

Este manual documenta todos los flujos de n8n utilizados en el proyecto **Tus Aguacates**. Los flujos están diseñados para integrar la tienda en línea con sistemas externos, automatizar procesos y mejorar la atención al cliente.

**Total de archivos**: 174

**Ubicación**: `tus-aguacates/n8n-workflows/`

---

## 🗂️ Categorías de Flujos

### 1️⃣ **Sincronización de Datos**
- Sincronización de productos entre Supabase y PostgreSQL local
- Sincronización de clientes entre Supabase y PostgreSQL local

### 2️⃣ **Automatización de Pedidos**
- Confirmación de pre-pedidos desde WhatsApp
- Automatización de pedidos web con limpieza de datos
- Limpieza de datos masiva

### 3️⃣ **Agentes de IA**
- Agente Luz (v3, v4, v5, v6, v6.2, v6.3, v6.4, v6.5)
- Agente WhatsApp MVP
- Agente Operaciones

### 4️⃣ **Marketing y Campañas**
- Campañas navideñas (151 clientes)
- Campañas masivas de 500 clientes
- Campañas anti-duplicados
- Carousel navidad

### 5️⃣ **Limpieza y Mantenimiento**
- Buffer de limpieza
- Auditoría de integridad diaria
- Auditoría de pedidos
- Monitoreo de escalados

### 6️⃣ **Herramientas Admin Copiloto**
- Agente con herramientas de administración
- Ayuda operacional
- Herramientas de variantes y etiquetas

---

## 🔌 Resumen de Conexiones

### Bases de Datos
| Sistema | Propósito | Credencial n8n |
|---------|-----------|----------------|
| **Supabase** | Almacén de productos y clientes | `Supabase account 2` |
| **PostgreSQL Docker** | Base de datos local de productos_tienda y clientes | `Mi PostgreSQL Docker` |

### Servicios Externos
| Sistema | Propósito | Tipo de autenticación |
|---------|-----------|----------------------|
| **YCloud** | WhatsApp Business API | HTTP Header Auth (`X-API-Key`) |
| **DeepSeek** | Modelo de IA para el agente | API Key |
| **GPT-4o-mini** | Limpieza de datos en pedidos web | API Key |

### Integraciones Webhooks
| Servicio | Webhook | Descripción |
|----------|---------|-------------|
| **YCloud** | `ycloud` | Recibe mensajes de WhatsApp |
| **Tienda Online** | `confirmar-prepedido` | Confirma pre-pedidos desde WhatsApp |
| **Tienda Online** | `webhook-pedidos-web` | Recibe pedidos web completados |

---

## 📖 Detalles por Flujo

### 🔁 FLUJOS DE SINCRONIZACIÓN

#### `workflow-sync-productos.json`
**Sincronización Productos Supabase → Local**

| Característica | Descripción |
|----------------|-------------|
| **Frecuencia** | Cada hora |
| **Origen** | Supabase (products table) |
| **Destino** | PostgreSQL (productos_tienda table) |
| **Método** | Sincronización completa (DELETE + INSERT) |
| **Verificación** | Conteo de productos activos |

**Flujo:**
1. ⏰ Schedule Trigger (cada hora)
2. 📥 Obtener Productos Supabase (500 items)
3. 🔄 Transformar Datos (mapear campos)
4. 🗑️ Limpiar Tabla (DELETE FROM productos_tienda)
5. 💾 Insertar Productos
6. ✅ Verificar Total

**Credenciales requeridas:**
- `Supabase account 2`
- `Mi PostgreSQL Docker`

**Estado**: Desactivado

---

#### `workflow-sync-productos-v2.json`
**Sincronización de Variantes y Variantes Completa**

| Característica | Descripción |
|----------------|-------------|
| **Versión** | v2 (Simple) y Completa |
| **Origen** | Supabase (products table) |
| **Destino** | PostgreSQL (productos_tienda table) |
| **Método** | Upsert o Sincronización completa |

**Flujo:**
1. ⏰ Schedule Trigger
2. 📥 Obtener Productos/Variantes
3. 🔄 Transformar y mapear variantes
4. 💾 Upsert o Insertar

**Credenciales requeridas:**
- `Supabase account 2`
- `Mi PostgreSQL Docker`

**Archivos relacionados:**
- `sync-productos-v2-simple.json`
- `sync-productos-variantes-completo.json`
- `tool-obtener-variantes.json`

---

#### `workflow-sync-clientes-supabase-to-local.json`
**Sincronización Clientes Supabase → Local**

| Característica | Descripción |
|----------------|-------------|
| **Frecuencia** | Cada hora |
| **Origen** | Supabase (customers table) |
| **Destino** | PostgreSQL (clientes table) |
| **Método** | UPSERT (ON CONFLICT) |
| **Verificación** | Conteo y estado de sincronización |

**Flujo:**
1. ⏰ Schedule Trigger
2. 📥 Obtener Clientes Supabase (2000 items)
3. 🔄 Transformar Clientes (normalizar teléfono, extraer datos)
4. 📤 Preparar para UPSERT
5. 💾 UPSERT Cliente (por teléfono)
6. ✅ Verificar Sincronización

**Normalización de datos:**
- Teléfono: Remueve caracteres no numéricos
- Prefijo: Asegura prefijo `57` si tiene 10 dígitos
- Campos: Nombre, email, dirección, ciudad, totales

**Credenciales requeridas:**
- `Supabase account 2` (O id: `oFlOZEZmGLS2kaKr`)
- `Mi PostgreSQL Docker` (O id: `R6hc0vEZJhKQSi3G`)

**Estado**: ✅ Activo

**Archivos relacionados:**
- `workflow-sync-clientes-local-to-supabase.json`
- `workflow-sync-clientes-bucle-robusto.json`

---

#### `workflow-sync-clientes-local-to-supabase.json`
**Sincronización Clientes Local → Supabase**

| Característica | Descripción |
|----------------|-------------|
| **Origen** | PostgreSQL (clientes table) |
| **Destino** | Supabase (customers table) |
| **Método** | UPSERT |
| **Frecuencia** | Manual o programado |

**Flujo:**
1. 📥 Obtener Clientes Local
2. 🔄 Transformar (mapear a formato Supabase)
3. 💾 UPSERT en Supabase

**Credenciales requeridas:**
- `Mi PostgreSQL Docker`
- `Supabase account 2`

**Estado**: Inactivo

---

### 📦 FLUJOS DE AUTOMATIZACIÓN DE PEDIDOS

#### `workflow-confirmar-prepedido.json`
**Confirmar Pre-Pedido → Supabase (CON VERIFICACIÓN)**

| Característica | Descripción |
|----------------|-------------|
| **Disparador** | Webhook HTTP (`/confirmar-prepedido`) |
| **Origen** | Agente Luz (WhatsApp) |
| **Destino** | Supabase (orders table) |
| **Verificación** | Busca pre-pedido por teléfono y compara con productos |

**Flujo:**
1. 🎯 Webhook Confirmar
2. 📥 Obtener Pre-Pedido (por teléfono)
3. 🔀 ¿Tiene Pre-Pedido?
4. 📋 Obtener Productos de Supabase
5. 🔀 ¿Los productos coinciden?
6. 💾 Crear Pedido en Supabase
7. ✅ Respuesta al cliente

**Flujo de validación:**
1. Busca pre-pedido en clientes por teléfono
2. Recupera productos del pre-pedido
3. Busca productos en Supabase (por nombres y precios)
4. Verifica que coinciden exactamente
5. Si coinciden → Crea pedido
6. Si no coinciden → Notifica error

**Credenciales requeridas:**
- `Mi PostgreSQL Docker`
- `Supabase account 2`

**Webhook ID**: `confirmar-prepedido`

**Estado**: Activo

---

#### `automation-pedidos-web.json`
**Automatización Pedidos Web y Limpieza de Datos**

| Característica | Descripción |
|----------------|-------------|
| **Disparador** | Webhook HTTP (`/webhook-pedidos-web`) |
| **Origen** | Tienda en línea (checkout completado) |
| **Procesamiento** | IA (GPT-4o-mini) para limpieza de datos |
| **Destino** | Notificación (Slack, Telegram, WhatsApp, Email) |

**Flujo:**
1. 📝 Webhook Pedido Web
2. 🧠 IA Limpieza Datos (GPT-4o-mini)
3. 📦 Formatear Notificación
4. 🔔 Enviar Notificación (configurable)

**Salida de la IA:**
```json
{
  "cliente_nombre_corregido": "Nombre en mayúscula inicial",
  "direccion_formateada": "Dirección estandarizada",
  "resumen_pedido_limpio": "Texto del pedido limpio",
  "alerta_posible_fraude": false,
  "mensaje_equipo": "Mensaje para el equipo de despacho"
}
```

**Reglas de limpieza:**
1. Emojis: Asegura que aparezcan correctamente (🥑, frutas, etc.)
2. Dirección: Corrige errores de escritura
3. Nombres: Capitaliza correctamente

**Credenciales requeridas:**
- GPT-4o-mini

**Webhook ID**: `webhook-pedidos-web`

**Estado**: Activo (necesita configurar nodo de notificación)

---

#### `workflow-auditoria-pedidos.json`
**Auditoría de Pedidos**

| Característica | Descripción |
|----------------|-------------|
| **Frecuencia** | Diaria |
| **Propósito** | Verificar integridad de pedidos |
| **Acciones** | Alertas sobre pedidos incompletos |

**Flujo:**
1. ⏰ Schedule Trigger (diario)
2. 📥 Auditoría de pedidos
3. 📊 Generar reporte
4. 🔔 Notificar si hay problemas

**Estado**: Activo

---

#### `workflow-audit-integrity-daily.json`
**Auditoría de Integridad Diaria**

| Característica | Descripción |
|----------------|-------------|
| **Frecuencia** | Diaria |
| **Propósito** | Revisar integridad general del sistema |
| **Acciones** | Reporte de anomalías |

**Archivos relacionados:**
- `workflow-auditoria-pedidos.json`
- `workflow-procesar-buffer.json`
- `workflow-tracking-respuestas.json`

**Estado**: Activo

---

### 🤖 FLUJOS DE AGENTES DE IA

#### `Agente-Luz-v6-Mejorado.json`
**Agente Luz v6 - Principal (Mejorado)**

| Característica | Descripción |
|----------------|-------------|
| **Versión** | v6 Mejorado |
| **Disparador** | Webhook YCloud (`/ycloud`) |
| **Salida** | Respuestas a WhatsApp |
| **Modelo** | DeepSeek |

**Funcionalidades principales:**
1. **Pre-procesamiento**:
   - Detecta comandos `/test` (modo pruebas) y `/admin` (modo admin)
   - Detecta mensajes de medios (no soportados)
   - Saluda según la hora (Buenos días/tardes/noches)

2. **Gestión de comandos**:
   - Comandos `/test`: Prueba como cliente
   - Comandos `/admin`: Prueba como director
   - Números director: Mauricio (573203062007)

3. **Integración con herramientas:**
   - TOOL_BuscarProductos
   - TOOL_BuscarConocimiento
   - TOOL_GuardarNombreCliente
   - TOOL_AnadirAlCarrito
   - TOOL_CalcularTotalPrePedido
   - TOOL_CambiarEstadoCliente

4. **Estados del cliente:**
   ```
   NUEVO → NOMBRE_SOLICITADO → ATENCION_LUZ → EN_PEDIDO → PEDIDO_FINALIZADO
                                                ↓
                                            ESCALADO
   ```

**Flujo general:**
1. 📥 Webhook YCloud
2. ✅ Responder OK
3. 🧠 Pre-procesamiento YCloud
4. ❓ ¿Es Media?
5. ❓ ¿Comando Admin/Test?
6. 🤖 Llamada a IA (DeepSeek)
7. 🛠️ Ejecutar Herramientas
8. 📤 Respuesta YCloud

**Credenciales requeridas:**
- YCloud API Key
- Supabase API Key
- DeepSeek

**Webhook ID**: `tus-aguacates-ycloud-v4`

**Estado**: Activo

**Archivos relacionados:**
- `Agente-Luz-v6.2-corregido.json`
- `Agente-Luz-v6.3-busqueda-mejorada.json`
- `Agente-Luz-v6.4-variantes-completas.json`
- `Agente-Luz-v6.5-admin-copiloto.json`
- `Agente-Luz-v5-Hibrido-Copiloto.json`
- `Agente-Luz-v4-hibrido.json`
- `agente-whatsapp-mvp.json`

---

#### `agente-luz-v5-con-copiloto-TEMP.json`
**Agente Luz v5 - Hibrido con Copiloto (Temporal)**

| Característica | Descripción |
|----------------|-------------|
| **Versión** | v5 Hibrido |
| **Copiloto** | Sistema operativo integrado |
| **Propósito** | Mejorar respuestas complejas |

**Estado**: Temporal

---

#### `agente-luz-v4-hibrido.json`
**Agente Luz v4 - Hibrido**

| Característica | Descripción |
|----------------|-------------|
| **Versión** | v4 |
| **Modelo** | DeepSeek |
| **Copiloto** | Sistema operativo de respuestas |

**Estado**: Inactivo

---

#### `agente-whatsapp-mvp.json`
**Agente WhatsApp MVP**

| Característica | Descripción |
|----------------|-------------|
| **Versión** | MVP (Minimum Viable Product) |
| **Modelo** | LLM básico |
| **Propósito** | Versión simplificada del agente |

**Estado**: Inactivo

---

#### `Copiloto de Operaciones (13).json`
**Copiloto de Operaciones v13**

| Característica | Descripción |
|----------------|-------------|
| **Versión** | v13 |
| **Propósito** | Ayuda operacional con gestión de pedidos |

**Estado**: Inactivo

---

#### `Copiloto-Operaciones-v2-YCloud.json`
**Copiloto de Operaciones v2 - YCloud**

| Característica | Descripción |
|----------------|-------------|
| **Versión** | v2 |
| **Disparador** | YCloud Webhook |
| **Modelo** | IA de operaciones |

**Estado**: Inactivo

---

### 📢 FLUJOS DE MARKETING Y CAMPANAS

#### `campana-navidad-151-clientes.json`
**Campaña Navidad - 151 Clientes**

| Característica | Descripción |
|----------------|-------------|
| **Propósito** | Campaña navideña personalizada |
| **Destinatarios** | 151 clientes seleccionados |
| **Tipo** | Masa (Email/WhatsApp) |

**Archivos relacionados:**
- `campana-500-clientes-invitatienda.json`
- `campana-masiva-anti-duplicados.json`
- `test-carousel-navidad.json`

**Estado**: Desactivado

---

#### `campana-500-clientes-invitatienda.json`
**Campaña 500 Clientes - Invitatienda**

| Característica | Descripción |
|----------------|-------------|
| **Propósito** | Campaña masiva para 500 clientes |
| **Destinatarios** | 500 clientes |
| **Tipo** | Masa (Email/WhatsApp) |

**Estado**: Desactivado

---

#### `campana-masiva-anti-duplicados.json`
**Campaña Masiva - Anti-Duplicados**

| Característica | Descripción |
|----------------|-------------|
| **Propósito** | Envío masivo evitando duplicados |
| **Lógica** | Verifica registros previos |
| **Tipo** | Masa |

**Estado**: Desactivado

---

#### `test-carousel-navidad.json`
**Test Carousel Navidad**

| Característica | Descripción |
|----------------|-------------|
| **Propósito** | Prueba de carousel navideño |
| **Tipo** | Test visual |
| **Destinatarios** | Cliente de prueba |

**Estado**: Desactivado

---

### 🔧 FLUJOS DE LIMPIEZA Y MANTENIMIENTO

#### `workflow-procesar-buffer.json`
**Procesar Buffer de Limpieza**

| Característica | Descripción |
|----------------|-------------|
| **Frecuencia** | Programada |
| **Propósito** | Limpieza de datos pendientes |
| **Acciones** | Normalización y corrección |

**Estado**: Activo

---

#### `workflow-recordatorio-carritos.json`
**Recordatorio Carritos Abandonados**

| Característica | Descripción |
|----------------|-------------|
| **Frecuencia** | 4 veces al día (9:00, 13:00, 17:00, 21:00) |
| **Propósito** | Recordar carritos abandonados |
| **Ventana** | Entre 2 y 23 horas de inactividad |
| **Límite** | 20 carritos por ejecución |
| **Verificación** | No enviar si ya se envió hoy |

**Flujo:**
1. ⏰ Schedule Trigger (4 veces al día)
2. 🔍 Buscar Carritos Abandonados
   - WHERE estado_conversacion = 'EN_PEDIDO'
   - AND pre_pedido IS NOT NULL
   - AND > 2 horas inactivo
   - AND < 23 horas inactivo
   - AND no enviado hoy
3. 📧 Enviar Recordatorio WhatsApp
4. 💾 Registrar en recordatorios_enviados

**Credenciales requeridas:**
- `Mi PostgreSQL Docker`
- YCloud API Key

**Estado**: Activo

---

#### `workflow-auto-etiquetar-ycloud.json`
**Auto Etiquetar en YCloud**

| Característica | Descripción |
|----------------|-------------|
| **Propósito** | Etiquetar clientes en YCloud |
| **Disparador** | Nuevo cliente o pedido |
| **Lógica** | Categorización automática |

**Estado**: Activo

---

#### `monitor-escalados-workflow.json`
**Monitor de Escalados**

| Característica | Descripción |
|----------------|-------------|
| **Propósito** | Monitorear servicios escalados |
| **Frecuencia** | Programada |
| **Acciones** | Alertas de problemas |

**Estado**: Activo

---

### 🛠️ FLUJOS DE HERRAMIENTAS ADMIN COPILOTO

#### `Agente Luz v6.5 - Con Herramientas Admin Copiloto.json`
**Agente Luz v6.5 - Herramientas Admin Copiloto**

| Característica | Descripción |
|----------------|-------------|
| **Versión** | v6.5 |
| **Función** | Agente con herramientas de administración |
| **Copiloto** | Sistema operativo con herramientas admin |

**Herramientas disponibles:**
- TOOL_BuscarProductos
- TOOL_BuscarConocimiento
- TOOL_GuardarNombreCliente
- TOOL_AnadirAlCarrito
- TOOL_CalcularTotalPrePedido
- TOOL_CambiarEstadoCliente
- HERRAMIENTAS_ADMIN (nuevas)

**Archivos relacionados:**
- `herramientas-admin-copiloto.json`
- `agente-luz-v6.5-admin-copiloto.json`
- `Agente Luz v6.5 - Con Herramientas Admin Copiloto (1).json`

**Estado**: Activo

---

#### `herramientas-admin-copiloto.json`
**Copiloto de Herramientas Admin**

| Característica | Descripción |
|----------------|-------------|
| **Propósito** | Sistema operativo de administración |
| **Función** | Proporciona herramientas admin a otros agentes |
| **Estado**: Activo |

---

### 🧪 FLUJOS DE TESTING Y MIGRACIÓN

#### `unico 316 (2).json`
**Flujo Anterior - Referencia (316)**

| Característica | Descripción |
|----------------|-------------|
| **Propósito** | Versión anterior del flujo |
| **Estado** | Archivo de referencia |
| **Uso** | Comparación y migración |

**Estado**: Inactivo

---

## 🔧 Configuración de Credenciales

### Credenciales de Bases de Datos

#### Supabase
**ID**: `oFlOZEZmGLS2kaKr`
**Nombre**: `Supabase account 2`

| Campo | Valor |
|-------|-------|
| Host | `db.[tu-proyecto].supabase.co` |
| Port | `5432` |
| Database | `postgres` |
| User | `postgres` |
| Password | [Tu password de Supabase] |
| SSL | ✅ Activado |

---

#### PostgreSQL Docker
**ID**: `R6hc0vEZJhKQSi3G`
**Nombre**: `Mi PostgreSQL Docker`

| Campo | Valor |
|-------|-------|
| Host | `localhost` |
| Port | `5432` |
| Database | `postgres` |
| User | `postgres` |
| Password | [Tu password de PostgreSQL] |

---

### Credenciales de IA

#### DeepSeek
**ID**: `8BVSsLxHakKs5L6l`
**Nombre**: `DeepSeek account 2`

| Campo | Valor |
|-------|-------|
| API Key | [Tu DeepSeek API Key] |
| Base URL | `https://api.deepseek.com/v1` |

---

#### GPT-4o-mini
**ID**: [Configurar]
**Nombre**: [Configurar]

| Campo | Valor |
|-------|-------|
| API Key | [Tu OpenAI API Key] |
| Model | `gpt-4o-mini` |
| Base URL | `https://api.openai.com/v1` |

---

### Credenciales de YCloud

**ID**: [Configurar]
**Nombre**: `YCloud API Key`

| Campo | Valor |
|-------|-------|
| Header Name | `X-API-Key` |
| Header Value | [Tu YCloud API Key] |
| Base URL | `https://api.ycloud.com/v2` |

---

## 📊 Estado de Flujos

| Estado | Descripción |
|--------|-------------|
| ✅ Activo | Flujo en funcionamiento |
| ⏸️ Inactivo | Flujo no activado |
| 🔧 Configuración requerida | Flujo listo pero sin credenciales/configuración |
| 📝 Temporal | Flujo temporal/provisorio |
| 🔄 En revisión | Flujo en proceso de actualización |

---

## 🚀 Guías de Configuración

### Guía: Conectar n8n a Supabase
**Archivo**: `GUIA-CONECTAR-N8N-SUPABASE.md`

Sigue los pasos para conectar Supabase a tus nodos en n8n.

---

### Guía: Integración Buffer
**Archivo**: `GUIA-INTEGRACION-BUFFER.md`

Sigue los pasos para configurar el sistema de buffer.

---

### Guía: Integrar Copiloto
**Archivo**: `GUIA-INTEGRAR-COPILOTO.md`

Sigue los pasos para configurar los agentes con copiloto.

---

### Guía: Setup Antigravity
**Archivo**: `GUIA-SETUP-N8N-ANTIGRAVITY.md`

Configuración de Antigravity para n8n.

---

### Guía: Sync Variantes
**Archivo**: `GUIA-SYNC-VARIANTES.md`

Sincronización de variantes de productos.

---

### Guía: Sync Clientes
**Archivo**: `GUIA-SYNC-CLIENTES.md`

Sincronización de clientes entre Supabase y PostgreSQL.

---

## 📝 Resumen de Estilos de Nodos

### Tipos de nodos usados:

| Tipo | Propósito | Archivo referencia |
|------|-----------|-------------------|
| `scheduleTrigger` | Frecuencia programada | `workflow-sync-productos.json` |
| `webhook` | Disparador HTTP | `workflow-confirmar-prepedido.json` |
| `supabase` | Conexión Supabase | `workflow-sync-productos.json` |
| `postgres` | Conexión PostgreSQL | `workflow-sync-clientes-supabase-to-local.json` |
| `code` | Lógica personalizada (JavaScript) | `workflow-sync-clientes-supabase-to-local.json` |
| `if` | Condicional | `workflow-recordatorio-carritos.json` |
| `respondToWebhook` | Respuesta HTTP | `Agente-Luz-v6-Mejorado.json` |
| `chainLlm` | Cadena de LLM (GPT-4o-mini) | `automation-pedidos-web.json` |

---

## 🧩 Sistema de Herramientas del Agente

### Herramientas Disponibles

| Herramienta | Descripción | Fuente |
|-------------|-------------|--------|
| `TOOL_BuscarProductos` | Busca productos en la tienda | Supabase/PostgreSQL |
| `TOOL_BuscarConocimiento` | Busca información de la empresa | PostgreSQL |
| `TOOL_GuardarNombreCliente` | Guarda nombre de cliente | PostgreSQL |
| `TOOL_AnadirAlCarrito` | Añade items al carrito (pre_pedido) | PostgreSQL |
| `TOOL_CalcularTotalPrePedido` | Calcula total del carrito | PostgreSQL |
| `TOOL_CambiarEstadoCliente` | Cambia estado del cliente | PostgreSQL |
| `HERRAMIENTAS_ADMIN` | Herramientas de administración | System Message |

### Estados del Cliente

```
NUEVO
  ↓
NOMBRE_SOLICITADO
  ↓
ATENCION_LUZ
  ↓
EN_PEDIDO
  ↓
PEDIDO_FINALIZADO
  ↓
ESCALADO
```

---

## 🧪 Probar Flujos

### Probar Sincronización de Productos

```bash
# En n8n, activar workflow-sync-productos.json
# Verificar productos en productos_tienda
```

### Probar Sincronización de Clientes

```bash
# En n8n, activar workflow-sync-clientes-supabase-to-local.json
# Verificar clientes en PostgreSQL
```

### Probar Webhook de Confirmar Pre-Pedido

```bash
curl -X POST "https://tus-aguacates.vercel.app/api/webhooks/confirmar-prepedido" \
  -H "Content-Type: application/json" \
  -d '{
    "telefono": "573001234567"
  }'
```

### Probar Webhook de Pedidos Web

```bash
curl -X POST "https://tus-aguacates.vercel.app/api/webhooks/webhook-pedidos-web" \
  -H "Content-Type: application/json" \
  -d '{
    "cliente_nombre_corregido": "Juan Pérez",
    "direccion_formateada": "Calle 123 #45-67",
    "resumen_pedido_limpio": "2 Aguacates Hass - $10.000",
    "alerta_posible_fraude": false,
    "mensaje_equipo": "Cliente nuevo, verificar antes de despachar"
  }'
```

### Probar Agente Luz

1. Envia mensaje a WhatsApp
2. Verifica respuesta desde n8n
3. Revisa logs del flujo

---

## ⚠️ Troubleshooting

### Error: "Function not found" (Supabase)

**Solución**: Ejecuta la función de búsqueda en el SQL Editor de Supabase.

---

### Error: "Invalid API Key" (YCloud)

**Solución**: Verifica que el header sea `X-API-Key` (con X mayúscula).

---

### Error: "Connection timeout"

**Solución**: Asegúrate de que:
1. SSL esté activado en n8n
2. Puerto sea 5432 o 6543 (pooler)
3. Credenciales sean correctas

---

### El agente no responde

**Solución**: Verifica:
1. Webhook esté activo en n8n
2. Credenciales de YCloud y DeepSeek sean correctas
3. Revisa logs del flujo

---

## 📚 Documentación Relacionada

- `README.md` - Guía principal del flujo Agente Luz v3
- `RESUMEN-SESION-2025-12-20.md` - Resumen de sesión de trabajo
- `RESUMEN-SESION-2025-12-21.md` - Resumen de sesión de trabajo

---

## 🎯 Resumen Ejecutivo

### Flujos Activos (2026)

1. ✅ `workflow-sync-clientes-supabase-to-local.json` - Sincronización de clientes (cada hora)
2. ✅ `workflow-confirmar-prepedido.json` - Confirmación de pre-pedidos desde WhatsApp
3. ✅ `automation-pedidos-web.json` - Automatización de pedidos web
4. ✅ `workflow-recordatorio-carritos.json` - Recordatorio de carritos abandonados
5. ✅ `workflow-auto-etiquetar-ycloud.json` - Auto etiquetado en YCloud
6. ✅ `monitor-escalados-workflow.json` - Monitor de escalados
7. ✅ `Agente-Luz-v6-Mejorado.json` - Agente Luz principal
8. ✅ `workflow-audit-integrity-daily.json` - Auditoría diaria

### Flujos Inactivos

- `workflow-sync-productos.json` - Sincronización de productos (cada hora)
- `workflow-sync-productos-v2.json` - Sincronización de variantes
- `workflow-sync-clientes-local-to-supabase.json` - Sincronización inversa
- Agentes v3, v4, v5 (archivos temporales/referencia)

### Pendientes de Configuración

- `automation-pedidos-web.json` - Configurar nodo de notificación
- `workflow-sync-clientes-local-to-supabase.json` - Activar si se requiere

---

## 🔄 Plan de Mantenimiento

### Semanal
- Revisar logs de flujos activos
- Verificar sincronización de datos
- Revisar alertas del monitor

### Mensual
- Actualizar credenciales si hay cambios
- Revisar integraciones externas
- Optimizar queries si hay lentitud

### Trimestral
- Actualizar versiones de agentes
- Revisar archivos JSON (limpieza de archivos antiguos)
- Actualizar documentación

---

## 📧 Soporte

Para preguntas sobre flujos:
1. Revisa este manual
2. Consulta archivos de guía (`GUIA-*.md`)
3. Revisa logs en n8n
4. Contacta al equipo técnico

---

**Versión del Manual**: 1.0
**Última actualización**: Enero 2026
**Autor**: Sistema de documentación automática
**Revisión**: Enero 2026 - Mauricio
