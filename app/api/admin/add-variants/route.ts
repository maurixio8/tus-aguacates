import { NextRequest, NextResponse } from 'next/server';
import {
  createSupabaseClient,
  getAdminCorsHeaders,
  verifyAdminAuth,
} from '@/lib/auth-admin';

export const dynamic = 'force-dynamic';

type VariantSeed = {
  productSearchNames: string[];
  variants: Array<{
    variant_name: string;
    variant_value: string;
    price_adjustment: number;
  }>;
};

const VARIANTS_TO_ADD: VariantSeed[] = [
  {
    productSearchNames: ['aceite de coco', 'aceite coco'],
    variants: [
      { variant_name: 'Tamano', variant_value: '105 ml', price_adjustment: 15000 },
      { variant_name: 'Tamano', variant_value: '250 ml', price_adjustment: 28000 },
      { variant_name: 'Tamano', variant_value: '500 ml', price_adjustment: 48000 },
    ],
  },
  {
    productSearchNames: ['banano criollo', 'banana criollo'],
    variants: [
      { variant_name: 'Peso', variant_value: '1 Kilo', price_adjustment: 7500 },
      { variant_name: 'Peso', variant_value: '500 gr', price_adjustment: 4000 },
    ],
  },
  {
    productSearchNames: ['banano bocadillo', 'banana bocadillo'],
    variants: [
      { variant_name: 'Peso', variant_value: '1 Kilo', price_adjustment: 7400 },
      { variant_name: 'Peso', variant_value: '500 gr', price_adjustment: 4000 },
    ],
  },
  {
    productSearchNames: ['fresas premium', 'fresa premium'],
    variants: [
      { variant_name: 'Peso', variant_value: '500 gr', price_adjustment: 8500 },
      { variant_name: 'Peso', variant_value: '1000 gr', price_adjustment: 16000 },
      { variant_name: 'Peso', variant_value: '250 gr', price_adjustment: 4500 },
    ],
  },
  {
    productSearchNames: ['fresa economica', 'fresas economicas'],
    variants: [
      { variant_name: 'Peso', variant_value: '500 gr', price_adjustment: 6500 },
      { variant_name: 'Peso', variant_value: '1000 gr', price_adjustment: 12000 },
    ],
  },
  {
    productSearchNames: ['mango azucar'],
    variants: [
      { variant_name: 'Peso', variant_value: '500grs', price_adjustment: 5000 },
      { variant_name: 'Peso', variant_value: '1000grs', price_adjustment: 9300 },
    ],
  },
  {
    productSearchNames: ['mango comun', 'mango commun'],
    variants: [
      { variant_name: 'Peso', variant_value: '500grs', price_adjustment: 3700 },
      { variant_name: 'Peso', variant_value: '1000grs', price_adjustment: 6900 },
    ],
  },
  {
    productSearchNames: ['frijol desgranado'],
    variants: [
      { variant_name: 'Peso', variant_value: '500grs', price_adjustment: 8100 },
      { variant_name: 'Peso', variant_value: '1000 gr', price_adjustment: 15000 },
      { variant_name: 'Peso', variant_value: '250 gr', price_adjustment: 4200 },
    ],
  },
  {
    productSearchNames: ['duraznos', 'durazno'],
    variants: [
      { variant_name: 'Peso', variant_value: '1 unidad', price_adjustment: 5200 },
      { variant_name: 'Peso', variant_value: '500 gr', price_adjustment: 7500 },
    ],
  },
];

function normalizeText(value: string) {
  return value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
}

function normalizeVariantValue(value: string) {
  const raw = normalizeText(value)
    .replace(/\(ahorro\)/g, '')
    .replace(/^x\s*/g, '')
    .replace(/\s+/g, '');

  if (/^(1kg|1kilo|1000gr|1000grs)$/.test(raw)) return '1000grs';
  if (/^(500gr|500grs)$/.test(raw)) return '500grs';
  if (/^(250gr|250grs)$/.test(raw)) return '250grs';

  return raw;
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }
  return 'Error interno del servidor';
}

