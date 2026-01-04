// =====================================================
// 📸 NODO PREPARAR Y ENVIAR IMAGEN - YCLOUD
// =====================================================
// Última actualización: 2025-12-21
// 
// Este código va en un nodo "Code" de n8n
// Se ejecuta DESPUÉS del agente y ANTES de enviar el mensaje
// =====================================================

// Obtener datos del contexto
const respuestaAgente = $input.first().json.output || $input.first().json.text || '';
const preprocesamiento = $('1. Pre-procesamiento YCloud').first().json;
const productosEncontrados = $('TOOL_BuscarProductos')?.all() || [];

// Configuración
const from = preprocesamiento.to; // Número de Tus Aguacates
const to = preprocesamiento.from; // Número del cliente

// =====================================================
// PASO 1: Detectar si hay productos mencionados
// =====================================================

// Buscar si hay productos con imagen disponible
let imagenAEnviar = null;
let captionImagen = '';

if (productosEncontrados.length > 0) {
    // Buscar el primer producto con imagen válida que se mencione en la respuesta
    for (const item of productosEncontrados) {
        const producto = item.json;

        // Verificar si el producto tiene imagen
        if (producto.main_image_url && producto.main_image_url.trim() !== '') {
            // Verificar si el nombre del producto se menciona en la respuesta
            const nombreLower = producto.name.toLowerCase();
            const respuestaLower = respuestaAgente.toLowerCase();

            if (respuestaLower.includes(nombreLower) ||
                respuestaLower.includes(nombreLower.split(' ')[0])) {

                imagenAEnviar = producto.main_image_url;

                // Crear caption atractivo
                const precio = producto.precio || producto.price || producto.discount_price;
                const precioFormateado = new Intl.NumberFormat('es-CO', {
                    style: 'currency',
                    currency: 'COP',
                    minimumFractionDigits: 0
                }).format(precio);

                captionImagen = `🥑 ${producto.name}\n💰 ${precioFormateado}`;

                break; // Usar el primer producto que coincida
            }
        }
    }
}

// =====================================================
// PASO 2: Preparar mensaje de texto
// =====================================================

let mensajeTexto = respuestaAgente
    .replace(/\*\*/g, '*') // Markdown bold a WhatsApp bold
    .replace(/\n{3,}/g, '\n\n') // Múltiples saltos a máximo 2
    .trim();

// Fallback si no hay respuesta
if (!mensajeTexto) {
    mensajeTexto = '¡Hola! 🥑 Gracias por escribirnos. ¿En qué puedo ayudarte hoy?';
}

// =====================================================
// PASO 3: Retornar resultado
// =====================================================

const resultado = {
    // Datos del mensaje de texto
    from: from,
    to: to,
    mensajeTexto: mensajeTexto,

    // Datos de la imagen (si existe)
    tieneImagen: imagenAEnviar !== null,
    imagenUrl: imagenAEnviar,
    imagenCaption: captionImagen,

    // Payloads listos para YCloud
    payloadTexto: {
        from: from,
        to: to,
        type: 'text',
        text: {
            body: mensajeTexto
        }
    },

    // Payload de imagen (solo si hay imagen)
    payloadImagen: imagenAEnviar ? {
        from: from,
        to: to,
        type: 'image',
        image: {
            link: imagenAEnviar,
            caption: captionImagen
        }
    } : null,

    // Metadata para logging
    _metadata: {
        telefono: to,
        timestamp: new Date().toISOString(),
        productoDetectado: imagenAEnviar ? true : false
    }
};

return { json: resultado };
