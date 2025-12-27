const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Configuración de Supabase con service role key para tener permisos de administrador
const supabaseUrl = 'https://gxqkmaaqoehydulksudj.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd4cWttYWFxb2VoeWR1bGtzdWRqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjQ0Mjk0NCwiZXhwIjoyMDc4MDE4OTQ0fQ.hQpBcmGfCjJqX8fBRMCJs0Knxyms8KxekVWHxkfOn0M';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixWishlistRLS() {
  try {
    console.log('🔧 Iniciando corrección de políticas RLS para wishlist...');
    
    // Leer el archivo SQL
    const sqlPath = path.join(__dirname, 'fix-wishlist-rls.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('📝 Ejecutando script SQL...');
    
    // Ejecutar el script SQL usando RPC
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sqlContent });
    
    if (error) {
      console.error('❌ Error ejecutando script SQL:', error);
      
      // Si RPC no funciona, intentar con SQL directo
      console.log('🔄 Intentando ejecutar comandos SQL individuales...');
      
      const commands = [
        'ALTER TABLE wishlist ENABLE ROW LEVEL SECURITY',
        'DROP POLICY IF EXISTS "Users can view own wishlist" ON wishlist',
        'DROP POLICY IF EXISTS "Users can insert own wishlist items" ON wishlist',
        'DROP POLICY IF EXISTS "Users can update own wishlist items" ON wishlist',
        'DROP POLICY IF EXISTS "Users can delete own wishlist items" ON wishlist',
        `CREATE POLICY "Users can view own wishlist" ON wishlist FOR SELECT USING (auth.uid() = user_id)`,
        `CREATE POLICY "Users can insert own wishlist items" ON wishlist FOR INSERT WITH CHECK (auth.uid() = user_id)`,
        `CREATE POLICY "Users can update own wishlist items" ON wishlist FOR UPDATE USING (auth.uid() = user_id)`,
        `CREATE POLICY "Users can delete own wishlist items" ON wishlist FOR DELETE USING (auth.uid() = user_id)`
      ];
      
      for (const command of commands) {
        console.log('🔧 Ejecutando:', command);
        const { error: cmdError } = await supabase.rpc('exec_sql', { 
          sql_query: command 
        });
        
        if (cmdError) {
          console.error('❌ Error en comando:', cmdError);
        } else {
          console.log('✅ Comando ejecutado exitosamente');
        }
      }
    } else {
      console.log('✅ Script SQL ejecutado exitosamente');
      console.log('📊 Resultado:', data);
    }
    
    // Verificar el estado final de las políticas
    console.log('\n🔍 Verificando políticas RLS...');
    const { data: policies, error: policiesError } = await supabase
      .from('pg_policies')
      .select('*')
      .eq('tablename', 'wishlist');
    
    if (policiesError) {
      console.error('❌ Error verificando políticas:', policiesError);
    } else {
      console.log('✅ Políticas RLS configuradas:');
      console.log(policies);
    }
    
    console.log('\n🎯 Corrección de RLS completada');
    
  } catch (error) {
    console.error('❌ Error general:', error);
  }
}

fixWishlistRLS();