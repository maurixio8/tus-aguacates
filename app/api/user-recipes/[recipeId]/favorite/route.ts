import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { extractBearerToken } from '@/lib/supabaseRequestClient';

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

    // Verificar token
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Token invalido', success: false },
        { status: 401 }
      );
    }

    const { recipeId } = await params;

    // Obtener la receta actual
    const { data: currentRecipe } = await supabase
      .from('generated_recipes')
      .select('is_favorited, user_id')
      .eq('id', recipeId)
      .single();

    if (!currentRecipe) {
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

    const { data, error } = await supabase
      .from('generated_recipes')
      .update({ is_favorited: newFavoriteStatus })
      .eq('id', recipeId)
      .select('*')
      .single();

    if (error) {
      console.error('[USER-RECIPES-FAVORITE] Error:', error);
      return NextResponse.json(
        { error: 'Error al actualizar favorito', success: false },
        { status: 500 }
      );
    }

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
