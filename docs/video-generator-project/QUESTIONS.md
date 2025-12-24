# Preguntas para Planificación del Video Generator

> Por favor responde estas preguntas para poder planificar correctamente el proyecto.
> Puedes editar este archivo directamente con tus respuestas.

---

## Sección 1: Infraestructura Oracle Cloud

### 1.1 ¿La instancia es ARM (Ampere) o x86?

> Respuesta:

```
[ ] ARM (Ampere A1) - Es el free tier de Oracle
[ ] x86 (AMD/Intel)
```

**Por qué importa**: Algunos programas como ComfyUI tienen limitaciones en ARM. También Docker images pueden variar.

---

### 1.2 ¿Cuánto almacenamiento disponible tienes?

> Respuesta: _____ GB

**Por qué importa**:
- Un video de 30s en HD puede pesar 20-50MB
- Modelos de IA (si se usan localmente) pesan 2-10GB cada uno
- Sistema operativo y programas: ~20GB
- **Mínimo recomendado**: 100GB

---

### 1.3 ¿Tienes Docker instalado?

> Respuesta:

```
[ ] Sí
[ ] No, pero puedo instalarlo
[ ] No, y prefiero no usarlo
```

**Por qué importa**: Docker facilita enormemente el deployment y mantenimiento.

---

### 1.4 ¿Qué sistema operativo tiene la instancia?

> Respuesta:

```
[ ] Ubuntu 20.04
[ ] Ubuntu 22.04
[ ] Oracle Linux
[ ] Otro: _____
```

---

### 1.5 ¿Tienes GPU disponible?

> Respuesta:

```
[ ] Sí - Modelo: _____
[ ] No
```

**Por qué importa**: Sin GPU, usaremos APIs en la nube para generación de imágenes. Con GPU podríamos correr Stable Diffusion localmente (gratis pero más complejo).

---

## Sección 2: n8n

### 2.1 ¿Qué versión de n8n tienes?

> Respuesta: _____

Puedes verificarlo en la interfaz de n8n o con: `n8n --version`

---

### 2.2 ¿n8n está en la misma instancia de Oracle Cloud?

> Respuesta:

```
[ ] Sí, misma instancia
[ ] No, está en otro servidor
```

Si está en otro servidor, ¿cuál es la dirección? _____

---

### 2.3 ¿En qué puerto corre n8n?

> Respuesta: Puerto _____

(Por defecto es 5678)

---

### 2.4 ¿n8n tiene acceso a internet para llamar APIs externas?

> Respuesta:

```
[ ] Sí, sin restricciones
[ ] Sí, pero con firewall/restricciones
[ ] No estoy seguro
```

---

## Sección 3: Dominio y Acceso

### 3.1 ¿Tienes un dominio/subdominio disponible para el video generator?

> Respuesta:

```
[ ] Sí: _____.tusaguacates.com (u otro)
[ ] No, pero puedo crear uno
[ ] No, usaré solo IP directa
```

**Por qué importa**: Un dominio facilita el acceso y permite HTTPS.

---

### 3.2 ¿El sistema debe ser accesible públicamente o solo interno?

> Respuesta:

```
[ ] Público (accesible desde internet con autenticación)
[ ] Solo red interna / VPN
[ ] Solo comunicación API con la tienda (no interfaz pública)
```

---

### 3.3 ¿Tienes certificado SSL o usas Let's Encrypt?

> Respuesta:

```
[ ] Sí, tengo certificados
[ ] Uso Let's Encrypt (Certbot)
[ ] No tengo SSL configurado
[ ] No estoy seguro
```

---

## Sección 4: Presupuesto y APIs

### 4.1 ¿Cuál es tu presupuesto mensual aproximado para APIs de IA?

> Respuesta: $_____ USD/mes

**Referencia de costos:**
- Uso básico (5-10 videos/mes): $20-40/mes
- Uso moderado (20-40 videos/mes): $50-100/mes
- Uso intensivo (100+ videos/mes): $150-300/mes

---

### 4.2 ¿Ya tienes cuentas en alguno de estos servicios?

> Respuesta:

```
[ ] OpenAI (GPT, DALL-E)
[ ] Anthropic (Claude)
[ ] ElevenLabs (voz)
[ ] Runway
[ ] Midjourney
[ ] Ninguno
[ ] Otros: _____
```

