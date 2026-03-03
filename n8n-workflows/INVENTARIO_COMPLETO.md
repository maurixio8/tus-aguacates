# 📁 Inventario Completo de la Carpeta n8n-workflows

> **Última actualización:** 8 de febrero de 2026  
> **Propósito:** Explicar qué contiene cada archivo y carpeta en n8n-workflows

---

## 📋 Resumen por Categorías

| Categoría | Cantidad | Descripción |
|-----------|----------|-------------|
| **Workflows de Agente Luz** | 10+ | Versiones del agente de WhatsApp (IA) |
| **Sincronización** | 8+ | Flujos para sincronizar datos |
| **Pedidos** | 5+ | Procesamiento de pedidos |
| **Marketing** | 4+ | Campañas masivas |
| **Auditoría** | 4+ | Verificación de datos |
| **Guías** | 15+ | Documentación de configuración |
| **Scripts** | 30+ | Scripts JS/SQL de soporte |

---

## 🤖 1. Workflows del Agente Luz (Atención al Cliente)

**Propósito:** Sistema de IA que atiende clientes por WhatsApp.

| Archivo | Estado | Descripción |
|---------|--------|-------------|
| `🥑 Agente Luz v6.5 - Con Herramientas Admin Copiloto (1).json` | ✅ Activo | Versión actual - Incluye herramientas admin |
| `Agente Luz v6.5 - Con Herramientas Admin Copiloto.json` | 🔄 Backup | Backup de v6.5 |
| `agente-luz-v6.4-variantes-completas.json` | 🔄 Reemplazado | Versión con soporte de variantes |
| `agente-luz-v6.3-busqueda-mejorada.json` | 🔄 Reemplazado | Mejoras en búsqueda |
| `agente-luz-v6.2-corregido.json` | 🔄 Reemplazado | Correcciones |
| `agente-luz-v6-Mejorado.json` | 🔄 Reemplazado | Versión 6 mejorada |
| `Agente-Luz-v5-Hibrido-Copiloto.json` | 🔄 Reemplazado | Versión híbrida v5 |
| `Agente-Luz-v5-Con-Copiloto-TEMP.json` | 🔄 Reemplazado | Versión temporal |
| `agente-luz-v4-hibrido.json` | 🔄 Reemplazado | Versión híbrida v4 |
| `agente-luz-v3-ycloud.json` | 🔄 Reemplazado | Primera versión con YCloud |
| `agente-whatsapp-mvp.json` | 🔄 Reemplazado | Versión mínima viable |

**Versiones a ignorar:** Solo usa la versión v6.5 activa. Las otras son históricas.

---

## 🔄 2. Flujos de Sincronización

**Propósito:** Mantener datos sincronizados entre sistemas.

### Sincronización de Productos

| Archivo | Estado | Descripción |
|---------|--------|-------------|
| `workflow-sync-productos.json` | ✅ Activo | Productos: Supabase → Local (cada hora) |
| `workflow-sync-productos-v2.json` | ✅ Activo | Versión mejorada con manejo de errores |
| `sync-productos-listo.json` | ✅ Activo | Versión lista para producción |
| `sync-productos-variantes-completo.json` | ✅ Activo | Incluye variantes de productos |
| `workflow-sync-productos.json` | ✅ Activo | Sincronización básica |

### Sincronización de Clientes

| Archivo | Estado | Descripción |
|---------|--------|-------------|
| `workflow-sync-clientes-supabase-to-local.json` | ✅ Activo | Clientes: Supabase → Local |
| `workflow-sync-clientes-local-to-supabase.json` | ✅ Activo | Clientes: Local → Supabase |
| `workflow-sync-clientes-supabase-to-local-PART-2.json` | ✅ Activo | Parte 2 de sincronización |
| `workflow-sync-clientes-bucle-robusto.json` | ✅ Activo | Versión con reintentos |
| `workflow-sync-FIXED.json` | ✅ Activo | Versión corregida |

### Otras Sincronizaciones

| Archivo | Estado | Descripción |
|---------|--------|-------------|
| `workflow-audit-integrity-daily.json` | ✅ Activo | Auditoría diaria de datos |
| `migracion-clientes-columnas-faltantes.sql` | 📄 Script | Script SQL para migración |
| `migracion-clientes-supabase-id.sql` | 📄 Script | Script para agregar ID de Supabase |

---

## 🛒 3. Flujos de Pedidos

