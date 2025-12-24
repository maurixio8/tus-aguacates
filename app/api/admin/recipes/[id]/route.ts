import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';
import type { UpdateRecipeRequest } from '@/lib/types/recipes';

export const dynamic = 'force-dynamic';

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

// GET - Get single recipe with all details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await verifyAdminAuth(request);
    if (!auth.success) {
      return NextResponse.json({ error: auth.error, success: false }, { status: 401 });
    }

    const { id } = await params;
    const supabase = getSupabaseClient();

    // Fetch recipe with all relations
    const { data: recipe, error } = await supabase
      .from('recipes')
      .select(`
        *,
        ingredients:recipe_ingredients(
          *,
          product:product_id(id, name, price, main_image_url)
        ),
        steps:recipe_steps(*),
        videos:recipe_videos(*)
      `)
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching recipe:', error);
      return NextResponse.json({ error: 'Receta no encontrada', success: false }, { status: 404 });
    }

    // Sort ingredients and steps
    if (recipe.ingredients) {
      recipe.ingredients.sort((a: { sort_order: number }, b: { sort_order: number }) => a.sort_order - b.sort_order);
    }
    if (recipe.steps) {
      recipe.steps.sort((a: { step_number: number }, b: { step_number: number }) => a.step_number - b.step_number);
    }

    return NextResponse.json({ success: true, recipe });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Error interno del servidor', success: false }, { status: 500 });
  }
}

// PATCH - Update recipe
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await verifyAdminAuth(request);
    if (!auth.success) {
      return NextResponse.json({ error: auth.error, success: false }, { status: 401 });
    }

    const { id } = await params;
    const supabase = getSupabaseClient();
    const body: UpdateRecipeRequest & { ingredients?: any[]; steps?: any[] } = await request.json();

    // Separate recipe fields from relations
    const { ingredients, steps, ...recipeFields } = body;

    // Update recipe if there are recipe-level changes
    if (Object.keys(recipeFields).length > 0) {
      // Build updates object with metadata
      const recipeUpdates: Record<string, unknown> = {
        ...recipeFields,
        updated_by: auth.adminId
      };

      // If publishing, set published_at
      if (recipeFields.video_status === 'published') {
        recipeUpdates.published_at = new Date().toISOString();
      }

      const { error: recipeError } = await supabase
        .from('recipes')
        .update(recipeUpdates)
        .eq('id', id);

      if (recipeError) {
        console.error('Error updating recipe:', recipeError);
        return NextResponse.json({ error: `Error al actualizar receta: ${recipeError.message}`, success: false }, { status: 500 });
      }
    }

    // Update ingredients if provided
    if (ingredients) {
      // Delete existing ingredients
      await supabase
        .from('recipe_ingredients')
        .delete()
        .eq('recipe_id', id);

      // Insert new ingredients
      if (ingredients.length > 0) {
        const ingredientsToInsert = ingredients.map((ing, index) => ({
          recipe_id: id,
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
          console.error('Error updating ingredients:', ingredientsError);
        }
      }
    }

    // Update steps if provided
    if (steps) {
      // Delete existing steps
      await supabase
        .from('recipe_steps')
        .delete()
        .eq('recipe_id', id);

      // Insert new steps
      if (steps.length > 0) {
        const stepsToInsert = steps.map((step, index) => ({
          recipe_id: id,
          step_number: index + 1,
          instruction_es: step.instruction_es,
          instruction_en: step.instruction_en,
          subtitle_es: step.subtitle_es || step.instruction_es?.substring(0, 100),
          subtitle_en: step.subtitle_en,
          image_prompt: step.image_prompt,
          image_url: step.image_url,
          image_selected: step.image_selected || false,
          animation_type: step.animation_type || 'smooth_motion',
          animation_duration_seconds: step.animation_duration_seconds || 5,
          video_clip_url: step.video_clip_url
        }));

        const { error: stepsError } = await supabase
          .from('recipe_steps')
          .insert(stepsToInsert);

        if (stepsError) {
          console.error('Error updating steps:', stepsError);
        }
      }
    }

    // Fetch updated recipe
    const { data: updatedRecipe, error: fetchError } = await supabase
      .from('recipes')
      .select(`
        *,
        ingredients:recipe_ingredients(*),
        steps:recipe_steps(*),
        videos:recipe_videos(*)
      `)
      .eq('id', id)
      .single();

    if (fetchError) {
      return NextResponse.json({ success: true, message: 'Receta actualizada' });
    }

    return NextResponse.json({ success: true, recipe: updatedRecipe });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Error interno del servidor', success: false }, { status: 500 });
  }
}

// DELETE - Delete recipe
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await verifyAdminAuth(request);
    if (!auth.success) {
      return NextResponse.json({ error: auth.error, success: false }, { status: 401 });
    }

    const { id } = await params;
    const supabase = getSupabaseClient();

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
