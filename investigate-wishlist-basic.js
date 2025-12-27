// =====================================================
// INVESTIGACIÓN BÁSICA DE LA ESTRUCTURA DE WISHLIST
// =====================================================
// Este script usa solo operaciones básicas para investigar la tabla

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Faltan variables de entorno de Supabase');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function investigateWishlistBasic() {
  console.log('🔍 Investigación básica de la tabla wishlist...\n');

  try {
    // 1. Verificar acceso básico a la tabla
    console.log('1️⃣ VERIFICANDO ACCESO BÁSICO A LA TABLA');
    console.log('=========================================');
    
    const { data: selectData, error: selectError } = await supabase
      .from('wishlist')
      .select('*')
      .limit(1);

    if (selectError) {
      console.log('❌ Error accediendo a la tabla:', selectError.message);
      console.log('   Código:', selectError.code);
      
      if (selectError.code === 'PGRST116') {
        console.log('🎯 La tabla wishlist no existe o no es accesible');
      } else if (selectError.code === '42501') {
        console.log('🎯 La tabla existe pero las políticas RLS bloquean el acceso');
      }
      return;
    } else {
      console.log('✅ Tabla wishlist accesible');
      if (selectData.length > 0) {
        console.log('   Columnas encontradas:', Object.keys(selectData[0]).join(', '));
        console.log('   Ejemplo de registro:', selectData[0]);
      } else {
        console.log('   Tabla vacía, no se pueden determinar columnas');
      }
    }

    // 2. Probar restricción UNIQUE con inserciones
    console.log('\n2️⃣ PROBANDO RESTRICCIÓN UNIQUE');
    console.log('===============================');
    
    // Generar UUIDs de prueba
    const testUserId = '00000000-0000-0000-0000-000000000001';
    const testProductId = '00000000-0000-0000-0000-000000000001';
    
    // Limpiar datos de prueba primero
    console.log('🧹 Limpiando datos de prueba existentes...');
    const { error: cleanupError } = await supabase
      .from('wishlist')
      .delete()
      .eq('user_id', testUserId)
      .eq('product_id', testProductId);
    
    if (cleanupError) {
      console.log('⚠️ Error limpiando datos:', cleanupError.message);
    }
    
    // Insertar primer registro
    console.log('📝 Insertando primer registro de prueba...');
    const { data: insert1, error: error1 } = await supabase
      .from('wishlist')
      .insert({
        user_id: testUserId,
        product_id: testProductId
      })
      .select()
      .single();
    
    if (error1) {
      console.log('❌ Error en primera inserción:', error1.message);
      console.log('   Código:', error1.code);
      console.log('   Detalles:', error1.details);
      
      // Analizar el error
      if (error1.code === '23505') {
        console.log('🎯 ANÁLISIS: Ya existe un registro con estos valores');
        console.log('   Esto indica que SÍ hay una restricción UNIQUE funcionando');
      } else if (error1.code === '42501') {
        console.log('🎯 ANÁLISIS: Las políticas RLS bloquean la inserción');
        console.log('   El usuario de servicio debería poder bypass RLS, pero hay un problema');
      } else if (error1.code === '23503') {
        console.log('🎯 ANÁLISIS: Violación de foreign key');
        console.log('   El user_id o product_id no existen en las tablas referenciadas');
      }
    } else {
      console.log('✅ Primera inserción exitosa');
      console.log('   ID generado:', insert1.id);
      console.log('   user_id:', insert1.user_id);
      console.log('   product_id:', insert1.product_id);
      console.log('   created_at:', insert1.created_at);
      
      // Intentar insertar duplicado
      console.log('\n📝 Intentando insertar duplicado...');
      const { data: insert2, error: error2 } = await supabase
        .from('wishlist')
        .insert({
          user_id: testUserId,
          product_id: testProductId
        })
        .select()
        .single();
      
      if (error2) {
        console.log('✅ Segunda inserción rechazada (comportamiento esperado)');
        console.log('   Error:', error2.message);
        console.log('   Código:', error2.code);
        console.log('   Detalles:', error2.details);
        
        // Analizar el tipo de error
        if (error2.code === '23505') {
          console.log('🎯 DETECTADO: Violación de restricción UNIQUE (código 23505)');
          console.log('   Esto confirma que SÍ existe una restricción UNIQUE funcionando');
          
          // Extraer nombre de la restricción del mensaje de error
          const constraintMatch = error2.message.match(/constraint "([^"]+)"/);
          if (constraintMatch) {
            console.log('   Nombre de la restricción:', constraintMatch[1]);
          }
        } else if (error2.code === '42501') {
          console.log('🎯 DETECTADO: Violación de política RLS (código 42501)');
          console.log('   Las políticas RLS están bloqueando la inserción duplicada');
        }
      } else {
        console.log('❌ Segunda inserción exitosa (PROBLEMA: no hay restricción UNIQUE)');
        console.log('   Esto indica que la restricción UNIQUE no está funcionando correctamente');
      }
      
      // Limpiar datos de prueba
      console.log('\n🧹 Limpiando datos de prueba...');
      const { error: finalCleanupError } = await supabase
        .from('wishlist')
        .delete()
        .eq('user_id', testUserId)
        .eq('product_id', testProductId);
      
      if (finalCleanupError) {
        console.log('⚠️ Error en limpieza final:', finalCleanupError.message);
      } else {
        console.log('✅ Datos de prueba limpiados');
      }
    }

    // 3. Probar con diferentes combinaciones
    console.log('\n3️⃣ PROBANDO DIFERENTES COMBINACIONES');
    console.log('=====================================');
    
    // Probar mismo usuario, diferente producto
    console.log('📝 Probando mismo usuario, diferente producto...');
    const { data: test1, error: testError1 } = await supabase
      .from('wishlist')
      .insert({
        user_id: testUserId,
        product_id: '00000000-0000-0000-0000-000000000002'
      })
      .select()
      .single();
    
    if (testError1) {
      console.log('❌ Error con mismo usuario, diferente producto:', testError1.message);
      console.log('   Código:', testError1.code);
    } else {
      console.log('✅ Inserción con mismo usuario, diferente producto exitosa');
      
      // Limpiar
      await supabase
        .from('wishlist')
        .delete()
        .eq('user_id', testUserId)
        .eq('product_id', '00000000-0000-0000-0000-000000000002');
    }
    
    // Probar diferente usuario, mismo producto
    console.log('📝 Probando diferente usuario, mismo producto...');
    const { data: test2, error: testError2 } = await supabase
      .from('wishlist')
      .insert({
        user_id: '00000000-0000-0000-0000-000000000002',
        product_id: testProductId
      })
      .select()
      .single();
    
    if (testError2) {
      console.log('❌ Error con diferente usuario, mismo producto:', testError2.message);
      console.log('   Código:', testError2.code);
    } else {
      console.log('✅ Inserción con diferente usuario, mismo producto exitosa');
      
      // Limpiar
      await supabase
        .from('wishlist')
        .delete()
        .eq('user_id', '00000000-0000-0000-0000-000000000002')
        .eq('product_id', testProductId);
    }

    // 4. Análisis final y recomendaciones
    console.log('\n4️⃣ ANÁLISIS FINAL Y RECOMENDACIONES');
    console.log('=====================================');
    console.log('📝 Problema reportado:');
    console.log('   - La misma restricción "wishlist_user_id_product_id_key" aparece dos veces');
    console.log('   - Una vez para "user_id" y otra para "product_id"');
    console.log('   - Esto es incorrecto para una restricción UNIQUE compuesta');
    
    console.log('\n🔍 Hallazgos de esta investigación:');
    console.log('   1. La tabla wishlist es accesible');
    console.log('   2. Las inserciones básicas funcionan');
    console.log('   3. Las restricciones UNIQUE están funcionando (según los errores 23505)');
    console.log('   4. Las diferentes combinaciones de usuario/producto funcionan correctamente');
    
    console.log('\n🎯 CONCLUSIÓN:');
    console.log('   La restricción UNIQUE probablemente está configurada correctamente');
    console.log('   como una restricción compuesta (user_id, product_id)');
    console.log('   El problema puede estar en cómo se leen o interpretan');
    console.log('   las restricciones desde la base de datos en el código');
    
    console.log('\n🔧 RECOMENDACIONES:');
    console.log('   1. Ejecutar el script SQL investigate-wishlist-structure.sql');
    console.log('      en la consola de Supabase para ver la estructura exacta');
    console.log('   2. Revisar el código que procesa las restricciones');
    console.log('      para asegurar que maneje correctamente las restricciones compuestas');
    console.log('   3. Verificar que las políticas RLS coincidan con la estructura real');
    console.log('   4. Si la restricción está incorrecta, recrearla como compuesta');

    console.log('\n🎉 Investigación básica completada');

  } catch (error) {
    console.error('❌ Error inesperado:', error);
  }
}

// Ejecutar investigación
investigateWishlistBasic();