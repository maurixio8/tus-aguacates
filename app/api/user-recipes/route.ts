import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { extractBearerToken, createSupabaseRequestClient } from '@/lib/supabaseRequestClient';

export const dynamic = 'force-dynamic';

/**
 * API para obtener las recetas generadas del usuario
 * GET /api/user-recipes?filter=all|favorites|recent
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = extractBearerToken(authHeader);

    if (!token) {
      console.log('[USER-RECIPES] No token provided');
      return NextResponse.json(
        { error: 'No autorizado', success: false },
        { status: 401 }
      );
    }

    // Crear cliente con el token del usuario para que RLS funcione correctamente
    const supabaseClient = createSupabaseRequestClient(token);

    // Verificar token
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();

    if (authError || !user) {
      console.error('[USER-RECIPES] Auth error:', authError);
      return NextResponse.json(
        { error: 'Token invalido', success: false },
        { status: 401 }
      );
    }

    console.log('[USER-RECIPES] Fetching recipes for user:', user.id);

    // Obtener parámetro de filtro
    const { searchParams } = new URL(request.url);
    const filter = searchParams.get('filter') || 'all';

    // Construir query usando el cliente con el token
    let query = supabaseClient
      .from('generated_recipes')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    // Aplicar filtros
    if (filter === 'favorites') {
      query = query.eq('is_favorited', true);
    } else if (filter === 'recent') {
      // Últimos 7 días
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      query = query.gte('created_at', sevenDaysAgo);
    }

    const { data: recipes, error } = await query.limit(50);

    if (error) {
      console.error('[USER-RECIPES] Error fetching recipes:', error);
      return NextResponse.json(
        { error: 'Error al obtener recetas', success: false },
        { status: 500 }
      );
    }

    console.log('[USER-RECIPES] Found recipes:', recipes?.length || 0);

    // Parsear ingredients que están guardados como JSON string
    const parsedRecipes = recipes?.map(recipe => {
      let parsedIngredients = recipe.ingredients;
      let parsedRecipeData = recipe.recipe_data;

      // Si ingredients es un string JSON, parsearlo
      if (typeof recipe.ingredients === 'string') {
        try {
          parsedIngredients = JSON.parse(recipe.ingredients);
        } catch (e) {
          console.error('[USER-RECIPES] Error parsing ingredients:', e);
          parsedIngredients = [];
        }
      }

      // Si recipe_data tiene ingredients como JSON string, parsearlo también
      if (recipe.recipe_data && typeof recipe.recipe_data === 'object') {
        const recipeData = recipe.recipe_data as any;
        if (recipeData.ingredients && typeof recipeData.ingredients === 'string') {
          try {
            recipeData.ingredients = JSON.parse(recipeData.ingredients);
          } catch (e) {
            console.error('[USER-RECIPES] Error parsing recipe_data.ingredients:', e);
          }
        }
        parsedRecipeData = recipeData;
      }

      return {
        ...recipe,
        ingredients: parsedIngredients,
        recipe_data: parsedRecipeData
      };
    }) || [];

    return NextResponse.json({
      success: true,
      data: parsedRecipes
    });

  } catch (error) {
    console.error('[USER-RECIPES] Error:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor', success: false },
      { status: 500 }
    );
  }
}
