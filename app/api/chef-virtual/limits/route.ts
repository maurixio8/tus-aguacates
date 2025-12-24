import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { extractBearerToken } from '@/lib/supabaseRequestClient';

export const dynamic = 'force-dynamic';

/**
 * API para verificar los límites diarios del Chef Virtual
 * GET /api/chef-virtual/limits
 *
 * Retorna información sobre cuántas recetas puede generar el usuario
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = extractBearerToken(authHeader);

    // Si no hay token, es visitante (límite de 2 recetas)
    if (!token) {
      return NextResponse.json({
        success: true,
        data: {
          recipesLimit: 2,
          recipesGeneratedToday: 0,
          remainingToday: 2,
          userTier: 'visitor',
          canSave: false,
          isLoggedIn: false
        }
      });
    }

    // Verificar que el token sea válido
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      // Token inválido = visitante
      return NextResponse.json({
        success: true,
        data: {
          recipesLimit: 2,
          recipesGeneratedToday: 0,
          remainingToday: 2,
          userTier: 'visitor',
          canSave: false,
          isLoggedIn: false
        }
      });
    }

    // Usuario autenticado - consultar sus límites
    const { data: limits, error: limitsError } = await supabase
      .from('user_recipe_limits')
      .select('*')
      .eq('user_id', user.id)
      .single();

    let { data: subscription } = await supabase
      .from('user_chef_subscription')
      .select('*')
      .eq('user_id', user.id)
      .single();

    // Si no hay suscripción o el límite es incorrecto, crear/actualizar
    if (!subscription || subscription.recipes_limit < 5) {
      const { data: upsertedSubscription } = await supabase
        .from('user_chef_subscription')
        .upsert({
          user_id: user.id,
          tier: 'registered',
          recipes_limit: 5,
          can_save: true,
          saved_recipes_limit: 10
        }, {
          onConflict: 'user_id'
        })
        .select('*')
        .single();

      subscription = upsertedSubscription;
    }

    // Determinar límite según suscripción (ahora siempre será 5 para registrados)
    const recipesLimit = subscription?.recipes_limit || 5;

    // Si no hay registro de límites, crear uno nuevo
    if (!limits && !limitsError) {
      const { data: newLimits } = await supabase
        .from('user_recipe_limits')
        .insert({
          user_id: user.id,
          recipes_generated_today: 0,
          last_reset: new Date().toISOString().split('T')[0]
        })
        .select('*')
        .single();

      return NextResponse.json({
        success: true,
        data: {
          recipesLimit,
          recipesGeneratedToday: 0,
          remainingToday: recipesLimit,
          userTier: subscription?.tier || 'registered',
          canSave: subscription?.can_save ?? true,
          isLoggedIn: true
        }
      });
    }

    // Verificar si es un nuevo día y resetear contadores
    const today = new Date().toISOString().split('T')[0];
    let recipesGeneratedToday = limits?.recipes_generated_today || 0;

    if (limits && limits.last_reset !== today) {
      // Es un nuevo día - resetear contador
      const { data: updatedLimits } = await supabase
        .from('user_recipe_limits')
        .update({
          recipes_generated_today: 0,
          last_reset: today
        })
        .eq('user_id', user.id)
        .select('*')
        .single();

      recipesGeneratedToday = 0;
    }

    return NextResponse.json({
      success: true,
      data: {
        recipesLimit,
        recipesGeneratedToday,
        remainingToday: Math.max(0, recipesLimit - recipesGeneratedToday),
        userTier: subscription?.tier || 'registered',
        canSave: subscription?.can_save ?? true,
        isLoggedIn: true
      }
    });

  } catch (error) {
    console.error('[CHEF-VIRTUAL-LIMITS] Error:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor', success: false },
      { status: 500 }
    );
  }
}