**Propósito:** Procesar pedidos de WhatsApp y Web.

| Archivo | Estado | Descripción |
|---------|--------|-------------|
| `automation-pedidos-web.json` | ✅ Activo | Procesa pedidos de la tienda web |
| `workflow-confirmar-prepedido.json` | ✅ Activo | Confirma pre-pedidos de WhatsApp |
| `workflow-procesar-buffer.json` | ✅ Activo | Agrupa mensajes rápidos |
| `workflow-recordatorio-carritos.json` | ✅ Activo | Recordatorios de carritos abandonados |
| `workflow-tracking-respuestas.json` | ✅ Activo | Rastrea respuestas a campañas |

---

## 📢 4. Campañas de Marketing

**Propósito:** Enviar mensajes masivos a clientes.

| Archivo | Estado | Descripción |
|---------|--------|-------------|
| `campana-500-clientes-invitatienda.json` | ✅ Activo | Lanzamiento de tienda (500 clientes) |
| `campana-navidad-151-clientes.json` | ✅ Activo | Campaña navideña |
| `campana-masiva-anti-duplicados.json` | ✅ Activo | Campaña masiva sin duplicados |
| `test-carousel-navidad.json` | 🧪 Test | Prueba de carrousel navideño |

---

## 📊 5. Auditoría y Monitorización

**Propósito:** Verificar integridad de datos y generar reportes.

| Archivo | Estado | Descripción |
|---------|--------|-------------|
| `workflow-auditoria-pedidos.json` | ✅ Activo | Auditoría de pedidos históricos |
| `workflow-audit-integrity-daily.json` | ✅ Activo | Auditoría diaria de datos |
| `monitor-escalados-workflow.json` | ✅ Activo | Monitoriza casos escalados |
| `workflow-tracking-respuestas.json` | ✅ Activo | Tracking de campañas |

---

## 🔧 6. Helpers y Utilidades

**Propósito:** Flujos de soporte y mantenimiento.

| Archivo | Estado | Descripción |
|---------|--------|-------------|
| `mcp-helper-workflow.json` | ✅ Activo | Helper para integración MCP |
| `mcp-helper-v2.json` | ✅ Activo | Helper MCP v2 |
| `workflow-auto-etiquetar-ycloud.json` | ✅ Activo | Etiquetado automático en YCloud |
| `monitor-escalados-workflow.json` | ✅ Activo | Monitoriza escalados |

---

## 🏷️ 7. Copiloto de Operaciones

**Propósito:** Asistente administrativo para gestión de datos.

| Archivo | Estado | Descripción |
|---------|--------|-------------|
| `Copiloto de Operaciones (13).json` | 🔄 Backup | Versión 13 del copiloto |
| `Copiloto-Operaciones-v2-YCloud.json` | 🔄 Backup | Versión v2 con YCloud |

---

## 📄 8. Guías de Instalación y Configuración

**Propósito:** Documentación para configurar el sistema.

### Guías Principales

| Archivo | Descripción |
|---------|-------------|
| `GUIA-CONECTAR-N8N-SUPABASE.md` | Conectar n8n con Supabase |
| `GUIA-SETUP-N8N-ANTIGRAVITY.md` | Configuración inicial de n8n |
| `GUIA-INTEGRAR-COPILOTO.md` | Integrar copiloto de operaciones |
| `GUIA-MCP-HELPER.md` | Integración con MCP |
| `GUIA-SYNC-CLIENTES.md` | Sincronización de clientes |
| `GUIA-SYNC-VARIANTES.md` | Sincronización de variantes |
| `GUIA-SYNC-WORKFLOW.md` | Sincronización de workflows |

### Guías Específicas

| Archivo | Descripción |
|---------|-------------|
| `GUIA-INTEGRACION-BUFFER.md` | Integración del buffer de mensajes |
| `GUIA-ENVIO-IMAGENES.md` | Envío de imágenes por WhatsApp |
| `GUIA-MIGRACION-IMAGENES.md` | Migración de imágenes a Cloudinary |

### Instrucciones

| Archivo | Descripción |
|---------|-------------|
| `INSTRUCCION-VARIANTES-OBLIGATORIAS.md` | Configurar variantes obligatorias |
| `INSTRUCCIONES-AGREGAR-HERRAMIENTAS.md` | Agregar herramientas al agente |
| `INSTRUCCIONES-DATOS-ENTREGA.md` | Datos de entrega |
| `INSTRUCCIONES-ENVIO-IMAGENES.md` | Instrucciones para enviar imágenes |

