# Arquitectura MVP - Video Generator Tus Aguacates

> **Versión**: 1.0 - Plan Económico con Gemini Premium
> **Presupuesto**: $5/mes + recursos gratuitos de Google
> **Meta**: 2 videos diarios (60/mes)

---

## Stack Tecnológico Final

```
╔═══════════════════════════════════════════════════════════════════╗
║                    STACK MVP - COSTO $0-5/MES                     ║
╠═══════════════════════════════════════════════════════════════════╣
║                                                                   ║
║  GENERACIÓN DE CONTENIDO (100% Google - GRATIS)                  ║
║  ├── Gemini 1.5 Pro     → Recetas, textos, subtítulos            ║
║  ├── Google Imagen 3    → Imágenes de pasos de receta            ║
║  └── Google AI Studio   → API gratuita con límites generosos     ║
║                                                                   ║
║  PROCESAMIENTO (Oracle Cloud - YA PAGADO)                        ║
║  ├── FFmpeg             → Ensamblaje de video                    ║
║  ├── Node.js/Python     → Scripts de automatización              ║
║  └── n8n                → Orquestación de workflows              ║
║                                                                   ║
║  ALMACENAMIENTO (GRATIS)                                         ║
║  ├── Google Drive 2TB   → Videos finales (incluido con Premium)  ║
║  ├── Supabase Storage   → Thumbnails para tienda (ya tienes)     ║
║  └── YouTube (unlisted) → Hosting de videos para embed           ║
║                                                                   ║
║  DISTRIBUCIÓN (GRATIS)                                           ║
║  ├── YouTube            → Videos horizontales (16:9)             ║
║  ├── Instagram/TikTok   → Videos verticales (9:16) - manual      ║
║  └── Tienda web         → Embed desde YouTube/Drive              ║
║                                                                   ║
╚═══════════════════════════════════════════════════════════════════╝
```

---

## Arquitectura Detallada

```
                         FLUJO DE GENERACIÓN DE VIDEO
                         ════════════════════════════

    ┌─────────────────────────────────────────────────────────────────┐
    │                      ORACLE CLOUD (ARM)                         │
    │                     4 OCPUs, 24GB RAM                           │
    │                                                                 │
    │   ┌─────────────────────────────────────────────────────────┐  │
    │   │                        n8n                               │  │
    │   │                  (Orquestador Principal)                 │  │
    │   │                                                          │  │
    │   │  Workflow: "Generar Video de Receta"                    │  │
    │   │  ┌────────────────────────────────────────────────────┐ │  │
    │   │  │ 1. Trigger (manual/webhook/schedule)               │ │  │
    │   │  │ 2. Gemini: Generar receta completa                 │ │  │
    │   │  │ 3. Loop: Por cada paso                             │ │  │
    │   │  │    └── Imagen 3: Generar imagen del paso           │ │  │
    │   │  │ 4. FFmpeg: Ensamblar slideshow + subtítulos        │ │  │
    │   │  │ 5. Upload: Google Drive + notificación             │ │  │
    │   │  └────────────────────────────────────────────────────┘ │  │
    │   └─────────────────────────────────────────────────────────┘  │
    │                           │                                     │
    │                           ▼                                     │
    │   ┌─────────────┐    ┌─────────────┐    ┌─────────────┐        │
    │   │   /tmp/     │    │   FFmpeg    │    │   rclone    │        │
    │   │  (trabajo)  │───►│  (proceso)  │───►│ (sync Drive)│        │
    │   │   ~2GB      │    │             │    │             │        │
    │   └─────────────┘    └─────────────┘    └─────────────┘        │
    │                                                                 │
    └─────────────────────────────────────────────────────────────────┘
                │                                    │
                │ API                                │ Sync
                ▼                                    ▼
    ┌─────────────────┐                    ┌─────────────────┐
    │                 │                    │                 │
    │  Google Cloud   │                    │  Google Drive   │
    │  (AI Studio)    │                    │    (2TB)        │
    │  - Gemini API   │                    │  Videos finales │
    │  - Imagen 3 API │                    │                 │
    │                 │                    │                 │
    └─────────────────┘                    └─────────────────┘
                                                    │
                                                    │ Link/Embed
                                                    ▼
                                          ┌─────────────────┐
                                          │                 │
                                          │     TIENDA      │
                                          │    (Vercel)     │
                                          │  Página recetas │
                                          │                 │
                                          └─────────────────┘
```

