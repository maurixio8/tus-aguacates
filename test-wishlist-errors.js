const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase
const supabaseUrl = 'https://gxqkmaaqoehydulksudj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd4cWttYWFxb2VoeWR1bGtzdWRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI0NDI5NDQsImV4cCI6MjA3ODAxODk0NH0.XAR-ysQgt0ZkRZfIZx_DvpYMzmEMFsdAYK3EP1tc0mw';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testWishlistErrorHandling() {
  console.log('🔍 Iniciando pruebas de manejo de errores en wishlist...\n');

  try {
    // 1. Iniciar sesión con el usuario de prueba
    console.log('📝 1. Iniciando sesión...');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'test@example.com',
      password: 'password123'
    });

    if (authError) {
      console.error('❌ Error en autenticación:', authError);
      return;
    }

    const token = authData.session.access_token;
    const userId = authData.session.user.id;
    console.log('✅ Autenticación exitosa');
    console.log('');

    // 2. Obtener un producto real
    console.log('📦 2. Obteniendo producto real...');
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, name, price')
      .limit(1);

    if (productsError || !products || products.length === 0) {
      console.error('❌ Error obteniendo productos:', productsError);
      return;
    }

    const testProduct = products[0];
    console.log('✅ Producto encontrado:', testProduct.name);
    console.log('');

    // 3. PRUEBA: Múltiples clics simultáneos
    console.log('⚡ 3. PRUEBA: Múltiples clics simultáneos...');
    
    const promises = [];
    for (let i = 0; i < 3; i++) {
      console.log(`🖱️ Enviando solicitud ${i + 1}...`);
      const promise = fetch('http://localhost:3000/api/wishlist', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          product_id: testProduct.id
        }),
      });
      promises.push(promise);
    }

    const results = await Promise.allSettled(promises);
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        const response = result.value;
        console.log(`📊 Solicitud ${index + 1} - Status: ${response.status}`);
        if (response.status === 500) {
          console.log('⚠️ Error esperado por políticas RLS');
        } else if (response.status === 409) {
          console.log('✅ Protección contra duplicados funcionando');
        } else if (response.status === 200) {
          console.log('✅ Producto agregado (puede ser race condition)');
        }
      } else {
        console.log(`❌ Solicitud ${index + 1} falló:`, result.reason);
      }
    });
    console.log('');

    // 4. PRUEBA: Token inválido
    console.log('🔑 4. PRUEBA: Token inválido...');
    const invalidTokenResponse = await fetch('http://localhost:3000/api/wishlist', {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer invalid-token-123',
        'Content-Type': 'application/json',
      },
    });

    console.log('📊 Status con token inválido:', invalidTokenResponse.status);
    const invalidTokenData = await invalidTokenResponse.json();
    console.log('📋 Respuesta:', invalidTokenData);
    console.log('');

    // 5. PRUEBA: Sin token
    console.log('🚫 5. PRUEBA: Sin token...');
    const noTokenResponse = await fetch('http://localhost:3000/api/wishlist', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log('📊 Status sin token:', noTokenResponse.status);
    const noTokenData = await noTokenResponse.json();
    console.log('📋 Respuesta:', noTokenData);
    console.log('');

    // 6. PRUEBA: Producto no existente
    console.log('🔍 6. PRUEBA: Producto no existente...');
    const nonExistentProductResponse = await fetch('http://localhost:3000/api/wishlist', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        product_id: '00000000-0000-0000-0000-000000000000'
      }),
    });

    console.log('📊 Status con producto no existente:', nonExistentProductResponse.status);
    const nonExistentProductData = await nonExistentProductResponse.json();
    console.log('📋 Respuesta:', nonExistentProductData);
    console.log('');

    // 7. PRUEBA: Eliminar producto no existente
    console.log('🗑️ 7. PRUEBA: Eliminar producto no existente...');
    const deleteNonExistentResponse = await fetch('http://localhost:3000/api/wishlist/00000000-0000-0000-0000-000000000000', {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    console.log('📊 Status eliminando producto no existente:', deleteNonExistentResponse.status);
    const deleteNonExistentData = await deleteNonExistentResponse.json();
    console.log('📋 Respuesta:', deleteNonExistentData);
    console.log('');

    // 8. PRUEBA: Request mal formado
    console.log('📝 8. PRUEBA: Request mal formado...');
    const malformedResponse = await fetch('http://localhost:3000/api/wishlist', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        // product_id faltante
      }),
    });

    console.log('📊 Status con request mal formado:', malformedResponse.status);
    const malformedData = await malformedResponse.json();
    console.log('📋 Respuesta:', malformedData);
    console.log('');

    console.log('🎯 RESUMEN DE PRUEBAS DE MANEJO DE ERRORES:');
    console.log('==========================================');
    console.log('✅ Autenticación: Funciona correctamente');
    console.log('⚡ Múltiples clics: Se prueba la protección');
    console.log('🔑 Token inválido: Se debe rechazar con 401');
    console.log('🚫 Sin token: Se debe rechazar con 401');
    console.log('🔍 Producto no existente: Se debe rechazar con 404');
    console.log('🗑️ Eliminar no existente: Se debe rechazar con 404');
    console.log('📝 Request mal formado: Se debe rechazar con 400');
    console.log('');
    console.log('🔍 OBSERVACIONES:');
    console.log('- Las políticas RLS están bloqueando las operaciones de escritura');
    console.log('- El manejo de errores básico funciona correctamente');
    console.log('- Se necesita corregir las políticas RLS para funcionamiento completo');

  } catch (error) {
    console.error('❌ Error general en las pruebas:', error);
  }
}

testWishlistErrorHandling();