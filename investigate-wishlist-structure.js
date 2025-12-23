// =====================================================
// INVESTIGACIÓN COMPLETA DE LA ESTRUCTURA DE LA TABLA WISHLIST
// =====================================================
// Este script investiga a fondo la estructura real de la tabla wishlist
// para identificar discrepancias en las restricciones y políticas RLS

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Faltan variables de entorno de Supabase');
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl);
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey);
  process.exit(1);
}

// Crear cliente de Supabase con rol de servicio para acceso completo
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function investigateWishlistStructure() {
  console.log('🔍 Iniciando investigación completa de la tabla wishlist...\n');

  try {
    // 1. Verificar estructura básica de la tabla
    console.log('1️⃣ ESTRUCTURA BÁSICA DE LA TABLA');
    console.log('=====================================');
    
    let tableInfo = null;
    let tableError = null;
    
    try {
      const result = await supabase.rpc('get_table_structure', { table_name: 'wishlist' });
      tableInfo = result.data;
      tableError = result.error;
    } catch (rpcError) {
      tableInfo = null;
      tableError = { message: 'RPC function not available' };
    }

    if (tableError) {
      console.log('⚠️ No se puede usar RPC, usando consulta directa...');
      
      // Consulta alternativa para obtener estructura de la tabla
      const { data: columns, error: columnsError } = await supabase
        .from('information_schema.columns')
        .select(`
          column_name,
          data_type,
          is_nullable,
          column_default,
          character_maximum_length,
          numeric_precision,
          numeric_scale
        `)
        .eq('table_name', 'wishlist')
        .eq('table_schema', 'public')
        .order('ordinal_position');

      if (columnsError) {
        console.error('❌ Error obteniendo estructura de la tabla:', columnsError);
        return;
      }

      console.log('📋 Columnas de la tabla wishlist:');
      columns.forEach(col => {
        console.log(`   • ${col.column_name}: ${col.data_type}${col.is_nullable === 'NO' ? ' NOT NULL' : ' NULL'}${col.column_default ? ` DEFAULT ${col.column_default}` : ''}`);
      });
    } else {
      console.log('📋 Estructura completa:', tableInfo);
    }

    // 2. Investigar restricciones de la tabla
    console.log('\n2️⃣ RESTRICCIONES DE LA TABLA');
    console.log('===============================');
    
    const { data: constraints, error: constraintsError } = await supabase
      .from('information_schema.table_constraints')
      .select(`
        constraint_name,
        constraint_type,
        is_deferrable,
        initially_deferred
      `)
      .eq('table_name', 'wishlist')
      .eq('table_schema', 'public');

    if (constraintsError) {
      console.error('❌ Error obteniendo restricciones:', constraintsError);
      return;
    }

    console.log('🔒 Restricciones encontradas:');
    constraints.forEach(constraint => {
      console.log(`   • ${constraint.constraint_name}: ${constraint.constraint_type}`);
    });

    // 3. Investigar columnas de las restricciones (PARTE CRÍTICA)
    console.log('\n3️⃣ COLUMNAS DE LAS RESTRICCIONES (INVESTIGACIÓN CRÍTICA)');
    console.log('===========================================================');
    
    const { data: constraintColumns, error: constraintColumnsError } = await supabase
      .from('information_schema.key_column_usage')
      .select(`
        constraint_name,
        column_name,
        ordinal_position
      `)
      .eq('table_name', 'wishlist')
      .eq('table_schema', 'public')
      .order('constraint_name, ordinal_position');

    if (constraintColumnsError) {
      console.error('❌ Error obteniendo columnas de restricciones:', constraintColumnsError);
      return;
    }

    // Agrupar por restricción para análisis detallado
    const constraintsByType = {};
    constraintColumns.forEach(col => {
      if (!constraintsByType[col.constraint_name]) {
        constraintsByType[col.constraint_name] = [];
      }
      constraintsByType[col.constraint_name].push(col);
    });

    console.log('🔍 Análisis detallado de restricciones:');
    Object.entries(constraintsByType).forEach(([constraintName, columns]) => {
      console.log(`\n   📌 Restricción: ${constraintName}`);
      console.log(`      Columnas (${columns.length}):`);
      columns.forEach(col => {
        console.log(`         - ${col.column_name} (posición: ${col.ordinal_position})`);
      });
      
      // Análisis especial para la restricción UNIQUE
      if (constraintName.includes('unique') || constraintName.includes('key')) {
        if (columns.length === 1) {
          console.log(`      ⚠️ ADVERTENCIA: Esta es una restricción UNIQUE de una sola columna`);
        } else if (columns.length === 2) {
          const columnNames = columns.map(c => c.column_name).sort();
          if (columnNames.includes('user_id') && columnNames.includes('product_id')) {
            console.log(`      ✅ CORRECTO: Esta es una restricción UNIQUE compuesta (user_id, product_id)`);
          } else {
            console.log(`      ⚠️ ADVERTENCIA: Restricción UNIQUE compuesta con columnas inesperadas: ${columnNames.join(', ')}`);
          }
        } else {
          console.log(`      ⚠️ ADVERTENCIA: Restricción UNIQUE con ${columns.length} columnas (inesperado)`);
        }
      }
    });

    // 4. Investigar índices de la tabla
    console.log('\n4️⃣ ÍNDICES DE LA TABLA');
    console.log('=======================');
    
    const { data: indexes, error: indexesError } = await supabase
      .from('pg_indexes')
      .select(`
        indexname,
        indexdef
      `)
      .eq('tablename', 'wishlist')
      .eq('schemaname', 'public');

    if (indexesError) {
      console.error('❌ Error obteniendo índices:', indexesError);
      return;
    }

    console.log('📊 Índices encontrados:');
    indexes.forEach(index => {
      console.log(`   • ${index.indexname}`);
      console.log(`     ${index.indexdef}`);
    });

    // 5. Investigar políticas RLS
    console.log('\n5️⃣ POLÍTICAS RLS');
    console.log('=================');
    
    const { data: policies, error: policiesError } = await supabase
      .from('pg_policies')
      .select(`
        schemaname,
        tablename,
        policyname,
        permissive,
        roles,
        cmd,
        qual,
        with_check
      `)
      .eq('tablename', 'wishlist')
      .eq('schemaname', 'public');

    if (policiesError) {
      console.error('❌ Error obteniendo políticas RLS:', policiesError);
      return;
    }

    console.log('🛡️ Políticas RLS encontradas:');
    policies.forEach(policy => {
      console.log(`   • ${policy.policyname} (${policy.cmd})`);
      console.log(`     Roles: ${policy.roles}`);
      console.log(`     Permissive: ${policy.permissive}`);
      if (policy.qual) {
        console.log(`     USING: ${policy.qual}`);
      }
      if (policy.with_check) {
        console.log(`     WITH CHECK: ${policy.with_check}`);
      }
      console.log('');
    });

    // 6. Verificar si RLS está habilitado
    console.log('6️⃣ ESTADO DE RLS');
    console.log('================');
    
    const { data: rlsStatus, error: rlsError } = await supabase
      .from('pg_tables')
      .select(`
        schemaname,
        tablename,
        rowsecurity
      `)
      .eq('tablename', 'wishlist')
      .eq('schemaname', 'public')
      .single();

    if (rlsError) {
      console.error('❌ Error verificando estado de RLS:', rlsError);
    } else {
      console.log(`🔒 RLS habilitado: ${rlsStatus.rowsecurity ? 'SÍ' : 'NO'}`);
    }

    // 7. ANÁLISIS CRÍTICO: Detectar el problema específico
    console.log('\n7️⃣ ANÁLISIS CRÍTICO: DETECCIÓN DEL PROBLEMA');
    console.log('=============================================');
    
    const uniqueConstraints = constraints.filter(c => c.constraint_type === 'UNIQUE');
    const uniqueConstraintColumns = constraintColumns.filter(col => 
      uniqueConstraints.some(uc => uc.constraint_name === col.constraint_name)
    );

    // Buscar la restricción específica mencionada en el problema
    const problematicConstraint = uniqueConstraintColumns.find(col => 
      col.constraint_name === 'wishlist_user_id_product_id_key'
    );

    if (problematicConstraint) {
      const allColumnsForThisConstraint = uniqueConstraintColumns.filter(col => 
        col.constraint_name === 'wishlist_user_id_product_id_key'
      );

      console.log(`🎯 Restrición problemática encontrada: ${problematicConstraint.constraint_name}`);
      console.log(`   Columnas asociadas: ${allColumnsForThisConstraint.length}`);
      
      if (allColumnsForThisConstraint.length === 2) {
        const columnNames = allColumnsForThisConstraint.map(c => c.column_name).sort();
        if (columnNames.includes('user_id') && columnNames.includes('product_id')) {
          console.log(`   ✅ ESTRUCTURA CORRECTA: Restricción UNIQUE compuesta (user_id, product_id)`);
        } else {
          console.log(`   ❌ ESTRUCTURA INCORRECTA: Columnas inesperadas: ${columnNames.join(', ')}`);
        }
      } else if (allColumnsForThisConstraint.length === 1) {
        console.log(`   ❌ PROBLEMA DETECTADO: Restricción UNIQUE de una sola columna`);
        console.log(`   Columna: ${allColumnsForThisConstraint[0].column_name}`);
        console.log(`   Esto explica por qué la misma restricción aparece dos veces en el feedback`);
      } else {
        console.log(`   ❌ PROBLEMA DETECTADO: ${allColumnsForThisConstraint.length} columnas en la restricción`);
      }
    } else {
      console.log('⚠️ No se encontró la restricción específica mencionada en el problema');
    }

    // 8. Verificar datos existentes para entender el impacto
    console.log('\n8️⃣ ANÁLISIS DE DATOS EXISTENTES');
    console.log('===============================');
    
    const { data: existingData, error: dataError } = await supabase
      .from('wishlist')
      .select('user_id, product_id')
      .limit(10);

    if (dataError) {
      console.log('⚠️ No se pueden consultar datos existentes (posiblemente por RLS)');
    } else {
      console.log(`📊 Registros existentes: ${existingData.length}`);
      if (existingData.length > 0) {
        console.log('   Ejemplos:');
        existingData.forEach((row, index) => {
          console.log(`   ${index + 1}. user_id: ${row.user_id}, product_id: ${row.product_id}`);
        });
      }
    }

    // 9. Recomendaciones basadas en el análisis
    console.log('\n9️⃣ RECOMENDACIONES');
    console.log('==================');
    
    if (problematicConstraint) {
      const allColumnsForThisConstraint = uniqueConstraintColumns.filter(col => 
        col.constraint_name === 'wishlist_user_id_product_id_key'
      );

      if (allColumnsForThisConstraint.length === 1) {
        console.log('🔧 ACCIÓN REQUERIDA:');
        console.log('   1. La restricción UNIQUE actual es de una sola columna');
        console.log('   2. Se necesita eliminar y recrear como restricción compuesta');
        console.log('   3. Ejecutar el siguiente SQL en Supabase:');
        console.log('');
        console.log('   -- Eliminar restricción incorrecta');
        console.log('   ALTER TABLE wishlist DROP CONSTRAINT wishlist_user_id_product_id_key;');
        console.log('');
        console.log('   -- Crear restricción compuesta correcta');
        console.log('   ALTER TABLE wishlist ADD CONSTRAINT wishlist_user_id_product_id_key');
        console.log('     UNIQUE (user_id, product_id);');
        console.log('');
        console.log('   4. Verificar que las políticas RLS coincidan con esta estructura');
      } else if (allColumnsForThisConstraint.length === 2) {
        console.log('✅ ESTRUCTURA CORRECTA:');
        console.log('   La restricción UNIQUE ya está configurada correctamente como compuesta');
        console.log('   El problema puede estar en cómo se interpretan los resultados');
        console.log('   Revisar el código que procesa las restricciones');
      }
    }

    console.log('\n🎉 Investigación completada exitosamente');
    console.log('\n📋 Resumen de hallazgos:');
    console.log(`   • Restriciones encontradas: ${constraints.length}`);
    console.log(`   • Políticas RLS: ${policies.length}`);
    console.log(`   • Índices: ${indexes.length}`);
    console.log(`   • RLS habilitado: ${rlsStatus?.rowsecurity ? 'SÍ' : 'NO'}`);

  } catch (error) {
    console.error('❌ Error inesperado durante la investigación:', error);
  }
}

// Ejecutar investigación
investigateWishlistStructure();