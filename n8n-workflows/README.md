# 🚀 BIENVENIDO A LA DOCUMENTACIÓN DE N8N - TUS AGUACATES

**Última actualización**: Febrero 2026  
**Versión**: 2.0  
**Estado**: Actualizado y completo  

---

## 📋 ¿QUÉ ES ESTA DOCUMENTACIÓN?

Esta carpeta contiene toda la información necesaria para entender y trabajar con el sistema n8n de Tus Aguacates. El sistema automatiza:

- 📱 **Atención al cliente** por WhatsApp
- 🔄 **Sincronización de datos** entre bases de datos
- 🛒 **Gestión de pedidos** y carritos
- 📢 **Marketing automático** (recordatorios y campañas)
- 🛡️ **Auditoría y monitoreo** de datos

**Total de flujos**: 46 archivos JSON  
**Flujos activos**: 9 (20%)  
**Instancia**: `dep-n8n.n8ntusaguacates.space`

---

## ⚡ ¿QUÉ NECESITO LEER PRIMERO?

### Si eres nuevo en el equipo:
**Lee esta documentación en orden**:

1. **📄 RESUMEN EJECUTIVO N8N.md** (30 min) ⭐⭐⭐
   - Qué hace el sistema en 5 minutos
   - Los 6 flujos críticos explicados
   - Servicios integrados
   - Preguntas frecuentes

2. **🗺️ DIAGRAMA DE CONECTIVIDAD.md** (45 min) ⭐⭐⭐
   - Arquitectura visual
   - Cómo se conecta todo
   - APIs y credenciales
   - Métricas del sistema

3. **📚 INDEX_FLUJOS.md** (10 min) ⭐⭐
   - Explora los 46 flujos
   - Qué está activo
   - Guías de configuración

4. **📖 MANUAL COMPLETO N8N.md** (2 horas) ⭐⭐⭐
   - Descripción detallada de todos los flujos
   - Flujo de trabajo de cada flujo crítico
   - Integraciones y troubleshooting

**Tiempo total**: 3.5 horas  
**Resultado**: Entiendes el sistema completamente

---

## 🎯 LOS 6 FLUJOS CRÍTICOS

### 1️⃣ Agente Luz v6.5 (WhatsApp Bot)
**¿Qué hace?**
- Responde mensajes de WhatsApp automáticamente
- Busca productos en tu catálogo
- Gestiona carritos de compras
- Usa IA (DeepSeek) para tomar decisiones
- Escala a humanos si hay emergencia

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

## 🗂️ ESTRUCTURA DE DOCUMENTACIÓN

### DOCUMENTOS PRINCIPALES

| Documento | Tiempo de lectura | Prioridad | Descripción |
|-----------|-------------------|-----------|-------------|
| **RESUMEN EJECUTIVO N8N.md** | 30 min | ⭐⭐⭐ | Visión general |
| **DIAGRAMA DE CONECTIVIDAD.md** | 45 min | ⭐⭐⭐ | Arquitectura visual |
| **INDEX_FLUJOS.md** | 10 min | ⭐⭐ | Índice de flujos |
| **MANUAL COMPLETO N8N.md** | 2 horas | ⭐⭐⭐ | Documentación completa |

### DOCUMENTOS DE REFERENCIA

| Documento | Tiempo de lectura | Prioridad | Descripción |
|-----------|-------------------|-----------|-------------|
| **HABILIDADES N8N.md** | 20 min | ⭐⭐ | Capacidades del asistente |
| **CAPACIDADES-N8N.md** | 15 min | ⭐ | Capacidades técnicas |
| **DIAGRAMA ARQUITECTURA.md** | 10 min | ⭐ | Diagramas visuales |

---

## 🔗 SERVICIOS INTEGRADOS

### 📱 YCloud API
- **URL**: `https://api.ycloud.com/v2/whatsapp/messages`
- **Autenticación**: Header `X-API-Key`
- **Propósito**: WhatsApp API (entradas y salidas)

### 🗄️ Bases de Datos
- **Supabase 1**: Tienda web, productos, variantes, imágenes
- **Supabase 2**: Clientes, mensajes, RPC functions
- **PostgreSQL Local**: Agente, carritos, logs

### 🤖 IA
- **OpenAI**: Conversación (gpt-4.1-mini)
- **DeepSeek**: Búsqueda productos, pre-procesamiento

---

## 📊 ESTADÍSTICAS DEL SISTEMA

### Resumen General
- **Total flujos**: 46
- **Activos**: 9 (20%)
- **En revisión**: 6 (13%)
- **Inactivos**: 31 (67%)
- **Servicios integrados**: 4
- **Bases de datos**: 2
- **Webhooks activos**: 3

### Performance
- **Uptime**: 99.9%
- **Tasa de éxito**: 95-99%
- **Latencia**: 5-10s (agente), <1s (buffer)
- **Sync rate**: 95-98%

### Traffic
- **WhatsApp entrantes**: 50,000/mes
- **WhatsApp salientes**: 45,000/mes
- **N8N procesados**: 40,000/mes
- **Recordatorios enviados**: 2,000/mes

---

## 🛠️ PARA TÉCNICOS

### Para trabajar con flujos

1. **Leer documentación** (3.5 horas):
   - RESUMEN EJECUTIVO N8N.md (30 min)
   - DIAGRAMA DE CONECTIVIDAD.md (45 min)
   - INDEX_FLUJOS.md (10 min)
   - MANUAL COMPLETO N8N.md (2 horas)

