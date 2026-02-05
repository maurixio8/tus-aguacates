import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Create Supabase client directly to avoid import issues
function getSupabaseClient() {
  const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').replace(/\\n/g, '').replace(/\\r/g, '').trim();
  // Usar SUPABASE_SERVICE_ROLE_KEY si existe, si no usar ANON_KEY
  const rawKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
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
    const secret = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
    const jwtSecret = secret.replace(/\\n/g, '').replace(/\\r/g, '').trim();
    if (!jwtSecret) {
      console.error('❌ [SECURITY] JWT_SECRET not configured in environment variables');
      return { success: false, error: 'Error de configuración del servidor' };
    }

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

// PATCH - Update existing product
export async function PATCH(request: NextRequest) {
  try {
    // Verify admin authentication
    const auth = await verifyAdminAuth(request);
    if (!auth.success) {
      return NextResponse.json(
        { error: auth.error },
        { status: 401, headers: corsHeaders }
      );
    }

    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('id');

    if (!productId) {
      return NextResponse.json(
        { error: 'ID del producto requerido' },
        { status: 400, headers: corsHeaders }
      );
    }

    const body = await request.json();
    console.log('📝 API: Updating product:', { productId, body });

    // Validate that we're not trying to update the ID
    if (body.id && body.id !== productId) {
      return NextResponse.json(
        { error: 'No se puede cambiar el ID del producto' },
        { status: 400, headers: corsHeaders }
      );
    }

    const supabase = getSupabaseClient();

    // Prepare update payload (exclude ID and auth fields)
    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    // Only include fields that are actually provided
    if (body.name !== undefined) updateData.name = body.name;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.price !== undefined) updateData.price = body.price;
    if (body.discount_price !== undefined) updateData.discount_price = body.discount_price;
    if (body.stock !== undefined) updateData.stock = body.stock;
    if (body.is_active !== undefined) updateData.is_active = body.is_active;
    if (body.is_featured !== undefined) updateData.is_featured = body.is_featured;
    if (body.main_image_url !== undefined) updateData.main_image_url = body.main_image_url;
    if (body.category_id !== undefined) updateData.category_id = body.category_id;
    if (body.available_for !== undefined) updateData.available_for = body.available_for;
    if (body.unit !== undefined) updateData.unit = body.unit;
    if (body.weight !== undefined) updateData.weight = body.weight;
    if (body.min_quantity !== undefined) updateData.min_quantity = body.min_quantity;
    if (body.is_organic !== undefined) updateData.is_organic = body.is_organic;

    console.log('💾 API: Update payload:', updateData);

    // Update the product
    const { data, error } = await supabase
      .from('products')
      .update(updateData)
      .eq('id', productId)
      .select()
      .single();

    console.log('💾 API: Update response:', { data, error });

    if (error) {
      console.error('❌ API: Error updating product:', error);

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
          { error: 'Ya existe otro producto con ese SKU o slug' },
          { status: 409, headers: corsHeaders }
        );
      }

      if (error.code === '23503') {
        return NextResponse.json(
          { error: 'La categoría especificada no existe' },
          { status: 400, headers: corsHeaders }
        );
      }

      // Return more detailed error information for debugging
      return NextResponse.json(
        {
          error: 'Error al actualizar el producto',
          details: error.message,
          code: error.code,
          hint: error.hint,
          details_full: JSON.stringify(error)
        },
        { status: 500, headers: corsHeaders }
      );
    }

    console.log('✅ API: Product updated successfully:', data);

    return NextResponse.json({
      success: true,
      data,
      message: 'Producto actualizado exitosamente'
    }, { headers: corsHeaders });

  } catch (error) {
    console.error('❌ API: Unexpected error updating product:', error);
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

// DELETE - Delete a product
export async function DELETE(request: NextRequest) {
  try {
    // Verify admin authentication
    const auth = await verifyAdminAuth(request);
    if (!auth.success) {
      return NextResponse.json(
        { error: auth.error },
        { status: 401, headers: corsHeaders }
      );
    }

    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('id');

    if (!productId) {
      return NextResponse.json(
        { error: 'ID del producto requerido' },
        { status: 400, headers: corsHeaders }
      );
    }

    console.log('🗑️ API: Deleting product:', productId);

    const supabase = getSupabaseClient();

    // Delete the product (with CASCADE will handle related records)
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', productId);

    if (error) {
      console.error('❌ API: Error deleting product:', error);

      // Handle specific database errors
      if (error.code === '23503') {
        return NextResponse.json(
          { error: 'No se puede eliminar este producto porque tiene registros relacionados' },
          { status: 400, headers: corsHeaders }
        );
      }

      // Return more detailed error information for debugging
      return NextResponse.json(
        {
          error: 'Error al eliminar el producto',
          details: error.message,
          code: error.code,
          hint: error.hint,
          details_full: JSON.stringify(error)
        },
        { status: 500, headers: corsHeaders }
      );
    }

    console.log('✅ API: Product deleted successfully:', productId);

    return NextResponse.json({
      success: true,
      message: 'Producto eliminado exitosamente'
    }, { headers: corsHeaders });

  } catch (error) {
    console.error('❌ API: Unexpected error deleting product:', error);
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
