# 📋 Tabla de Referencia Rápida - Flujos n8n

**Versión**: 1.0  
**Fecha**: Febrero 2026

---

## 🎯 Visión General

**14+ Flujos Activos** en n8n para la tienda "Tus Aguacates"  
**5 Proveedores Externos**: YCloud, Supabase, PostgreSQL, DeepSeek, Tienda Web  
**4 Categorías Principales**: Sincronización, WhatsApp, Automatización, Administración

---

## 📊 Resumen por Categoría

### 1. Sincronización de Datos (5 flujos)

| Flujo | Frecuencia | Origen → Destino | Estado | Archivo |
|-------|-----------|------------------|--------|---------|
| Sync Productos | Cada hora | Supabase → PostgreSQL Local | ✅ Activo | `workflow-sync-productos.json` |
| Sync Clientes (Lotes 500) | Cada hora | Supabase → PostgreSQL Local | ✅ Activo | `workflow-sync-clientes-bucle-robusto.json` |
| Sync Clientes (Directo) | Cada hora | Supabase → PostgreSQL Local | ✅ Activo | `workflow-sync-clientes-supabase-to-local.json` |
| Sync Clientes (Local → Supabase) | Cada hora | PostgreSQL Local → Supabase | ✅ Activo | `workflow-sync-clientes-local-to-supabase.json` |
| Sync Clientes (Part 2) | Cada hora | Supabase → PostgreSQL Local | ✅ Activo | `workflow-sync-clientes-supabase-to-local-PART-2.json` |

**Proveedores**: Supabase, PostgreSQL Docker  
**Base de datos**: 
- Supabase: `products`, `customers`, `guest_orders`, `categories`
- PostgreSQL: `clientes`, `productos_tienda`, `pre_pedidos`

---

### 2. Agente WhatsApp (3 versiones)

| Versión | Estado | Descripción | Archivo |
|---------|--------|-------------|---------|
| v6.5 Admin Copiloto | ✅ Activo | Principal con herramientas admin | `Agente Luz v6.5 - Con Herramientas Admin Copiloto.json` |
| v5 Hibrido | ⚪ Referencia | Versión anterior | `Agente-Luz-v5-Hibrido-Copiloto.json` |
| v4 Hibrido | ⚪ Referencia | Versión anterior | `agente-luz-v4-hibrido.json` |

**Trigger**: Webhook YCloud (whatsapp.inbound_message.received)  
**Proveedor**: DeepSeek (IA), YCloud (WhatsApp), Supabase, PostgreSQL

**Herramientas del Agente**:
- TOOL_BuscarProductos → Supabase
- TOOL_ConsultarPedido → PostgreSQL
- TOOL_AnadirAlCarrito → PostgreSQL
- TOOL_CalcularTotalPrePedido → PostgreSQL
- TOOL_GuardarNombreCliente → PostgreSQL
- TOOL_CambiarEstadoCliente → PostgreSQL
- TOOL_EscalarServicio → Escala a humano
- TOOL_Etiquetar → YCloud
- TOOL_BorrarMemoria → Buffer Window

**Estados del Cliente**: NUEVO → NOMBRE_SOLICITADO → ATENCION_LUZ → EN_PEDIDO → PEDIDO_FINALIZADO

---

### 3. Gestión de Pedidos (2 flujos)

| Flujo | Trigger | Descripción | Estado | Archivo |
|-------|---------|-------------|--------|---------|
| Procesador de Buffer | Cada 10s | Agrupa mensajes de WhatsApp | ✅ Activo | `workflow-procesar-buffer.json` |
| Confirmar Pre-Pedido | Webhook | Confirma pedidos desde WhatsApp | ✅ Activo | `workflow-confirmar-prepedido.json` |

**Webhook Confirmar**: `POST /confirmar-prepedido`

---

### 4. Automatización (2 flujos)

