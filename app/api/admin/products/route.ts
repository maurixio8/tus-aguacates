import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAdminRole } from '@/lib/auth-admin';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Create Supabase client directly to avoid import issues
function getSupabaseClient() {
  const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').replace(/\\n/g, '').replace(/\\r/g, '').trim();
  const rawKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  const supabaseKey = rawKey.replace(/\\n/g, '').replace(/\\r/g, '').trim();

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase environment variables:', {
      hasUrl: !!supabaseUrl,
      hasKey: !!supabaseKey
    });
    throw new Error('Missing Supabase configuration');
  }

  console.log('✅ Supabase client created with URL:', supabaseUrl.substring(0, 30) + '...');

  return createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

// Configuración CORS para permitir el dashboard
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// GET - List products with filtering
export async function GET(request: NextRequest) {
  try {
    const adminAccess = await requireAdminRole(request, 'viewer', corsHeaders);
    if (adminAccess.response) {
      return adminAccess.response;
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || '';
    const status = searchParams.get('status') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    console.log('🔍 API: Fetching products with params:', { search, category, status, page, limit });

    let supabase;
    try {
      supabase = getSupabaseClient();
    } catch (configError) {
      console.error('❌ Supabase configuration error:', configError);
      return NextResponse.json(
        { error: 'Error de configuración del servidor', details: String(configError) },
        { status: 500, headers: corsHeaders }
      );
    }

    // Try to include variants, fallback to without if table doesn't exist
    let query = supabase
      .from('products')
      .select(`
        *,
        categories:category_id (
          id,
          name,
          slug
        ),
        product_variants (
          id,
          variant_name,
          variant_value,
          price,
          price_adjustment,
          stock_quantity,
          is_active
        )
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    // Apply search filter
    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%,sku.ilike.%${search}%`);
    }

    // Apply category filter
    if (category && category !== 'all') {
      query = query.eq('category_id', category);
    }

    // Apply status filter
    if (status && status !== 'all') {
      if (status === 'active') {
        query = query.eq('is_active', true);
      } else if (status === 'inactive') {
        query = query.eq('is_active', false);
      } else if (status === 'featured') {
        query = query.eq('is_featured', true);
      }
    }

    let { data, error, count } = await query;

    console.log('🔍 Initial query result:', {
      dataCount: data?.length || 0,
      hasVariants: data?.[0]?.product_variants?.length || 0,
      error: error?.message
    });

    // If error is about product_variants not existing, retry without variants
    if (error && error.message?.includes('product_variants')) {
      console.log('⚠️ product_variants table not found, fetching without variants');
      const fallbackQuery = supabase
        .from('products')
        .select(`
          *,
          categories:category_id (
            id,
            name,
            slug
          )
        `, { count: 'exact' })
        .order('created_at', { ascending: false })
        .range((page - 1) * limit, page * limit - 1);

      if (search) {
        fallbackQuery.or(`name.ilike.%${search}%,description.ilike.%${search}%,sku.ilike.%${search}%`);
      }
      if (category && category !== 'all') {
        fallbackQuery.eq('category_id', category);
      }
      if (status && status !== 'all') {
        if (status === 'active') fallbackQuery.eq('is_active', true);
        else if (status === 'inactive') fallbackQuery.eq('is_active', false);
        else if (status === 'featured') fallbackQuery.eq('is_featured', true);
      }

      const fallbackResult = await fallbackQuery;
      data = fallbackResult.data;
      error = fallbackResult.error;
      count = fallbackResult.count;
    }

    console.log('📊 API: Products response:', {
      data: data?.length || 0,
      error,
      count,
      success: !error
    });

    if (error) {
      console.error('❌ API: Error fetching products:', error);
      return NextResponse.json(
        { error: 'Error al cargar productos', details: error.message, code: error.code },
        { status: 500, headers: corsHeaders }
      );
    }

    // Get product IDs for separate variants query
    const productIds = data?.map(item => item.id) || [];

    // Fetch variants separately to avoid Supabase schema cache issues
    let variantsMap: Record<string, any[]> = {};
    if (productIds.length > 0) {
      const { data: variants, error: variantsError } = await supabase
        .from('product_variants')
        .select('*')
        .in('product_id', productIds);

      if (!variantsError && variants) {
        variants.forEach(v => {
          if (!variantsMap[v.product_id]) {
            variantsMap[v.product_id] = [];
          }
          variantsMap[v.product_id].push(v);
        });
      }
      console.log('📦 Variants fetched:', variants?.length || 0);
      if (variants && variants.length > 0) {
        console.log('🔍 First variant structure:', JSON.stringify(variants[0], null, 2));
        console.log('🔍 Variant fields:', Object.keys(variants[0]));
      }
    }

    // Transform data to include category_name and variants
    const products = data?.map(item => ({
      ...item,
      category_name: item.categories?.name || 'Sin categoría',
      variants: variantsMap[item.id] || item.product_variants || [],
      hasVariants: (variantsMap[item.id]?.length || item.product_variants?.length || 0) > 0
    })) || [];

    return NextResponse.json({
      success: true,
      data: products,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    }, { headers: corsHeaders });

  } catch (error) {
    console.error('❌ API: Unexpected error:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500, headers: corsHeaders }
    );
  }
}

