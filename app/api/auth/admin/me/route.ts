import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

export const dynamic = 'force-dynamic';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return new NextResponse(null, { headers: corsHeaders });
}

export async function GET(request: NextRequest) {
  try {
    // Get the admin-token cookie from the request
    const token = request.cookies.get('admin-token')?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401, headers: corsHeaders }
      );
    }

    // VERIFY JWT TOKEN
    const jwtSecret = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
    let decoded;
    try {
      decoded = jwt.verify(token, jwtSecret) as any;
    } catch (jwtError) {
      console.log('❌ JWT verification failed:', jwtError);
      return NextResponse.json(
        { error: 'Token inválido o expirado' },
        { status: 401, headers: corsHeaders }
      );
    }

    // Check if this is an admin token
    if (decoded.type !== 'admin') {
      return NextResponse.json(
        { error: 'Token no válido para administrador' },
        { status: 401, headers: corsHeaders }
      );
    }

    // Return admin user data from token (no DB needed for admin-001)
    const adminUser = {
      id: decoded.id,
      email: decoded.email,
      name: 'Administrador',
      role: decoded.role || 'super_admin',
      last_login: null
    };

    console.log('✅ Admin verified:', adminUser.email);

    return NextResponse.json({
      success: true,
      user: adminUser
    }, { headers: corsHeaders });

  } catch (error) {
    console.error('❌ Error en Me API:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500, headers: corsHeaders }
    );
  }
}