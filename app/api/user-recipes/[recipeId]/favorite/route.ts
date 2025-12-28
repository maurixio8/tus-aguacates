import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { extractBearerToken, createSupabaseRequestClient } from '@/lib/supabaseRequestClient';

export const dynamic = 'force-dynamic';

/**
 * API para alternar el estado de favorito de una receta
 * PATCH /api/user-recipes/[recipeId]/favorite
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ recipeId: string }> }
) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = extractBearerToken(authHeader);

    if (!token) {
      return NextResponse.json(
        { error: 'No autorizado', success: false },
        { status: 401 }
      );
    }

    // Crear cliente con el token del usuario
    const supabaseClient = createSupabaseRequestClient(token);

    // Verificar token
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Token invalido', success: false },
        { status: 401 }
      );
    }

    const { recipeId } = await params;

    console.log('[USER-RECIPES-FAVORITE] Toggling favorite for recipe:', recipeId, 'user:', user.id);

    // Obtener la receta actual usando el cliente con el token
    const { data: currentRecipe, error: fetchError } = await supabaseClient
      .from('generated_recipes')
      .select('is_favorited, user_id')
      .eq('id', recipeId)
      .single();

    if (fetchError || !currentRecipe) {
      console.error('[USER-RECIPES-FAVORITE] Recipe not found or error:', fetchError);
      return NextResponse.json(
        { error: 'Receta no encontrada', success: false },
        { status: 404 }
      );
    }

    // Verificar que la receta pertenezca al usuario
    if (currentRecipe.user_id !== user.id) {
      return NextResponse.json(
        { error: 'No autorizado', success: false },
        { status: 403 }
      );
    }

    // Alternar estado de favorito
    const newFavoriteStatus = !currentRecipe.is_favorited;

    const { data, error } = await supabaseClient
      .from('generated_recipes')
      .update({ is_favorited: newFavoriteStatus })
      .eq('id', recipeId)
      .select('*')
      .single();

    if (error) {
      console.error('[USER-RECIPES-FAVORITE] Error updating:', error);
      return NextResponse.json(
        { error: 'Error al actualizar favorito', success: false },
        { status: 500 }
      );
    }

    console.log('[USER-RECIPES-FAVORITE] Favorite toggled successfully:', newFavoriteStatus);

    return NextResponse.json({
      success: true,
      data: {
        recipe: data,
        isFavorited: newFavoriteStatus
      }
    });

  } catch (error) {
    console.error('[USER-RECIPES-FAVORITE] Error:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor', success: false },
      { status: 500 }
    );
  }
}
