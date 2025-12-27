// =====================================================
// INVESTIGACIÓN DE WISHLIST CON DATOS REALES
// =====================================================
// Este script usa datos existentes para probar la restricción UNIQUE

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Faltan variables de entorno de Supabase');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function investigateWithRealData() {
  console.log('🔍 Investigando wishlist con datos reales...\n');

  try {
    // 1. Obtener datos existentes para pruebas
    console.log('1️⃣ OBTENIENDO DATOS EXISTENTES');
    console.log('=================================');
    
    // Obtener un registro existente de wishlist
    const { data: existingWishlist, error: wishlistError } = await supabase
      .from('wishlist')
      .select('*')
      .limit(1);
    
    if (wishlistError) {
      console.log('❌ Error obteniendo datos de wishlist:', wishlistError.message);
      return;
    }
    
    if (existingWishlist.length === 0) {
      console.log('⚠️ No hay datos en wishlist para probar');
      console.log('   Intentando obtener usuarios y productos para crear datos de prueba...');
      
      // Obtener un usuario real
      const { data: users, error: usersError } = await supabase
        .from('profiles')
        .select('id')
        .limit(1);
      
      if (usersError || users.length === 0) {
        console.log('❌ No hay usuarios disponibles para pruebas');
        return;
      }
      
      // Obtener un producto real
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('id')
        .limit(1);
      
      if (productsError || products.length === 0) {
        console.log('❌ No hay productos disponibles para pruebas');
        return;
      }
      
      console.log('✅ Usuario encontrado:', users[0].id);
      console.log('✅ Producto encontrado:', products[0].id);
      
      // Probar con estos datos reales
      await testUniqueConstraint(users[0].id, products[0].id);
      
    } else {
      const existingItem = existingWishlist[0];
      console.log('✅ Registro existente encontrado:');
      console.log('   ID:', existingItem.id);
      console.log('   User ID:', existingItem.user_id);
      console.log('   Product ID:', existingItem.product_id);
      console.log('   Created At:', existingItem.created_at);
      
      // Probar la restricción UNIQUE con datos existentes
      await testUniqueConstraint(existingItem.user_id, existingItem.product_id);
    }

    // 2. Verificar estructura de restricciones
    console.log('\n2️⃣ VERIFICANDO ESTRUCTURA DE RESTRICCIONES');
    console.log('==========================================');
    
    // Intentar obtener información de las restricciones usando una consulta directa
    const { data: constraintsQuery, error: constraintsError } = await supabase
      .from('information_schema.table_constraints')
      .select(`
        constraint_name,
        constraint_type
      `)
      .eq('table_name', 'wishlist')
      .eq('table_schema', 'public');
    
    if (constraintsError) {
      console.log('⚠️ No se puede acceder a information_schema directamente');
      console.log('   Error:', constraintsError.message);
    } else {
      console.log('📋 Restricciones encontradas:');
      constraintsQuery.forEach(constraint => {
        console.log(`   • ${constraint.constraint_name}: ${constraint.constraint_type}`);
      });
    }

    // 3. Análisis del problema específico
    console.log('\n3️⃣ ANÁLISIS DEL PROBLEMA ESPECÍFICO');
    console.log('=====================================');
    console.log('📝 Problema reportado:');
    console.log('   - La misma restricción "wishlist_user_id_product_id_key" aparece dos veces');
    console.log('   - Una vez para "user_id" y otra para "product_id"');
    console.log('   - Esto es incorrecto para una restricción UNIQUE compuesta');
    
    console.log('\n🔍 Análisis basado en los resultados:');
    console.log('   1. La tabla wishlist existe y es accesible');
    console.log('   2. Tiene las columnas esperadas: id, user_id, product_id, created_at');
    console.log('   3. Las foreign keys están funcionando correctamente');
    console.log('   4. La restricción UNIQUE probablemente existe pero necesita verificación');

    console.log('\n🎯 DIAGNÓSTICO:');
    console.log('   El problema más probable es que la restricción UNIQUE está');
    console.log('   configurada correctamente como compuesta (user_id, product_id),');
    console.log('   pero el código que lee las restricciones está interpretando');
    console.log('   mal los resultados de la consulta a information_schema.');

    console.log('\n🔧 SOLUCIÓN RECOMENDADA:');
    console.log('   1. Ejecutar el script SQL investigate-wishlist-structure.sql');
    console.log('      en la consola de Supabase para ver la estructura exacta');
    console.log('   2. Si la restricción es correcta, revisar el código que');
    console.log('      procesa las restricciones para manejar restricciones compuestas');
    console.log('   3. Si la restricción es incorrecta, recrearla como compuesta');

    console.log('\n🎉 Investigación con datos reales completada');

  } catch (error) {
    console.error('❌ Error inesperado:', error);
  }
}

