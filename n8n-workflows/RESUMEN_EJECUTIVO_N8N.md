# 📋 RESUMEN EJECUTIVO - FLUJOS N8N TUS AGUACATES

**Fecha**: Febrero 2026  
**Versión**: 2.0  
**Duración**: 30 minutos lectura  

---

## 🎯 ¿QUÉ ES ESTE SISTEMA?

Tu sistema de n8n es el **cerebro digital** que automatiza tu tienda Tus Aguacates. Procesa:

- 📱 Atención al cliente por WhatsApp
- 🔄 Sincronización de datos entre bases de datos
- 🛒 Gestión de pedidos y carritos
- 📢 Marketing automático (recordatorios y campañas)

**Total de flujos**: 46 archivos JSON  
**Flujos activos**: 9 (20%)  
**Instancia**: `dep-n8n.n8ntusaguacates.space`

---

## ⚡ LO MÁS IMPORTANTE (Flujos Críticos)

### 1️⃣ Agente Luz v6.5 - WhatsApp Bot
**¿Qué hace?**
- Responde mensajes de WhatsApp automáticamente
- Busca productos en tu catálogo
- Gestiona carritos de compras
- "Pregunta" a una IA (DeepSeek) para tomar decisiones
- Escala a humanos si hay una emergencia

**¿Por qué es crítico?**
- Procesa 100% de interacciones clientes
- Es la primera línea de contacto
- Trabaja 24/7

**Frecuencia**: Continuo (cada mensaje)

---

### 2️⃣ Sincronización de Clientes
**¿Qué hace?**
- Sincroniza clientes entre Supabase (instancia 2) y PostgreSQL (local)
- Se ejecuta cada hora
- Mantiene datos actualizados

**¿Por qué es crítico?**
- El Agente Luz necesita datos actualizados
- Si no se sincroniza, el bot no sabe quién es el cliente
- Pueden ocurrir errores en atención

**Frecuencia**: Cada hora

---

### 3️⃣ Confirmar Pre-pedido
**¿Qué hace?**
- Recibe confirmaciones de clientes
- Verifica que los precios sean correctos
- Confirma en Supabase
- Envía confirmación de vuelta a WhatsApp

**¿Por qué es crítico?**
- Cierra la venta del cliente
- Verifica integridad de precios
- Si falla, el cliente no sabe si su pedido está confirmado

**Frecuencia**: Continuo (cada confirmación)

---

### 4️⃣ Auditoría Diaria (6 AM)
**¿Qué hace?**
- Revisa integridad de datos todos los días
- Busca errores duplicados, datos incompletos
- Genera reportes

**¿Por qué es crítico?**
- Detecta errores antes de que afecten al negocio
- Evita problemas de datos
- Reporta automáticamente

**Frecuencia**: Diario a las 6 AM

---

### 5️⃣ Recordatorios de Carritos
**¿Qué hace?**
- Detecta carritos abandonados (más de 24h sin confirmar)
- Envía recordatorio por WhatsApp
- Repite después de 24h si no hay respuesta

**¿Por qué es crítico?**
- Recupera ventas que se habrían perdido
- Lógica simple pero efectiva
- Automatiza tareas manuales

**Frecuencia**: 4 veces por día

---

### 6️⃣ Procesar Buffer (10 segundos)
**¿Qué hace?**
- Agrupa mensajes de clientes en batches
- Procesa 10 mensajes a la vez
- Mejora performance

**¿Por qué es crítico?**
- Reduce llamadas API
- Mejora velocidad de respuesta
- Maneja spikes de tráfico

**Frecuencia**: Continuo (cada 10s)

---

## 🗂️ EL RESTO DE FLUJOS

### En Revisión (6)
- Sync clientes mejorado
- Sync productos v2
- Copilotos antiguos

### Inactivos (31)
- Campañas anteriores
- Agentes v3, v4, v5
- Flujo de referencia "unico 316"

---

