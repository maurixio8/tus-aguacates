# Sistema de Contenido Social — TusAguacates

Creado: 2026-06-05, hora Colombia.

## Objetivo
Tener un sistema organizado para producir, guardar y programar publicaciones casi listas para redes sociales: imagen, carrusel, copy, prompts, estado, fecha sugerida y canal.

## Principio central
No crear imágenes sueltas. Cada pieza debe vivir como una publicación completa:

1. Tema
2. Formato
3. Guion visual
4. Prompt de imagen
5. Imagen generada
6. Copy para Instagram/Facebook
7. CTA a WhatsApp o tienda
8. Estado de aprobación
9. Fecha sugerida de publicación

## Carpeta de trabajo

```text
/opt/data/tus-aguacates/content/social/
├── README.md
├── brand-system.md
├── calendar-june-2026.md
├── content-pillars.md
├── production-pipeline.md
├── prompts/
│   └── prompt-madre-tusaguacates.md
├── templates/
│   ├── post-record-template.md
│   └── carousel-brief-template.md
├── drafts/
├── generated/
│   ├── images/
│   ├── carousels/
│   └── videos/
└── approved/
    ├── instagram/
    ├── facebook/
    └── whatsapp/
```

## Estados

- IDEA: tema suelto
- BRIEF: ya tiene estructura y copy
- PROMPT_READY: listo para generar imagen
- GENERATED: imagen generada
- REVIEW: pendiente de revisión Mao
- APPROVED: listo para programar
- SCHEDULED: programado en Postiz u otra cola
- PUBLISHED: publicado

## Reglas de marca

- El logo debe aparecer en piezas de TusAguacates.
- Logo principal: `/opt/data/profiles/helper/cache/images/tusaguacates_logo_primary_highres.jpg`
- Paleta: verde oscuro, verde aguacate, dorado/amarillo, blanco, madera natural.
- Estilo: fresco, saludable, natural, comercial, confiable.
- Evitar textos demasiado largos dentro de la imagen.
- Si la IA falla con texto, generar base visual y poner texto por edición final.

## Cadencia recomendada inicial

Para empezar sin saturarnos:

- 1 carrusel educativo por semana.
- 2 imágenes fijas de producto por semana.
- 1 pieza realista con persona por semana.
- 1 promoción/CTA por semana.
- Historias simples reutilizando las piezas principales.

Cuando el sistema esté estable, subir a 2 publicaciones por día.
