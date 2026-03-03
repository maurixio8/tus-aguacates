# 📋 Resumen Ejecutivo: Flujos de n8n - Tus Aguacates

## 🎯 Visión General

Tus Aguacates utiliza **45+ flujos de n8n** para automatizar la operación completa de la tienda online, integrando:
- Atención al cliente por WhatsApp con IA
- Sincronización de datos entre múltiples bases de datos
- Marketing masivo
- Operaciones administrativas
- Auditoría y monitoreo

---

## 📍 Ubicación

**Carpeta principal**: `tus-aguacates/n8n-workflows/`

**Documentación completa**: `MANUAL-COMPLETO-FLUJOS-N8N.md`

---

## 🏗️ Arquitectura Principal

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   WhatsApp      │     │      n8n        │     │   Supabase      │
│   (YCloud)      │────▶│  (Automatización)│────▶│  (Tienda Web)  │
└─────────────────┘     └────────┬────────┘     └─────────────────┘
                                 │
                                 ▼
                        ┌─────────────────┐
                        │ PostgreSQL      │
                        │ (Local - Agente)│
                        └─────────────────┘
```

---

## 🎨 Componentes Principales

### 1. 🤖 Agente Luz v6.5 (Flujo ACTIVO)
**Archivo**: `Agente Luz v6.5 - Con Herramientas Admin Copiloto.json`

**Propósito**: Bot de WhatsApp inteligente que atiende clientes automáticamente.

**Funcionalidades**:
- Búsqueda de productos en tiempo real
- Gestión de carritos de compra
- Detección de intenciones con IA (DeepSeek)
- Respuestas conversacionales naturales
- Escalamiento automático a humanos

**Nodos clave**:
- 📥 Webhook YCloud (entrada)
- 1. Pre-procesamiento (análisis de mensajes)
- 🤖 Agente Luz v4 (IA)
- TOOL_BuscarProductos (búsqueda en Supabase)
- TOOL_AnadirAlCarrito (gestión de carritos)
- 📱 Enviar WhatsApp YCloud (salida)

---

### 2. 🧠 Copiloto de Operaciones
**Archivos**: `Copiloto-Operaciones-v2-YCloud.json`

**Propósito**: Asistente administrativo para gestión interna.

**Funciones**:
- Listar clientes sin nombre
- Actualizar datos de clientes
- Ver carritos abandonados
- Consultar pedidos
- Vaciar carritos

**Acceso**: Solo desde números de teléfono autorizados (directores)

---

### 3. 🔄 Sincronización de Datos

#### Sync Productos
**Archivo**: `workflow-sync-productos.json`

**Frecuencia**: Cada hora

**Dirección**: Supabase → PostgreSQL Local

**Campos sincronizados**: Nombre, precio, stock, imágenes, categorías

#### Sync Clientes
**Archivos**:
- `workflow-sync-clientes-supabase-to-local.json`
- `workflow-sync-clientes-local-to-supabase.json`

**Frecuencia**: Cada hora

**Dirección**: Bidireccional

**Datos**: Nombre, teléfono, email, estado, historial

#### Sync Variantes
**Archivo**: `sync-productos-variantes-completo.json`

**Propósito**: Sincronizar presentaciones (1kg, 2kg, 5kg, etc.)

---

### 4. 📢 Campañas de Marketing

| Campaña | Archivo | Objetivo |
|---------|---------|----------|
| Lanzamiento Tienda | `campana-500-clientes-invitatienda.json` | 500 clientes VIP |
| Navidad | `campana-navidad-151-clientes.json` | Promoción temporal |
| Masivo | `campana-masiva-anti-duplicados.json` | Envíos masivos con control de duplicados |

---

### 5. 🔧 Operaciones y Auditoría

| Flujo | Archivo | Frecuencia |
|-------|---------|-------------|
| Auditoría Integridad | `workflow-audit-integrity-daily.json` | Diaria 6 AM |
| Auditoría Pedidos | `workflow-auditoria-pedidos.json` | Periódica |
| Recordatorios Carritos | `workflow-recordatorio-carritos.json` | Cada 4 horas |
| Automatización Pedidos Web | `automation-pedidos-web.json` | Webhook |

---

## 🔗 Conexión con la Tienda Online

### Webhook: n8n-order-sync
**Ubicación**: `tus-aguacates/app/api/webhooks/n8n-order-sync/`

**Propósito**: Recibe notificaciones de eventos de la tienda:
- Pedido creado
- Pedido confirmado
- Pago completado
- Estado del pedido cambiado

### Integración con Supabase

El Agente Luz consulta directamente a Supabase para:
- Buscar productos en el catálogo
- Verificar precios y stock
- Obtener variantes disponibles
- Mostrar información de inventario

---

## 🛠️ Herramientas y Utilidades

### CLI Python: n8n_manager.py
**Ubicación**: `scripts/n8n_manager.py`

**Comandos principales**:
```bash
python n8n_manager.py list           # Listar workflows
python n8n_manager.py get <id>       # Obtener workflow
python n8n_manager.py audit <id>     # Auditar lógica
python n8n_manager.py export <id>    # Exportar a archivo
```

### Scripts de Configuración
**Ubicación**: `n8n-workflows/`

- `create-v6.5-admin-copiloto.js` - Generar flujo principal
- `add-admin-tools-to-agente-luz.js` - Agregar herramientas admin
- `fix-*.js` - Scripts de corrección
- `verify-fix-connections.js` - Verificar conexiones

### Consultas SQL
- `setup-database.sql` - Crear tablas
- `tool-buscar-productos-supabase.sql` - Búsqueda de productos
- `query-busqueda-supabase.sql` - Query principal
- `diagnostico-calidad-clientes.sql` - Verificar calidad de datos

---

## 🤖 Capacidades de OpenCode con n8n

### ❌ Lo que NO puedo hacer
- Ejecutar workflows directamente
- Ver logs en tiempo real
- Modificar workflows en el servidor activo
- Acceder a la interfaz web de n8n
- Tener conexión MCP

### ✅ Lo que PUEDO hacer

#### 1. Leer y Analizar Workflows
- Interpretar archivos JSON de flujos
- Entender lógica de nodos
- Identificar problemas de configuración
- Proponer mejoras
- Analizar dependencias

#### 2. Modificar Workflows
- Editar archivos JSON locales
- Agregar/modificar/eliminar nodos
- Cambiar configuraciones
- Optimizar lógica de negocio

#### 3. Crear Scripts
- JavaScript/Python para automatización
- Scripts para importar/exportar
- Código SQL para consultas
- Scripts de mantenimiento

#### 4. Documentar y Auditar
- Documentar arquitectura
- Analizar dependencias
- Identificar errores potenciales
- Crear guías de uso
- Generar reportes

---

## 🔑 Configuración de Credenciales

### PostgreSQL Local
```
Host: localhost
Port: 5432
Database: postgres
User: postgres
SSL: No
```

### Supabase
```
Host: db.[tu-proyecto].supabase.co
Port: 5432 (o 6543 pooler)
Database: postgres
User: postgres
SSL: Sí
API Key: [tu anon key]
```

### YCloud (WhatsApp)
```
Auth: HTTP Header
Header Name: X-API-Key
Header Value: [tu API key]
```

### DeepSeek/OpenAI
```
Base URL: https://api.deepseek.com/v1
Auth: API Key
Model: deepseek-chat
```

---

## ⚠️ Problemas Comunes y Soluciones

| Problema | Causa | Solución |
|----------|-------|----------|
| "Invalid API Key" (YCloud) | Header incorrecto | Usar `X-API-Key` (con X mayúscula) |
| "Function not found" (Supabase) | RPC no creada | Ejecutar `supabase-search-function.sql` |
| Agente no responde | Webhook desactivado | Verificar que el workflow esté activo |
| Errores de sync | Credenciales incorrectas | Verificar credenciales Supabase |
| Emojis mal | Codificación incorrecta | Usar `fix-emojis-tienda.js` |

---

## 📊 Resumen de Workflows

| Categoría | Cantidad | Estado |
|-----------|----------|--------|
| 🤖 Agente Luz | 6+ versiones | v6.5 ACTIVO |
| 🧠 Copiloto | 2 versiones | v2 ACTIVO |
| 🔄 Sincronización | 8 flujos | Automáticos |
| 📢 Marketing | 3 campañas | Programadas |
| 🛡️ Auditoría | 2 flujos | Diaria |
| 🔧 Operaciones | 5+ flujos | On-demand |
| 🛠️ Utilidades | 20+ archivos | Soporte |

---

## 📚 Documentación Disponible

### Guías Principales
- `MANUAL-COMPLETO-FLUJOS-N8N.md` - Manual completo (actualizado)
- `README.md` - Guía del Agente Luz
- `GUIA-CONECTAR-N8N-SUPABASE.md` - Conexión con Supabase
- `GUIA-SETUP-N8N-ANTIGRAVITY.md` - Configuración MCP
- `GUIA-INTEGRAR-COPILOTO.md` - Integrar copiloto

### Documentos de Integración
- `docs/n8n_integration_guide.md` - Contrato del cerebro n8n
- `docs/n8n_brain_v2.json` - Configuración cerebro v2
- `docs/n8n_brain_v3_mistral.json` - Configuración cerebro v3

---

## 🚀 Quick Start para Nuevos Desarrolladores

### Paso 1: Entender el Sistema
1. Leer este resumen ejecutivo
2. Revisar `MANUAL-COMPLETO-FLUJOS-N8N.md`
3. Estudiar `Agente Luz v6.5 - Con Herramientas Admin Copiloto.json`

### Paso 2: Configurar Entorno
1. Crear archivo `.env.n8n` con credenciales
2. Probar conexión: `python n8n_manager.py list`

### Paso 3: Explorar
```bash
# Ver todos los workflows
python n8n_manager.py list