---

## 🗄️ 9. Scripts SQL de Base de Datos

**Propósito:** Scripts para crear y modificar tablas en PostgreSQL.

### Scripts de Productos

| Archivo | Descripción |
|---------|-------------|
| `crear-tabla-productos-local.sql` | Crea tabla de productos local |
| `insertar-productos.sql` | Inserta productos en BD |
| `insertar-productos-nuevo.sql` | Script actualizado de productos |

### Scripts de Clientes

| Archivo | Descripción |
|---------|-------------|
| `limpiar-normalizar-clientes.sql` | Limpia y normaliza clientes |
| `enriquecer-clientes.sql` | Enriquece datos de clientes |
| `analisis-datos-clientes.sql` | Analiza datos de clientes |
| `diagnostico-calidad-clientes.sql` | Diagnóstico de calidad de datos |
| `limpiar-telefonos-invalidos.sql` | Limpia teléfonos inválidos |
| `clean-phone-numbers.sql` | Limpia formatos de teléfono |

### Scripts de Sincronización

| Archivo | Descripción |
|---------|-------------|
| `actualizar-numeric-id-local.sql` | Actualiza IDs numéricos locales |
| `migracion-clientes-columnas-faltantes.sql` | Migra columnas faltantes |
| `migracion-clientes-supabase-id.sql` | Migra IDs de Supabase |
| `agregar-columna-notificado.sql` | Agrega columna de notificaciones |
| `agregar-estado-pedido-confirmado.sql` | Agrega estado de pedido confirmado |
| `migracion-etiquetado-ycloud.sql` | Migra etiquetado de YCloud |
| `migracion-estados-buffer.sql` | Migra estados del buffer |

### Scripts de Utilidades

| Archivo | Descripción |
|---------|-------------|
| `setup-database.sql` | Configuración inicial de BD |
| `fix-missing-columns.sql` | Corrige columnas faltantes |
| `fix-estados-existentes.sql` | Corrige estados existentes |
| `limpiar-memoria-chat.sql` | Limpia memoria de chat |
| `verificacion-sync-clientes.sql` | Verifica sincronización de clientes |
| `diagnostico-clientes.sql` | Diagnóstico de clientes |
| `verificar_estructura_orders.sql` | Verifica estructura de pedidos |

### Scripts de Búsqueda

| Archivo | Descripción |
|---------|-------------|
| `supabase-search-function.sql` | Función de búsqueda en Supabase |
| `query-busqueda-corregida.sql` | Query de búsqueda corregida |
| `query-busqueda-flexible.sql` | Query de búsqueda flexible |
| `query-busqueda-supabase.sql` | Query de búsqueda Supabase |
| `tool-buscar-productos.sql` | Herramienta SQL para buscar productos |
| `tool-buscar-productos-supabase.sql` | Herramienta para buscar en Supabase |

### Scripts de Herramientas del Agente

| Archivo | Descripción |
|---------|-------------|
| `tool-consultar-pedido.sql` | Consultar pedidos |
| `tool-escalar-servicio.sql` | Escalar a servicio al cliente |
| `tool-obtener-variantes.json` | Obtener variantes de productos |

---

## 🔨 10. Scripts JavaScript de Soporte

**Propósito:** Scripts para automatizar tareas en n8n.

### Scripts de Modificación de Workflows

| Archivo | Descripción |
|---------|-------------|
| `add-admin-tools-to-agente-luz.js` | Agrega herramientas admin al agente |
| `add-copiloto-tools.js` | Agrega herramientas de copiloto |
| `add-tool-etiqueta.js` | Agrega herramienta de etiquetado |
| `add-tool-variantes.js` | Agrega herramienta de variantes |

### Scripts de Corrección

