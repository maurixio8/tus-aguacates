// =====================================================
// ✨ FORMATEADOR DE RESPUESTA v1
// =====================================================
// Agrega saltos de línea después de cada punto
// para que los mensajes se vean más legibles
// =====================================================

const input = $input.item.json;

// Obtener la respuesta del agente
let respuesta = input.output || '';

// Si no hay respuesta, pasar sin cambios
if (!respuesta) {
    return [{ json: input }];
}

// =====================================================
// FORMATEO DE LA RESPUESTA
// =====================================================

// 1. Reemplazar ". " por ".\n\n" (punto seguido de espacio = nuevo párrafo)
respuesta = respuesta.replace(/\. (?=[A-ZÁÉÍÓÚ¿¡])/g, '.\n\n');

// 2. Agregar salto de línea después de ":" si es seguido de texto largo
respuesta = respuesta.replace(/: (?=[A-ZÁÉÍÓÚ])/g, ':\n');

// 3. Agregar salto de línea después de "😊" o "🥑" o emojis de cierre
respuesta = respuesta.replace(/(😊|🥑|💚|✅)\s+(?=[A-ZÁÉÍÓÚ¿¡])/g, '$1\n\n');

// 4. Asegurar que "Recuerda" empiece en nueva línea
respuesta = respuesta.replace(/\s*(Recuerda que)/gi, '\n\n$1');

// 5. Asegurar que preguntas empiecen en nueva línea
respuesta = respuesta.replace(/\s+(\¿)/g, '\n\n$1');

// 6. Limpiar múltiples saltos de línea consecutivos (máximo 2)
respuesta = respuesta.replace(/\n{3,}/g, '\n\n');

// 7. Limpiar espacios al inicio y final
respuesta = respuesta.trim();

// Devolver con la respuesta formateada
return [{
    json: {
        ...input,
        output: respuesta
    }
}];
