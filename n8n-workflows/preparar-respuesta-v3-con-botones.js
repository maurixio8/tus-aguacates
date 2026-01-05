// =====================================================
// 📤 PREPARAR RESPUESTA v3 - CON BOTONES INTERACTIVOS
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
    .replace(/\[functions\.[^\]]+\]/g, '')
    .trim();

// Fallback
if (!mensaje) {
    mensaje = '¡Hola! 🥑 Gracias por escribirnos. ¿En qué puedo ayudarte hoy?';
}

// =====================================================
// FUNCIONES HELPER
// =====================================================

// Crear mensaje con botones
function crearMensajeConBotones(to, from, texto, botones) {
    return {
        from: from,
        to: to,
        type: 'interactive',
        interactive: {
            type: 'button',
            body: { text: texto },
            action: {
                buttons: botones.slice(0, 3).map((btn, i) => ({
                    type: 'reply',
                    reply: {
                        id: `btn_${i}_${Date.now()}`,
                        title: btn.substring(0, 20) // Max 20 caracteres
                    }
                }))
            }
        }
    };
}

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

// Crear mensaje de texto
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
let productoParaBotones = null;

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

        productoParaBotones = productoConImagen;
    }
}

// =====================================================
// DECIDIR TIPO DE RESPUESTA
// =====================================================
const mensajes = [];
const debeUsarBotones = productosEncontrados.length > 0 && !contexto.esMedia && !contexto.esRespuestaBoton;

// 1. Si hay imagen de producto, enviarla primero
if (imagenProducto && !contexto.esMedia) {
    mensajes.push(crearMensajeImagen(
        contexto.from,
        contexto.to,
        imagenProducto.url,
        `🥑 ${imagenProducto.nombre} - $${Number(imagenProducto.precio).toLocaleString('es-CO')}`
    ));
}

// 2. Decidir si enviar botones o texto simple
if (debeUsarBotones && productoParaBotones) {
    // Enviar texto con botones
    mensajes.push(crearMensajeConBotones(
        contexto.from,
        contexto.to,
        mensaje,
        ['✅ Agregar', '🔍 Ver otros', '🛒 Mi carrito']
    ));
} else {
    // Enviar texto simple
    mensajes.push(crearMensajeTexto(contexto.from, contexto.to, mensaje));
}

// Retornar todos los mensajes
return mensajes.map(m => ({ json: m }));
