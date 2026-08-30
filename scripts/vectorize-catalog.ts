/**
 * =====================================================
 * SCRIPT: Vectorización del Catálogo de Productos
 * =====================================================
 *
 * Este script convierte el catálogo de productos en embeddings vectoriales
 * y los almacena en Supabase para búsqueda semántica RAG.
 *
 * Uso:
 *   npx tsx scripts/vectorize-catalog.ts
 *
 * Requisitos:
 *   - SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en .env
 *   - OPENAI_API_KEY en .env (para generar embeddings)
 *   - Tabla product_embeddings creada (ver migración)
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config({ path: '.env.local' });
dotenv.config();

// =====================================================
// CONFIGURACIÓN
// =====================================================

const CONFIG = {
  // Supabase
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',

  // OpenAI
  openaiApiKey: process.env.OPENAI_API_KEY || '',
  embeddingModel: 'text-embedding-3-small', // 1536 dimensiones
  embeddingDimensions: 1536,

  // Procesamiento
  batchSize: 20, // Productos por lote
  rateLimitDelay: 200, // ms entre llamadas API

  // Rutas
  productsJsonPath: path.join(process.cwd(), 'public', 'productos tus_aguacates.json'),
};

// =====================================================
// TIPOS
// =====================================================

interface ProductVariant {
  name: string;
  price: number;
}

interface Product {
  name: string;
  description: string;
  variants: ProductVariant[];
}

interface Category {
  name: string;
  products: Product[];
}

interface ProductsJson {
  categories: Category[];
}

interface ProductEmbedding {
  product_id: string;
  product_name: string;
  product_description: string;
  category: string;
  search_text: string;
  embedding: number[];
  price: number;
  metadata: Record<string, unknown>;
  source_updated_at: string;
}

// =====================================================
// UTILIDADES
// =====================================================

function generateProductId(category: string, productName: string, index: number): string {
  const slug = productName
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 30);

  return `${category.toLowerCase().substring(0, 10)}-${slug}-${index}`;
}

function buildSearchText(product: Product, category: string): string {
  const parts: string[] = [
    product.name,
    category,
    product.description || '',
  ];

  // Agregar información de variantes
  if (product.variants?.length) {
    product.variants.forEach((v) => {
      parts.push(v.name);
    });
  }

  // Agregar sinónimos y términos relacionados según categoría
  const categoryKeywords: Record<string, string[]> = {
    'Aguacates': ['avocado', 'palta', 'guacamole', 'cremoso', 'maduro', 'verde'],
    'Frutas': ['fruta', 'dulce', 'jugoso', 'natural', 'vitaminas', 'saludable'],
    'Verduras': ['verdura', 'vegetal', 'ensalada', 'fresco', 'orgánico'],
    'Lácteos': ['leche', 'queso', 'yogurt', 'proteína', 'calcio'],
    'Carnes': ['proteína', 'asado', 'parrilla', 'carne'],
    'Bebidas': ['bebida', 'jugo', 'refrescante', 'hidratación'],
  };

  const keywords = categoryKeywords[category] || [];
  parts.push(...keywords);

  return parts.filter(Boolean).join(' ').toLowerCase();
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// =====================================================
// CLIENTE OPENAI (sin dependencia)
// =====================================================

async function generateEmbedding(text: string): Promise<number[]> {
  if (!CONFIG.openaiApiKey) {
    throw new Error('OPENAI_API_KEY no configurada');
  }

  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${CONFIG.openaiApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: CONFIG.embeddingModel,
      input: text,
      dimensions: CONFIG.embeddingDimensions,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Error de OpenAI: ${response.status} - ${error}`);
  }

  const data = await response.json();
  return data.data[0].embedding;
}

// =====================================================
// FUNCIONES PRINCIPALES
// =====================================================

async function loadProductsJson(): Promise<ProductsJson> {
  console.log(`📂 Cargando productos desde: ${CONFIG.productsJsonPath}`);

  if (!fs.existsSync(CONFIG.productsJsonPath)) {
    throw new Error(`Archivo no encontrado: ${CONFIG.productsJsonPath}`);
  }

  const content = fs.readFileSync(CONFIG.productsJsonPath, 'utf-8');
  const data = JSON.parse(content) as ProductsJson;

  const totalProducts = data.categories.reduce(
    (sum, cat) => sum + cat.products.length,
    0
  );

  console.log(`✅ Cargadas ${data.categories.length} categorías con ${totalProducts} productos`);
  return data;
}

function flattenProducts(data: ProductsJson): ProductEmbedding[] {
  const products: ProductEmbedding[] = [];
  let globalIndex = 0;

  for (const category of data.categories) {
    for (const product of category.products) {
      globalIndex++;

      const productId = generateProductId(category.name, product.name, globalIndex);
      const price = product.variants?.[0]?.price || 0;

      products.push({
        product_id: productId,
        product_name: product.name,
        product_description: product.description || '',
        category: category.name,
        search_text: buildSearchText(product, category.name),
        embedding: [], // Se llenará después
        price,
        metadata: {
          variants: product.variants || [],
          original_index: globalIndex,
        },
        source_updated_at: new Date().toISOString(),
      });
    }
  }

  console.log(`📦 Aplanados ${products.length} productos para vectorización`);
  return products;
}

async function processEmbeddings(
  products: ProductEmbedding[],
  onProgress?: (current: number, total: number) => void
): Promise<ProductEmbedding[]> {
  console.log(`🧠 Generando embeddings para ${products.length} productos...`);

  const results: ProductEmbedding[] = [];

  for (let i = 0; i < products.length; i++) {
    const product = products[i];

    try {
      const embedding = await generateEmbedding(product.search_text);
      product.embedding = embedding;
      results.push(product);

      if (onProgress) {
        onProgress(i + 1, products.length);
      }

      // Rate limiting
      if (i < products.length - 1) {
        await sleep(CONFIG.rateLimitDelay);
      }
    } catch (error) {
      console.error(`❌ Error en producto ${product.product_id}:`, error);
      // Continuar con el siguiente producto
    }
  }

  console.log(`✅ Generados ${results.length}/${products.length} embeddings`);
  return results;
}

async function upsertToSupabase(
  supabase: SupabaseClient,
  products: ProductEmbedding[]
): Promise<void> {
  console.log(`📤 Subiendo ${products.length} productos a Supabase...`);

  // Procesar en lotes
  for (let i = 0; i < products.length; i += CONFIG.batchSize) {
    const batch = products.slice(i, i + CONFIG.batchSize);

    const { error } = await supabase.from('product_embeddings').upsert(
      batch.map((p) => ({
        product_id: p.product_id,
        product_name: p.product_name,
        product_description: p.product_description,
        category: p.category,
        search_text: p.search_text,
        embedding: `[${p.embedding.join(',')}]`, // Format for pgvector
        price: p.price,
        metadata: p.metadata,
        source_updated_at: p.source_updated_at,
        embedding_updated_at: new Date().toISOString(),
      })),
      { onConflict: 'product_id' }
    );

    if (error) {
      console.error(`❌ Error en lote ${i / CONFIG.batchSize + 1}:`, error);
      throw error;
    }

    console.log(`  📦 Lote ${Math.floor(i / CONFIG.batchSize) + 1}/${Math.ceil(products.length / CONFIG.batchSize)} completado`);
  }

  console.log(`✅ Todos los productos subidos a Supabase`);
}

// =====================================================
// MODO SIN OPENAI (Mock Embeddings)
// =====================================================

function generateMockEmbedding(): number[] {
  // Genera un vector aleatorio normalizado de 1536 dimensiones
  const embedding = Array.from({ length: CONFIG.embeddingDimensions }, () =>
    Math.random() * 2 - 1
  );

  // Normalizar el vector
  const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
  return embedding.map((val) => val / magnitude);
}

async function processEmbeddingsMock(products: ProductEmbedding[]): Promise<ProductEmbedding[]> {
  console.log(`🎭 Generando embeddings MOCK para ${products.length} productos...`);
  console.log(`⚠️  NOTA: Estos embeddings son aleatorios. Para producción, configura OPENAI_API_KEY`);

  return products.map((product) => ({
    ...product,
    embedding: generateMockEmbedding(),
  }));
}

// =====================================================
// MAIN
// =====================================================

async function main(): Promise<void> {
  console.log('\n🥑 =====================================================');
  console.log('   VECTORIZACIÓN DEL CATÁLOGO - EL MAYORDOMO MAGISTRAL');
  console.log('   =====================================================\n');

  // Validar configuración
  if (!CONFIG.supabaseUrl || !CONFIG.supabaseServiceKey) {
    console.error('❌ Error: Configura NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY');
    console.log('\nVariables esperadas en .env.local:');
    console.log('  NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co');
    console.log('  SUPABASE_SERVICE_ROLE_KEY=eyJ...');
    process.exit(1);
  }

  const useMockEmbeddings = !CONFIG.openaiApiKey;

  if (useMockEmbeddings) {
    console.log('⚠️  OPENAI_API_KEY no configurada. Usando embeddings MOCK.\n');
  }

  // Crear cliente Supabase
  const supabase = createClient(CONFIG.supabaseUrl, CONFIG.supabaseServiceKey, {
    auth: { persistSession: false },
  });

  try {
    // Paso 1: Cargar productos
    const productsJson = await loadProductsJson();

    // Paso 2: Aplanar estructura
    const products = flattenProducts(productsJson);

    // Paso 3: Generar embeddings
    const productsWithEmbeddings = useMockEmbeddings
      ? await processEmbeddingsMock(products)
      : await processEmbeddings(products, (current, total) => {
          const percent = Math.round((current / total) * 100);
          process.stdout.write(`\r  🔄 Progreso: ${current}/${total} (${percent}%)`);
        });

    console.log(''); // Nueva línea después del progreso

    // Paso 4: Subir a Supabase
    await upsertToSupabase(supabase, productsWithEmbeddings);

    // Resumen
    console.log('\n✅ =====================================================');
    console.log('   VECTORIZACIÓN COMPLETADA');
    console.log('   =====================================================');
    console.log(`   📦 Productos procesados: ${productsWithEmbeddings.length}`);
    console.log(`   🧠 Dimensiones embedding: ${CONFIG.embeddingDimensions}`);
    console.log(`   📊 Modelo: ${useMockEmbeddings ? 'MOCK (aleatorio)' : CONFIG.embeddingModel}`);
    console.log('   =====================================================\n');
  } catch (error) {
    console.error('\n❌ Error durante la vectorización:', error);
    process.exit(1);
  }
}

// Ejecutar
main();
