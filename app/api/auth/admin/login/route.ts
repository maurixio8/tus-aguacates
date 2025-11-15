import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    console.log('🔑 Login API: Recibida petición');

    const body = await request.json();
    const { email, password } = body;

    console.log('🔑 Login attempt:', { email, password: password ? '***' : 'empty' });

    // VALIDACIÓN SIMPLE
    if (!email || !password) {
      console.log('❌ Faltan email o password');
      return NextResponse.json(
        { error: 'Email y contraseña son requeridos' },
        { status: 400 }
      );
    }

    // VALIDACIÓN TEMPORAL HARDCODEADA
    if (email === 'admin@tusaguacates.com' && password === 'admin123') {
      // ✅ Login exitoso
      console.log('✅ Login exitoso - Admin verificado');

      const adminUser = {
        id: 'admin-001',
        email: 'admin@tusaguacates.com',
        name: 'Administrador',
        role: 'super_admin'
      };

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

      // Establecer cookie de sesión simple
      response.cookies.set('admin-token', 'temp-admin-token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 86400 // 24 horas
      });

      console.log('✅ Respuesta de login creada exitosamente');
      return response;
    }

    // ❌ Credenciales incorrectas
    console.log('❌ Credenciales incorrectas');
    return NextResponse.json(
      { error: 'Credenciales inválidas' },
      { status: 401 }
    );

  } catch (error) {
    console.error('❌ Error en login API:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}