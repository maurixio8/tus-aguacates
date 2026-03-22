import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { requireAdminRole } from '@/lib/auth-admin';

export const dynamic = 'force-dynamic';

// Create Supabase client
function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase configuration');
  }

  return createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

// POST - Migrate variants from JSON to Supabase
export async function POST(request: NextRequest) {
  try {
    const adminAccess = await requireAdminRole(request, 'super_admin');
    if (adminAccess.response) {
      return adminAccess.response;
    }

    const supabase = getSupabaseClient();

    // Read the JSON file
    const jsonPath = path.join(process.cwd(), 'public', 'productos tus_aguacates.json');
    const jsonContent = fs.readFileSync(jsonPath, 'utf-8');
    const jsonData = JSON.parse(jsonContent);

    // Get all products from Supabase
    const { data: supabaseProducts, error: productsError } = await supabase
      .from('products')
      .select('id, name, slug');

    if (productsError) {
      console.error('Error getting products:', productsError);
      return NextResponse.json({ error: 'Error obteniendo productos' }, { status: 500 });
    }

    // Create a map of product names to IDs (normalized)
    const productMap = new Map<string, string>();
    supabaseProducts?.forEach(p => {
      const normalizedName = p.name.toLowerCase().trim();
      productMap.set(normalizedName, p.id);
    });

    let variantsCreated = 0;
    let productsMatched = 0;
    let productsNotFound: string[] = [];
    const variantsToInsert: any[] = [];

    // Process each category and product from JSON
    for (const category of jsonData.categories || []) {
      for (const product of category.products || []) {
        const productName = product.name?.toLowerCase().trim();
        const productId = productMap.get(productName);

        if (!productId) {
          // Try partial match
          let found = false;
          for (const [name, id] of productMap.entries()) {
            if (name.includes(productName) || productName.includes(name)) {
              // Found partial match
              if (product.variants && product.variants.length > 0) {
                productsMatched++;
                for (const variant of product.variants) {
                  variantsToInsert.push({
                    product_id: id,
                    variant_name: 'Presentación',
                    variant_value: variant.name || 'Estándar',
                    price: variant.price || 0,
                    price_adjustment: 0,
                    stock_quantity: 100,
                    is_active: true,
                    sort_order: variantsToInsert.length
                  });
                }
              }
              found = true;
              break;
            }
          }
          if (!found) {
            productsNotFound.push(product.name);
          }
          continue;
        }

        productsMatched++;

        // Add variants for this product
        if (product.variants && product.variants.length > 0) {
          for (const variant of product.variants) {
            variantsToInsert.push({
              product_id: productId,
              variant_name: 'Presentación',
              variant_value: variant.name || 'Estándar',
              price: variant.price || 0,
              price_adjustment: 0,
              stock_quantity: 100,
              is_active: true,
              sort_order: variantsToInsert.length
            });
          }
        }
      }
    }

    // Insert variants in batches
    if (variantsToInsert.length > 0) {
      // First, delete existing variants to avoid duplicates
      const { error: deleteError } = await supabase
        .from('product_variants')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

      if (deleteError && deleteError.code !== 'PGRST116') {
        console.error('Error deleting existing variants:', deleteError);
      }

      // Insert in batches of 100
      const batchSize = 100;
      for (let i = 0; i < variantsToInsert.length; i += batchSize) {
        const batch = variantsToInsert.slice(i, i + batchSize);
        const { error: insertError } = await supabase
          .from('product_variants')
          .insert(batch);

        if (insertError) {
          console.error('Error inserting batch:', insertError);
          // Continue with next batch
        } else {
          variantsCreated += batch.length;
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Migración completada',
      stats: {
        productsMatched,
        variantsCreated,
        productsNotFound: productsNotFound.slice(0, 10), // Solo mostrar los primeros 10
        totalNotFound: productsNotFound.length
      }
    });

  } catch (error) {
    console.error('Migration error:', error);
    return NextResponse.json(
      { error: 'Error en la migración', details: String(error) },
      { status: 500 }
    );
  }
}

// GET - Check migration status
export async function GET(request: NextRequest) {
  try {
    const adminAccess = await requireAdminRole(request, 'super_admin');
    if (adminAccess.response) {
      return adminAccess.response;
    }

    const supabase = getSupabaseClient();

    // Count variants
    const { count, error } = await supabase
      .from('product_variants')
      .select('*', { count: 'exact', head: true });

    if (error) {
      // Table might not exist
      return NextResponse.json({
        success: true,
        tableExists: false,
        variantsCount: 0,
        message: 'La tabla product_variants no existe. Ejecuta el script SQL primero.'
      });
    }

    return NextResponse.json({
      success: true,
      tableExists: true,
      variantsCount: count || 0
    });

  } catch (error) {
    return NextResponse.json(
      { error: 'Error verificando estado', details: String(error) },
      { status: 500 }
    );
  }
}
