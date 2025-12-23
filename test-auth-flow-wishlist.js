// Script para probar el flujo de autenticación completo de wishlist
// Simula exactamente lo que hace el cliente cuando agrega un producto a favoritos

const { createClient } = require('@supabase/supabase-js');

// Configuración
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://fkclagdodqeqcvdhqyjl.supabase.co';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZrY2xhZ2RvZHFlcWN2ZGhxeWpsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI0NTA4ODgsImV4cCI6MjA3ODAyNjg4OH0.q1s3qLhTM5M2T1tqJ_3f2BtW1rXy0zL9Yf3kK8mF2cE';

// Usuario de prueba
const TEST_USER_ID = '219488db-1bda-4ac6-a961-8affe601bcb6';
const TEST_PRODUCT_ID = 'product-3';

console.log('🔍 [AUTH-FLOW] Iniciando prueba de flujo de autenticación wishlist');
console.log('👤 [AUTH-FLOW] Usuario de prueba:', TEST_USER_ID);
console.log('📦 [AUTH-FLOW] Producto de prueba:', TEST_PRODUCT_ID);

// 1. Crear cliente Supabase como lo hace el cliente
function createSupabaseClient() {
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    }
  });
}

// 2. Simular la función getAuthToken del cliente
async function getAuthToken() {
  try {
    const supabase = createSupabaseClient();
    
    console.log('🔐 [AUTH-FLOW] Obteniendo sesión actual...');
    
    // Primero intentar obtener la sesión actual
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('❌ [AUTH-FLOW] Error obteniendo sesión:', error);
      return null;
    }
    
    if (session?.access_token) {
      console.log('✅ [AUTH-FLOW] Token obtenido de sesión actual');
      console.log('🔑 [AUTH-FLOW] Token length:', session.access_token.length);
      console.log('🔑 [AUTH-FLOW] Token preview:', session.access_token.substring(0, 20) + '...');
      return session.access_token;
    }
    
    // Si no hay sesión, intentar refrescar
    console.log('🔄 [AUTH-FLOW] Intentando refrescar token...');
    const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession();
    
    if (refreshError) {
      console.error('❌ [AUTH-FLOW] Error refrescando token:', refreshError);
      return null;
    }
    
    if (refreshedSession?.access_token) {
      console.log('✅ [AUTH-FLOW] Token refrescado exitosamente');
      console.log('🔑 [AUTH-FLOW] Refreshed token length:', refreshedSession.access_token.length);
      return refreshedSession.access_token;
    }
    
    console.log('❌ [AUTH-FLOW] No se pudo obtener token');
    return null;
  } catch (error) {
    console.error('❌ [AUTH-FLOW] Error en getAuthToken:', error);
    return null;
  }
}

// 3. Probar API con autenticación
async function testWishlistAPIWithAuth(token) {
  console.log('\n📡 [AUTH-FLOW] Probando API de wishlist con autenticación...');
  
  try {
    if (!token) {
      console.error('❌ [AUTH-FLOW] No hay token para probar API');
      return false;
    }
    
    // Probar GET /api/wishlist
    console.log('🔍 [AUTH-FLOW] Probando GET /api/wishlist...');
    const getResponse = await fetch('http://localhost:3000/api/wishlist', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    
    console.log('📊 [AUTH-FLOW] GET Response status:', getResponse.status);
    console.log('📊 [AUTH-FLOW] GET Response headers:', Object.fromEntries(getResponse.headers.entries()));
    
    if (getResponse.ok) {
      const getData = await getResponse.json();
      console.log('✅ [AUTH-FLOW] GET exitoso:', getData);
    } else {
      const getError = await getResponse.text();
      console.error('❌ [AUTH-FLOW] GET error:', getError);
    }
    
    // Probar POST /api/wishlist
    console.log('🔍 [AUTH-FLOW] Probando POST /api/wishlist...');
    const postResponse = await fetch('http://localhost:3000/api/wishlist', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        product_id: TEST_PRODUCT_ID
      }),
    });
    
    console.log('📊 [AUTH-FLOW] POST Response status:', postResponse.status);
    console.log('📊 [AUTH-FLOW] POST Response headers:', Object.fromEntries(postResponse.headers.entries()));
    
    if (postResponse.ok) {
      const postData = await postResponse.json();
      console.log('✅ [AUTH-FLOW] POST exitoso:', postData);
      return true;
    } else {
      const postError = await postResponse.text();
      console.error('❌ [AUTH-FLOW] POST error:', postError);
      return false;
    }
    
  } catch (error) {
    console.error('❌ [AUTH-FLOW] Error probando API con auth:', error);
    return false;
  }
}

