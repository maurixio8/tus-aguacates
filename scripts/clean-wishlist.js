// Script para limpiar el wishlist del usuario actual
// Ejecutar con: node scripts/clean-wishlist.js

const SUPABASE_URL = 'https://gxqkmaaqoehydulksudj.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd4cWttYWFx b2VoeWR1bGtzdWRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQzOTU1NzYsImV4cCI6MjA1MDA3MTU3Nn0.z8VKGFnKx6VJZWCMwFyMvIJMJqBt7YZt7D8XKgk8D8Y';

async function cleanWishlist() {
  // Primero obtener la sesión actual del localStorage del navegador
  // Pero como estamos en Node.js, necesitamos que el usuario proporcione su token

  console.log('🧹 Script de limpieza de Wishlist');
  console.log('');
  console.log('Este script requiere que tengas una sesión activa.');
  console.log('');
  console.log('Por favor, sigue estos pasos:');
  console.log('1. Abre la consola del navegador en tu sitio (F12)');
  console.log('2. Ejecuta el siguiente código para obtener tu token:');
  console.log('');
  console.log('   copy(JSON.parse(localStorage.getItem("sb-gxqkmaaqoehydulksudj-auth-token")).access_token)');
  console.log('');
  console.log('3. Pega el token aquí cuando se solicite');
  console.log('');

  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  rl.question('Pega tu token de acceso (o presiona Enter para salir): ', async (token) => {
    if (!token || token.trim() === '') {
      console.log('❌ Cancelado');
      rl.close();
      return;
    }

    try {
      console.log('');
      console.log('🔍 Verificando items obsoletos en el wishlist...');

      const response = await fetch(`${SUPABASE_URL}/rest/v1/wishlist?user_id=eq.${token}`, {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${token.trim()}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Error fetching wishlist');
      }

      const wishlist = await response.json();

      // IDs obsoletos a eliminar
      const obsoleteIds = ['product-184', 'product-103', 'product-78', 'product-84'];
      const obsoleteItems = wishlist.filter(item => obsoleteIds.includes(item.product_id));

      console.log('');
      console.log(`📊 Total de items en wishlist: ${wishlist.length}`);
      console.log(`⚠️  Items obsoletos encontrados: ${obsoleteItems.length}`);

      if (obsoleteItems.length === 0) {
        console.log('');
        console.log('✅ No hay items obsoletos para eliminar');
        rl.close();
        return;
      }

      console.log('');
      console.log('Items a eliminar:');
      obsoleteItems.forEach(item => {
        console.log(`  - ${item.product_id} (ID: ${item.id})`);
      });

      console.log('');
      rl.question('¿Eliminar estos items? (s/n): ', async (answer) => {
        if (answer.toLowerCase() !== 's') {
          console.log('❌ Cancelado');
          rl.close();
          return;
        }

        // Eliminar cada item obsoleto
        for (const item of obsoleteItems) {
          await fetch(`${SUPABASE_URL}/rest/v1/wishlist?id=eq.${item.id}`, {
            method: 'DELETE',
            headers: {
              'apikey': SUPABASE_ANON_KEY,
              'Authorization': `Bearer ${token.trim()}`
            }
          });
          console.log(`✅ Eliminado: ${item.product_id}`);
        }

        console.log('');
        console.log('🎉 Limpieza completada!');
        rl.close();
      });

    } catch (error) {
      console.error('❌ Error:', error.message);
      rl.close();
    }
  });
}

cleanWishlist();
