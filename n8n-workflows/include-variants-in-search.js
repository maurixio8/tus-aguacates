// Script para incluir VARIANTES directamente en la Búsqueda Automática de Productos
const fs = require('fs');

const filePath = 'c:\\Users\\Usuario\\Documents\\proyecto tienda\\tus-aguacates\\n8n-workflows\\agente-luz-v6.5-admin-copiloto.json';
const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

// 1. Modificar "3. Búsqueda Automática Productos" para incluir variantes
const busquedaNode = data.nodes.find(n => n.name === '3. Búsqueda Automática Productos');

if (busquedaNode) {
    // Nueva query que incluye variantes usando JSON_AGG
    const nuevaQuery = `WITH search_terms AS (
  SELECT '{{ $json.terminoBusqueda }}' as term_original, 
  CASE 
    WHEN '{{ $json.terminoBusqueda }}' ~ 'es$' AND LENGTH('{{ $json.terminoBusqueda }}') > 4 
    THEN TRIM(TRAILING 'es' FROM '{{ $json.terminoBusqueda }}') 
    WHEN '{{ $json.terminoBusqueda }}' ~ 's$' AND LENGTH('{{ $json.terminoBusqueda }}') > 3 
    THEN TRIM(TRAILING 's' FROM '{{ $json.terminoBusqueda }}') 
    ELSE '{{ $json.terminoBusqueda }}' 
  END as term_base
)
SELECT DISTINCT 
  p.id, 
  p.name, 
  p.price, 
  p.main_image_url, 
  p.description, 
  p.category_name, 
  p.stock, 
  p.supabase_id,
  CASE 
    WHEN LOWER(p.name) LIKE LOWER(s.term_base) || '%' THEN 1 
    WHEN LOWER(p.category_name) LIKE '%' || LOWER(s.term_base) || '%' THEN 2 
    WHEN LOWER(p.name) LIKE '%' || LOWER(s.term_base) || '%' THEN 3 
    WHEN LOWER(p.description) LIKE '%' || LOWER(s.term_base) || '%' THEN 4 
    ELSE 5 
  END as match_priority,
  COALESCE(
    (SELECT json_agg(json_build_object(
      'variante_id', v.id,
      'tipo', v.variant_name,
      'presentacion', v.variant_value,
      'precio', v.price,
      'stock', v.stock_quantity
    ) ORDER BY v.price)
    FROM variantes_productos v 
    WHERE v.product_supabase_id = p.supabase_id 
    AND v.is_active = true),
    '[]'::json
  ) as variantes
FROM public.productos_tienda p, search_terms s 
WHERE p.is_active = true 
AND (
  LOWER(p.name) LIKE '%' || LOWER(s.term_base) || '%' 
  OR LOWER(p.category_name) LIKE '%' || LOWER(s.term_base) || '%' 
  OR LOWER(p.description) LIKE '%' || LOWER(s.term_base) || '%'
) 
ORDER BY match_priority, p.name 
LIMIT 10;`;

    busquedaNode.parameters.query = nuevaQuery;
    console.log('✅ "3. Búsqueda Automática Productos" actualizada con variantes incluidas');
}

// 2. Modificar "4. Merge Datos + Productos" para formatear las variantes
const mergeNode = data.nodes.find(n => n.name === '4. Merge Datos + Productos');