// 4. Verificar si el usuario existe en la base de datos
async function checkUserExists() {
  console.log('\n👤 [AUTH-FLOW] Verificando si el usuario existe en la base de datos...');
  
  try {
    const supabase = createSupabaseClient();
    
    // Intentar obtener información del usuario
    const { data, error } = await supabase.auth.admin.getUserById(TEST_USER_ID);
    
    if (error) {
      console.error('❌ [AUTH-FLOW] Error verificando usuario:', error);
      return false;
    }
    
    if (data?.user) {
      console.log('✅ [AUTH-FLOW] Usuario existe:', data.user.email);
      console.log('👤 [AUTH-FLOW] User ID:', data.user.id);
      console.log('👤 [AUTH-FLOW] User email:', data.user.email);
      console.log('👤 [AUTH-FLOW] User created at:', data.user.created_at);
      return true;
    } else {
      console.error('❌ [AUTH-FLOW] Usuario no encontrado');
      return false;
    }
  } catch (error) {
    console.error('❌ [AUTH-FLOW] Error verificando usuario:', error);
    return false;
  }
}

// 5. Verificar si el producto existe
async function checkProductExists() {
  console.log('\n📦 [AUTH-FLOW] Verificando si el producto existe...');
  
  try {
    const supabase = createSupabaseClient();
    
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', TEST_PRODUCT_ID)
      .single();
    
    if (error) {
      console.error('❌ [AUTH-FLOW] Error verificando producto:', error);
      return false;
    }
    
    if (data) {
      console.log('✅ [AUTH-FLOW] Producto existe:', data.name);
      console.log('📦 [AUTH-FLOW] Product ID:', data.id);
      console.log('📦 [AUTH-FLOW] Product name:', data.name);
      console.log('📦 [AUTH-FLOW] Product price:', data.price);
      return true;
    } else {
      console.error('❌ [AUTH-FLOW] Producto no encontrado');
      return false;
    }
  } catch (error) {
    console.error('❌ [AUTH-FLOW] Error verificando producto:', error);
    return false;
  }
}

// 6. Simular el flujo completo del cliente
async function simulateClientFlow() {
  console.log('\n🔄 [AUTH-FLOW] Simulando flujo completo del cliente...');
  
  try {
    // Paso 1: Obtener token (como lo hace el cliente)
    const token = await getAuthToken();
    
    if (!token) {
      console.error('❌ [AUTH-FLOW] No se pudo obtener token - el problema está en la autenticación del cliente');
      return false;
    }
    
    // Paso 2: Probar API con el token
    const apiResult = await testWishlistAPIWithAuth(token);
    
    if (!apiResult) {
      console.error('❌ [AUTH-FLOW] El API falla incluso con token válido - el problema está en el servidor');
      return false;
    }
    
    console.log('✅ [AUTH-FLOW] Flujo completo exitoso');
    return true;
    
  } catch (error) {
    console.error('❌ [AUTH-FLOW] Error en flujo del cliente:', error);
    return false;
  }
}

// Función principal
async function runAuthFlowTest() {
  console.log('\n🚀 [AUTH-FLOW] Iniciando prueba completa de flujo de autenticación...\n');
  
  const results = {
    userExists: await checkUserExists(),
    productExists: await checkProductExists(),
    clientFlow: await simulateClientFlow()
  };
  
  console.log('\n📊 [AUTH-FLOW] RESUMEN DE RESULTADOS:');
  console.log('=====================================');
  
  Object.entries(results).forEach(([test, result]) => {
    const status = result ? '✅' : '❌';
    console.log(`${status} ${test}: ${result ? 'PASS' : 'FAIL'}`);
  });
  
  console.log('\n🔍 [AUTH-FLOW] ANÁLISIS DEL PROBLEMA:');
  
  if (!results.userExists) {
    console.log('🚨 [PROBLEM] El usuario de prueba no existe en la base de datos');
    console.log('💡 [SOLUTION] Crear el usuario o usar un usuario existente');
  }
  
  if (!results.productExists) {
    console.log('🚨 [PROBLEM] El producto de prueba no existe');
    console.log('💡 [SOLUTION] Verificar el ID del producto o crear el producto');
  }
  
  if (!results.clientFlow) {
    console.log('🚨 [PROBLEM] El flujo del cliente falla');
    console.log('💡 [SOLUTION] Revisar la implementación de getAuthToken() en el cliente');
  }
  
  if (results.userExists && results.productExists && results.clientFlow) {
    console.log('✅ [AUTH-FLOW] Todo funciona correctamente - el problema podría estar en otro lugar');
  }
  
  console.log('\n🏁 [AUTH-FLOW] Prueba de flujo de autenticación completada');
}

// Ejecutar prueba
runAuthFlowTest().catch(console.error);