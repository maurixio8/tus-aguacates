import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

/**
 * API para limpiar recetas antiguas no favoritas
 * POST /api/chef-virtual/cleanup
 *
 * Elimina recetas generadas hace más de 7 días que no están favoritadas
 * Este endpoint debería ser llamado por un cron job o manualmente
 */
export async function POST(request: NextRequest) {
  try {
    // Calcular fecha de hace 7 días
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    // Eliminar recetas no favoritas más antiguas que 7 días
    const { data, error, count } = await supabase
      .from('generated_recipes')
      .delete()
      .lt('created_at', sevenDaysAgo)
      .eq('is_favorited', false);

    if (error) {
      console.error('[CHEF-VIRTUAL-CLEANUP] Error:', error);
      return NextResponse.json(
        { error: 'Error al limpiar recetas', success: false },
        { status: 500 }
      );
    }

    console.log('[CHEF-VIRTUAL-CLEANUP] Recetas eliminadas:', count);

    return NextResponse.json({
      success: true,
      message: `Limpieza completada. ${count || 0} recetas eliminadas.`,
      deletedCount: count || 0
    });

  } catch (error) {
    console.error('[CHEF-VIRTUAL-CLEANUP] Error:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor', success: false },
      { status: 500 }
    );
  }
}
