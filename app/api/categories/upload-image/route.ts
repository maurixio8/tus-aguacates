import { NextRequest, NextResponse } from 'next/server';
import { uploadCategoryImage, replaceCategoryImage } from '@/lib/image-upload-service';

export const dynamic = 'force-dynamic';

// POST - Upload category image
export async function POST(request: NextRequest) {
  console.log('🔄 [API Category Image] POST request received');

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
