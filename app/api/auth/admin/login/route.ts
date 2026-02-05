import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

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
  // Forzar respuesta directa sin redirect
  return new NextResponse(null, {
    status: 200,
    headers: {
      ...corsHeaders,
      'Content-Length': '0'
    }
  });
}

export async function POST(request: NextRequest) {
  try {
    console.log('🔑 [Login API] Recibida petición de login');

    const body = await request.json();
    const { email, password } = body;

    console.log('🔑 [Login API] Intento de login:', {
      email,
      password: password ? '***' : 'vacía',
      timestamp: new Date().toISOString()
    });

    // VALIDACIÓN SIMPLE
    if (!email || !password) {
      console.warn('⚠️  [Login API] Faltan email o password en request');
      return NextResponse.json(
        { error: 'Email y contraseña son requeridos' },
        { status: 400, headers: corsHeaders }
      );
    }

    // VALIDACIÓN CON CREDENCIALES REALES (acepta ambas contraseñas)
    if (email === 'admin@tusaguacates.com' && (password === '7FdX9Zq-hson&j39' || password === 'admin123')) {
      console.log('✅ [Login API] Credenciales válidas - Admin verificado');

      const adminUser = {
        id: 'admin-001',
        email: 'admin@tusaguacates.com',
        name: 'Administrador',
        role: 'super_admin'
      };

      // ✅ CREAR JWT CON CLAIMS CORRECTOS
      const jwtSecret = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
      const token = jwt.sign(
        {
          id: adminUser.id,
          email: adminUser.email,
          type: 'admin', // ✅ Claim requerido por verifyAdminAuth
          role: adminUser.role,
          iat: Math.floor(Date.now() / 1000), // issued at
          exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // expira en 24 horas
        },
        jwtSecret
      );

      console.log('🔐 [Login API] JWT creado exitosamente:', {
        userId: adminUser.id,
        expiresIn: '24 horas',
        claims: {
          id: adminUser.id,
          type: 'admin',
          role: adminUser.role
        }
      });

      // Crear respuesta con éxito
      const response = NextResponse.json({
        success: true,
        user: {
          id: adminUser.id,
          email: adminUser.email,
          name: adminUser.name,
          role: adminUser.role,
          last_login: new Date().toISOString()
        }
      }, { headers: corsHeaders });

      // ✅ CONFIGURAR COOKIE CON FLAGS CORRECTOS
      const requestUrl = new URL(request.url);
      const isProduction = process.env.NODE_ENV === 'production';

      // Determinar dominio dinámicamente
      let domain: string | undefined = undefined;
      if (isProduction) {
        // Para Vercel, usar el dominio completo
        // Usamos requestUrl.hostname para asegurar que coincide con el dominio de la petición
        domain = requestUrl.hostname;
      }

      console.log('🍪 [Login API] Cookie config:', {
        isProduction,
        hostname: requestUrl.hostname,
        pathname: requestUrl.pathname,
        domain: domain || 'undefined (localhost)',
        origin: requestUrl.origin,
        secure: isProduction,
        httpOnly: true,
        sameSite: 'strict',
        path: '/'
      });

      // Establecer la cookie con la configuración correcta
      response.cookies.set('admin-token', token, {
        httpOnly: true,
        secure: isProduction,
        sameSite: 'strict',
        maxAge: 86400,
        path: '/',
        domain: domain
      });

      console.log('✅ [Login API] Login exitoso - Usuario:', {
        id: adminUser.id,
        email: adminUser.email,
        role: adminUser.role
      });

      return response;
    }

    // ❌ Credenciales incorrectas
    console.warn('⚠️  [Login API] Credenciales incorrectas:', {
      email,
      timestamp: new Date().toISOString()
    });

    return NextResponse.json(
      { error: 'Credenciales inválidas' },
      { status: 401, headers: corsHeaders }
    );

  } catch (error) {
    console.error('❌ [Login API] Error en login:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    });

    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500, headers: corsHeaders }
    );
  }
}
