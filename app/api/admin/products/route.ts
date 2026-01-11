import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';
import { verifyAdminAuth } from '@/lib/auth-admin';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Create Supabase client directly to avoid import issues
function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  // Usar SUPABASE_SERVICE_ROLE_KEY si existe, si no usar ANON_KEY
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

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
  'Access-Control-Allow-Origin': 'https://admin-dashboard-m9p6qyz27-mauricio-s-projects-2bf4b7a2.vercel.app',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, Cookie, Set-Cookie',
  'Access-Control-Allow-Credentials': 'true',
  'Access-Control-Max-Age': '86400',
};

// Manejar solicitudes OPTIONS para CORS
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, { headers: corsHeaders });
}

// Helper function to verify admin authentication
async function verifyAdminAuth(request: NextRequest): Promise<{ success: boolean; adminId?: string; error?: string }> {
  // Generate a request ID for logging correlation
  const requestId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const method = request.method;
  const endpoint = new URL(request.url).pathname;

  try {
    // Get the admin-token cookie from the request
    let token = request.cookies.get('admin-token')?.value;

    // Si no hay token en cookie, intentar obtenerlo del header Authorization
    if (!token) {
      const authHeader = request.headers.get('Authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7); // Remover 'Bearer ' prefix
      }
    }

    if (!token) {
      // ❌ CASE 1: No cookie found - log all available cookies for debugging
      const allCookies = request.cookies.getAll().map(c => c.name);
      console.warn(`⚠️ [${requestId}] ❌ FALTA TOKEN (cookie o Authorization)`, {
        endpoint,
        method,
        cookiesPresentes: allCookies.length > 0 ? allCookies.join(', ') : 'NINGUNA',
        hasAuthHeader: !!request.headers.get('Authorization'),
        timestamp: new Date().toISOString(),
        causasPosibles: [
          '1. Usuario no ha iniciado sesión (falta login en /admin/login)',
          '2. Cookie expirada (maxAge es 24 horas)',
          '3. Cookie no se envía (problema CORS o cross-origin)',
          '4. Path de cookie incorrecto (debe ser path=/)',
          '5. En producción: Domain no coincide con el dominio actual'
        ]
      });
      return { success: false, error: 'No autenticado' };
    }

    // Verify the JWT token
    const jwtSecret = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
    let decoded;
    try {
      decoded = jwt.verify(token, jwtSecret) as any;
    } catch (jwtError) {
      // ❌ CASE 2 & 3: Token JWT inválido o expirado - diferencia entre tipos de error
      if (jwtError instanceof jwt.TokenExpiredError) {
        console.warn(`⚠️ [${requestId}] ❌ TOKEN EXPIRADO`, {
          endpoint,
          method,
          expiradoEn: new Date(jwtError.expiredAt).toISOString(),
          ahora: new Date().toISOString(),
          userId: (jwtError as any).decoded?.id || 'desconocido',
          timestamp: new Date().toISOString(),
          accion: '🔄 El usuario debe volver a iniciar sesión en /admin/login',
          solucion: 'El token JWT tiene maxAge de 24 horas. Necesita re-login.'
        });
      } else if (jwtError instanceof jwt.JsonWebTokenError) {
        console.error(`❌ [${requestId}] ❌ TOKEN JWT INVÁLIDO (firma/formato)`, {
          endpoint,
          method,
          error: jwtError.message,
          tokenLength: token.length,
          timestamp: new Date().toISOString(),
          causasPosibles: [
            '1. JWT_SECRET no coincide entre login y verificación',
            '2. Verificar .env.local tiene JWT_SECRET configurado',
            '3. Token está corrupto o malformado',
            '4. Token fue modificado después de su creación',
            '5. En producción: JWT_SECRET no está configurado en variables de entorno'
          ],
          verificacion: 'Asegúrate que el token fue creado con jwt.sign() y mismo JWT_SECRET'
        });
      } else {
        console.error(`❌ [${requestId}] ❌ ERROR DESCONOCIDO VERIFICANDO JWT`, {
          endpoint,
          method,
          error: jwtError instanceof Error ? jwtError.message : String(jwtError),
          errorType: jwtError?.constructor?.name,
          timestamp: new Date().toISOString()
        });
      }
      return { success: false, error: 'Token inválido' };
    }

    // ❌ CASE 4: Claims incorrectos - el token es válido pero no es de admin
    if (decoded.type !== 'admin') {
      console.warn(`⚠️ [${requestId}] ❌ TOKEN VÁLIDO PERO SIN CLAIMS DE ADMIN`, {
        endpoint,
        method,
        userId: decoded.id || 'desconocido',
        email: decoded.email || 'desconocido',
        claimType: decoded.type || 'FALTA CLAIM',
        claimsPresentes: Object.keys(decoded)
          .filter(k => !['iat', 'exp'].includes(k))
          .reduce((acc, k) => ({ ...acc, [k]: decoded[k] }), {}),
        timestamp: new Date().toISOString(),
        claimEsperado: 'type: "admin"',
        solucion: 'El endpoint /api/auth/admin/login debe crear JWT con claim type="admin". Verificar app/api/auth/admin/login/route.ts línea 43'
      });
      return { success: false, error: 'Token no válido para administrador' };
    }

    // ✅ Autenticación exitosa
    console.log(`✅ [${requestId}] ✅ AUTENTICACIÓN EXITOSA`, {
      endpoint,
      method,
      userId: decoded.id,
      email: decoded.email,
      role: decoded.role,
      expiresAt: new Date(decoded.exp * 1000).toISOString(),
      issueAt: new Date(decoded.iat * 1000).toISOString(),
      timestamp: new Date().toISOString()
    });

    return { success: true, adminId: decoded.id };

  } catch (error) {
    // Catch-all for unexpected errors
    console.error(`❌ [${requestId}] ❌ ERROR INESPERADO EN AUTENTICACIÓN`, {
      endpoint,
      method,
      error: error instanceof Error ? error.message : String(error),
      errorType: error?.constructor?.name,
      stack: error instanceof Error ? error.stack?.split('\n').slice(0, 3).join('\n') : undefined,
      timestamp: new Date().toISOString()
    });
    return { success: false, error: 'Error de autenticación' };
  }
}

// GET - List products with filtering
export async function GET(request: NextRequest) {
  try {
    // Check if request is from same origin (integrated dashboard) or has valid auth
    const origin = request.headers.get('origin');
    const referer = request.headers.get('referer');
    const isSameOrigin = !origin || origin.includes('tus-aguacates') || referer?.includes('/admin');

    // Only verify auth for cross-origin requests
    if (!isSameOrigin) {
      const auth = await verifyAdminAuth(request);
      if (!auth.success) {
        return NextResponse.json(
          { error: auth.error },
          { status: 401, headers: corsHeaders }
        );
      }
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
          is_active,
          sort_order
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
    const auth = await verifyAdminAuth(request);
    if (!auth.success) {
      return NextResponse.json(
        { error: auth.error },
        { status: 401, headers: corsHeaders }
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
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim('-');

    // Generate SKU if not provided
    const sku = body.sku || `PRD-${Date.now().toString(36).toUpperCase()}`;

    const supabase = getSupabaseClient();

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