// Script para probar el API de producción directamente
// y comparar con el comportamiento local

console.log('🌐 [PROD-API] Iniciando prueba del API de producción');
console.log('🎯 [PROD-API] Objetivo: Identificar diferencias entre local y producción');

const PRODUCTION_URL = 'https://tus-aguacates.vercel.app';
const LOCAL_URL = 'http://localhost:3000';

// 1. Probar API local sin autenticación
async function testLocalAPIWithoutAuth() {
  console.log('\n🏠 [PROD-API] Probando API local sin autenticación...');
  
  try {
    const response = await fetch(`${LOCAL_URL}/api/wishlist`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        product_id: 'product-3'
      }),
    });
    
    console.log('📊 [PROD-API] Local API status:', response.status);
    console.log('📊 [PROD-API] Local API statusText:', response.statusText);
    
    const text = await response.text();
    console.log('📄 [PROD-API] Local API response:', text);
    
    return {
      status: response.status,
      statusText: response.statusText,
      body: text
    };
  } catch (error) {
    console.error('❌ [PROD-API] Error probando API local:', error);
    return null;
  }
}

// 2. Probar API de producción sin autenticación
async function testProductionAPIWithoutAuth() {
  console.log('\n🚀 [PROD-API] Probando API de producción sin autenticación...');
  
  try {
    const response = await fetch(`${PRODUCTION_URL}/api/wishlist`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        product_id: 'product-3'
      }),
    });
    
    console.log('📊 [PROD-API] Production API status:', response.status);
    console.log('📊 [PROD-API] Production API statusText:', response.statusText);
    
    const text = await response.text();
    console.log('📄 [PROD-API] Production API response:', text);
    
    return {
      status: response.status,
      statusText: response.statusText,
      body: text
    };
  } catch (error) {
    console.error('❌ [PROD-API] Error probando API de producción:', error);
    return null;
  }
}

// 3. Probar API local con autenticación falsa
async function testLocalAPIWithFakeAuth() {
  console.log('\n🏠 [PROD-API] Probando API local con token falso...');
  
  try {
    const response = await fetch(`${LOCAL_URL}/api/wishlist`, {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer fake-token-for-testing',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        product_id: 'product-3'
      }),
    });
    
    console.log('📊 [PROD-API] Local API with fake auth status:', response.status);
    console.log('📊 [PROD-API] Local API with fake auth statusText:', response.statusText);
    
    const text = await response.text();
    console.log('📄 [PROD-API] Local API with fake auth response:', text);
    
    return {
      status: response.status,
      statusText: response.statusText,
      body: text
    };
  } catch (error) {
    console.error('❌ [PROD-API] Error probando API local con auth falsa:', error);
    return null;
  }
}

// 4. Probar API de producción con autenticación falsa
async function testProductionAPIWithFakeAuth() {
  console.log('\n🚀 [PROD-API] Probando API de producción con token falso...');
  
  try {
    const response = await fetch(`${PRODUCTION_URL}/api/wishlist`, {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer fake-token-for-testing',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        product_id: 'product-3'
      }),
    });
    
    console.log('📊 [PROD-API] Production API with fake auth status:', response.status);
    console.log('📊 [PROD-API] Production API with fake auth statusText:', response.statusText);
    
    const text = await response.text();
    console.log('📄 [PROD-API] Production API with fake auth response:', text);
    
    return {
      status: response.status,
      statusText: response.statusText,
      body: text
    };
  } catch (error) {
    console.error('❌ [PROD-API] Error probando API de producción con auth falsa:', error);
    return null;
  }
}

// 5. Probar OPTIONS para verificar CORS
async function testOPTIONS(local = true) {
  const url = local ? LOCAL_URL : PRODUCTION_URL;
  const env = local ? 'Local' : 'Production';
  
  console.log(`\n🌐 [PROD-API] Probando OPTIONS en ${env}...`);
  
  try {
    const response = await fetch(`${url}/api/wishlist`, {
      method: 'OPTIONS',
      headers: {
        'Origin': local ? 'http://localhost:3000' : 'https://tus-aguacates.vercel.app',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type, Authorization',
      },
    });
    
    console.log(`📊 [PROD-API] ${env} OPTIONS status:`, response.status);
    console.log(`📊 [PROD-API] ${env} OPTIONS headers:`, Object.fromEntries(response.headers.entries()));
    
    return {
      status: response.status,
      headers: Object.fromEntries(response.headers.entries())
    };
  } catch (error) {
    console.error(`❌ [PROD-API] Error probando OPTIONS en ${env}:`, error);
    return null;
  }
}