---

## Límites de APIs Gratuitas (Google AI Studio)

### Gemini 1.5 Pro (Free Tier)
| Métrica | Límite | Uso por video | Videos/día posibles |
|---------|--------|---------------|---------------------|
| Requests/min | 15 | ~3 requests | 5/minuto |
| Requests/día | 1,500 | ~3 requests | **500 videos** ✅ |
| Tokens/min | 32,000 | ~2,000 tokens | Suficiente |

### Google Imagen 3 (via AI Studio)
| Métrica | Límite | Uso por video | Videos/día posibles |
|---------|--------|---------------|---------------------|
| Images/día | ~100* | 6 imágenes | **16 videos** ⚠️ |

*El límite exacto varía, pero típicamente 50-150 imágenes/día en free tier.

### Cálculo para 2 videos/día:
- **Gemini**: 6 requests/día → ✅ Muy dentro del límite
- **Imagen 3**: 12 imágenes/día → ⚠️ Funciona pero ajustado

**Estrategia**: Usar 5-6 imágenes por video en lugar de 8-10.

---

## Estructura del Video MVP

### Formato Slideshow con Transiciones

```
┌──────────────────────────────────────────────────────────────┐
│                    VIDEO 30-40 SEGUNDOS                      │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  [0s-4s]    INTRO                                           │
│             ├── Logo Tus Aguacates (imagen estática)        │
│             ├── Título de receta                            │
│             └── Fade in desde negro                         │
│                                                              │
│  [4s-8s]    INGREDIENTES                                    │
│             └── Imagen: Display de todos los ingredientes   │
│                                                              │
│  [8s-14s]   PASO 1                                          │
│             ├── Imagen: Cortando aguacate                   │
│             ├── Subtítulo ES: "Corta el aguacate por..."    │
│             └── Zoom lento (Ken Burns effect)               │
│                                                              │
│  [14s-20s]  PASO 2                                          │
│             ├── Imagen: Sacando pulpa                       │
│             └── Cross-fade desde paso anterior              │
│                                                              │
│  [20s-26s]  PASO 3                                          │
│             └── Imagen: Machacando                          │
│                                                              │
│  [26s-32s]  PASO 4                                          │
│             └── Imagen: Agregando ingredientes              │
│                                                              │
│  [32s-38s]  RESULTADO FINAL                                 │
│             └── Imagen: Plato terminado (hero shot)         │
│                                                              │
│  [38s-40s]  OUTRO                                           │
│             ├── Logo + "tusaguacates.com"                   │
│             └── Fade out                                    │
│                                                              │
├──────────────────────────────────────────────────────────────┤
│  AUDIO: Música de fondo libre de derechos (archivo local)   │
│  SUBTÍTULOS: Quemados en video (hardcoded)                  │
│  FRAME: Borde dorado agregado por FFmpeg                    │
└──────────────────────────────────────────────────────────────┘
```

---

## Flujo de n8n Detallado

### Workflow Principal