---

### 4.3 ¿Prefieres procesar localmente o usar servicios en la nube?

> Respuesta:

```
[ ] Preferencia por la nube (más fácil, costo mensual)
[ ] Preferencia por local (más complejo, sin costo recurrente)
[ ] Híbrido (lo más eficiente en cada caso)
[ ] No tengo preferencia, lo que funcione mejor
```

---

## Sección 5: Volumen y Uso

### 5.1 ¿Cuántos videos planeas generar por semana?

> Respuesta:

```
[ ] 1-3 videos/semana (empezando)
[ ] 4-7 videos/semana (moderado)
[ ] 8-15 videos/semana (intensivo)
[ ] Más de 15/semana
```

---

### 5.2 ¿Quién va a usar el sistema?

> Respuesta:

```
[ ] Solo yo
[ ] Yo y 1-2 personas más
[ ] Un equipo de 3+ personas
```

---

### 5.3 ¿Necesitas que múltiples personas puedan usarlo simultáneamente?

> Respuesta:

```
[ ] No, uno a la vez está bien
[ ] Sí, 2-3 personas al tiempo
[ ] Sí, varias personas concurrentemente
```

---

## Sección 6: Integración con la Tienda

### 6.1 ¿Cómo prefieres que se comunique con la tienda?

> Respuesta:

```
[ ] API directa (el video generator consulta la tienda)
[ ] Webhooks (la tienda notifica al generator cuando hay nueva receta)
[ ] Base de datos compartida (ambos usan Supabase)
[ ] Manual (copiar/pegar información)
[ ] Combinación: _____
```

---

### 6.2 ¿Los videos generados deben verse en la tienda web?

> Respuesta:

```
[ ] Sí, embebidos en las páginas de recetas
[ ] No, solo en redes sociales
[ ] Ambos
```

---

### 6.3 ¿Necesitas que la tienda muestre el estado de generación del video?

> Respuesta:

```
[ ] Sí, quiero ver "Generando...", "Listo", etc.
[ ] No, solo me importa cuando esté terminado
```

---

## Sección 7: Redes Sociales

### 7.1 ¿En qué redes sociales publicas actualmente?

> Respuesta:

```
[ ] Instagram
[ ] TikTok
[ ] YouTube
[ ] Facebook
[ ] Ninguna todavía
[ ] Otras: _____
```

---

### 7.2 ¿Tienes cuentas de negocio/creador en estas plataformas?

> Respuesta:

```
[ ] Instagram Business
[ ] TikTok Business
[ ] YouTube Brand Account
[ ] No, son cuentas personales
[ ] No tengo cuentas aún
```

**Por qué importa**: Las cuentas de negocio permiten publicación vía API.

---

### 7.3 ¿Quieres publicación automática o solo generación del video?

> Respuesta:

```
[ ] Solo generar el video, yo lo subo manualmente
[ ] Publicación automática sería ideal
[ ] Programar publicación para después
```

---

## Sección 8: Prioridades

### 8.1 Ordena estas features por prioridad (1 = más importante)

> Respuesta:

```
[ ] ___ Generación automática de recetas con IA
[ ] ___ Videos de recetas con imágenes animadas
[ ] ___ Videos con voz narrada
[ ] ___ Escenarios virtuales consistentes
[ ] ___ Publicación automática en redes
[ ] ___ Tutoriales de la app/tienda
[ ] ___ Inserción de productos en escenas
```

---

### 8.2 ¿Cuál es tu mayor preocupación o riesgo?

> Respuesta libre:




---

### 8.3 ¿Hay algún deadline o fecha importante?

> Respuesta:

```
[ ] No, es a mi ritmo
[ ] Sí, necesito algo funcionando para: _____
```

---

## Notas Adicionales

> Espacio para cualquier otra información relevante que quieras compartir:




---

## Siguiente Paso

Una vez respondidas estas preguntas, podré:

1. Definir la arquitectura exacta
2. Elegir las tecnologías correctas
3. Crear un plan de implementación realista
4. Estimar costos mensuales
5. Empezar el desarrollo

---

*Última actualización: 2024-12-24*
