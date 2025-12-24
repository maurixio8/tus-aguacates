import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { convertLegacyIdsToUuids } from '@/lib/legacyIdMapper';

// IDs legacy que no tienen mapeo y deben ser eliminados
const OBSOLETE_LEGACY_IDS = [
  'product-184',
  'product-103',
  'product-78',
  'product-84',
];

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    // Obtener el wishlist actual del usuario
    const { data: wishlistItems, error: fetchError } = await supabase
      .from('wishlist')
      .select('*')
      .eq('user_id', user.id);

    if (fetchError) {
      console.error('Error obteniendo wishlist:', fetchError);
      return NextResponse.json({ error: 'Error obteniendo wishlist' }, { status: 500 });
    }

    if (!wishlistItems || wishlistItems.length === 0) {
      return NextResponse.json({
        message: 'No hay items en el wishlist',
        deleted: 0,
        obsoleteFound: 0
      });
    }

    // Identificar items obsoletos
    const obsoleteItems = wishlistItems.filter(item =>
      OBSOLETE_LEGACY_IDS.includes(item.product_id)
    );

    if (obsoleteItems.length === 0) {
      return NextResponse.json({
        message: 'No se encontraron items obsoletos',
        deleted: 0,
        obsoleteFound: 0
      });
    }

    // Eliminar items obsoletos
    const obsoleteIds = obsoleteItems.map(item => item.id);
    const { error: deleteError } = await supabase
      .from('wishlist')
      .delete()
      .in('id', obsoleteIds);

    if (deleteError) {
      console.error('Error eliminando items obsoletos:', deleteError);
      return NextResponse.json({ error: 'Error eliminando items' }, { status: 500 });
    }

    return NextResponse.json({
      message: 'Wishlist limpiado exitosamente',
      deleted: obsoleteItems.length,
      obsoleteFound: obsoleteItems.length,
      deletedItems: obsoleteItems.map(item => ({
        id: item.id,
        product_id: item.product_id
      }))
    });

  } catch (error) {
    console.error('Error en /api/wishlist/clean:', error);
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}

// GET para ver qué items obsoletos hay sin eliminarlos
export async function GET(request: NextRequest) {
  try {
    // Verificar autenticación
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    // Obtener el wishlist actual del usuario
    const { data: wishlistItems, error: fetchError } = await supabase
      .from('wishlist')
      .select('*')
      .eq('user_id', user.id);

    if (fetchError) {
      console.error('Error obteniendo wishlist:', fetchError);
      return NextResponse.json({ error: 'Error obteniendo wishlist' }, { status: 500 });
    }

    // Identificar items obsoletos
    const obsoleteItems = wishlistItems?.filter(item =>
      OBSOLETE_LEGACY_IDS.includes(item.product_id)
    ) || [];

    return NextResponse.json({
      userId: user.id,
      totalItems: wishlistItems?.length || 0,
      obsoleteFound: obsoleteItems.length,
      obsoleteItems: obsoleteItems.map(item => ({
        id: item.id,
        product_id: item.product_id,
        created_at: item.created_at
      }))
    });

  } catch (error) {
    console.error('Error en GET /api/wishlist/clean:', error);
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}
