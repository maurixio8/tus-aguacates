const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase
const supabaseUrl = 'https://gxqkmaaqoehydulksudj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd4cWttYWFxb2VoeWR1bGtzdWRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI0NDI5NDQsImV4cCI6MjA3ODAxODk0NH0.XAR-ysQgt0ZkRZfIZx_DvpYMzmEMFsdAYK3EP1tc0mw';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testWishlistAPI() {
  console.log('🔍 Iniciando pruebas de API de Wishlist...\n');

  try {
    // 1. Iniciar sesión con el usuario de prueba
    console.log('📝 1. Iniciando sesión con usuario de prueba...');
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
    console.log('👤 Usuario ID:', userId);
    console.log('🔑 Token length:', token.length);
    console.log('');

    // 2. Probar GET /api/wishlist
    console.log('📡 2. Probando GET /api/wishlist...');
    const getResponse = await fetch('http://localhost:3000/api/wishlist', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    console.log('📊 Status:', getResponse.status);
    const getData = await getResponse.json();
    console.log('📋 Response:', getData);
    console.log('');

    // 3. Obtener un producto real de la base de datos
    console.log('📦 3. Obteniendo un producto real de la base de datos...');
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id')
      .limit(1);

    if (productsError || !products || products.length === 0) {
      console.error('❌ Error obteniendo productos:', productsError);
      return;
    }

    const realProductId = products[0].id;
    console.log('✅ Producto real encontrado:', realProductId);

    // 4. Probar POST /api/wishlist (agregar producto)
    console.log('📝 4. Probando POST /api/wishlist (agregar producto)...');
    const postResponse = await fetch('http://localhost:3000/api/wishlist', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        product_id: realProductId
      }),
    });

    console.log('📊 Status:', postResponse.status);
    const postData = await postResponse.json();
    console.log('📋 Response:', postData);
    console.log('');

    // 5. Probar GET nuevamente para verificar que se agregó
    console.log('📡 5. Verificando que el producto se agregó...');
    const getAfterAddResponse = await fetch('http://localhost:3000/api/wishlist', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    console.log('📊 Status:', getAfterAddResponse.status);
    const getAfterAddData = await getAfterAddResponse.json();
    console.log('📋 Wishlist después de agregar:', getAfterAddData);
    console.log('');

    // 6. Probar DELETE /api/wishlist/[id]
    console.log('🗑️ 6. Probando DELETE /api/wishlist/' + realProductId + '...');
    const deleteResponse = await fetch('http://localhost:3000/api/wishlist/' + realProductId, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    console.log('📊 Status:', deleteResponse.status);
    const deleteData = await deleteResponse.json();
    console.log('📋 Response:', deleteData);
    console.log('');

    // 7. Verificar que se eliminó
    console.log('📡 7. Verificando que el producto se eliminó...');
    const getAfterDeleteResponse = await fetch('http://localhost:3000/api/wishlist', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    console.log('📊 Status:', getAfterDeleteResponse.status);
    const getAfterDeleteData = await getAfterDeleteResponse.json();
    console.log('📋 Wishlist después de eliminar:', getAfterDeleteData);
    console.log('');

    console.log('✅ Pruebas completadas exitosamente');

  } catch (error) {
    console.error('❌ Error en las pruebas:', error);
  }
}

testWishlistAPI();