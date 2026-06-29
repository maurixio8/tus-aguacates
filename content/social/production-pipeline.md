# Pipeline de Producción Automatizable — TusAguacates

## Visión
Crear una fábrica de contenido donde solo cambiemos el tema y el sistema produzca casi todo:

Tema → Brief → Prompt → Imagen → Copy → Carpeta de publicación → Revisión → Programación

## Unidad de trabajo: Post Record
Cada publicación debe tener un archivo markdown con:

- ID único.
- Fecha sugerida.
- Pilar de contenido.
- Formato.
- Tema.
- Producto relacionado.
- Objetivo.
- Brief visual.
- Prompt principal.
- Prompt negativo.
- Copy Instagram/Facebook.
- CTA.
- Estado.
- Rutas de imágenes.

## Fases

### Fase 1 — Base manual asistida
Hermes crea briefs, prompts, copys y genera imágenes una por una. Mao revisa y aprueba.

Entregable: 20 publicaciones listas en carpetas.

### Fase 2 — Semi-automática
Hermes toma una tabla de temas y genera lote de prompts + imágenes + copy.

Entregable: calendario semanal con piezas generadas.

### Fase 3 — Automática con revisión
Cron diario/semanal genera propuestas y las deja en REVIEW. Mao solo aprueba o pide cambios.

Entregable: cola constante de contenido.

### Fase 4 — Programación
Cuando esté aprobado, crear posts en Postiz para Instagram y Facebook con la misma fecha, caption e imagen.

## Carpeta por publicación

Ejemplo:

```text
drafts/2026-06-08-premium-500g/
├── post.md
├── prompt.txt
├── copy.txt
├── image-01.png
├── image-02.png
└── final.png
```

## Tipos de producción

### Carrusel educativo
- 4 a 5 imágenes.
- Ideal para beneficios, tips y recetas.
- Más trabajo, más valor de marca.

### Imagen fija realista
- 1 imagen.
- Ideal para producto, promociones y antojo.
- Rápida de producir.

### Imagen con personas
- 1 imagen.
- Ideal para emoción y vida cotidiana.
- Requiere revisión visual estricta: manos, caras, comida, naturalidad.

### Animación ligera
- 1 imagen base + movimiento suave.
- Ideal para reels o historias.
- Más adelante: usar video_gen o herramientas tipo Runway/FAL/xAI si están disponibles.

## Control de calidad

Antes de aprobar una imagen:

- Logo visible y correcto.
- Producto reconocible.
- Estética verde/dorada de marca.
- Sin texto mal escrito.
- Sin manos deformes si hay personas.
- Sin números de pago.
- Sin confundir tienda con web.
- Si es CTA, que sea claro.

## Automatización propuesta

Crear un script futuro: `scripts/generate_social_batch.py`

Entrada:

```yaml
week: 2026-06-08
posts:
  - theme: Aguacate Premium 500g
    format: product_realistic
    pillar: producto_fresco
  - theme: Aguacate y manzana
    format: educational_carousel
    pillar: bienestar
```

Salida:

- Carpeta por post.
- Prompt.
- Copy.
- Imagen generada.
- Estado REVIEW.

## Decisión recomendada
Empezar con 30 días de contenido base, pero producir primero 7 días completos para validar estilo y velocidad.
