import { NextRequest, NextResponse } from 'next/server';
import { generateRecipe, isChefVirtualAvailable } from '@/lib/gemini-recipe-service';
import { supabase } from '@/lib/supabase';
import { extractBearerToken, createSupabaseRequestClient } from '@/lib/supabaseRequestClient';

export const dynamic = 'force-dynamic';

const AUTHENTICATED_DAILY_LIMIT = 5;
const GUEST_DAILY_LIMIT = 2;
const guestDailyUsage = new Map<string, { date: string; count: number }>();

function getToday(): string {
  return new Date().toISOString().split('T')[0];
}

function getGuestKey(request: NextRequest): string {
  const forwardedFor = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  const realIp = request.headers.get('x-real-ip');
  const userAgent = request.headers.get('user-agent') || 'unknown';

  return `${forwardedFor || realIp || 'unknown'}:${userAgent}`;
}

function getGuestUsage(request: NextRequest): number {
  const key = getGuestKey(request);
  const today = getToday();
  const usage = guestDailyUsage.get(key);

  if (!usage || usage.date !== today) {
    guestDailyUsage.set(key, { date: today, count: 0 });
    return 0;
  }

  return usage.count;
}

function incrementGuestUsage(request: NextRequest) {
  const key = getGuestKey(request);
  const today = getToday();
  const current = guestDailyUsage.get(key);

  if (!current || current.date !== today) {
    guestDailyUsage.set(key, { date: today, count: 1 });
    return;
  }

  guestDailyUsage.set(key, { date: today, count: current.count + 1 });
}

async function getAuthenticatedUsage(supabaseClient: typeof supabase, userId: string) {
  const today = getToday();

  const { data: limits } = await supabaseClient
    .from('user_recipe_limits')
    .select('*')
    .eq('user_id', userId)
    .single();

  const { data: subscription } = await supabaseClient
    .from('user_chef_subscription')
    .select('*')
    .eq('user_id', userId)
    .single();

  const recipesLimit = subscription?.recipes_limit || AUTHENTICATED_DAILY_LIMIT;
  const isSameDay = limits?.last_reset === today;
  const recipesGeneratedToday = isSameDay ? limits?.recipes_generated_today || 0 : 0;

  return {
    recipesLimit,
    recipesGeneratedToday,
    today,
  };
}

async function persistAuthenticatedUsage(
  supabaseClient: typeof supabase,
  userId: string,
  today: string,
  recipesGeneratedToday: number
) {
  await supabaseClient
    .from('user_recipe_limits')
    .upsert(
      {
        user_id: userId,
        recipes_generated_today: recipesGeneratedToday,
        last_reset: today,
      },
      { onConflict: 'user_id' }
    );
}

export async function POST(request: NextRequest) {
  try {
    if (!isChefVirtualAvailable()) {
      return NextResponse.json(
        { error: 'El servicio de Chef Virtual no está disponible. Contacta al administrador.', success: false },
        { status: 503 }
      );
    }

    const body = await request.json();
    const { ingredients, preferences } = body;

    if (!ingredients || !Array.isArray(ingredients) || ingredients.length === 0) {
      return NextResponse.json(
        { error: 'Debes ingresar al menos un ingrediente', success: false },
        { status: 400 }
      );
    }

    if (!ingredients.every((ing: string) => typeof ing === 'string' && ing.trim().length > 0)) {
      return NextResponse.json(
        { error: 'Los ingredientes deben ser textos válidos', success: false },
        { status: 400 }
      );
    }

    if (ingredients.length > 20) {
      return NextResponse.json(
        { error: 'Máximo 20 ingredientes permitidos', success: false },
        { status: 400 }
      );
    }

    const authHeader = request.headers.get('authorization');
    const token = extractBearerToken(authHeader);
    let userId: string | null = null;
    let supabaseClient = supabase;

    if (token) {
      supabaseClient = createSupabaseRequestClient(token);

      const {
        data: { user },
        error: authError,
      } = await supabaseClient.auth.getUser();

      if (!authError && user) {
        userId = user.id;
      }
    }

    if (userId) {
      const { recipesLimit, recipesGeneratedToday, today } = await getAuthenticatedUsage(
        supabaseClient,
        userId
      );

      if (recipesGeneratedToday >= recipesLimit) {
        return NextResponse.json(
          {
            error: 'Has alcanzado tu límite diario de recetas.',
            success: false,
            limit: recipesLimit,
          },
          { status: 429 }
        );
      }

      const result = await generateRecipe(ingredients, preferences);

      if (!result.success || !result.recipe) {
        return NextResponse.json(
          { error: result.error, success: false },
          { status: 500 }
        );
      }

      let recipeError: { message: string; code?: string; details?: string; hint?: string } | null = null;

      try {
        const { error: insertError } = await supabaseClient
          .from('generated_recipes')
          .insert({
            user_id: userId,
            ingredients: JSON.stringify(ingredients),
            recipe_data: result.recipe,
            is_favorited: false,
          });

        if (insertError) {
          recipeError = {
            message: insertError.message,
            code: insertError.code,
            details: insertError.details,
            hint: insertError.hint,
          };
        }

        await persistAuthenticatedUsage(
          supabaseClient,
          userId,
          today,
          recipesGeneratedToday + 1
        );

        await supabaseClient
          .from('user_chef_subscription')
          .upsert(
            {
              user_id: userId,
              tier: 'registered',
              recipes_limit: AUTHENTICATED_DAILY_LIMIT,
              can_save: true,
              saved_recipes_limit: 10,
            },
            { onConflict: 'user_id' }
          );
      } catch (dbError: any) {
        recipeError = dbError;
      }

      return NextResponse.json({
        success: true,
        recipe: result.recipe,
        saved: !recipeError,
        warning: recipeError
          ? 'La receta se generó pero hubo un error al guardarla en tu historial.'
          : undefined,
        errorDetails: recipeError
          ? {
              message: recipeError.message,
              code: recipeError.code,
              details: recipeError.details,
              hint: recipeError.hint,
            }
          : undefined,
      });
    }

    const guestUsage = getGuestUsage(request);
    if (guestUsage >= GUEST_DAILY_LIMIT) {
      return NextResponse.json(
        {
          error: 'Has alcanzado tu límite diario de recetas como visitante.',
          success: false,
          limit: GUEST_DAILY_LIMIT,
        },
        { status: 429 }
      );
    }

    const result = await generateRecipe(ingredients, preferences);
    if (!result.success) {
      return NextResponse.json(
        { error: result.error, success: false },
        { status: 500 }
      );
    }

    incrementGuestUsage(request);

    return NextResponse.json({
      success: true,
      recipe: result.recipe,
      saved: false,
    });
  } catch (error) {
    console.error('[CHEF-VIRTUAL-GENERATE] Error:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor', success: false },
      { status: 500 }
    );
  }
}
