import { NextRequest, NextResponse } from 'next/server';
import { generateRecipe, isChefVirtualAvailable } from '@/lib/gemini-recipe-service';
import { supabase } from '@/lib/supabase';
import { extractBearerToken, createSupabaseRequestClient } from '@/lib/supabaseRequestClient';

export const dynamic = 'force-dynamic';

/**
 * API para generar recetas con el Chef Virtual
 * POST /api/chef-virtual/generate
 *
 * Genera una receta con IA y la guarda en BD si el usuario está autenticado
 */
export async function POST(request: NextRequest) {
  try {
    // Verificar que el servicio esté disponible
    if (!isChefVirtualAvailable()) {
      return NextResponse.json(
        { error: 'El servicio de Chef Virtual no está disponible. Contacta al administrador.', success: false },
        { status: 503 }
      );
    }

    const body = await request.json();
    const { ingredients, preferences } = body;

    // Validar ingredientes
    if (!ingredients || !Array.isArray(ingredients) || ingredients.length === 0) {
      return NextResponse.json(
        { error: 'Debes ingresar al menos un ingrediente', success: false },
        { status: 400 }
      );
    }

    // Validar que los ingredientes sean strings
    if (!ingredients.every((ing: string) => typeof ing === 'string' && ing.trim().length > 0)) {
      return NextResponse.json(
        { error: 'Los ingredientes deben ser textos válidos', success: false },
        { status: 400 }
      );
    }

    // Validar límites de ingredientes (máximo 20)
    if (ingredients.length > 20) {
      return NextResponse.json(
        { error: 'Máximo 20 ingredientes permitidos', success: false },
        { status: 400 }
      );
    }

    // Verificar autenticación
    const authHeader = request.headers.get('authorization');
    const token = extractBearerToken(authHeader);
    let userId: string | null = null;
    let supabaseClient = supabase; // Cliente por defecto

    if (token) {
      // Crear cliente Supabase con el token del usuario para que RLS funcione
      supabaseClient = createSupabaseRequestClient(token);

      const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
      if (!authError && user) {
        userId = user.id;
      }
    }

    // Generar la receta
    const result = await generateRecipe(ingredients, preferences);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error, success: false },
        { status: 500 }
      );
    }

    // Si el usuario está autenticado, guardar la receta en BD
    let recipeError = null;
    if (userId && result.recipe) {
      const today = new Date().toISOString().split('T')[0];

      try {
        // 1. Guardar la receta generada usando el cliente con el token
        const { error: insertError } = await supabaseClient
          .from('generated_recipes')
          .insert({
            user_id: userId,
            ingredients: JSON.stringify(ingredients),
            recipe_data: result.recipe,
            is_favorited: false
          });

        if (insertError) {
          console.error('[CHEF-VIRTUAL-GENERATE] Error guardando receta:', insertError);
          recipeError = insertError;
        }

        // 2. Actualizar/crear registro de límites
        const { data: existingLimits } = await supabaseClient
          .from('user_recipe_limits')
          .select('*')
          .eq('user_id', userId)
          .single();

        if (existingLimits) {
          // Verificar si es un nuevo día
          if (existingLimits.last_reset !== today) {
            // Resetear contador y actualizar
            await supabaseClient
              .from('user_recipe_limits')
              .update({
                recipes_generated_today: 1,
                last_reset: today
              })
              .eq('user_id', userId);
          } else {
            // Incrementar contador
            await supabaseClient
              .from('user_recipe_limits')
              .update({
                recipes_generated_today: (existingLimits.recipes_generated_today || 0) + 1
              })
              .eq('user_id', userId);
          }
        } else {
          // Crear nuevo registro
          await supabaseClient
            .from('user_recipe_limits')
            .insert({
              user_id: userId,
              recipes_generated_today: 1,
              last_reset: today
            });
        }

        // 3. Asegurar que el usuario tenga suscripción registrada
        const { data: existingSubscription } = await supabaseClient
          .from('user_chef_subscription')
          .select('*')
          .eq('user_id', userId)
          .single();

        if (!existingSubscription) {
          await supabaseClient
            .from('user_chef_subscription')
            .insert({
              user_id: userId,
              tier: 'registered',
              recipes_limit: 5,
              can_save: true,
              saved_recipes_limit: 10
            });
        }

        console.log('[CHEF-VIRTUAL-GENERATE] Receta guardada para usuario:', userId);
      } catch (dbError) {
        console.error('[CHEF-VIRTUAL-GENERATE] Error en operaciones de BD:', dbError);
        // No fallar el request por errores de BD
      }
    }

    return NextResponse.json({
      success: true,
      recipe: result.recipe,
      saved: !!userId && !recipeError, // true si se guardó correctamente
      warning: recipeError ? 'La receta se generó pero hubo un error al guardarla en tu historial.' : undefined,
      errorDetails: recipeError ? {
        message: recipeError.message,
        code: recipeError.code,
        details: recipeError.details,
        hint: recipeError.hint
      } : undefined
    });

  } catch (error) {
    console.error('[CHEF-VIRTUAL-GENERATE] Error:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor', success: false },
      { status: 500 }
    );
  }
}
