const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// =====================================================
// 🔧 CONFIGURACIÓN DE POSTGRESQL
// =====================================================
// ADJUSTA ESTOS VALORES SEGÚN TU CONFIGURACIÓN
const poolConfig = {
    host: 'localhost',        // Cambiar si es diferente
    port: 5432,             // Cambiar si es diferente
    database: 'tus_aguacates', // Cambiar si es diferente
    user: 'postgres',        // Cambiar si es diferente
    password: 'postgres',    // ⚠️ CAMBIAR SI ES DIFERENTE
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
};

const pool = new Pool(poolConfig);

async function executeSQL() {
    const client = await pool.connect();
    
    try {
        console.log('🚀 Iniciando implementación de mejoras de escalados v2.0...\n');
        
        // Leer el archivo SQL
        const sqlPath = path.join(__dirname, 'n8n-workflows/scripts/sql/implementar-escalados-v2.sql');
        const sqlContent = fs.readFileSync(sqlPath, 'utf8');
        
        console.log('📝 Leyendo archivo SQL:', sqlPath);
        console.log('📊 Tamaño del archivo:', Math.round(sqlContent.length / 1024), 'KB\n');
        
        // Iniciar transacción
        console.log('🔐 Iniciando transacción...');
        await client.query('BEGIN');
        
        // Ejecutar el SQL
        console.log('⚡ Ejecutando SQL...');
        const result = await client.query(sqlContent);
        
        // Confirmar transacción
        await client.query('COMMIT');
        
        console.log('\n✅ SQL ejecutado exitosamente!\n');
        console.log('📊 Resultados:');
        
        if (result.rows && result.rows.length > 0) {
            result.rows.forEach((row, i) => {
                console.log(`  ${i + 1}.`, row);
            });
        }
        
        // Verificar las nuevas columnas
        console.log('\n🔍 Verificando columnas de escalados agregadas...\n');
        
        const columnsCheck = await client.query(`
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns
            WHERE table_name = 'clientes'
              AND column_name IN ('fecha_escalado', 'prioridad_escalado', 'motivo_escalado', 
                                'atendido_por', 'fecha_atencion', 'tiempo_respuesta_minutos',
                                'resolucion', 'fecha_resolucion', 'notificado_escalado')
            ORDER BY column_name;
        `);
        
        if (columnsCheck.rows.length > 0) {
            console.log('✅ Columnas agregadas:');
            columnsCheck.rows.forEach(col => {
                console.log(`  • ${col.column_name} (${col.data_type}) - ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
            });
        } else {
            console.log('⚠️ No se encontraron las columnas. Verifica el resultado de ejecución.');
        }
        
        // Verificar tablas nuevas
        console.log('\n🔍 Verificando tablas nuevas...\n');
        
        const tablesCheck = await client.query(`
            SELECT table_name
            FROM information_schema.tables
            WHERE table_name IN ('escalados_metricas', 'escalados_log')
            ORDER BY table_name;
        `);
        
        if (tablesCheck.rows.length > 0) {
            console.log('✅ Tablas creadas:');
            tablesCheck.rows.forEach(table => {
                console.log(`  • ${table.table_name}`);
            });
        } else {
            console.log('⚠️ No se encontraron las tablas. Verifica el resultado de ejecución.');
        }
        
        // Verificar funciones nuevas
        console.log('\n🔍 Verificando funciones nuevas...\n');
        
        const functionsCheck = await client.query(`
            SELECT routine_name
            FROM information_schema.routines
            WHERE routine_name IN ('escalar_con_prioridad', 'marcar_escalado_atendido', 'reporte_escalados')
            ORDER BY routine_name;
        `);
        
        if (functionsCheck.rows.length > 0) {
            console.log('✅ Funciones creadas:');
            functionsCheck.rows.forEach(func => {
                console.log(`  • ${func.routine_name}`);
            });
        } else {
            console.log('⚠️ No se encontraron las funciones. Verifica el resultado de ejecución.');
        }
        
        // Verificar vistas nuevas
        console.log('\n🔍 Verificando vistas nuevas...\n');
        
        const viewsCheck = await client.query(`
            SELECT table_name
            FROM information_schema.views
            WHERE table_name LIKE 'vw_escalados%'
            ORDER BY table_name;
        `);
        
        if (viewsCheck.rows.length > 0) {
            console.log('✅ Vistas creadas:');
            viewsCheck.rows.forEach(view => {
                console.log(`  • ${view.table_name}`);
            });
        } else {
            console.log('⚠️ No se encontraron las vistas. Verifica el resultado de ejecución.');
        }
        
        console.log('\n🎉 ¡Implementación SQL completada exitosamente!\n');
        
        console.log('\n📌 Próximos pasos:');
        console.log('1. Importar workflow: monitor-escalados-v2.json en n8n');
        console.log('2. Activar el workflow');
        console.log('3. Verificar que el workflow se ejecute cada 5 minutos');
        console.log('4. Actualizar Agente Luz v6.5 con herramienta mejorada');
        console.log('5. Probar el sistema de escalados');
        
    } catch (error) {
        // Revertir en caso de error
        await client.query('ROLLBACK');
        console.error('\n❌ Error ejecutando SQL:', error.message);
        console.error('\n🔄 Transacción revertida.\n');
        console.error('📋 Error detallado:', error);
        process.exit(1);
    } finally {
        client.release();
    }
}

// Ejecutar
console.log('🚀 Iniciando implementación de mejoras de escalados v2.0\n');
executeSQL().then(() => {
    console.log('\n✅ Script finalizado');
    pool.end();
}).catch(error => {
    console.error('\n❌ Error fatal:', error);
    pool.end();
    process.exit(1);
});
