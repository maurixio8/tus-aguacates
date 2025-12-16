const fs = require('fs');

// Leer ambos archivos
const menu = JSON.parse(fs.readFileSync('menu_tus_aguacates (1).json', 'utf8'));
const productos = JSON.parse(fs.readFileSync('public/productos tus_aguacates.json', 'utf8'));

// Crear mapa de descripciones del archivo fuente (por nombre en minúsculas)
const descripcionesFuente = new Map();
menu.categories.forEach(cat => {
    cat.products.forEach(prod => {
        descripcionesFuente.set(prod.name.toLowerCase().trim(), prod.description || '');
    });
});

// Descripciones especiales para coincidencias parciales (aprobadas por el usuario)
const descripcionesEspeciales = {
    // Productos de aguacate con descripciones especiales
    'caja de 24 unidades hass mediano': '24 aguacates Hass mediano en tres estados de maduración para consumo durante toda la semana.',
    'caja de 35 unidades hass baby': '35 aguacates Hass Baby en tres estados de maduración para consumo durante toda la semana.',
    'caja de 12 unidades premium': 'Caja de aguacates Hass Premium pinto y maduro en tres estados de maduración.',
    'caja de 7 unidades injerto': '7 unidades de aguacate variedad injerto en tres estados de maduración.',
    'caja promoción del día': 'Caja de 6-8 unidades de aguacate criollo o injerto de tamaño pequeño, calidad segunda.',
    'maya injerto promoción': '3 unidades de variedad injerto en tres estados de maduración, con un peso aproximado de 1.5 kilos.',
    'nueva maya paquete x 8 mediano': 'Aguacate Hass en tres estados de maduración medianos para consumo programado.',
    'nueva maya paquete x 7 premium': 'Aguacate Hass en tres estados de maduración medianos para consumo programado.',
    'paquete x 12 unidades baby': 'Aguacates Hass Baby en tres estados de maduración.',
    'paquete x 8 unidades mediano': 'Aguacates Hass mediano en tres estados de maduración.',
    'paquete x4 unidades premium': 'Aguacates Hass Premium en tres estados de maduración.',
    'paquete 4 unidades injerto': 'Aguacates variedad injerto en tres estados de maduración.',
    'promo paga 2 lleva tres': 'Caja de aguacates Hass Premium pinto y maduro. Promoción: Paga 2 cajas y lleva 3.',

    // Coincidencias parciales aprobadas
    'ají guajillo x50 g': 'El ají guajillo aporta vitaminas y antioxidantes, tiene propiedades antiinflamatorias, mejora la circulación, acelera el metabolismo y facilita la digestión.',
    'ají chipotle x 50 g': 'El ají chipotle ayuda a aliviar el dolor, mejora la circulación, acelera el metabolismo, fortalece el sistema inmunológico y favorece la respiración. Además, aporta vitaminas y antioxidantes.',
    'ají ancho x 50g': 'El ají ancho es rico en vitaminas A y C, mejora la digestión, acelera el metabolismo, tiene propiedades antiinflamatorias y ayuda a proteger el sistema inmunológico.',
    'toronja x1kilo': 'La toronja es una fruta cítrica baja en calorías, rica en vitaminas A y C, que fortalece el sistema inmunológico y beneficia la salud cardiovascular.',
    'toronja x1000 grs': 'La toronja es una fruta cítrica baja en calorías, rica en vitaminas A y C, que fortalece el sistema inmunológico y beneficia la salud cardiovascular.',
    'sábila hoja': 'La sábila es útil para afecciones de la piel y quemaduras, sirve como hidratante para las pieles secas y atenuar las arrugas, laxante o depurativo.',
    'mangostinos kilo': 'El mangostino Fortalece el sistema inmune, muy necesario en los tiempos actuales. Al ser un poderoso antioxidante te ayudará a neutralizar los radicales libres y así proteger la integridad celular.',
    'col bruselas': 'Las coles de Bruselas están repletas de vitaminas, minerales y fibra. Son beneficiosas para la salud cardiovascular y digestiva.',
    'banano criollo kilo': 'Fuente de carbohidratos. Gran aporte de vitaminas. Fuente de minerales. Protege nuestro corazón. Reducen la fatiga y el cansancio. Previene la anemia. Estimula el sistema nervioso. Regula la función intestinal.',
    'banano bocadillo kilo': 'Fuente de carbohidratos. Gran aporte de vitaminas. Fuente de minerales. Protege nuestro corazón. Reducen la fatiga y el cansancio. Previene la anemia. Estimula el sistema nervioso. Regula la función intestinal.',
    'pitahaya morada kilo': 'En Taiwán, utilizan su fruta para mejorar los niveles de azúcar en sangre en pacientes con hipoglucemia. Disminuye los niveles sanguíneos de triglicéridos, colesterol y lípidos de baja densidad.',
    'platano verde x 4 unidades': 'Mejorar el funcionamiento del intestino. Prevenir la diabetes. Disminuir el colesterol LDL. Combatir la depresión. Prevenir enfermedades cardiovasculares. Ayudar en el proceso de pérdida de peso.',
    'red globe nacional': 'Uva red globe nacional de excelente calidad.',
    'frambuesa europea': 'Las frambuesas son ricas en calcio, potasio, vitamina B9 (ácido fólico) y vitamina C. Sus fitonutrientes disminuyen el estrés oxidativo y la inflamación de las células. Favorece la salud ocular y de la piel.',
    'manzana roja bandeja': 'Ayudan a purificar la sangre, a limpiar el intestino y favorecen la salud del hígado. Tienen un alto contenido en hierro, mineral que combate la anemia.',
    'manzana verde bandeja': 'La manzana verde es uno de los mejores alimentos para diabéticos, ya que gracias a su alto contenido en fibra ayuda a regular la presencia de glucosa en sangre.',
    'manzana bandeja combinada': 'Previene el estreñimiento. Su alto contenido en fibra favorece el tránsito intestinal y ayuda a la digestión de las grasas. Poder antioxidante. Mejora el sistema inmune.',

    // Germinados
    'germinados cilantro': 'Germinados de Cilantro frescos, ricos en nutrientes y antioxidantes.',
    'germinados remolacha': 'Germinados de Remolacha frescos, ricos en nutrientes y antioxidantes.',
    'germinados alfalfa': 'Germinados de Alfalfa frescos, ricos en nutrientes y antioxidantes.',
    'germinados repollo': 'Germinados de Repollo frescos, ricos en nutrientes y antioxidantes.',
    'germinados rábano': 'Germinados de Rábano frescos, ricos en nutrientes y antioxidantes.',

    // Zumos
    'zumo cereza concentrado': 'Concentrado líquido para preparar bebidas sabor a cereza.',
    'zumo maracuya concentrado': 'Concentrado líquido para preparar bebidas sabor a maracuyá.',
    'zumo naranja concentrado': 'Concentrado líquido para preparar bebidas sabor a naranja.',

    // Otros
    'espinaca paquete x1 kilo': 'Paquete de espinaca fresca, rica en hierro, vitaminas y minerales.',
    'cilantro fresco paquete': 'Cilantro fresco por paquete.',
    'semillas linaza': 'Las semillas de linaza contienen fibra, vitaminas, y ácidos grasos omega-3 beneficiosos para la salud cardiovascular.',
    'flor de jamaica extra': 'Los usos tradicionales de esta planta son muy variados e incluyen las flores para el tratamiento de diversos problemas. Alta presión sanguínea. Niveles altos de grasa en la sangre. Contra la diabetes. Obesidad.',
    'rabanos x bandeja': 'Rábanos frescos en bandeja, crujientes y llenos de vitaminas.',

    // Ancheta (solicitado por usuario - sin coincidencia pero creamos descripción básica)
    'ancheta regalo': 'Ancheta navideña con productos selectos, ideal para regalo.'
};

