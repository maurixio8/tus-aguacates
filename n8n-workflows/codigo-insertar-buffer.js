// =====================================================
// 📥 INSERTAR EN BUFFER - Nodo Code
// =====================================================
// Uso: Después del preprocesamiento, si debeUsarBuffer = true
// Inserta el mensaje en la tabla mensaje_buffer
// =====================================================

const preproceso = $input.item.json;

// Si no debe usar buffer, pasar al siguiente nodo
if (!preproceso.debeUsarBuffer) {
    return [{
        json: {
            ...preproceso,
            bufferUsado: false,
            accion: 'PROCESAR_INMEDIATO'
        }
    }];
}

// Preparar datos para insertar en buffer
const insertData = {
    cliente_telefono: preproceso.from.replace('57', ''),
    mensaje: preproceso.messageText,
    mensaje_type: preproceso.tipoMensaje || 'text',
    raw_data: JSON.stringify({
        customerName: preproceso.customerName,
        saludo: preproceso.saludo,
        terminoBusqueda: preproceso.terminoBusqueda,
        esSoloSaludo: preproceso.esSoloSaludo,
        timestamp: preproceso.timestamp
    })
};

// SQL de inserción
const insertSQL = `
INSERT INTO mensaje_buffer (cliente_telefono, mensaje, mensaje_type, raw_data)
VALUES ('${insertData.cliente_telefono}', 
        '${insertData.mensaje.replace(/'/g, "''")}', 
        '${insertData.mensaje_type}',
        '${insertData.raw_data.replace(/'/g, "''")}')
RETURNING id, timestamp;
`;

return [{
    json: {
        ...preproceso,
        bufferUsado: true,
        accion: 'INSERTAR_BUFFER',
        insertSQL,
        insertData
    }
}];
