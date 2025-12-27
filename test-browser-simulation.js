// Script para simular exactamente lo que hace el navegador
// cuando un usuario intenta agregar un producto a favoritos

console.log('🌐 [BROWSER-SIM] Iniciando simulación del navegador');
console.log('🎯 [BROWSER-SIM] Objetivo: Reproducir el error 404 del cliente');

// 1. Simular el estado del localStorage (como estaría en el navegador)
function simulateBrowserStorage() {
  console.log('\n💾 [BROWSER-SIM] Simulando estado del localStorage...');
  
  // Simular el estado que tendría el navegador después de login
  const mockStorage = {
    'sb-fkclagdodqeqcvdhqyjl-auth-token': JSON.stringify({
      access_token: 'mock-access-token-for-testing',
      refresh_token: 'mock-refresh-token-for-testing',
      user: {
        id: '219488db-1bda-4ac6-a961-8affe601bcb6',
        email: 'test@example.com'
      }
    })
  };
  
  console.log('📝 [BROWSER-SIM] Storage simulado:', Object.keys(mockStorage));
  return mockStorage;
}

// 2. Simular la función getAuthToken como la usa el cliente
async function simulateGetAuthToken() {
  console.log('\n🔐 [BROWSER-SIM] Simulando getAuthToken() del cliente...');
  
  try {
    // En el navegador real, esto leería del localStorage
    // Aquí simulamos que no hay sesión (como parece ser el caso)
    console.log('❌ [BROWSER-SIM] No hay sesión en localStorage (simulando caso real)');
    console.log('🔄 [BROWSER-SIM] Intentando refrescar token...');
    
    // Simular el caso donde refreshSession falla
    console.log('❌ [BROWSER-SIM] refreshSession falla - no hay refresh token válido');
    
    return null;
  } catch (error) {
    console.error('❌ [BROWSER-SIM] Error en getAuthToken:', error);
    return null;
  }
}

// 3. Simular la llamada al API como la hace el cliente
async function simulateAPICall() {
  console.log('\n📡 [BROWSER-SIM] Simulando llamada al API del cliente...');
  
  try {
    // Obtener token (como lo hace el cliente)
    const token = await simulateGetAuthToken();
    
    if (!token) {
      console.log('❌ [BROWSER-SIM] No hay token - el cliente no debería llamar al API');
      console.log('🚨 [BROWSER-SIM] PERO EL CLIENTE IGUAL INTENTA LLAMAR AL API - ESTE ES EL PROBLEMA');
      
      // Simular lo que pasa cuando el cliente igual intenta llamar al API
      console.log('📡 [BROWSER-SIM] Enviando request sin token...');
      
      const response = await fetch('http://localhost:3000/api/wishlist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Sin Authorization header - esto es lo que causa el 401
        },
        body: JSON.stringify({
          product_id: 'product-3'
        }),
      });
      
      console.log('📊 [BROWSER-SIM] Response status:', response.status);
      console.log('📊 [BROWSER-SIM] Response text:', await response.text());
      
      return false;
    }
    
    // Si hubiera token
    console.log('✅ [BROWSER-SIM] Token disponible, llamando al API...');
    
    const response = await fetch('http://localhost:3000/api/wishlist', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        product_id: 'product-3'
      }),
    });
    
    console.log('📊 [BROWSER-SIM] Response status:', response.status);
    return response.ok;
    
  } catch (error) {
    console.error('❌ [BROWSER-SIM] Error en llamada al API:', error);
    return false;
  }
}

// 4. Analizar el código del cliente real
function analyzeClientCode() {
  console.log('\n🔍 [BROWSER-SIM] Analizando código del cliente real...');
  
  console.log('📝 [BROWSER-SIM] Revisando lib/wishlist-store.ts...');
  console.log('🔍 [BROWSER-SIM] La función addToWishlist hace:');
  console.log('   1. Verifica si hay userId');
  console.log('   2. Llama a getAuthToken()');
  console.log('   3. Si no hay token, setea error y retorna false');
  console.log('   4. Si hay token, hace la llamada al API');
  
  console.log('\n🤔 [BROWSER-SIM] Posibles problemas:');
  console.log('   1. El userId se pasa correctamente?');
  console.log('   2. getAuthToken() funciona correctamente?');
  console.log('   3. El token se está enviando en el header?');
  console.log('   4. Hay un race condition?');
}