| Archivo | Descripción |
|---------|-------------|
| `fix-credentials-etiqueta.js` | Corrige credenciales de etiquetado |
| `fix-duplicate-products.js` | Corrige productos duplicados |
| `fix-emojis-tienda.js` | Corrige emojis en la tienda |
| `fix-estados-herramientas.js` | Corrige estados de herramientas |
| `fix-json-distinct-error.js` | Corrige error JSON distinct |
| `fix-link-preview-emojis.js` | Corrige emojis en previews |
| `fix-luz-humana.js` | Corrige comportamiento de Luz |
| `fix-online-orders-script.js` | Corrige pedidos online |
| `fix-productos-peso-nombre.js` | Corrige peso y nombre de productos |
| `fix-productos-variantes.js` | Corrige variantes de productos |
| `fix-saludo-calido.js` | Corrige saludo cálido |
| `fix-saludo-script.js` | Corrige script de saludo |
| `fix-saludo-una-vez.js` | Corrige saludo único |
| `fix-system-message-emojis.js` | Corrige emojis en system message |
| `fix-systemessage-script.js` | Corrige script de system message |
| `fix-tool-borrar-memoria.js` | Corrige herramienta de borrar memoria |
| `fix-tool-carrito.js` | Corrige herramienta de carrito |
| `fix-tool-confirmar-simple.js` | Corrige herramienta de confirmación |
| `fix-tool-estado-pedido.js` | Corrige herramienta de estado de pedido |
| `fix-tool-script.js` | Corrige herramienta script |
| `fix-toolcode-name.js` | Corrige nombre de toolcode |
| `fix-toolcode-output.js` | Corrige output de toolcode |
| `fix-tienda-al-principio.js` | Corrige tienda al principio |
| `fix-web-orders-flow.js` | Corrige flujo de pedidos web |
| `fix-catalogo-link.js` | Corrige enlace de catálogo |

### Scripts de Optimización

| Archivo | Descripción |
|---------|-------------|
| `optimize-system-message-final.js` | Optimiza mensaje del sistema final |

### Scripts de Procesamiento

| Archivo | Descripción |
|---------|-------------|
| `preprocesamiento-v10-director-copiloto.js` | Preprocesamiento v10 |
| `preprocesamiento-v11-toggle-pruebas.js` | Preprocesamiento v11 |
| `preprocesamiento-v12-prefijo.js` | Preprocesamiento v12 |
| `preprocesamiento-v4.1-robusto.js` | Preprocesamiento v4.1 |
| `preprocesamiento-v4.2-conversacional.js` | Preprocesamiento v4.2 |
| `preprocesamiento-v5-integrado.js` | Preprocesamiento v5 |
| `preprocesamiento-v6-con-imagenes.js` | Preprocesamiento v6 |
| `preprocesamiento-v7-con-botones.js` | Preprocesamiento v7 |
| `codigo-preprocesamiento-v14.js` | Código de preprocesamiento v14 |
| `codigo-preprocesamiento-v15.js` | Código de preprocesamiento v15 |

### Scripts de Formateo de Respuestas

| Archivo | Descripción |
|---------|-------------|
| `codigo-formatear-recordatorio-v2.js` | Formatea recordatorio v2 |
| `codigo-preparar-respuesta-v9.js` | Prepara respuesta v9 |
| `codigo-preparar-respuesta-v10.js` | Prepara respuesta v10 |
| `codigo-preparar-respuesta-v11.js` | Prepara respuesta v11 |
| `codigo-preparar-respuesta-v12.js` | Prepara respuesta v12 |
| `codigo-preparar-respuesta-v13.js` | Prepara respuesta v13 |
| `preparar-respuesta-v2-con-imagenes.js` | Prepara respuesta v2 |
| `preparar-respuesta-v3-con-botones.js` | Prepara respuesta v3 |
| `preparar-respuesta-v5-sin-botones.js` | Prepara respuesta v5 |

### Scripts de Buffer

| Archivo | Descripción |
|---------|-------------|
| `migracion-estados-buffer.sql` | Migra estados de buffer |
| `codigo-insertar-buffer.js` | Inserta en buffer |
| `codigo-marcar-buffer-procesado.js` | Marca buffer como procesado |
| `codigo-procesar-buffer.js` | Procesa buffer |

### Scripts de Herramientas SQL

| Archivo | Descripción |
|---------|-------------|
| `sql-tabla-recordatorios.sql` | Crea tabla de recordatorios |
| `sql-tool-agregar-carrito-con-variantes.sql` | Agrega carrito con variantes |

### Scripts de Utilidades

