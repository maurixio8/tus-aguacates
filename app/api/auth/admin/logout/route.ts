import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAdminUser, logAdminActivity, createSupabaseClient } from '@/lib/auth-admin';

// Configuración CORS dinámica para permitir el dashboard
function getCorsHeaders(request: NextRequest) {
  const origin = request.headers.get('origin') || '';
  const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:3001',
    'https://tus-aguacates-57vp.vercel.app',
    'https://admin-dashboard-m9p6qyz27-mauricio-s-projects-2bf4b7a2.vercel.app',
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

export async function POST(request: NextRequest) {
  try {
    // Obtener usuario actual usando el sistema de JWT
    const adminUser = await getCurrentAdminUser();

    if (adminUser) {
      // Registrar actividad de logout
      const supabase = createSupabaseClient();
      await logAdminActivity(
        supabase,
        adminUser.id,
        'logout',
        undefined,
        undefined,
        undefined,
        {
          logout_time: new Date().toISOString(),
          email: adminUser.email
        },
        request.headers.get('x-forwarded-for')?.split(',')?.[0]?.trim() || request.headers.get('x-real-ip') || 'unknown',
        request.headers.get('user-agent') || 'unknown'
      );
    }

    // Crear respuesta y eliminar cookies
    const response = NextResponse.json({
      success: true,
      message: 'Sesión cerrada exitosamente'
    }, { headers: getCorsHeaders(request) });

    // Eliminar cookie de admin-token
    response.cookies.set('admin-token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0 // Expirar inmediatamente
    });

    return response;

  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500, headers: getCorsHeaders(request) }
    );
  }
}