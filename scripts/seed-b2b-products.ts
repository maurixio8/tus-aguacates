/**
 * Script para crear productos B2B iniciales de ejemplo
 * Ejecutar con: npx tsx scripts/seed-b2b-products.ts
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

async function seedB2BProducts() {
  console.log('🌱 Creando productos B2B iniciales...\n');

  // 1. Primero crear categorías B2B
  console.log('1️⃣ Creando categorías B2B...');
  const categories = [
    { name: 'Aguacates', slug: 'aguacates', description: 'Aguacates premium al por mayor', icon: 'avocado', order: 1, is_active: true },
    { name: 'Frutas Tropicales', slug: 'tropicales', description: 'Frutas tropicales frescas', icon: 'tropical', order: 2, is_active: true },
    { name: 'Verduras', slug: 'verduras', description: 'Verduras de hoja y raíz', icon: 'vegetable', order: 3, is_active: true },
    { name: 'Cítricos', slug: 'citricos', description: 'Naranjas, limones y más', icon: 'citrus', order: 4, is_active: true },
  ];

  const { data: createdCategories, error: catError } = await supabase
    .from('b2b_categories')
    .insert(categories)
    .select();

  if (catError) {
    console.error('❌ Error creando categorías:', catError);
  } else {
    console.log(`✅ Categorías creadas: ${createdCategories?.length || 0}`);
    createdCategories?.forEach((c: any, i: number) => {
      console.log(`   ${i + 1}. ${c.name} (ID: ${c.id})`);
    });
  }

  // Obtener IDs de categorías
  const aguacatesCat = createdCategories?.find((c: any) => c.slug === 'aguacates');
  const tropicalesCat = createdCategories?.find((c: any) => c.slug === 'tropicales');

  // 2. Crear productos B2B
  console.log('\n2️⃣ Creando productos B2B...');

  const products = [
    // Aguacates
    {
      sku: 'B2B-AGUACATE-HASS',
      name: 'Aguacate Hass Premium',
      description: 'Aguacate Hass de primera calidad, tamaño mediano-grande. Ideal para restaurante y ventas al detal.',
      category_id: aguacatesCat?.id || null,
      base_price: 8500,
      cost_price: 6500,
      stock_quantity: 500,
      minimum_order_quantity: 10,
      unit: 'kg',
      is_active: true,
      is_featured: true,
      main_image_url: 'https://gxqkmaaqoehydulksudj.supabase.co/storage/v1/object/public/product-images/products/aguacate-hass.jpg',
      images: ['https://gxqkmaaqoehydulksudj.supabase.co/storage/v1/object/public/product-images/products/aguacate-hass.jpg'],
      specifications: {
        origen: 'Colombia',
        variedad: 'Hass',
        tamano: 'Mediano-Grande (12-16 oz)',
        madurez: 'Verde Maduro',
      },
      benefits: ['Precios por volumen', 'Entrega en 24-48h', 'Calidad garantizada'],
    },
    {
      sku: 'B2B-AGUACATE-FUERTE',
      name: 'Aguacate Fuerte',
      description: 'Aguacate Fuerte de excelente calidad, piel delgada y pulpa cremosa.',
      category_id: aguacatesCat?.id || null,
      base_price: 7500,
      cost_price: 5500,
      stock_quantity: 300,
      minimum_order_quantity: 10,
      unit: 'kg',
      is_active: true,
      is_featured: false,
      main_image_url: 'https://gxqkmaaqoehydulksudj.supabase.co/storage/v1/object/public/product-images/products/aguacate-fuerte.jpg',
      images: ['https://gxqkmaaqoehydulksudj.supabase.co/storage/v1/object/public/product-images/products/aguacate-fuerte.jpg'],
      specifications: {
        origen: 'Colombia',
        variedad: 'Fuerte',
        tamano: 'Grande (16-20 oz)',
        madurez: 'Maduro Ready-to-Eat',
      },
      benefits: ['Precios por volumen', 'Entrega en 24-48h', 'Calidad garantizada'],
    },
    // Tropicales
    {
      sku: 'B2B-MANGO-TOMMY',
      name: 'Mango Tommy Atkins',
      description: 'Mango Tommy Atkins dulce y jugoso, uno de los más populares en el mercado.',
      category_id: tropicalesCat?.id || null,
      base_price: 5500,
      cost_price: 4000,
      stock_quantity: 200,
      minimum_order_quantity: 5,
      unit: 'kg',
      is_active: true,
      is_featured: true,
      main_image_url: 'https://gxqkmaaqoehydulksudj.supabase.co/storage/v1/object/public/product-images/products/mango-tommy.jpg',
      images: ['https://gxqkmaaqoehydulksudj.supabase.co/storage/v1/object/public/product-images/products/mango-tommy.jpg'],
      specifications: {
        origen: 'Colombia',
        variedad: 'Tommy Atkins',
        tamano: 'Mediano-Grande',
        madurez: 'Maduro',
      },
      benefits: ['Precios por volumen', 'Entrega en 24-48h', 'Calidad garantizada'],
    },
    {
      sku: 'B2B-PIña-MD2',
      name: 'Piña MD2 Golden',
      description: 'Piña MD2 de excelente dulzura, bajo contenido de acidez y aroma intenso.',
      category_id: tropicalesCat?.id || null,
      base_price: 4500,
      cost_price: 3200,
      stock_quantity: 150,
      minimum_order_quantity: 10,
      unit: 'kg',
      is_active: true,
      is_featured: false,
      main_image_url: 'https://gxqkmaaqoehydulksudj.supabase.co/storage/v1/object/public/product-images/products/pina-md2.jpg',
      images: ['https://gxqkmaaqoehydulksudj.supabase.co/storage/v1/object/public/product-images/products/pina-md2.jpg'],
      specifications: {
        origen: 'Colombia',
        variedad: 'MD2 Golden',
        tamano: 'Grande',
        madurez: 'Maduro',
      },
      benefits: ['Precios por volumen', 'Entrega en 24-48h', 'Calidad garantizada'],
    },
  ];

  const { data: createdProducts, error: prodError } = await supabase
    .from('b2b_products')
    .insert(products)
    .select();

  if (prodError) {
    console.error('❌ Error creando productos:', prodError);
  } else {
    console.log(`✅ Productos creados: ${createdProducts?.length || 0}`);
    createdProducts?.forEach((p: any, i: number) => {
      console.log(`   ${i + 1}. ${p.sku} - ${p.name} ($${p.base_price}/${p.unit})`);
    });
  }

  // 3. Crear pricing tiers para cada producto
  console.log('\n3️⃣ Creando pricing tiers...');

  if (createdProducts && createdProducts.length > 0) {
    for (const product of createdProducts) {
      const tiers = [
        {
          product_id: product.id,
          min_quantity: product.minimum_order_quantity,
          max_quantity: product.minimum_order_quantity * 4,
          price_per_unit: product.base_price * 0.95, // 5% descuento
          tier_name: `${product.minimum_order_quantity}-${product.minimum_order_quantity * 4} ${product.unit}`,
          discount_percentage: 5,
        },
        {
          product_id: product.id,
          min_quantity: product.minimum_order_quantity * 4 + 1,
          max_quantity: product.minimum_order_quantity * 10,
          price_per_unit: product.base_price * 0.90, // 10% descuento
          tier_name: `${product.minimum_order_quantity * 4 + 1}-${product.minimum_order_quantity * 10} ${product.unit}`,
          discount_percentage: 10,
        },
        {
          product_id: product.id,
          min_quantity: product.minimum_order_quantity * 10 + 1,
          max_quantity: null,
          price_per_unit: product.base_price * 0.85, // 15% descuento
          tier_name: `${product.minimum_order_quantity * 10 + 1}+ ${product.unit}`,
          discount_percentage: 15,
        },
      ];

      const { error: tiersError } = await supabase
        .from('b2b_pricing_tiers')
        .insert(tiers);

      if (tiersError) {
        console.error(`❌ Error creando tiers para ${product.sku}:`, tiersError);
      } else {
        console.log(`✅ Tiers creados para ${product.sku}`);
      }
    }
  }

  console.log('\n✅ Productos B2B iniciales creados exitosamente');
  console.log('📊 Total: 4 productos, 4 categorías, 12 pricing tiers');
}

seedB2BProducts().catch(console.error);
