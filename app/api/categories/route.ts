import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseClient } from '@/lib/auth-admin';

export const dynamic = 'force-dynamic';

// GET - List all categories
export async function GET(request: NextRequest) {
  try {
    const supabase = createSupabaseClient();

    const { data, error } = await supabase
      .from('categories')
      .select('id, name, slug, description, image_url, is_active')
      .eq('is_active', true)
      .order('name', { ascending: true });

    if (error) {
      console.error('❌ API: Error fetching categories:', error);
      return NextResponse.json(
        { error: 'Error al cargar categorías', success: false },
        { status: 500 }
      );
    }

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
