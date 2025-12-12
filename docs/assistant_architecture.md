# 🧠 Blueprint: Arquitectura del Asistente "Sin Límites"

Este documento detalla el funcionamiento interno (Frontend + n8n) para el caso de uso "Ana la Compradora Social", aprovechando que no tenemos las restricciones de WhatsApp.

## 1. El Concepto: "Conversación Vivo" (Multi-Mensaje)
A diferencia de un bot tradicional que hace `Pregunta -> Respuesta`, nuestro asistente actuará como una persona real: envía un mensaje, piensa, envía otro, y luego muestra una foto.

### Caso de Uso: "Ana y el Guacamole"
**Usuario:** Ana entra a la tienda. (No hace nada)
**Tiempo:** 5 segundos después.

---
**SECUENCIA AUTOMÁTICA DEL ASISTENTE (El "Script"):**

1.  **Burbuja 1 (Inmediato):**
    > *"¡Hola Ana! 👋 Qué bueno verte de nuevo."*
2.  **Estado:** *Escribiendo... (2 segundos)*
3.  **Burbuja 2:**
    > *"Hoy llegaron unos Hass increíbles de la finca. ¿Estás buscando para hoy o para la semana?"*
4.  **Elemento Visual:** (Aparecen 2 Botones grandes con íconos)
    `[ 🥑 Para Hoy (Maduros) ]`   `[ 📅 Para la Semana (Verdes) ]`

---
**INTERACCIÓN:**
**Ana:** Presiona `[ 🥑 Para Hoy ]`

---
**RESPUESTA DEL ASISTENTE:**

1.  **Estado:** *Buscando en bodega... (1 segundo)*
2.  **Burbuja 1:**
    > *"¡Listo! Tengo estos 'Listos para Comer'. Son mantequilla pura."*
3.  **Tarjeta de Producto:** (Muestra la foto del **Pack x4 Premium**)
    *   Precio: $9.900
    *   Botón: [Agregar 1 Pack]
4.  **Burbuja 2 (Upsell Inmediato):**
    > *"Oye, ¿llevas nachos o tostadas para acompañar? 👀"*

---

## 2. La Maquinaria Interna (Backend n8n)

¿Cómo logramos esto? Aquí está la radiografía del flujo en **n8n**.

### El Input (Lo que recibe n8n)
Cuando Ana entra o hace clic, nuestra web envía este paquete a n8n:
```json
{
  "action": "greeting" (o "button_click"),
  "userId": "ana-uuid-123",
  "context": { "page": "/tienda", "lastOrder": "hace 7 días" }
}
```

### El Procesamiento (Los Nodos de n8n)

1.  **Nodo 1: Webhook (La Oreja)**
    *   Recibe el paquete.
2.  **Nodo 2: El Cerebro (Switch / AI)**
    *   Si `action == "greeting"`: Consulta en Supabase quién es "ana-uuid-123".
    *   *Supabase devuelve:* Ana compró "Aguacates" e "Hiciste clic en Salir" la última vez.
3.  **Nodo 3: El Guionista (Code Node)**
    *   Aquí es donde definimos la "Personalidad". Construimos un array de mensajes (JSON) para simular la charla natural.

### El Output (La Respuesta "Sin Límites")
En lugar de devolver un texto simple, n8n devuelve un **Guion de Ejecución** para el Frontend:

```json
{
  "timeline": [
    { "type": "text", "content": "¡Hola Ana!", "delay": 0 },
    { "type": "typing", "duration": 2000 },
    { "type": "text", "content": "¿Para hoy o para la semana?", "delay": 0 },
    { "type": "buttons", "options": ["Para Hoy", "Para Semana"] }
  ]
}
```

## 3. Almacenamiento de Datos (Memoria)
¿Dónde guardamos lo que Ana dice?

**Opción A (Simple/Rápida - Recomendada MVP):**
*   **Memoria Volátil:** El historial vive en la ventana del chat (Frontend).
*   **n8n:** No guarda nada, solo reacciona al contexto que le enviamos en cada mensaje.

**Opción B (Robusta - Futuro):**
*   **Tabla Supabase `chat_history`:**
    *   Cada mensaje se guarda en DB.
    *   Permite que si Ana recarga la página, el chat sigue ahí.
    *   Permite análisis posterior de "Qué piden los clientes".

## Conclusión
Socio, para lograr el efecto "No Aburrido":
1.  **Frontend:** Debe aprender a leer el `timeline` (mensaje -> espera -> mensaje).
2.  **n8n:** Debe configurarse para enviar respuestas fragmentadas, no bloques de texto gigantes.

¿Te gusta esta arquitectura de "Timeline"? Es lo que usan las apps de mensajería modernas para retener atención.
