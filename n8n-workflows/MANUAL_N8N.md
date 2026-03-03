# 📋 Manual Completo de N8N - Tus Aguacates

## 📖 Índice

1. [Introducción](#introducción)
2. [Resumen de Categorías](#resumen-de-categorías)
3. [Flujos Principales](#flujos-principales)
4. [Flujos de Automatización](#flujos-de-automatización)
5. [Flujos de Campañas y Marketing](#flujos-de-campañas-y-marketing)
6. [Flujos de Agentes IA](#flujos-de-agentes-ia)
7. [Herramientas y Utilidades](#herramientas-y-utilidades)
8. [Gestión de Conexiones](#gestión-de-conexiones)
9. [Mi Capacidad de Trabajo con N8N](#mi-capacidad-de-trabajo-con-n8n)

---

## 🎯 Introducción

Este manual documenta todos los flujos de automación de n8n para la tienda en línea de "Tus Aguacates". Estos flujos gestionan sincronización de datos, atención al cliente por WhatsApp, marketing automático, y limpieza de datos.

**Ubicación de archivos**: `tus-aguacates/n8n-workflows/`

**Total de flujos**: 45 archivos JSON + 12 guías de configuración

---

## 📊 Resumen de Categorías

| Categoría | Número de Flujos | Descripción |
|-----------|------------------|-------------|
| **Sincronización** | 6 | Sincronizan datos entre bases de datos |
| **Automatización** | 8 | Procesos automáticos recurrentes |
| **Campañas Marketing** | 4 | Campañas masivas de comunicación |
| **Agentes IA** | 3 | Agentes de IA con herramientas especializadas |
| **Auditoría y Mantenimiento** | 3 | Verificaciones y limpieza de datos |
| **Utilidades** | 21 | Scripts y herramientas diversas |

---

## 🔄 Flujos Principales

### 1. Sync Clientes (Sincronización de Clientes)

**Archivos:**
- `workflow-sync-clientes-supabase-to-local.json`
- `workflow-sync-clientes-local-to-supabase.json`
- `workflow-sync-clientes-bucle-robusto.json`

**Descripción:** Sincroniza clientes entre Supabase (tienda online) y PostgreSQL local (n8n).

**Workflow principal:**
```
⏰ Cada Hora
    ↓
📥 Obtener Clientes Supabase
    ↓
🔄 Transformar Clientes
    ↓
💾 Guardar en PostgreSQL Local
    ↓
✅ Verificar Total
```

**Funcionalidades:**
- Normalización de números de teléfono
- Mapeo de campos entre sistemas
- Verificación de integridad de datos
- Generación de estadísticas

**Ejecución:** Cada hora automáticamente

**Sistemas involucrados:**
- Supabase (base de datos en la nube)
- PostgreSQL Docker local (n8n)

---

### 2. Sync Productos (Sincronización de Productos)

**Archivos:**
- `workflow-sync-productos.json`
- `workflow-sync-productos-v2.json`
- `sync-productos-variantes-completo.json`
- `sync-productos-listo.json`

**Descripción:** Sincroniza productos entre Supabase y PostgreSQL local.

**Workflow principal:**
```
⏰ Cada Hora
    ↓
📥 Obtener Productos Supabase
    ↓
🔄 Transformar Datos
    ↓
🗑️ Limpiar Tabla
    ↓
💾 Insertar Productos
    ↓
✅ Verificar Total
```

**Funcionalidades:**
- Descarga completa de productos (no incremental)
- Transformación de campos de Supabase a formato local
- Actualización de stock, precios, imágenes
- Sincronización de variantes y categorías

**Ejecución:** Cada hora automáticamente

**Notas importantes:**
- Es una sincronización completa (no incremental)
- Se limpia la tabla antes de insertar nuevos datos
- Puede tardar varios minutos con muchos productos

---

### 3. Confirmar Pre-Pedido

**Archivo:** `workflow-confirmar-prepedido.json`

**Descripción:** Permite a los clientes confirmar su pedido por WhatsApp.

**Workflow:**
```
🎯 Webhook Confirmar (HTTP POST)
    ↓
📥 Obtener Pre-Pedido
    ↓
✅ Verificar Existencia
    ↓
💰 Calcular Total
    ↓
✅ Confirmar en Supabase
    ↓
✅ Liberar Stock
    ↓
📤 Enviar Confirmación
```

**Funcionalidades:**
- Validación de existencia de prepedido
- Cálculo automático del total
- Actualización del estado en Supabase
- Liberación de stock
- Envío de confirmación por WhatsApp
- Verificación de duplicados

**Trigger:** Webhook HTTP desde WhatsApp (nativo)

**Ejecución:** Disparado manualmente por los clientes

---

### 4. Procesador de Buffer

**Archivo:** `workflow-procesar-buffer.json`

**Descripción:** Agrupa múltiples mensajes de un mismo cliente y los procesa en un solo bloque.

**Workflow:**
```
⏰ Schedule Trigger (10 segundos)
    ↓
📦 Obtener Mensajes Listos
    ↓
✅ Verificar Procesados
    ↓
🔄 Agrupar Mensajes
    ↓
🤖 Procesar con IA
    ↓
📤 Enviar Respuestas
    ↓
✅ Marcar como Procesados
```

**Funcionalidades:**
- Agrupamiento automático de mensajes por cliente
- Límite de 30 segundos entre agrupaciones
- Procesamiento por lotes de hasta 10 clientes
- Integración con IA para respuesta inteligente
- Marcado de mensajes como procesados

**Ejecución:** Cada 10 segundos

**Beneficios:**
- Reduce la carga de procesamiento
- Responde de forma más natural a clientes
- Mejor manejo de conversaciones complejas

---

### 5. Recordatorio de Carritos Abandonados

**Archivo:** `workflow-recordatorio-carritos.json`

**Descripción:** Envía recordatorios automáticos a clientes con carritos abandonados.

**Workflow:**
```
⏰ Cada 4 horas (9:00, 13:00, 17:00, 21:00)
    ↓
🔍 Buscar Carritos Abandonados
    ↓
✅ Verificar No Repetido
    ↓
📤 Enviar Recordatorio
    ↓
✅ Registrar Enviado
```

**Condiciones de selección:**
- Estado: `EN_PEDIDO`
- Tiempo sin actividad: Al menos 2 horas
- Ventana de 24 horas (WhatsApp)
- No enviado en las últimas 20 horas
- Máximo 20 clientes por ejecución

**Funcionalidades:**
- Resumen del carrito con totales
- Información del cliente
- Timestamp de última actividad
- Registro de envíos previos
- Límite de clientes por ejecución

**Ejecución:** 4 veces al día (9am, 1pm, 5pm, 9pm)

---

### 6. Automatización de Pedidos Web

**Archivo:** `automation-pedidos-web.json`

**Descripción:** Procesa pedidos recibidos por la web y los limpia antes de despacho.

**Workflow:**
```
🎯 Webhook Pedido Web (HTTP POST)
    ↓
🤖 IA Limpieza de Datos
    ↓
📝 Formatear Notificación
    ↓
📤 Enviar Notificación
```

**Funcionalidades:**
- Limpieza de nombres con IA
- Formateo de direcciones
- Corrección de emojis
- Detección de posibles fraudes
- Generación de mensaje para el equipo de despacho

**Trigger:** Webhook desde la tienda web (nativo)

**Sistema:**
- Modelos de IA (GPT-4o-mini)
- Formateo de notificaciones
- Integración con sistema de despacho

---

## 🚀 Flujos de Automatización

### 7. Auto-Etiquetar YCloud

**Archivo:** `workflow-auto-etiquetar-ycloud.json`

**Descripción:** Etiqueta automáticamente clientes según su comportamiento en WhatsApp.

**Funcionalidades:**
- Clasificación de clientes por frecuencia
- Identificación de clientes VIP
- Detección de patrones de compra
- Etiquetas automáticas para soporte

---

### 8. Auditoría de Pedidos

**Archivo:** `workflow-auditoria-pedidos.json`

**Descripción:** Verifica la integridad de los datos de pedidos.

**Funcionalidades:**
- Validación de campos requeridos
- Verificación de existencia de productos
- Identificación de errores de importación
- Generación de reportes de auditoría

---

### 9. Monitor de Escalados

**Archivo:** `monitor-escalados-workflow.json`

**Descripción:** Monitorea casos que requieren intervención humana.

**Funcionalidades:**
- Detección de casos críticos
- Notificación de escalados
- Trazabilidad de intervención
- Generación de reportes

---

### 10. Workflow de Auditoría diaria de Integridad

**Archivo:** `workflow-audit-integrity-daily.json`

**Descripción:** Ejecuta auditorías diarias de integridad de datos.

**Funcionalidades:**
- Verificación de datos en bases de datos
- Detección de inconsistencias
- Registros de anomalías
- Reportes automáticos

---

## 🎪 Flujos de Campañas y Marketing

### 11. Campaña Navidad - 150 Clientes

**Archivo:** `campana-navidad-151-clientes.json`

**Descripción:** Campaña de Navidad con 150 clientes seleccionados.

**Detalles:**
- Número de clientes: 150
- Temática: Navidad
- Planificación: 15 de diciembre
- Envío masivo programado

---

### 12. Campaña de 500 Clientes Invitación Tienda

**Archivo:** `campana-500-clientes-invitatienda.json`

**Descripción:** Campaña de invitación para clientes nuevos.

**Detalles:**
- Número de clientes: 500
- Temática: Invitación a tienda física
- Planificación: 29 de diciembre
- Envío masivo programado

---

### 13. Campaña Masiva Anti-Duplicados

**Archivo:** `campana-masiva-anti-duplicados.json`

**Descripción:** Campaña masiva con validación anti-duplicados.

**Detalles:**
- Validación antes del envío
- Eliminación de duplicados
- Enfoque en calidad sobre cantidad

---

### 14. MCP Helper Workflow

**Archivo:** `mcp-helper-workflow.json`

**Descripción:** Workflow para el Helper de Model Context Protocol.

**Funcionalidades:**
- Procesamiento de comandos MCP
- Interacción con herramientas de IA
- Gestión de respuestas de herramientas
- Debugging de integraciones

---

## 🤖 Flujos de Agentes IA

### 15. Agente Luz v6.5 - Admin Copiloto

**Archivo:** `Agente Luz v6.5 - Con Herramientas Admin Copiloto.json`

**Descripción:** Agente de atención al cliente con herramientas de administración.

**Características:**
- V6.5 con mejoras significativas
- Herramientas de administración incluidas
- Soporte para clientes y administradores
- Conversaciones inteligentes

**Herramientas disponibles:**
- TOOL_BuscarProductos
- TOOL_ConsultarPedido
- TOOL_AgregarAlCarrito
- TOOL_CalcularTotalPrePedido
- TOOL_CambiarEstadoPedido
- TOOL_GuardarNombreCliente

**Números directores:**
- Mauricio: 3203062007

**Modes:**
- **CLIENTE**: Conversación normal (sin prefijo)
- **ADMIN**: Acceso completo (directores solo)

**Ejecución:** Integrado con YCloud WhatsApp

---

### 16. Agente Luz v6.5 - Con Herramientas Admin Copiloto (1)

**Archivo:** `🥑 Agente Luz v6.5 - Con Herramientas Admin Copiloto (1).json`

**Descripción:** Versión duplicada del flujo anterior.

**Nota:** Archivo de respaldo/duplicado

---

### 17. Copiloto de Operaciones

**Archivo:** `Copiloto de Operaciones (13).json`

**Descripción:** Copiloto operativo para gestionar operaciones diarias.

**Funcionalidades:**
- Gestión de tickets
- Reportes de operaciones
- Trazabilidad de eventos
- Atención a clientes de operaciones

---

## 🛠️ Herramientas y Utilidades

### Scripts de Mantenimiento

#### Scripts SQL

**Archivos SQL de sincronización:**
- `import-csv-simple.sql` - Importación CSV simple
- `limpiar-memoria-chat.sql` - Limpieza de memoria de chat
- `limpiar-normalizar-clientes.sql` - Limpieza y normalización de clientes
- `clean-phone-numbers.sql` - Limpieza de números de teléfono
- `resolver-duplicados-telefonos.sql` - Resolución de duplicados

**Archivos SQL de migración:**
- `agregar-columna-notificado.sql` - Agrega columna notificado
- `agregar-estado-pedido-confirmado.sql` - Agrega estado confirmado
- `migracion-estados-buffer.sql` - Migración de estados
- `migracion-etiquetado-ycloud.sql` - Migración de etiquetado

**Archivos SQL de corrección:**
- `fix-missing-columns.sql` - Corrección de columnas faltantes
- `update_order_totals.sql` - Actualización de totales
- `create-v6.5-admin-copiloto.sql` - Creación de tablas para v6.5

**Archivos SQL de verificación:**
- `verificacion-sync-clientes.sql` - Verificación de sincronización
- `validar_solucion_pedidos.sql` - Validación de solución de pedidos
- `diagnostico-clientes.sql` - Diagnóstico de clientes
- `diagnostico-calidad-clientes.sql` - Diagnóstico de calidad

**Archivos SQL de enriquecimiento:**
- `enriquecer-clientes.sql` - Enriquecimiento de clientes
- `mejora-tracking-respuestas.sql` - Mejora de seguimiento de respuestas

#### Scripts JavaScript

**Scripts de corrección:**
- `fix-web-orders-flow.js` - Corrección de flujo de pedidos web
- `fix-duplicate-products.js` - Corrección de productos duplicados
- `fix-productos-variantes.js` - Corrección de variantes
- `fix-catalogo-link.js` - Corrección de enlace de catálogo
- `fix-estados-herramientas.js` - Corrección de estados de herramientas
- `fix-link-preview-emojis.js` - Corrección de emojis en previews
- `fix-saludo-calido.js` - Corrección de saludo cálido
- `fix-tienda-al-principio.js` - Corrección de "tienda" al principio

**Scripts de limpieza:**
- `limpiar-telefonos-invalidos.sql` - Limpieza de teléfonos inválidos
- `final-verification.sql` - Verificación final
- `create_real_test_orders.js` - Creación de pedidos de prueba
- `create_test_order_items.js` - Creación de items de prueba
- `delete_test_orders.js` - Eliminación de pedidos de prueba

**Scripts de corrección de herramientas:**
- `add-admin-tools-to-agente-luz.js` - Agrega herramientas admin
- `add-copiloto-tools.js` - Agrega herramientas de copiloto
- `add-tool-etiqueta.js` - Agrega herramienta etiqueta
- `add-tool-variantes.js` - Agrega herramienta variantes
- `fix-tool-*.js` - Corrección de diversas herramientas

**Scripts de migración:**
- `migrate-images-to-cloudinary.js` - Migración de imágenes a Cloudinary
- `sync-productos-to-postgres.js` - Sincronización de productos
- `update_order_totals.js` - Actualización de totales

**Scripts de diagnóstico:**
- `diagnosticar-*.js` - Scripts de diagnóstico diversos
- `verify-fix-connections.js` - Verificación de correcciones
- `fix-*.js` - Correcciones específicas

**Scripts de preparación de respuestas:**
- `codigo-preparar-respuesta-v9.js` a `v13.js` - Variaciones de preparación de respuestas
- `codigo-preprocesamiento-v10.js` a `v15.js` - Variaciones de preprocesamiento
- `nodo-enviar-imagen-ycloud.js` - Nodo para enviar imágenes
- `nodo-formateador-respuesta.js` - Formateador de respuestas
- `nodo-pulidor-respuestas.json` - Pulido de respuestas

**Scripts de selectores:**
- `codigo-selector-prompt.js` - Selector de prompts

**Scripts de preprocesamiento:**
- `preprocesamiento-v4.1-robusto.js` - Robusto v4.1
- `preprocesamiento-v4.2-conversacional.js` - Conversacional v4.2
- `preprocesamiento-v5-integrado.js` - Integrado v5
- `preprocesamiento-v6-con-imagenes.js` - Con imágenes v6
- `preprocesamiento-v7-con-botones.js` - Con botones v7

**Scripts de optimización:**
- `optimize-system-message-final.js` - Optimización del mensaje de sistema
- `create-v6.5-admin-copiloto.js` - Creación de copiloto v6.5
- `fix-json-distinct-error.js` - Corrección de error JSON DISTINCT

**Scripts de corrección de copiloto:**
- `fix-*.js` - Correcciones de copiloto v6.x
- `include-variants-in-search.js` - Incluir variantes en búsqueda

#### Scripts de generación

**Archivos de migración SQL:**
- `generate-products-sql.js` - Generación SQL de productos
- `import-full-catalog.py` - Importación de catálogo completo
- `process-complete-catalog.py` - Procesamiento de catálogo completo
- `upload_images_to_supabase.py` - Subida de imágenes

**Archivos de datos:**
- `clientes_final (2).csv` - Listado final de clientes (2.2MB)
- `processed_catalog.json` - Catálogo procesado (75KB)
- `menu_tus_aguacates (1).json` - Menú (88KB)

#### Otros archivos

**Scripts de prueba:**
- `test-*.js` - Scripts de prueba diversos
- `test-admin-orders-api.js` - API de pedidos admin
- `test_order_summary.js` - Resumen de pedidos
- `test_product_filtering_fix.js` - Corrección de filtrado

**Archivos de plantillas:**
- `plantilla-confirmacion-correo-corregida.html` - Plantilla de confirmación
- `plantilla-recuperacion-contrasena-corregida.html` - Plantilla de recuperación

**Archivos de configuración:**
- `antigravity_config.json` - Configuración de Antigravity
- `env.n8n.example` - Ejemplo de variables de entorno

---

## 🔗 Gestión de Conexiones

### Credenciales n8n

#### PostgreSQL Docker
- **ID:** `R6hc0vEZJhKQSi3G`
- **Nombre:** `Mi PostgreSQL Docker`
- **Uso:** Clientes, Pre-pedidos, Buffer, Carritos, Webhooks

#### Supabase account 2
- **ID:** `oFlOZEZmGLS2kaKr`
- **Nombre:** `Supabase account 2`
- **Uso:** Sincronización de productos y clientes

#### YCloud API Key
- **Header:** `X-API-Key`
- **Uso:** Agente Luz, Webhooks de WhatsApp

#### DeepSeek
- **ID:** `8BVSsLxHakKs5L6l`
- **Nombre:** `DeepSeek account 2`
- **Uso:** Agente Luz v6.5 (IA)

### Conexiones a otros sistemas

#### Supabase
- **Base de datos:** n8n-enlace-supabase.vercel.app
- **Tables:** `customers`, `products`, `orders`, `order_items`
- **Funciones:** `search_products()`

#### PostgreSQL Local
- **Puerto:** 5432
- **Tables:** `clientes`, `productos_tienda`, `mensaje_buffer`, `recordatorios_enviados`

#### YCloud
- **API:** https://api.ycloud.com
- **Endpoint:** `/v2/whatsapp/messages`
- **Webhooks:** `whatsapp.inbound_message.received`

---

## 🧠 Mi Capacidad de Trabajo con N8N

### Aclaración Importante

**NO tengo una conexión MCP (Model Context Protocol) directa con tu n8n.**

### Mis habilidades y capacidades

Aunque no tengo conexión directa con n8n, puedo ayudarte con:

#### 1. **Revisión de Flujos**
- Leer y analizar archivos JSON de workflows
- Identificar problemas, redundancias y mejoras
- Propuestas de optimización
- Análisis de dependencias entre nodos

#### 2. **Creación de Documentación**
- Crear manuales como este
- Documentar procesos
- Generar guías de configuración
- Crear arquitecturas de referencia

#### 3. **Análisis de Arquitectura**
- Evaluar la estructura de datos
- Identificar problemas de sincronización
- Proponer soluciones de integración
- Analizar relaciones entre sistemas

#### 4. **Auditoría de Seguridad**
- Verificar credenciales en documentos
- Identificar exposiciones de datos
- Proponer mejoras de seguridad
- Auditar dependencias

#### 5. **Optimización de Procesos**
- Identificar cuellos de botella
- Propuestas de simplificación
- Optimización de recursos
- Mejoras en rendimiento

#### 6. **Generación de Código**
- Creación de nodos custom (JavaScript)
- Scripts de migración
- Utilidades de limpieza
- Scripts de diagnóstico

#### 7. **Documentación Técnica**
- READMEs actualizados
- Documentación de API
- Guías de implementación
- Guías de troubleshooting

#### 8. **Análisis Comparativo**
- Comparar versiones de workflows
- Evaluar diferentes enfoques
- Documentar diferencias entre versiones
- Propuestas de evolución

### Recomendación de Proximidad

Para trabajar directamente con tu n8n, te recomendaría:

1. **Instalar una extensión de n8n**: Para tener acceso a los workflows desde tu editor
2. **Usar la API de n8n**: Para ejecutar cambios programáticos
3. **Importar/exportar workflows**: Como lo haces actualmente
4. **Usar nodos custom**: Para funcionalidades no disponibles

### Flujo de trabajo recomendado

1. **Yo** leo y analizas tus archivos JSON
2. **Tú** haces los cambios en n8n
3. **Yo** evalúo los resultados
4. **Repetimos** hasta lograr el objetivo deseado

---

## 📈 Evolución del Sistema

### Versiones de Agente Luz

| Versión | Descripción | Fecha |
|---------|-------------|-------|
| v3 | YCloud Edition | Diciembre 2024 |
| v6.2 | Corregido | Enero 2025 |
| v6.3 | Búsqueda Mejorada | Enero 2025 |
| v6.4 | Variantes Completas | Enero 2025 |
| v6.5 | Herramientas Admin | Enero 2025 |

### Cambios Principales

1. **Transferencia de WAHA a YCloud** (v3)
   - Reemplazo de WhatsApp API Gateway con YCloud
   - Mejor integración con sistema actual

2. **Agregación de Herramientas** (v6.5)
   - Herramientas de administración incluidas
   - Soporte para múltiples usuarios
   - Mejor gestión de estados

3. **Pre-procesamiento v14** (v6.5)
   - Filtro enriquecido
   - Lista completa de palabras a ignorar
   - Mejor manejo de prefijos

---

## 🔍 Troubleshooting Común

### Problema: Flujo no se ejecuta
- Verificar que el toggle "Active" esté activado
- Revisar logs del flujo en n8n
- Verificar credenciales configuradas

### Problema: Error de sincronización
- Revisar credenciales de Supabase
- Verificar tabla existente en PostgreSQL
- Revisar permisos de usuario

### Problema: Webhook no recibe mensajes
- Verificar que el webhook esté activo
- Confirmar configuración en YCloud
- Revisar URL del webhook

### Problema: Agente no responde
- Verificar que DeepSeek API tenga saldo
- Revisar logs del flujo
- Confirmar formato del mensaje

---

## 📞 Contacto y Soporte

### Para preguntas sobre este manual:
- Revisar archivos `.md` en el directorio
- Consultar las guías de configuración

### Para problemas técnicos:
- Revisar logs en n8n
- Consultar guías de troubleshooting
- Verificar credenciales y conexiones

---

**Manual creado:** 8 de Febrero 2026
**Última actualización:** 8 de Febrero 2026
**Versión:** 1.0
