import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { createSupabaseClient, verifyAdminUser } from '@/lib/auth-admin';

export const dynamic = 'force-dynamic';

// Configuración CORS dinámica para permitir el dashboard
function getCorsHeaders(request: NextRequest) {
  const origin = request.headers.get('origin') || '';
  const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:3001',
    'https://tus-aguacates-57vp.vercel.app',
    'https://admin-dashboard-m9p6qyz27-mauricio-s-projects-2bf4b7a2.vercel.app',
    'https://admin-dashboard-seven-zeta-68.vercel.app',
    'https://admin-dashboard-kj6u60d3m-mauricio-s-projects-2bf4b7a2.vercel.app',
  ];

  // Allow any vercel.app subdomain or localhost
  const isAllowed = allowedOrigins.includes(origin) ||
                   origin.includes('.vercel.app') ||
                   origin.includes('localhost');

  return {
    'Access-Control-Allow-Origin': isAllowed ? origin : allowedOrigins[2],
    'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, Cookie, Set-Cookie',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Max-Age': '86400',
  };
}

// Manejar solicitudes OPTIONS para CORS
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      ...getCorsHeaders(request),
      'Content-Length': '0'
    }
  });
}

export async function GET(request: NextRequest) {
  try {
    // Get the admin-token cookie from the request
    const token = request.cookies.get('admin-token')?.value;

    if (!token) {
      console.log('⚠️ [Me API] No token found in cookies');
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401, headers: getCorsHeaders(request) }
      );
    }

    // VERIFY JWT TOKEN (MISMO CÓDIGO QUE EN LOGIN)
    const jwtSecret = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
    let decoded;
    try {
      decoded = jwt.verify(token, jwtSecret) as any;
      console.log('✅ [Me API] Token verified successfully:', { userId: decoded.id });
    } catch (jwtError) {
      console.log('❌ [Me API] Token verification failed:', jwtError);
      return NextResponse.json(
        { error: 'Token inválido o expirado' },
        { status: 401, headers: getCorsHeaders(request) }
      );
    }

    // Check if this is an admin token
    if (decoded.type !== 'admin') {
      console.log('⚠️ [Me API] Token is not admin type:', decoded.type);
      return NextResponse.json(
        { error: 'Token no válido para administrador' },
        { status: 401, headers: getCorsHeaders(request) }
      );
    }

    // OPTIMIZACIÓN: Quick path for known admin ID
    if (decoded.id === 'admin-001') {
      console.log('✅ [Me API] Using quick path for admin-001');
      const tempAdmin = {
        id: 'admin-001',
        email: 'admin@tusaguacates.com',
        name: 'Administrador Temporal',
        role: 'super_admin',
        last_login: null
      };

      return NextResponse.json({
        success: true,
        user: tempAdmin
      }, { headers: getCorsHeaders(request) });
    }

    // VERIFICAR CON SUPABASE (con timeout)
    const supabase = createSupabaseClient();

    try {
      const adminResult = await Promise.race([
        verifyAdminUser(supabase, decoded.id),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Database timeout')), 3000)
        )
      ]);

      if (adminResult.success && adminResult.user) {
        const adminUser = {
          id: adminResult.user.id,
          email: adminResult.user.email,
          name: adminResult.user.name,
          role: adminResult.user.role,
          last_login: adminResult.user.last_login
        };

        return NextResponse.json({
          success: true,
          user: adminUser
        }, { headers: getCorsHeaders(request) });
      }

      return NextResponse.json(
        { error: adminResult.error || 'Admin no encontrado' },
        { status: 401, headers: getCorsHeaders(request) }
      );

    } catch (dbError) {
      console.log('⚠️ Database timeout or error, using fallback');
      return NextResponse.json(
        { error: 'Error de conexión a la base de datos' },
        { status: 401, headers: getCorsHeaders(request) }
      );
    }

  } catch (error) {
    console.error('❌ Error en Me API:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500, headers: getCorsHeaders(request) }
    );
  }
}