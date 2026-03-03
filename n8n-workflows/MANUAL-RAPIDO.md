# 📘 MANUAL RÁPIDO - FLUJOS N8N TUS AGUACATES

## 📋 Índice
1. [Introducción](#introducción)
2. [Arquitectura del Sistema](#arquitectura-del-sistema)
3. [Workflows Principales](#workflows-principales)
4. [Flujo de Mensajes](#flujo-de-mensajes)
5. [Conexiones con n8n](#conexiones-con-n8n)
6. [Troubleshooting](#troubleshooting)

---

## 🎯 Introducción

Tu tienda en línea **Tus Aguacates** utiliza n8n para automatizar operaciones críticas conectadas a:
- **YCloud** - Proveedor de WhatsApp
- **Supabase** - Base de datos del e-commerce
- **PostgreSQL** - Bases de datos locales
- **DeepSeek/OpenAI** - Modelos de IA para atención

---

## 🏗️ Arquitectura del Sistema

```
┌─────────────────────────────────────────────────────────┐
│                   YCLOUD (WhatsApp)                      │
│                 Webhooks + API Messages                  │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│                    N8N WORKFLOWS                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │ Agente Luz   │  │ Sync Datos   │  │ Auditorías   │ │
│  │   (IA)       │  │  Prod/Clie   │  │    Datos     │ │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘ │
└─────────┼──────────────────┼──────────────────┼─────────┘
          │                  │                  │
          ▼                  ▼                  ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ PostgreSQL   │  │  Supabase    │  │ DeepSeek AI  │
│   (Local)    │  │  (E-commerce)│  │   OpenAI     │
└──────────────┘  └──────────────┘  └──────────────┘
```

---

## 📊 Workflows Principales (46 archivos en total)

### 1. 🥑 Agente Luz (Atención al Cliente)
- **Archivo:** `Agente Luz v6.5 - Con Herramientas Admin Copiloto.json`
- **Función:** Atiende clientes por WhatsApp automáticamente
- **Trigger:** Webhook de YCloud
- **Modelo:** DeepSeek/OpenAI
- **Estado:** ✅ Activo

### 2. ⏰ Procesador de Buffer
- **Archivo:** `workflow-procesar-buffer.json`
- **Función:** Agrupa mensajes rápidos (10s) para evitar spam
- **Frecuencia:** Cada 10 segundos
- **Estado:** ✅ Activo

### 3. 🔄 Sincronización de Productos
- **Archivo:** `workflow-sync-productos.json`
- **Función:** Sincroniza productos de Supabase → PostgreSQL local
- **Frecuencia:** Cada hora
- **Estado:** ✅ Activo

### 4. 👥 Sincronización de Clientes (Bidireccional)
- **Archivo:** `workflow-sync-clientes-supabase-to-local.json` (Supabase → Local)
- **Archivo:** `workflow-sync-clientes-local-to-supabase.json` (Local → Supabase)
- **Frecuencia:** Cada hora
- **Estado:** ✅ Activo

### 5. 📦 Confirmar Pre-Pedido
- **Archivo:** `workflow-confirmar-prepedido.json`
- **Función:** Convierte pedido WhatsApp → Tienda online
- **Trigger:** Webhook
- **Estado:** ✅ Activo

### 6. 🛒 Recordatorios Carritos
- **Archivo:** `workflow-recordatorio-carritos.json`
- **Función:** Recordatorios automáticos a clientes abandonados
- **Frecuencia:** Cada 4 horas
- **Estado:** ⚪ Inactivo

### 7. 🛡️ Auditoría Diaria
- **Archivo:** `workflow-audit-integrity-daily.json`
- **Función:** Verifica integridad de datos
- **Frecuencia:** Diario a las 6 AM
- **Estado:** ⚪ Inactivo

### 8. 🔍 Auditoría de Pedidos
- **Archivo:** `workflow-auditoria-pedidos.json`
- **Función:** Detecta discrepancias de precios históricos
- **Trigger:** Manual/Webhook
- **Estado:** ⚪ Inactivo

### 9. 📊 Tracking Respuestas
- **Archivo:** `workflow-tracking-respuestas.json`
- **Función:** Marca respuestas a campañas de marketing
- **Trigger:** Webhook
- **Estado:** ✅ Activo

### 10. 🏷️ Auto-Etiquetado YCloud
- **Archivo:** `workflow-auto-etiquetar-ycloud.json`
- **Función:** Etiqueta contactos por estado de conversación
- **Frecuencia:** Cada 5 minutos
- **Estado:** ⚪ Inactivo

---

## 🔄 Flujo de Mensajes WhatsApp → Tienda

```
Cliente envía mensaje
       ↓
Webhook YCloud (n8n)
       ↓
Pre-procesamiento (detecta cliente/director)
       ↓
Obtener Cliente (PostgreSQL)
       ↓
Búsqueda de Productos (automática si detecta)
       ↓
Agente IA (decide herramienta)
       ↓
Preparar Respuesta (formatea WhatsApp)
       ↓
Enviar WhatsApp (YCloud API)
       ↓
Cliente recibe respuesta
```

---

## 🔗 Conexiones con n8n (Mis Capacidades)

### ✅ Lo que puedo hacer con n8n:

#### 1. **Lectura y Análisis**
- ✅ Leer archivos JSON de workflows
- ✅ Analizar estructura (nodos, conexiones, credenciales)
- ✅ Entender lógica de cada flujo
- ✅ Documentar flujos existentes

#### 2. **Modificación de Workflows**
- ✅ Crear nuevos workflows desde cero
- ✅ Modificar workflows existentes
- ✅ Agregar/eliminar nodos
- ✅ Reconfigurar credenciales
- ✅ Cambiar lógica de negocio

#### 3. **Script Python (n8n_manager.py)**
- ✅ Listar workflows en n8n
- ✅ Obtener workflows por ID
- ✅ Crear workflows desde archivos JSON
- ✅ Actualizar workflows existentes
- ✅ Activar/desactivar workflows
- ✅ Ejecutar webhooks
- ✅ Auditar workflows

#### 4. **Versionado con Git**
- ✅ Versionar workflows en Git
- ✅ Comparar cambios entre versiones
- ✅ Crear branches para experimentar

### ❌ Lo que NO puedo hacer:

- ❌ **Ejecutar workflows en tiempo real** (solo puedo crear/modificar archivos)
- ❌ **Ver logs en vivo** (solo puedo analizar logs exportados)
- ❌ **Conexión MCP directa** (no hay servidor MCP configurado)
- ❌ **Pruebas de workflows** (necesito usar webhooks o scripts externos)

---

## 🔧 Herramientas Disponibles

### Script Python: n8n_manager.py

Ubicación: `tus-aguacates/scripts/n8n_manager.py`

**Comandos disponibles:**

```bash
# Listar workflows
python scripts/n8n_manager.py list

# Obtener workflow por ID
python scripts/n8n_manager.py get <id>

# Crear desde archivo
python scripts/n8n_manager.py create archivo.json

# Actualizar workflow
python scripts/n8n_manager.py update <id> archivo.json

# Activar/desactivar
python scripts/n8n_manager.py activate <id>
python scripts/n8n_manager.py deactivate <id>

# Ejecutar webhook
python scripts/n8n_manager.py run_webhook <url> [data]

# Auditar workflow
python scripts/n8n_manager.py audit <id>
```

**Configuración requerida:**

Crear archivo `.env.n8n`:

```env
N8N_BASE_URL=https://dep-n8n.n8ntusaguacates.space
N8N_API_KEY=tu-api-key-jwt
```

---

## 🐛 Troubleshooting Común

### Problema: Agente no responde

**Causas:**
1. Webhook de YCloud no activo
2. YCloud no está enviando mensajes
3. Error en pre-procesamiento

**Solución:**
- Activar workflow en n8n
- Verificar URL del webhook en YCloud
- Revisar logs del nodo "Pre-procesamiento YCloud"

### Problema: Cliente no encuentra productos

**Causas:**
1. Sincronización de productos falló
2. SQL de búsqueda tiene error
3. Productos no están activos

**Solución:**
- Ejecutar manualmente "Sync Productos"
- Verificar hay productos en `productos_tienda`
- Revisar `is_active = true` en productos

### Problema: Pedido no se confirma

**Causas:**
1. Pre-pedido no existe en local
2. Diferencia de precios
3. Error en Upsert Supabase

**Solución:**
- Verificar cliente tiene `pre_pedido` no vacío
- Verificar catálogo de Supabase actualizado
- Revisar credenciales de Supabase

### Problema: Carrito se duplica

**Causas:**
1. Agente agrega mismo producto múltiples veces
2. Buffer agrupa mensajes incorrectamente

**Solución:**
- Agregar lógica para verificar duplicados
- Ajustar tiempo de 30s en buffer

---

## 📞 Recursos Adicionales

### Documentos Existentes

1. **Manual Completo:** `n8n-workflows/MANUAL-FLUJOS-COMPLETO.md` (947 líneas)
2. **Guía de Integración:** `docs/n8n_integration_guide.md`
3. **Guías Específicas:** `n8n-workflows/GUIA-*.md`
4. **Script Manager:** `scripts/n8n_manager.py`

### Credenciales Configuradas

- **PostgreSQL Local:** ID `R6hc0vEZJhKQSi3G` - Base de datos de WhatsApp
- **Supabase:** ID `oFlOZEZmGLS2kaKr` - E-commerce backend
- **YCloud:** API de WhatsApp
- **OpenAI:** GPT-4.1-mini (Copiloto)
- **DeepSeek:** Modelo IA (Agente Luz)

---

## 🎓 Flujo de Trabajo Recomendado

### Cuando necesitas modificar un flujo:

1. **Leer el flujo actual**
   ```bash
   python scripts/n8n_manager.py get <id> > backup.json
   ```

2. **Analizar estructura**
   - Revisar nodos principales
   - Entender lógica de negocio
   - Identificar dependencias

3. **Crear cambios**
   - Modificar archivo JSON
   - Validar sintaxis
   - Probar cambios localmente

4. **Actualizar en n8n**
   ```bash
   python scripts/n8n_manager.py update <id> archivo.json
   ```

5. **Documentar cambios**
   - Agregar notas al workflow
   - Crear commit en Git

---

## 📊 Resumen de Capacidades

| Acción | Capacidad | Método |
|--------|-----------|--------|
| Leer workflow | ✅ Sí | Archivo JSON |
| Crear workflow | ✅ Sí | Archivo JSON + n8n_manager.py |
| Modificar workflow | ✅ Sí | Archivo JSON + n8n_manager.py |
| Listar workflows | ✅ Sí | n8n_manager.py |
| Activar workflow | ✅ Sí | n8n_manager.py |
| Auditoría | ✅ Sí | n8n_manager.py |
| Documentación | ✅ Sí | Análisis de JSON |
| Ejecutar webhooks | 🟡 Parcial | n8n_manager.py |
| Logs en vivo | ❌ No | - |
| Conexión MCP | ❌ No | - |

---

**Versión:** 1.0
**Última actualización:** Febrero 2026
**Total workflows:** 46 archivos JSON
**Estado:** ✅ Sistema operativo y documentado
