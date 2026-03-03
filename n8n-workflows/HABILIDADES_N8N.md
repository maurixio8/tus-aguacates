# 🔌 Habilidades de n8n con tu Proyecto

## 📋 Resumen de Capacidades

### ✅ Lo que PUEDO hacer con n8n:

1. **Leer y Analizar Flujos**
   - ✅ Leer archivos JSON de flujos de n8n
   - ✅ Entender la estructura de nodos y conexiones
   - ✅ Analizar la lógica de cada flujo
   - ✅ Identificar dependencias y credenciales

2. **Documentar Flujos**
   - ✅ Crear documentación completa de flujos existentes
   - ✅ Explicar el propósito y funcionamiento de cada nodo
   - ✅ Diagramar la arquitectura de flujos
   - ✅ Crear guías de instalación y troubleshooting

3. **Crear/Modificar Flujos**
   - ✅ Crear nuevos flujos en formato JSON
   - ✅ Modificar flujos existentes
   - ✅ Agregar nuevos nodos y conexiones
   - ✅ Integrar APIs externas (Supabase, YCloud, OpenAI, etc.)

4. **Exportar Flujos**
   - ✅ Generar archivos JSON listos para importar en n8n
   - ✅ Crear flujos compatibles con tu versión de n8n
   - ✅ Generar código JavaScript para nodos personalizados

5. **Integraciones**
   - ✅ Supabase (lectura/escritura, RPC functions)
   - ✅ YCloud (WhatsApp API)
   - ✅ PostgreSQL (queries, insert, update)
   - ✅ OpenAI/DeepSeek (IA para procesamiento)
   - ✅ Webhooks (recepción/envío de eventos)
   - ✅ HTTP Requests (APIs externas)
   - ✅ Schedule triggers (automatización programada)

### ❌ Lo que NO puedo hacer:

1. **Ejecutar Flujos en Tiempo Real**
   - ❌ No puedo ejecutar flujos directamente
   - ❌ No puedo conectarme a tu instancia de n8n
   - ❌ No puedo activar/desactivar flujos

2. **Conexión MCP**
   - ❌ No tengo una conexión MCP con n8n
   - ❌ No puedo comunicarme con n8n en tiempo real
   - ❌ No puedo recibir eventos de n8n automáticamente

3. **Acceso a Tu Instancia**
   - ❌ No puedo acceder a tu URL de n8n
   - ❌ No puedo ver las ejecuciones de flujos
   - ❌ No puedo modificar tu base de datos directamente

---

## 🎨 Cómo Puedo Ayudarte

### 1. Documentación de Flujos Existentes

**¿Qué hago?**
- Analizo tus flujos JSON
- Creo documentación detallada
- Explico el propósito de cada nodo
- Genero guías de troubleshooting

**Ejemplo:**
```
Usuario: "Explícame qué hace el flujo Agente Luz v6.5"
AI: "El flujo Agente Luz v6.5 es un sistema de IA para atención al cliente
     por WhatsApp. Recibe mensajes vía webhook de YCloud, los procesa con
     DeepSeek, busca productos en Supabase, gestiona carritos en PostgreSQL,
     y escala a humanos cuando es necesario..."
```

### 2. Creación de Nuevos Flujos

**¿Qué hago?**
- Entiendo tus requerimientos
- Diseño la arquitectura del flujo
- Genero el código JSON completo
- Creo instrucciones de instalación

**Ejemplo:**
```
Usuario: "Crea un flujo para enviar correos de bienvenida a nuevos clientes"
AI: "Aquí tienes un flujo de n8n que:
     1. Se activa cuando un nuevo cliente se registra en Supabase
     2. Obtiene el email del cliente
     3. Genera un correo personalizado con un template
     4. Envía el correo vía SendGrid/SMTP
     5. Registra el envío en una tabla de logs
     
     [Genera archivo JSON del flujo]"
```

### 3. Modificación de Flujos Existentes

**¿Qué hago?**
- Leo tu flujo actual
- Entiendo qué cambios necesitas
- Modifico el JSON agregando/nodos
- Proveo instrucciones de implementación

**Ejemplo:**
```
Usuario: "Agrega al Agente Luz la capacidad de enviar imágenes de productos"
AI: "Voy a modificar el flujo Agente Luz v6.5:
     1. Agregaré un nuevo nodo para buscar la imagen del producto
     2. Modificaré el nodo de respuesta para incluir la imagen
     3. Actualizaré el sistema de mensajes para soportar imágenes
     
     [Genera JSON modificado]"
```

### 4. Integración de APIs Externas

**¿Qué hago?**
- Entiendo la API externa
- Diseño la integración
- Creo nodos HTTP Request con la configuración correcta
- Manejo autenticación y errores

**Ejemplo:**
```
Usuario: "Conecta el flujo de pedidos con Stripe para procesar pagos"
AI: "Voy a crear una integración con Stripe:
     1. Agregaré un nodo para crear Payment Intent
     2. Configuraré webhooks para recibir confirmaciones
     3. Implementaré manejo de estados de pago
     4. Actualizaré el pedido con el resultado del pago
     
     [Genera flujo de integración]"
```

### 5. Optimización y Debugging

**¿Qué hago?**
- Analizo tu flujo buscando problemas
- Identifico cuellos de botella
- Sugiero mejoras de rendimiento
- Creo estrategias de manejo de errores