```yaml
name: "Generar Video Receta"
trigger:
  - Manual (botón en n8n)
  - Webhook desde admin tienda
  - Schedule (ej: 9am y 3pm)

nodes:
  1_input:
    type: "Set"
    data:
      receta_nombre: "Guacamole Clásico"
      categoria: "dip"
      porciones: 4
      # O recibir desde webhook

  2_generar_receta:
    type: "HTTP Request"
    method: "POST"
    url: "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent"
    headers:
      x-goog-api-key: "{{ $credentials.googleAI }}"
    body:
      contents:
        - parts:
            - text: |
                Genera una receta de {{ $json.receta_nombre }} con el siguiente formato JSON:
                {
                  "title_es": "título en español",
                  "title_en": "title in english",
                  "description_es": "descripción corta",
                  "description_en": "short description",
                  "ingredients": [
                    {"name_es": "aguacate", "name_en": "avocado", "quantity": "2", "unit_es": "unidades"}
                  ],
                  "steps": [
                    {"instruction_es": "Corta el aguacate...", "instruction_en": "Cut the avocado...", "duration_seconds": 6}
                  ],
                  "total_time_minutes": 15,
                  "servings": {{ $json.porciones }}
                }

  3_parse_receta:
    type: "Code"
    code: |
      const response = JSON.parse($input.item.json.candidates[0].content.parts[0].text);
      return [{ json: response }];

  4_loop_pasos:
    type: "SplitInBatches"
    batchSize: 1
    input: "{{ $json.steps }}"

  5_generar_imagen:
    type: "HTTP Request"
    method: "POST"
    url: "https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-001:predict"
    body:
      instances:
        - prompt: |
            Professional food photography, vertical 9:16, POV first-person perspective,
            {{ $json.instruction_es }},
            dark green gradient background #2D5016 to #6B8E23,
            rustic wooden cutting board, warm natural lighting,
            elegant golden frame border, photorealistic, 8K
      parameters:
        sampleCount: 1

  6_guardar_imagen:
    type: "Write Binary File"
    fileName: "/tmp/video_{{ $workflow.id }}/paso_{{ $itemIndex }}.png"

  7_merge_resultados:
    type: "Merge"
    mode: "append"

  8_crear_subtitulos:
    type: "Code"
    code: |
      // Generar archivo SRT desde los pasos
      let srt = '';
      let time = 4; // Empezar después del intro

      items.forEach((step, i) => {
        const duration = step.json.duration_seconds || 6;
        const start = formatTime(time);
        const end = formatTime(time + duration);

        srt += `${i + 1}\n`;
        srt += `${start} --> ${end}\n`;
        srt += `${step.json.instruction_es}\n\n`;

        time += duration;
      });

      return [{ json: { srt } }];

  9_ejecutar_ffmpeg:
    type: "Execute Command"
    command: |
      cd /tmp/video_{{ $workflow.id }} && \
      ffmpeg -y \
        -loop 1 -t 4 -i intro.png \
        -loop 1 -t 6 -i paso_0.png \
        -loop 1 -t 6 -i paso_1.png \
        -loop 1 -t 6 -i paso_2.png \
        -loop 1 -t 6 -i paso_3.png \
        -loop 1 -t 6 -i paso_4.png \
        -loop 1 -t 4 -i outro.png \
        -filter_complex "
          [0:v]scale=1080:1920,setsar=1,fade=t=in:st=0:d=1[v0];
          [1:v]scale=1080:1920,setsar=1,zoompan=z='min(zoom+0.001,1.1)':d=150[v1];
          [2:v]scale=1080:1920,setsar=1,zoompan=z='min(zoom+0.001,1.1)':d=150[v2];
          [3:v]scale=1080:1920,setsar=1,zoompan=z='min(zoom+0.001,1.1)':d=150[v3];
          [4:v]scale=1080:1920,setsar=1,zoompan=z='min(zoom+0.001,1.1)':d=150[v4];
          [5:v]scale=1080:1920,setsar=1,zoompan=z='min(zoom+0.001,1.1)':d=150[v5];
          [6:v]scale=1080:1920,setsar=1,fade=t=out:st=3:d=1[v6];
          [v0][v1][v2][v3][v4][v5][v6]concat=n=7:v=1:a=0,
          drawbox=x=0:y=0:w=iw:h=ih:color=#D4AF37:t=12[video];
          [video]subtitles=subtitles.srt:force_style='FontSize=24,PrimaryColour=&HFFFFFF,OutlineColour=&H000000,Outline=2'
        " \
        -i background_music.mp3 \
        -c:v libx264 -preset fast -crf 23 \
        -c:a aac -shortest \
        output_vertical.mp4

  10_subir_drive:
    type: "Google Drive"
    operation: "upload"
    file: "/tmp/video_{{ $workflow.id }}/output_vertical.mp4"
    folder: "Tus Aguacates/Videos/{{ $json.categoria }}"

  11_limpiar_temp:
    type: "Execute Command"
    command: "rm -rf /tmp/video_{{ $workflow.id }}"

  12_notificar:
    type: "HTTP Request"
    method: "POST"
    url: "{{ $env.TIENDA_WEBHOOK }}"
    body:
      recipe_id: "{{ $json.recipe_id }}"
      video_url: "{{ $json.drive_url }}"
      status: "completed"
```

