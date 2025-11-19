import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';
import { createSupabaseClient } from '@/lib/auth-admin';

export const dynamic = 'force-dynamic';

// Helper function to verify admin authentication
async function verifyAdminAuth(request: NextRequest): Promise<{ success: boolean; adminId?: string; error?: string }> {
  try {
    // Get the admin-token cookie from the request
    const token = request.cookies.get('admin-token')?.value;

    console.log('🔍 Products API: Token check:', token ? 'present' : 'missing');

    if (!token) {
      return { success: false, error: 'No autenticado' };
    }

    // Verify the JWT token (MISMO CÓDIGO QUE EN LOGIN Y ME)
    const jwtSecret = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
    let decoded;
    try {
      decoded = jwt.verify(token, jwtSecret) as any;
      console.log('🔍 Products API: Token decoded:', { id: decoded.id, email: decoded.email, type: decoded.type });
    } catch (jwtError) {
      console.error('❌ Products API: JWT verification error:', jwtError);
      return { success: false, error: 'Token inválido o expirado' };
    }

    // Check if this is an admin token
    if (decoded.type !== 'admin') {
      console.log('❌ Products API: Token no es de tipo admin');
      return { success: false, error: 'Token no válido para administrador' };
    }

    return { success: true, adminId: decoded.id };

  } catch (error) {
    console.error('❌ Products API: Authentication error:', error);
    return { success: false, error: 'Error de autenticación' };
  }
}

// GET - List products with filtering
export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication
    const auth = await verifyAdminAuth(request);
    if (!auth.success) {
      return NextResponse.json(
        { error: auth.error },
        { status: 401 }
      );
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
      supabase = createSupabaseClient();
      console.log('✅ Products API: Supabase client created successfully');
    } catch (supabaseError) {
      console.error('❌ Products API: Error creating Supabase client:', supabaseError);
      return NextResponse.json(
        { error: 'Error de conexión a la base de datos' },
        { status: 500 }
      );
    }

    let query;
    try {
      query = supabase
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

      console.log('✅ Products API: Query created successfully');
    } catch (queryError) {
      console.error('❌ Products API: Error creating query:', queryError);
      return NextResponse.json(
        { error: 'Error al construir la consulta' },
        { status: 500 }
      );
    }

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

    let data, error, count;
    try {
      const result = await query;
      data = result.data;
      error = result.error;
      count = result.count;

      console.log('📊 API: Products response:', {
        data: data?.length || 0,
        error,
        count,
        success: !error
      });

      if (error) {
        console.error('❌ API: Supabase error fetching products:', error);

        // Si hay error de Supabase, devolver array vacío en lugar de error 500
        if (error.code?.startsWith('PGRST')) {
          console.log('⚠️ API: Supabase connection issue, returning empty array');
          return NextResponse.json({
            success: true,
            data: [],
            pagination: {
              page,
              limit,
              total: 0,
              totalPages: 0
            },
            warning: 'Temporalmente sin conexión a la base de datos'
          });
        }

        return NextResponse.json(
          { error: 'Error al cargar productos: ' + error.message },
          { status: 500 }
        );
      }
    } catch (queryExecutionError) {
      console.error('❌ API: Error executing query:', queryExecutionError);

      // Devolver array vacío si falla la ejecución
      return NextResponse.json({
        success: true,
        data: [],
        pagination: {
          page,
          limit,
          total: 0,
          totalPages: 0
        },
        warning: 'Error al consultar productos, mostrando lista vacía'
      });
    }

    // Transform data to include category_name
    const products = data?.map(item => ({
      ...item,
      category_name: item.categories?.name || 'Sin categoría'
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
    });

  } catch (error) {
    console.error('❌ API: Unexpected error:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// POST - Create new product
export async function POST(request: NextRequest) {
  try {
    // Verify admin authentication
    const auth = await verifyAdminAuth(request);
    if (!auth.success) {
      return NextResponse.json(
        { error: auth.error },
        { status: 401 }
      );
    }

    const body = await request.json();
    console.log('📝 API: Creating product:', body);

    // Validate required fields
    const requiredFields = ['name', 'price', 'stock', 'category_id'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `El campo ${field} es requerido` },
          { status: 400 }
        );
      }
    }

    // Validate data types
    if (typeof body.price !== 'number' || body.price < 0) {
      return NextResponse.json(
        { error: 'El precio debe ser un número válido' },
        { status: 400 }
      );
    }

    if (typeof body.stock !== 'number' || body.stock < 0) {
      return NextResponse.json(
        { error: 'El stock debe ser un número válido' },
        { status: 400 }
      );
    }

    // Generate slug from name
    const slug = body.name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim('-');

    // Generate SKU if not provided
    const sku = body.sku || `PRD-${Date.now().toString(36).toUpperCase()}`;

    const supabase = createSupabaseClient();

    // Create the product
    const { data, error } = await supabase
      .from('products')
      .insert({
        name: body.name,
        description: body.description || '',
        category_id: body.category_id,
        price: body.price,
        discount_price: body.discount_price || null,
        unit: body.unit || 'unit',
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
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    console.log('💾 API: Product creation response:', { data, error });

    if (error) {
      console.error('❌ API: Error creating product:', error);

      // Handle specific database errors
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'Ya existe un producto con ese SKU o slug' },
          { status: 409 }
        );
      }

      if (error.code === '23503') {
        return NextResponse.json(
          { error: 'La categoría especificada no existe' },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { error: 'Error al crear el producto' },
        { status: 500 }
      );
    }

    console.log('✅ API: Product created successfully:', data);

    return NextResponse.json({
      success: true,
      data,
      message: 'Producto creado exitosamente'
    }, { status: 201 });

  } catch (error) {
    console.error('❌ API: Unexpected error creating product:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}