import { NextRequest, NextResponse } from 'next/server';
import { requireAdminRole } from '@/lib/auth-admin';

export async function POST(request: NextRequest) {
  try {
    const adminAccess = await requireAdminRole(request, 'admin');
    if (adminAccess.response) {
      return adminAccess.response;
    }

    console.log('🚀 API: Iniciando conversión de imagen');

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      console.error('❌ API: No se proporcionó archivo');
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    console.log('📁 API: Archivo recibido:', {
      name: file.name,
      size: file.size,
      type: file.type
    });

    // Validaciones
    if (!file.type.startsWith('image/')) {
      console.error('❌ API: Archivo no es una imagen:', file.type);
      return NextResponse.json(
        { error: 'File must be an image' },
        { status: 400 }
      );
    }

    // Validar tamaño (máximo 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      console.error('❌ API: Archivo demasiado grande:', file.size);
      return NextResponse.json(
        { error: 'File too large. Maximum size: 10MB' },
        { status: 400 }
      );
    }

    // Convertir archivo a buffer
    const buffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(buffer);

    // Determinar MIME type correcto
    let mimeType = file.type;
    if (!mimeType || mimeType === 'application/octet-stream') {
      // Detectar por extensión si el MIME type no es claro
      const ext = file.name.split('.').pop()?.toLowerCase();
      const mimeMap: { [key: string]: string } = {
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'png': 'image/png',
        'webp': 'image/webp',
        'gif': 'image/gif',
        'bmp': 'image/bmp',
        'svg': 'image/svg+xml'
      };
      mimeType = mimeMap[ext || ''] || 'image/jpeg';
    }

    // Validar que sea un formato de imagen soportado
    const supportedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/bmp'];
    if (!supportedTypes.includes(mimeType)) {
      console.error('❌ API: Tipo de imagen no soportado:', mimeType);
      return NextResponse.json(
        { error: 'Unsupported image format' },
        { status: 400 }
      );
    }

    // Convertir a base64
    const base64 = Buffer.from(uint8Array).toString('base64');

    // Crear data URL
    const dataUrl = `data:${mimeType};base64,${base64}`;

    console.log('✅ API: Imagen convertida exitosamente:', {
      filename: file.name,
      size: file.size,
      sizeKB: Math.round(file.size / 1024),
      mimeType: mimeType,
      base64Length: base64.length
    });

    // Opcional: Aquí podrías implementar optimización de imagen
    // Por ahora, retornamos la imagen tal cual

    const response = {
      success: true,
      dataUrl: dataUrl,
      filename: file.name,
      size: file.size,
      sizeKB: Math.round(file.size / 1024),
      mimeType: mimeType,
      timestamp: new Date().toISOString()
    };

    console.log('📤 API: Enviando respuesta exitosa');
    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ API: Error en conversión de imagen:', error);

    // Determinar el tipo de error
    let errorMessage = 'Error converting image';
    if (error instanceof Error) {
      if (error.message.includes('FormData')) {
        errorMessage = 'Invalid form data';
      } else if (error.message.includes('Buffer') || error.message.includes('ArrayBuffer')) {
        errorMessage = 'Error processing image file';
      } else {
        errorMessage = error.message;
      }
    }

    return NextResponse.json(
      {
        error: errorMessage,
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Manejar otros métodos HTTP
export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed. Use POST.' },
    { status: 405 }
  );
}

export async function PUT() {
  return NextResponse.json(
    { error: 'Method not allowed. Use POST.' },
    { status: 405 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    { error: 'Method not allowed. Use POST.' },
    { status: 405 }
  );
}
