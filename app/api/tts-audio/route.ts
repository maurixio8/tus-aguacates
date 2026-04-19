// POST /api/tts-audio
// Recibe: { audioBase64: "...", filename: "saludo-57300xxx-2026-04-19.ogg" }
// Sube a Supabase Storage y devuelve URL pública
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { audioBase64, filename } = await req.json();
    
    if (!audioBase64 || !filename) {
      return NextResponse.json({ error: 'Missing audioBase64 or filename' }, { status: 400 });
    }

    const buffer = Buffer.from(audioBase64, 'base64');
    
    const { data, error } = await supabase.storage
      .from('product-images') //bucket de imagenes existente
      .upload(filename, buffer, {
        contentType: 'audio/ogg',
        upsert: true
      });

    if (error) {
      // Si el bucket no acepta audio, intentar con text/plain
      const { data: data2, error: error2 } = await supabase.storage
        .from('product-images')
        .upload(filename, buffer, {
          contentType: 'application/octet-stream',
          upsert: true
        });
      
      if (error2) {
        return NextResponse.json({ error: error2.message }, { status: 500 });
      }
      
      // Obtener URL pública
      const { data: urlData } = supabase.storage
        .from('product-images')
        .getPublicUrl(data2.path);
      
      return NextResponse.json({ url: urlData.publicUrl });
    }

    const { data: urlData } = supabase.storage
      .from('product-images')
      .getPublicUrl(data.path);

    return NextResponse.json({ url: urlData.publicUrl });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}