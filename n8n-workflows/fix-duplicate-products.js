// Fix para evitar texto duplicado - simplificar productosTexto
const fs = require('fs');

const filePath = 'c:\\Users\\Usuario\\Documents\\proyecto tienda\\tus-aguacates\\n8n-workflows\\agente-luz-v6.5-admin-copiloto.json';
const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

const mergeNode = data.nodes.find(n => n.name === '4. Merge Datos + Productos');

if (mergeNode) {
    // Nuevo código que formatea productos de manera que el AI los use directamente
    // sin necesidad de reformatearlos (evita duplicación)
    const nuevoJsCode = `// Combinar datos del cliente y resultados de búsqueda
// v4: FORMATO SIMPLE para evitar duplicación

const preproceso = $('1. Pre-procesamiento YCloud').first().json;
const cliente = $('2. Obtener Cliente').first().json;

// Obtener productos de búsqueda
let productosEncontrados = [];
try {
  const busquedaItems = $('3. Búsqueda Automática Productos').all();
  productosEncontrados = busquedaItems
    .map(item => item.json)
    .filter(p => p && p.id && p.name && typeof p.price !== 'undefined');
} catch (e) {
  productosEncontrados = [];
}

// Formatear productos de forma SIMPLE
// El AI solo debe COPIAR esto, no reformatearlo
let productosTexto = '';
if (productosEncontrados.length > 0) {
  // Crear texto ya listo para que el AI lo use tal cual
  const lineas = [];
  
  productosEncontrados.forEach(p => {
    // Si tiene variantes, mostrar cada variante como una línea
    if (p.variantes && Array.isArray(p.variantes) && p.variantes.length > 0) {
      p.variantes.forEach(v => {
        lineas.push(\`• \${p.name} - \${v.presentacion} $\${Number(v.precio).toLocaleString('es-CO')} [ID:\${p.id}]\`);
      });
    } else {
      // Sin variantes, mostrar producto base
      lineas.push(\`• \${p.name} - $\${Number(p.price).toLocaleString('es-CO')} [ID:\${p.id}]\`);
    }
  });
  
  // Eliminar duplicados
  productosTexto = [...new Set(lineas)].join('\\n');
} else if (preproceso.debeHacerBusqueda && preproceso.terminoBusqueda) {
  productosTexto = \`❌ No se encontraron productos para: "\${preproceso.terminoBusqueda}"\`;
} else {
  productosTexto = '(No se realizó búsqueda)';
}

// Contexto de tiempo
const now = new Date();
const dayOfWeek = now.getDay();
const hour = now.getHours();
const pasoCutoff = hour >= 10;

let diasHastaEntrega, mensajeEntrega;
switch(dayOfWeek) {
  case 0: diasHastaEntrega = 2; mensajeEntrega = "Próxima entrega: Martes"; break;
  case 1: diasHastaEntrega = 1; mensajeEntrega = "Próxima entrega: Martes"; break;
  case 2: 
    if (pasoCutoff) { diasHastaEntrega = 3; mensajeEntrega = "Próxima entrega: Viernes"; }
    else { diasHastaEntrega = 0; mensajeEntrega = "¡Entrega HOY antes 10AM!"; }
    break;
  case 3: diasHastaEntrega = 2; mensajeEntrega = "Próxima entrega: Viernes"; break;
  case 4: diasHastaEntrega = 1; mensajeEntrega = "Próxima entrega: Viernes"; break;
  case 5:
    if (pasoCutoff) { diasHastaEntrega = 4; mensajeEntrega = "Próxima entrega: Martes"; }
    else { diasHastaEntrega = 0; mensajeEntrega = "¡Entrega HOY antes 10AM!"; }
    break;
  case 6: diasHastaEntrega = 3; mensajeEntrega = "Próxima entrega: Martes"; break;
  default: diasHastaEntrega = 1; mensajeEntrega = "Próxima entrega: Martes o Viernes";
}

const fechaEntrega = new Date(now);
fechaEntrega.setDate(now.getDate() + diasHastaEntrega);
const proximaEntrega = fechaEntrega.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' });
const fechaActual = now.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
const horaActual = now.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', hour12: true });

return {
  json: {
    clienteId: cliente.id,
    clienteTelefono: cliente.telefono,
    clienteNombre: cliente.nombre || 'No registrado',
    clienteEstado: cliente.estado_conversacion,
    clienteDireccion: cliente.direccion || '',
    clienteCarrito: cliente.pre_pedido || [],
    clienteTotalPedidos: cliente.total_pedidos || 0,
    
    mensajeCliente: preproceso.messageText,
    terminoBusqueda: preproceso.terminoBusqueda,
    esIntentoBusqueda: preproceso.esIntentoBusqueda,
    
    productosEncontrados,
    productosTexto,
    
    from: preproceso.from,
    to: preproceso.to,
    saludo: preproceso.saludo,
    
    fechaActual, horaActual, horaNumero: hour, diaNumero: dayOfWeek,
    pasoCutoff, proximaEntrega, mensajeEntrega, diasHastaEntrega
  }
};`;

    mergeNode.parameters.jsCode = nuevoJsCode;
    console.log('✅ Merge actualizado: formato simple sin duplicación');
}

// También actualizar System Message para decirle que NO reformatee
const agentNode = data.nodes.find(n => n.name === '🤖 Agente Luz v4');
if (agentNode && agentNode.parameters && agentNode.parameters.options) {
    let msg = agentNode.parameters.options.systemMessage || '';

    // Agregar instrucción de no duplicar
    const instruccion = `

### ⚠️ NO DUPLIQUES PRODUCTOS
Los productos en \`productosTexto\` ya están formateados.
**COPIA las líneas tal cual**, no las reescribas.
Solo agrega el emoji correspondiente al inicio de cada línea.

`;

    if (!msg.includes('NO DUPLIQUES PRODUCTOS')) {
        msg = msg.replace('## 🎯 IDENTIDAD', instruccion + '## 🎯 IDENTIDAD');
        agentNode.parameters.options.systemMessage = msg;
        console.log('✅ System Message: instrucción de no duplicar agregada');
    }
}

fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
console.log('Archivo guardado!');