// POST - Create new product
export async function POST(request: NextRequest) {
  try {
    // Verify admin authentication
    const adminAccess = await requireAdminRole(request, 'admin', corsHeaders);
    if (adminAccess.response) {
      return adminAccess.response;
    }

    const body = await request.json();
    console.log('📝 API: Creating product:', body);

    const supabase = getSupabaseClient();

    // Handle missing category_id with a default fallback
    let categoryId = body.category_id;
    if (!categoryId) {
      console.log('⚠️ API: category_id missing, searching for a default category');
      const { data: categories, error: catError } = await supabase
        .from('categories')
        .select('id')
        .limit(1);

      if (!catError && categories && categories.length > 0) {
        categoryId = categories[0].id;
        console.log('✅ API: Using default category_id:', categoryId);
      } else {
        return NextResponse.json(
          { error: 'No se pudo encontrar una categoría por defecto y no se proporcionó una.' },
          { status: 400, headers: corsHeaders }
        );
      }
    }

    // Validate required fields (excluding category_id since we handled it)
    const requiredFields = ['name', 'price', 'stock'];
    for (const field of requiredFields) {
      // Fix: Allow 0 as valid value - only check for null/undefined/empty string
      if (body[field] === undefined || body[field] === null || body[field] === '') {
        return NextResponse.json(
          { error: `El campo ${field} es requerido` },
          { status: 400, headers: corsHeaders }
        );
      }
    }
    // Validate data types
    if (typeof body.price !== 'number' || body.price < 0) {
      return NextResponse.json(
        { error: 'El precio debe ser un número válido' },
        { status: 400, headers: corsHeaders }
      );
    }

    if (typeof body.stock !== 'number' || body.stock < 0) {
      return NextResponse.json(
        { error: 'El stock debe ser un número válido' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Generate slug from name
    const slug = body.name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');

    // Generate SKU if not provided
    const sku = body.sku || `PRD-${Date.now().toString(36).toUpperCase()}`;

    // Create the product
    const { data, error } = await supabase
      .from('products')
      .insert({
        name: body.name,
        description: body.description || '',
        category_id: categoryId,
        price: body.price,
        discount_price: body.discount_price || null,
        unit: body.unit || 'unit',
        available_for: body.available_for || 'both', // Enviar campo de disponibilidad
        weight: body.weight || null,
        min_quantity: body.min_quantity || 1,
        main_image_url: body.main_image_url || null,
        images: body.images || [],
        stock: body.stock,
        reserved_stock: 0,
        is_organic: body.is_organic || false,
        is_featured: body.is_featured || false,
        is_active: body.is_active !== false, // Default to true
        benefits: body.benefits || [],
        rating: 0,
        review_count: 0,
        slug,
        sku,
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    console.log('💾 API: Product creation response:', { data, error });

    if (error) {
      console.error('❌ API: Error creating product:', error);

      // Manejar errores específicos de la base de datos
      if (error.code === '42501') {
        return NextResponse.json(
          {
            error: 'Permiso denegado (RLS Violation)',
            details: 'La base de datos denegó la operación. Esto suele ocurrir cuando la SUPABASE_SERVICE_ROLE_KEY es incorrecta.',
            code: error.code
          },
          { status: 403, headers: corsHeaders }
        );
      }

      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'Ya existe un producto con ese SKU o slug' },
          { status: 409, headers: corsHeaders }
        );
      }

      if (error.code === '23503') {
        return NextResponse.json(
          { error: 'La categoría especificada no existe' },
          { status: 400, headers: corsHeaders }
        );
      }

      // Devolver más detalles del error para diagnóstico
      return NextResponse.json(
        {
          error: 'Error al crear el producto',
          details: error.message,
          code: error.code,
          hint: error.hint,
          details_full: JSON.stringify(error)
        },
        { status: 500, headers: corsHeaders }
      );
    }

    console.log('✅ API: Product created successfully:', data);

    // Create variants if provided
    if (body.variants && Array.isArray(body.variants) && body.variants.length > 0) {
      console.log(`📦 API: Creating ${body.variants.length} variants for product ${data.id}`);

      const variantsToInsert = body.variants.map((v: any, index: number) => ({
        product_id: data.id,
        variant_name: v.variant_name || 'Presentacion',
        variant_value: v.variant_value || '',
        price: Number(v.price) || body.price,
        price_adjustment: Number(v.price_adjustment) || 0,
        stock_quantity: Number(v.stock_quantity) || 0,
        is_active: v.is_active !== false,
        sku: v.sku || `${sku}-V${index + 1}`,
      }));

      const { error: variantsError } = await supabase
        .from('product_variants')
        .insert(variantsToInsert);

      if (variantsError) {
        console.error('❌ API: Error creating variants:', variantsError);
        // We include a warning in the response
        return NextResponse.json({
          success: true,
          data,
          warning: 'Producto creado pero hubo errores al crear las variantes.',
          variantsError: variantsError.message,
          message: 'Producto creado exitosamente (con errores en variantes)'
        }, { status: 201, headers: corsHeaders });
      }

      console.log('✅ API: Variants created successfully');

      // Fetch the product again with variants to return complete data
      const { data: fullProduct } = await supabase
        .from('products')
        .select(`
          *,
          product_variants (*)
        `)
        .eq('id', data.id)
        .single();

      if (fullProduct) {
        return NextResponse.json({
          success: true,
          data: fullProduct,
          message: 'Producto y variantes creados exitosamente'
        }, { status: 201, headers: corsHeaders });
      }
    }

    return NextResponse.json({
      success: true,
      data,
      message: 'Producto creado exitosamente'
    }, { status: 201, headers: corsHeaders });


  } catch (error) {
    console.error('❌ API: Unexpected error creating product:', error);
    return NextResponse.json(
      {
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500, headers: corsHeaders }
    );
  }
}
