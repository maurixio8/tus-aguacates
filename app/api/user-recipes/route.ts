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

    return NextResponse.json({
      success: true,
      data: recipes || []
    });

  } catch (error) {
    console.error('[USER-RECIPES] Error:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor', success: false },
      { status: 500 }
    );
  }
}
