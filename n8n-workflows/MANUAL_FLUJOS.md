# 📚 Manual Completo de Flujos n8n - Tus Aguacates

## 🎯 Resumen Ejecutivo

Los flujos de n8n de Tus Aguacates son el cerebro de automatización que conecta la tienda en línea, WhatsApp (YCloud), y las bases de datos (Supabase + PostgreSQL local). Estos workflows permiten sincronizar datos, procesar pedidos, enviar recordatorios, y mantener la integridad del sistema.

---

## 📋 Índice de Workflows

### 1. 🔄 Sincronización de Datos
- [`workflow-sync-productos.json`](#workflow-sync-productos) - Sincroniza productos de Supabase → PostgreSQL local
- [`workflow-sync-clientes-supabase-to-local.json`](#workflow-sync-clientes-supabase-to-local) - Sincroniza clientes de Supabase → PostgreSQL local
- [`workflow-sync-clientes-local-to-supabase.json`](#workflow-sync-clientes-local-to-supabase) - Sincroniza clientes de local → Supabase
- [`workflow-sync-clientes-bucle-robusto.json`](#workflow-sync-clientes-bucle-robusto) - Sincronización robusta con bucle
- [`workflow-sync-productos-v2.json`](#workflow-sync-productos-v2) - Versión mejorada de sincronización de productos
- [`workflow-sync-FIXED.json`](#workflow-sync-fixed) - Versión corregida de sincronización

### 2. 🛒 Gestión de Pedidos
- [`workflow-confirmar-prepedido.json`](#workflow-confirmar-prepedido) - Confirma pre-pedidos de WhatsApp → Supabase

### 3. 📱 WhatsApp y Notificaciones
- [`workflow-recordatorio-carritos.json`](#workflow-recordatorio-carritos) - Recordatorios de carritos abandonados
- [`workflow-auto-etiquetar-ycloud.json`](#workflow-auto-etiquetar-ycloud) - Etiquetado automático en YCloud por estado
- [`workflow-procesar-buffer.json`](#workflow-procesar-buffer) - Procesador de mensajes agrupados
- [`workflow-tracking-respuestas.json`](#workflow-tracking-respuestas) - Tracking de respuestas a campañas

### 4. 🔍 Monitoreo y Auditoría
- [`workflow-auditoria-pedidos.json`](#workflow-auditoria-pedidos) - Auditoría de precios en pedidos históricos
- [`workflow-audit-integrity-daily.json`](#workflow-audit-integrity-daily) - Auditoría diaria de integridad de datos
- [`monitor-escalados-workflow.json`](#monitor-escalados-workflow) - Monitor de clientes escalados a humanos

### 5. 🔧 Herramientas y API
- [`mcp-helper-workflow.json`](#mcp-helper-workflow) - API helper para gestión de workflows vía HTTP

---

## 🔧 Mis Capacidades con n8n

### ✅ Lo que puedo hacer:

1. **Leer y Editar Workflows**
   - Puedo leer los archivos `.json` de los workflows
   - Puedo modificar nodos, conexiones, y lógica de los workflows
   - Puedo crear nuevos workflows desde cero

2. **Usar la API REST de n8n** (vía el workflow MCP Helper)
   - Listar workflows activos/inactivos
   - Obtener detalles de un workflow específico
   - Crear nuevos workflows
   - Actualizar workflows existentes
   - Activar/desactivar workflows
   - Ejecutar workflows manualmente

3. **Analizar y Auditoría**
   - Analizar estructura de workflows
   - Detectar problemas potenciales (nodos sin conexión, triggers múltiples, etc.)
   - Optimizar lógica de workflows

### ❌ Limitaciones:

- No tengo conexión MCP directa con n8n (usamos HTTP API vía el helper)
- No puedo ejecutar workflows en tiempo real sin usar la API
- No tengo acceso directo a las credenciales (por seguridad)

### 🔗 Conexión disponible:

El workflow [`mcp-helper-workflow.json`](#mcp-helper-workflow) proporciona endpoints HTTP para interactuar con n8n:

```
GET  /webhook/mcp-helper/list          - Listar todos los workflows
GET  /webhook/mcp-helper/get/{id}      - Obtener workflow específico
POST /webhook/mcp-helper/create        - Crear nuevo workflow
PUT  /webhook/mcp-helper/update/{id}   - Actualizar workflow
POST /webhook/mcp-helper/activate/{id} - Activar workflow
POST /webhook/mcp-helper/execute/{id}  - Ejecutar workflow
GET  /webhook/mcp-helper/audit/{id}    - Auditar workflow
```

---

## 📖 Descripción Detallada de Workflows

### 1. 🔄 workflow-sync-productos.json

**Propósito**: Sincroniza el catálogo de productos desde Supabase hacia la base de datos PostgreSQL local cada hora.

**Frecuencia**: Cada hora (Schedule Trigger)

**Flujo**:
1. **⏰ Cada Hora** - Trigger que inicia cada hora
2. **📥 Obtener Productos Supabase** - Fetch productos de Supabase API
3. **🔄 Transformar Datos** - Transforma formato Supabase → productos_tienda
4. **🗑️ Limpiar Tabla** - DELETE FROM productos_tienda (limpieza completa)
5. **💾 Insertar Productos** - Inserta todos los productos transformados
6. **✅ Verificar Total** - COUNT(*) para verificar sincronización exitosa

**Campos sincronizados**:
- supabase_id, name, slug, description
- price, discount_price
- category_name, category_id
- main_image_url, stock
- is_active, is_featured, available_for, unit, is_organic, weight, min_quantity

---

### 2. 🔄 workflow-sync-clientes-supabase-to-local.json

**Propósito**: Sincroniza clientes desde Supabase hacia PostgreSQL local cada hora usando UPSERT.

**Frecuencia**: Cada hora

**Flujo**:
1. **⏰ Cada Hora** - Trigger horario
2. **📥 Obtener Clientes Supabase** - Fetch customers de Supabase
3. **🔄 Transformar Clientes** - Normaliza teléfonos y transforma datos
4. **📤 Preparar para UPSERT** - Prepara datos individuales
5. **💾 UPSERT Cliente** - INSERT ON CONFLICT (telefono) DO UPDATE
6. **✅ Verificar Sincronización** - Conteos de clientes sincronizados

**Lógica de teléfono**:
- Normaliza removiendo caracteres no numéricos
- Agrega prefijo '57' si el número tiene 10 dígitos y empieza con '3'

---

### 3. 🔄 workflow-sync-clientes-local-to-supabase.json

**Propósito**: Sincroniza clientes de la base de datos local hacia Supabase (bidireccional).

**Frecuencia**: Cada hora

**Flujo**:
- Obtiene clientes de PostgreSQL local
- Transforma al formato de Supabase
- Realiza UPSERT en tabla `customers` de Supabase

---

### 4. 🔄 workflow-sync-clientes-bucle-robusto.json

**Propósito**: Sincronización robusta de clientes con manejo de errores y reintentos.

**Características**:
- Manejo de errores por cliente individual
- Registro de errores en tabla de logs
- Limitación de clientes por lote para evitar timeouts

---

### 5. 🔄 workflow-sync-productos-v2.json

**Propósito**: Versión mejorada de sincronización de productos con manejo de variantes.

**Mejoras**:
- Incluye sincronización de variantes de productos
- Manejo de imágenes
- Actualización incremental (no DELETE completo)

---

### 6. 🔄 workflow-sync-FIXED.json

**Propósito**: Versión corregida de sincronización que soluciona problemas específicos.

**Correcciones**:
- Arregla problemas de encoding de caracteres especiales
- Mejora manejo de fechas
- Corrige errores de tipos de datos

---

### 7. 📦 workflow-confirmar-prepedido.json

**Propósito**: Confirma pre-pedidos de WhatsApp creando registros en Supabase y notificando al admin.

**Trigger**: Webhook POST `/confirmar-prepedido`

**Flujo**:
1. **🎯 Webhook Confirmar** - Recibe teléfono del cliente
2. **📥 Obtener Pre-Pedido** - Busca en PostgreSQL local
3. **🔀 ¿Tiene Pre-Pedido?** - Valida si existe pre-pedido
4. **💰 Obtener Precios Supabase** - Obtiene catálogo actual
5. **🔍 Verificar Precios** - COMPARA y corrige precios si hay discrepancias
6. **📤 Crear en Supabase** - Crea registro en `guest_orders`
7. **🧹 Limpiar Carrito** - Actualiza estado a 'PEDIDO_CONFIRMADO'
8. **🏷️ Etiquetar en YCloud** - Etiqueta contacto como "CONFIRMADOS"
9. **📢 Notificar Admin** - Envía WhatsApp al admin con detalles
10. **✅ Respuesta OK** - Responde al webhook

**Características clave**:
- **Verificación de precios**: Compara precios del carrito vs catálogo oficial
- **Corrección automática**: Si hay discrepancia, usa precio del catálogo
- **Notificación detallada**: Incluye discrepancias detectadas al admin

---

### 8. 🛒 workflow-recordatorio-carritos.json

**Propósito**: Envía recordatorios de WhatsApp a clientes con carritos abandonados (2-23 horas sin actividad).

**Frecuencia**: Cada 4 horas (9:00, 13:00, 17:00, 21:00)

**Flujo**:
1. **⏰ Cada 4 horas** - Trigger programado
2. **🔍 Buscar Carritos Abandonados** - SQL: estado='EN_PEDIDO' + 2-23 horas inactivo
3. **❓ ¿Tiene Datos?** - Valida si hay carritos
4. **📝 Formatear Mensaje** - Genera mensaje personalizado con productos
5. **📱 Enviar Recordatorio** - WhatsApp con botones interactivos
6. **📊 Registrar Envío** - Guarda en `recordatorios_enviados`
7. **🚫 Sin Carritos** - Si no hay carritos, termina

**Botones enviados**:
- ✅ Completar Pedido
- 🛒 Ver Carrito
- ❌ Cancelar

**Prevención de spam**:
- Verifica que no se haya enviado recordatorio en las últimas 20 horas
- Ventana de 24h (máximo 23 horas inactivo)

---

### 9. 🏷️ workflow-auto-etiquetar-ycloud.json

**Propósito**: Etiqueta automáticamente contactos en YCloud según el estado del pedido.

**Frecuencia**: Cada 5 minutos

**Flujo**:
1. **⏰ Cada 5 minutos** - Trigger programado
2. **📋 Clientes sin etiquetar** - Busca clientes en estado 'PEDIDO_CONFIRMADO' o 'PEDIDO_ONLINE'
3. **❓ ¿Hay clientes?** - Valida si hay pendientes
4. **🏷️ Etiquetar en YCloud** - POST a YCloud Contacts API
5. **✅ Marcar como etiquetado** - UPDATE clientes.etiquetado_ycloud = true
6. **🚫 Sin clientes pendientes** - Si no hay, termina

**Etiquetas aplicadas**:
- 'Pre-pedido WhatsApp' → estado='PEDIDO_CONFIRMADO'
- 'Pedido Tienda' → estado='PEDIDO_ONLINE'
- 'Confirmado' → otros estados

---

### 10. ⏰ workflow-procesar-buffer.json

**Propósito**: Agrupa múltiples mensajes rápidos del mismo cliente (30s) y los envía como uno solo al webhook principal.

**Frecuencia**: Cada 10 segundos

**Flujo**:
1. **⏰ Schedule Trigger (10s)** - Trigger rápido
2. **📦 Obtener Mensajes Listos** - SQL: mensajes sin procesar + 30s desde último
3. **❓ ¿Hay mensajes?** - Valida si hay mensajes agrupados
4. **📤 Preparar Payload** - Formatea teléfono y mensaje combinado
5. **🔗 Llamar Webhook Principal** - POST al webhook principal de YCloud
6. **✅ Marcar Procesados** - UPDATE mensaje_buffer.procesado = true
7. **⏹️ Sin mensajes** - Si no hay, termina

**Beneficio**:
- Evita múltiples disparos del workflow principal por mensajes rápidos consecutivos
- Combina mensajes que el usuario envía en pocos segundos

---

### 11. 🔍 workflow-auditoria-pedidos.json

**Propósito**: Compara TODOS los pedidos históricos contra el catálogo actual para detectar discrepancias de precios.

**Trigger**: Webhook POST `/auditoria-pedidos`

**Flujo**:
1. **🎯 Iniciar Auditoría** - Webhook que inicia el proceso
2. **📦 Obtener Todos los Pedidos** - Fetch guest_orders de Supabase
3. **💰 Obtener Catálogo Actual** - Fetch products de Supabase
4. **🔗 Combinar Datos** - Merge de ambos conjuntos
5. **🔍 Analizar Discrepancias** - Comparación item por item de precios
6. **📢 Enviar Reporte al Admin** - WhatsApp con resumen
7. **✅ Respuesta con Reporte** - Respuesta del webhook

**Reporte incluye**:
- Total de pedidos analizados
- Pedidos con discrepancias
- Total de discrepancias
- Monto total de diferencia
- Lista detallada de items con precio incorrecto

---

### 12. 🛡️ workflow-audit-integrity-daily.json

**Propósito**: Verifica diariamente la integridad de datos entre PostgreSQL local y Supabase.

**Frecuencia**: Cada día a las 6:00 AM (Cron: `0 6 * * *`)
**Manual**: Webhook `/audit-integrity`

**Flujo**:
1. **⏰ Cada día 6:00 AM** - Cron trigger
2. **🔗 Webhook Manual** - Para ejecutar manualmente
3. **📊 Contar Registros Local** - COUNT(*) de clientes, productos, variantes
4. **📊 Contar Clientes Supabase** - Supabase customers count
5. **📊 Contar Productos Supabase** - Supabase products count
6. **🔗 Combinar Conteos** - Merge de todos los conteos
7. **🔍 Analizar Integridad** - Detecta si hay 0 registros (alerta)
8. **📱 Enviar Alerta** - WhatsApp si hay problemas
9. **✅ Respuesta** - JSON con estado

**Alertas**:
- ⚠️ 0 clientes en PostgreSQL local
- ⚠️ 0 productos en PostgreSQL local
- ⚠️ 0 variantes en PostgreSQL local

---

### 13. 🔔 monitor-escalados-workflow.json

**Propósito**: Monitorea clientes con estado 'ESCALADO' (requieren intervención humana) y notifica al admin.

**Frecuencia**: Cada 5 minutos

**Flujo**:
1. **⏰ Cada 5 minutos** - Trigger programado
2. **🔍 Buscar Escalados No Notificados** - SQL: estado='ESCALADO' + no notificado
3. **❓ ¿Hay Escalados?** - Valida si hay clientes escalados
4. **📝 Preparar Mensaje** - Formatea lista de clientes con tiempo de espera
5. **📱 Notificar Admin WhatsApp** - Envía lista al admin
6. **✅ Marcar como Notificados** - UPDATE clientes.notificado_escalado = true
7. **🔇 Sin Escalados** - Si no hay, termina

**Mensaje incluye**:
- Nombre del cliente
- Teléfono
- Minutos esperando desde el escalado

---

### 14. 📊 workflow-tracking-respuestas.json

**Propósito**: Marca automáticamente los clientes que responden a campañas de marketing.

**Trigger**: Webhook POST `/tracking-respuesta-campana`

**Flujo**:
1. **🔔 Webhook Mensaje Entrante** - Recibe mensaje del cliente
2. **🔍 Buscar Envío del Cliente** - SQL: busca en `envios_campana` por teléfono
3. **¿Tiene Envío?** - Valida si tiene envío pendiente de respuesta
4. **✅ Marcar como Respondió** - UPDATE envios_campana.respondio = true
5. **❌ No Tiene Envío** - Si no tiene campaña asociada, termina

**Campos actualizados**:
- respondio = true
- fecha_respuesta = NOW()
- mensaje_respuesta = texto del mensaje del cliente

---

### 15. 🔧 mcp-helper-workflow.json

**Propósito**: Proporciona una API HTTP para gestionar workflows de n8n (crear, actualizar, activar, ejecutar, auditar).

**Endpoints disponibles**:

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/webhook/mcp-helper/list` | Lista todos los workflows |
| GET | `/webhook/mcp-helper/get/{id}` | Obtiene workflow específico |
| POST | `/webhook/mcp-helper/create` | Crea nuevo workflow |
| PUT | `/webhook/mcp-helper/update/{id}` | Actualiza workflow existente |
| POST | `/webhook/mcp-helper/activate/{id}` | Activa workflow |
| POST | `/webhook/mcp-helper/execute/{id}` | Ejecuta workflow |
| GET | `/webhook/mcp-helper/audit/{id}` | Audita workflow |

**Auditoría incluye**:
- Total de nodos
- Tipos de nodos (triggers, AI, DB, HTTP, Code)
- Warnings (ej: sin triggers, múltiples triggers)
- Recomendaciones (ej: falta persistencia, muchos nodos de código)

---

## 🗄️ Estructura de Base de Datos

### Tablas principales en PostgreSQL local:

- **clientes** - Clientes de WhatsApp y pre-pedidos
- **productos_tienda** - Catálogo de productos sincronizado
- **variantes_productos** - Variantes de productos
- **mensaje_buffer** - Buffer de mensajes agrupados
- **recordatorios_enviados** - Registro de recordatorios
- **envios_campana** - Campañas de marketing enviadas

### Tablas en Supabase:

- **customers** - Clientes de la tienda
- **products** - Catálogo de productos
- **guest_orders** - Pedidos de clientes (guest)

---

## 🔧 Configuración de Credenciales

### Credenciales utilizadas en los workflows:

1. **Supabase account 2** - Conexión a Supabase API
   - Table: `customers`, `products`, `guest_orders`

2. **Mi PostgreSQL Docker** - Conexión a PostgreSQL local
   - Database: `tus_aguacates` o similar

3. **YCloud account** - API de WhatsApp
   - URL: `https://api.ycloud.com/v2`
   - Número: `573042582777`

4. **Header Auth YCloud** - Autenticación HTTP para YCloud

5. **N8N API Key** - Autenticación para API de n8n

---

## 📊 Métricas y Monitoreo

### Métricas clave a monitorear:

- **Sincronización**:
  - Tiempo entre sync de productos
  - Número de productos sincronizados
  - Discrepancias detectadas

- **Pedidos**:
  - Pedidos confirmados vs carritos abandonados
  - Tasa de conversión de recordatorios
  - Precios corregidos automáticamente

- **WhatsApp**:
  - Mensajes enviados por día
  - Tasa de respuesta a campañas
  - Clientes escalados a humanos

---

## 🚨 Solución de Problemas Comunes

### Problema: Productos no aparecen en tienda

**Causas posibles**:
- Workflow de sync inactivo
- Error de credenciales Supabase
- Tabla productos_tienda vacía

**Solución**:
1. Verificar que `workflow-sync-productos.json` está activo
2. Ejecutar manualmente el workflow
3. Revisar logs de ejecución

### Problema: Precios incorrectos en pedidos

**Causas posibles**:
- Catálogo desactualizado
- Sync no ejecutándose

**Solución**:
1. Ejecutar `workflow-sync-productos.json`
2. Correr auditoría: POST `/webhook/auditoria-pedidos`

### Problema: Recordatorios no se envían

**Causas posibles**:
- Workflow inactivo
- Sin carritos en ventana de tiempo (2-23h)
- Ya se envió recordatorio en las últimas 20h

**Solución**:
1. Verificar logs del workflow
2. Consultar tabla `recordatorios_enviados`
3. Ajustar ventana de tiempo si es necesario

---

## 📝 Notas Importantes

1. **Todos los workflows están actualmente inactivos** (`"active": false`)
   - Deben ser activados individualmente según necesidad
   - Se recomienda activar gradualmente y monitorear

2. **Credenciales reemplazadas**:
   - Los IDs de credenciales deben configurarse en tu instancia de n8n
   - Ver `env.n8n.example` para variables de entorno

3. **URL del webhook principal**: `https://dep-n8n.n8ntusaguacates.space/webhook/ycloud`

4. **Admin WhatsApp**: `573203062007` (destinatario de notificaciones)

---

## 🔄 Flujo Completo de un Pedido por WhatsApp

1. Cliente inicia conversación → **Webhook YCloud** (agente Luz)
2. Cliente agrega productos → Se guarda en `clientes.pre_pedido` (JSON)
3. Cliente confirma → **workflow-confirmar-prepedido.json**
4. Verificación de precios → Compara con catálogo Supabase
5. Creación de pedido → `guest_orders` en Supabase
6. Etiquetado → **workflow-auto-etiquetar-ycloud.json**
7. Si no compra en 2-23h → **workflow-recordatorio-carritos.json**
8. Si hay problema → Estado 'ESCALADO' → **monitor-escalados-workflow.json**

---

## 📚 Documentación Adicional

- Guía de integración: [`docs/n8n_integration_guide.md`](../docs/n8n_integration_guide.md)
- Scripts de n8n: [`scripts/n8n_manager.py`](../scripts/n8n_manager.py)
- Plantillas de cerebro n8n: [`docs/n8n_brain_v3_mistral.json`](../docs/n8n_brain_v3_mistral.json)
- README del Agente Luz: [`README.md`](README.md)

---

## 🤝 Cómo Contribuir

Al modificar workflows:
1. Documentar el cambio en este manual
2. Actualizar el diagrama de flujo si es necesario
3. Probar en ambiente de desarrollo primero
4. Notificar al equipo sobre cambios críticos

---

**Última actualización**: 2026-02-08
**Versión**: 1.0
**Autor**: OpenCode
