import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';
import type { CreateRecipeRequest, Recipe, VideoStatus } from '@/lib/types/recipes';

export const dynamic = 'force-dynamic';

// Create Supabase client with service role key for admin operations
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

// Verify admin authentication
async function verifyAdminAuth(request: NextRequest): Promise<{ success: boolean; adminId?: string; error?: string }> {
  try {
    const token = request.cookies.get('admin-token')?.value;

    if (!token) {
      return { success: false, error: 'No autenticado' };
    }

    const jwtSecret = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
    const decoded = jwt.verify(token, jwtSecret) as { id: string; type: string };

    if (decoded.type !== 'admin') {
      return { success: false, error: 'Token inválido' };
    }

    return { success: true, adminId: decoded.id };
  } catch {
    return { success: false, error: 'Token expirado o inválido' };
  }
}

// GET - List recipes with filters
export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAdminAuth(request);
    if (!auth.success) {
      return NextResponse.json({ error: auth.error, success: false }, { status: 401 });
    }

    const supabase = getSupabaseClient();
    const { searchParams } = new URL(request.url);

    // Parse query params
    const page = parseInt(searchParams.get('page') || '1');
    const perPage = parseInt(searchParams.get('per_page') || '20');
    const status = searchParams.get('status') as VideoStatus | null;
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const featured = searchParams.get('featured');

    // Calculate offset
    const offset = (page - 1) * perPage;

    // Build query
    let query = supabase
      .from('recipes')
      .select('*', { count: 'exact' });

    // Apply filters
    if (status) {
      query = query.eq('video_status', status);
    }
    if (category) {
      query = query.eq('category', category);
    }
    if (featured === 'true') {
      query = query.eq('featured', true);
    }
    if (search) {
      query = query.or(`title_es.ilike.%${search}%,title_en.ilike.%${search}%`);
    }

    // Order and paginate
    query = query
      .order('created_at', { ascending: false })
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

// POST - Create new recipe
export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAdminAuth(request);
    if (!auth.success) {
      return NextResponse.json({ error: auth.error, success: false }, { status: 401 });
    }

    const supabase = getSupabaseClient();
    const body: CreateRecipeRequest = await request.json();

    // Validate required fields
    if (!body.title_es) {
      return NextResponse.json({ error: 'El título en español es requerido', success: false }, { status: 400 });
    }

    // Create recipe
    const { data: recipe, error: recipeError } = await supabase
      .from('recipes')
      .insert({
        title_es: body.title_es,
        title_en: body.title_en,
        description_es: body.description_es,
        description_en: body.description_en,
        prep_time_minutes: body.prep_time_minutes || 10,
        cook_time_minutes: body.cook_time_minutes || 0,
        servings: body.servings || 2,
        difficulty: body.difficulty || 'facil',
        category: body.category || 'general',
        tags: body.tags || [],
        video_style: body.video_style || 'frame_elegante',
        video_status: 'draft',
        created_by: auth.adminId
      })
      .select()
      .single();

    if (recipeError) {
      console.error('Error creating recipe:', recipeError);
      return NextResponse.json({ error: `Error al crear receta: ${recipeError.message}`, success: false }, { status: 500 });
    }

    // Add ingredients if provided
    if (body.ingredients && body.ingredients.length > 0) {
      const ingredientsToInsert = body.ingredients.map((ing, index) => ({
        recipe_id: recipe.id,
        product_id: ing.product_id,
        name_es: ing.name_es,
        name_en: ing.name_en,
        quantity: ing.quantity,
        unit_es: ing.unit_es || 'unidad',
        unit_en: ing.unit_en || 'unit',
        is_optional: ing.is_optional || false,
        sort_order: index,
        notes_es: ing.notes_es,
        notes_en: ing.notes_en
      }));

      const { error: ingredientsError } = await supabase
        .from('recipe_ingredients')
        .insert(ingredientsToInsert);

      if (ingredientsError) {
        console.error('Error adding ingredients:', ingredientsError);
        // Don't fail the whole request, just log the error
      }
    }

    // Add steps if provided
    if (body.steps && body.steps.length > 0) {
      const stepsToInsert = body.steps.map((step, index) => ({
        recipe_id: recipe.id,
        step_number: index + 1,
        instruction_es: step.instruction_es,
        instruction_en: step.instruction_en,
        subtitle_es: step.subtitle_es || step.instruction_es.substring(0, 100),
        subtitle_en: step.subtitle_en,
        image_prompt: step.image_prompt,
        animation_type: step.animation_type || 'smooth_motion',
        animation_duration_seconds: step.animation_duration_seconds || 5
      }));

      const { error: stepsError } = await supabase
        .from('recipe_steps')
        .insert(stepsToInsert);

      if (stepsError) {
        console.error('Error adding steps:', stepsError);
      }
    }

    // Fetch complete recipe with relations
    const { data: completeRecipe, error: fetchError } = await supabase
      .from('recipes')
      .select(`
        *,
        ingredients:recipe_ingredients(*),
        steps:recipe_steps(*)
      `)
      .eq('id', recipe.id)
      .single();

    if (fetchError) {
      // Return the basic recipe if we can't fetch relations
      return NextResponse.json({ success: true, recipe }, { status: 201 });
    }

    return NextResponse.json({ success: true, recipe: completeRecipe }, { status: 201 });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Error interno del servidor', success: false }, { status: 500 });
  }
}

// PATCH - Update recipe (for bulk updates like status change)
export async function PATCH(request: NextRequest) {
  try {
    const auth = await verifyAdminAuth(request);
    if (!auth.success) {
      return NextResponse.json({ error: auth.error, success: false }, { status: 401 });
    }

    const supabase = getSupabaseClient();
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID de receta requerido', success: false }, { status: 400 });
    }

    // Add updated_by
    updates.updated_by = auth.adminId;

    // If publishing, set published_at
    if (updates.video_status === 'published') {
      updates.published_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('recipes')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating recipe:', error);
      return NextResponse.json({ error: `Error al actualizar receta: ${error.message}`, success: false }, { status: 500 });
    }

    return NextResponse.json({ success: true, recipe: data });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Error interno del servidor', success: false }, { status: 500 });
  }
}

// DELETE - Delete recipe
export async function DELETE(request: NextRequest) {
  try {
    const auth = await verifyAdminAuth(request);
    if (!auth.success) {
      return NextResponse.json({ error: auth.error, success: false }, { status: 401 });
    }

    const supabase = getSupabaseClient();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID de receta requerido', success: false }, { status: 400 });
    }

    // Delete recipe (cascade will handle ingredients, steps, etc.)
    const { error } = await supabase
      .from('recipes')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting recipe:', error);
      return NextResponse.json({ error: `Error al eliminar receta: ${error.message}`, success: false }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Receta eliminada exitosamente' });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Error interno del servidor', success: false }, { status: 500 });
  }
}
