import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import sharp from 'sharp';

export const dynamic = 'force-dynamic';

// Create Supabase client
function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase configuration');
  }

  return createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

export async function POST(request: NextRequest) {
  try {
    // Verify referer for security
    const referer = request.headers.get('referer');
    if (!referer?.includes('/admin')) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const productId = formData.get('productId') as string | null;

    if (!file) {
      return NextResponse.json({ error: 'No se envió ningún archivo' }, { status: 400 });
    }

    if (!productId) {
      return NextResponse.json({ error: 'ID de producto requerido' }, { status: 400 });
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'El archivo debe ser una imagen' }, { status: 400 });
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'La imagen es muy grande. Máximo 5MB' }, { status: 400 });
    }

    const supabase = getSupabaseClient();

    // Generate unique filename
    // Generate unique filename for WebP
    const timestamp = Date.now();
    const fileName = `products/${productId}-${timestamp}.webp`; // Force .webp extension

    // Convert File to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Optimize image with Sharp
    console.log('🖼️ Iniciando optimización de imagen con Sharp...');
    const optimizedBuffer = await sharp(buffer)
      .resize({
        width: 1200, // Max width 1200px
        withoutEnlargement: true,
        fit: 'inside'
      })
      .webp({
        quality: 80, // Good balance between size and quality
        effort: 4 // Compression effort (0-6)
      })
      .toBuffer();

    console.log(`✅ Imagen optimizada: ${buffer.length} -> ${optimizedBuffer.length} bytes`);

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('product-images')
      .upload(fileName, optimizedBuffer, {
        contentType: 'image/webp', // Always WebP
        upsert: true
      });

    if (error) {
      console.error('Error uploading to Supabase:', error);
      return NextResponse.json(
        { error: 'Error al subir la imagen', details: error.message },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('product-images')
      .getPublicUrl(fileName);

    return NextResponse.json({
      success: true,
      imageUrl: urlData.publicUrl,
      fileName: fileName,
      stats: {
        originalSize: buffer.length,
        newSize: optimizedBuffer.length,
        width: 1200,
        format: 'webp'
      }
    });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Error al procesar la imagen', details: String(error) },
      { status: 500 }
    );
  }
}
