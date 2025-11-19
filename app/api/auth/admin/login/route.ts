import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

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
        { status: 400 }
      );
    }

    // VALIDACIÓN TEMPORAL HARDCODEADA
    if (email === 'admin@tusaguacates.com' && password === 'admin123') {
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
      });

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

      console.log('🍪 [Login API] Cookie establecida:', {
        secure: isProduction,
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        domain: domain || 'localhost (sin domain)',
        maxAge: '24 horas',
        tokenLength: token.length
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
      { status: 401 }
    );

  } catch (error) {
    console.error('❌ [Login API] Error en login:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    });

    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}