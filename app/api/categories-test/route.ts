import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

// GET - List all categories (test version)
export async function GET(request: NextRequest) {
  console.log('🔄 [API Categories-Test] GET request received');
  
  try {
    console.log('📡 [API Categories-Test] Using existing Supabase client...');
    
    console.log('🔍 [API Categories-Test] Querying categories table...');
    const { data, error } = await supabase
      .from('categories')
      .select('id, name, slug, description, image_url, is_active')
      .eq('is_active', true)
      .order('name', { ascending: true });

    console.log('📊 [API Categories-Test] Query result:', {
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

    console.log('✅ [API Categories-Test] Categories fetched successfully:', data?.length || 0);
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