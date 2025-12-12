// Script para probar la API de categorías y diagnosticar el problema
const { createClient } = require('@supabase/supabase-js');

// Cargar variables de entorno desde .env.local
require('dotenv').config({ path: '.env.local' });

console.log('🔍 [TEST] Verificando variables de entorno...');
console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Definida' : '❌ No definida');
console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Definida' : '❌ No definida');

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  console.error('❌ [TEST] Faltan variables de entorno críticas');
  process.exit(1);
}

console.log('\n📡 [TEST] Creando cliente de Supabase...');
try {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );
  console.log('✅ [TEST] Cliente de Supabase creado exitosamente');
  
  console.log('\n🔍 [TEST] Probando conexión a la tabla categories...');
  supabase
    .from('categories')
    .select('id, name, slug, description, image_url, is_active')
    .eq('is_active', true)
    .order('name', { ascending: true })
    .then(({ data, error }) => {
      if (error) {
        console.error('❌ [TEST] Error en la consulta:', error);
        console.error('Detalles del error:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
      } else {
        console.log('✅ [TEST] Consulta exitosa');
        console.log(`📊 [TEST] Se encontraron ${data?.length || 0} categorías activas`);
        if (data && data.length > 0) {
          console.log('Primeras 3 categorías:', data.slice(0, 3).map(c => ({ id: c.id, name: c.name, slug: c.slug })));
        }
      }
    })
    .catch(err => {
      console.error('❌ [TEST] Error inesperado:', err);
    });
    
} catch (error) {
  console.error('❌ [TEST] Error al crear el cliente de Supabase:', error);
}