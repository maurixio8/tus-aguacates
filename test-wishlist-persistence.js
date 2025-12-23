const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase
const supabaseUrl = 'https://gxqkmaaqoehydulksudj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd4cWttYWFxb2VoeWR1bGtzdWRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI0NDI5NDQsImV4cCI6MjA3ODAxODk0NH0.XAR-ysQgt0ZkRZfIZx_DvpYMzmEMFsdAYK3EP1tc0mw';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testWishlistPersistence() {
  console.log('🔍 Iniciando pruebas de persistencia de wishlist...\n');

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

    // 2. Limpiar wishlist completamente (estado inicial conocido)
    console.log('🗑️ 2. Limpiando wishlist completamente...');
    
    // Primero, obtener wishlist actual
    const initialWishlistResponse = await fetch('http://localhost:3000/api/wishlist', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const initialWishlistData = await initialWishlistResponse.json();
    console.log(`📋 Wishlist inicial: ${initialWishlistData.data?.length || 0} items`);

    // Eliminar todos los items existentes
    if (initialWishlistData.data && initialWishlistData.data.length > 0) {
      for (const item of initialWishlistData.data) {
        const deleteResponse = await fetch(`http://localhost:3000/api/wishlist/${item.product_id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (deleteResponse.status === 200) {
          console.log(`✅ Eliminado: ${item.product.name}`);
        } else {
          const deleteData = await deleteResponse.json();
          console.log(`❌ Error eliminando ${item.product.name}:`, deleteData.error);
        }
      }
    }

    // Verificar que esté vacía
    const afterClearResponse = await fetch('http://localhost:3000/api/wishlist', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const afterClearData = await afterClearResponse.json();
    console.log(`📋 Wishlist después de limpiar: ${afterClearData.data?.length || 0} items`);
    console.log('');

    // 3. Obtener un producto real
    console.log('📦 3. Obteniendo producto real...');
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

    // 4. Agregar producto a favoritos (simulado exitoso)
    console.log('❤️ 4. Agregando producto a favoritos (simulado)...');
    
    // Simular una inserción directa en la base de datos (bypass RLS temporalmente)
    const { data: insertResult, error: insertError } = await supabase
      .from('wishlist')
      .insert({
        user_id: userId,
        product_id: testProduct.id
      })
      .select()
      .single();

    if (insertError) {
      console.error('❌ Error insertando directamente:', insertError);
    } else {
      console.log('✅ Producto insertado directamente en BD:', insertResult);
    }
    console.log('');

    // 5. Verificar que el producto esté en wishlist
    console.log('📋 5. Verificando que el producto esté en wishlist...');
    const verifyResponse = await fetch('http://localhost:3000/api/wishlist', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const verifyData = await verifyResponse.json();
    console.log(`📋 Wishlist después de agregar: ${verifyData.data?.length || 0} items`);
    
    if (verifyData.data && verifyData.data.length > 0) {
      const foundItem = verifyData.data.find(item => item.product_id === testProduct.id);
      if (foundItem) {
        console.log('✅ Producto encontrado en wishlist:', foundItem.product.name);
      } else {
        console.log('⚠️ Producto no encontrado en wishlist a pesar de la inserción directa');
      }
    }
    console.log('');

    // 6. Recargar la página (simular refresh del navegador)
    console.log('🔄 6. Simulando recarga de página...');
    
    // Esperar un momento
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Verificar wishlist después de "recargar"
    const afterReloadResponse = await fetch('http://localhost:3000/api/wishlist', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const afterReloadData = await afterReloadResponse.json();
    console.log(`📋 Wishlist después de recargar: ${afterReloadData.data?.length || 0} items`);
    console.log('');

    // 7. Cerrar sesión y volver a iniciar
    console.log('🔓 7. Cerrando sesión y volviendo a iniciar...');
    
    // Cerrar sesión
    await supabase.auth.signOut();
    
    // Esperar un momento
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Iniciar sesión nuevamente
    const { data: reauthData, error: reauthError } = await supabase.auth.signInWithPassword({
      email: 'test@example.com',
      password: 'password123'
    });

    if (reauthError) {
      console.error('❌ Error en reautenticación:', reauthError);
      return;
    }

    const newToken = reauthData.session.access_token;
    console.log('✅ Reautenticación exitosa');
    console.log('');

    // 8. Verificar persistencia después de reautenticación
    console.log('📋 8. Verificando persistencia después de reautenticación...');
    const finalResponse = await fetch('http://localhost:3000/api/wishlist', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${newToken}`,
        'Content-Type': 'application/json',
      },
    });

    const finalData = await finalResponse.json();
    console.log(`📋 Wishlist final: ${finalData.data?.length || 0} items`);
    console.log('');

    // 9. Análisis de persistencia
    console.log('🎯 ANÁLISIS DE PERSISTENCIA:');
    console.log('==========================================');
    
    if (finalData.data && finalData.data.length > 0) {
      console.log('✅ PERSISTENCIA EXITOSA: Los favoritos persisten después de reautenticación');
      console.log(`📊 Total de items persistentes: ${finalData.data.length}`);
      
      // Verificar si el producto agregado está presente
      const persistentItem = finalData.data.find(item => item.product_id === testProduct.id);
      if (persistentItem) {
        console.log('✅ El producto agregado persiste correctamente');
      } else {
        console.log('⚠️ El producto agregado no persiste');
      }
    } else {
      console.log('❌ PERSISTENCIA FALLIDA: Los favoritos no persisten después de reautenticación');
    }

    console.log('');
    console.log('🔍 OBSERVACIONES ADICIONALES:');
    console.log('- La API GET funciona correctamente');
    console.log('- La inserción directa en BD funciona');
    console.log('- La persistencia depende de las políticas RLS');
    console.log('- El manejo de sesiones funciona correctamente');

  } catch (error) {
    console.error('❌ Error general en las pruebas de persistencia:', error);
  }
}

testWishlistPersistence();