// 5. Verificar el flujo real del componente
function analyzeComponentFlow() {
  console.log('\n🧩 [BROWSER-SIM] Analizando flujo del componente...');
  
  console.log('📝 [BROWSER-SIM] En ProductCard/ProductDetailModal:');
  console.log('   1. Usuario hace clic en "Agregar a favoritos"');
  console.log('   2. Se llama a addToWishlist(product, userId)');
  console.log('   3. userId viene del contexto de autenticación');
  console.log('   4. Si userId es null/undefined, debería mostrar error');
  console.log('   5. Si userId existe, intenta obtener token');
  
  console.log('\n🚨 [BROWSER-SIM] PROBLEMAS POSIBLES:');
  console.log('   1. userId es undefined pero el código continúa');
  console.log('   2. getAuthToken() retorna null pero el código continúa');
  console.log('   3. El token se obtiene pero no se envía correctamente');
  console.log('   4. Hay un error en el manejo de errores que hace que se vea como 404');
}

// 6. Probar con diferentes escenarios
async function testScenarios() {
  console.log('\n🎭 [BROWSER-SIM] Probando diferentes escenarios...');
  
  // Escenario 1: Sin autenticación (el caso más probable)
  console.log('\n📋 [BROWSER-SIM] ESCENARIO 1: Usuario no autenticado');
  console.log('   - userId: null/undefined');
  console.log('   - token: null');
  console.log('   - Resultado esperado: Error de autenticación, no 404');
  
  const result1 = await simulateAPICall();
  console.log('   - Resultado real:', result1 ? 'Success' : 'Error 401');
  
  // Escenario 2: Con autenticación pero token inválido
  console.log('\n📋 [BROWSER-SIM] ESCENARIO 2: Token inválido');
  console.log('   - userId: válido');
  console.log('   - token: inválido');
  console.log('   - Resultado esperado: Error 401');
  
  // Escenario 3: Con autenticación válida
  console.log('\n📋 [BROWSER-SIM] ESCENARIO 3: Autenticación válida');
  console.log('   - userId: válido');
  console.log('   - token: válido');
  console.log('   - Resultado esperado: Success o error de negocio');
}

// 7. Identificar el problema real
function identifyRealProblem() {
  console.log('\n🎯 [BROWSER-SIM] IDENTIFICANDO EL PROBLEMA REAL...');
  
  console.log('\n🔍 [BROWSER-SIM] Basado en los logs originales:');
  console.log('   "📡 [WISHLIST-STORE] Sending POST request to /api/wishlist for product: product-3"');
  console.log('   "/api/wishlist:1 Failed to load resource: the server responded with a status of 404 ()"');
  console.log('   "📡 [WISHLIST-STORE] Add to wishlist API response status: 404"');
  console.log('   "❌ [WISHLIST-STORE] API error, rolling back optimistic update"');
  
  console.log('\n🤔 [BROWSER-SIM] Análisis:');
  console.log('   1. El cliente SÍ está llamando al API (hay logs del cliente)');
  console.log('   2. El servidor local SÍ responde (vimos en los logs)');
  console.log('   3. Pero el cliente ve 404 en lugar de 401');
  
  console.log('\n🚨 [BROWSER-SIM] POSIBLES CAUSAS DEL 404:');
  console.log('   1. El cliente está llamando a una URL incorrecta');
  console.log('   2. Hay un proxy o middleware que convierte 401 en 404');
  console.log('   3. El error 401 se está manejando mal y se muestra como 404');
  console.log('   4. Hay un problema con el routing en producción vs desarrollo');
  console.log('   5. El error viene de Vercel, no del servidor local');
}

// Función principal
async function runBrowserSimulation() {
  console.log('\n🚀 [BROWSER-SIM] Iniciando simulación completa del navegador...\n');
  
  simulateBrowserStorage();
  await simulateAPICall();
  analyzeClientCode();
  analyzeComponentFlow();
  await testScenarios();
  identifyRealProblem();
  
  console.log('\n📊 [BROWSER-SIM] CONCLUSIONES:');
  console.log('=====================================');
  console.log('1. El API local funciona y devuelve 401 cuando no hay token');
  console.log('2. El cliente está llamando al API pero viendo 404');
  console.log('3. El problema podría estar en:');
  console.log('   - La URL que está usando el cliente');
  console.log('   - El manejo de errores en el cliente');
  console.log('   - Diferencias entre entorno local y producción');
  
  console.log('\n💡 [BROWSER-SIM] PRÓXIMOS PASOS:');
  console.log('1. Verificar exactamente qué URL está llamando el cliente');
  console.log('2. Revisar el manejo de errores en wishlist-store.ts');
  console.log('3. Probar en el entorno real (producción)');
  console.log('4. Revisar si hay un middleware que esté afectando las respuestas');
  
  console.log('\n🏁 [BROWSER-SIM] Simulación completada');
}

// Ejecutar simulación
runBrowserSimulation().catch(console.error);