| Archivo | Descripción |
|---------|-------------|
| `generate-products-sql.js` | Genera SQL de productos |
| `sync-productos-to-postgres.js` | Sincroniza productos a PostgreSQL |
| `nodo-formateador-respuesta.js` | Formatea respuestas |
| `nodo-pulidor-respuestas.json` | Pule respuestas |
| `nodos-copiloto-para-agregar.json` | Nodos de copiloto para agregar |
| `nodo-enviar-imagen-ycloud.js` | Envía imagen por YCloud |
| `procesar-csv-clientes.js` | Procesa CSV de clientes |
| `codigo-selector-prompt.js` | Selector de prompts |
| `implementar_solucion_ids.js` | Implementa solución de IDs |
| `legacy_id_helper.js` | Helper de IDs legacy |
| `verify-fix-connections.js` | Verifica conexiones |
| `include-variants-in-search.js` | Incluye variantes en búsqueda |
| `create-v6.5-admin-copiloto.js` | Crea v6.5 admin copiloto |
| `mejoras-agente-luz-v6.md` | Mejoras del agente v6 |

---

## 📋 11. Archivos de Configuración

| Archivo | Descripción |
|---------|-------------|
| `env.n8n.example` | Plantilla de variables de entorno |
| `antigravity_config.json` | Configuración de Antigravity |
| `herramientas-admin-copiloto.json` | Herramientas del copiloto admin |

---

## 📝 12. Documentación Principal

| Archivo | Descripción |
|---------|-------------|
| `README.md` | Documentación principal |
| `MANUAL-FLUJOS-COMPLETO.md` | Manual completo de flujos |
| `MANUAL-FLUJOS-N8N.md` | Manual de flujos n8n |
| `MANUAL_FLUJOS_N8N.md` | Manual de flujos (otra versión) |
| `CAPACIDADES-N8N.md` | Capacidades de n8n |
| `MANUAL_PARA_NUEVOS_TEAM_MEMBERS.md` | Manual para nuevos miembros |
| `RESUMEN-SESION-2025-12-20.md` | Resumen de sesión |
| `RESUMEN-SESION-2025-12-21.md` | Resumen de sesión |

---

## 📚 13. Archivos de Prompts del Agente

| Archivo | Descripción |
|---------|-------------|
| `system-message-agente-v6.md` | Mensaje del sistema v6 |
| `system-message-agente-v7.md` | Mensaje del sistema v7 |
| `system-message-agente-v8.md` | Mensaje del sistema v8 |
| `system-message-agente-v9.md` | Mensaje del sistema v9 |
| `system-message-agente-v10.md` | Mensaje del sistema v10 |
| `system-message-completo-final.js` | Mensaje completo final |
| `system-message-copiloto-v2.md` | Mensaje del copiloto v2 |
| `prompt-agente-luz-v7.md` | Prompt del agente v7 |

### Carpeta `prompts/`

Contiene prompts adicionales para el agente.

---

## 🗂️ 14. Archivos de Datos

| Archivo | Descripción |
|---------|-------------|
| `clientes_final (2).csv` | CSV de clientes finales |
| `template_marketing_20251222131913_2025-12-23_GMT+08.xlsx` | Plantilla de marketing |

---

## ❓ Preguntas Frecuentes

### ¿Qué versión del Agente Luz debo usar?

Usa siempre: `🥑 Agente Luz v6.5 - Con Herramientas Admin Copiloto (1).json`

Las otras versiones son históricas y solo se mantienen para referencia.

### ¿Cuántos workflows están activos?

Aproximadamente **10-12 workflows** están activos actualmente. El resto son versiones anteriores o scripts de soporte.

### ¿Qué scripts JS debo usar?

La mayoría de los scripts JS en esta carpeta son **scripts de soporte** que se usaron una sola vez para modificar workflows. No necesitas ejecutarlos a menos que estés solucionando un problema específico.

### ¿Qué archivos puedo ignorar?

Puedes ignorar:
- Versiones antiguas de workflows (v3, v4, v5, v6.2, v6.3, v6.4)
- Scripts JS de corrección (fix-*.js)
- Scripts SQL de migración (migracion-*.sql)
- Resúmenes de sesión (RESUMEN-SESION-*.md)

---

## 📞 Soporte

Si tienes dudas sobre algún archivo específico:

1. Consulta los manuales principales:
   - `MANUAL_PARA_NUEVOS_TEAM_MEMBERS.md` (para nuevos miembros)
   - `MANUAL-FLUJOS-N8N.md` (detallado)

2. Revisa las guías específicas:
   - `GUIA-*.md` (guías de configuración)

3. Contacta al equipo técnico si necesitas ayuda

---

**Fin del Inventario**