// Contadores
let exactas = 0;
let especiales = 0;
let sinCambio = 0;

// Procesar cada producto
productos.categories.forEach(cat => {
    cat.products.forEach(prod => {
        const nombreLower = prod.name.toLowerCase().trim();

        // Primero verificar si hay descripción especial
        if (descripcionesEspeciales[nombreLower]) {
            prod.description = descripcionesEspeciales[nombreLower];
            especiales++;
            console.log(`[ESPECIAL] ${prod.name}`);
            return;
        }

        // Luego buscar coincidencia exacta
        if (descripcionesFuente.has(nombreLower)) {
            const desc = descripcionesFuente.get(nombreLower);
            if (desc && desc.trim() !== '') {
                prod.description = desc;
                exactas++;
                console.log(`[EXACTA] ${prod.name}`);
            } else {
                sinCambio++;
                console.log(`[SIN DESC] ${prod.name}`);
            }
            return;
        }

        // Sin coincidencia
        sinCambio++;
        console.log(`[SIN CAMBIO] ${prod.name}`);
    });
});

// Guardar archivo actualizado
fs.writeFileSync('public/productos tus_aguacates.json', JSON.stringify(productos, null, 2));

console.log('\n=== RESUMEN ===');
console.log(`Coincidencias exactas aplicadas: ${exactas}`);
console.log(`Descripciones especiales aplicadas: ${especiales}`);
console.log(`Sin cambio: ${sinCambio}`);
console.log('\n✓ Archivo actualizado: public/productos tus_aguacates.json');
