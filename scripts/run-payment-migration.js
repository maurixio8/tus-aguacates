const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Configuración de Supabase
const supabaseUrl = "https://gxqkmaaqoehydulksudj.supabase.co";
const supabaseServiceKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd4cWttYWFxb2VoeWR1bGtzdWRqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjQ0Mjk0NCwiZXhwIjoyMDc4MDE4OTQ0fQ.XAR-ysQgt0ZkRZfIZx_DvpYMzmEMFsdAYK3EP1tc0mw";

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  try {
    console.log('🔄 Ejecutando migración para agregar preferred_payment_method a profiles...');
    
    // Leer el archivo SQL
    const sqlPath = path.join(__dirname, '../supabase/migrations/20251209_add_preferred_payment_to_profiles.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('📝 SQL a ejecutar:');
    console.log(sql);
    
    // Ejecutar el SQL
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
    
    if (error) {
      console.error('❌ Error ejecutando migración:', error);
      
      // Intentar ejecutar directamente sin RPC
      console.log('🔄 Intentando ejecutar SQL directamente...');
      
      const { data: directData, error: directError } = await supabase
        .from('profiles')
        .select('id')
        .limit(1);
      
      if (directError) {
        console.error('❌ Error verificando tabla profiles:', directError);
      } else {
        console.log('✅ Conexión exitosa a la base de datos');
        console.log('ℹ️  Por favor ejecuta manualmente el siguiente SQL en el editor de Supabase:');
        console.log('\n' + sql + '\n');
      }
    } else {
      console.log('✅ Migración ejecutada exitosamente:', data);
    }
    
  } catch (error) {
    console.error('❌ Error inesperado:', error);
  }
}

runMigration();