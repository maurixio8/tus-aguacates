# 🥑 Manual de Flujos n8n - Tus Aguacates

## 📖 Índice

1. [Introducción](#introducción)
2. [Arquitectura del Sistema](#arquitectura-del-sistema)
3. [Categorías de Flujos](#categorías-de-flujos)
4. [Flujos Principales](#flujos-principales)
5. [Sincronización de Datos](#sincronización-de-datos)
6. [Campañas de Marketing](#campañas-de-marketing)
7. [Herramientas de Operaciones](#herramientas-de-operaciones)
8. [Conexión con la Tienda](#conexión-con-la-tienda)
9. [Configuración Inicial](#configuración-inicial)
10. [Solución de Problemas](#solución-de-problemas)

---

## 📚 Introducción

### ¿Qué es n8n?

n8n es una plataforma de automatización de workflows de código abierto que permite conectar diferentes servicios y aplicaciones mediante nodos visuales. En Tus Aguacates, utilizamos n8n para automatizar procesos críticos de la tienda en línea y la atención al cliente.

### Propósito de este Manual

Este manual documenta todos los flujos de n8n utilizados en Tus Aguacates, explicando:
- Qué hace cada flujo
- Cómo se conectan entre sí
- Cómo se integran con la tienda online (tus-aguacates.vercel.app)
- Cómo configurar y mantener cada flujo

### Ecosistema de Tus Aguacates

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   WhatsApp      │     │      n8n        │     │   Supabase      │
│   (YCloud)      │────▶│  (Automatización)│────▶│  (Base de Datos)│
└─────────────────┘     └────────┬────────┘     └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │  Tienda Online  │
                       │ (Next.js/Vercel)│
                       └─────────────────┘
```

---

## 🏗️ Arquitectura del Sistema

### Componentes Principales

#### 1. Agente Luz (Bot de WhatsApp)
- **Archivo**: `Agente Luz v6.5 - Con Herramientas Admin Copiloto.json`
- **Propósito**: Atención al cliente automatizada vía WhatsApp
- **Entrada**: Webhook de YCloud (mensajes de WhatsApp)
- **Salida**: Respuestas enviadas a través de YCloud API
- **Modelo IA**: DeepSeek

#### 2. Copiloto de Operaciones
- **Archivo**: `Copiloto de Operaciones (13).json`
- **Propósito**: Asistente administrativo para gestionar clientes y pedidos
- **Entrada**: Comandos del administrador vía WhatsApp
- **Salida**: Operaciones en base de datos y reportes

#### 3. Sincronización de Datos
- **Clientes**: Bidireccional entre PostgreSQL local y Supabase
- **Productos**: Unidireccional de Supabase a PostgreSQL local
- **Variantes**: Sincronización de presentaciones y precios

#### 4. Automatización de Pedidos
- **Archivo**: `automation-pedidos-web.json`
- **Propósito**: Procesar pedidos realizados en la tienda online
- **Funciones**: 
  - Limpieza de datos con IA
  - Notificaciones al equipo
  - Actualización de inventario

### Flujo de Datos

```
Usuario WhatsApp → YCloud → Webhook n8n → Agente Luz → DeepSeek
                                                     ↓
                                             PostgreSQL Local ← Supabase
                                                     ↓
                                             Respuesta → YCloud → Usuario
```

---

## 📂 Categorías de Flujos

### 1. Agentes de IA (WhatsApp)
- Agente Luz v3 a v6.5 (evolución del bot)
- Agente WhatsApp MVP (versión inicial)

### 2. Sincronización de Datos
- Sync Clientes (bidireccional)
- Sync Productos (unidireccional)
- Sync Variantes (presentaciones y precios)

### 3. Campañas de Marketing
- Campaña Nueva Tienda (500 clientes)
- Campaña Navidad (151 clientes)
- Campaña Masiva (con anti-duplicados)

### 4. Herramientas Operativas
- Copiloto de Operaciones
- Auditoría de Pedidos
- Recordatorio de Carritos Abandonados
- Confirmación de Pre-pedidos

### 5. Automatización de Pedidos Web
- Procesamiento de pedidos online
- Limpieza de datos con IA
- Notificaciones automáticas

### 6. Integraciones Externas
- YCloud (WhatsApp)
- Supabase (Base de datos)
- PostgreSQL Local (almacenamiento temporal)
- DeepSeek (Modelo IA)

---

## 🤖 Flujos Principales

### Agente Luz v6.5

**Descripción**: Bot de WhatsApp inteligente para atención al cliente de Tus Aguacates.

**Características**:
- Detección automática de intenciones (comprar, preguntar, consultar)
- Búsqueda de productos en tiempo real
- Gestión de carritos de compras
- Escalamiento automático a humano cuando es necesario
- Integración con Copiloto para administración

**Estados del Cliente**:
```
NUEVO → NOMBRE_SOLICITADO → ATENCION_LUZ → EN_PEDIDO → PEDIDO_FINALIZADO
                                     ↓
                                 ESCALADO
```

**Herramientas Disponibles**:

| Herramienta | Función |
|-------------|---------|
| TOOL_BuscarProductos | Busca productos en Supabase |
| TOOL_BuscarConocimiento | Consulta información de la empresa |
| TOOL_GuardarNombreCliente | Guarda nombre del cliente |
| TOOL_AnadirAlCarrito | Agrega productos al pre-pedido |
| TOOL_CalcularTotalPrePedido | Calcula total del carrito |
| TOOL_CambiarEstadoCliente | Cambia estado de conversación |
| TOOL_Admin_Operaciones | Herramientas del Copiloto |

**Configuración**:
- Webhook: Recibe mensajes de YCloud
- API Key: DeepSeek para procesamiento de lenguaje natural
- Base de datos: PostgreSQL local + Supabase (productos)

**Archivos Relacionados**:
- `agente-luz-v6.5-admin-copiloto.json`
- `system-message-agente-v7.md`
- `prompt-agente-luz-v7.md`

---

### Copiloto de Operaciones

**Descripción**: Asistente administrativo para gestionar el sistema desde WhatsApp.

**Funciones Principales**:

| Función | Comando Ejemplo |
|---------|-----------------|
| Listar clientes sin nombre | "Dame los clientes sin nombre" |
| Actualizar datos de cliente | "Actualizar cliente [teléfono] nombre: Juan" |
| Contar clientes | "¿Cuántos clientes tengo?" |
| Cambiar estado cliente | "Cambiar estado [teléfono] a ATENCION_LUZ" |
| Ver carritos abandonados | "Mostrar carritos abandonados" |
| Consultar pedido | "Ver pedido del cliente [teléfono]" |

**Herramientas del Copiloto**:

| Herramienta | SQL | Propósito |
|-------------|-----|-----------|
| TOOL_ADMIN_CambiarEstadoCliente | UPDATE clientes | Cambiar estado de conversación |
| TOOL_ADMIN_ListarClientesPorEstado | SELECT clientes | Listar clientes por estado |
| TOOL_ADMIN_ActualizarDatosCliente | UPDATE clientes | Actualizar nombre/dirección |
| TOOL_ADMIN_ContarClientes | COUNT clientes | Estadísticas de clientes |
| TOOL_ADMIN_ConsultarPedido | SELECT pedidos | Ver detalles de pedido |
| TOOL_ADMIN_EscalarServicio | UPDATE clientes | Escalar a humano |

**Configuración**:
- Integrado dentro del Agente Luz (no requiere flujo separado)
- Detecta comandos del administrador por número de teléfono
- Usa las mismas credenciales que el Agente Luz

**Archivos Relacionados**:
- `Copiloto-Operaciones-v2-YCloud.json`
- `Copiloto de Operaciones (13).json`
- `system-message-copiloto-v2.md`

---

## 🔄 Sincronización de Datos

### Sync Clientes (Bidireccional)

**Archivos**:
- `workflow-sync-clientes-supabase-to-local.json`
- `workflow-sync-clientes-local-to-supabase.json`
- `workflow-sync-clientes-bucle-robusto.json`

**Propósito**: Mantener sincronizados los clientes entre:
- PostgreSQL local (usado por n8n para WhatsApp)
- Supabase (usado por la tienda online)

**Flujo Supabase → Local**:
```
1. Cada hora se ejecuta el workflow
2. Obtiene clientes de Supabase (con emails del registro web)
3. Los crea/actualiza en PostgreSQL local
4. Usa UPSERT para evitar duplicados
5. Vincula con supabase_id
```

**Flujo Local → Supabase**:
```
1. Cada hora se ejecuta el workflow
2. Encuentra clientes que solo existen en local (de WhatsApp)
3. Los crea en Supabase
4. Guarda el supabase_id en local
5. Mantiene consistencia entre ambas bases de datos
```

**Verificación**:
```sql
-- En PostgreSQL local
SELECT 
  COUNT(*) as total,
  COUNT(supabase_id) as vinculados,
  COUNT(email) as con_email
FROM clientes;
```

---

### Sync Productos

**Archivos**:
- `workflow-sync-productos.json`
- `workflow-sync-productos-v2.json`
- `workflow-sync-FIXED.json`

**Propósito**: Sincronizar el catálogo de productos desde Supabase a PostgreSQL local.

**Características**:
- Ejecución cada hora
- Mantiene precios actualizados
- Sincroniza imágenes
- Gestiona stock
- Filtra productos activos

**Campos Sincronizados**:
- Nombre y descripción
- Precio y precio con descuento
- Categoría
- Imágenes
- Stock
- Estado (activo/inactivo)
- Unidad de medida

---

### Sync Variantes

**Archivos**:
- `sync-productos-variantes-completo.json`
- `sync-productos-listo.json`

**Propósito**: Sincronizar variantes de productos (presentaciones, tamaños, sabores).

**Ejemplo de Variantes**:
- Aguacate Hass: 1kg, 2kg, 5kg
- Fresas: 250g, 500g, 1kg
- Champiñones: 200g, 400g

**Tabla en PostgreSQL Local**:
```sql
CREATE TABLE variantes_productos (
  id SERIAL PRIMARY KEY,
  supabase_id UUID,
  product_id INTEGER REFERENCES productos_tienda(id),
  product_supabase_id UUID,
  variant_name VARCHAR(100) NOT NULL,
  variant_value VARCHAR(255) NOT NULL,
  price DECIMAL(10, 2) DEFAULT 0.00,
  stock_quantity INTEGER DEFAULT 100,
  is_active BOOLEAN DEFAULT true,
  ...
);
```

---

## 📢 Campañas de Marketing

### Campaña Nueva Tienda (500 Clientes)

**Archivo**: `campana-500-clientes-invitatienda.json`

**Propósito**: Invitar a los 500 mejores clientes a la nueva tienda online.

**Criterios de Selección**:
```sql
WHERE 
  activo = true
  AND telefono IS NOT NULL
  AND LENGTH(telefono) >= 10
  AND nombre IS NOT NULL
ORDER BY total_pedidos DESC, total_gastado DESC
LIMIT 500;
```

**Mensaje Enviado**:
- Template YCloud: "invitatienda"
- Personalizado con el nombre del cliente
- Incluye imagen promocional

**Resultado**: Notificación a 500 clientes más valiosos sobre la nueva plataforma.

---

### Campaña Navidad (151 Clientes)

**Archivo**: `campana-navidad-151-clientes.json`

**Propósito**: Promocionar productos navideños.

**Características**:
- Clientes con historial de compras navideñas
- Mensaje personalizado
- Ofertas especiales de temporada

---

### Campaña Masiva (Anti-Duplicados)

**Archivo**: `campana-masiva-anti-duplicados.json`

**Propósito**: Enviar campañas masivas evitando duplicados.

**Lógica**:
- Normalización de números de teléfono
- Verificación de envíos previos
- Rate limiting para no spam

---

## 🛠️ Herramientas de Operaciones

### Auditoría de Pedidos

**Archivo**: `workflow-auditoria-pedidos.json`

**Propósito**: Analizar pedidos históricos para detectar problemas.

**Funciones**:
- Verificar integridad de datos
- Detectar pedidos huérfanos
- Analizar patrones de compra
- Generar reportes

**Webhook**: `auditoria-pedidos`

---

### Recordatorio de Carritos Abandonados

**Archivo**: `workflow-recordatorio-carritos.json`

**Propósito**: Recuperar ventas recordando carritos abandonados.

**Lógica**:
```
1. Se ejecuta cada 4 horas (9am, 1pm, 5pm, 9pm)
2. Busca carritos abandonados (2-23 horas de inactividad)
3. Calcula total del carrito
4. Envía mensaje de recordatorio
5. Registra envío para evitar duplicados
```

**SQL de Búsqueda**:
```sql
SELECT 
  c.id, c.telefono, c.nombre, c.pre_pedido,
  COALESCE(
    (SELECT SUM((item->>'precio')::numeric * COALESCE((item->>'cantidad')::int, 1))
     FROM jsonb_array_elements(c.pre_pedido) AS item
    ), 0
  ) as total_carrito,
  EXTRACT(EPOCH FROM (NOW() - c.updated_at)) / 3600 as horas_inactivo
FROM clientes c
WHERE c.estado_conversacion = 'EN_PEDIDO'
  AND c.pre_pedido IS NOT NULL
  AND c.updated_at < NOW() - INTERVAL '2 hours'
  AND c.updated_at > NOW() - INTERVAL '23 hours'
ORDER BY c.updated_at DESC
LIMIT 20;
```

---

### Confirmación de Pre-pedidos

**Archivo**: `workflow-confirmar-prepedido.json`

**Propósito**: Enviar confirmación de pre-pedidos realizados por WhatsApp.

**Características**:
- Resumen del pedido
- Total a pagar
- Opciones de pago
- Datos de entrega

---

### Auditoría de Integridad Diaria

**Archivo**: `workflow-audit-integrity-daily.json`

**Propósito**: Verificar integridad de datos diariamente.

**Verificaciones**:
- Clientes sin nombre
- Pedidos sin items
- Productos sin stock
- Datos inconsistentes

---

## 🛒 Conexión con la Tienda

### Webhook de Pedidos Web

**Archivo**: `automation-pedidos-web.json`

**Propósito**: Procesar pedidos realizados en tus-aguacates.vercel.app

**Flujo**:
```
1. Webhook recibe pedido desde tienda
2. IA (GPT-4o-mini) limpia datos
3. Formatea notificación
4. Envía a equipo de despacho
5. Actualiza inventario
```

**Webhook**: `webhook-pedidos-web`

**Limpieza de Datos**:
- Normalización de nombres
- Corrección de direcciones
- Fix de emojis de productos
- Detección de posibles fraudes

**Output**:
```json
{
  "cliente_nombre_corregido": "Nombre Normalizado",
  "direccion_formateada": "Dirección Estándar",
  "resumen_pedido_limpio": "Texto limpio del pedido",
  "alerta_posible_fraude": false,
  "mensaje_equipo": "Nota para despacho"
}
```

---

### Cerebro n8n (Mayordomo Digital)

**Archivo**: `docs/n8n_integration_guide.md`

**Propósito**: Integración del agente IA con la tienda online.

**Webhook**: Recibe mensajes del chat de la tienda

**Input**:
```json
{
  "message": "Quiero hacer un guacamole para 6 personas",
  "userId": "uuid-del-usuario-o-null",
  "cartContext": {
    "itemCount": 2,
    "total": 45000,
    "items": [
      { "name": "Cilantro", "qty": 1 }
    ]
  },
  "history": [
    { "role": "user", "content": "Hola" },
    { "role": "assistant", "content": "¡Hola!..." }
  ]
}
```

**Output (Timeline)**:
```json
{
  "timeline": [
    {
      "type": "text",
      "content": "¡Hola Ana! 👋 Qué bueno verte de nuevo.",
      "delay": 0
    },
    {
      "type": "typing",
      "duration": 1500
    },
    {
      "type": "products",
      "items": [
        { "id": "1", "name": "Aguacate Hass", "price": 5500 }
      ]
    },
    {
      "type": "options",
      "options": [
        { "label": "🥑 Para Hoy", "value": "maduros" },
        { "label": "📅 Para la Semana", "value": "verdes" }
      ]
    }
  ]
}
```

**Tipos de Elementos**:
- `text`: Mensaje simple
- `typing`: Simula "escribiendo..."
- `options`: Botones de respuesta rápida
- `products`: Carrusel de productos

---

## ⚙️ Configuración Inicial

### Requisitos Previos

1. **Node.js 18+** (para supergateway MCP)
2. **Python 3.8+** (para scripts CLI)
3. **Cuenta n8n** (instancia propia o n8n.cloud)
4. **Cuenta YCloud** (proveedor WhatsApp)
5. **Cuenta Supabase** (base de datos)
6. **API Key DeepSeek** (modelo IA)

---

### Paso 1: Configurar n8n

#### Instalación (Docker)
```bash
docker run -d \
  --name n8n \
  -p 5678:5678 \
  -e N8N_BASIC_AUTH_ACTIVE=true \
  -e N8N_BASIC_AUTH_USER=admin \
  -e N8N_BASIC_AUTH_PASSWORD=tu_password \
  -e WEBHOOK_URL=https://tu-dominio.com \
  -v ~/.n8n:/home/node/.n8n \
  n8nio/n8n
```

#### Configurar Credenciales

| Credencial | Propósito |
|------------|-----------|
| PostgreSQL Local | Base de datos local |
| Supabase | Base de datos de la tienda |
| YCloud API | Envío de WhatsApp |
| DeepSeek | Modelo IA |
| OpenAI (opcional) | GPT para limpieza de datos |

---

### Paso 2: Conectar Supabase

**Guía**: `GUIA-CONECTAR-N8N-SUPABASE.md`

1. Obtener credenciales de Supabase:
   - Host: `db.[proyecto-id].supabase.co`
   - Port: `5432`
   - User: `postgres`
   - Password: [tu password]

2. Crear credencial en n8n:
   - Credentials → Add Credential → Postgres
   - Configurar SSL: ✅

3. Verificar conexión:
```sql
SELECT COUNT(*) as total FROM products;
```

---

### Paso 3: Configurar YCloud

1. Obtener API Key de YCloud Dashboard

2. Crear credencial en n8n:
   - Type: HTTP Header Auth
   - Header Name: `X-API-Key`
   - Header Value: [tu API key]

3. Configurar webhook en YCloud:
   - Dashboard → Webhooks → Add Webhook
   - Event: `whatsapp.inbound_message.received`
   - URL: [URL webhook de n8n]

---

### Paso 4: Importar Flujos

#### Agente Luz
1. Importar `Agente Luz v6.5 - Con Herramientas Admin Copiloto.json`
2. Activar webhook
3. Copiar URL del webhook
4. Configurar en YCloud

#### Sincronización
1. Importar workflows de sync:
   - `workflow-sync-clientes-supabase-to-local.json`
   - `workflow-sync-clientes-local-to-supabase.json`
   - `workflow-sync-productos.json`
   - `sync-productos-variantes-completo.json`
2. Ejecutar manualmente primero
3. Activar ejecución automática

#### Automatización de Pedidos
1. Importar `automation-pedidos-web.json`
2. Configurar webhook en la tienda
3. Probar con un pedido de prueba

---

### Paso 5: Configurar MCP (Opcional)

**Guía**: `GUIA-SETUP-N8N-ANTIGRAVITY.md`

1. Instalar supergateway:
```bash
npx -y supergateway --streamableHttp https://tu-n8n.com/mcp-server/http --header authorization:Bearer [token]
```

2. Configurar en Antigravity (VS Code):
```json
{
  "mcpServers": {
    "n8n-mcp": {
      "command": "npx",
      "args": [
        "-y",
        "supergateway",
        "--streamableHttp",
        "https://dep-n8n.n8ntusaguacates.space/mcp-server/http",
        "--header",
        "authorization:Bearer [TU_TOKEN_MCP]"
      ]
    }
  }
}
```

3. Reiniciar VS Code

---

## 🔧 Solución de Problemas

### Problemas Comunes

#### Error: "Invalid API Key" (YCloud)
**Causa**: Header incorrecto
**Solución**: 
- Verificar que el header sea `X-API-Key` (con X mayúscula)
- Verificar que la API key sea correcta

#### Error: "Function not found" (Supabase)
**Causa**: Función RPC no creada
**Solución**:
- Ejecutar `supabase-search-function.sql` en SQL Editor
- Verificar: `SELECT * FROM search_products('aguacate');`

#### El Agente no responde
**Causas posibles**:
- Webhook desactivado en n8n
- YCloud no envía webhooks
- Error en credenciales

**Solución**:
1. Verificar que el workflow esté activo
2. Verificar logs del workflow
3. Probar webhook manualmente
4. Verificar configuración en YCloud

#### Errores de Sincronización
**Causas**:
- Credenciales incorrectas
- Tiempo de espera excedido
- Datos inconsistentes

**Solución**:
1. Verificar credenciales de Supabase
2. Aumentar timeout en nodos
3. Ejecutar manualmente para ver errores específicos

#### Emojis se ven mal
**Causa**: Codificación incorrecta
**Solución**: 
- Usar scripts de fix: `fix-emojis-tienda.js`
- Verificar encoding UTF-8 en base de datos

---

### Debugging

#### Ver Logs de Workflow
1. En n8n, seleccionar el workflow
2. Click en "Executions"
3. Ver logs de cada ejecución

#### Probar Webhook Manualmente
```bash
curl -X POST [URL_WEBHOOK] \
  -H "Content-Type: application/json" \
  -d '{"test": true}'
```

#### Verificar Conexión a Supabase
```sql
-- En SQL Editor de Supabase
SELECT COUNT(*) FROM products;
```

#### Verificar Conexión a PostgreSQL Local
```sql
-- En cliente PostgreSQL
SELECT COUNT(*) FROM clientes;
```

---

## 📊 Monitoreo

### Métricas Clave

| Métrica | Cómo Medir | Objetivo |
|---------|------------|----------|
| Respuestas del Agente | Ejecuciones exitosas / totales | >95% |
| Sincronización exitosa | Workflow completado sin errores | 100% |
| Carritos recuperados | Pedidos tras recordatorio | >10% |
| Pedidos web procesados | Automatización completada | 100% |

### Alertas Recomendadas

- Workflow falla 3 veces consecutivas
- Webhook no responde >1 min
- Sincronización falla >1 hora
- Sin respuesta del Agente >5 min

---

## 📖 Archivos de Referencia

### Documentación
- `README.md` - Guía principal del Agente Luz
- `GUIA-CONECTAR-N8N-SUPABASE.md` - Conexión Supabase
- `GUIA-SYNC-CLIENTES.md` - Sincronización clientes
- `GUIA-SYNC-VARIANTES.md` - Sincronización variantes
- `GUIA-SETUP-N8N-ANTIGRAVITY.md` - Configuración MCP
- `GUIA-INTEGRAR-COPILOTO.md` - Integración Copiloto

### Scripts SQL
- `setup-database.sql` - Setup base de datos
- `supabase-search-function.sql` - Función búsqueda
- `tool-buscar-productos-supabase.sql` - Tool búsqueda
- `migracion-clientes-*.sql` - Migraciones clientes
- `setup-variantes-table-local.sql` - Tabla variantes

### Scripts JavaScript
- `n8n_manager.py` - CLI Python para n8n
- `preprocesamiento-v*.js` - Preprocesamiento mensajes
- `codigo-preparar-respuesta-v*.js` - Respuestas Agente
- `fix-*.js` - Scripts de corrección

---

## 🎓 Capacitación

### Para Desarrolladores
- Entender el flujo de datos
- Saber crear nuevos workflows
- Conocer las herramientas disponibles
- Saber debuggear errores

### Para Operadores
- Saber usar el Copiloto
- Entender los estados de los clientes
- Saber interpretar los reportes
- Conocer cómo escalar casos complejos

### Para Administradores
- Conocer la arquitectura general
- Saber configurar credenciales
- Entender el monitoreo
- Saber solucionar problemas comunes

---

## 🔄 Roadmap

### Próximas Mejoras

- [ ] Integración con pasarelas de pago
- [ ] Notificaciones push en la tienda
- [ ] Análisis de sentimiento en conversaciones
- [ ] Predicción de churn de clientes
- [ ] Recomendaciones personalizadas
- [ ] Chatbot multilingüe

---

## 📞 Soporte

### Documentación Adicional
- n8n Docs: https://docs.n8n.io
- YCloud Docs: https://docs.ycloud.com
- Supabase Docs: https://supabase.com/docs
- DeepSeek API: https://api.deepseek.com/docs

### Equipo
- **Desarrollador n8n**: [Contacto]
- **Desarrollador Tienda**: [Contacto]
- **Soporte Técnico**: [Contacto]

---

## 📝 Notas Finales

### Seguridad
- Nunca commitear credenciales a Git
- Usar variables de entorno para secretos
- Rotar API keys regularmente
- Monitorear accesos sospechosos

### Buenas Prácticas
- Documentar cualquier cambio en workflows
- Probar cambios en ambiente de desarrollo primero
- Mantener copias de seguridad de workflows
- Revisar logs regularmente

### Mantenimiento
- Revisar workflows fallidos semanalmente
- Actualizar dependencias mensualmente
- Optimizar consultas SQL trimestralmente
- Revisar credenciales trimestralmente

---

## 🤖 Capacidades de OpenCode con n8n

### ❌ NO tengo conexión MCP directa

No tengo acceso a un servidor MCP para n8n. No puedo:
- Ejecutar workflows directamente
- Ver logs en tiempo real
- Modificar workflows en el servidor activo
- Acceder a la interfaz web de n8n

### ✅ LO QUE PUEDO HACER

#### 1. Leer y Analizar Workflows
- Interpretar archivos JSON de flujos de n8n
- Entender la lógica de los nodos y conexiones
- Identificar problemas en la configuración
- Proponer mejoras y optimizaciones
- Analizar dependencias entre workflows

#### 2. Modificar Workflows
- Editar archivos JSON de flujos almacenados localmente
- Agregar, modificar o eliminar nodos
- Cambiar configuraciones de credenciales
- Optimizar lógica de negocio
- Reestructurar flujos complejos

#### 3. Crear Scripts de Integración
- Escribir código JavaScript/Python para automatización
- Crear scripts para importar/exportar flujos
- Generar código SQL para consultas y migraciones
- Desarrollar scripts de mantenimiento y limpieza

#### 4. Documentar y Auditar
- Documentar arquitectura de flujos
- Analizar dependencias entre nodos
- Identificar errores potenciales
- Crear guías de uso y troubleshooting
- Generar reportes de auditoría

### 🔗 Conexión Directa con n8n

Para interactuar directamente con n8n, necesitas usar el CLI Python o la API REST:

#### CLI Python: n8n_manager.py

Ubicación: `C:\Users\Usuario\Documents\proyecto tienda\tus-aguacates\scripts\n8n_manager.py`

```bash
# Listar workflows
python n8n_manager.py list

# Obtener un workflow
python n8n_manager.py get <workflow_id>

# Auditar un workflow
python n8n_manager.py audit <workflow_id>

# Actualizar workflow
python n8n_manager.py update <workflow_id> archivo.json
```

#### API REST

URL base: `https://dep-n8n.n8ntusaguacates.space/api/v1/`

```bash
# Listar workflows
curl -H "X-N8N-API-KEY: your-key" \
  https://dep-n8n.n8ntusaguacates.space/api/v1/workflows

# Obtener workflow
curl -H "X-N8N-API-KEY: your-key" \
  https://dep-n8n.n8ntusaguacates.space/api/v1/workflows/<id>
```

#### Variables de Entorno

Crear archivo `.env.n8n`:
```bash
N8N_BASE_URL=https://dep-n8n.n8ntusaguacates.space
N8N_API_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

**Última Actualización**: 8 de Febrero de 2026  
**Versión**: 2.0 (Actualizado con capacidades OpenCode)  
**Autor**: Equipo Tus Aguacates + OpenCode
