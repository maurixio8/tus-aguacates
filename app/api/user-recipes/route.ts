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

    // Estructurar las recetas correctamente para el componente RecipeCard
    // RecipeCard espera: GeneratedRecipe & { id: string; is_favorited: boolean }
    const parsedRecipes = recipes?.map(recipe => {
      const recipeData = recipe.recipe_data as any;

      // Parsear ingredients si es un string JSON
      let ingredients = recipeData?.ingredients || [];
      if (typeof ingredients === 'string') {
        try {
          ingredients = JSON.parse(ingredients);
        } catch (e) {
          console.error('[USER-RECIPES] Error parsing ingredients:', e);
          ingredients = [];
        }
      }

      // Crear objeto con la estructura esperada por RecipeCard
      return {
        // Campos de GeneratedRecipe (desde recipe_data)
        title: recipeData?.title || 'Sin título',
        description: recipeData?.description || '',
        ingredients: ingredients,
        steps: recipeData?.steps || [],
        prepTime: recipeData?.prepTime || 0,
        cookTime: recipeData?.cookTime || 0,
        servings: recipeData?.servings || 1,
        difficulty: recipeData?.difficulty || 'Fácil',
        cuisine: recipeData?.cuisine || 'Variada',
        tags: recipeData?.tags || [],

        // Campos adicionales de la BD
        id: recipe.id,
        is_favorited: recipe.is_favorited || false,
        created_at: recipe.created_at
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
