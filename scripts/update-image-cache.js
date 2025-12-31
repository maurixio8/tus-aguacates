/**
 * Script para actualizar el cache-control de imágenes existentes en Supabase Storage
 *
 * Uso:
 *   node scripts/update-image-cache.js
 *
 * Este script actualiza el cache-control de todas las imágenes en el bucket
 * product-images de 3600 (1 hora) a 31536000 (1 año).
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Error: Variables de entorno no encontradas');
  console.error('Necesitas SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Cliente de Supabase con permisos de servicio
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const BUCKET_NAME = 'product-images';
const NEW_CACHE_CONTROL = '31536000'; // 1 año

/**
 * Lista todos los archivos en el bucket recursivamente
 */
async function listAllFiles(path = '') {
  const { data, error } = await supabase.storage.from(BUCKET_NAME).list(path);

  if (error) {
    console.error(`Error listando ${path}:`, error);
    return [];
  }

  let files = [];

  // Procesar archivos en este directorio
  for (const item of data || []) {
    if (item.name) {
      const fullPath = path ? `${path}/${item.name}` : item.name;

      if (item.id) {
        // Es un archivo
        files.push(fullPath);
      } else {
        // Es un directorio, listar recursivamente
        const subFiles = await listAllFiles(fullPath);
        files = files.concat(subFiles);
      }
    }
  }

  return files;
}

/**
 * Actualiza el cache-control de un archivo específico
 * Enfoque: Descargar -> Subir con upsert (que actualiza el cache-control)
 */
async function updateFileCacheControl(filePath) {
  try {
    // Descargar el archivo actual
    const { data: fileData, error: downloadError } = await supabase.storage
      .from(BUCKET_NAME)
      .download(filePath);

    if (downloadError) {
      return { path: filePath, success: false, error: downloadError.message };
    }

    // Determinar content-type basado en extensión
    let contentType = 'image/jpeg';
    if (filePath.endsWith('.webp')) {
      contentType = 'image/webp';
    } else if (filePath.endsWith('.png')) {
      contentType = 'image/png';
    } else if (filePath.endsWith('.gif')) {
      contentType = 'image/gif';
    }

    // Subir el archivo CON UPSERT y el nuevo cache-control
    // Upsert actualiza el archivo si ya existe y actualiza el metadata
    const { error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, fileData, {
        contentType,
        upsert: true,  // Importante: upsert actualiza el archivo existente
        cacheControl: NEW_CACHE_CONTROL,
      });

    if (uploadError) {
      return { path: filePath, success: false, error: uploadError.message };
    }

    return { path: filePath, success: true };

  } catch (error) {
    return { path: filePath, success: false, error: error.message };
  }
}

/**
 * Función principal
 */
async function main() {
  console.log('🚀 Iniciando actualización de cache-control de imágenes...\n');

  console.log(`📁 Bucket: ${BUCKET_NAME}`);
  console.log(`⏱️  Nuevo cache-control: ${NEW_CACHE_CONTROL} (1 año)\n`);

  // Listar todos los archivos
  console.log('📋 Listando archivos...');
  const files = await listAllFiles();

  console.log(`✅ Encontrados ${files.length} archivos\n`);

  if (files.length === 0) {
    console.log('⚠️  No se encontraron archivos para actualizar');
    return;
  }

  // Mostrar primeros 10 archivos como preview
  console.log('📝 Archivos a actualizar (primeros 10):');
  files.slice(0, 10).forEach((file) => console.log(`   - ${file}`));

  if (files.length > 10) {
    console.log(`   ... y ${files.length - 10} archivos más`);
  }

  console.log('\n⚠️  ADVERTENCIA: Este proceso tomará tiempo');
  console.log(`⏱️  Tiempo estimado: ~${Math.ceil(files.length / 6)} minutos`);
  console.log('💡 Este script sobrescribirá cada imagen con el nuevo cache-control\n');

  // Confirmación automática (se asume que el usuario está de acuerdo)
  console.log('🔄 Procesando archivos...\n');

  const results = [];
  let successCount = 0;
  let errorCount = 0;
  const errors = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const progress = Math.round(((i + 1) / files.length) * 100);

    const result = await updateFileCacheControl(file);
    results.push(result);

    if (result.success) {
      successCount++;
      process.stdout.write(`\r[${progress}%] ${i + 1}/${files.length} ✅ ${file.padEnd(50)} `);
    } else {
      errorCount++;
      errors.push({ path: file, error: result.error });
      process.stdout.write(`\r[${progress}%] ${i + 1}/${files.length} ❌ ${file.padEnd(50)} `);
    }

    // Pequeña pausa para no sobrecargar la API
    if (i > 0 && i % 5 === 0) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  console.log('\n\n📊 RESUMEN:');
  console.log(`✅ Exitosos: ${successCount}/${files.length}`);
  console.log(`❌ Errores: ${errorCount}/${files.length}`);

  if (errorCount > 0) {
    console.log('\n⚠️  Archivos con errores (primeros 10):');
    errors.slice(0, 10).forEach((e) => {
      console.log(`   - ${e.path}: ${e.error}`);
    });
    if (errors.length > 10) {
      console.log(`   ... y ${errors.length - 10} errores más`);
    }
  }

  console.log('\n✅ Proceso completado');
  console.log('\n📝 Nota: Las imágenes ahora tienen cache-control de 1 año');
  console.log('   El CDN de Supabase/Cloudflare cacheará las imágenes por 1 año');
  console.log('\n🔍 Para verificar el cambio, ejecuta:');
  console.log('   curl -I "https://gxqkmaaqoehydulksudj.supabase.co/storage/v1/object/public/product-images/[imagen]" | grep cache-control');
}

// Ejecutar
main().catch((error) => {
  console.error('\n❌ Error fatal:', error);
  process.exit(1);
});
