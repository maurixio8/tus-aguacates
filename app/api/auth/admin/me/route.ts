import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { createSupabaseClient, verifyAdminUser } from '@/lib/auth-admin';

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

    // VERIFY JWT TOKEN (MISMO CÓDIGO QUE EN LOGIN)
    const jwtSecret = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
    let decoded;
    try {
      decoded = jwt.verify(token, jwtSecret) as any;
      console.log('🔍 Token decodificado:', { id: decoded.id, email: decoded.email, role: decoded.role, type: decoded.type });
    } catch (jwtError) {
      console.error('❌ JWT verification error:', jwtError);
      return NextResponse.json(
        { error: 'Token inválido o expirado' },
        { status: 401 }
      );
    }

    // Check if this is an admin token
    if (decoded.type !== 'admin') {
      console.log('❌ Token no es de tipo admin');
      return NextResponse.json(
        { error: 'Token no válido para administrador' },
        { status: 401 }
      );
    }

    // VERIFICAR CON SUPABASE (con fallback para admin temporal)
    const supabase = createSupabaseClient();
    const adminResult = await verifyAdminUser(supabase, decoded.id);

    if (adminResult.success && adminResult.user) {
      console.log('✅ Admin verificado:', adminResult.user.email);

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
      });
    }

    console.log('❌ Admin no encontrado o inactivo:', adminResult.error);
    return NextResponse.json(
      { error: adminResult.error || 'Admin no encontrado' },
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