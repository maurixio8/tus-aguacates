import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAdminUser, logAdminActivity, createSupabaseClient } from '@/lib/auth-admin';

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
        request.ip || 'unknown',
        request.headers.get('user-agent') || 'unknown'
      );
    }

    // Crear respuesta y eliminar cookies
    const response = NextResponse.json({
      success: true,
      message: 'Sesión cerrada exitosamente'
    });

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
      { status: 500 }
    );
  }
}