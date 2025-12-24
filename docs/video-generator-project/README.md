# Tus Aguacates - Video Generator Project

## Proyecto: Sistema de Generación de Videos con IA

> Documentación de planificación para el sistema independiente de generación de contenido multimedia.

---

## Estado del Proyecto

- **Fase actual**: Planificación
- **Fecha inicio**: 2024-12-24
- **Repositorio tienda**: tus-aguacates (Vercel)
- **Repositorio video generator**: Por definir

---

## Índice

1. [Visión del Proyecto](#visión-del-proyecto)
2. [Objetivos](#objetivos)
3. [Preguntas Pendientes](#preguntas-pendientes)
4. [Arquitectura Propuesta](#arquitectura-propuesta)
5. [Análisis de Infraestructura](#análisis-de-infraestructura)
6. [Pros y Contras](#pros-y-contras)
7. [Roadmap](#roadmap)
8. [Decisiones Técnicas](#decisiones-técnicas)

---

## Visión del Proyecto

Crear un sistema **independiente** de la tienda que permita:

1. **Generar videos de recetas** con identidad de marca Tus Aguacates
2. **Crear contenido promocional** (tutoriales de la app, showcases de productos)
3. **Automatizar publicación** en redes sociales
4. **Mantener consistencia visual** con escenarios virtuales predefinidos

### Por qué separarlo de la tienda

| Aspecto | Tienda (Vercel) | Video Generator (Oracle Cloud) |
|---------|-----------------|--------------------------------|
| Propósito | E-commerce, UX rápida | Procesamiento pesado |
| Recursos | Limitados (capa gratis) | 24GB RAM, 4 CPUs |
| Disponibilidad | 24/7 crítico | Puede tener colas |
| Escalabilidad | Serverless | Recursos fijos |
| Costo | Gratis/bajo | Ya pagado |

---

## Objetivos

### Objetivos Principales

- [ ] **OBJ-1**: Generar videos de recetas de 30-40 segundos con branding
- [ ] **OBJ-2**: Soportar formatos 9:16 (vertical) y 16:9 (horizontal)
- [ ] **OBJ-3**: Incluir subtítulos bilingües (ES/EN)
- [ ] **OBJ-4**: Mantener identidad visual consistente (frame dorado, colores de marca)
- [ ] **OBJ-5**: Generar recetas automáticamente con IA

### Objetivos Secundarios

- [ ] **OBJ-6**: Videos promocionales de la tienda/app
- [ ] **OBJ-7**: Videos con narración de voz (TTS)
- [ ] **OBJ-8**: Escenarios virtuales reutilizables (cocina, jardín, etc.)
- [ ] **OBJ-9**: Inserción de productos en escenas
- [ ] **OBJ-10**: Publicación automática en redes sociales

### Objetivos Técnicos

- [ ] **OBJ-T1**: Sistema accesible remotamente (no depender de PC personal)
- [ ] **OBJ-T2**: Integración con n8n para automatizaciones
- [ ] **OBJ-T3**: API para comunicación con la tienda
- [ ] **OBJ-T4**: Cola de trabajos para procesamiento asíncrono
- [ ] **OBJ-T5**: No afectar rendimiento de la tienda en Vercel

---

## Preguntas Pendientes

> **IMPORTANTE**: Necesito respuestas a estas preguntas antes de continuar con la planificación detallada.

### Sobre la Infraestructura Oracle Cloud

1. **¿La instancia es ARM (Ampere) o x86?**
   - Esto afecta qué software podemos usar (algunos no tienen versión ARM)
   - [ ] ARM (Ampere A1)
   - [ ] x86 (AMD/Intel)

2. **¿Cuánto almacenamiento disponible tienes?**
   - Los modelos de IA y videos ocupan mucho espacio
   - Mínimo recomendado: 100GB
   - Respuesta: _____ GB

3. **¿Tienes Docker instalado?**
   - Facilita mucho el deployment
   - [ ] Sí
   - [ ] No

4. **¿Qué sistema operativo tiene?**
   - [ ] Ubuntu
   - [ ] Oracle Linux
   - [ ] Otro: _____

5. **¿Tienes GPU disponible?**
   - Para generación de imágenes local sería ideal
   - [ ] Sí (modelo: _____)
   - [ ] No (usaremos APIs en la nube)

### Sobre n8n

6. **¿Qué versión de n8n tienes?**
   - Respuesta: _____

7. **¿n8n está en la misma instancia de Oracle Cloud?**
   - [ ] Sí, misma instancia
   - [ ] No, está en otro servidor
   - Dirección/puerto: _____

8. **¿n8n tiene acceso a internet para llamar APIs externas?**
   - [ ] Sí
   - [ ] No / Con restricciones

### Sobre Dominio y Acceso

9. **¿Tienes un dominio/subdominio para el video generator?**
   - Ejemplo: videos.tusaguacates.com
   - [ ] Sí: _____
   - [ ] No, usaré IP directa
   - [ ] No, pero puedo crear uno

10. **¿El sistema debe ser accesible públicamente o solo interno?**
    - [ ] Público (cualquiera con credenciales)
    - [ ] Solo red interna / VPN
    - [ ] Solo desde la tienda (API privada)

### Sobre Presupuesto y APIs

11. **¿Tienes presupuesto mensual para APIs de IA?**
    - OpenAI (GPT-4, DALL-E): ~$20-50/mes para uso moderado
    - ElevenLabs (voz): ~$5-22/mes
    - Runway/Kling (video): ~$15-50/mes
    - Respuesta: $_____ /mes aproximado

12. **¿Prefieres usar más servicios en la nube o procesar localmente?**
    - [ ] Nube (más fácil, requiere presupuesto)
    - [ ] Local (más complejo, sin costo recurrente)
    - [ ] Híbrido (lo que sea más eficiente)

### Sobre Volumen de Contenido

13. **¿Cuántos videos planeas generar por semana/mes?**
    - [ ] 1-5 por semana
    - [ ] 5-10 por semana
    - [ ] 10-20 por semana
    - [ ] Más de 20 por semana

14. **¿Quién va a usar el sistema?**
    - [ ] Solo tú
    - [ ] Tú y 1-2 personas más
    - [ ] Un equipo (3+)

### Sobre Integración con la Tienda

15. **¿Cómo quieres que se comunique con la tienda actual?**
    - [ ] API directa (el video generator llama a la tienda)
    - [ ] Webhooks (la tienda notifica al generator)
    - [ ] Base de datos compartida (Supabase)
    - [ ] Manual (copiar/pegar info)

16. **¿Los videos generados deben mostrarse en la tienda?**
    - [ ] Sí, embebidos en las páginas de recetas
    - [ ] No, solo en redes sociales
    - [ ] Ambos

---

## Arquitectura Propuesta

> **Nota**: Esta arquitectura es preliminar y se ajustará según las respuestas a las preguntas.

```
                         ARQUITECTURA VIDEO GENERATOR
                         ════════════════════════════

    ┌─────────────────────────────────────────────────────────────────┐
    │                        ORACLE CLOUD                             │
    │                     (24GB RAM, 4 CPUs)                          │
    │                                                                 │
    │   ┌─────────────┐    ┌─────────────┐    ┌─────────────┐        │
    │   │             │    │             │    │             │        │
    │   │   VIDEO     │◄──►│    n8n      │◄──►│  ComfyUI    │        │
    │   │  GENERATOR  │    │ (workflows) │    │ (imágenes)  │        │
    │   │    API      │    │             │    │             │        │
    │   │             │    │             │    │             │        │
    │   └──────┬──────┘    └─────────────┘    └─────────────┘        │
    │          │                                                      │
    │          │           ┌─────────────┐    ┌─────────────┐        │
    │          │           │             │    │             │        │
    │          └──────────►│   Redis     │    │  Storage    │        │
    │                      │   (cola)    │    │  (videos)   │        │
    │                      │             │    │             │        │
    │                      └─────────────┘    └─────────────┘        │
    │                                                                 │
    └─────────────────────────────────────────────────────────────────┘
                │                                    │
                │ API                                │ CDN
                ▼                                    ▼
    ┌─────────────────┐                    ┌─────────────────┐
    │                 │                    │                 │
    │    TIENDA       │                    │  REDES SOCIALES │
    │   (Vercel)      │                    │  IG/TikTok/YT   │
    │                 │                    │                 │
    └─────────────────┘                    └─────────────────┘


    FLUJO DE DATOS:
    ═══════════════

    1. Admin crea receta en tienda (Vercel)
           │
           ▼
    2. Webhook notifica a Video Generator (Oracle)
           │
           ▼
    3. n8n orquesta el proceso:
       a) GPT-4 genera contenido
       b) DALL-E/ComfyUI genera imágenes
       c) Runway/Kling anima imágenes
       d) FFmpeg ensambla video
       e) ElevenLabs genera voz (opcional)
           │
           ▼
    4. Video se guarda en Storage
           │
           ▼
    5. URL se envía de vuelta a la tienda
           │
           ▼
    6. (Opcional) Publicación automática en redes
```

---

## Análisis de Infraestructura

### Oracle Cloud - Capacidades

| Recurso | Disponible | Requerido Mínimo | Estado |
|---------|------------|------------------|--------|
| RAM | 24 GB | 8 GB | ✅ Suficiente |
| CPUs | 4 | 2 | ✅ Suficiente |
| Storage | ? GB | 100 GB | ❓ Por confirmar |
| GPU | ? | Opcional | ❓ Por confirmar |
| Docker | ? | Recomendado | ❓ Por confirmar |

### Servicios que podemos correr localmente (Oracle)

| Servicio | RAM Requerida | CPU | Notas |
|----------|---------------|-----|-------|
| n8n | 512MB-1GB | 0.5 | Ya instalado |
| Redis | 256MB-1GB | 0.25 | Cola de trabajos |
| PostgreSQL | 512MB-2GB | 0.5 | Base de datos local |
| FFmpeg | Variable | 1-2 | Procesamiento video |
| ComfyUI + SD | 8-16GB | 2-4 | Solo si hay GPU o ARM compatible |

### Servicios en la nube (APIs)

| Servicio | Función | Costo Aprox |
|----------|---------|-------------|
| OpenAI GPT-4 | Generar recetas/textos | $0.03/1K tokens |
| OpenAI DALL-E 3 | Generar imágenes | $0.04-0.12/imagen |
| Runway Gen-3 | Animar imágenes | $0.05/segundo |
| ElevenLabs | Text-to-Speech | $0.30/1K caracteres |
| Cloudflare R2 | Almacenar videos | $0.015/GB/mes |

---

## Pros y Contras

### Pros de Separar el Proyecto

| Pro | Descripción |
|-----|-------------|
| ✅ **No afecta la tienda** | Si el generador falla, la tienda sigue funcionando |
| ✅ **Recursos dedicados** | 24GB RAM para procesamiento pesado |
| ✅ **Sin límites de Vercel** | No gastamos el free tier en procesamiento |
| ✅ **Acceso remoto** | Disponible desde cualquier lugar |
| ✅ **Escalabilidad independiente** | Podemos mejorar solo el generador |
| ✅ **n8n integrado** | Automatizaciones poderosas ya disponibles |
| ✅ **Costo fijo** | Oracle Cloud ya está pagado |

### Contras / Riesgos

| Contra | Mitigación |
|--------|------------|
| ⚠️ **Complejidad adicional** | Documentar bien, usar Docker |
| ⚠️ **Dos sistemas que mantener** | Automatizar deployments |
| ⚠️ **Latencia de red** | Usar webhooks async, no bloquear |
| ⚠️ **ARM puede ser limitante** | Verificar compatibilidad de software |
| ⚠️ **Sin GPU** | Usar APIs en la nube para IA |
| ⚠️ **Storage limitado** | Limpiar videos viejos, usar CDN externo |

### Críticas y Consideraciones

1. **Realismo del scope**: Generar videos con IA es complejo. Sugiero empezar simple (imágenes estáticas + subtítulos) antes de animación.

2. **Costos ocultos**: Las APIs de IA pueden sumar. 10 videos/semana con todas las features podría costar $50-100/mes.

3. **Tiempo de desarrollo**: Un sistema robusto puede tomar 2-4 semanas de trabajo enfocado.

4. **Mantenimiento**: Los modelos de IA cambian, las APIs se actualizan. Hay que mantener el sistema.

---

## Roadmap

### Fase 0: Preparación (Antes de codear)
- [ ] Responder todas las preguntas pendientes
- [ ] Verificar capacidades de Oracle Cloud
- [ ] Definir presupuesto mensual para APIs
- [ ] Decidir arquitectura final

### Fase 1: Infraestructura Base
- [ ] Configurar Docker en Oracle Cloud
- [ ] Instalar Redis para cola de trabajos
- [ ] Crear API base del video generator
- [ ] Configurar comunicación con n8n
- [ ] Establecer conexión con Supabase (tienda)

### Fase 2: Generación de Contenido
- [ ] Integrar OpenAI para generar recetas automáticas
- [ ] Crear templates de prompts para diferentes tipos de video
- [ ] Integrar DALL-E para generación de imágenes
- [ ] Definir y crear escenarios base (cocina, etc.)

### Fase 3: Producción de Video
- [ ] Integrar servicio de animación (Runway/Kling)
- [ ] Configurar FFmpeg para ensamblaje
- [ ] Agregar subtítulos automáticos
- [ ] Implementar branding (frame dorado, logo)

### Fase 4: Voz y Audio
- [ ] Integrar ElevenLabs o alternativa
- [ ] Biblioteca de música de fondo
- [ ] Sincronización voz-video

### Fase 5: Automatización
- [ ] Workflows n8n para proceso completo
- [ ] Publicación automática en redes (si APIs disponibles)
- [ ] Dashboard de monitoreo

---

## Decisiones Técnicas

> Decisiones que necesitamos tomar una vez respondidas las preguntas.

### Por decidir

| Decisión | Opciones | Elegida |
|----------|----------|---------|
| Lenguaje backend | Python / Node.js / Go | ❓ |
| Framework | FastAPI / Express / Fiber | ❓ |
| Cola de trabajos | Redis Queue / Bull / Celery | ❓ |
| Generación imágenes | DALL-E / Midjourney API / ComfyUI local | ❓ |
| Animación | Runway / Kling / Pika | ❓ |
| TTS | ElevenLabs / OpenAI TTS / Coqui local | ❓ |
| Storage videos | Oracle Object Storage / Cloudflare R2 / Supabase | ❓ |

---

## Archivos Relacionados

- [Preguntas y Respuestas](./QUESTIONS.md) - Respuestas detalladas
- [Arquitectura](./ARCHITECTURE.md) - Diseño técnico detallado
- [API Spec](./API.md) - Especificación de endpoints
- [Workflows n8n](./N8N_WORKFLOWS.md) - Automatizaciones

---

## Notas

- Este documento se actualizará conforme avance la planificación
- Todas las decisiones deben documentarse con su justificación
- El objetivo es tener claridad ANTES de escribir código
