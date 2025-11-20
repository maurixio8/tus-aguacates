import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { createSupabaseClient, verifyAdminUser } from '@/lib/auth-admin';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Get the admin-token cookie from the request
    const token = request.cookies.get('admin-token')?.value;

    if (!token) {
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
    } catch (jwtError) {
      return NextResponse.json(
        { error: 'Token inválido o expirado' },
        { status: 401 }
      );
    }

    // Check if this is an admin token
    if (decoded.type !== 'admin') {
      return NextResponse.json(
        { error: 'Token no válido para administrador' },
        { status: 401 }
      );
    }

    // OPTIMIZACIÓN: Quick path for known admin ID
    if (decoded.id === 'admin-001') {
      const tempAdmin = {
        id: 'admin-001',
        email: 'admin@tusaguacates.com',
        name: 'Administrador Temporal',
        role: 'super_admin',
        last_login: null
      };

      return NextResponse.json({
        success: true,
        user: tempAdmin
      });
    }

    // VERIFICAR CON SUPABASE (con timeout)
    const supabase = createSupabaseClient();

    try {
      const adminResult = await Promise.race([
        verifyAdminUser(supabase, decoded.id),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Database timeout')), 3000)
        )
      ]);

      if (adminResult.success && adminResult.user) {
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

      return NextResponse.json(
        { error: adminResult.error || 'Admin no encontrado' },
        { status: 401 }
      );

    } catch (dbError) {
      console.log('⚠️ Database timeout or error, using fallback');
      return NextResponse.json(
        { error: 'Error de conexión a la base de datos' },
        { status: 401 }
      );
    }

  } catch (error) {
    console.error('❌ Error en Me API:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}