# Auditar flujo principal
python n8n_manager.py audit <id_agente_luz>
```

### Paso 4: Modificar (con precaución)
1. Exportar workflow a JSON
2. Modificar archivo JSON
3. Actualizar: `python n8n_manager.py update <id> archivo.json`

---

## 🔗 Recursos Externos

- **n8n**: https://docs.n8n.io
- **Supabase**: https://supabase.com/docs
- **YCloud**: https://ycloud.com/docs
- **DeepSeek**: https://platform.deepseek.com/docs

---

## ⚡ Conclusiones

### ✅ Lo que funciona bien
- Agente Luz responde correctamente a clientes
- Sincronización de datos funciona automáticamente
- Campañas masivas controlan duplicados
- Auditorías detectan problemas

### ⚠️ Áreas de mejora
- Documentar más cada cambio
- Agregar más tests automáticos
- Mejorar logs de errores
- Considerar backup de workflows en Git

### 🎯 Recomendaciones
1. Revisar el manual completo regularmente
2. Documentar cualquier cambio en workflows
3. Probar cambios en ambiente de desarrollo
4. Mantener `.env.n8n` actualizado con credenciales
5. Revisar logs de ejecución semanalmente

---

**Fecha de Revisión**: 8 de Febrero de 2026
**Versión**: 2.0
**Revisado por**: OpenCode
