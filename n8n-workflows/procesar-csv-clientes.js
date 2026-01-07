/**
 * 🥑 Procesador CSV → SQL para Enriquecer Clientes
 * 
 * Uso: node procesar-csv-clientes.js
 * 
 * Genera un archivo SQL con los UPDATE necesarios
 */

const fs = require('fs');
const path = require('path');

// Ruta del CSV
const csvPath = path.join(__dirname, 'clientes_final (2).csv');
const outputPath = path.join(__dirname, 'updates-clientes-generados.sql');

// Leer CSV
const csvContent = fs.readFileSync(csvPath, 'utf-8');
const lines = csvContent.split('\n');

// Obtener headers
const headers = parseCSVLine(lines[0]);
console.log('📋 Headers encontrados:', headers.length);

// Encontrar índices de columnas que necesitamos
const phoneIndex = headers.findIndex(h => h === 'phone_number');
const nameIndex = headers.findIndex(h => h === 'name');
const emailIndex = headers.findIndex(h => h === 'email');
const addressIndex = headers.findIndex(h => h === 'addresses/0/address');

console.log(`📞 phone_number: columna ${phoneIndex}`);
console.log(`👤 name: columna ${nameIndex}`);
console.log(`📧 email: columna ${emailIndex}`);
console.log(`📍 address: columna ${addressIndex}`);

// Procesar cada línea
const updates = [];
let processed = 0;
let withName = 0;

for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;

    try {
        const values = parseCSVLine(lines[i]);

        const phone = values[phoneIndex]?.trim();
        const name = values[nameIndex]?.trim();
        const email = values[emailIndex]?.trim();
        const address = values[addressIndex]?.trim();

        if (!phone || phone.length < 7) continue;

        processed++;

        if (name && name.length > 1) {
            withName++;

            // Escapar comillas simples para SQL
            const safeName = name.replace(/'/g, "''");
            const safeEmail = email ? email.replace(/'/g, "''") : null;
            const safeAddress = address ? address.replace(/'/g, "''").substring(0, 500) : null;

            // Generar UPDATE
            let update = `UPDATE clientes SET nombre = '${safeName}'`;

            if (safeEmail) {
                update += `, email = COALESCE(email, '${safeEmail}')`;
            }
            if (safeAddress) {
                update += `, direccion = COALESCE(direccion, '${safeAddress}')`;
            }

            update += `, updated_at = NOW()`;
            update += ` WHERE telefono LIKE '%${phone}' AND (nombre IS NULL OR TRIM(nombre) = '');`;

            updates.push(update);
        }
    } catch (err) {
        // Ignorar líneas mal formateadas
    }
}

console.log(`\n✅ Procesados: ${processed} clientes`);
console.log(`✅ Con nombre: ${withName} clientes`);

// Generar archivo SQL
let sql = `-- =====================================================
-- 🥑 Updates Generados Automáticamente desde CSV
-- =====================================================
-- Total de updates: ${updates.length}
-- Ejecutar en pgAdmin
-- =====================================================

-- Verificar estado ANTES
SELECT 
  COUNT(*) as total,
  COUNT(CASE WHEN nombre IS NOT NULL AND TRIM(nombre) != '' THEN 1 END) as con_nombre
FROM clientes;

-- Iniciar transacción
BEGIN;

`;

// Agregar updates en lotes de 100
for (let i = 0; i < updates.length; i += 100) {
    sql += `\n-- Lote ${Math.floor(i / 100) + 1} de ${Math.ceil(updates.length / 100)}\n`;
    sql += updates.slice(i, i + 100).join('\n') + '\n';
}

sql += `
-- Verificar estado DESPUÉS
SELECT 
  COUNT(*) as total,
  COUNT(CASE WHEN nombre IS NOT NULL AND TRIM(nombre) != '' THEN 1 END) as con_nombre
FROM clientes;

-- Si todo está bien, confirmar
COMMIT;

-- Si hay problemas, descomentar:
-- ROLLBACK;
`;

// Guardar archivo
fs.writeFileSync(outputPath, sql, 'utf-8');
console.log(`\n📄 Archivo generado: ${outputPath}`);
console.log(`📊 Total updates: ${updates.length}`);

// Función para parsear línea CSV (maneja comillas)
function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];

        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            result.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }
    result.push(current.trim());

    return result;
}