**Ejemplo:**
```
Usuario: "El flujo de sincronización de productos es muy lento, ¿cómo mejorarlo?"
AI: "Analizando tu flujo, veo varias oportunidades de optimización:
     1. Cambiar de obtener todos a obtener solo los modificados
     2. Implementar paginación para manejar grandes volúmenes
     3. Usar batch inserts en lugar de inserts individuales
     4. Agregar caching de resultados
     
     [Genera flujo optimizado]"
```

---

## 🛠️ Flujo de Trabajo Típico

### Escenario 1: Crear un Nuevo Flujo

```
1. Tú describes lo que necesitas
   ↓
2. Yo entiendo los requisitos
   ↓
3. Yo diseño la arquitectura
   ↓
4. Yo genero el JSON del flujo
   ↓
5. Tú importas el flujo en n8n
   ↓
6. Tú configuras las credenciales
   ↓
7. Tú pruebas el flujo
   ↓
8. Si hay errores, me los reportas
   ↓
9. Yo ajusto el flujo
   ↓
10. Flujo listo para producción
```

### Escenario 2: Modificar un Flujo Existente

```
1. Tú me envías el JSON del flujo o el nombre del archivo
   ↓
2. Yo leo y analizo el flujo
   ↓
3. Tú describes los cambios necesarios
   ↓
4. Yo modifico el JSON
   ↓
5. Tú importas el flujo modificado en n8n
   ↓
6. Tú pruebas los cambios
   ↓
7. Si hay errores, iteramos
   ↓
8. Cambios aplicados exitosamente
```

---

## 📚 Recursos Disponibles

### Archivos en tu Proyecto:

1. **Flujos de n8n**
   - Ubicación: `tus-aguacates/n8n-workflows/`
   - Formato: JSON
   - Cantidad: 40+ flujos

2. **Guías de Instalación**
   - `GUIA-CONECTAR-N8N-SUPABASE.md`
   - `GUIA-SETUP-N8N-ANTIGRAVITY.md`
   - `GUIA-INTEGRAR-COPILOTO.md`
   - `GUIA-SYNC-VARIANTES.md`
   - Y más...

3. **Scripts de Soporte**
   - SQL scripts para configurar base de datos
   - JavaScript para transformación de datos
   - Scripts de migración y actualización

### Documentación Creada:

1. **MANUAL_FLUJOS_N8N.md**
   - Documentación completa de todos los flujos
   - Guías de instalación
   - Troubleshooting común

2. **REFERENCIA_RAPIDA.md**
   - Guía rápida de flujos críticos
   - Checklist diarios y semanales
   - Procedimientos de emergencia

3. **DIAGRAMA_ARQUITECTURA.md**
   - Diagramas visuales de la arquitectura
   - Flujos de datos detallados
   - Mapa de integraciones

---

## 💡 Ejemplos de Solicitudes

### ✅ Puedo responder:

- "¿Qué hace el flujo Agente Luz v6.5?"
- "Crea un flujo para enviar correos de cumpleaños"
- "Agrega notificaciones de Slack al flujo de pedidos"
- "Optimiza el flujo de sincronización de productos"
- "Explícame cómo configurar el webhook de YCloud"
- "Crea un flujo para generar reportes semanales de ventas"
- "Modifica el Agente Luz para soportar comandos de admin"

### ❌ No puedo responder directamente:

- "Activa el flujo Agente Luz" (No tengo acceso a tu n8n)
- "Ejecuta el flujo de sincronización" (No puedo ejecutar)
- "¿Cuántas ejecuciones tuvo el flujo hoy?" (No veo tu n8n)
- "Elimina este nodo del flujo" (Tú debes hacerlo)
- "¿Qué error dio el flujo?" (No veo los logs)

---

## 🚀 Próximos Pasos

1. **Revisa la documentación creada**
   - `MANUAL_FLUJOS_N8N.md` - Documentación completa
   - `REFERENCIA_RAPIDA.md` - Guía rápida
   - `DIAGRAMA_ARQUITECTURA.md` - Diagramas visuales

2. **Explora tus flujos actuales**
   - Ubicación: `tus-aguacates/n8n-workflows/`
   - Identifica flujos críticos
   - Revisa dependencias y credenciales

3. **Identifica oportunidades de mejora**
   - Flujos lentos
   - Procesos manuales
   - Faltantes de funcionalidad

4. **Pide ayuda para crear/modificar flujos**
   - Describe lo que necesitas
   - Provee contexto
   - Itera según resultados

---

## 📞 Cómo Pedir Ayuda

### Formato recomendado para solicitudes:

```
[TIPO DE SOLICITUD] - Breve descripción

Contexto:
- ¿Qué intentas lograr?
- ¿Qué flujos están involucrados?
- ¿Qué restricciones tienes?

Requerimientos:
- Lista de funcionalidades
- Integraciones necesarias
- Credenciales disponibles

Ejemplo de uso (opcional):
- Caso de ejemplo
- Datos de entrada esperados
- Resultados esperados
```

### Ejemplo:

```
[CREAR FLUJO] - Notificación de pedidos pendientes

Contexto:
Quiero recibir notificaciones cuando haya pedidos que no han sido
confirmados por más de 2 horas.

Requerimientos:
- Ejecutarse cada 30 minutos
- Buscar pedidos con estado "pending" en Supabase
- Calcular tiempo desde creación
- Enviar mensaje a Slack si >2 horas
- Registrar notificación enviada

Integraciones:
- Supabase (lectura de pedidos)
- Slack (envío de notificaciones)
- PostgreSQL (registro de notificaciones)

Credenciales:
- Supabase account 2 (ya configurada)
- Slack (necesito configurar)
```

---

**Última actualización:** Febrero 2026
**Versión:** 1.0