---

## Costos Mensuales Estimados

### Escenario: 60 videos/mes (2 diarios)

| Servicio | Uso | Costo |
|----------|-----|-------|
| Google AI Studio (Gemini) | ~180 requests | **$0** (free tier) |
| Google Imagen 3 | ~360 imágenes | **$0** (free tier)* |
| Google Drive | ~3GB videos | **$0** (incluido Premium) |
| Oracle Cloud | Procesamiento | **$0** (ya pagado) |
| Música libre | Archivos locales | **$0** |
| **TOTAL** | | **$0/mes** |

*Si se excede el límite de Imagen 3, alternativas:
- Ideogram AI: $7/mes (200 imágenes)
- Leonardo AI: $10/mes (150 imágenes)
- DALL-E (pago por uso): ~$3-5/mes para 360 imágenes

**Reserva de $5/mes**: Para emergencias o si necesitas más imágenes.

---

## Manejo del Storage Limitado (14GB)

### Estrategia de Limpieza Automática

```bash
#!/bin/bash
# cleanup_videos.sh - Ejecutar cada hora via cron

# Directorio de trabajo temporal
WORK_DIR="/tmp/video_work"
MAX_AGE_HOURS=2

# Limpiar archivos temporales viejos
find $WORK_DIR -type f -mmin +$((MAX_AGE_HOURS * 60)) -delete

# Verificar espacio disponible
AVAILABLE=$(df -BG /tmp | awk 'NR==2 {print $4}' | tr -d 'G')

if [ "$AVAILABLE" -lt 2 ]; then
  # Alerta: poco espacio
  echo "WARNING: Only ${AVAILABLE}GB available" | \
    curl -X POST $ALERT_WEBHOOK -d @-
fi
```

### Flujo de archivos

```
1. Generar imágenes → /tmp/video_XXXX/
2. Ensamblar video → /tmp/video_XXXX/output.mp4
3. Subir a Google Drive → Confirmar upload
4. Eliminar /tmp/video_XXXX/ → Liberar espacio
5. Solo mantener últimos 2-3 videos localmente para debugging
```

---

## Assets Necesarios (crear una vez)

### Archivos estáticos para videos

```
/home/n8n/video_assets/
├── intro_vertical.png      # Logo + espacio para título (1080x1920)
├── intro_horizontal.png    # Logo + espacio para título (1920x1080)
├── outro_vertical.png      # Logo + URL + CTA (1080x1920)
├── outro_horizontal.png    # Logo + URL + CTA (1920x1080)
├── frame_dorado.png        # Overlay PNG transparente con borde
├── fonts/
│   └── Montserrat-Bold.ttf # Font para subtítulos
└── music/
    ├── upbeat_cooking_1.mp3
    ├── upbeat_cooking_2.mp3
    └── chill_kitchen.mp3
```

