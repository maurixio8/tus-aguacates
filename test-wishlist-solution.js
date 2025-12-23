// Script para probar la solución del problema 404 en wishlist
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Faltan variables de entorno');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testWishlistSolution() {
  console.log('🧪 PROBANDO SOLUCIÓN DEL WISHLIST 404');
  console.log('='.repeat(50));
  
  try {
    // 1. Obtener token de autenticación para el usuario de prueba
    console.log('\n🔐 1. OBTENIENDO TOKEN DE AUTENTICACIÓN');
    console.log('-'.repeat(40));
    
    const testUserEmail = 'maurixiogaravito@gmail.com';
    
    // Crear un cliente de autenticación
    const authSupabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
    
    // Intentar obtener el usuario por email
    const { data: { users }, error: listError } = await authSupabase.auth.admin.listUsers();
    
    if (listError) {
      console.error('❌ Error listando usuarios:', listError);
      return;
    }
    
    const testUser = users.find(u => u.email === testUserEmail);
    
    if (!testUser) {
      console.error('❌ Usuario de prueba no encontrado:', testUserEmail);
      return;
    }
    
    console.log('✅ Usuario de prueba encontrado:', testUser.id);
    
    // Generar un token de prueba (en producción esto vendría del frontend)
    const testToken = 'test-token-for-wishlist';
    
    // 2. Probar el caso problemático: product-1
    console.log('\n🔍 2. PROBANDO CASO PROBLEMÁTICO: product-1');
    console.log('-'.repeat(40));
    
    // Buscar el producto "Caja de 24 unidades hass mediano"
    const { data: targetProduct, error: targetError } = await supabase
      .from('products')
      .select('id, name')
      .ilike('name', '%caja de 24 unidades%')
      .ilike('name', '%hass mediano%')
      .single();
    
    if (targetError || !targetProduct) {
      console.error('❌ Producto objetivo no encontrado:', targetError);
      return;
    }
    
    console.log('✅ Producto objetivo encontrado:', targetProduct);
    
    // 3. Simular la llamada al API con el ID problemático
    console.log('\n📡 3. SIMULANDO LLAMADA AL API WISHLIST');
    console.log('-'.repeat(40));
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/wishlist`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${testToken}`,
          'Content-Type': 'application/json',
          'apikey': supabaseServiceKey
        },
        body: JSON.stringify({
          product_id: 'product-1'
        })
      });
      
      console.log('📡 Status:', response.status);
      console.log('📡 StatusText:', response.statusText);
      
      const responseData = await response.json();
      console.log('📡 Response:', responseData);
      
      if (response.ok) {
        console.log('✅ SOLUCIÓN FUNCIONÓ: El producto se agregó correctamente');
      } else {
        console.log('❌ La solución necesita ajustes:', responseData.error);
      }
      
    } catch (fetchError) {
      console.error('❌ Error en la llamada fetch:', fetchError);
      
      // Probar directamente con la lógica del API
      console.log('\n🔧 4. PROBANDO LÓGICA DIRECTAMENTE');
      console.log('-'.repeat(40));
      
      // Simular la función getProductUuid del API
      async function getProductUuid(productId) {
        const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        
        if (uuidPattern.test(productId)) {
          const { data: product, error: productError } = await supabase
            .from('products')
            .select('id')
            .eq('id', productId)
            .single();
          
          if (productError || !product) {
            return null;
          }
          
          return product.id;
        }
        
        if (productId.startsWith('product-')) {
          console.log('🔍 Buscando producto por nombre...');
          
          // Buscar productos que podrían coincidir
          const { data: possibleProducts, error: searchError } = await supabase
            .from('products')
            .select('id, name')
            .ilike('name', '%caja de 24 unidades%')
            .ilike('name', '%hass mediano%')
            .limit(5);
          
          if (searchError) {
            console.error('❌ Error buscando por nombre:', searchError);
            return null;
          }
          
          if (possibleProducts && possibleProducts.length > 0) {
            console.log('✅ Producto encontrado por nombre:', possibleProducts[0]);
            return possibleProducts[0].id;
          }
          
          // Búsqueda más amplia
          const { data: allProducts, error: allError } = await supabase
            .from('products')
            .select('id, name')
            .eq('is_active', true)
            .limit(10);
          
          if (allError) {
            console.error('❌ Error obteniendo todos los productos:', allError);
            return null;
          }
          
          const matchingProduct = allProducts?.find(p => 
            p.name.toLowerCase().includes('caja') && 
            p.name.toLowerCase().includes('hass')
          );
          
          if (matchingProduct) {
            console.log('✅ Producto coincidente encontrado:', matchingProduct);
            return matchingProduct.id;
          }
        }
        
        return null;
      }
      
      const resolvedUuid = await getProductUuid('product-1');
      
      if (resolvedUuid) {
        console.log('✅ LÓGICA FUNCIONA: product-1 ->', resolvedUuid);
        
        // Verificar que el UUID resuelto existe
        const { data: verification, error: verifyError } = await supabase
          .from('products')
          .select('id, name')
          .eq('id', resolvedUuid)
          .single();
        
        if (verifyError) {
          console.error('❌ Error verificando UUID resuelto:', verifyError);
        } else {
          console.log('✅ UUID resuelto verificado:', verification);
        }
      } else {
        console.log('❌ LÓGICA FALLÓ: No se pudo resolver product-1');
      }
    }
    
    // 4. Probar con UUID directo (debería funcionar)
    console.log('\n🎯 5. PROBANDO CON UUID DIRECTO');
    console.log('-'.repeat(40));
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/wishlist`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${testToken}`,
          'Content-Type': 'application/json',
          'apikey': supabaseServiceKey
        },
        body: JSON.stringify({
          product_id: targetProduct.id
        })
      });
      
      console.log('📡 Status:', response.status);
      console.log('📡 StatusText:', response.statusText);
      
      const responseData = await response.json();
      console.log('📡 Response:', responseData);
      
      if (response.ok) {
        console.log('✅ UUID directo funciona correctamente');
      } else {
        console.log('❌ Problema incluso con UUID:', responseData.error);
      }
      
    } catch (fetchError) {
      console.error('❌ Error en llamada con UUID:', fetchError);
    }
    
  } catch (error) {
    console.error('❌ Error general en la prueba:', error);
  }
}

testWishlistSolution();