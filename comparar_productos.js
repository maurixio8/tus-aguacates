const fs = require('fs');

// Leer ambos archivos
const menu = JSON.parse(fs.readFileSync('menu_tus_aguacates (1).json', 'utf8'));
const productos = JSON.parse(fs.readFileSync('public/productos tus_aguacates.json', 'utf8'));

// Extraer productos del archivo actual (productos)
const productosActuales = [];
productos.categories.forEach(cat => {
    cat.products.forEach(prod => {
        productosActuales.push({
            categoria: cat.name,
            nombre: prod.name,
            descripcion: prod.description || '',
            nombreLower: prod.name.toLowerCase().trim()
        });
    });
});

// Extraer productos del archivo fuente (menu)
const productosFuente = [];
menu.categories.forEach(cat => {
    cat.products.forEach(prod => {
        productosFuente.push({
            categoria: cat.name,
            nombre: prod.name,
            descripcion: prod.description || '',
            nombreLower: prod.name.toLowerCase().trim()
        });
    });
});

// Buscar coincidencias
const coincidenciasExactas = [];
const coincidenciasParciales = [];
const sinCoincidencia = [];

productosActuales.forEach(prodActual => {
    // Buscar coincidencia exacta
    const exacta = productosFuente.find(p => p.nombreLower === prodActual.nombreLower);
    if (exacta) {
        coincidenciasExactas.push({
            actual: prodActual.nombre,
            fuente: exacta.nombre,
            descripcion: exacta.descripcion
        });
        return;
    }

    // Buscar coincidencia parcial (contiene parte del nombre)
    const parciales = productosFuente.filter(p =>
        p.nombreLower.includes(prodActual.nombreLower) ||
        prodActual.nombreLower.includes(p.nombreLower) ||
        prodActual.nombreLower.split(' ').some(palabra =>
            palabra.length > 4 && p.nombreLower.includes(palabra)
        )
    );

    if (parciales.length > 0) {
        coincidenciasParciales.push({
            actual: prodActual.nombre,
            posibles: parciales.map(p => ({ nombre: p.nombre, desc: p.descripcion ? p.descripcion.substring(0, 80) + '...' : '(sin desc)' }))
        });
    } else {
        sinCoincidencia.push(prodActual.nombre);
    }
});

console.log('=== ESTADÍSTICAS ===');
console.log('Total productos actuales: ' + productosActuales.length);
console.log('Total productos fuente: ' + productosFuente.length);
console.log('Coincidencias exactas: ' + coincidenciasExactas.length);
console.log('Coincidencias parciales: ' + coincidenciasParciales.length);
console.log('Sin coincidencia: ' + sinCoincidencia.length);

console.log('\n=== COINCIDENCIAS EXACTAS ===');
coincidenciasExactas.forEach(c => {
    console.log('✓ ' + c.actual);
    console.log('  Desc: ' + (c.descripcion ? c.descripcion.substring(0, 100) : '(vacía)'));
});

console.log('\n=== COINCIDENCIAS PARCIALES ===');
coincidenciasParciales.forEach(c => {
    console.log('? ' + c.actual);
    console.log('  Posibles: ' + c.posibles.map(p => p.nombre).join(' | '));
});

console.log('\n=== SIN COINCIDENCIA ===');
sinCoincidencia.forEach(s => console.log('✗ ' + s));

// Guardar reporte completo
const reporte = {
    estadisticas: {
        totalActuales: productosActuales.length,
        totalFuente: productosFuente.length,
        coincidenciasExactas: coincidenciasExactas.length,
        coincidenciasParciales: coincidenciasParciales.length,
        sinCoincidencia: sinCoincidencia.length
    },
    coincidenciasExactas,
    coincidenciasParciales,
    sinCoincidencia
};
fs.writeFileSync('reporte_coincidencias.json', JSON.stringify(reporte, null, 2));
console.log('\n✓ Reporte guardado en reporte_coincidencias.json');
