/**
 * Script para ejecutar la migración B2B en Supabase
 * Uso: node scripts/run-b2b-migration.js
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
require('dotenv').config({ path: '.env.local' });

// Configuración
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://gxqkmaaqoehydulksudj.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Error: No se encontró SUPABASE_SERVICE_ROLE_KEY en .env.local');
  process.exit(1);
}

// Crear cliente con service role key (permisos de admin)
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function runMigration() {
  console.log('🚀 Iniciando migración B2B...\n');

  // Leer el archivo SQL
  const migrationPath = path.join(__dirname, '../supabase/migrations/20250128_create_b2b_tables.sql');

  if (!fs.existsSync(migrationPath)) {
    console.error(`❌ Error: No se encontró el archivo de migración: ${migrationPath}`);
    process.exit(1);
  }

  const sql = fs.readFileSync(migrationPath, 'utf8');

  // Dividir el SQL en declaraciones individuales (separadas por ; vacío)
  // Para manejar las funciones y triggers correctamente
  const statements = sql.match(/--.*$/gm) ? [] : [];

  // Enfoque: ejecutar todo el SQL de una vez usando RPC
  console.log('📝 Ejecutando sentencias SQL...\n');

  try {
    // Intentar ejecutar usando la API de Supabase
    // Nota: La API REST no soporta ejecutar SQL arbitrario directamente
    // Necesitamos usar una función RPC o el SQL Editor

    console.log('⚠️  Nota: Para ejecutar esta migración, tienes varias opciones:\n');
    console.log('1. Usar el SQL Editor en el dashboard de Supabase:');
    console.log('   - Ve a https://app.supabase.com/project/gxqkmaaqoehydulksudj/sql/new');
    console.log('   - Copia y pega el contenido del archivo:');
    console.log(`   - ${migrationPath}\n`);

    console.log('2. Usar el CLI de Supabase (después de hacer login):');
    console.log('   - npx supabase db push\n');

    console.log('3. Usar psql directamente:');
    console.log('   - psql -h db.gxqkmaaqoehydulksudj.supabase.co -U postgres -d postgres -f ' + migrationPath + '\n');

    console.log('📄 El archivo SQL está listo en:', migrationPath);
    console.log('\n✅ La migración se creó exitosamente.');
    console.log('💡 Ejecuta el SQL manualmente en el dashboard de Supabase para completar la instalación.\n');

  } catch (error) {
    console.error('❌ Error al ejecutar la migración:', error.message);
    process.exit(1);
  }
}

runMigration();
