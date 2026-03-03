# 🚀 Referencia Rápida - Flujos n8n

## 📦 Flujos Críticos (Prioridad Alta)

### 1. 🤖 Agente Luz v6.5
**Estado:** ✅ Activo
**Categoría:** Atención al Cliente
**Trigger:** Webhook YCloud
**Importancia:** ⭐⭐⭐⭐⭐ (CRÍTICO)

**¿Qué hace?**
- Atiende clientes por WhatsApp 24/7
- Busca productos en Supabase
- Gestiona carritos de compras
- Escala a humanos cuando es necesario

**Ruta del archivo:**
`tus-aguacates/n8n-workflows/🥑 Agente Luz v6.5 - Con Herramientas Admin Copiloto (1).json`

**Si falla:**
❌ Los clientes no recibirán respuesta por WhatsApp
❌ No se podrán gestionar pedidos por WhatsApp
❌ La atención al cliente se detiene

---

### 2. 🔄 Sync Productos
**Estado:** ✅ Activo
**Categoría:** Sincronización
**Trigger:** Cada 1 hora
**Importancia:** ⭐⭐⭐⭐ (Alta)

**¿Qué hace?**
- Sincroniza catálogo de productos de Supabase a PostgreSQL
- Actualiza precios, stock y descripciones
- Mantiene datos consistentes entre sistemas

**Ruta del archivo:**
`tus-aguacates/n8n-workflows/workflow-sync-productos.json`

**Si falla:**
⚠️ El Agente Luz tendrá datos desactualizados
⚠️ Los precios podrían ser incorrectos
⚠️ El stock podría no estar actualizado

---

### 3. 🔔 Recordatorio Carritos
**Estado:** ✅ Activo
**Categoría:** Recuperación de Ventas
**Trigger:** Cada 4 horas (9am, 1pm, 5pm, 9pm)
**Importancia:** ⭐⭐⭐⭐ (Alta)

**¿Qué hace?**
- Busca carritos abandonados (>2 horas)
- Envía recordatorios automáticos por WhatsApp
- Recupera ventas perdidas

**Ruta del archivo:**
`tus-aguacates/n8n-workflows/workflow-recordatorio-carritos.json`

**Si falla:**
⚠️ Se pierden oportunidades de venta
⚠️ No se recuperan carritos abandonados

---

## 📊 Flujos de Monitorización (Prioridad Media)

### 4. 🔍 Auditoría de Pedidos
**Estado:** ✅ Activo
**Categoría:** Auditoría
**Trigger:** Webhook (manual)
**Importancia:** ⭐⭐⭐ (Media)

**¿Qué hace?**
- Detecta inconsistencias en pedidos
- Identifica productos eliminados
- Encuentra precios desactualizados

**Ruta del archivo:**
`tus-aguacates/n8n-workflows/workflow-auditoria-pedidos.json`

**Cuándo ejecutar:**
- Semanalmente o mensualmente
- Cuando se sospechan datos incorrectos

---

### 5. 📈 Auditoría Diaria de Integridad
**Estado:** ✅ Activo
**Categoría:** Monitorización
**Trigger:** Diario
**Importancia:** ⭐⭐⭐ (Media)

**¿Qué hace?**
- Verifica integridad de datos
- Genera reportes diarios
- Alerta sobre problemas

**Ruta del archivo:**
`tus-aguacates/n8n-workflows/workflow-audit-integrity-daily.json`

---

## 📢 Flujos de Marketing (Prioridad Baja)

### 6. 🎉 Campaña 500 Clientes
**Estado:** ✅ Activo
**Categoría:** Marketing
**Trigger:** Manual
**Importancia:** ⭐⭐ (Baja)

**¿Qué hace?**
- Envía campañas masivas a 500 mejores clientes
- Promueve lanzamientos y ofertas

**Ruta del archivo:**
`tus-aguacates/n8n-workflows/campana-500-clientes-invitatienda.json`

**Cuándo ejecutar:**
- Campañas específicas
- Lanzamientos de nuevos productos
- Ofertas especiales

---

## 🔧 Credenciales Requeridas

### Credenciales Obligatorias para Agente Luz:

| Credencial | Nombre en n8n | Tipo | Donde obtener |
|------------|---------------|------|---------------|
| YCloud API | `YCloudApi` | HTTP Header Auth | YCloud Dashboard |
| Supabase API | `Supabase account 2` | Supabase | Supabase Settings → API |
| PostgreSQL | `Mi PostgreSQL Docker` | PostgreSQL | Tu servidor PostgreSQL local |
| DeepSeek API | `DeepSeek account 2` | HTTP Request | DeepSeek Dashboard |

---

## 🚨 Procedimiento de Emergencia

### Si el Agente Luz no responde:

1. **Verificar flujo activo en n8n:**
   - Ve a n8n → Workflows
   - Busca "🥑 Agente Luz v6.5"
   - Verifica que esté ACTIVO

2. **Verificar webhook en YCloud:**
   - Ve a YCloud Dashboard → Webhooks
   - Verifica que el webhook esté activo
   - Verifica que la URL sea correcta

3. **Revisar logs de ejecución:**
   - En n8n → Workflows → Agente Luz
   - Revisa las ejecuciones recientes
   - Busca errores en rojo

4. **Verificar credenciales:**
   - YCloud API key válida
   - Supabase API key válida
   - PostgreSQL conectado

---

## 📞 Contacto de Soporte

**Problema técnico con flujos:**
- Revisar logs en n8n
- Consultar `MANUAL_FLUJOS_N8N.md`
- Verificar guías de instalación en la carpeta

**Problema con YCloud:**
- Verificar API key en YCloud Dashboard
- Revisar documentación de YCloud

**Problema con Supabase:**
- Verificar API key en Supabase Settings
- Ejecutar funciones SQL en SQL Editor

---

## 📋 Checklist Diario

- [ ] Verificar que Agente Luz está activo
- [ ] Revisar logs de errores en n8n
- [ ] Verificar que Sync Productos se ejecutó
- [ ] Confirmar que Recordatorio Carritos se envió
- [ ] Revisar Auditoría Diaria de Integridad

---

## 📋 Checklist Semanal

- [ ] Ejecutar Auditoría de Pedidos
- [ ] Revisar reportes de integridad
- [ ] Verificar sincronización de datos
- [ ] Revisar métricas de Agente Luz

---

**Última actualización:** Febrero 2026
**Versión:** 1.0
