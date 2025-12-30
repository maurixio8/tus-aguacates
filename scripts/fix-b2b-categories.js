/**
 * Script para arreglar categorías B2B
 * Asigna las categorías correctas a los productos según su nombre
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Error: Variables de entorno requeridas');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Mapa de categorías correctas
const CATEGORY_MAP = {
  'Aguacates': '44444444-4444-4444-4444-444444444444',
  'Frutas': '11111111-1111-1111-1111-111111111111',
  'Gourmet': '22222222-2222-2222-2222-222222222222',
  'Aromáticas': '33333333-3333-3333-3333-333333333333',
  'Desgranados': '55555555-5555-5555-5555-555555555555',
  'Especias': '66666666-6666-6666-6666-666666666666',
};

// Palabras clave para asignar categorías
const KEYWORDS = {
  aguacates: ['aguacate', 'aguacates', 'palta', 'paltas'],
  frutas: ['banano', 'banano', 'fresa', 'frutilla', 'mango', 'mangostino', 'maracuya', 'papaya', 'piña', 'melon', 'sandia', 'manzana', 'pera', 'uva', 'naranja', 'mandarina', 'lima', 'limon', 'ciruela', 'durazno', 'guayaba', 'feijoa', 'granadilla', 'lulo', 'tomate de arbol'],
  gourmet: ['trufa', 'hongos', 'champinones', 'rucula', 'albahaca', 'menta', 'cilantro', 'perejil', 'espinaca', 'lechuga', 'berro', 'tomate', 'pepino', 'pimenton', 'pimiento', 'zanahoria', 'brocoli', 'coliflor', 'repollo', 'alcachofa', 'esparrago', 'calabaza', 'ayuama'],
  aromaticas: ['albahaca', 'menta', 'hierbabuena', 'tomillo', 'romero', 'oregano', 'mejorana', 'cilantro', 'perejil', 'eneldo', 'estragon', 'laurel'],
  desgranados: ['maiz', 'frijol', 'arroz', 'lenteja', 'garbanzo', 'haba', 'arveja'],
  especias: ['pimienta', 'canela', 'clavo', 'nuez moscada', 'comino', 'cumin', 'curry', 'curcuma', 'azafran', 'vainilla', 'ajo', 'cebolla', 'cayena', 'paprika', 'chile', 'aji'],
};

async function getCategoryId(productName) {
  const nameLower = productName.toLowerCase();

  // Primero buscar palabras exactas
  for (const [category, keywords] of Object.entries(KEYWORDS)) {
    for (const keyword of keywords) {
      if (nameLower.includes(keyword)) {
        return CATEGORY_MAP[category.charAt(0).toUpperCase() + category.slice(1)];
      }
    }
  }

  // Si no coincide, asignar a Gourmet por defecto
  return CATEGORY_MAP['Gourmet'];
}

async function fixCategories() {
  console.log('🔄 Actualizando categorías B2B...\n');

  // Obtener todos los productos B2B
  const { data: products, error } = await supabase
    .from('b2b_products')
    .select('*')
    .eq('is_active', true);

  if (error) {
    console.error('❌ Error obteniendo productos:', error);
    process.exit(1);
  }

  console.log(`📦 Found ${products.length} products\n`);

  let updatedCount = 0;
  const categoryStats = {};

  for (const product of products) {
    const newCategoryId = await getCategoryId(product.name);

    if (product.category_id !== newCategoryId) {
      const { error: updateError } = await supabase
        .from('b2b_products')
        .update({ category_id: newCategoryId })
        .eq('id', product.id);

      if (updateError) {
        console.error(`❌ Error updating ${product.name}:`, updateError.message);
      } else {
        const categoryName = Object.keys(CATEGORY_MAP).find(key => CATEGORY_MAP[key] === newCategoryId);
        console.log(`✓ ${product.name} → ${categoryName}`);
        categoryStats[categoryName] = (categoryStats[categoryName] || 0) + 1;
        updatedCount++;
      }
    }
  }

  console.log(`\n📊 Resumen:`);
  console.log(`   Total actualizados: ${updatedCount}`);
  console.log(`   Por categoría:`);
  for (const [cat, count] of Object.entries(categoryStats)) {
    console.log(`   - ${cat}: ${count} productos`);
  }

  console.log('\n✅ Categorías actualizadas correctamente!');
}

// Crear las categorías faltantes primero
async function createMissingCategories() {
  console.log('📁 Creando categorías faltantes...\n');

  const categories = [
    { id: '55555555-5555-5555-5555-555555555555', name: 'Desgranados', slug: 'desgranados', description: 'Granos y desgranados', sort_order: 5 },
    { id: '66666666-6666-6666-6666-666666666666', name: 'Especias', slug: 'especias', description: 'Especias y condimentos', sort_order: 6 },
  ];

  for (const cat of categories) {
    const { error } = await supabase
      .from('b2b_categories')
      .upsert(cat, { onConflict: 'id' });

    if (error) {
      console.error(`❌ Error creando ${cat.name}:`, error.message);
    } else {
      console.log(`✓ ${cat.name} creada`);
    }
  }

  // Actualizar nombres de categorías existentes
  const updates = [
    { id: '11111111-1111-1111-1111-111111111111', name: 'Frutas', slug: 'frutas', description: 'Frutas frescas y seleccionadas' },
    { id: '22222222-2222-2222-2222-222222222222', name: 'Gourmet', slug: 'gourmet', description: 'Verduras y hortalizas gourmet' },
    { id: '33333333-3333-3333-3333-333333333333', name: 'Aromáticas', slug: 'aromaticas', description: 'Hierbas aromáticas frescas' },
    { id: '44444444-4444-4444-4444-444444444444', name: 'Aguacates', slug: 'aguacates', description: 'Aguacates de diferentes variedades' },
  ];

  for (const cat of updates) {
    const { error } = await supabase
      .from('b2b_categories')
      .update(cat)
      .eq('id', cat.id);

    if (error) {
      console.error(`❌ Error actualizando ${cat.name}:`, error.message);
    } else {
      console.log(`✓ ${cat.name} actualizada`);
    }
  }
}

async function main() {
  await createMissingCategories();
  console.log();
  await fixCategories();
}

main();
