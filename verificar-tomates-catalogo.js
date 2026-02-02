// Script para verificar productos de tomate en el catálogo
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function verificarProductosTomate() {
    console.log('🔍 Buscando productos de tomate en el catálogo...\n');

    // Buscar productos que contengan "tomate" en el nombre
    const { data: products, error } = await supabase
        .from('products')
        .select('id, name, category_id')
        .ilike('name', '%tomate%')
        .order('name');

    if (error) {
        console.error('❌ Error obteniendo productos:', error);
        return;
    }

    console.log(`✅ Encontrados ${products.length} productos de tomate:\n`);
    console.log('═'.repeat(80));

    for (const product of products) {
        console.log(`\n📦 ID: ${product.id}`);
        console.log(`   Nombre: "${product.name}"`);
        console.log(`   Categoría ID: ${product.category_id || 'Sin categoría'}`);
    }

    console.log('\n' + '═'.repeat(80));

    // Análisis de normalización
    console.log('\n🔬 SIMULANDO NORMALIZACIÓN (como en lista-compras):\n');

    const normalizeProductName = (name) => {
        if (!name) return 'Producto sin nombre';
        let normalized = name.trim();
        // Eliminar acentos
        normalized = normalized.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        // Remover paréntesis
        normalized = normalized.replace(/\s*\([^)]*\)\s*$/, '').trim();
        // Normalizar espacios
        normalized = normalized.replace(/\s+/g, ' ');
        return normalized;
    };

    const normalized = new Map();
    for (const product of products) {
        const norm = normalizeProductName(product.name);
        if (!normalized.has(norm)) {
            normalized.set(norm, []);
        }
        normalized.get(norm).push(product.name);
    }

    for (const [normName, originalNames] of normalized.entries()) {
        console.log(`"${normName}"`);
        if (originalNames.length > 1) {
            console.log(`  ⚠️  AGRUPA ${originalNames.length} productos diferentes:`);
            originalNames.forEach(name => console.log(`     - "${name}"`));
        } else {
            console.log(`  ✓ Único: "${originalNames[0]}"`);
        }
        console.log();
    }
}

verificarProductosTomate().catch(console.error);