### Recursos gratuitos para música:
- [Pixabay Music](https://pixabay.com/music/) - Libre de derechos
- [Mixkit](https://mixkit.co/free-stock-music/) - Gratuito
- [YouTube Audio Library](https://studio.youtube.com/channel/UC/music) - Para YouTube

---

## Fases de Implementación

### Fase 1: Setup Base (1-2 días)
- [ ] Instalar FFmpeg en Oracle Cloud
- [ ] Configurar rclone para Google Drive
- [ ] Crear API key en Google AI Studio
- [ ] Crear assets base (intro, outro, fonts)
- [ ] Workflow n8n básico de prueba

### Fase 2: Generación de Contenido (2-3 días)
- [ ] Workflow Gemini para generar recetas
- [ ] Workflow Imagen 3 para generar imágenes
- [ ] Template de prompts para consistencia visual
- [ ] Pruebas de calidad de imágenes

### Fase 3: Ensamblaje de Video (2-3 días)
- [ ] Script FFmpeg para slideshow
- [ ] Agregar Ken Burns effect (zoom lento)
- [ ] Integrar subtítulos hardcoded
- [ ] Agregar frame dorado
- [ ] Agregar música de fondo

### Fase 4: Automatización (1-2 días)
- [ ] Workflow completo end-to-end
- [ ] Upload automático a Google Drive
- [ ] Webhook de notificación a tienda
- [ ] Limpieza automática de archivos

### Fase 5: Integración Tienda (1 día)
- [ ] Actualizar página de receta para mostrar video
- [ ] Embed desde Google Drive o YouTube
- [ ] Botón para solicitar video desde admin

---

## Alternativas si Imagen 3 no es Suficiente

### Opción A: Usar DALL-E (OpenAI)
- Costo: $0.04/imagen = $14.40/mes para 360 imágenes
- **Excede presupuesto** pero mejor calidad

### Opción B: Ideogram AI
- Costo: $7/mes plan básico
- 100 imágenes/día = 3000/mes
- **Dentro del presupuesto** ✅

### Opción C: Leonardo AI
- Costo: $10/mes plan básico
- 150 imágenes/mes + tokens diarios
- **Ajustado pero viable**

### Opción D: Reducir Imágenes por Video
- Usar 4 imágenes en lugar de 6
- Reutilizar intro/outro
- 240 imágenes/mes = Más margen con Imagen 3

---

## Métricas de Éxito

| Métrica | Meta Mes 1 | Meta Mes 3 |
|---------|------------|------------|
| Videos generados | 30 | 60 |
| Tiempo por video | <10 min | <5 min |
| Costo por video | <$0.10 | <$0.05 |
| Calidad visual (1-10) | 7 | 8 |
| Engagement redes | Baseline | +20% |

---

## Riesgos y Mitigaciones

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|--------------|---------|------------|
| Límite Imagen 3 alcanzado | Media | Alto | Plan B con Ideogram ($7/mes) |
| Storage lleno | Media | Medio | Limpieza automática agresiva |
| Calidad imágenes inconsistente | Media | Medio | Templates de prompts estrictos |
| FFmpeg falla en ARM | Baja | Alto | Ya verificado que funciona |
| Google cambia límites free | Baja | Alto | Presupuesto de reserva |

---

## Próximos Pasos Inmediatos

1. **Verificar acceso a Google AI Studio**
   ```
   https://aistudio.google.com/
   ```
   - Crear proyecto
   - Generar API key
   - Probar Gemini 1.5 Pro
   - Probar Imagen 3

2. **Instalar FFmpeg en Oracle**
   ```bash
   # Para Ubuntu/Debian
   sudo apt update && sudo apt install ffmpeg

   # Para Oracle Linux
   sudo dnf install ffmpeg
   ```

3. **Configurar rclone para Google Drive**
   ```bash
   curl https://rclone.org/install.sh | sudo bash
   rclone config
   # Seguir wizard para Google Drive
   ```

4. **Crear workflow de prueba en n8n**
   - HTTP Request a Gemini
   - Guardar respuesta
   - Verificar formato

---

*Documento creado: 2024-12-26*
*Stack: Google AI + FFmpeg + n8n + Oracle Cloud ARM*
