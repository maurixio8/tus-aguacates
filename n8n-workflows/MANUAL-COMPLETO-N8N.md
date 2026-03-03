# 📚 Manual de Flujos n8n - Tus Aguacates

> **Versión**: 1.0  
> **Última actualización**: Febrero 2026  
> **Autoría**: Documentación generada automáticamente

---

## 📋 Índice

1. [Introducción](#introducción)
2. [Arquitectura General](#arquitectura-general)
3. [Categorías de Flujos](#categorías-de-flujos)
4. [Flujos Principales](#flujos-principales)
5. [Conexiones con la Tienda](#conexiones-con-la-tienda)
6. [Credenciales Requeridas](#credenciales-requeridas)
7. [Guías de Configuración](#guías-de-configuración)
8. [Troubleshooting](#troubleshooting)

---

## 🎯 Introducción

Los flujos de n8n son automatizaciones que conectan WhatsApp con tu tienda en línea **Tus Aguacates**. Permiten:

- **Atención al cliente automatizada** mediante el agente "Luz"
- **Sincronización de datos** entre Supabase (tienda) y PostgreSQL local
- **Gestión de pedidos** desde WhatsApp
- **Recordatorios automáticos** de carritos abandonados
- **Auditoría de precios** y pedidos
- **Campañas de marketing** masivas

### ¿Por qué n8n?

n8n es una plataforma de automatización open-source que permite conectar diferentes servicios (WhatsApp, Supabase, PostgreSQL, OpenAI, etc.) mediante flujos visuales sin código.

---

## 🏗️ Arquitectura General

```
┌─────────────────────────────────────────────────────────────┐
│                     WhatsApp (YCloud)                       │
│                    +57 304 258 2777                         │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
              ┌────────────────┐
              │   Webhook n8n  │
              └───────┬────────┘
                      │
        ┌─────────────┼─────────────┐
        ▼             ▼             ▼
  ┌──────────┐  ┌──────────┐  ┌──────────┐
  │  Agente  │  │   Sync   │  │ Auditoría│
  │   Luz    │  │ Productos│  │ Pedidos  │
  └────┬─────┘  └────┬─────┘  └────┬─────┘
       │             │             │
       ▼             ▼             ▼
  ┌─────────────────────────────────────┐
  │     PostgreSQL (Base de datos)      │
  │  - clientes                         │
  │  - productos_tienda                 │
  │  - recordatorios_enviados            │
  └────────────┬────────────────────────┘
               │
               ▼ (Sync bidireccional)
  ┌─────────────────────────────────────┐
  │        Supabase (Tienda Online)      │
  │  - products                         │
  │  - customers                        │
  │  - guest_orders                      │
  └─────────────────────────────────────┘
```

---

## 📂 Categorías de Flujos

### 1. 🤖 Agentes Inteligentes (Atención al Cliente)

| Flujo | Archivo | Estado | Propósito |
|-------|---------|--------|-----------|
| Agente Luz v6.5 | `🥑 Agente Luz v6.5 - Con Herramientas Admin Copiloto.json` | ✅ Activo | Asistente virtual de WhatsApp con IA |
| Copiloto de Operaciones | `Copiloto-Operaciones-v2-YCloud.json` | ✅ Activo | Herramientas de administración para Mauricio |

### 2. 🔄 Sincronización de Datos

| Flujo | Archivo | Estado | Propósito |
|-------|---------|--------|-----------|
| Sync Productos | `workflow-sync-productos.json` | ⚠️ Inactivo | Sincroniza productos de Supabase a PostgreSQL local |
| Sync Clientes (Supabase → Local) | `workflow-sync-clientes-supabase-to-local.json` | ✅ Activo | Sincroniza clientes de la tienda a base local |
| Sync Clientes (Local → Supabase) | `workflow-sync-clientes-local-to-supabase.json` | ⚠️ Inactivo | Sincroniza clientes locales a la tienda |

### 3. 📦 Gestión de Pedidos

| Flujo | Archivo | Estado | Propósito |
|-------|---------|--------|-----------|
| Confirmar Pre-Pedido | `workflow-confirmar-prepedido.json` | ⚠️ Inactivo | Convierte carritos de WhatsApp en pedidos reales |
| Procesar Buffer | `workflow-procesar-buffer.json` | ✅ Activo | Procesa pedidos en cola |

### 4. 📢 Marketing y Recordatorios

| Flujo | Archivo | Estado | Propósito |
|-------|---------|--------|-----------|
| Recordatorio Carritos | `workflow-recordatorio-carritos.json` | ⚠️ Inactivo | Envía recordatorios de carritos abandonados |
| Auto-etiquetar YCloud | `workflow-auto-etiquetar-ycloud.json` | ✅ Activo | Etiqueta clientes automáticamente |
| Tracking Respuestas | `workflow-tracking-respuestas.json` | ✅ Activo | Rastrea respuestas a campañas |

### 5. 🔍 Auditoría y Monitoreo

| Flujo | Archivo | Estado | Propósito |
|-------|---------|--------|-----------|
| Auditoría Pedidos | `workflow-auditoria-pedidos.json` | ⚠️ Inactivo | Verifica discrepancias de precios en pedidos |
| Audit Integrity Daily | `workflow-audit-integrity-daily.json` | ✅ Activo | Verificación diaria de integridad de datos |

---

## 🤖 Flujos Principales Detallados

### 1. Agente Luz v6.5 - Asistente Virtual de WhatsApp

**📁 Archivo**: `🥑 Agente Luz v6.5 - Con Herramientas Admin Copiloto.json`

**🎯 Propósito**: Asistente de IA que atiende clientes por WhatsApp, responde preguntas, busca productos y gestiona carritos.

**🔧 Cómo funciona**:

```
1. Cliente envía mensaje por WhatsApp
   ↓
2. YCloud envía webhook a n8n
   ↓
3. Pre-procesamiento: Detecta si es cliente o admin (Mauricio)
   ↓
4. Si es admin (573203062007) → Modo Copiloto
   Si es cliente → Modo Agente Luz
   ↓
5. Agente Luz:
   - Busca productos automáticamente
   - Añade productos al carrito
   - Calcula totales
   - Consulta estado de pedidos
   - Escala a humano si es necesario
   ↓
6. Respuesta formateada con emojis
   ↓
7. YCloud envía respuesta por WhatsApp
```

**🛠️ Herramientas del Agente Luz**:

| Herramienta | Función |
|-------------|---------|
| `TOOL_AnadirAlCarrito` | Agrega productos al pre-pedido del cliente |
| `TOOL_CalcularTotalPrePedido` | Calcula el total del carrito |
| `TOOL_GuardarNombreCliente` | Guarda el nombre del cliente |
| `TOOL_GuardarDireccionCliente` | Guarda la dirección de entrega |
| `TOOL_BuscarProductos` | Busca productos en el catálogo |
| `TOOL_ObtenerVariantes` | Obtiene variantes de un producto (tamaños, precios) |
| `TOOL_ConsultarEstadoPedido` | Consulta estado del pedido del cliente |
| `TOOL_EscalarServicioCliente` | Escala conversación a humano |

**👨‍💻 Herramientas del Copiloto (Admin)**:

| Herramienta | Función |
|-------------|---------|
| `TOOL_ADMIN_ConsultarCliente` | Consulta datos de un cliente |
| `TOOL_ADMIN_ActualizarNombre` | Actualiza nombre de cliente |
| `TOOL_ADMIN_BuscarPorNombre` | Busca clientes por nombre |
| `TOOL_ADMIN_ListarClientesSinNombre` | Lista clientes sin nombre |
| `TOOL_ADMIN_VaciarCarrito` | Vacía carrito de un cliente |
| `TOOL_ADMIN_ResumenCarritos` | Estadísticas de carritos activos |
| `TOOL_ADMIN_ConfirmarPedido` | Convierte pre-pedido a pedido real |

**🧠 Inteligencia Artificial**: Utiliza DeepSeek (OpenAI-compatible) con temperatura 0.3 para respuestas consistentes.

---

### 2. Sincronización de Productos

**📁 Archivo**: `workflow-sync-productos.json`

**🎯 Propósito**: Mantiene sincronizado el catálogo de productos entre Supabase (tienda) y PostgreSQL local (usado por Agente Luz).

**⏰ Frecuencia**: Cada hora

**🔄 Flujo**:

```
1. Trigger: Cada hora
   ↓
2. Obtener productos de Supabase (tabla 'products')
   ↓
3. Transformar datos al formato de 'productos_tienda'
   ↓
4. Limpiar tabla productos_tienda
   ↓
5. Insertar productos actualizados
   ↓
6. Verificar total de productos
```

**📊 Campos sincronizados**:
- `supabase_id`, `name`, `slug`, `description`
- `price`, `discount_price`, `category_name`, `category_id`
- `main_image_url`, `stock`, `is_active`, `is_featured`
- `available_for`, `unit`, `is_organic`, `weight`

---

### 3. Sincronización de Clientes

**📁 Archivo**: `workflow-sync-clientes-supabase-to-local.json`

**🎯 Propósito**: Sincroniza clientes de la tienda online (Supabase) a la base local de WhatsApp (PostgreSQL).

**⏰ Frecuencia**: Cada hora

**🔄 Flujo**:

```
1. Trigger: Cada hora
   ↓
2. Obtener clientes de Supabase (tabla 'customers')
   ↓
3. Transformar y normalizar teléfonos
   ↓
4. UPSERT en tabla 'clientes'
   - Si existe: actualizar
   - Si no existe: crear
   ↓
5. Verificar sincronización
```

**📊 Campos sincronizados**:
- `supabase_id`, `telefono` (normalizado), `nombre`
- `email`, `direccion`, `ciudad`
- `total_pedidos`, `total_gastado`, `activo`

---

### 4. Confirmar Pre-Pedido

**📁 Archivo**: `workflow-confirmar-prepedido.json`

**🎯 Propósito**: Convierte un carrito de WhatsApp (pre-pedido) en un pedido real en la tienda online (Supabase).

**🔌 Activación**: Webhook HTTP

**🔄 Flujo**:

```
1. Webhook recibe: { telefono }
   ↓
2. Obtener pre-pedido de PostgreSQL
   ↓
3. ¿Tiene pre-pedido?
   NO → Error
   SÍ → Continuar
   ↓
4. Obtener precios actuales de Supabase
   ↓
5. Verificar precios:
   - Si hay discrepancias: corregir
   - Calcular total verificado
   ↓
6. Crear pedido en Supabase (tabla 'guest_orders')
   ↓
7. Limpiar carrito en PostgreSQL
   ↓
8. Etiquetar cliente en YCloud
   ↓
9. Notificar admin por WhatsApp
   ↓
10. Respuesta OK
```

**✅ Verificaciones**:
- Valida que el carrito tenga productos
- Compara precios del carrito vs catálogo actual
- Corrige automáticamente si hay diferencias
- Genera reporte de correcciones

---

### 5. Recordatorio Carritos Abandonados

**📁 Archivo**: `workflow-recordatorio-carritos.json`

**🎯 Propósito**: Envía recordatorios automáticos a clientes que tienen carritos pendientes.

**⏰ Frecuencia**: Cada 4 horas (9am, 1pm, 5pm, 9pm)

**🔄 Flujo**:

```
1. Trigger: Cada 4 horas
   ↓
2. Buscar carritos:
   - Estado: 'EN_PEDIDO'
   - Inactivos 2-23 horas
   - Sin recordatorio en las últimas 20h
   ↓
3. ¿Hay carritos?
   NO → Fin
   SÍ → Continuar
   ↓
4. Formatear mensaje con:
   - Lista de productos
   - Total del carrito
   - Día de próxima entrega
   - Botones interactivos
   ↓
5. Enviar por WhatsApp
   ↓
6. Registrar envío en 'recordatorios_enviados'
```

**📱 Botones del mensaje**:
- ✅ Completar Pedido
- 🛒 Ver Carrito
- ❌ Cancelar

---

### 6. Auditoría de Pedidos

**📁 Archivo**: `workflow-auditoria-pedidos.json`

**🎯 Propósito**: Compara pedidos históricos contra el catálogo actual para detectar discrepancias de precios.

**🔌 Activación**: Webhook HTTP

**🔄 Flujo**:

```
1. Webhook inicia auditoría
   ↓
2. Obtener todos los pedidos (Supabase)
   ↓
3. Obtener catálogo actual (Supabase)
   ↓
4. Combinar datos
   ↓
5. Analizar discrepancias:
   - Por cada pedido
   - Por cada producto
   - Comparar precio de compra vs precio actual
   ↓
6. Generar reporte:
   - Total pedidos analizados
   - Pedidos con discrepancias
   - Monto total de diferencia
   - Detalle de cada discrepancia
   ↓
7. Enviar reporte al admin (WhatsApp)
   ↓
8. Respuesta con reporte JSON
```

**📊 Métricas reportadas**:
- Total de pedidos analizados
- Cantidad de pedidos con discrepancias
- Total de discrepancias encontradas
- Monto total de diferencia (positivo o negativo)

---

## 🔗 Conexiones con la Tienda

### Supabase (Tienda Online)

**📡 URL**: Tu instancia de Supabase

**🗂️ Tablas utilizadas**:
- `products` - Catálogo de productos
- `customers` - Clientes registrados
- `guest_orders` - Pedidos de invitados/WhatsApp
- `product_variants` - Variantes de productos

**🔑 Autenticación**: API Key de Supabase (stored en credenciales n8n)

### PostgreSQL (Base Local)

**📍 Ubicación**: Docker local

**🗂️ Tablas utilizadas**:
- `clientes` - Clientes de WhatsApp
- `productos_tienda` - Catálogo sincronizado
- `variantes_productos` - Variantes sincronizadas
- `recordatorios_enviados` - Historial de recordatorios
- `envios_campana` - Campañas de marketing

### YCloud (WhatsApp Business API)

**📱 Número**: +57 304 258 2777

**🔌 Funciones**:
- Recibir mensajes (webhooks)
- Enviar mensajes (text, interactive, images)
- Gestionar contactos y etiquetas
- Enviar campañas masivas

---

## 🔑 Credenciales Requeridas

### 1. PostgreSQL (Base Local)

**Nombre en n8n**: `Mi PostgreSQL Docker`

**Parámetros**:
- Host: `localhost` o IP de Docker
- Port: `5432`
- Database: `tus_aguacates`
- User: `postgres`
- Password: [tu contraseña]

---

### 2. Supabase API

**Nombre en n8n**: `Supabase account 2`

**Parámetros**:
- Supabase URL: `https://TU_PROYECTO.supabase.co`
- API Key: `anon` key
- Service Role Key: `service_role` key (para operaciones admin)

---

### 3. YCloud API

**Nombre en n8n**: `YCloud account`

**Parámetros**:
- API Key: [Tu API key de YCloud]
- Header: `X-API-Key`

**Documentación**: https://docs.ycloud.com

---

### 4. OpenAI (DeepSeek)

**Nombre en n8n**: `DeepSeek account 2` o `OpenAi n8n`

**Parámetros**:
- API Key: [Tu API key de DeepSeek]
- Base URL: `https://api.deepseek.com/v1`
- Model: `deepseek-chat`

---

### 5. HTTP Requests

**Para webhook a la tienda**: No requiere autenticación (o usa tu propia lógica)

---

## 📖 Guías de Configuración

### Guía 1: Importar un flujo en n8n

1. **Descarga el archivo JSON** del flujo
2. **Abre n8n** en tu navegador
3. Ve a **Workflows** → **Import from File**
4. **Selecciona el archivo JSON**
5. **Verifica las credenciales**:
   - Clic en cada nodo que requiere credenciales
   - Selecciona o crea la credencial correspondiente
6. **Activa el flujo** (toggle en la esquina superior derecha)
7. **Prueba el flujo** (clic en "Execute Workflow")

---

### Guía 2: Configurar webhook de YCloud

**Para el Agente Luz**:

1. **Activa el flujo** "Agente Luz v6.5" en n8n
2. **Copia la URL del webhook** (nodo "📥 Webhook YCloud")
3. Ve a **YCloud Dashboard** → **Webhooks**
4. Clic en **Add Webhook**
5. Configura:
   - **Event**: `whatsapp.inbound_message.received`
   - **URL**: [URL copiada de n8n]
6. Guarda y activa

**Para Confirmar Pre-Pedido**:

1. Activa el flujo "Confirmar Pre-Pedido"
2. Copia la URL del webhook
3. Úsala desde tu aplicación o mediante cURL:

```bash
curl -X POST "https://TU_N8N_URL/webhook/confirmar-prepedido" \
  -H "Content-Type: application/json" \
  -d '{"telefono": "573001234567"}'
```

---

### Guía 3: Configurar sincronización automática

1. **Abre el flujo** de sincronización (ej: "Sync Productos")
2. **Verifica el nodo de trigger**:
   - Tipo: `Schedule Trigger`
   - Intervalo: Configura la frecuencia deseada
3. **Verifica las credenciales**:
   - Supabase: Para obtener datos
   - PostgreSQL: Para insertar datos
4. **Activa el flujo**
5. **Verifica la ejecución** en la pestaña "Executions"

---

### Guía 4: Añadir nueva herramienta al Agente Luz

1. **Abre el flujo** "Agente Luz v6.5"
2. **Añade un nodo** de tipo `Postgres Tool`
3. **Configura**:
   - **Nombre**: `TOOL_NombreHerramienta`
   - **Descripción**: "USA cuando [situación]. Requiere: [parámetros]."
   - **Query**: Tu consulta SQL
   - **Query Replacement**: `{{ $fromAI('parametro', 'Descripción', 'tipo', 'default') }}`
4. **Conecta** el nodo al Agente (nodo "🤖 Agente Luz v4")
5. **Guarda y activa**

**Ejemplo de Query Replacement**:
```javascript
{{ $fromAI('producto_id', 'ID del producto', 'number', 0) }}
{{ $fromAI('cantidad', 'Cantidad', 'number', 1) }}
```

---

## 🐛 Troubleshooting

### Problema: El webhook no recibe mensajes de YCloud

**Solución**:
1. Verifica que el flujo esté **activo** (toggle verde)
2. Verifica que la **URL del webhook** sea pública y accesible
3. En YCloud, verifica que el webhook esté **activo**
4. Revisa los **logs de n8n** (pestaña "Executions")

---

### Problema: El Agente Luz no responde

**Solución**:
1. Verifica la **credencial de OpenAI/DeepSeek**
2. Revisa los **logs de ejecución** en n8n
3. Verifica que el **nodo de memoria** (Postgres Chat Memory) esté conectado
4. Prueba ejecutar el flujo **manualmente** con datos de prueba

---

### Problema: La sincronización no funciona

**Solución**:
1. Verifica las **credenciales de Supabase y PostgreSQL**
2. Revisa que las **tablas existan** en ambas bases de datos
3. Ejecuta el flujo **manualmente** para ver errores específicos
4. Verifica que el **trigger** esté configurado correctamente

---

### Problema: Error "Function not found" en Supabase

**Solución**:
1. Ejecuta el SQL para crear las funciones necesarias:
   - `supabase-search-function.sql`
   - `setup-database.sql`
2. Verifica que las funciones existan en el **SQL Editor** de Supabase
3. Reinicia el flujo de n8n

---

### Problema: Precios incorrectos en pedidos

**Solución**:
1. Ejecuta el flujo de **"Auditoría de Pedidos"** para identificar discrepancias
2. Verifica que la **sincronización de productos** esté funcionando
3. Revisa el **flujo "Confirmar Pre-Pedido"** para ver la verificación de precios
4. Si hay discrepancias, el flujo las corrige automáticamente

---

### Problema: El Agente no reconoce comandos del Admin

**Solución**:
1. Verifica que tu **número de teléfono** esté en la lista:
   ```javascript
   const NUMEROS_DIRECTOR = ['573203062007', '3203062007'];
   ```
2. Asegúrate de **NO usar el prefijo** `>` para comandos de admin
3. Si quieres usar como cliente, usa el prefijo `>` antes del mensaje

---

## 📊 Monitorización

### Métricas Importantes

- **Mensajes procesados**: Número total de mensajes del Agente Luz
- **Pedidos confirmados**: Pre-pedidos convertidos a pedidos reales
- **Carritos recuperados**: Carritos abandonados que se completaron
- **Sincronizaciones exitosas**: Productos y clientes sincronizados
- **Auditorías realizadas**: Discrepancias de precios detectadas

### Logs

Los logs de ejecución están disponibles en:
- **n8n**: Pestaña "Executions" de cada flujo
- **PostgreSQL**: Tabla `recordatorios_enviados` para recordatorios
- **Supabase**: Logs de la base de datos

---

## 🔐 Seguridad

### Buenas Prácticas

1. **Nunca compartas** tus API keys
2. **Usa variables de entorno** para credenciales sensibles
3. **Limita los permisos** de las credenciales (ej: solo lectura cuando sea posible)
4. **Monitorea** los flujos regularmente para detectar anomalías
5. **Haz respaldos** de tus flujos (exporta JSON regularmente)

---

## 📞 Soporte

Si tienes problemas con los flujos:

1. **Revisa este manual**
2. **Consulta los logs** de n8n
3. **Verifica las guías de configuración**
4. Revisa los **archivos SQL** para configuración de base de datos

---

## 📝 Notas de Desarrollo

### Versiones Recientes

- **Agente Luz v6.5**: Añadidas herramientas de administración para Copiloto
- **Sync Productos v2**: Mejor manejo de variantes
- **Confirmar Pre-Pedido**: Verificación automática de precios

### Próximas Mejoras

- [ ] Dashboard de monitorización
- [ ] Notificaciones de errores en tiempo real
- [ ] Exportación de reportes
- [ ] Integración con sistema de pagos online

---

## 📚 Archivos de Referencia

### SQL
- `setup-database.sql` - Configuración inicial de PostgreSQL
- `supabase-search-function.sql` - Función de búsqueda de productos
- `migracion-estados-buffer.sql` - Migración de estados

### Guías
- `GUIA-SYNC-VARIANTES.md` - Sincronización de variantes
- `GUIA-SYNC-CLIENTES.md` - Sincronización de clientes
- `GUIA-SETUP-N8N-ANTIGRAVITY.md` - Configuración en Antigravity

### Scripts
- `sync-productos-to-postgres.js` - Script de sincronización
- `preprocesamiento-v*.js` - Múltiples versiones de preprocesamiento

---

**Fin del Manual** 🥑
