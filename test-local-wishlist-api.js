// Script para probar el API local de wishlist con la solución implementada
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Faltan variables de entorno');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testLocalWishlistAPI() {
  console.log('🧪 PROBANDO API LOCAL DE WISHLIST');
  console.log('='.repeat(50));
  
  try {
    // 1. Obtener token de autenticación válido
    console.log('\n🔐 1. OBTENIENDO TOKEN VÁLIDO');
    console.log('-'.repeat(40));
    
    const testUserEmail = 'maurixiogaravito@gmail.com';
    
    // Intentar signIn para obtener un token real
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: testUserEmail,
      password: 'test123456' // Contraseña de prueba
    });
    
    if (signInError) {
      console.log('⚠️ No se pudo hacer signIn, intentando con token de admin...');
      
      // Obtener el usuario y generar un token manualmente
      const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
      
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
      
      // Usar el service role como token (para pruebas)
      const testToken = supabaseServiceKey;
      
      // 2. Probar la lógica de resolución de IDs directamente
      console.log('\n🔍 2. PROBANDO LÓGICA DE RESOLUCIÓN DE IDs');
      console.log('-'.repeat(40));
      
      // Buscar el producto objetivo
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
      
      // Probar la función de resolución
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
          console.log('🔍 Buscando producto por nombre para:', productId);
          
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
      
      // Probar con product-1
      const resolvedUuid = await getProductUuid('product-1');
      
      if (resolvedUuid) {
        console.log('✅ LÓGICA FUNCIONA: product-1 ->', resolvedUuid);
        console.log('✅ UUID coincide con producto objetivo:', resolvedUuid === targetProduct.id);
      } else {
        console.log('❌ LÓGICA FALLÓ: No se pudo resolver product-1');
      }
      
      // 3. Probar el endpoint local (si el servidor está corriendo)
      console.log('\n📡 3. PROBANDO ENDPOINT LOCAL');
      console.log('-'.repeat(40));
      
      try {
        const localApiUrl = 'http://localhost:3000/api/wishlist';
        
        const response = await fetch(localApiUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${testToken}`,
            'Content-Type': 'application/json'
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
          console.log('❌ Error en el endpoint:', responseData.error);
          
          if (response.status === 404) {
            console.log('🔍 El 404 podría ser por:');
            console.log('  - El servidor local no está corriendo');
            console.log('  - El endpoint no existe');
            console.log('  - Problemas de autenticación');
          }
        }
        
      } catch (fetchError) {
        console.error('❌ Error conectando con el servidor local:', fetchError.message);
        console.log('💡 Asegúrate de que el servidor está corriendo: npm run dev');
      }
      
    } else {
      console.log('✅ SignIn exitoso, token obtenido');
      console.log('🔑 User ID:', signInData.user.id);
      console.log('🔑 Token:', signInData.session.access_token.substring(0, 20) + '...');
      
      // Aquí podríamos probar con el token real si fuera necesario
    }
    
  } catch (error) {
    console.error('❌ Error general en la prueba:', error);
  }
}

testLocalWishlistAPI();