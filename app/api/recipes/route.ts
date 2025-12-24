import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { RecipeCategory } from '@/lib/types/recipes';

export const dynamic = 'force-dynamic';

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase configuration');
  }

  return createClient(supabaseUrl, supabaseKey);
}

// GET - List published recipes (public)
export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    const { searchParams } = new URL(request.url);

    // Parse query params
    const page = parseInt(searchParams.get('page') || '1');
    const perPage = parseInt(searchParams.get('per_page') || '12');
    const category = searchParams.get('category') as RecipeCategory | null;
    const featured = searchParams.get('featured');
    const search = searchParams.get('search');

    const offset = (page - 1) * perPage;

    // Build query - only published recipes
    let query = supabase
      .from('recipes')
      .select(`
        id,
        title_es,
        title_en,
        slug,
        description_es,
        description_en,
        prep_time_minutes,
        cook_time_minutes,
        total_time_minutes,
        servings,
        difficulty,
        category,
        tags,
        thumbnail_url,
        video_url_vertical,
        video_url_horizontal,
        instagram_url,
        tiktok_url,
        youtube_url,
        featured,
        view_count,
        published_at
      `, { count: 'exact' })
      .eq('video_status', 'published');

    // Apply filters
    if (category) {
      query = query.eq('category', category);
    }
    if (featured === 'true') {
      query = query.eq('featured', true);
    }
    if (search) {
      query = query.or(`title_es.ilike.%${search}%,title_en.ilike.%${search}%,description_es.ilike.%${search}%`);
    }

    // Order by featured first, then by publish date
    query = query
      .order('featured', { ascending: false })
      .order('published_at', { ascending: false })
      .range(offset, offset + perPage - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching recipes:', error);
      return NextResponse.json({ error: 'Error al cargar recetas', success: false }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      recipes: data || [],
      total: count || 0,
      page,
      per_page: perPage
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Error interno del servidor', success: false }, { status: 500 });
  }
}
