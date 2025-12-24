import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase configuration');
  }

  return createClient(supabaseUrl, supabaseKey);
}

// GET - Get single published recipe by slug
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const supabase = getSupabaseClient();

    // Fetch recipe with ingredients and steps
    const { data: recipe, error } = await supabase
      .from('recipes')
      .select(`
        *,
        ingredients:recipe_ingredients(
          id,
          product_id,
          name_es,
          name_en,
          quantity,
          unit_es,
          unit_en,
          is_optional,
          sort_order,
          notes_es,
          notes_en
        ),
        steps:recipe_steps(
          id,
          step_number,
          instruction_es,
          instruction_en,
          subtitle_es,
          subtitle_en,
          image_url
        )
      `)
      .eq('slug', slug)
      .eq('video_status', 'published')
      .single();

    if (error || !recipe) {
      return NextResponse.json({ error: 'Receta no encontrada', success: false }, { status: 404 });
    }

    // Sort ingredients and steps
    if (recipe.ingredients) {
      recipe.ingredients.sort((a: { sort_order: number }, b: { sort_order: number }) => a.sort_order - b.sort_order);
    }
    if (recipe.steps) {
      recipe.steps.sort((a: { step_number: number }, b: { step_number: number }) => a.step_number - b.step_number);
    }

    // Increment view count (fire and forget)
    supabase.rpc('increment_recipe_views', { recipe_slug: slug }).then(() => {});

    // Log analytics event
    supabase.from('recipe_analytics').insert({
      recipe_id: recipe.id,
      event_type: 'page_view',
      source: request.headers.get('referer') || 'direct'
    }).then(() => {});

    return NextResponse.json({ success: true, recipe });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Error interno del servidor', success: false }, { status: 500 });
  }
}
