import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 [Me API] Verificando admin user');

    // Get the admin-token cookie from the request
    const token = request.cookies.get('admin-token')?.value;

    console.log('🔍 [Me API] Token recibido:', token ? 'present' : 'missing');

    if (!token) {
      console.log('❌ [Me API] No hay token de autenticación');
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    // ✅ VERIFICAR JWT CON EL MISMO SECRETO QUE LOGIN
    const jwtSecret = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

    try {
      const decoded = jwt.verify(token, jwtSecret) as {
        id: string;
        email: string;
        type: string;
        role: string;
        iat: number;
        exp: number;
      };

      console.log('✅ [Me API] JWT válido - Token decodificado:', {
        userId: decoded.id,
        email: decoded.email,
        type: decoded.type,
        role: decoded.role
      });

      // Verificar que es un token de admin
      if (decoded.type !== 'admin') {
        console.log('❌ [Me API] Token no es de tipo admin');
        return NextResponse.json(
          { error: 'Token inválido' },
          { status: 401 }
        );
      }

      const adminUser = {
        id: decoded.id,
        email: decoded.email,
        name: 'Administrador',
        role: decoded.role,
        last_login: new Date().toISOString()
      };

      console.log('✅ [Me API] Usuario autenticado:', adminUser);

      return NextResponse.json({
        success: true,
        user: adminUser
      });

    } catch (jwtError) {
      console.log('❌ [Me API] Error verificando JWT:', {
        error: jwtError instanceof Error ? jwtError.message : String(jwtError)
      });
      return NextResponse.json(
        { error: 'Token inválido o expirado' },
        { status: 401 }
      );
    }

  } catch (error) {
    console.error('❌ [Me API] Error en Me API:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}