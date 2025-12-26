# Preguntas para Planificación del Video Generator

> ✅ **DOCUMENTO ACTUALIZADO CON RESPUESTAS** - 2024-12-26

---

## Sección 1: Infraestructura Oracle Cloud

### 1.1 ¿La instancia es ARM (Ampere) o x86?

> Respuesta: ✅ **ARM (Ampere A1 Flex)**

```
[X] ARM (Ampere A1) - VM.Standard.A1.Flex
    - Arquitectura: ARM64/aarch64
    - 4 OCPUs
    - 24 GB RAM
[ ] x86 (AMD/Intel)
```

**Implicaciones**:
- ❌ ComfyUI/Stable Diffusion local NO compatible (requiere x86 o GPU)
- ❌ Algunos Docker images no disponibles para ARM
- ✅ FFmpeg funciona bien en ARM
- ✅ Node.js/Python funcionan perfectamente
- ✅ n8n compatible

---

### 1.2 ¿Cuánto almacenamiento disponible tienes?

> Respuesta: ✅ **14 GB libres** (de 45 GB total SSD, 31 GB usados)

**⚠️ ALERTA CRÍTICA**: 14GB es MUY limitado para generación de video.

**Cálculos de uso**:
- Video 30s HD: ~25-50MB
- 60 videos/mes: ~3GB
- Archivos temporales de procesamiento: ~2-5GB
- Sistema + n8n + apps: ya ocupan 31GB

**Solución obligatoria**: Usar almacenamiento externo
- Google Drive (ilimitado con Workspace, o 15GB gratis)
- Cloudflare R2 (10GB gratis/mes)
- Oracle Object Storage (10GB gratis)

---

### 1.3 ¿Tienes Docker instalado?

> Respuesta: ❓ **Por confirmar**

```
[ ] Sí
[?] No, pero puedo instalarlo
[ ] No, y prefiero no usarlo
```

---

### 1.4 ¿Qué sistema operativo tiene la instancia?

> Respuesta: ❓ **Por confirmar** (probablemente Oracle Linux o Ubuntu)

---

### 1.5 ¿Tienes GPU disponible?

> Respuesta: ✅ **NO** (ARM Ampere no tiene GPU)

```
[ ] Sí
[X] No - ARM Ampere A1 (CPU only)
```

**Implicación**: Obligatorio usar APIs en la nube para generación de imágenes.

---

## Sección 2: n8n

### 2.1-2.4 n8n

> Respuesta: ✅ **Instalado en Oracle Cloud**

- Versión: Por confirmar
- Puerto: Probablemente 5678 (default)
- Acceso a internet: Sí (para llamar APIs)

---

## Sección 4: Presupuesto y APIs

### 4.1 ¿Cuál es tu presupuesto mensual aproximado para APIs de IA?

> Respuesta: ✅ **$5 USD/mes**

### 4.2 ¿Ya tienes cuentas en alguno de estos servicios?

> Respuesta: ✅ **Gemini Premium + Google Labs**

```
[ ] OpenAI (GPT, DALL-E)
[ ] Anthropic (Claude)
[ ] ElevenLabs (voz)
[ ] Runway
[ ] Midjourney
[X] Gemini Premium (Google One AI Premium)
[X] Google Labs (acceso completo)
```

**Recursos disponibles GRATIS con Gemini Premium**:
- ✅ Gemini 1.5 Pro/Ultra (texto, análisis)
- ✅ Google AI Studio (API gratuita con límites generosos)
- ✅ Imagen 3 (generación de imágenes vía AI Studio)
- ✅ NotebookLM (análisis de documentos)
- ✅ 2TB Google Drive

---

## Sección 5: Volumen y Uso

### 5.1 ¿Cuántos videos planeas generar por semana?

> Respuesta: ✅ **14 videos/semana (2 diarios = 60/mes)**

```
[ ] 1-3 videos/semana (empezando)
[ ] 4-7 videos/semana (moderado)
[X] 8-15 videos/semana (2 diarios)
[ ] Más de 15/semana
```

---

## Resumen de Restricciones

| Recurso | Disponible | Requerido | Estado |
|---------|------------|-----------|--------|
| CPU | 4 OCPUs ARM | 2+ | ✅ OK |
| RAM | 24 GB | 4-8 GB | ✅ OK |
| Storage | 14 GB libres | 50+ GB | ⚠️ CRÍTICO |
| GPU | Ninguna | Opcional | ℹ️ Usar APIs |
| Presupuesto APIs | $5/mes | Variable | ⚠️ LIMITADO |
| Gemini Premium | ✅ Incluido | - | ✅ GRATIS |
| Videos/mes | Target: 60 | - | 📊 Meta |

---

## Estrategia Recomendada

Dado el presupuesto de $5/mes + Gemini Premium:

1. **Texto/Recetas**: Gemini 1.5 Pro (GRATIS)
2. **Imágenes**: Google Imagen 3 vía AI Studio (GRATIS con límites)
3. **Almacenamiento**: Google Drive 2TB (incluido) + limpieza automática local
4. **Video**: FFmpeg (GRATIS, local)
5. **Automatización**: n8n (ya instalado)
6. **Hosting videos**: YouTube (GRATIS) o Google Drive

**Costo estimado real**: $0-5/mes

---

*Última actualización: 2024-12-26*
