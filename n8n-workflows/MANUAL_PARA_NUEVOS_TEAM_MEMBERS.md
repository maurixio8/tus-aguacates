# 🥑 Manual de Flujos n8n - Guía para Nuevos Miembros del Equipo

> **Última actualización:** 8 de febrero de 2026  
> **Para quién:** Nuevos miembros del equipo de desarrollo  
> **Versión:** 2.0 (Simplificado)

---

## 📋 Índice

1. [¿Qué es n8n y por qué lo usamos?](#qué-es-n8n-y-por-qué-lo-usamos)
2. [Arquitectura del Sistema](#arquitectura-del-sistema)
3. [Los Flujos Principales (Los 10 que realmente importan)](#los-flujos-principales)
4. [Cómo Trabajan los Flujos Juntos](#cómo-trabajan-los-flujos-juntos)
5. [Solución de Problemas Comunes](#solución-de-problemas-comunes)
6. [Glosario de Términos](#glosario-de-términos)

---

## 🎯 ¿Qué es n8n y por qué lo usamos?

### ¿Qué es n8n?

**n8n** es una herramienta de automatización que nos permite conectar diferentes sistemas entre sí sin escribir código. Es como un "pegamento" que une todas las partes de nuestra tienda online.

### ¿Por qué lo usamos?

En **Tus Aguacates**, usamos n8n para:

1. **Automatizar atención al cliente** - Nuestro agente "Luz" responde automáticamente por WhatsApp
2. **Sincronizar datos** - Mantiene productos y clientes actualizados entre sistemas
3. **Procesar pedidos** - Convierte pedidos de WhatsApp en pedidos reales de la tienda
4. **Recuperar ventas** - Envía recordatorios de carritos abandonados
5. **Auditar datos** - Verifica que todo esté correcto

---

## 🏗️ Arquitectura del Sistema

### El flujo general de datos

```
┌─────────────────────────────────────────────────────────────┐
│                    NUESTROS SISTEMAS                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  📱 WHATSAPP                                                │
│     (YCloud - Proveedor)                                   │
│          ↓                                                  │
│  ⚙️ N8N (n8ntusaguacates.space)                             │
│     ├─ 🤖 Agente Luz (atención automática)                 │
│     ├─ 🔄 Sincronización (productos/clientes)              │
│     ├─ 📦 Pedidos (procesamiento)                          │
│     └─ 📊 Auditoría (verificación de datos)                │
│          ↓                                                  │
│  💾 BASES DE DATOS                                          │
│     ├─ Supabase (tienda online)                            │
│     └─ PostgreSQL (sistema de WhatsApp)                    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Conexiones principales

| Sistema | ¿Qué hace? | ¿Cómo se conecta? |
|---------|-------------|-------------------|
| **WhatsApp** | Clientes escriben por WhatsApp | YCloud API → Webhook n8n |
| **Agente Luz** | Responde automáticamente | n8n + IA (DeepSeek) |
| **Tienda Online** | Productos y pedidos | Supabase API |
| **Base de Datos Local** | Historial de WhatsApp | PostgreSQL |

---

## 🔥 Los 10 Flujos Principales

> **Nota:** Solo estos 10 flujos son los que realmente necesitas conocer como nuevo miembro del equipo.

---

### 1. 🤖 Agente Luz v6.5 - Atención al Cliente

**Archivo:** `🥑 Agente Luz v6.5 - Con Herramientas Admin Copiloto (1).json`

**¿Qué hace?**
Es el corazón de nuestro sistema de atención al cliente. Es una IA que responde automáticamente a los clientes por WhatsApp.

**¿Cómo funciona?**
1. Un cliente envía un mensaje por WhatsApp
2. YCloud envía ese mensaje a n8n (webhook)
3. n8n procesa el mensaje y lo envía a la IA (DeepSeek)
4. La IA decide qué responder y usa herramientas para buscar información
5. La respuesta se envía de vuelta al cliente por WhatsApp

**¿Qué puede hacer el agente?**
- ✅ Buscar productos en el catálogo
- ✅ Agregar productos al carrito
- ✅ Calcular totales
- ✅ Consultar estado de pedidos
- ✅ Escalar a un humano cuando no sabe responder

**¿Cuándo se ejecuta?**
- Cada vez que llega un mensaje de WhatsApp

**Credenciales necesarias:**
- YCloud API (WhatsApp)
- DeepSeek IA
- PostgreSQL (base de datos local)
- Supabase (catálogo de productos)

---

### 2. ⏰ Sincronización de Productos (Cada Hora)

**Archivo:** `workflow-sync-productos.json`

**¿Qué hace?**
Actualiza automáticamente el catálogo de productos desde la tienda online hacia la base de datos local de WhatsApp.

**¿Por qué es importante?**
El agente Luz necesita saber qué productos existen para poder responder a los clientes. Si añadimos un nuevo producto en la tienda, este flujo lo actualiza automáticamente.

**¿Cómo funciona?**
1. Cada hora, se ejecuta automáticamente
2. Trae todos los productos de Supabase (tienda online)
3. Transforma los datos al formato local
4. Borra los productos viejos en la base local
5. Inserta los productos nuevos

**¿Cuándo se ejecuta?**
- Cada hora (automático)

**Datos que sincroniza:**
- Nombre del producto
- Precio (normal y con descuento)
- Imágenes
- Stock
- Categoría
- Estado (activo/inactivo)

---

### 3. 🔄 Sincronización de Clientes (Bidireccional)

**Archivos:**
- `workflow-sync-clientes-supabase-to-local.json` (Supabase → Local)
- `workflow-sync-clientes-local-to-supabase.json` (Local → Supabase)

**¿Qué hacen?**
Mantienen sincronizada la lista de clientes entre la tienda online y el sistema de WhatsApp.

**¿Por qué es importante?**
Cuando un cliente se registra en la tienda online, debe aparecer en el sistema de WhatsApp. Y viceversa.

**¿Cómo funciona?**

**Supabase → Local:**
1. Trae clientes de la tienda online
2. Normaliza números de teléfono (formato +57...)
3. Si ya existe el cliente, lo actualiza
4. Si no existe, lo crea

**Local → Supabase:**
1. Busca clientes nuevos de WhatsApp sin ID de Supabase
2. Los crea en la tienda online
3. Guarda el ID de Supabase en el sistema local

**¿Cuándo se ejecutan?**
- Cada hora (automático)

---

### 4. 🛒 Confirmación de Pre-pedidos

**Archivo:** `workflow-confirmar-prepedido.json`

**¿Qué hace?**
Convierte un "pre-pedido" (carrito de WhatsApp) en un pedido real de la tienda online.

**¿Por qué es importante?**
Los clientes pueden armar su carrito por WhatsApp, pero ese carrito no es un pedido real hasta que se confirma. Este flujo hace esa conversión.

**¿Cómo funciona?**
1. El admin confirma el pedido del cliente
2. El flujo busca el pre-pedido en la base local
3. Verifica los precios contra el catálogo actual
4. Si hay diferencias de precio, las corrige automáticamente
5. Crea el pedido en Supabase (tienda online)
6. Limpia el carrito local
7. Etiqueta al cliente en WhatsApp como "CONFIRMADO"
8. Notifica al admin que el pedido fue creado

**¿Cuándo se ejecuta?**
- Manual (cuando el admin confirma un pedido)

---

### 5. 📢 Recordatorios de Carritos Abandonados

**Archivo:** `workflow-recordatorio-carritos.json`

**¿Qué hace?**
Envía recordatorios automáticos a clientes que dejaron productos en el carrito sin completar el pedido.

**¿Por qué es importante?**
Muchos clientes olvidan completar sus compras. Un recordatorio puede recuperar esa venta.

**¿Cómo funciona?**
1. Se ejecuta cada 4 horas (9 AM, 1 PM, 5 PM, 9 PM)
2. Busca clientes con carritos abandonados (entre 2 y 23 horas de inactividad)
3. Verifica que no se haya enviado un recordatorio hoy
4. Envía un mensaje personalizado con botones
5. Registra que se envió el recordatorio

**¿Cuándo se ejecuta?**
- Cada 4 horas (automático)

---

### 6. 📊 Auditoría Diaria de Integridad

**Archivo:** `workflow-audit-integrity-daily.json`

**¿Qué hace?**
Verifica que todos los datos estén sincronizados correctamente cada mañana.

**¿Por qué es importante?**
Nos ayuda a detectar problemas de datos antes de que afecten a los clientes.

**¿Cómo funciona?**
1. Se ejecuta cada día a las 6 AM
2. Cuenta registros en ambas bases de datos
3. Compara los resultados
4. Si hay diferencias, genera una alerta
5. Envía un reporte al admin

**¿Qué verifica?**
- Número de clientes
- Número de productos
- Número de variantes

**¿Cuándo se ejecuta?**
- Cada día a las 6 AM (automático)

---

### 7. 🔍 Auditoría de Pedidos Históricos

**Archivo:** `workflow-auditoria-pedidos.json`

**¿Qué hace?**
Analiza todos los pedidos históricos y detecta discrepancias de precios.

**¿Por qué es importante?**
A veces los precios de los productos cambian, pero los pedidos antiguos mantienen los precios viejos. Esta auditoría detecta esos problemas.

**¿Cómo funciona?**
1. Obtiene todos los pedidos de Supabase
2. Obtiene el catálogo actual de productos
3. Compara cada item de cada pedido con el precio actual
4. Calcula las diferencias
5. Genera un reporte detallado
6. Envía el reporte por WhatsApp al admin

**¿Cuándo se ejecuta?**
- Manual (cuando el admin lo solicita)

---

### 8. 📦 Procesador de Buffer (Agrupador de Mensajes)

**Archivo:** `workflow-procesar-buffer.json`

**¿Qué hace?**
Agrupa múltiples mensajes rápidos del mismo cliente en uno solo.

**¿Por qué es importante?**
Si un cliente envía varios mensajes en pocos segundos, no queremos que el agente responda 10 veces. Este flujo agrupa los mensajes.

**¿Cómo funciona?**
1. Se ejecuta cada 10 segundos
2. Busca mensajes nuevos en una tabla "buffer"
3. Agrupa mensajes del mismo cliente con ≥30 segundos de inactividad
4. Combina los mensajes en uno solo
5. Envía el mensaje combinado al agente
6. Marca los mensajes como procesados

**Ejemplo:**
```
Cliente envía:
10:00:01 - "Hola"
10:00:02 - "quiero"
10:00:03 - "aguacates"

Sin buffer: 3 respuestas separadas
Con buffer: 1 respuesta combinada "Hola quiero aguacates"
```

**¿Cuándo se ejecuta?**
- Cada 10 segundos (automático)

---

### 9. 🏷️ Auto-Etiquetado en WhatsApp

**Archivo:** `workflow-auto-etiquetar-ycloud.json`

**¿Qué hace?**
Etiqueta automáticamente los contactos en WhatsApp según su estado.

**¿Por qué es importante?**
Las etiquetas nos ayudan a segmentar clientes y entender en qué estado están.

**¿Cómo funciona?**
1. Se ejecuta cada 5 minutos
2. Busca clientes sin etiquetar
3. Mapea el estado a una etiqueta:
   - `PEDIDO_CONFIRMADO` → "Pre-pedido WhatsApp"
   - `PEDIDO_ONLINE` → "Pedido Tienda"
   - Otros → "Confirmado"
4. Agrega la etiqueta via YCloud API
5. Marca al cliente como etiquetado

**¿Cuándo se ejecuta?**
- Cada 5 minutos (automático)

---

### 10. 🛠️ Automatización de Pedidos Web

**Archivo:** `automation-pedidos-web.json`

**¿Qué hace?**
Procesa pedidos que llegan de la tienda online y los notifica al equipo.

**¿Por qué es importante?**
Los pedidos de la tienda online llegan a Supabase, pero necesitamos notificar al equipo para despacharlos.

**¿Cómo funciona?**
1. Recibe un pedido desde un webhook
2. Usa IA (GPT-4o-mini) para limpiar los datos:
   - Corrige errores de escritura en direcciones
   - Capitaliza nombres
   - Arregla emojis
3. Detecta posibles fraudes
4. Formatea una notificación
5. Envía la notificación al equipo (configurable: Slack, WhatsApp, Email)

**¿Cuándo se ejecuta?**
- Webhook (cada vez que hay un nuevo pedido web)

---

## 🔄 Cómo Trabajan los Flujos Juntos

### Escenario 1: Un cliente hace un pedido por WhatsApp

```
1. Cliente escribe: "Quiero 2 kg de aguacates Hass"
   ↓
2. [Agente Luz] Recibe el mensaje y entiende la intención
   ↓
3. [Agente Luz] Busca productos en la base de datos
   ↓
4. [Agente Luz] Responde: "Perfecto, 2 kg de Aguacate Hass por $XX. ¿Te lo confirmo?"
   ↓
5. Cliente responde: "Sí, confírmalo"
   ↓
6. [Agente Luz] Agrega al carrito y cambia estado a "EN_PEDIDO"
   ↓
7. Admin confirma el pedido
   ↓
8. [Confirmación Pre-pedido] Convierte el carrito en pedido real de tienda
   ↓
9. [Auto-Etiquetado] Etiqueta al cliente como "CONFIRMADO"
   ↓
10. Pedido listo para despacho
```

### Escenario 2: Se añade un nuevo producto a la tienda

```
1. Admin añade producto en Supabase (tienda online)
   ↓
2. [Sync Productos] Se ejecuta automáticamente cada hora
   ↓
3. Producto se copia a PostgreSQL local
   ↓
4. [Agente Luz] Ahora puede encontrar y ofrecer el producto nuevo
```

### Escenario 3: Un cliente abandona el carrito

```
1. Cliente añade productos pero no completa el pedido
   ↓
2. Pasan 4 horas sin actividad
   ↓
3. [Recordatorios] Se ejecuta y detecta el carrito abandonado
   ↓
4. Envía mensaje: "¿Olvidaste algo? Tienes productos en tu carrito"
   ↓
5. Cliente puede completar el pedido o cancelar
```

---

## 🐛 Solución de Problemas Comunes

### Problema 1: El agente no responde

**Síntomas:**
- Cliente envía mensaje y no recibe respuesta
- No hay logs en n8n

**Posibles causas:**
1. Webhook de YCloud no está configurado
2. El flujo está desactivado en n8n
3. Error en credenciales

**Solución:**
1. Verifica que el flujo "Agente Luz v6.5" esté activo en n8n
2. Verifica que el webhook esté configurado en YCloud Dashboard
3. Revisa las credenciales de YCloud, DeepSeek y PostgreSQL

---

### Problema 2: El agente no encuentra productos

**Síntomas:**
- Agente dice "No encontré productos"
- Búsqueda no devuelve resultados

**Posibles causas:**
1. Sincronización de productos falló
2. Los productos no están activos
3. Stock es 0

**Solución:**
1. Ejecuta manualmente el flujo "Sync Productos"
2. Verifica que los productos tengan `is_active = true`
3. Verifica que el stock sea > 0
4. Revisa la tabla `productos_tienda` en PostgreSQL

---

### Problema 3: Un pedido no se confirma

**Síntomas:**
- Admin llama a webhook confirmar-prepedido
- No se crea pedido en Supabase

**Posibles causas:**
1. El cliente no tiene un pre-pedido en el carrito
2. Estado del cliente no es "EN_PEDIDO"
3. Diferencias de precios no corregidas

**Solución:**
1. Verifica que el cliente tenga productos en `pre_pedido`
2. Verifica que el estado sea `EN_PEDIDO`
3. Ejecuta el flujo de confirmación manualmente y revisa logs

---

### Problema 4: Los recordatorios no se envían

**Síntomas:**
- Clientes con carrito abandonado no reciben recordatorios
- Flujo se ejecuta pero no envía mensajes

**Posibles causas:**
1. El flujo está desactivado
2. Los clientes no cumplen las condiciones de tiempo
3. Ya se envió un recordatorio hoy

**Solución:**
1. Activa el flujo "Recordatorios de Carritos Abandonados"
2. Verifica que los clientes tengan entre 2 y 23 horas de inactividad
3. Verifica la tabla `recordatorios_enviados` para ver si ya se envió

---

### Problema 5: Sincronización de productos falla

**Síntomas:**
- Los productos no se actualizan en PostgreSQL local
- Hay menos productos en local que en Supabase

**Posibles causas:**
1. El trigger del schedule no está activo
2. Credenciales de Supabase son incorrectas
3. Error en el flujo

**Solución:**
1. Activa el flujo "Sync Productos"
2. Verifica las credenciales de Supabase
3. Ejecuta el flujo manualmente y revisa logs
4. Verifica que la tabla `productos_tienda` existe en PostgreSQL

---

## 📚 Glosario de Términos

| Término | Definición |
|---------|------------|
| **n8n** | Herramienta de automatización que conecta diferentes sistemas |
| **Webhook** | URL que recibe datos externos y activa un flujo |
| **Workflow** | Flujo de trabajo en n8n (una serie de nodos conectados) |
| **Nodo** | Cada paso dentro de un workflow (ej: obtener datos, enviar mensaje) |
| **YCloud** | Proveedor de WhatsApp que usamos |
| **Supabase** | Base de datos de la tienda online |
| **PostgreSQL** | Base de datos local del sistema de WhatsApp |
| **Pre-pedido** | Carrito de compras aún no confirmado como pedido real |
| **DeepSeek** | Modelo de IA que usa el agente Luz |
| **GPT-4o-mini** | Modelo de IA para limpieza de datos |
| **Buffer** | Tabla temporal donde se almacenan mensajes antes de procesar |
| **UPSERT** | Operación que actualiza si existe o inserta si no existe |
| **E.164** | Formato estándar para números de teléfono (+57...) |

---

## 📞 ¿Necesitas ayuda?

Si tienes problemas con los flujos:

1. **Revisa los logs** en n8n para ver errores específicos
2. **Consulta los manuales** técnicos:
   - `MANUAL-FLUJOS-N8N.md` (detallado)
   - `CAPACIDADES-N8N.md` (capacidades del asistente)
3. **Verifica las credenciales** en n8n:
   - YCloud API
   - Supabase API
   - PostgreSQL
   - DeepSeek IA
4. **Contacta al equipo técnico** si el problema persiste

---

## ✅ Checklist para Nuevos Miembros

Antes de empezar a trabajar con n8n, asegúrate de:

- [ ] Entender qué es n8n y por qué lo usamos
- [ ] Conocer los 10 flujos principales
- [ ] Entender cómo se conectan los sistemas (YCloud → n8n → BD)
- [ ] Saber cómo leer los logs de n8n
- [ ] Conocer dónde están las credenciales
- [ ] Leer este manual completo

---

**¡Bienvenido al equipo!** 🎉

Si tienes preguntas, no dudes en consultar a los miembros más experimentados del equipo.
