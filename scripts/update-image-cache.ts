/**
 * Script para actualizar el cache-control de imágenes existentes en Supabase Storage
 *
 * Uso:
 *   npx tsx scripts/update-image-cache.ts
 *
 * Este script actualiza el cache-control de todas las imágenes en el bucket
 * product-images de 3600 (1 hora) a 31536000 (1 año).
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Cargar variables de entorno
config({ path: '.env.local' });

// Configuración de Supabase
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY!;

// Cliente de Supabase con permisos de servicio
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const BUCKET_NAME = 'product-images';
const NEW_CACHE_CONTROL = '31536000'; // 1 año

interface UpdateResult {
  path: string;
  success: boolean;
  error?: string;
  oldCacheControl?: string;
}

/**
 * Lista todos los archivos en el bucket recursivamente
 */
async function listAllFiles(path: string = ''): Promise<string[]> {
  const { data, error } = await supabase.storage.from(BUCKET_NAME).list(path);

  if (error) {
    console.error(`Error listando ${path}:`, error);
    return [];
  }

  let files: string[] = [];

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
 */
async function updateFileCacheControl(filePath: string): Promise<UpdateResult> {
  try {
    // NOTA: Supabase Storage no tiene una API directa para actualizar metadata
    // Tenemos que copiar el archivo con el nuevo cache-control

    // Primero, obtenemos el archivo actual
    const { data: fileData, error: downloadError } = await supabase.storage
      .from(BUCKET_NAME)
      .download(filePath);

    if (downloadError) {
      return {
        path: filePath,
        success: false,
        error: downloadError.message,
      };
    }

    // Crear un nuevo path temporal
    const timestamp = Date.now();
    const tempPath = `${filePath}.temp-${timestamp}`;

    // Subir el archivo con el nuevo cache-control
    const { error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(tempPath, fileData!, {
        contentType: fileData!.type || 'image/jpeg',
        upsert: true,
        cacheControl: NEW_CACHE_CONTROL,
      });

    if (uploadError) {
      return {
        path: filePath,
        success: false,
        error: uploadError.message,
      };
    }

    // Mover el archivo temporal al original (reemplazar)
    const { error: moveError } = await supabase.storage
      .from(BUCKET_NAME)
      .move(tempPath, filePath);

    if (moveError) {
      return {
        path: filePath,
        success: false,
        error: moveError.message,
      };
    }

    return {
      path: filePath,
      success: true,
    };
  } catch (error) {
    return {
      path: filePath,
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    };
  }
}

/**
 * Función principal
 */
async function main() {
  console.log('🚀 Iniciando actualización de cache-control de imágenes...\n');

  // Verificar variables de entorno
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error('❌ Error: Variables de entorno no encontradas');
    console.error('Asegúrate de tener NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }

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
  console.log(`⏱️  Tiempo estimado: ~${Math.ceil(files.length / 10)} minutos\n`);

  // Confirmación
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const answer = await new Promise<string>((resolve) => {
    rl.question('¿Continuar? (yes/no): ', resolve);
  });
  rl.close();

  if (answer.toLowerCase() !== 'yes' && answer.toLowerCase() !== 'y') {
    console.log('❌ Cancelado por el usuario');
    process.exit(0);
  }

  // Procesar archivos
  console.log('\n🔄 Procesando archivos...\n');

  const results: UpdateResult[] = [];
  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const progress = Math.round(((i + 1) / files.length) * 100);

    process.stdout.write(`\r[${progress}%] ${file.padEnd(60)} `);

    const result = await updateFileCacheControl(file);
    results.push(result);

    if (result.success) {
      successCount++;
    } else {
      errorCount++;
      console.log(`\n❌ Error en ${file}: ${result.error}`);
    }

    // Pequeña pausa para no sobrecargar la API
    if (i > 0 && i % 10 === 0) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  console.log('\n\n📊 RESUMEN:');
  console.log(`✅ Exitosos: ${successCount}/${files.length}`);
  console.log(`❌ Errores: ${errorCount}/${files.length}`);

  if (errorCount > 0) {
    console.log('\n⚠️  Archivos con errores:');
    results
      .filter((r) => !r.success)
      .forEach((r) => console.log(`   - ${r.path}: ${r.error}`));
  }

  console.log('\n✅ Proceso completado');
}

// Ejecutar
main().catch((error) => {
  console.error('❌ Error fatal:', error);
  process.exit(1);
});
