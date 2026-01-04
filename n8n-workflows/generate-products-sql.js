/**
 * Script para generar SQL de inserción de productos
 * Ejecutar con: node generate-products-sql.js > insertar-productos.sql
 */

const fs = require('fs');
const path = require('path');

const jsonPath = path.join(__dirname, '..', 'public', 'productos tus_aguacates.json');
const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

console.log('-- =====================================================');
console.log('-- 🥑 TUS AGUACATES - Inserción de Productos');
console.log('-- Generado automáticamente desde productos tus_aguacates.json');
console.log('-- =====================================================');
console.log('');
console.log('-- Limpiar tabla existente');
console.log('DELETE FROM productos_tienda;');
console.log('');

let totalInserted = 0;

for (const category of data.categories) {
    console.log(`-- === ${category.name} ===`);

    for (const product of category.products) {
        const variants = product.variants || [];

        for (const variant of variants) {
            const name = `${product.name}${variants.length > 1 ? ' - ' + variant.name : ''}`;
            const desc = (product.description || '').replace(/'/g, "''");
            const price = variant.price || 0;
            const cat = category.name.replace(/'/g, "''");

            console.log(`INSERT INTO productos_tienda (name, description, price, category_name, is_active) VALUES ('${name.replace(/'/g, "''")}', '${desc}', ${price}, '${cat}', true);`);
            totalInserted++;
        }
    }
    console.log('');
}

console.log('-- =====================================================');
console.log(`-- Total productos insertados: ${totalInserted}`);
console.log('-- =====================================================');
console.log('');
console.log('-- Verificar');
console.log('SELECT COUNT(*) as total FROM productos_tienda;');
console.log('SELECT category_name, COUNT(*) as cantidad FROM productos_tienda GROUP BY category_name ORDER BY cantidad DESC;');
