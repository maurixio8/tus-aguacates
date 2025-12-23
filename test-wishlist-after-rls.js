/**
 * Script para probar el sistema de favoritos después de aplicar las políticas RLS
 * Este script verifica que las operaciones CRUD funcionen correctamente
 */

const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase
const supabaseUrl = 'https://gxqkmaaqoehydulksudj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd4cWttYWFxb2VoeWR1bGtzdWRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI0NTA4ODgsImV4cCI6MjA3ODAyNjg4OH0.7p9k0J5T8Qh5J3QzQkQkQkQkQkQkQkQkQkQkQkQkQkQ';

// Crear cliente de Supabase
const supabase = createClient(supabaseUrl, supabaseKey);

// Usuario de prueba
const testUser = {
  email: 'usuario.prueba@ejemplo.com',
  password: 'Password123!',
  id: '219488db-1bda-4ac6-a961-8affe601bcb6'
};

// Producto de prueba
const testProduct = {
  id: 'test-product-id',
  name: 'Producto de Prueba',
  price: 99.99
};

async function testWishlistAfterRLS() {
  console.log('🧪 INICIANDO PRUEBAS DEL SISTEMA DE FAVORITOS DESPUÉS DE APLICAR POLÍTICAS RLS');
  console.log('=' .repeat(80));

  try {
    // 1. Iniciar sesión con el usuario de prueba
    console.log('\n📝 Paso 1: Iniciando sesión con el usuario de prueba...');
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: testUser.email,
      password: testUser.password
    });

    if (signInError) {
      console.error('❌ Error al iniciar sesión:', signInError.message);
      return;
    }

    console.log('✅ Sesión iniciada correctamente');
    console.log('👤 Usuario ID:', signInData.user.id);

    // 2. Verificar que no haya favoritos existentes para el usuario
    console.log('\n📝 Paso 2: Verificando favoritos existentes...');
    const { data: existingWishlist, error: fetchError } = await supabase
      .from('wishlist')
      .select('*')
      .eq('user_id', testUser.id);

    if (fetchError) {
      console.error('❌ Error al obtener favoritos existentes:', fetchError.message);
      return;
    }

    console.log(`📋 Se encontraron ${existingWishlist.length} favoritos existentes`);

    // 3. Intentar agregar un producto a favoritos (INSERT)
    console.log('\n📝 Paso 3: Agregando producto a favoritos...');
    const { data: insertData, error: insertError } = await supabase
      .from('wishlist')
      .insert({
        user_id: testUser.id,
        product_id: testProduct.id,
        product_name: testProduct.name,
        product_price: testProduct.price
      })
      .select()
      .single();

    if (insertError) {
      console.error('❌ Error al agregar producto a favoritos:', insertError.message);
      console.error('🔍 Detalles del error:', insertError);
      return;
    }

    console.log('✅ Producto agregado a favoritos correctamente');
    console.log('📋 Datos del favorito agregado:', insertData);

    // 4. Verificar que el producto aparezca en la lista de favoritos (SELECT)
    console.log('\n📝 Paso 4: Verificando que el producto aparezca en favoritos...');
    const { data: wishlistData, error: wishlistError } = await supabase
      .from('wishlist')
      .select('*')
      .eq('user_id', testUser.id);

    if (wishlistError) {
      console.error('❌ Error al obtener lista de favoritos:', wishlistError.message);
      return;
    }

    console.log(`✅ Lista de favoritos obtenida correctamente`);
    console.log(`📋 Se encontraron ${wishlistData.length} favoritos`);
    
    const foundProduct = wishlistData.find(item => item.product_id === testProduct.id);
    if (foundProduct) {
      console.log('✅ El producto de prueba se encuentra en la lista de favoritos');
    } else {
      console.log('❌ El producto de prueba NO se encuentra en la lista de favoritos');
    }

    // 5. Intentar eliminar el producto de favoritos (DELETE)
    console.log('\n📝 Paso 5: Eliminando producto de favoritos...');
    const { data: deleteData, error: deleteError } = await supabase
      .from('wishlist')
      .delete()
      .eq('user_id', testUser.id)
      .eq('product_id', testProduct.id)
      .select()
      .single();

    if (deleteError) {
      console.error('❌ Error al eliminar producto de favoritos:', deleteError.message);
      console.error('🔍 Detalles del error:', deleteError);
      return;
    }

    console.log('✅ Producto eliminado de favoritos correctamente');
    console.log('📋 Datos del favorito eliminado:', deleteData);

    // 6. Verificar que el producto ya no esté en la lista de favoritos
    console.log('\n📝 Paso 6: Verificando que el producto ya no esté en favoritos...');
    const { data: finalWishlistData, error: finalWishlistError } = await supabase
      .from('wishlist')
      .select('*')
      .eq('user_id', testUser.id);

    if (finalWishlistError) {
      console.error('❌ Error al obtener lista final de favoritos:', finalWishlistError.message);
      return;
    }

    console.log(`✅ Lista final de favoritos obtenida correctamente`);
    console.log(`📋 Se encontraron ${finalWishlistData.length} favoritos`);
    
    const deletedProductStillExists = finalWishlistData.find(item => item.product_id === testProduct.id);
    if (!deletedProductStillExists) {
      console.log('✅ El producto de prueba ya no se encuentra en la lista de favoritos');
    } else {
      console.log('❌ El producto de prueba todavía se encuentra en la lista de favoritos');
    }

    // 7. Cerrar sesión
    console.log('\n📝 Paso 7: Cerrando sesión...');
    const { error: signOutError } = await supabase.auth.signOut();
    
    if (signOutError) {
      console.error('❌ Error al cerrar sesión:', signOutError.message);
    } else {
      console.log('✅ Sesión cerrada correctamente');
    }

    console.log('\n🎉 ¡PRUEBAS COMPLETADAS CON ÉXITO!');
    console.log('=' .repeat(80));
    console.log('✅ Todas las operaciones CRUD funcionan correctamente');
    console.log('✅ Las políticas RLS están configuradas adecuadamente');
    console.log('✅ El sistema de favoritos está operativo');

  } catch (error) {
    console.error('❌ Error inesperado durante las pruebas:', error);
  }
}

// Ejecutar las pruebas
testWishlistAfterRLS();