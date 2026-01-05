/**
 * 🥑 Sincronizar productos JSON a PostgreSQL Docker
 * 
 * Este script lee el archivo productos tus_aguacates.json
 * y lo sincroniza con la tabla productos_tienda en PostgreSQL
 * 
 * Uso: node sync-productos-to-postgres.js
 * 
 * Requisitos:
 * - npm install pg
 * - Ejecutar crear-tabla-productos-local.sql primero
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Configuración de PostgreSQL Docker
// AJUSTA ESTOS VALORES según tu configuración
const pool = new Pool({
    host: 'localhost',  // O la IP de tu Docker
    port: 5432,
    database: 'n8n_db',  // Tu base de datos
    user: 'n8n_user',    // Tu usuario
    password: 'TU_PASSWORD_AQUI',  // Actualiza con tu password
});

async function syncProducts() {
    console.log('🥑 Iniciando sincronización de productos...\n');

    // Leer el archivo JSON
    const jsonPath = path.join(__dirname, '..', 'public', 'productos tus_aguacates.json');

    if (!fs.existsSync(jsonPath)) {
        console.error('❌ No se encontró el archivo:', jsonPath);
        process.exit(1);
    }

    const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    const categories = data.categories || [];

    let totalProducts = 0;
    let insertedProducts = 0;

    const client = await pool.connect();

    try {
        // Limpiar tabla existente (opcional - comenta si quieres preservar datos)
        await client.query('DELETE FROM productos_tienda');
        console.log('🗑️  Tabla productos_tienda limpiada\n');

        for (const category of categories) {
            const categoryName = category.name;
            const products = category.products || [];

            console.log(`📦 Procesando categoría: ${categoryName} (${products.length} productos)`);

            for (const product of products) {
                totalProducts++;

                // Tomar el primer precio de las variantes o 0
                const firstVariant = product.variants?.[0];
                const price = firstVariant?.price || 0;
                const variantName = firstVariant?.name || '';

                // Crear nombre completo si hay variante
                const fullName = variantName && variantName !== product.name
                    ? `${product.name} - ${variantName}`
                    : product.name;

                // Generar slug
                const slug = product.name
                    .toLowerCase()
                    .normalize('NFD')
                    .replace(/[\u0300-\u036f]/g, '')
                    .replace(/[^a-z0-9]+/g, '-')
                    .replace(/^-+|-+$/g, '');

                try {
                    await client.query(`
            INSERT INTO productos_tienda 
            (name, slug, description, price, category_name, is_active, synced_from_supabase_at)
            VALUES ($1, $2, $3, $4, $5, $6, NOW())
          `, [
                        product.name,
                        slug,
                        product.description || '',
                        price,
                        categoryName,
                        true
                    ]);

                    insertedProducts++;

                    // Si el producto tiene múltiples variantes, insertar cada una
                    if (product.variants && product.variants.length > 1) {
                        for (let i = 1; i < product.variants.length; i++) {
                            const variant = product.variants[i];
                            const variantSlug = `${slug}-${variant.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;

                            await client.query(`
                INSERT INTO productos_tienda 
                (name, slug, description, price, category_name, is_active, synced_from_supabase_at)
                VALUES ($1, $2, $3, $4, $5, $6, NOW())
              `, [
                                `${product.name} - ${variant.name}`,
                                variantSlug,
                                product.description || '',
                                variant.price,
                                categoryName,
                                true
                            ]);
                            insertedProducts++;
                        }
                    }

                } catch (err) {
                    console.error(`  ❌ Error insertando ${product.name}:`, err.message);
                }
            }
        }

        console.log('\n✅ Sincronización completada!');
        console.log(`   📊 Total productos procesados: ${totalProducts}`);
        console.log(`   ✨ Total registros insertados: ${insertedProducts}`);

        // Verificar
        const result = await client.query('SELECT COUNT(*) as total FROM productos_tienda');
        console.log(`   🔢 Total en base de datos: ${result.rows[0].total}`);

        // Mostrar algunas categorías
        const cats = await client.query(`
      SELECT category_name, COUNT(*) as cantidad 
      FROM productos_tienda 
      GROUP BY category_name 
      ORDER BY cantidad DESC
    `);
        console.log('\n📂 Productos por categoría:');
        cats.rows.forEach(row => {
            console.log(`   - ${row.category_name}: ${row.cantidad}`);
        });

    } catch (err) {
        console.error('❌ Error durante la sincronización:', err);
    } finally {
        client.release();
        await pool.end();
    }
}

// Ejecutar
syncProducts().catch(console.error);
