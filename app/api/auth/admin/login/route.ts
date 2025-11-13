import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import {
  createSupabaseClient,
  authenticateAdmin,
  updateLastLogin,
  logAdminActivity
} from '@/lib/auth-admin';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email y contraseña son requeridos' },
        { status: 400 }
      );
    }

    // Crear cliente Supabase con SERVICE_ROLE_KEY para operaciones de admin
    const supabase = createSupabaseClient();

    // Autenticar administrador usando la función centralizada
    const authResult = await authenticateAdmin(supabase, email, password);

    if (!authResult.success) {
      console.error('Admin authentication failed:', authResult.error);
      return NextResponse.json(
        { error: authResult.error },
        { status: 401 }
      );
    }

    const adminUser = authResult.user!;

    // Actualizar último login del admin usando la función centralizada
    await updateLastLogin(supabase, adminUser.id);

    // Registrar actividad de login usando la función centralizada
    await logAdminActivity(
      supabase,
      adminUser.id,
      'login',
      undefined,
      undefined,
      undefined,
      {
        login_time: new Date().toISOString(),
        email: adminUser.email
      },
      request.headers.get('x-forwarded-for')?.split(',')?.[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      'unknown',
      request.headers.get('user-agent') || 'unknown'
    );

    // Crear token JWT para admin
    const jwtSecret = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
    const token = jwt.sign(
      {
        id: adminUser.id,
        email: adminUser.email,
        role: adminUser.role,
        type: 'admin'
      },
      jwtSecret,
      { expiresIn: '24h' }
    );

    // Crear respuesta con cookies de sesión
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

    // Establecer cookie con token JWT
    response.cookies.set('admin-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 86400 // 24 horas
    });

    return response;

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}