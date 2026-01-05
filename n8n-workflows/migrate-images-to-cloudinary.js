/**
 * Script de Migración de Imágenes: Supabase → Cloudinary
 * ======================================================
 * 
 * USO:
 * 1. Instalar dependencias: npm install cloudinary @supabase/supabase-js dotenv
 * 2. Crear archivo .env.local con las credenciales (ver GUIA-MIGRACION-IMAGENES.md)
 * 3. Ejecutar: node migrate-images-to-cloudinary.js
 */

const cloudinary = require('cloudinary').v2;

// Configuración de Cloudinary
// IMPORTANTE: Reemplaza estos valores con tus credenciales
const CLOUDINARY_CONFIG = {
    cloud_name: 'drahcpo49',
    api_key: '484862488236818',
    api_secret: process.env.CLOUDINARY_API_SECRET || 'EVoElYysIOHuFcjVjIly-vhVixo'
};

// Configuración de Supabase
const SUPABASE_URL = 'https://gxqkmaaqoehydulksudj.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd4cWttYWFxb2VoeWR1bGtzdWRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI0NDI5NDQsImV4cCI6MjA3ODAxODk0NH0.XAR-ysQgt0ZkRZfIZx_DvpYMzmEMFsdAYK3EP1tc0mw';

// Inicializar Cloudinary
cloudinary.config(CLOUDINARY_CONFIG);

/**
 * Sube una imagen desde URL a Cloudinary
 */
async function uploadToCloudinary(imageUrl, folder, publicId) {
    try {
        const result = await cloudinary.uploader.upload(imageUrl, {
            folder: `tus-aguacates/${folder}`,
            public_id: publicId,
            overwrite: true,
            resource_type: 'image',
            transformation: [
                { quality: 'auto:good' },
                { fetch_format: 'auto' }
            ]
        });
        return result.secure_url;
    } catch (error) {
        console.error(`Error subiendo ${imageUrl}:`, error.message);
        return null;
    }
}

/**
 * Obtiene todos los productos de Supabase
 */
async function getProducts() {
    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/products?select=id,name,main_image_url,slug`, {
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            }
        });

        if (!response.ok) {
            console.error(`Error HTTP ${response.status}: ${response.statusText}`);
            const text = await response.text();
            console.error('Respuesta:', text);
            return [];
        }

        const data = await response.json();
        if (!Array.isArray(data)) {
            console.error('Respuesta no es un array:', data);
            return [];
        }
        return data;
    } catch (error) {
        console.error('Error obteniendo productos:', error.message);
        return [];
    }
}

/**
 * Obtiene todas las categorías de Supabase
 */
async function getCategories() {
    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/categories?select=id,name,image_url,slug`, {
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            }
        });

        if (!response.ok) {
            console.error(`Error HTTP ${response.status}: ${response.statusText}`);
            return [];
        }

        const data = await response.json();
        return Array.isArray(data) ? data : [];
    } catch (error) {
        console.error('Error obteniendo categorías:', error.message);
        return [];
    }
}

/**
 * Actualiza la URL de imagen de un producto en Supabase
 */
async function updateProductImage(productId, newImageUrl) {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/products?id=eq.${productId}`, {
        method: 'PATCH',
        headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal'
        },
        body: JSON.stringify({ main_image_url: newImageUrl })
    });
    return response.ok;
}

/**
 * Actualiza la URL de imagen de una categoría en Supabase
 */
async function updateCategoryImage(categoryId, newImageUrl) {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/categories?id=eq.${categoryId}`, {
        method: 'PATCH',
        headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal'
        },
        body: JSON.stringify({ image_url: newImageUrl })
    });
    return response.ok;
}

/**
 * Migra todas las imágenes de productos
 */
