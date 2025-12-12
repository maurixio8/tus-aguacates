import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

// GET - List all categories (simple version)
export async function GET(request: NextRequest) {
  console.log('🔄 [API Categories-Simple] GET request received');
  
  try {
    // Usar directamente las variables de entorno con valores hardcoded como fallback
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://gxqkmaaqoehydulksudj.supabase.co';
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd4cWttYWFxb2VoeWR1bGtzdWRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI0NDI5NDQsImV4cCI6MjA3ODAxODk0NH0.XAR-ysQgt0ZkRZfIZx_DvpYMzmEMFsdAYK3EP1tc0mw';
    
    console.log('📡 [API Categories-Simple] Creating Supabase client with URL:', supabaseUrl.substring(0, 30) + '...');
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
    
    console.log('✅ [API Categories-Simple] Supabase client created successfully');
    
    console.log('🔍 [API Categories-Simple] Querying categories table...');
    const { data, error } = await supabase
      .from('categories')
      .select('id, name, slug, description, image_url, is_active')
      .eq('is_active', true)
      .order('name', { ascending: true });

    console.log('📊 [API Categories-Simple] Query result:', {
      dataLength: data?.length || 0,
      error: error ? error.message : null
    });

    if (error) {
      console.error('❌ API: Error fetching categories:', error);
      return NextResponse.json(
        { error: 'Error al cargar categorías', success: false, details: error.message },
        { status: 500 }
      );
    }

    console.log('✅ [API Categories-Simple] Categories fetched successfully:', data?.length || 0);
    return NextResponse.json({
      success: true,
      categories: data || []
    });

  } catch (error) {
    console.error('❌ API: Unexpected error:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor', success: false, details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}