if (mergeNode) {
    const nuevoJsCode = `// Combinar datos del cliente y resultados de búsqueda
// v3: INCLUYE VARIANTES directamente

const preproceso = $('1. Pre-procesamiento YCloud').first().json;
const cliente = $('2. Obtener Cliente').first().json;

// Obtener productos de búsqueda (puede venir vacío)
let productosEncontrados = [];
try {
  const busquedaItems = $('3. Búsqueda Automática Productos').all();
  productosEncontrados = busquedaItems
    .map(item => item.json)
    .filter(p => p && p.id && p.name && typeof p.price !== 'undefined');
} catch (e) {
  productosEncontrados = [];
}

// Formatear productos CON VARIANTES para el prompt
let productosTexto = '';
if (productosEncontrados.length > 0) {
  productosTexto = productosEncontrados.map((p, i) => {
    let texto = \`\${i+1}. \${p.name} - $\${Number(p.price).toLocaleString('es-CO')} [ID: \${p.id}]\`;
    
    // Agregar variantes si existen
    if (p.variantes && p.variantes.length > 0) {
      const variantesTexto = p.variantes.map(v => 
        \`   → \${v.presentacion}: $\${Number(v.precio).toLocaleString('es-CO')}\`
      ).join('\\n');
      texto += \`\\n   📦 VARIANTES DISPONIBLES:\\n\${variantesTexto}\`;
    }
    
    return texto;
  }).join('\\n\\n');
} else if (preproceso.debeHacerBusqueda && preproceso.terminoBusqueda) {
  productosTexto = \`❌ No se encontraron productos para: "\${preproceso.terminoBusqueda}"\`;
} else {
  productosTexto = '(No se realizó búsqueda de productos)';
}

// ========== CONTEXTO DE TIEMPO ==========
const now = new Date();
const dayOfWeek = now.getDay();
const hour = now.getHours();
const pasoCutoff = hour >= 10;

let diasHastaEntrega;
let mensajeEntrega;

switch(dayOfWeek) {
  case 0: diasHastaEntrega = 2; mensajeEntrega = "Próxima entrega: Martes"; break;
  case 1: diasHastaEntrega = 1; mensajeEntrega = "Próxima entrega: Martes"; break;
  case 2: 
    if (pasoCutoff) { diasHastaEntrega = 3; mensajeEntrega = "Ya pasaron las 10AM. Próxima entrega: Viernes"; }
    else { diasHastaEntrega = 0; mensajeEntrega = "¡Ordena antes de las 10AM para recibir HOY!"; }
    break;
  case 3: diasHastaEntrega = 2; mensajeEntrega = "Próxima entrega: Viernes"; break;
  case 4: diasHastaEntrega = 1; mensajeEntrega = "Próxima entrega: Viernes"; break;
  case 5:
    if (pasoCutoff) { diasHastaEntrega = 4; mensajeEntrega = "Ya pasaron las 10AM. Próxima entrega: Martes"; }
    else { diasHastaEntrega = 0; mensajeEntrega = "¡Ordena antes de las 10AM para recibir HOY!"; }
    break;
  case 6: diasHastaEntrega = 3; mensajeEntrega = "Próxima entrega: Martes"; break;
  default: diasHastaEntrega = 1; mensajeEntrega = "Próxima entrega: Martes o Viernes";
}

const fechaEntrega = new Date(now);
fechaEntrega.setDate(now.getDate() + diasHastaEntrega);

const proximaEntrega = fechaEntrega.toLocaleDateString('es-CO', { 
  weekday: 'long', day: 'numeric', month: 'long' 
});

const fechaActual = now.toLocaleDateString('es-CO', { 
  weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
});

const horaActual = now.toLocaleTimeString('es-CO', { 
  hour: '2-digit', minute: '2-digit', hour12: true
});

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
    
    fechaActual: fechaActual,
    horaActual: horaActual,
    horaNumero: hour,
    diaNumero: dayOfWeek,
    pasoCutoff: pasoCutoff,
    proximaEntrega: proximaEntrega,
    mensajeEntrega: mensajeEntrega,
    diasHastaEntrega: diasHastaEntrega
  }
};`;

    mergeNode.parameters.jsCode = nuevoJsCode;
    console.log('✅ "4. Merge Datos + Productos" actualizado para formatear variantes');
}

// 3. Actualizar System Message para indicar que las variantes ya vienen incluidas
const agentNode = data.nodes.find(n => n.name === '🤖 Agente Luz v4');
if (agentNode && agentNode.parameters && agentNode.parameters.options) {
    let msg = agentNode.parameters.options.systemMessage || '';

    // Reemplazar la instrucción de TOOL_ObtenerVariantes
    const vieja = `🔍 USO DE TOOL_ObtenerVariantes

**SIEMPRE que muestres un producto al cliente:**
1. Busca el \`supabase_id\` del producto en \`productosEncontrados\`
2. Llama a TOOL_ObtenerVariantes(supabase_id)
3. Muestra TODAS las variantes con sus precios y emojis`;

    const nueva = `🔍 LAS VARIANTES YA VIENEN INCLUIDAS

**Los productos encontrados YA INCLUYEN sus variantes:**
- Cada producto en \`productosEncontrados\` tiene un campo \`variantes\`
- NO necesitas llamar a TOOL_ObtenerVariantes
- Las variantes ya están formateadas en \`productosTexto\`

**SIMPLEMENTE MUESTRA LAS VARIANTES que ya están en el contexto**`;

    if (msg.includes('USO DE TOOL_ObtenerVariantes')) {
        msg = msg.replace(/## 🔍 USO DE TOOL_ObtenerVariantes[\s\S]*?(?=\n---)/m, '## ' + nueva + '\n');
        agentNode.parameters.options.systemMessage = msg;
        console.log('✅ System Message actualizado: variantes ya incluidas');
    }
}

fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
console.log('\n✅ Archivo guardado: agente-luz-v6.5-admin-copiloto.json');
console.log('   Variantes ahora vienen incluidas automáticamente en la búsqueda');
