import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Me API: Verificando admin user');

    // Get the admin-token cookie from the request
    const token = request.cookies.get('admin-token')?.value;

    console.log('🔍 Token recibido:', token ? 'present' : 'missing');

    if (!token) {
      console.log('❌ No hay token de autenticación');
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    // VERIFICACIÓN SIMPLE TEMPORAL
    if (token === 'temp-admin-token') {
      console.log('✅ Token válido - Admin temporal');

      const adminUser = {
        id: 'admin-001',
        email: 'admin@tusaguacates.com',
        name: 'Administrador',
        role: 'super_admin',
        last_login: new Date().toISOString()
      };

      return NextResponse.json({
        success: true,
        user: adminUser
      });
    }

    console.log('❌ Token inválido');
    return NextResponse.json(
      { error: 'Token inválido' },
      { status: 401 }
    );

  } catch (error) {
    console.error('❌ Error en Me API:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}