import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

// Configuración CORS para permitir el dashboard
const getAllowedOrigin = (request: NextRequest) => {
  const origin = request.headers.get('origin');
  const allowedOrigins = [
    'https://admin-dashboard-bvk52p4zx-mauricio-s-projects-2bf4b7a2.vercel.app',
    'https://admin-dashboard-m9p6qyz27-mauricio-s-projects-2bf4b7a2.vercel.app',
    'http://localhost:5173',
    'http://localhost:5174',
    'http://127.0.0.1:5173',
  ];

  if (origin && allowedOrigins.includes(origin)) {
    return origin;
  }
  return allowedOrigins[0]; // Default to production
};

const getCorsHeaders = (request: NextRequest) => ({
  'Access-Control-Allow-Origin': getAllowedOrigin(request),
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, Cookie, Set-Cookie',
  'Access-Control-Allow-Credentials': 'true',
  'Access-Control-Max-Age': '86400',
});

// Manejar solicitudes OPTIONS para CORS
export async function OPTIONS(request: NextRequest) {
  console.log('🔍 [Admin-Auth API] OPTIONS request received from:', request.headers.get('origin'));

  const headers = getCorsHeaders(request);
  console.log('✅ [Admin-Auth API] Sending CORS headers:', headers);

  return new NextResponse(null, {
    status: 200,
    headers: {
      ...headers,
      'Content-Length': '0'
    }
  });
}

export async function POST(request: NextRequest) {
  try {
    console.log('🔑 [Admin-Auth API] Recibida petición de login');

    // Leer el cuerpo de la solicitud como texto primero
    const text = await request.text();
    console.log('🔑 [Admin-Auth API] Body recibido como texto:', text);
    
    let body;
    try {
      body = JSON.parse(text);
    } catch (parseError) {
      console.error('❌ [Admin-Auth API] Error al parsear JSON:', parseError);
      console.error('❌ [Admin-Auth API] Texto recibido:', text);
      return NextResponse.json(
        { error: 'Formato JSON inválido' },
        { status: 400, headers: getCorsHeaders(request) }
      );
    }
    
    const { email, password } = body;

    console.log('🔑 [Admin-Auth API] Intento de login:', {
      email,
      password: password ? '***' : 'vacía',
      timestamp: new Date().toISOString()
    });

    // VALIDACIÓN SIMPLE
    if (!email || !password) {
      console.warn('⚠️  [Admin-Auth API] Faltan email o password en request');
      return NextResponse.json(
        { error: 'Email y contraseña son requeridos' },
        { status: 400, headers: getCorsHeaders(request) }
      );
    }

    // VALIDACIÓN CON CREDENCIALES REALES
    if (email === 'admin@tusaguacates.com' && password === '7FdX9Zq-hson&j39') {
      console.log('✅ [Admin-Auth API] Credenciales válidas - Admin verificado');

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

      console.log('🔐 [Admin-Auth API] JWT creado exitosamente:', {
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
      }, { headers: getCorsHeaders(request) });

      // ✅ CONFIGURAR COOKIE CON FLAGS CORRECTOS
      const isProduction = process.env.NODE_ENV === 'production';
      const domain = isProduction
        ? 'tus-aguacates-57vp.vercel.app'
        : undefined; // localhost no necesita domain

      response.cookies.set('admin-token', token, {
        httpOnly: true, // No accesible desde JavaScript (seguridad XSS)
        secure: isProduction, // HTTPS only en producción
        sameSite: 'lax', // Previene CSRF - 'lax' permite navegación top-level
        maxAge: 86400, // 24 horas en segundos
        path: '/', // ✅ Cookie disponible en toda la app
        domain: domain // ✅ Especificar dominio en producción
      });

      console.log('🍪 [Admin-Auth API] Cookie establecida:', {
        secure: isProduction,
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        domain: domain || 'localhost (sin domain)',
        maxAge: '24 horas',
        tokenLength: token.length
      });

      console.log('✅ [Admin-Auth API] Login exitoso - Usuario:', {
        id: adminUser.id,
        email: adminUser.email,
        role: adminUser.role
      });

      return response;
    }

    // ❌ Credenciales incorrectas
    console.warn('⚠️  [Admin-Auth API] Credenciales incorrectas:', {
      email,
      timestamp: new Date().toISOString()
    });

    return NextResponse.json(
      { error: 'Credenciales inválidas' },
      { status: 401, headers: getCorsHeaders(request) }
    );

  } catch (error) {
    console.error('❌ [Admin-Auth API] Error en login:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    });

    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500, headers: getCorsHeaders(request) }
    );
  }
}