// 6. Analizar diferencias
function analyzeDifferences(localResult, productionResult) {
  console.log('\n🔍 [PROD-API] Analizando diferencias...');
  
  if (!localResult || !productionResult) {
    console.log('❌ [PROD-API] No se pueden comparar - faltan resultados');
    return;
  }
  
  console.log('\n📊 [PROD-API] COMPARACIÓN:');
  console.log('=====================================');
  console.log(`Local Status: ${localResult.status} ${localResult.statusText}`);
  console.log(`Production Status: ${productionResult.status} ${productionResult.statusText}`);
  
  if (localResult.status !== productionResult.status) {
    console.log('🚨 [PROD-API] DIFERENCIA EN STATUS CODE');
    console.log(`   Local: ${localResult.status}`);
    console.log(`   Production: ${productionResult.status}`);
  }
  
  if (localResult.body !== productionResult.body) {
    console.log('🚨 [PROD-API] DIFERENCIA EN BODY');
    console.log(`   Local: ${localResult.body}`);
    console.log(`   Production: ${productionResult.body}`);
  }
  
  // Análisis específico para el problema reportado
  if (productionResult.status === 404) {
    console.log('\n🎯 [PROD-API] PROBLEMA IDENTIFICADO:');
    console.log('   El API de producción devuelve 404');
    console.log('   El API local devuelve 401');
    console.log('   Esto indica un problema de routing en Vercel');
  }
  
  if (productionResult.status === 401 && localResult.status === 401) {
    console.log('\n✅ [PROD-API] AMBOS COMPORTAMIENTOS IGUALES:');
    console.log('   El problema podría estar en el cliente');
    console.log('   O en cómo se interpreta el error en el navegador');
  }
}

// 7. Identificar la causa raíz
function identifyRootCause(localNoAuth, prodNoAuth, localFakeAuth, prodFakeAuth) {
  console.log('\n🎯 [PROD-API] IDENTIFICANDO CAUSA RAÍZ...');
  
  console.log('\n🔍 [PROD-API] Escenario 1: Sin autenticación');
  if (localNoAuth?.status === 401 && prodNoAuth?.status === 404) {
    console.log('🚨 [PROD-API] PROBLEMA: Vercel convierte 401 en 404');
    console.log('💡 [PROD-API] SOLUCIÓN: Configurar rewrites en vercel.json');
  }
  
  if (localNoAuth?.status === 401 && prodNoAuth?.status === 401) {
    console.log('✅ [PROD-API] OK: Ambos devuelven 401 correctamente');
  }
  
  console.log('\n🔍 [PROD-API] Escenario 2: Con token falso');
  if (localFakeAuth?.status === 401 && prodFakeAuth?.status === 404) {
    console.log('🚨 [PROD-API] PROBLEMA: Vercel tiene problema con auth headers');
  }
  
  console.log('\n🔍 [PROD-API] Escenario 3: Problemas de routing');
  if (prodNoAuth?.status === 404) {
    console.log('🚨 [PROD-API] PROBLEMA: El routing en Vercel no funciona');
    console.log('💡 [PROD-API] SOLUCIÓN: Revisar vercel.json y estructura de archivos');
  }
}

// Función principal
async function runProductionAPITest() {
  console.log('\n🚀 [PROD-API] Iniciando prueba completa del API de producción...\n');
  
  // Probar sin autenticación
  const localNoAuth = await testLocalAPIWithoutAuth();
  const prodNoAuth = await testProductionAPIWithoutAuth();
  
  // Probar con autenticación falsa
  const localFakeAuth = await testLocalAPIWithFakeAuth();
  const prodFakeAuth = await testProductionAPIWithFakeAuth();
  
  // Probar OPTIONS
  await testOPTIONS(true);
  await testOPTIONS(false);
  
  // Analizar resultados
  analyzeDifferences(localNoAuth, prodNoAuth);
  identifyRootCause(localNoAuth, prodNoAuth, localFakeAuth, prodFakeAuth);
  
  console.log('\n📊 [PROD-API] RESUMEN FINAL:');
  console.log('=====================================');
  console.log('Local sin auth:', localNoAuth?.status, localNoAuth?.statusText);
  console.log('Production sin auth:', prodNoAuth?.status, prodNoAuth?.statusText);
  console.log('Local con fake auth:', localFakeAuth?.status, localFakeAuth?.statusText);
  console.log('Production con fake auth:', prodFakeAuth?.status, prodFakeAuth?.statusText);
  
  console.log('\n💡 [PROD-API] RECOMENDACIONES:');
  if (prodNoAuth?.status === 404) {
    console.log('1. Revisar configuración de vercel.json');
    console.log('2. Verificar que los archivos API estén en el deploy');
    console.log('3. Configurar rewrites si es necesario');
  }
  
  if (prodNoAuth?.status === 401) {
    console.log('1. El API funciona correctamente en producción');
    console.log('2. El problema está en el cliente (autenticación)');
    console.log('3. Revisar el flujo de autenticación en el navegador');
  }
  
  console.log('\n🏁 [PROD-API] Prueba del API de producción completada');
}

// Ejecutar prueba
runProductionAPITest().catch(console.error);