| Flujo | Frecuencia | Descripción | Estado | Archivo |
|-------|-----------|-------------|--------|---------|
| Recordatorio Carritos | Cada 4 horas | Envía recordatorios de carritos abandonados | ✅ Activo | `workflow-recordatorio-carritos.json` |
| Auto-Etiquetar YCloud | Cada 5 min | Etiqueta clientes en YCloud | ✅ Activo | `workflow-auto-etiquetar-ycloud.json` |

---

### 5. Administración (2 flujos)

| Flujo | Trigger | Descripción | Estado | Archivo |
|-------|---------|-------------|--------|---------|
| Auditoría Pedidos | Variable | Auditoría de pedidos históricos | ✅ Activo | `workflow-auditoria-pedidos.json` |
| Sistema Agentes | Variable | Herramientas de gestión | ✅ Activo | `agente-luz-v6.5-admin-copiloto.json` |

---

## 🔐 Credenciales Configuradas

| Credencial | ID | Uso Principal |
|------------|-----|---------------|
| **PostgreSQL Docker** | `R6hc0vEZJhKQSi3G` | Base de datos n8n (clientes, carritos) |
| **Supabase Account 2** | `oFlOZEZmGLS2kaKr` | Tienda online (products, customers, orders) |
| **DeepSeek Account 2** | `8BVSsLxHakKs5L6l` | Motor de IA para agente WhatsApp |
| **YCloud API** | `9YuNWHvIcXFwYdOX` | Proveedor de WhatsApp |
| **YCloud API** | `YCloudCredentials` | Proveedor de WhatsApp (alternativa) |

---

## 🚀 Mapa de Flujos Principales

### Flujo Principal (Agente WhatsApp)
```
YCloud (WhatsApp) 
  ↓ Webhook
Agente Luz v6.5 (DeepSeek)
  ↓ Herramientas
Supabase / PostgreSQL
  ↓ Respuesta
YCloud (WhatsApp)
```

### Flujo de Sincronización
```
Supabase (Tienda Online)
  ↓ Sync (cada hora)
PostgreSQL Local (N8N)
  ↓ Sync (cada hora)
Supabase (Tienda Online)
```

### Flujo de Confirmación de Pedidos
```
WhatsApp (Cliente)
  ↓ Pre-pedido
Agente Luz (Guarda en carrito)
  ↓ Confirmación
Webhook: /confirmar-prepedido
  ↓ Verifica precios
Supabase (Guarda pedido)
  ↓ Notifica
YCloud (Admin)
```

---

## 📈 Estadísticas Recomendadas

### Monitoreo Diario
- Tiempos de ejecución por flujo
- Errores y warnings
- Mensajes procesados por agente
- Sincronizaciones completadas

### Auditoría Semanal
- Integridad de datos
- Errores de sincronización
- Uso de créditos APIs
- Comportamiento del agente

### Auditoría Mensual
- Base de datos (vacuum)
- Logs de errores
- Versiones de nodos
- Configuración de credenciales

---

## 🔧 Troubleshooting Rápido

| Problema | Causa | Solución |
|----------|-------|----------|
| "Invalid API Key" (YCloud) | Header mal configurado | Verifica `X-API-Key` (con X mayúscula) |
| "Function not found" (Supabase) | Función RPC no creada | Ejecuta `supabase-search-function.sql` |
| Agente no responde | Webhook desactivado | Verifica activación en n8n y YCloud |
| Sincronización falla | Credencial inválida | Verifica credenciales de Supabase |
| Productos no se actualizan | Trigger schedule desactivado | Activa el flujo de sync |

---

## 📚 Documentación Adicional

- **Manual Completo**: `MANUAL_FLUJOS_N8N.md` (versión 2.0)
- **Guías de Instalación**: `GUIA-*.md`
- **Archivos de SQL**: `*.sql`
- **Archivos de Scripts**: `*.js`

---

## 🆘 Contacto y Soporte

**Problema con un flujo**:
1. Revisa los logs de ejecución en n8n
2. Consulta el manual completo
3. Verifica credenciales configuradas
4. Contacta al equipo técnico

---

**Fin de Tabla de Referencia Rápida**  
**Versión**: 1.0  
**Actualizado**: Febrero 2026