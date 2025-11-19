import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { createSupabaseClient, authenticateAdmin } from '@/lib/auth-admin';

export const dynamic = 'force-dynamic';

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

    // AUTENTICACIÓN CON SUPABASE (con fallback hardcodeado)
    const supabase = createSupabaseClient();
    const authResult = await authenticateAdmin(supabase, email, password);

    if (authResult.success && authResult.user) {
      console.log('✅ Login exitoso - Admin verificado:', authResult.user.email);

      // Crear token JWT
      const tokenPayload = {
        id: authResult.user.id,
        email: authResult.user.email,
        name: authResult.user.name,
        role: authResult.user.role,
        type: 'admin',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 horas
      };

      const jwtSecret = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
      const token = jwt.sign(tokenPayload, jwtSecret);

      // Crear respuesta con éxito
      const response = NextResponse.json({
        success: true,
        user: {
          id: authResult.user.id,
          email: authResult.user.email,
          name: authResult.user.name,
          role: authResult.user.role,
          last_login: new Date().toISOString()
        }
      });

      // Establecer cookie de sesión con JWT
      response.cookies.set('admin-token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 86400 // 24 horas
      });

      console.log('✅ Respuesta de login creada exitosamente');
      return response;
    }

    // ❌ Credenciales incorrectas
    console.log('❌ Credenciales incorrectas:', authResult.error);
    return NextResponse.json(
      { error: authResult.error || 'Credenciales inválidas' },
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