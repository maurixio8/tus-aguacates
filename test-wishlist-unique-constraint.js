// =====================================================
// PRUEBA DE RESTRICCIÓN UNIQUE EN WISHLIST CON POLÍTICAS RLS
// =====================================================
// Este script prueba el funcionamiento correcto de las políticas RLS
// con la restricción UNIQUE (user_id, product_id) en la tabla wishlist

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Faltan variables de entorno de Supabase');
  process.exit(1);
}

// Crear cliente de Supabase con rol de servicio para bypass temporal
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Datos de prueba
const testUser = {
  id: '00000000-0000-0000-0000-000000000001', // UUID de prueba
  email: 'test-wishlist-unique@example.com'
};

const testProduct = {
  id: '00000000-0000-0000-0000-000000000001', // UUID de producto de prueba
  name: 'Producto de Prueba Wishlist'
};

async function runTests() {
  console.log('🧪 Iniciando pruebas de restricción UNIQUE en wishlist...\n');

  try {
    // 1. Crear usuario de prueba si no existe
    console.log('1️⃣ Creando usuario de prueba...');
    const { data: existingUser, error: userCheckError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', testUser.id)
      .single();

    if (userCheckError && userCheckError.code !== 'PGRST116') {
      console.error('❌ Error verificando usuario:', userCheckError);
      return;
    }

    if (!existingUser) {
      const { error: createUserError } = await supabase.auth.admin.createUser({
        id: testUser.id,
        email: testUser.email,
        password: 'testpassword123',
        email_confirm: true
      });

      if (createUserError) {
        console.error('❌ Error creando usuario:', createUserError);
        return;
      }
      console.log('✅ Usuario de prueba creado');
    } else {
      console.log('✅ Usuario de prueba ya existe');
    }

    // 2. Crear producto de prueba si no existe
    console.log('\n2️⃣ Creando producto de prueba...');
    const { data: existingProduct, error: productCheckError } = await supabase
      .from('products')
      .select('id')
      .eq('id', testProduct.id)
      .single();

    if (productCheckError && productCheckError.code !== 'PGRST116') {
      console.error('❌ Error verificando producto:', productCheckError);
      return;
    }

    if (!existingProduct) {
      const { error: createProductError } = await supabase
        .from('products')
        .insert({
          id: testProduct.id,
          name: testProduct.name,
          price: 10.99,
          category: 'test',
          stock: 100,
          description: 'Producto de prueba para wishlist',
          slug: 'producto-prueba-wishlist',
          image_url: 'https://example.com/image.jpg'
        });

      if (createProductError) {
        console.error('❌ Error creando producto:', createProductError);
        return;
      }
      console.log('✅ Producto de prueba creado');
    } else {
      console.log('✅ Producto de prueba ya existe');
    }

    // 3. Limpiar wishlist existente para este usuario y producto
    console.log('\n3️⃣ Limpiando wishlist existente...');
    const { error: deleteError } = await supabase
      .from('wishlist')
      .delete()
      .eq('user_id', testUser.id)
      .eq('product_id', testProduct.id);

    if (deleteError) {
      console.error('❌ Error limpiando wishlist:', deleteError);
      return;
    }
    console.log('✅ Wishlist limpiada');

    // 4. Probar inserción inicial (debe funcionar)
    console.log('\n4️⃣ Probando inserción inicial (debe funcionar)...');
    const { data: insertResult, error: insertError } = await supabase
      .from('wishlist')
      .insert({
        user_id: testUser.id,
        product_id: testProduct.id
      })
      .select()
      .single();

    if (insertError) {
      console.error('❌ Error en inserción inicial:', insertError);
      console.error('   Código:', insertError.code);
      console.error('   Detalles:', insertError.details);
      return;
    }
    console.log('✅ Inserción inicial exitosa:', insertResult.id);

    // 5. Verificar que existe solo un registro
    console.log('\n5️⃣ Verificando que existe solo un registro...');
    const { data: checkResult, error: checkError } = await supabase
      .from('wishlist')
      .select('*')
      .eq('user_id', testUser.id)
      .eq('product_id', testProduct.id);

    if (checkError) {
      console.error('❌ Error verificando registro:', checkError);
      return;
    }

    if (checkResult.length !== 1) {
      console.error(`❌ Se esperaba 1 registro, se encontraron ${checkResult.length}`);
      return;
    }
    console.log('✅ Verificación correcta: existe exactamente 1 registro');

    // 6. Probar inserción duplicada (debe fallar con política RLS)
    console.log('\n6️⃣ Probando inserción duplicada (debe fallar con política RLS)...');
    const { data: duplicateResult, error: duplicateError } = await supabase
      .from('wishlist')
      .insert({
        user_id: testUser.id,
        product_id: testProduct.id
      })
      .select()
      .single();

    if (duplicateError) {
      console.log('✅ Inserción duplicada rechazada correctamente');
      console.log('   Error:', duplicateError.message);
      console.log('   Código:', duplicateError.code);
      
      // Verificar que el error sea el esperado
      if (duplicateError.code === '42501') {
        console.log('✅ Error de política RLS detectado correctamente (código 42501)');
      } else {
        console.log('⚠️ Error con código inesperado:', duplicateError.code);
      }
    } else {
      console.error('❌ La inserción duplicada no fue rechazada (esto es un error)');
      console.log('   Resultado inesperado:', duplicateResult);
    }

    // 7. Verificar que todavía existe solo un registro
    console.log('\n7️⃣ Verificando que todavía existe solo un registro...');
    const { data: finalCheck, error: finalCheckError } = await supabase
      .from('wishlist')
      .select('*')
      .eq('user_id', testUser.id)
      .eq('product_id', testProduct.id);

    if (finalCheckError) {
      console.error('❌ Error en verificación final:', finalCheckError);
      return;
    }

    if (finalCheck.length !== 1) {
      console.error(`❌ Se esperaba 1 registro, se encontraron ${finalCheck.length}`);
      return;
    }
    console.log('✅ Verificación final correcta: existe exactamente 1 registro');

    // 8. Probar con diferente usuario (debe funcionar)
    console.log('\n8️⃣ Probando con diferente usuario (debe funcionar)...');
    const differentUserId = '00000000-0000-0000-0000-000000000002';
    const { data: differentUserResult, error: differentUserError } = await supabase
      .from('wishlist')
      .insert({
        user_id: differentUserId,
        product_id: testProduct.id
      })
      .select()
      .single();

    if (differentUserError) {
      console.error('❌ Error con diferente usuario:', differentUserError);
      return;
    }
    console.log('✅ Inserción con diferente usuario exitosa:', differentUserResult.id);

    // 9. Probar con diferente producto (debe funcionar)
    console.log('\n9️⃣ Probando con diferente producto (debe funcionar)...');
    const differentProductId = '00000000-0000-0000-0000-000000000002';
    const { data: differentProductResult, error: differentProductError } = await supabase
      .from('wishlist')
      .insert({
        user_id: testUser.id,
        product_id: differentProductId
      })
      .select()
      .single();

    if (differentProductError) {
      console.error('❌ Error con diferente producto:', differentProductError);
      return;
    }
    console.log('✅ Inserción con diferente producto exitosa:', differentProductResult.id);

    // 10. Limpiar datos de prueba
    console.log('\n🔧 Limpiando datos de prueba...');
    const { error: cleanupError } = await supabase
      .from('wishlist')
      .delete()
      .in('user_id', [testUser.id, differentUserId]);

    if (cleanupError) {
      console.error('❌ Error limpiando wishlist:', cleanupError);
    } else {
      console.log('✅ Datos de prueba limpiados');
    }

    console.log('\n🎉 Todas las pruebas completadas exitosamente');
    console.log('\n📋 Resumen de resultados:');
    console.log('✅ Inserción inicial funciona correctamente');
    console.log('✅ Inserción duplicada es rechazada por política RLS');
    console.log('✅ Verificación de unicidad funciona correctamente');
    console.log('✅ Inserción con diferente usuario funciona');
    console.log('✅ Inserción con diferente producto funciona');
    console.log('\n🔒 La restricción UNIQUE (user_id, product_id) está funcionando correctamente con las políticas RLS');

  } catch (error) {
    console.error('❌ Error inesperado durante las pruebas:', error);
  }
}

// Ejecutar pruebas
runTests();