# 🗂️ Índice de Flujos n8n - Tus Aguacates

**Última actualización**: Febrero 2026  
**Total de flujos**: 14+ (10 activos, 3 de referencia)

---

## 🏷️ Por Categoría

### 🤖 AGENTE WHATSAPP (Principal)

**Flujo principal con IA para atención al cliente**
- **Agente Luz v6.5** (✅ Activo) → `Agente Luz v6.5 - Con Herramientas Admin Copiloto.json`
- **Agente Luz v5 Hibrido** (⚪ Referencia) → `Agente-Luz-v5-Hibrido-Copiloto.json`
- **Agente Luz v4 Hibrido** (⚪ Referencia) → `agente-luz-v4-hibrido.json`

**Herramientas incluidas**:
- TOOL_BuscarProductos (Supabase)
- TOOL_ConsultarPedido (PostgreSQL)
- TOOL_AnadirAlCarrito (PostgreSQL)
- TOOL_CalcularTotalPrePedido (PostgreSQL)
- TOOL_GuardarNombreCliente (PostgreSQL)
- TOOL_CambiarEstadoCliente (PostgreSQL)
- TOOL_EscalarServicio (Escala a humano)
- TOOL_Etiquetar (YCloud)
- TOOL_BorrarMemoria (Buffer Window)

**Estados del cliente**:
`NUEVO → NOMBRE_SOLICITADO → ATENCION_LUZ → EN_PEDIDO → PEDIDO_FINALIZADO`

---

### 🔄 SINCRONIZACIÓN DE DATOS

**Sincronización de Productos**:
- **workflow-sync-productos.json** (✅ Activo) → Supabase → PostgreSQL Local

**Sincronización de Clientes**:
- **workflow-sync-clientes-bucle-robusto.json** (✅ Activo) → Supabase → PostgreSQL Local (Lotes de 500)
- **workflow-sync-clientes-supabase-to-local.json** (✅ Activo) → Supabase → PostgreSQL Local
- **workflow-sync-clientes-supabase-to-local-PART-2.json** (✅ Activo) → Supabase → PostgreSQL Local
- **workflow-sync-clientes-local-to-supabase.json** (✅ Activo) → PostgreSQL Local → Supabase

---

### 🛒 GESTIÓN DE PEDIDOS Y CARRETOS

**Procesador de Buffer**:
- **workflow-procesar-buffer.json** (✅ Activo) → Procesa mensajes agrupados cada 10 segundos

**Confirmación de Pedidos**:
- **workflow-confirmar-prepedido.json** (✅ Activo) → Webhook para confirmar pedidos desde WhatsApp

---

### ⏰ AUTOMATIZACIÓN Y RECORDATORIOS

**Recordatorios de Carritos Abandonados**:
- **workflow-recordatorio-carritos.json** (✅ Activo) → Envía recordatorios cada 4 horas

**Auto-Etiquetado en YCloud**:
- **workflow-auto-etiquetar-ycloud.json** (✅ Activo) → Etiqueta clientes cada 5 minutos

---

### 📊 AUDITORÍA Y MONITORIZACIÓN

**Auditoría de Pedidos**:
- **workflow-auditoria-pedidos.json** (✅ Activo) → Auditoría manual de pedidos

**Monitorización**:
- **workflow-audit-integrity-daily.json** (✅ Activo) → Auditoría diaria de integridad
- **monitor-escalados-workflow.json** (✅ Activo) → Monitoriza casos escalados
- **workflow-tracking-respuestas.json** (✅ Activo) → Rastrea respuestas de campañas

---

### 📢 MARKETING Y CAMPANAS

**Campañas Masivas**:
- **campana-500-clientes-invitatienda.json** (✅ Activo) → Lanzamiento de tienda
- **campana-navidad-151-clientes.json** (✅ Activo) → Campaña navideña
- **campana-masiva-anti-duplicados.json** (✅ Activo) → Campaña masiva con prevención

---

### 🔧 HELPERS Y UTILIDADES

**MCP Helpers**:
- **mcp-helper-workflow.json** (✅ Activo) → Integración MCP
- **mcp-helper-v2.json** (✅ Activo) → Integración MCP v2

**Otros Helpers**:
- **workflow-auto-etiquetar-ycloud.json** (✅ Activo) → Etiquetado automático
- **nodo-pulidor-respuestas.json** (✅ Activo) → Pulir respuestas de IA
- **nodos-copiloto-para-agregar.json** (✅ Activo) → Nodos del copiloto
- **herramientas-admin-copiloto.json** (✅ Activo) → Herramientas administrativas

---

## 🎯 Por Función

| Función | Flujo Principal | Archivo |
|---------|-----------------|---------|
| Atención al cliente 24/7 | Agente Luz v6.5 | `Agente Luz v6.5 - Con Herramientas Admin Copiloto.json` |
| Sincronización automática de datos | Sync Productos | `workflow-sync-productos.json` |
| Sincronización de clientes | Sync Clientes (Lotes 500) | `workflow-sync-clientes-bucle-robusto.json` |
| Procesamiento de mensajes | Buffer | `workflow-procesar-buffer.json` |
| Confirmación de pedidos | Confirmar Pre-Pedido | `workflow-confirmar-prepedido.json` |
| Recuperación de ventas | Recordatorio Carritos | `workflow-recordatorio-carritos.json` |
| Gestión de clientes | Auto-Etiquetar YCloud | `workflow-auto-etiquetar-ycloud.json` |
| Auditoría de pedidos | Auditoría Pedidos | `workflow-auditoria-pedidos.json` |
| Campañas masivas | Campaña 500 Clientes | `campana-500-clientes-invitatienda.json` |

---

