import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

// Función para crear cliente de Supabase con credenciales anónimas
function createSupabaseClient() {
  // Intentar obtener las variables de entorno de diferentes formas
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  console.log('🔍 [DEBUG] Environment variables check:', {
    hasUrl: !!supabaseUrl,
    hasAnonKey: !!supabaseAnonKey,
    urlPrefix: supabaseUrl ? supabaseUrl.substring(0, 20) + '...' : 'null',
    keyPrefix: supabaseAnonKey ? supabaseAnonKey.substring(0, 20) + '...' : 'null',
    allEnvKeys: Object.keys(process.env).filter(k => k.includes('SUPABASE'))
  });

  // Verificar si las variables están definidas
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Missing Supabase credentials:', {
      hasUrl: !!supabaseUrl,
      hasAnonKey: !!supabaseAnonKey,
      envKeys: Object.keys(process.env).filter(k => k.includes('SUPABASE'))
    });
    
    // Intentar usar valores hardcoded como último recurso
    const fallbackUrl = 'https://gxqkmaaqoehydulksudj.supabase.co';
    const fallbackKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd4cWttYWFxb2VoeWR1bGtzdWRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI0NDI5NDQsImV4cCI6MjA3ODAxODk0NH0.XAR-ysQgt0ZkRZfIZx_DvpYMzmEMFsdAYK3EP1tc0mw';
    
    console.warn('⚠️ Using fallback Supabase credentials');
    
    return createClient(
      fallbackUrl,
      fallbackKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );
  }

  return createClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );
}

// GET - List all categories
export async function GET(request: NextRequest) {
  console.log('🔄 [API Categories] GET request received');
  console.log('🔍 [API Categories] Request headers:', Object.fromEntries(request.headers.entries()));
  
  try {
    console.log('📡 [API Categories] Creating Supabase client...');
    const supabase = createSupabaseClient();
    console.log('✅ [API Categories] Supabase client created successfully');

    console.log('🔍 [API Categories] Querying categories table...');
    const { data, error } = await supabase
      .from('categories')
      .select('id, name, slug, description, image_url, is_active')
      .eq('is_active', true)
      .order('name', { ascending: true });

    console.log('📊 [API Categories] Query result:', {
      dataLength: data?.length || 0,
      error: error ? error.message : null
    });

    if (error) {
      console.error('❌ API: Error fetching categories:', error);
      return NextResponse.json(
        { error: 'Error al cargar categorías', success: false },
        { status: 500 }
      );
    }

    console.log('✅ [API Categories] Categories fetched successfully:', data?.length || 0);
    return NextResponse.json({
      success: true,
      categories: data || []
    });

  } catch (error) {
    console.error('❌ API: Unexpected error:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor', success: false },
      { status: 500 }
    );
  }
}
