// Script para arreglar TOOL_ADMIN_BorrarMemoriaCliente
const fs = require('fs');

const filePath = 'c:\\Users\\Usuario\\Documents\\proyecto tienda\\tus-aguacates\\n8n-workflows\\agente-luz-v6.5-admin-copiloto.json';
const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

// Buscar la herramienta
const tool = data.nodes.find(n => n.name === 'TOOL_ADMIN_BorrarMemoriaCliente');

if (tool) {
    console.log('Encontrada TOOL_ADMIN_BorrarMemoriaCliente');

    // Corregir el query para que sea más específico y devuelva solo una confirmación
    tool.parameters.query = `WITH deleted AS (
  DELETE FROM n8n_chat_histories 
  WHERE session_id = $1 
     OR session_id = '57' || $1
     OR session_id = '+57' || $1
  RETURNING session_id
)
SELECT 
  COUNT(*) as registros_eliminados,
  'Memoria borrada para: ' || $1 as mensaje
FROM deleted;`;

    tool.parameters.toolDescription = "ADMIN: Borrar MEMORIA de un cliente específico. Elimina SOLO las sesiones de chat del teléfono indicado. Ejemplo: 'Borra la memoria del 3161932558'";

    console.log('Query corregido - ahora es más específico y devuelve solo un resumen');
} else {
    console.log('No se encontró la herramienta');
}

// Guardar
fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
console.log('Archivo guardado!');