## 🚀 Por Frecuencia

| Frecuencia | Flujos | Cantidad |
|-----------|--------|----------|
| **Cada hora** | Sync Productos, Sync Clientes | 3 |
| **Cada 4 horas** | Recordatorio Carritos | 1 |
| **Cada 5 minutos** | Auto-Etiquetar YCloud | 1 |
| **Cada 10 segundos** | Buffer | 1 |
| **En tiempo real** | Agente WhatsApp | 1 |
| **Webhook** | Confirmar Pedido, Auditoría | 2 |
| **Manual** | Campañas, MCP, Monitorización | 4+ |

---

## 📋 Por Estado

### ✅ ACTIVOS (10)
1. Agente Luz v6.5
2. Sync Productos
3. Sync Clientes (Lotes 500)
4. Sync Clientes (Directo)
5. Sync Clientes (Local → Supabase)
6. Sync Clientes (Part 2)
7. Procesador de Buffer
8. Confirmar Pre-Pedido
9. Recordatorio Carritos
10. Auto-Etiquetar YCloud

### ⚪ REFERENCIA / ARCHIVADOS (3)
1. Agente Luz v5 Hibrido
2. Agente Luz v4 Hibrido
3. Versiones anteriores

---

## 🔗 Por Proveedor

### YCloud (WhatsApp)
1. Agente Luz v6.5
2. Confirmar Pre-Pedido
3. Recordatorio Carritos
4. Auto-Etiquetar YCloud
5. Procesador de Buffer

### Supabase (Tienda Online)
1. Agente Luz v6.5
2. Sync Productos
3. Sync Clientes (Todos)
4. Confirmar Pre-Pedido
5. Auditoría Pedidos

### PostgreSQL Local (N8N)
1. Agente Luz v6.5
2. Sync Productos
3. Sync Clientes (Todos)
4. Procesador de Buffer
5. Confirmar Pre-Pedido
6. Recordatorio Carritos
7. Auto-Etiquetar YCloud
8. Auditoría Pedidos

### DeepSeek (IA)
1. Agente Luz v6.5

---

## 📊 Por Tablas de Base de Datos

### Supabase
- `products` (productos de tienda)
- `customers` (clientes web)
- `guest_orders` (pedidos web)
- `categories` (categorías)
- `variants` (variantes de productos)

### PostgreSQL Local
- `clientes` (clientes WhatsApp)
- `productos_tienda` (productos sincronizados)
- `pre_pedidos` (carritos en progreso)
- `mensaje_buffer` (mensajes pendientes)
- `recordatorios_enviados` (registro de recordatorios)

---

## 🎯 Ruta de Conocimiento

### Para nuevos integradores
1. **Leer primero**: `TABLA_REFERENCIA_RAPIDA.md` (básico)
2. **Estudiar**: `MANUAL_FLUJOS_N8N.md` (completo)
3. **Revisar**: `README.md` (introducción)
4. **Configurar**: `GUIA-*.md` (instalación)

### Para desarrolladores
1. **Arquitectura**: `MANUAL_FLUJOS_N8N.md` → Sección arquitectura
2. **Flujos principales**: `MANUAL_FLUJOS_N8N.md` → Flujo por flujo
3. **SQL**: `MANUAL_FLUJOS_N8N.md` → Referencias SQL
4. **Códigos**: `*.js` en la carpeta

### Para soporte técnico
1. **Troubleshooting**: `MANUAL_FLUJOS_N8N.md` → Sección troubleshooting
2. **Logs**: Revisar ejecuciones en n8n
3. **Credenciales**: Verificar configuradas
4. **Conexiones**: Probar endpoints

---

## 📞 Accesos Rápidos

### Archivos de Documentación
- `MANUAL_FLUJOS_N8N.md` - Manual completo (490+ líneas)
- `TABLA_REFERENCIA_RAPIDA.md` - Resumen ejecutivo
- `README.md` - Introducción general
- `GUIA-*.md` - Guías de instalación

### Archivos JSON (Flujos)
- Agente: `Agente Luz v6.5 - Con Herramientas Admin Copiloto.json`
- Sync: `workflow-sync-productos.json`
- Buffer: `workflow-procesar-buffer.json`
- Pedido: `workflow-confirmar-prepedido.json`

### Archivos SQL
- Funciones: `supabase-search-function.sql`
- Tablas: `*.sql` en la carpeta

---

## 🔧 Configuración Crítica

### Credenciales Principales
```yaml
PostgreSQL Docker: R6hc0vEZJhKQSi3G (N8N Local)
Supabase Account 2: oFlOZEZmGLS2kaKr (Tienda Online)
DeepSeek Account 2: 8BVSsLxHakKs5L6l (IA)
YCloud API: 9YuNWHvIcXFwYdOX (WhatsApp)
```

### Webhooks Activos
```yaml
Agente WhatsApp: https://tu-n8n.com/webhook/ycloud
Confirmar Pedido: https://tu-n8n.com/webhook/confirmar-prepedido
```

---

## 📈 Próximas Actualizaciones Planificadas

1. **Documentación**:
   - [ ] Actualizar manual a versión 3.0
   - [ ] Añadir ejemplos de código
   - [ ] Crear documentación de API

2. **Flujos**:
   - [ ] Migrar versiones antiguas a README
   - [ ] Crear flujos de respaldo
   - [ ] Optimizar rendimiento

3. **Monitoreo**:
   - [ ] Implementar alertas automáticas
   - [ ] Crear dashboards de métricas
   - [ ] Reportes semanales automáticos

---

**Fin del Índice**  
**Actualizado**: Febrero 2026  
**Total de flujos**: 14+ (10 activos, 3 de referencia)