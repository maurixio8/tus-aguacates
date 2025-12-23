// Investigación completa del problema 404 en wishlist
// Este script verificará sistemáticamente todas las posibles causas

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Faltan variables de entorno:');
  console.error('- NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl);
  console.error('- SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function investigateWishlist404() {
  console.log('🔍 INVESTIGACIÓN COMPLETA DEL PROBLEMA 404 EN WISHLIST');
  console.log('='.repeat(60));
  
  try {
    // 1. Verificar estructura de la tabla wishlist
    console.log('\n📊 1. VERIFICANDO ESTRUCTURA DE LA TABLA WISHLIST');
    console.log('-'.repeat(50));
    
    const { data: columns, error: columnsError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable, column_default')
      .eq('table_name', 'wishlist')
      .eq('table_schema', 'public')
      .order('ordinal_position');
    
    if (columnsError) {
      console.error('❌ Error al obtener columnas:', columnsError);
    } else {
      console.log('✅ Columnas de la tabla wishlist:');
      columns.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type} (${col.is_nullable}) ${col.column_default ? `DEFAULT ${col.column_default}` : ''}`);
      });
    }
    
    // 2. Verificar restricciones de la tabla
    console.log('\n🔒 2. VERIFICANDO RESTRICCIONES DE LA TABLA');
    console.log('-'.repeat(50));
    
    const { data: constraints, error: constraintsError } = await supabase
      .from('information_schema.table_constraints')
      .select(`
        constraint_name,
        constraint_type
      `)
      .eq('table_name', 'wishlist')
      .eq('table_schema', 'public');
    
    if (constraintsError) {
      console.error('❌ Error al obtener restricciones:', constraintsError);
    } else {
      console.log('✅ Restricciones de la tabla wishlist:');
      constraints.forEach(constraint => {
        console.log(`  - ${constraint.constraint_name}: ${constraint.constraint_type}`);
      });
    }
    
    // 3. Verificar políticas RLS
    console.log('\n🛡️ 3. VERIFICANDO POLÍTICAS RLS');
    console.log('-'.repeat(50));
    
    const { data: policies, error: policiesError } = await supabase
      .from('pg_policies')
      .select(`
        policyname,
        permissive,
        roles,
        cmd,
        qual,
        with_check
      `)
      .eq('tablename', 'wishlist');
    
    if (policiesError) {
      console.error('❌ Error al obtener políticas RLS:', policiesError);
    } else {
      console.log('✅ Políticas RLS de la tabla wishlist:');
      policies.forEach(policy => {
        console.log(`  - ${policy.policyname}:`);
        console.log(`    * Comando: ${policy.cmd}`);
        console.log(`    * Permisivo: ${policy.permissive}`);
        console.log(`    * Roles: ${policy.roles}`);
        console.log(`    * USING: ${policy.qual || 'N/A'}`);
        console.log(`    * WITH CHECK: ${policy.with_check || 'N/A'}`);
      });
    }
    
    // 4. Verificar si RLS está habilitado
    console.log('\n🔐 4. VERIFICANDO SI RLS ESTÁ HABILITADO');
    console.log('-'.repeat(50));
    
    const { data: rlsStatus, error: rlsError } = await supabase
      .from('pg_tables')
      .select('rowsecurity')
      .eq('tablename', 'wishlist')
      .eq('schemaname', 'public')
      .single();
    
    if (rlsError) {
      console.error('❌ Error al verificar estado RLS:', rlsError);
    } else {
      console.log(`✅ RLS habilitado: ${rlsStatus.rowsecurity}`);
    }
    
    // 5. Verificar si el producto "product-1" existe
    console.log('\n📦 5. VERIFICANDO SI EL PRODUCTO "product-1" EXISTE');
    console.log('-'.repeat(50));
    
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('id, name, slug')
      .eq('id', 'product-1')
      .single();
    
    if (productError) {
      console.error('❌ Error al buscar producto "product-1":', productError);
      console.log('🔍 Buscando productos con ID similar...');
      
      const { data: similarProducts, error: similarError } = await supabase
        .from('products')
        .select('id, name, slug')
        .ilike('id', '%product-1%')
        .limit(10);
      
      if (similarError) {
        console.error('❌ Error al buscar productos similares:', similarError);
      } else {
        console.log('✅ Productos con ID similar a "product-1":');
        similarProducts.forEach(p => {
          console.log(`  - ${p.id}: ${p.name} (${p.slug})`);
        });
      }
    } else {
      console.log('✅ Producto encontrado:');
      console.log(`  - ID: ${product.id}`);
      console.log(`  - Nombre: ${product.name}`);
      console.log(`  - Slug: ${product.slug}`);
    }
    
    // 6. Verificar si hay datos en la tabla wishlist
    console.log('\n📋 6. VERIFICANDO DATOS EN LA TABLA WISHLIST');
    console.log('-'.repeat(50));
    
    const { data: wishlistData, error: wishlistError, count } = await supabase
      .from('wishlist')
      .select('*', { count: 'exact' })
      .limit(5);
    
    if (wishlistError) {
      console.error('❌ Error al consultar wishlist:', wishlistError);
    } else {
      console.log(`✅ Total de registros en wishlist: ${count}`);
      if (count > 0) {
        console.log('Primeros 5 registros:');
        wishlistData.forEach(item => {
          console.log(`  - ${item.id}: user=${item.user_id}, product=${item.product_id}, created=${item.created_at}`);
        });
      }
    }
    
    // 7. Verificar el usuario de prueba
    console.log('\n👤 7. VERIFICANDO USUARIO DE PRUEBA');
    console.log('-'.repeat(50));
    
    const testUserId = '219488db-1bda-4ac6-a961-8affe601bcb6';
    
    const { data: user, error: userError } = await supabase.auth.admin.getUserById(testUserId);
    
    if (userError) {
      console.error('❌ Error al buscar usuario de prueba:', userError);
    } else {
      console.log('✅ Usuario de prueba encontrado:');
      console.log(`  - ID: ${user.user.id}`);
      console.log(`  - Email: ${user.user.email}`);
      console.log(`  - Creado: ${user.user.created_at}`);
    }
    
    // 8. Simular la consulta que causa el 404
    console.log('\n🧪 8. SIMULANDO CONSULTA QUE CAUSA EL 404');
    console.log('-'.repeat(50));
    
    // Primero, verificar si el producto existe con la consulta exacta del API
    const { data: productCheck, error: productCheckError } = await supabase
      .from('products')
      .select('id')
      .eq('id', 'product-1')
      .single();
    
    if (productCheckError) {
      console.error('❌ Error en consulta de producto (simulación API):', productCheckError);
      console.log('🔍 Detalles del error:');
      console.log(`  - Código: ${productCheckError.code}`);
      console.log(`  - Mensaje: ${productCheckError.message}`);
      console.log(`  - Detalles: ${productCheckError.details}`);
      
      // Este podría ser el origen del 404
      if (productCheckError.code === 'PGRST116') {
        console.log('🚨 ¡POSIBLE CAUSA DEL 404! El producto no existe en la base de datos.');
      }
    } else {
      console.log('✅ La consulta de producto funciona correctamente');
    }
    
    // 9. Verificar si hay problemas con el ID del producto
    console.log('\n🔍 9. VERIFICANDO POSIBLES PROBLEMAS CON ID DE PRODUCTO');
    console.log('-'.repeat(50));
    
    // Buscar el producto por nombre
    const { data: productByName, error: productByNameError } = await supabase
      .from('products')
      .select('id, name, slug')
      .ilike('name', '%Caja de 24 unidades hass mediano%')
      .limit(5);
    
    if (productByNameError) {
      console.error('❌ Error al buscar producto por nombre:', productByNameError);
    } else {
      console.log('✅ Productos con nombre similar:');
      productByName.forEach(p => {
        console.log(`  - ${p.id}: ${p.name} (${p.slug})`);
      });
    }
    
    // 10. Verificar estructura de IDs en la tabla products
    console.log('\n🏷️ 10. VERIFICANDO ESTRUCTURA DE IDS EN PRODUCTS');
    console.log('-'.repeat(50));
    
    const { data: sampleProducts, error: sampleError } = await supabase
      .from('products')
      .select('id, name')
      .limit(10);
    
    if (sampleError) {
      console.error('❌ Error al obtener muestra de productos:', sampleError);
    } else {
      console.log('✅ Muestra de IDs de productos:');
      sampleProducts.forEach(p => {
        console.log(`  - ${p.id}: ${p.name}`);
      });
      
      // Analizar el patrón de IDs
      const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      const hasUuidIds = sampleProducts.some(p => uuidPattern.test(p.id));
      const hasSimpleIds = sampleProducts.some(p => !uuidPattern.test(p.id));
      
      console.log(`📊 Análisis de patrones de ID:`);
      console.log(`  - Productos con UUID: ${hasUuidIds ? 'Sí' : 'No'}`);
      console.log(`  - Productos con ID simple: ${hasSimpleIds ? 'Sí' : 'No'}`);
      
      if (hasUuidIds && !hasSimpleIds) {
        console.log('🚨 ¡POSIBLE CAUSA! Todos los productos usan UUID, pero "product-1" no es UUID.');
      }
    }
    
  } catch (error) {
    console.error('❌ Error en la investigación:', error);
  }
}

investigateWishlist404();