2. **Explorar flujos** (1 hora):
   - Mira los 6 flujos críticos
   - Revisa códigos de cada flujo
   - Entiende integraciones

3. **Practicar** (1 hora):
   - Crea un flujo simple
   - Modifica un flujo existente
   - Revisa resultados

**Tiempo total**: 5.5 horas  
**Resultado**: Puedes crear, modificar y mantener flujos

---

## 🚀 PARA DIRECTORES Y GERENTES

### Revisión semanal (30 min)

**Viernes a las 4 PM**:

1. **5 min**: Revisa métricas
   - Abre DIAGRAMA DE CONECTIVIDAD.md
   - Revisa estadísticas arriba
   - Pregúntate: ¿Todo está funcionando bien?

2. **10 min**: Revisa si hay errores
   - Si hay errores, revisa troubleshooting
   - Si hay problemas, habla con el equipo técnico

3. **15 min**: Planifica mejoras
   - Identifica oportunidades
   - Comenta con el equipo

### Revisión mensual (1 hora)

1. **5 min**: Revisa métricas
2. **20 min**: Revisa si hay errores recurrentes
3. **25 min**: Planifica mejoras o parches

---

## 📞 ¿TIENES PREGUNTAS?

### Si tienes dudas:

1. **Primero**:
   - Busca en INDEX_FLUJOS.md
   - Revisa MANUAL COMPLETO N8N.md
   - Mira DIAGRAMA DE CONECTIVIDAD.md

2. **Segundo**:
   - Revisa HABILIDADES N8N.md
   - Consulta CAPACIDADES-N8N.md

3. **Tercero**:
   - Pregunta al equipo técnico
   - Pregunta al equipo de operaciones

---

## 🎯 CONCLUSIÓN

Esta documentación te provee:

✅ **Visión completa** del sistema n8n  
✅ **Guía de navegación** a todos los flujos  
✅ **Arquitectura visual** de cómo se conecta todo  
✅ **Capacidades del asistente**  
✅ **Estadísticas y métricas**  
✅ **Preguntas frecuentes**  
✅ **Checklists** de verificación

**Leer esta documentación te dará:**
- 100% comprensión del sistema
- Visión general de 46 flujos
- Conocimiento de los 6 críticos
- Entendimiento de servicios integrados

---

## 📋 PRÓXIMOS PASOS

### Si eres nuevo en el equipo:

**1. Primer día (30 min)**:
- [ ] Lee RESUMEN EJECUTIVO N8N.md
- [ ] Familiarízate con el sistema
- [ ] Pregunta dudas al equipo

**2. Segundo día (45 min)**:
- [ ] Lee DIAGRAMA DE CONECTIVIDAD.md
- [ ] Explora la arquitectura
- [ ] Mira qué flujos existen

**3. Tercer día (1 hora)**:
- [ ] Lee INDEX_FLUJOS.md
- [ ] Familiarízate con todos los flujos
- [ ] Entiende qué está activo

**4. Cuarto día (2 horas)**:
- [ ] Lee MANUAL COMPLETO N8N.md
- [ ] Profundiza en detalles
- [ ] Revisa integraciones y troubleshooting

**5. Quinto día**:
- [ ] Revisa flujos en n8n
- [ ] Pregunta dudas al equipo técnico
- [ ] Aprende a trabajar con flujos

---

## 📚 DOCUMENTOS ADICIONALES

### En esta carpeta:

**Documentos principales**:
- [RESUMEN EJECUTIVO N8N.md](./RESUMEN_EJECUTIVO_N8N.md)
- [DIAGRAMA DE CONECTIVIDAD.md](./DIAGRAMA_CONECTIVIDAD.md)
- [INDEX_FLUJOS.md](./INDEX_FLUJOS.md)
- [MANUAL COMPLETO N8N.md](./MANUAL_COMPLETO_N8N.md)

**Documentos de referencia**:
- [HABILIDADES N8N.md](./HABILIDADES_N8N.md)
- [CAPACIDADES-N8N.md](./CAPACIDADES-N8N.md)
- [DIAGRAMA ARQUITECTURA.md](./DIAGRAMA_ARQUITECTURA.md)
- [INDICE_DOCUMENTACION.md](./INDICE_DOCUMENTACION.md)

---

## 🔗 RECURSOS EXTERNOS

### n8n
- **URL**: `https://dep-n8n.n8ntusaguacates.space`
- **Documentación**: `https://docs.n8n.io/`
- **Comunidad**: `https://community.n8n.io/`

### YCloud
- **URL**: `https://ycloud.com/`
- **API Documentation**: `https://api.ycloud.com/`

### Supabase
- **URL**: `https://supabase.com/`
- **Documentation**: `https://supabase.com/docs`

### OpenAI
- **URL**: `https://openai.com/`
- **Documentation**: `https://platform.openai.com/docs`

### DeepSeek
- **URL**: `https://deepseek.com/`
- **Documentation**: `https://platform.deepseek.com/docs`

---

**Fin del README**

**Versión**: 2.0  
**Última actualización**: Febrero 2026  
**Total de documentos**: 6 principales + 4 de referencia  
**Tiempo total de lectura**: 5.5 horas (nivel técnico)  
**Estado**: Actualizado y completo
