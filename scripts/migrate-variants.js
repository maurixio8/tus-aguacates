// Script para migrar variantes del JSON a Supabase
// Ejecutar con: node scripts/migrate-variants.js

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase
const SUPABASE_URL = 'https://gxqkmaaqoehydulksudj.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd4cWttYWFxb2VoeWR1bGtzdWRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI0NDI5NDQsImV4cCI6MjA3ODAxODk0NH0.XAR-ysQgt0ZkRZfIZx_DvpYMzmEMFsdAYK3EP1tc0mw';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function migrateVariants() {
  console.log('🚀 Iniciando migración de variantes...\n');

  // 1. Leer el archivo JSON
  const jsonPath = path.join(__dirname, '..', 'public', 'productos tus_aguacates.json');
  console.log('📂 Leyendo archivo:', jsonPath);

  let jsonData;
  try {
    const jsonContent = fs.readFileSync(jsonPath, 'utf-8');
    jsonData = JSON.parse(jsonContent);
    console.log('✅ Archivo JSON cargado correctamente\n');
  } catch (error) {
    console.error('❌ Error leyendo JSON:', error.message);
    return;
  }

  // 2. Obtener productos de Supabase
  console.log('📡 Obteniendo productos de Supabase...');
  const { data: supabaseProducts, error: productsError } = await supabase
    .from('products')
    .select('id, name, slug');

  if (productsError) {
    console.error('❌ Error obteniendo productos:', productsError);
    return;
  }
  console.log(`✅ ${supabaseProducts.length} productos encontrados en Supabase\n`);

  // 3. Crear mapa de nombres a IDs
  const productMap = new Map();
  supabaseProducts.forEach(p => {
    // Normalizar nombre para comparación
    const normalizedName = p.name.toLowerCase().trim()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, ''); // Quitar acentos
    productMap.set(normalizedName, p.id);
  });

  // 4. Procesar variantes del JSON
  let variantsToInsert = [];
  let productsMatched = 0;
  let productsNotFound = [];

  for (const category of jsonData.categories || []) {
    for (const product of category.products || []) {
      const productName = product.name?.toLowerCase().trim()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '');

      // Buscar coincidencia exacta
      let productId = productMap.get(productName);

      // Si no hay coincidencia exacta, buscar parcial
      if (!productId) {
        for (const [name, id] of productMap.entries()) {
          if (name.includes(productName) || productName.includes(name)) {
            productId = id;
            break;
          }
        }
      }

      if (!productId) {
        productsNotFound.push(product.name);
        continue;
      }

      productsMatched++;

      // Solo procesar si tiene variantes
      if (product.variants && product.variants.length > 0) {
        // Obtener precio base (de la primera variante)
        const basePrice = product.variants[0]?.price || 0;

        for (let i = 0; i < product.variants.length; i++) {
          const variant = product.variants[i];
          const variantPrice = variant.price || 0;

          variantsToInsert.push({
            product_id: productId,
            variant_name: 'Presentación',
            variant_value: variant.name || 'Estándar',
            price: variantPrice,
            price_adjustment: variantPrice, // Guardar precio completo
            stock_quantity: 100,
            is_active: true
          });
        }
      }
    }
  }

  console.log(`📊 Estadísticas:`);
  console.log(`   - Productos encontrados: ${productsMatched}`);
  console.log(`   - Productos no encontrados: ${productsNotFound.length}`);
  console.log(`   - Variantes a insertar: ${variantsToInsert.length}\n`);

  if (productsNotFound.length > 0 && productsNotFound.length <= 10) {
    console.log('⚠️ Productos no encontrados:');
    productsNotFound.forEach(name => console.log(`   - ${name}`));
    console.log('');
  }

  // 5. Insertar variantes
  if (variantsToInsert.length === 0) {
    console.log('ℹ️ No hay variantes para insertar.');
    return;
  }

  console.log('📤 Insertando variantes en Supabase...');

  // Insertar en lotes de 50
  const batchSize = 50;
  let insertedCount = 0;

  for (let i = 0; i < variantsToInsert.length; i += batchSize) {
    const batch = variantsToInsert.slice(i, i + batchSize);

    const { data, error } = await supabase
      .from('product_variants')
      .insert(batch)
      .select();

    if (error) {
      console.error(`❌ Error en lote ${Math.floor(i/batchSize) + 1}:`, error.message);
    } else {
      insertedCount += batch.length;
      console.log(`   ✅ Lote ${Math.floor(i/batchSize) + 1}: ${batch.length} variantes insertadas`);
    }
  }

  console.log(`\n🎉 Migración completada!`);
  console.log(`   Total variantes creadas: ${insertedCount}`);
}

// Ejecutar
migrateVariants().catch(console.error);
