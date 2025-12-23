// Script para crear un mapeo de IDs simples a UUID y solucionar el problema 404
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Faltan variables de entorno');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createProductIdMapping() {
  console.log('🔧 CREANDO MAPEO DE IDs DE PRODUCTOS');
  console.log('='.repeat(50));
  
  try {
    // 1. Obtener todos los productos de Supabase
    const { data: supabaseProducts, error: supabaseError } = await supabase
      .from('products')
      .select('id, name, slug')
      .eq('is_active', true);
    
    if (supabaseError) {
      console.error('❌ Error obteniendo productos de Supabase:', supabaseError);
      return;
    }
    
    console.log(`✅ ${supabaseProducts.length} productos encontrados en Supabase`);
    
    // 2. Cargar productos desde el JSON local
    let localProducts = [];
    try {
      const response = await fetch('/productos tus_aguacates.json');
      if (response.ok) {
        const jsonData = await response.json();
        let productId = 1;
        
        for (const category of jsonData.categories || []) {
          for (const product of category.products || []) {
            localProducts.push({
              id: `product-${productId}`,
              name: product.name,
              description: product.description
            });
            productId++;
          }
        }
      }
    } catch (error) {
      console.error('❌ Error cargando JSON local:', error);
    }
    
    console.log(`✅ ${localProducts.length} productos cargados desde JSON local`);
    
    // 3. Crear mapeo de nombres a UUID
    const nameToUuidMap = {};
    supabaseProducts.forEach(product => {
      const normalizedName = product.name.toLowerCase().trim();
      nameToUuidMap[normalizedName] = product.id;
    });
    
    // 4. Crear mapeo de IDs simples a UUID
    const idMapping = {};
    let matchedCount = 0;
    
    localProducts.forEach(localProduct => {
      const normalizedName = localProduct.name.toLowerCase().trim();
      
      // Buscar coincidencia exacta primero
      if (nameToUuidMap[normalizedName]) {
        idMapping[localProduct.id] = nameToUuidMap[normalizedName];
        matchedCount++;
        console.log(`✅ Mapeo: ${localProduct.id} -> ${nameToUuidMap[normalizedName]} (${localProduct.name})`);
      } else {
        // Buscar coincidencia parcial
        const partialMatch = Object.keys(nameToUuidMap).find(supabaseName => 
          supabaseName.includes(normalizedName) || normalizedName.includes(supabaseName)
        );
        
        if (partialMatch) {
          idMapping[localProduct.id] = nameToUuidMap[partialMatch];
          matchedCount++;
          console.log(`✅ Mapeo parcial: ${localProduct.id} -> ${nameToUuidMap[partialMatch]} (${localProduct.name} ~ ${partialMatch})`);
        } else {
          console.log(`⚠️ Sin coincidencia: ${localProduct.id} (${localProduct.name})`);
        }
      }
    });
    
    console.log(`\n📊 RESUMEN DEL MAPEO:`);
    console.log(`- Productos locales: ${localProducts.length}`);
    console.log(`- Productos Supabase: ${supabaseProducts.length}`);
    console.log(`- Mapeos exitosos: ${matchedCount}`);
    console.log(`- Sin coincidencia: ${localProducts.length - matchedCount}`);
    
    // 5. Guardar el mapeo en un archivo para uso posterior
    const fs = require('fs');
    fs.writeFileSync('product-id-mapping.json', JSON.stringify(idMapping, null, 2));
    console.log(`\n💾 Mapeo guardado en 'product-id-mapping.json'`);
    
    // 6. Mostrar ejemplos específicos del problema
    console.log(`\n🔍 ANÁLISIS DEL PROBLEMA ESPECÍFICO:`);
    console.log('-'.repeat(50));
    
    const problemProductId = 'product-1';
    const problemProduct = localProducts.find(p => p.id === problemProductId);
    
    if (problemProduct) {
      console.log(`Producto problemático: ${problemProduct.id} - ${problemProduct.name}`);
      
      if (idMapping[problemProductId]) {
        console.log(`✅ Solución encontrada: ${problemProductId} -> ${idMapping[problemProductId]}`);
        
        // Verificar que el UUID existe realmente en la base de datos
        const { data: verification, error: verifyError } = await supabase
          .from('products')
          .select('id, name')
          .eq('id', idMapping[problemProductId])
          .single();
        
        if (verifyError) {
          console.error('❌ Error verificando UUID mapeado:', verifyError);
        } else {
          console.log(`✅ Verificación exitosa: ${verification.id} - ${verification.name}`);
        }
      } else {
        console.log(`❌ No se encontró mapeo para ${problemProductId}`);
        
        // Buscar manualmente el producto "Caja de 24 unidades hass mediano"
        const targetProduct = supabaseProducts.find(p => 
          p.name.toLowerCase().includes('caja de 24 unidades') && 
          p.name.toLowerCase().includes('hass mediano')
        );
        
        if (targetProduct) {
          console.log(`✅ Producto encontrado manualmente: ${targetProduct.id} - ${targetProduct.name}`);
          idMapping[problemProductId] = targetProduct.id;
          console.log(`✅ Mapeo manual agregado: ${problemProductId} -> ${targetProduct.id}`);
        }
      }
    }
    
    return idMapping;
    
  } catch (error) {
    console.error('❌ Error creando mapeo:', error);
    return null;
  }
}

async function testWishlistWithMapping() {
  console.log('\n🧪 PROBANDO WISHLIST CON MAPEO');
  console.log('-'.repeat(50));
  
  try {
    // Cargar mapeo
    const fs = require('fs');
    let idMapping = {};
    
    try {
      const mappingData = fs.readFileSync('product-id-mapping.json', 'utf8');
      idMapping = JSON.parse(mappingData);
      console.log(`✅ Mapeo cargado: ${Object.keys(idMapping).length} entradas`);
    } catch (error) {
      console.log('⚠️ No se encontró archivo de mapeo, creando nuevo...');
      idMapping = await createProductIdMapping();
    }
    
    // Probar el caso específico del problema
    const testProductId = 'product-1';
    const mappedUuid = idMapping[testProductId];
    
    if (mappedUuid) {
      console.log(`\n🔍 Probando con: ${testProductId} -> ${mappedUuid}`);
      
      // Verificar que el producto existe
      const { data: product, error: productError } = await supabase
        .from('products')
        .select('id, name')
        .eq('id', mappedUuid)
        .single();
      
      if (productError) {
        console.error('❌ Producto no encontrado con UUID mapeado:', productError);
      } else {
        console.log(`✅ Producto verificado: ${product.id} - ${product.name}`);
        
        // Simular la consulta del API wishlist
        console.log(`\n🧪 Simulando consulta del API wishlist...`);
        console.log(`Query: SELECT id FROM products WHERE id = '${mappedUuid}'`);
        
        // Esta consulta debería funcionar correctamente
        const { data: testQuery, error: testError } = await supabase
          .from('products')
          .select('id')
          .eq('id', mappedUuid)
          .single();
        
        if (testError) {
          console.error('❌ Error en consulta simulada:', testError);
        } else {
          console.log(`✅ Consulta simulada exitosa: ${testQuery.id}`);
        }
      }
    } else {
      console.log(`❌ No hay mapeo para ${testProductId}`);
    }
    
  } catch (error) {
    console.error('❌ Error en prueba:', error);
  }
}

// Ejecutar las funciones
async function main() {
  await createProductIdMapping();
  await testWishlistWithMapping();
}

main();