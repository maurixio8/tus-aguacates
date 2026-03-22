// Script de diagnóstico completo para el error 404 de wishlist
// Este script probará diferentes aspectos del sistema para identificar el problema exacto

const { createClient } = require('@supabase/supabase-js');

// Configuración
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://fkclagdodqeqcvdhqyjl.supabase.co';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_ANON_KEY) {
  throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY is required');
}

// Usuario de prueba
const TEST_USER_ID = '219488db-1bda-4ac6-a961-8affe601bcb6';
const TEST_PRODUCT_ID = 'product-3';

console.log('🔍 [DIAGNOSTIC] Iniciando diagnóstico completo para error 404 de wishlist');
console.log('🌐 [DIAGNOSTIC] URL de Supabase:', SUPABASE_URL);
console.log('👤 [DIAGNOSTIC] Usuario de prueba:', TEST_USER_ID);
console.log('📦 [DIAGNOSTIC] Producto de prueba:', TEST_PRODUCT_ID);

// 1. Verificar conexión con Supabase
async function testSupabaseConnection() {
  console.log('\n📡 [STEP 1] Verificando conexión con Supabase...');
  
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const { data, error } = await supabase.from('products').select('id').limit(1);
    
    if (error) {
      console.error('❌ [STEP 1] Error conectando a Supabase:', error);
      return false;
    }
    
    console.log('✅ [STEP 1] Conexión a Supabase exitosa');
    console.log('📊 [STEP 1] Datos de prueba:', data);
    return true;
  } catch (error) {
    console.error('❌ [STEP 1] Error en conexión a Supabase:', error);
    return false;
  }
}

// 2. Verificar si la tabla wishlist existe
async function testWishlistTableExists() {
  console.log('\n📋 [STEP 2] Verificando si la tabla wishlist existe...');
  
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const { data, error } = await supabase.from('wishlist').select('id').limit(1);
    
    if (error) {
      console.error('❌ [STEP 2] Error accediendo a tabla wishlist:', error);
      console.error('🔍 [STEP 2] Detalles del error:', error.message);
      console.error('🔍 [STEP 2] Código de error:', error.code);
      
      if (error.code === 'PGRST116') {
        console.error('🚨 [STEP 2] La tabla wishlist NO EXISTE en la base de datos');
      }
      return false;
    }
    
    console.log('✅ [STEP 2] Tabla wishlist existe y es accesible');
    console.log('📊 [STEP 2] Datos de prueba:', data);
    return true;
  } catch (error) {
    console.error('❌ [STEP 2] Error verificando tabla wishlist:', error);
    return false;
  }
}

// 3. Verificar si el producto de prueba existe
async function testProductExists() {
  console.log('\n📦 [STEP 3] Verificando si el producto de prueba existe...');
  
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const { data, error } = await supabase.from('products').select('*').eq('id', TEST_PRODUCT_ID).single();
    
    if (error) {
      console.error('❌ [STEP 3] Error buscando producto:', error);
      return false;
    }
    
    console.log('✅ [STEP 3] Producto existe:', data);
    return true;
  } catch (error) {
    console.error('❌ [STEP 3] Error verificando producto:', error);
    return false;
  }
}

// 4. Verificar políticas RLS
async function testRLSPolicies() {
  console.log('\n🔐 [STEP 4] Verificando políticas RLS...');
  
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    
    // Intentar leer wishlist sin autenticación (debería fallar si RLS está activo)
    const { data, error } = await supabase.from('wishlist').select('*').limit(1);
    
    if (error) {
      console.log('✅ [STEP 4] RLS está activo (bloquea acceso anónimo):', error.message);
    } else {
      console.warn('⚠️ [STEP 4] RLS podría no estar activo (permite acceso anónimo)');
    }
    
    // Verificar si existen políticas RLS
    const { data: policies, error: policyError } = await supabase
      .rpc('get_policies_for_table', { table_name: 'wishlist' })
      .catch(() => ({ data: null, error: { message: 'Function not available' } }));
    
    if (policyError) {
      console.warn('⚠️ [STEP 4] No se pueden verificar políticas RLS directamente:', policyError.message);
    } else {
      console.log('✅ [STEP 4] Políticas RLS encontradas:', policies);
    }
    
    return true;
  } catch (error) {
    console.error('❌ [STEP 4] Error verificando RLS:', error);
    return false;
  }
}

// 5. Probar API localmente
async function testLocalAPI() {
  console.log('\n🌐 [STEP 5] Probando API localmente...');
  
  try {
    // Simular una llamada al API local
    const response = await fetch('http://localhost:3000/api/wishlist', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    }).catch(() => null);
    
    if (!response) {
      console.warn('⚠️ [STEP 5] No se puede conectar al servidor local (¿está corriendo npm run dev?)');
      return false;
    }
    
    console.log('✅ [STEP 5] Respuesta del API local:', response.status, response.statusText);
    
    if (response.status === 404) {
      console.error('🚨 [STEP 5] El API local devuelve 404 - PROBLEMA CONFIRMADO');
    }
    
    const text = await response.text();
    console.log('📄 [STEP 5] Contenido de respuesta:', text);
    
    return response.status !== 404;
  } catch (error) {
    console.error('❌ [STEP 5] Error probando API local:', error);
    return false;
  }
}

