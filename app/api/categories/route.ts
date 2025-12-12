import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createSupabaseClient } from '@/lib/auth-admin';

export const dynamic = 'force-dynamic';

// Función simplificada para crear cliente de Supabase sin autenticación
function createSimpleSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Missing Supabase credentials:', {
      hasUrl: !!supabaseUrl,
      hasAnonKey: !!supabaseAnonKey
    });
    throw new Error('Missing Supabase configuration');
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
    let supabase;
    
    try {
      // Intentar con el cliente admin primero
      supabase = createSupabaseClient();
      console.log('✅ [API Categories] Admin Supabase client created successfully');
    } catch (adminError) {
      console.warn('⚠️ [API Categories] Admin client failed, trying simple client:', adminError);
      // Fallback a cliente simple sin autenticación
      supabase = createSimpleSupabaseClient();
      console.log('✅ [API Categories] Simple Supabase client created successfully');
    }

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
