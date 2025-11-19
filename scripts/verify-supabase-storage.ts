#!/usr/bin/env tsx
/**
 * Script para verificar y configurar Supabase Storage
 *
 * Este script:
 * 1. Verifica la conexión a Supabase
 * 2. Comprueba si el bucket 'product-images' existe
 * 3. Verifica las políticas RLS del bucket
 * 4. Proporciona instrucciones para configurar manualmente si es necesario
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Cargar variables de entorno
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ ERROR: Variables de entorno de Supabase no configuradas');
  console.error('Por favor configura:');
  console.error('  - NEXT_PUBLIC_SUPABASE_URL');
  console.error('  - NEXT_PUBLIC_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function verifyConnection() {
  console.log('🔍 Verificando conexión a Supabase...');
  console.log(`   URL: ${SUPABASE_URL}`);

  try {
    const { data, error } = await supabase.from('products').select('count').limit(1);

    if (error && error.message.includes('relation')) {
      console.log('⚠️  Base de datos conectada pero tabla "products" no existe');
      return true; // Conexión OK, pero falta setup
    } else if (error) {
      console.error('❌ Error al conectar:', error.message);
      return false;
    }

    console.log('✅ Conexión a Supabase exitosa');
    return true;
  } catch (err) {
    console.error('❌ Error de conexión:', err);
    return false;
  }
}

async function verifyBucket() {
  console.log('\n📦 Verificando bucket "product-images"...');

  try {
    // Intentar listar archivos del bucket
    const { data, error } = await supabase.storage
      .from('product-images')
      .list('', { limit: 1 });

    if (error) {
      if (error.message.includes('not found') || error.message.includes('does not exist')) {
        console.log('❌ El bucket "product-images" NO EXISTE');
        console.log('\n📋 Para crear el bucket:');
        console.log('   1. Ve a: https://supabase.com/dashboard/project/_/storage/buckets');
        console.log('   2. Haz clic en "New bucket"');
        console.log('   3. Nombre: product-images');
        console.log('   4. Público: SÍ (marcado)');
        console.log('   5. File size limit: 10MB');
        console.log('   6. Allowed MIME types: image/jpeg, image/png, image/webp, image/gif');
        return false;
      } else if (error.message.includes('permission') || error.message.includes('policy')) {
        console.log('⚠️  El bucket existe pero hay problemas de permisos/políticas RLS');
        console.log('   Error:', error.message);
        return 'permissions';
      } else {
        console.log('⚠️  Error desconocido:', error.message);
        return false;
      }
    }

    console.log('✅ Bucket "product-images" existe y es accesible');
    return true;
  } catch (err) {
    console.error('❌ Error verificando bucket:', err);
    return false;
  }
}

async function testUpload() {
  console.log('\n🧪 Probando subida de imagen de prueba...');

  try {
    // Crear un blob simple para probar
    const testBlob = new Blob(['test image content'], { type: 'image/jpeg' });
    const testPath = `test/test-${Date.now()}.jpg`;

    const { data, error } = await supabase.storage
      .from('product-images')
      .upload(testPath, testBlob, {
        contentType: 'image/jpeg',
        upsert: false
      });

    if (error) {
      console.log('❌ No se pudo subir imagen de prueba');
      console.log('   Error:', error.message);

      if (error.message.includes('authenticated')) {
        console.log('\n⚠️  PROBLEMA: Las políticas RLS requieren autenticación');
        console.log('   Necesitas ejecutar la migración SQL en Supabase:');
        console.log('   Archivo: supabase/migrations/20240101_add_products_rls_policies.sql');
        console.log('\n📋 Pasos para aplicar la migración:');
        console.log('   1. Ve a: https://supabase.com/dashboard/project/_/sql/new');
        console.log('   2. Copia y pega el contenido de 20240101_add_products_rls_policies.sql');
        console.log('   3. Haz clic en "Run"');
      }
      return false;
    }

    console.log('✅ Subida de prueba exitosa');
    console.log(`   Path: ${data.path}`);

    // Limpiar archivo de prueba
    await supabase.storage.from('product-images').remove([testPath]);
    console.log('🧹 Archivo de prueba eliminado');

    return true;
  } catch (err) {
    console.error('❌ Error en prueba de subida:', err);
    return false;
  }
}

async function verifyRLSPolicies() {
  console.log('\n🔒 Verificando políticas RLS...');
  console.log('   (Esto requiere permisos de administrador en Supabase)');

  console.log('\n📋 Para verificar manualmente:');
  console.log('   1. Ve a: https://supabase.com/dashboard/project/_/auth/policies');
  console.log('   2. Busca la tabla "storage.objects"');
  console.log('   3. Verifica que existan estas políticas:');
  console.log('      - Public can view product images (SELECT)');
  console.log('      - Authenticated can upload product images (INSERT)');
  console.log('      - Authenticated can update product images (UPDATE)');
  console.log('      - Authenticated can delete product images (DELETE)');

  return true;
}

async function main() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('   VERIFICACIÓN DE SUPABASE STORAGE');
  console.log('═══════════════════════════════════════════════════════════\n');

  // 1. Verificar conexión
  const isConnected = await verifyConnection();
  if (!isConnected) {
    console.log('\n❌ No se pudo conectar a Supabase');
    console.log('Verifica tus variables de entorno en .env.local');
    process.exit(1);
  }

  // 2. Verificar bucket
  const bucketStatus = await verifyBucket();
  if (bucketStatus === false) {
    console.log('\n⚠️  ACCIÓN REQUERIDA: Crear bucket "product-images"');
    process.exit(1);
  }

  // 3. Verificar políticas RLS
  await verifyRLSPolicies();

  // 4. Prueba de subida (solo si bucket existe)
  if (bucketStatus === true) {
    const uploadWorks = await testUpload();

    if (!uploadWorks) {
      console.log('\n⚠️  ACCIÓN REQUERIDA: Configurar políticas RLS');
      console.log('   Ejecuta la migración: supabase/migrations/20240101_add_products_rls_policies.sql');
      process.exit(1);
    }
  }

  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('   ✅ VERIFICACIÓN COMPLETADA');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('\n🎉 Supabase Storage está configurado correctamente!');
  console.log('   Ya puedes subir imágenes de productos desde el admin.\n');
}

main().catch(console.error);