// 6. Verificar configuración de Next.js
async function checkNextJSConfig() {
  console.log('\n⚙️ [STEP 6] Verificando configuración de Next.js...');
  
  try {
    const fs = require('fs');
    const path = require('path');
    
    // Verificar si existe el archivo de configuración
    const configPath = path.join(__dirname, 'next.config.ts');
    if (fs.existsSync(configPath)) {
      console.log('✅ [STEP 6] Archivo next.config.ts existe');
      const configContent = fs.readFileSync(configPath, 'utf8');
      console.log('📄 [STEP 6] Contenido de next.config.ts:', configContent);
    } else {
      console.warn('⚠️ [STEP 6] No existe next.config.ts');
    }
    
    // Verificar vercel.json
    const vercelPath = path.join(__dirname, 'vercel.json');
    if (fs.existsSync(vercelPath)) {
      console.log('✅ [STEP 6] Archivo vercel.json existe');
      const vercelContent = fs.readFileSync(vercelPath, 'utf8');
      console.log('📄 [STEP 6] Contenido de vercel.json:', vercelContent);
    } else {
      console.warn('⚠️ [STEP 6] No existe vercel.json');
    }
    
    return true;
  } catch (error) {
    console.error('❌ [STEP 6] Error verificando configuración:', error);
    return false;
  }
}

// 7. Verificar estructura de archivos API
async function checkAPIFileStructure() {
  console.log('\n📁 [STEP 7] Verificando estructura de archivos API...');
  
  try {
    const fs = require('fs');
    const path = require('path');
    
    const apiPath = path.join(__dirname, 'app', 'api', 'wishlist');
    const routePath = path.join(apiPath, 'route.ts');
    const idRoutePath = path.join(apiPath, '[id]', 'route.ts');
    
    if (fs.existsSync(routePath)) {
      console.log('✅ [STEP 7] Archivo app/api/wishlist/route.ts existe');
    } else {
      console.error('🚨 [STEP 7] NO EXISTE app/api/wishlist/route.ts - ESTE ES EL PROBLEMA');
      return false;
    }
    
    if (fs.existsSync(idRoutePath)) {
      console.log('✅ [STEP 7] Archivo app/api/wishlist/[id]/route.ts existe');
    } else {
      console.error('🚨 [STEP 7] NO EXISTE app/api/wishlist/[id]/route.ts');
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('❌ [STEP 7] Error verificando estructura de archivos:', error);
    return false;
  }
}

// 8. Probar autenticación
async function testAuthentication() {
  console.log('\n🔐 [STEP 8] Probando autenticación...');
  
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    
    // Intentar obtener información del usuario de prueba
    const { data, error } = await supabase.auth.admin.getUserById(TEST_USER_ID);
    
    if (error) {
      console.warn('⚠️ [STEP 8] No se puede verificar usuario con admin auth (necesita service role):', error.message);
    } else {
      console.log('✅ [STEP 8] Usuario verificado:', data);
    }
    
    // Intentar crear un token de prueba
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: 'test@example.com', // Necesitaríamos credenciales reales
      password: 'testpassword'
    });
    
    if (signInError) {
      console.warn('⚠️ [STEP 8] No se puede iniciar sesión con credenciales de prueba:', signInError.message);
    } else {
      console.log('✅ [STEP 8] Sesión iniciada:', signInData);
    }
    
    return true;
  } catch (error) {
    console.error('❌ [STEP 8] Error en autenticación:', error);
    return false;
  }
}

// Función principal de diagnóstico
async function runDiagnostic() {
  console.log('\n🚀 [DIAGNOSTIC] Iniciando diagnóstico completo...\n');
  
  const results = {
    supabaseConnection: await testSupabaseConnection(),
    wishlistTableExists: await testWishlistTableExists(),
    productExists: await testProductExists(),
    rlsPolicies: await testRLSPolicies(),
    localAPI: await testLocalAPI(),
    nextJSConfig: await checkNextJSConfig(),
    apiFileStructure: await checkAPIFileStructure(),
    authentication: await testAuthentication()
  };
  
  console.log('\n📊 [DIAGNOSTIC] RESUMEN DE RESULTADOS:');
  console.log('=====================================');
  
  Object.entries(results).forEach(([test, result]) => {
    const status = result ? '✅' : '❌';
    console.log(`${status} ${test}: ${result ? 'PASS' : 'FAIL'}`);
  });
  
  console.log('\n🔍 [DIAGNOSTIC] ANÁLISIS DE PROBLEMAS POSIBLES:');
  
  if (!results.apiFileStructure) {
    console.log('🚨 [PROBLEM] Los archivos de ruta API no existen - ESTE ES EL PROBLEMA PRINCIPAL');
  }
  
  if (!results.wishlistTableExists) {
    console.log('🚨 [PROBLEM] La tabla wishlist no existe en la base de datos');
  }
  
  if (!results.supabaseConnection) {
    console.log('🚨 [PROBLEM] No hay conexión a Supabase');
  }
  
  if (!results.localAPI) {
    console.log('🚨 [PROBLEM] El API local devuelve 404');
  }
  
  console.log('\n💡 [DIAGNOSTIC] RECOMENDACIONES:');
  
  if (!results.apiFileStructure) {
    console.log('- Crear los archivos de ruta API en app/api/wishlist/');
  }
  
  if (!results.wishlistTableExists) {
    console.log('- Ejecutar las migraciones para crear la tabla wishlist');
  }
  
  if (!results.rlsPolicies) {
    console.log('- Configurar las políticas RLS para la tabla wishlist');
  }
  
  console.log('\n🏁 [DIAGNOSTIC] Diagnóstico completado');
}

// Ejecutar diagnóstico
runDiagnostic().catch(console.error);