async function buildVariantPlan() {
  const supabase = createSupabaseClient();
  const { data: allProducts, error: allProductsError } = await supabase
    .from('products')
    .select('id, name, is_active')
    .eq('is_active', true)
    .order('name');

  if (allProductsError) {
    throw new Error(allProductsError.message);
  }

  const findProduct = (searchNames: string[]) => {
    return allProducts?.find((product) => {
      const normalizedName = normalizeText(product.name);
      return searchNames.some((searchName) => {
        const normalizedSearch = normalizeText(searchName);
        return normalizedName === normalizedSearch || normalizedName.includes(normalizedSearch);
      });
    }) || null;
  };

  const results: Array<Record<string, unknown>> = [];
  let variantsAdded = 0;
  let variantsSkipped = 0;

  for (const item of VARIANTS_TO_ADD) {
    const product = findProduct(item.productSearchNames);

    if (!product) {
      results.push({ product: item.productSearchNames[0], status: 'NOT_FOUND' });
      continue;
    }

    const { data: existingVariants, error: existingVariantsError } = await supabase
      .from('product_variants')
      .select('variant_value')
      .eq('product_id', product.id);

    if (existingVariantsError) {
      results.push({
        product: product.name,
        productId: product.id,
        status: 'ERROR',
        error: existingVariantsError.message,
      });
      continue;
    }

    const existingVariantValues = new Set(
      (existingVariants || []).map((variant) => normalizeVariantValue(variant.variant_value))
    );

    const newVariants = item.variants.filter(
      (variant) => !existingVariantValues.has(normalizeVariantValue(variant.variant_value))
    );

    if (newVariants.length === 0) {
      results.push({
        product: product.name,
        productId: product.id,
        status: 'ALREADY_EXISTS',
      });
      variantsSkipped += item.variants.length;
      continue;
    }

    const variantsToInsert = newVariants.map((variant) => ({
      product_id: product.id,
      variant_name: variant.variant_name,
      variant_value: variant.variant_value,
      price: variant.price_adjustment,
      price_adjustment: variant.price_adjustment,
      is_active: true,
      stock_quantity: 999,
    }));

    results.push({
      product: product.name,
      productId: product.id,
      status: 'PENDING',
      count: newVariants.length,
      variantsToInsert,
    });
  }

  for (const result of results) {
    if (result.status === 'PENDING') {
      variantsAdded += Number(result.count || 0);
    }
  }

  return {
    supabase,
    results,
    variantsAdded,
    variantsSkipped,
  };
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, { headers: getAdminCorsHeaders(request) });
}

export async function GET(request: NextRequest) {
  const corsHeaders = getAdminCorsHeaders(request);

  try {
    const auth = await verifyAdminAuth(request);
    if (!auth.success) {
      return NextResponse.json({ error: auth.error }, { status: 401, headers: corsHeaders });
    }

    const plan = await buildVariantPlan();

    return NextResponse.json(
      {
        success: true,
        dryRun: true,
        message: `Se detectaron ${plan.variantsAdded} variantes listas para agregar`,
        results: plan.results.map((result) => ({
          ...result,
          variantsToInsert: undefined,
        })),
      },
      { headers: corsHeaders }
    );
  } catch (error) {
    return NextResponse.json(
      { error: getErrorMessage(error) },
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function POST(request: NextRequest) {
  const corsHeaders = getAdminCorsHeaders(request);

  try {
    const auth = await verifyAdminAuth(request);
    if (!auth.success) {
      return NextResponse.json({ error: auth.error }, { status: 401, headers: corsHeaders });
    }

    const body = await request.json().catch(() => ({}));
    const confirm = body?.confirm === true;

    if (!confirm) {
      return NextResponse.json(
        { error: 'Debes enviar { "confirm": true } para ejecutar este cambio.' },
        { status: 400, headers: corsHeaders }
      );
    }

    const plan = await buildVariantPlan();
    let insertedCount = 0;
    const executionResults: Array<Record<string, unknown>> = [];

    for (const result of plan.results) {
      if (result.status !== 'PENDING' || !Array.isArray(result.variantsToInsert)) {
        executionResults.push(result);
        continue;
      }

      const { error } = await plan.supabase
        .from('product_variants')
        .insert(result.variantsToInsert);

      if (error) {
        executionResults.push({
          product: result.product,
          productId: result.productId,
          status: 'ERROR',
          error: error.message,
        });
        continue;
      }

      insertedCount += Number(result.count || 0);
      executionResults.push({
        product: result.product,
        productId: result.productId,
        status: 'ADDED',
        count: result.count,
      });
    }

    return NextResponse.json(
      {
        success: true,
        message: `Se agregaron ${insertedCount} variantes`,
        results: executionResults,
      },
      { headers: corsHeaders }
    );
  } catch (error) {
    return NextResponse.json(
      { error: getErrorMessage(error) },
      { status: 500, headers: corsHeaders }
    );
  }
}