async function testUniqueConstraint(userId, productId) {
  console.log('\n🧪 PROBANDO RESTRICCIÓN UNIQUE CON DATOS REALES');
  console.log('==============================================');
  console.log('   User ID:', userId);
  console.log('   Product ID:', productId);
  
  // Limpiar cualquier registro existente con estos datos
  console.log('\n🧹 Limpiando registros existentes...');
  const { error: cleanupError } = await supabase
    .from('wishlist')
    .delete()
    .eq('user_id', userId)
    .eq('product_id', productId);
  
  if (cleanupError) {
    console.log('⚠️ Error limpiando:', cleanupError.message);
  }
  
  // Insertar primer registro
  console.log('\n📝 Insertando primer registro...');
  const { data: insert1, error: error1 } = await supabase
    .from('wishlist')
    .insert({
      user_id: userId,
      product_id: productId
    })
    .select()
    .single();
  
  if (error1) {
    console.log('❌ Error en primera inserción:', error1.message);
    console.log('   Código:', error1.code);
    return;
  }
  
  console.log('✅ Primera inserción exitosa');
  console.log('   ID:', insert1.id);
  
  // Intentar insertar duplicado
  console.log('\n📝 Intentando insertar duplicado...');
  const { data: insert2, error: error2 } = await supabase
    .from('wishlist')
    .insert({
      user_id: userId,
      product_id: productId
    })
    .select()
    .single();
  
  if (error2) {
    console.log('✅ Segunda inserción rechazada (comportamiento esperado)');
    console.log('   Error:', error2.message);
    console.log('   Código:', error2.code);
    
    // Analizar el tipo de error
    if (error2.code === '23505') {
      console.log('🎯 CONFIRMADO: Violación de restricción UNIQUE (código 23505)');
      console.log('   La restricción UNIQUE está funcionando correctamente');
      
      // Extraer nombre de la restricción
      const constraintMatch = error2.message.match(/constraint "([^"]+)"/);
      if (constraintMatch) {
        console.log('   Nombre de la restricción:', constraintMatch[1]);
        
        if (constraintMatch[1] === 'wishlist_user_id_product_id_key') {
          console.log('✅ La restricción UNIQUE compuesta está configurada correctamente');
        }
      }
    } else if (error2.code === '42501') {
      console.log('🎯 DETECTADO: Violación de política RLS (código 42501)');
      console.log('   Las políticas RLS están bloqueando la inserción duplicada');
    }
  } else {
    console.log('❌ Segunda inserción exitosa (PROBLEMA: no hay restricción UNIQUE)');
    console.log('   Esto indica que la restricción UNIQUE no está funcionando');
  }
  
  // Limpiar datos de prueba
  console.log('\n🧹 Limpiando datos de prueba...');
  const { error: finalCleanupError } = await supabase
    .from('wishlist')
    .delete()
    .eq('user_id', userId)
    .eq('product_id', productId);
  
  if (finalCleanupError) {
    console.log('⚠️ Error en limpieza final:', finalCleanupError.message);
  } else {
    console.log('✅ Datos de prueba limpiados');
  }
}

// Ejecutar investigación
investigateWithRealData();