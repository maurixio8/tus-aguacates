// =====================================================
// 🏷️ MARCAR BUFFER COMO PROCESADO
// =====================================================
// Uso: Después de enviar respuesta al cliente
// Marca los mensajes del buffer como procesados
// =====================================================

const mensajeIds = $input.item.json.mensaje_ids;
const clienteTelefono = $input.item.json.cliente_telefono;

if (!mensajeIds || mensajeIds.length === 0) {
    return [{
        json: {
            success: true,
            message: 'No hay mensajes del buffer para marcar'
        }
    }];
}

// SQL para marcar como procesados
const updateSQL = `
UPDATE mensaje_buffer 
SET procesado = true
WHERE id = ANY(ARRAY[${mensajeIds.join(',')}])
RETURNING id;
`;

return [{
    json: {
        clienteTelefono,
        mensajeIds,
        updateSQL,
        totalMarcados: mensajeIds.length
    }
}];
