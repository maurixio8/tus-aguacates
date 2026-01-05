// =====================================================
// 📤 PREPARAR RESPUESTA v2 - CON SOPORTE DE IMÁGENES
// =====================================================
// Última actualización: 2025-12-21
// Copia este código en el nodo "Preparar Respuesta"
// =====================================================

const respuestaIA = $input.first().json.output || $input.first().json.text || '';
const contexto = $('4. Merge Datos + Productos').first().json;

// Limpiar respuesta para WhatsApp
let mensaje = respuestaIA
    .replace(/\*\*/g, '*')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/\[functions\.[^\]]+\]/g, '') // Remover llamadas a funciones
    .trim();

// Fallback
if (!mensaje) {
    mensaje = '¡Hola! 🥑 Gracias por escribirnos. ¿En qué puedo ayudarte hoy?';
}

// =====================================================
// DETECTAR SI HAY PRODUCTOS PARA MOSTRAR IMAGEN
// =====================================================
const productosEncontrados = contexto.productosEncontrados || [];
let imagenProducto = null;

// Si hay productos encontrados y la respuesta menciona uno
if (productosEncontrados.length > 0) {
    // Buscar el primer producto con imagen
    const productoConImagen = productosEncontrados.find(p =>
        p.main_image_url &&
        p.main_image_url.includes('cloudinary')
    );

    if (productoConImagen) {
        imagenProducto = {
            url: productoConImagen.main_image_url,
            nombre: productoConImagen.name,
            precio: productoConImagen.price
        };
    }
}

// =====================================================
// PREPARAR MENSAJES A ENVIAR
// =====================================================
const mensajes = [];

// 1. Si hay imagen de producto, enviarla primero
if (imagenProducto && !contexto.esMedia) {
    mensajes.push({
        from: contexto.to,
        to: contexto.from,
        type: 'image',
        image: {
            link: imagenProducto.url,
            caption: `🥑 ${imagenProducto.nombre} - $${Number(imagenProducto.precio).toLocaleString('es-CO')}`
        }
    });
}

// 2. El mensaje de texto siempre
mensajes.push({
    from: contexto.to,
    to: contexto.from,
    type: 'text',
    text: {
        body: mensaje
    }
});

// Retornar todos los mensajes
return mensajes.map(m => ({ json: m }));
