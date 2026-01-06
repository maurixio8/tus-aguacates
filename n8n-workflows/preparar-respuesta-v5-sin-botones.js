// =====================================================
// 📤 PREPARAR RESPUESTA v5 - SIN BOTONES + CON FORMATO
// =====================================================
// Última actualización: 2026-01-04
// CAMBIOS: Botones desactivados, saltos de línea agregados
// =====================================================
const respuestaIA = $input.first().json.output || $input.first().json.text || '';
const contexto = $('4. Merge Datos + Productos').first().json;

// Limpiar respuesta para WhatsApp
let mensaje = respuestaIA
    .replace(/\*\*/g, '*')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/\[functions\.[^\]]+\]/g, '')
    .trim();

// =====================================================
// FORMATEAR RESPUESTA (SALTOS DE LÍNEA)
// =====================================================

// 1. Agregar salto de línea después de punto + mayúscula
mensaje = mensaje.replace(/\. (?=[A-ZÁÉÍÓÚ¿¡])/g, '.\n\n');

// 2. Agregar salto de línea después de emojis de cierre
mensaje = mensaje.replace(/(😊|🥑|💚|✅)\s+(?=[A-ZÁÉÍÓÚ¿¡])/g, '$1\n\n');

// 3. "Recuerda" en nueva línea
mensaje = mensaje.replace(/\s*(Recuerda que)/gi, '\n\n$1');

// 4. Preguntas en nueva línea
mensaje = mensaje.replace(/\s+(\¿)/g, '\n\n$1');

// 5. Limpiar múltiples saltos de línea
mensaje = mensaje.replace(/\n{3,}/g, '\n\n');

mensaje = mensaje.trim();

// Fallback
if (!mensaje) {
    mensaje = '¡Hola! 🥑 Gracias por escribirnos. ¿En qué puedo ayudarte hoy?';
}

// =====================================================
// FUNCIONES HELPER
// =====================================================

// Crear mensaje de imagen
function crearMensajeImagen(to, from, urlImagen, caption) {
    return {
        from: from,
        to: to,
        type: 'image',
        image: {
            link: urlImagen,
            caption: caption
        }
    };
}

// Crear mensaje de texto simple
function crearMensajeTexto(to, from, texto) {
    return {
        from: from,
        to: to,
        type: 'text',
        text: { body: texto }
    };
}

// =====================================================
// DETECTAR SI HAY PRODUCTOS PARA MOSTRAR IMAGEN
// =====================================================
const productosEncontrados = contexto.productosEncontrados || [];
let imagenProducto = null;

if (productosEncontrados.length > 0) {
    const productoConImagen = productosEncontrados.find(p =>
        p.main_image_url && p.main_image_url.length > 0
    );

    if (productoConImagen) {
        let urlImagen = productoConImagen.main_image_url;

        // Supabase Storage: Usar transformación de imagen
        if (urlImagen.includes('supabase.co/storage') && urlImagen.includes('.webp')) {
            urlImagen = urlImagen
                .replace('/object/public/', '/render/image/public/')
                + '?format=origin';
        }

        imagenProducto = {
            url: urlImagen,
            nombre: productoConImagen.name,
            precio: productoConImagen.price
        };
    }
}

// =====================================================
// DECIDIR TIPO DE RESPUESTA (SIN BOTONES)
// =====================================================
const mensajes = [];

// 1. Si hay imagen de producto, enviarla primero
if (imagenProducto && !contexto.esMedia) {
    mensajes.push(crearMensajeImagen(
        contexto.from,
        contexto.to,
        imagenProducto.url,
        `🥑 ${imagenProducto.nombre} - $${Number(imagenProducto.precio).toLocaleString('es-CO')}`
    ));
}

// 2. SIEMPRE enviar texto simple (botones desactivados)
mensajes.push(crearMensajeTexto(contexto.from, contexto.to, mensaje));

// Retornar todos los mensajes
return mensajes.map(m => ({ json: m }));
