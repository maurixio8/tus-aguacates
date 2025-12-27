import { NextRequest, NextResponse } from 'next/server';
import { uploadRecipeCategoryImage, replaceRecipeCategoryImage } from '@/lib/recipe-image-upload-service';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const categorySlug = formData.get('categorySlug') as string;
    const oldStoragePath = formData.get('oldStoragePath') as string | undefined;

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

    const result = oldStoragePath
      ? await replaceRecipeCategoryImage(file, categorySlug, oldStoragePath)
      : await uploadRecipeCategoryImage(file, categorySlug);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error, success: false },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      publicUrl: result.publicUrl,
      storagePath: result.storagePath,
      message: result.message
    });
  } catch (error) {
    console.error('Error en upload de imagen de categoría de receta:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor', success: false },
      { status: 500 }
    );
  }
}
