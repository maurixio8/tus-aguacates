const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Configuración de Supabase
const supabaseUrl = "https://gxqkmaaqoehydulksudj.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd4cWttYWFxb2VoeWR1bGtzdWRqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjQ0Mjk0NCwiZXhwIjoyMDc4MDE4OTQ0fQ.XAR-ysQgt0ZkRZfIZx_DvpYMzmEMFsdAYK3EP1tc0mw";

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
  try {
    console.log('🚀 Iniciando migración de tabla de suscripciones...');
    
    // Leer el archivo de migración
    const migrationPath = path.join(__dirname, '../supabase/migrations/20251209_create_subscriptions_table.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('📄 Leyendo archivo de migración...');
    
    // Ejecutar la migración
    const { data, error } = await supabase.rpc('exec_sql', { sql: migrationSQL });
    
    if (error) {
      console.error('❌ Error ejecutando migración:', error);
      process.exit(1);
    }
    
    console.log('✅ Migración ejecutada exitosamente');
    console.log('📊 Tablas creadas:');
    console.log('   - subscriptions');
    console.log('   - subscription_deliveries');
    console.log('   - subscription_modifications');
    console.log('');
    console.log('🔧 Funciones creadas:');
    console.log('   - calculate_next_delivery_date()');
    console.log('   - create_subscription_delivery()');
    console.log('');
    console.log('🛡️ Políticas RLS configuradas para acceso seguro');
    console.log('');
    console.log('🎉 Sistema de suscripciones listo para usar!');
    
  } catch (error) {
    console.error('❌ Error inesperado:', error);
    process.exit(1);
  }
}

// Ejecutar migración
runMigration();