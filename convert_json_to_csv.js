#!/usr/bin/env node
/**
 * Script para convertir el JSON de productos de Tus Aguacates a CSV
 * Genera un archivo CSV compatible con el sistema de importación
 */

const fs = require('fs');
const path = require('path');

function cleanText(text) {
    /** Limpiar texto para CSV */
    if (!text) return "";
    return String(text).replace(/"/g, '""').replace(/\n/g, ' ').replace(/\r/g, '');
}

function convertJsonToCsv() {
    /** Convertir JSON a CSV */

    // Rutas de archivos
    const jsonPath = "public/productos tus_aguacates.json";
    const csvPath = "public/catalogo-productos.csv";

    console.log("🔄 Iniciando conversión JSON a CSV...");
    console.log(`📂 Origen: ${jsonPath}`);
    console.log(`📄 Destino: ${csvPath}`);

    // Verificar que existe el archivo JSON
    if (!fs.existsSync(jsonPath)) {
        console.log(`❌ ERROR: No existe el archivo ${jsonPath}`);
        return false;
    }

    try {
        // Cargar JSON
        const jsonData = fs.readFileSync(jsonPath, 'utf8');
        const data = JSON.parse(jsonData);

        console.log("✅ JSON cargado exitosamente");

        let csvContent = '';
        let productId = 1;
        let totalProducts = 0;
        let categoriesProcessed = 0;

        // Escribir encabezados
        csvContent += 'id,name,description,price,category,image\n';

        // Procesar cada categoría
        for (const category of data.categories || []) {
            const categoryName = cleanText(category.name || '');
            categoriesProcessed++;

            console.log(`📦 Procesando categoría: ${categoryName}`);

            // Procesar cada producto en la categoría
            for (const product of category.products || []) {
                const productName = cleanText(product.name || '');
                const description = cleanText(product.description || '');
                const variants = product.variants || [];

                // Si tiene variantes, crear una fila por variante
                if (variants.length > 0) {
                    for (const variant of variants) {
                        const variantName = cleanText(variant.name || '');
                        const variantPrice = variant.price || 0;

                        // Usar nombre de variante si existe, si no, nombre del producto
                        const finalName = variantName || productName;

                        // Escapar comillas en CSV
                        const csvName = finalName.includes(',') ? `"${finalName}"` : finalName;
                        const csvDescription = description.includes(',') ? `"${description}"` : description;
                        const csvCategory = categoryName.includes(',') ? `"${categoryName}"` : categoryName;

                        csvContent += `${productId},${csvName},${csvDescription},${variantPrice},${csvCategory},\n`;

                        productId++;
                        totalProducts++;
                    }
                } else {
                    // Si no tiene variantes, usar el precio del producto si existe
                    const productPrice = product.price || 0;

                    // Escapar comillas en CSV
                    const csvName = productName.includes(',') ? `"${productName}"` : productName;
                    const csvDescription = description.includes(',') ? `"${description}"` : description;
                    const csvCategory = categoryName.includes(',') ? `"${categoryName}"` : categoryName;

                    csvContent += `${productId},${csvName},${csvDescription},${productPrice},${csvCategory},\n`;

                    productId++;
                    totalProducts++;
                }
            }
        }

        // Guardar CSV
        fs.writeFileSync(csvPath, csvContent, 'utf8');

        console.log("✅ CSV generado exitosamente!");
        console.log("📊 Estadísticas:");
        console.log(`   - Categorías procesadas: ${categoriesProcessed}`);
        console.log(`   - Productos totales: ${totalProducts}`);
        console.log(`   - Archivo guardado en: ${csvPath}`);

        // Verificar que el archivo se creó
        if (fs.existsSync(csvPath)) {
            const stats = fs.statSync(csvPath);
            console.log(`   - Tamaño del archivo: ${stats.size} bytes`);
        }

        return true;

    } catch (error) {
        console.log(`❌ Error: ${error.message}`);
        return false;
    }
}

function main() {
    /** Función principal */
    console.log("🥑 Generador de CSV para Tus Aguacates");
    console.log("=".repeat(50));

    const success = convertJsonToCsv();

    if (success) {
        console.log("\n🎉 Conversión completada exitosamente!");
        console.log("\n📋 Siguientes pasos:");
        console.log("1. Revisar el archivo generado: public/catalogo-productos.csv");
        console.log("2. Probar la importación en el sistema admin");
        console.log("3. Verificar que todos los productos aparezcan en la tienda");
        process.exit(0);
    } else {
        console.log("\n💥 La conversión falló");
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}

module.exports = { convertJsonToCsv };