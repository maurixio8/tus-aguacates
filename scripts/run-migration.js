const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Configuración de Supabase
const supabaseUrl = "https://gxqkmaaqoehydulksudj.supabase.co";
const supabaseServiceKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd4cWttYWFxb2VoeWR1bGtzdWRqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjQ0Mjk0NCwiZXhwIjoyMDc4MDE4OTQ0fQ.XAR-ysQgt0ZkRZfIZx_DvpYMzmEMFsdAYK3EP1tc0mw";

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  try {
    console.log('🔄 Ejecutando migración para agregar preferred_name a profiles...');
    
    // Leer el archivo de migración
    const migrationPath = path.join(__dirname, '../supabase/migrations/20251209_add_preferred_name_to_profiles.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('📝 SQL a ejecutar:');
    console.log(migrationSQL);
    
    // Ejecutar la migración
    const { data, error } = await supabase.rpc('exec_sql', { sql: migrationSQL });
    
    if (error) {
      console.error('❌ Error ejecutando migración:', error);
      
      // Alternativa: Ejecutar directamente con SQL
      console.log('🔄 Intentando ejecutar SQL directamente...');
      const { data: altData, error: altError } = await supabase
        .from('profiles')
        .select('id')
        .limit(1);
      
      if (altError) {
        console.error('❌ Error verificando tabla profiles:', altError);
        return;
      }
      
      console.log('✅ Tabla profiles accesible, intentando ALTER TABLE...');
      
      // Ejecutar ALTER TABLE directamente
      const alterSQL = `ALTER TABLE profiles ADD COLUMN IF NOT EXISTS preferred_name VARCHAR(100);`;
      const { data: alterData, error: alterError } = await supabase
        .rpc('exec_sql', { sql: alterSQL });
      
      if (alterError) {
        console.error('❌ Error con ALTER TABLE:', alterError);
        console.log('📋 Por favor ejecuta manualmente en el panel de Supabase:');
        console.log(migrationSQL);
      } else {
        console.log('✅ Migración ejecutada exitosamente!');
      }
    } else {
      console.log('✅ Migración ejecutada exitosamente!');
      console.log('📊 Resultado:', data);
    }
    
  } catch (error) {
    console.error('❌ Error inesperado:', error);
  }
}

runMigration();