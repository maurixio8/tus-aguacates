import { NextRequest, NextResponse } from 'next/server';
import { uploadCategoryImage, replaceCategoryImage } from '@/lib/image-upload-service';
import jwt from 'jsonwebtoken';

export const dynamic = 'force-dynamic';

// Verify admin authentication
async function verifyAdminAuth(request: NextRequest): Promise<{ success: boolean; adminId?: string; error?: string }> {
  try {
    const token = request.cookies.get('admin-token')?.value;

    if (!token) {
      return { success: false, error: 'No autenticado' };
    }

    const jwtSecret = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
    const decoded = jwt.verify(token, jwtSecret) as any;

    if (decoded.type !== 'admin') {
      return { success: false, error: 'Token inválido' };
    }

    return { success: true, adminId: decoded.id };
  } catch (error) {
    return { success: false, error: 'Token expirado o inválido' };
  }
}

// POST - Upload category image
export async function POST(request: NextRequest) {
  console.log('🔄 [API Category Image] POST request received');

  // Verificar autenticación
  const auth = await verifyAdminAuth(request);
  if (!auth.success) {
    console.log('❌ [API Category Image] Auth failed:', auth.error);
    return NextResponse.json(
      { error: auth.error, success: false },
      { status: 401 }
    );
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const categorySlug = formData.get('categorySlug') as string;
    const oldStoragePath = formData.get('oldStoragePath') as string | undefined;

    // Validar campos requeridos
    if (!file) {
      return NextResponse.json(
        { error: 'Archivo de imagen requerido', success: false },
        { status: 400 }
      );
    }

    if (!categorySlug) {
      return NextResponse.json(
        { error: 'Slug de categoría requerido', success: false },
        { status: 400 }
      );
    }

    console.log('📤 [API Category Image] Uploading image for category:', categorySlug);

    // Si hay una imagen anterior, reemplazarla; si no, subir nueva
    const result = oldStoragePath
      ? await replaceCategoryImage(file, categorySlug, oldStoragePath)
      : await uploadCategoryImage(file, categorySlug);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error, success: false },
        { status: 500 }
      );
    }

    console.log('✅ [API Category Image] Image uploaded successfully');
    return NextResponse.json({
      success: true,
      publicUrl: result.publicUrl,
      storagePath: result.storagePath,
      message: result.message
    });

  } catch (error) {
    console.error('❌ API: Unexpected error:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor', success: false },
      { status: 500 }
    );
  }
}
