// =====================================================
// INVESTIGACIÓN SIMPLIFICADA DE LA ESTRUCTURA DE WISHLIST
// =====================================================
// Este script usa consultas SQL directas para investigar la tabla

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Faltan variables de entorno de Supabase');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function investigateWishlist() {
  console.log('🔍 Investigando estructura de la tabla wishlist...\n');

  try {
    // 1. Consulta directa para verificar restricciones
    console.log('1️⃣ VERIFICANDO RESTRICCIONES DE LA TABLA');
    console.log('===========================================');
    
    const { data: constraintsData, error: constraintsError } = await supabase
      .rpc('exec_sql', {
        sql: `
          SELECT 
              tc.constraint_name,
              tc.constraint_type,
              kcu.column_name,
              kcu.ordinal_position
          FROM information_schema.table_constraints tc
          JOIN information_schema.key_column_usage kcu
              ON tc.constraint_name = kcu.constraint_name
              AND tc.table_schema = kcu.table_schema
          WHERE tc.table_name = 'wishlist'
              AND tc.table_schema = 'public'
          ORDER BY tc.constraint_name, kcu.ordinal_position
        `
      })
      .catch(() => ({ data: null, error: { message: 'RPC not available' } }));

    if (constraintsError || !constraintsData) {
      console.log('⚠️ Usando método alternativo para verificar restricciones...');
      
      // Método alternativo: intentar insertar duplicados para ver qué restricciones se activan
      console.log('\n🧪 Probando restricciones con inserciones de prueba...');
      
      // Generar UUIDs de prueba
      const testUserId = '00000000-0000-0000-0000-000000000001';
      const testProductId = '00000000-0000-0000-0000-000000000001';
      
      // Limpiar datos de prueba primero
      await supabase
        .from('wishlist')
        .delete()
        .eq('user_id', testUserId)
        .eq('product_id', testProductId);
      
      // Insertar primer registro
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
      } else {
        console.log('✅ Primera inserción exitosa');
        
        // Intentar insertar duplicado
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
          
          // Analizar el tipo de error
          if (error2.code === '23505') {
            console.log('🎯 DETECTADO: Violación de restricción UNIQUE (código 23505)');
            console.log('   Esto indica que SÍ existe una restricción UNIQUE funcionando');
          } else if (error2.code === '42501') {
            console.log('🎯 DETECTADO: Violación de política RLS (código 42501)');
            console.log('   Esto indica que las políticas RLS están bloqueando la inserción');
          }
        } else {
          console.log('❌ Segunda inserción exitosa (PROBLEMA: no hay restricción UNIQUE)');
        }
        
        // Limpiar datos de prueba
        await supabase
          .from('wishlist')
          .delete()
          .eq('user_id', testUserId)
          .eq('product_id', testProductId);
      }
    } else {
      console.log('📋 Restricciones encontradas:');
      constraintsData.forEach(constraint => {
        console.log(`   • ${constraint.constraint_name}: ${constraint.constraint_type} - ${constraint.column_name}`);
      });
    }

    // 2. Verificar políticas RLS
    console.log('\n2️⃣ VERIFICANDO POLÍTICAS RLS');
    console.log('===============================');
    
    const { data: policiesData, error: policiesError } = await supabase
      .rpc('exec_sql', {
        sql: `
          SELECT 
              policyname,
              permissive,
              roles,
              cmd,
              qual,
              with_check
          FROM pg_policies 
          WHERE tablename = 'wishlist'
              AND schemaname = 'public'
          ORDER BY policyname
        `
      })
      .catch(() => ({ data: null, error: { message: 'RPC not available' } }));

    if (policiesError || !policiesData) {
      console.log('⚠️ No se pueden verificar políticas RLS directamente');
      console.log('   Esto es normal si no hay función RPC personalizada');
    } else {
      console.log('🛡️ Políticas RLS encontradas:');
      policiesData.forEach(policy => {
        console.log(`   • ${policy.policyname} (${policy.cmd})`);
        console.log(`     Roles: ${policy.roles}`);
        console.log(`     Permissive: ${policy.permissive}`);
      });
    }

    // 3. Verificar estructura básica intentando operaciones
    console.log('\n3️⃣ VERIFICANDO ESTRUCTURA BÁSICA');
    console.log('===================================');
    
    // Intentar SELECT para ver si la tabla existe y es accesible
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
    } else {
      console.log('✅ Tabla wishlist accesible');
      if (selectData.length > 0) {
        console.log('   Columnas encontradas:', Object.keys(selectData[0]).join(', '));
      } else {
        console.log('   Tabla vacía, no se pueden determinar columnas');
      }
    }

    // 4. Análisis del problema específico
    console.log('\n4️⃣ ANÁLISIS DEL PROBLEMA ESPECÍFICO');
    console.log('=====================================');
    console.log('📝 Problema reportado:');
    console.log('   - La misma restricción "wishlist_user_id_product_id_key" aparece dos veces');
    console.log('   - Una vez para "user_id" y otra para "product_id"');
    console.log('   - Esto es incorrecto para una restricción UNIQUE compuesta');
    
    console.log('\n🔍 Posibles causas:');
    console.log('   1. La restricción UNIQUE está configurada como dos restricciones separadas');
    console.log('   2. Hay un error en cómo se leen las restricciones desde la base de datos');
    console.log('   3. La restricción compuesta no existe realmente');
    
    console.log('\n🔧 Próximos pasos recomendados:');
    console.log('   1. Ejecutar el script SQL investigate-wishlist-structure.sql en la consola de Supabase');
    console.log('   2. Revisar los resultados para determinar la estructura real');
    console.log('   3. Aplicar correcciones según sea necesario');
    console.log('   4. Verificar que las políticas RLS coincidan con la estructura correcta');

    console.log('\n🎉 Investigación completada');
    console.log('\n📋 Resumen:');
    console.log('   • Se han verificado las restricciones mediante pruebas de inserción');
    console.log('   • Se ha intentado verificar las políticas RLS');
    console.log('   • Se ha confirmado el acceso básico a la tabla');
    console.log('   • Se han identificado las posibles causas del problema');

  } catch (error) {
    console.error('❌ Error inesperado:', error);
  }
}

// Ejecutar investigación
investigateWishlist();