// Formatear mensaje de recordatorio - VERSIÓN MEJORADA
// Muestra variantes y calcula subtotales correctamente

const cliente = $input.first().json;
const nombre = cliente.nombre || 'amigo/a';
const prePedido = cliente.pre_pedido || [];
const totalCarrito = Number(cliente.total_carrito) || 0;
const horasInactivo = Math.floor(cliente.horas_inactivo || 0);

// Formatear lista de productos CON VARIANTES
let productosTexto = '';
if (Array.isArray(prePedido) && prePedido.length > 0) {
    productosTexto = prePedido.map((item, i) => {
        let nombreProducto = item.producto_nombre || 'Producto';

        // Agregar variante si existe
        if (item.variante_nombre) {
            nombreProducto += ` (${item.variante_nombre})`;
        } else if (item.variante_id) {
            // Si hay ID pero no nombre, indicarlo
            nombreProducto += ` (var. ${item.variante_id})`;
        }

        const precioUnitario = Number(item.precio) || 0;
        const cantidad = item.cantidad || 1;
        const subtotal = precioUnitario * cantidad;

        // Si cantidad > 1, mostrar subtotal
        if (cantidad > 1) {
            return `-> ${nombreProducto} x${cantidad} = $${subtotal.toLocaleString('es-CO')}`;
        } else {
            return `-> ${nombreProducto} - $${precioUnitario.toLocaleString('es-CO')}`;
        }
    }).join('\n');
} else {
    productosTexto = '-> Tu carrito tiene productos esperandote';
}

// Calcular día de entrega
const now = new Date();
const dayOfWeek = now.getDay(); // 0=Dom, 1=Lun, etc.
let proximaEntrega = 'Martes';
if (dayOfWeek >= 2 && dayOfWeek <= 4) {
    proximaEntrega = 'Viernes';
} else {
    proximaEntrega = 'Martes';
}

// Mensaje SIN emojis problemáticos, SIN negritas
const mensaje = `Hola ${nombre}!

Olvidaste algo? Vi que tienes productos en tu carrito:

${productosTexto}

TOTAL: $${totalCarrito.toLocaleString('es-CO')}

Si completas ahora, te llega el ${proximaEntrega}

Que te gustaria hacer?`;

return {
    json: {
        telefono: cliente.telefono,
        nombre: nombre,
        mensaje: mensaje,
        totalCarrito: totalCarrito,
        horasInactivo: horasInactivo
    }
};