async function migrateProductImages() {
    console.log('\n📦 Migrando imágenes de PRODUCTOS...\n');

    const products = await getProducts();
    console.log(`Encontrados ${products.length} productos\n`);

    let migrated = 0;
    let skipped = 0;
    let errors = 0;

    for (const product of products) {
        const imageUrl = product.main_image_url;

        // Solo migrar si es de Supabase Storage
        if (!imageUrl || !imageUrl.includes('supabase.co/storage')) {
            skipped++;
            continue;
        }

        console.log(`[${migrated + errors + 1}/${products.length}] ${product.name}...`);

        const publicId = product.slug || `product-${product.id}`;
        const newUrl = await uploadToCloudinary(imageUrl, 'products', publicId);

        if (newUrl) {
            const updated = await updateProductImage(product.id, newUrl);
            if (updated) {
                console.log(`  ✅ Migrado: ${newUrl}`);
                migrated++;
            } else {
                console.log(`  ❌ Error actualizando BD`);
                errors++;
            }
        } else {
            errors++;
        }
    }

    console.log(`\n📊 Productos: ${migrated} migrados, ${skipped} omitidos, ${errors} errores`);
    return { migrated, skipped, errors };
}

/**
 * Migra todas las imágenes de categorías
 */
async function migrateCategoryImages() {
    console.log('\n📂 Migrando imágenes de CATEGORÍAS...\n');

    const categories = await getCategories();
    console.log(`Encontradas ${categories.length} categorías\n`);

    let migrated = 0;
    let skipped = 0;
    let errors = 0;

    for (const category of categories) {
        const imageUrl = category.image_url;

        // Solo migrar si es de Supabase Storage
        if (!imageUrl || !imageUrl.includes('supabase.co/storage')) {
            skipped++;
            continue;
        }

        console.log(`[${migrated + errors + 1}] ${category.name}...`);

        const publicId = category.slug || `category-${category.id}`;
        const newUrl = await uploadToCloudinary(imageUrl, 'categories', publicId);

        if (newUrl) {
            const updated = await updateCategoryImage(category.id, newUrl);
            if (updated) {
                console.log(`  ✅ Migrado: ${newUrl}`);
                migrated++;
            } else {
                console.log(`  ❌ Error actualizando BD`);
                errors++;
            }
        } else {
            errors++;
        }
    }

    console.log(`\n📊 Categorías: ${migrated} migradas, ${skipped} omitidas, ${errors} errores`);
    return { migrated, skipped, errors };
}

/**
 * Función principal
 */
async function main() {
    console.log('='.repeat(60));
    console.log('🚀 MIGRACIÓN DE IMÁGENES: Supabase → Cloudinary');
    console.log('='.repeat(60));
    console.log(`\nCloud Name: ${CLOUDINARY_CONFIG.cloud_name}`);
    console.log(`Supabase: ${SUPABASE_URL}\n`);

    // Verificar credenciales
    if (!CLOUDINARY_CONFIG.api_secret || CLOUDINARY_CONFIG.api_secret.length < 10) {
        console.error('❌ ERROR: CLOUDINARY_API_SECRET no está configurado correctamente');
        process.exit(1);
    }

    try {
        // Migrar productos
        const productResults = await migrateProductImages();

        // Migrar categorías
        const categoryResults = await migrateCategoryImages();

        // Resumen final
        console.log('\n' + '='.repeat(60));
        console.log('📊 RESUMEN FINAL');
        console.log('='.repeat(60));
        console.log(`\nProductos migrados: ${productResults.migrated}`);
        console.log(`Categorías migradas: ${categoryResults.migrated}`);
        console.log(`\nTotal errores: ${productResults.errors + categoryResults.errors}`);
        console.log('\n✅ Migración completada!');
        console.log('\n💡 Próximos pasos:');
        console.log('   1. Verifica que las imágenes cargan correctamente en tu sitio');
        console.log('   2. Monitorea el egress de Supabase (debería bajar)');
        console.log('   3. Opcional: Elimina las imágenes viejas de Supabase Storage');

    } catch (error) {
        console.error('\n❌ Error durante la migración:', error);
        process.exit(1);
    }
}

// Ejecutar
main();