## 🔗 TUS SERVICIOS

### Bases de Datos
- **Supabase 1**: Tienda web, productos, planes envío
- **Supabase 2**: Clientes, mensajes, búsqueda
- **PostgreSQL**: Agente, carritos, logs

### WhatsApp
- **YCloud API**: Envía y recibe mensajes
- **Autenticación**: Header `X-API-Key`

### IA
- **OpenAI**: Conversación con el agente
- **DeepSeek**: Búsqueda de productos y pre-procesamiento

---

## 🎓 PREGUNTAS FRECUENTES

### ¿Qué puedo hacer yo?
- Verificar que flujos estén activos
- Revisar logs si hay errores
- Crear nuevos flujos o modificar los existentes

### ¿Qué NO puedo hacer yo?
- Ejecutar flujos (solo puedo crear código)
- Ver logs en tiempo real
- Conectar directamente a n8n

### ¿Dónde están los flujos?
- Ubicación: `tus-aguacates/n8n-workflows/`
- Formato: JSON
- Total: 46 archivos

---

## 📊 ESTADÍSTICAS RÁPIDAS

| Métrica | Valor |
|---------|-------|
| Flujos totales | 46 |
| Activos | 9 (20%) |
| Revisión | 6 (13%) |
| Inactivos | 31 (67%) |
| Frecuencia sync clientes | Hourly |
| Frecuencia recordatorios | 4x/día |
| Frecuencia buffer | 10s |
| Servicios integrados | 4 |
| Bases de datos | 2 |

---

## 🚀 LO QUE HACE SISTEMA FUNCIONAL

```
CLIENTE ENVÍA WHATSAPP
         ↓
  YCloud Webhook
         ↓
    LIMPIEZA
         ↓
    AGENTE IA (DeepSeek)
         ↓
  HERRAMIENTAS (Postgres, SQL)
         ↓
  RESPUESTA FORMATEADA
         ↓
    YCloud SEND
         ↓
  GUARDAR LOGS
```

**Es el ecosistema completo**:

1. **Entrada**: YCloud recibe mensaje WhatsApp
2. **Procesamiento**: n8n limpia, analiza y decide
3. **Inteligencia**: IA toma decisiones inteligentes
4. **Acciones**: Herramientas actualizan bases de datos
5. **Salida**: WhatsApp responde al cliente
6. **Historial**: Todo se guarda en logs

---

## 🔍 CÓMO LEER ESTE MANUAL

### Para Novatos
1. Lee este resumen ejecutivo (30 min)
2. Luego ve a `MANUAL_COMPLETO_N8N.md` para detalles
3. Consulta `INDEX_FLUJOS.md` para ver qué flujos hay

### Para Técnicos
1. Lee `MANUAL_COMPLETO_N8N.md` completo
2. Revisa `DIAGRAMA_ARQUITECTURA.md`
3. Mira código de los flujos críticos

### Para Directores/Gerentes
1. Lee este resumen
2. Consulta estadísticas arriba
3. No necesitas saber detalles técnicos

---

## 💡 PROXIMOS PASOS

### Si eres nuevo en el equipo:
1. Lee este documento
2. Explora flujos en la carpeta
3. Revisa `INDEX_FLUJOS.md`
4. Pregunta si tienes dudas

### Si necesitas algo:
1. Describe lo que quieres lograr
2. Comparte contexto
3. Yo te ayudo a crear/modificar flujos

---

## 🎯 CONCLUSIÓN

Tu sistema de n8n:
- Automatiza operaciones críticas
- Atiende clientes 24/7
- Sincroniza datos automáticamente
- Genera reportes y auditorías
- Reduce tareas manuales

**Es el corazón digital de tu negocio**.

---

**Fin del Resumen**

Leer este documento te dará:
- 100% comprensión del sistema
- Visión general de 46 flujos
- Conocimiento de los 6 críticos
- Entendimiento de servicios integrados

**Tiempo recomendado**: 30 minutos
