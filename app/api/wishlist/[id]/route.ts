import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { createSupabaseRequestClient, extractBearerToken } from '@/lib/supabaseRequestClient';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// OPTIONS - Manejar solicitudes CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization, Cookie, Set-Cookie',
      'Access-Control-Allow-Credentials': 'true',
    },
  });
}

// DELETE - Eliminar un producto de favoritos
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  console.log('[WISHLIST-API] DELETE: Request received');

  try {
    // Verificar autenticacion
    const authHeader = request.headers.get('authorization');
    const token = extractBearerToken(authHeader);

    if (!token) {
      console.log('[WISHLIST-API] DELETE: No valid authorization header');
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    // Verificar que el token es valido
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      console.log('[WISHLIST-API] DELETE: Invalid token', authError?.message);
      return NextResponse.json(
        { error: 'Token invalido' },
        { status: 401 }
      );
    }

    console.log('[WISHLIST-API] DELETE: User authenticated:', user.id);

    // Crear cliente scoped al usuario para RLS
    const sb = createSupabaseRequestClient(token);

    const { id: productId } = await params;
    console.log('[WISHLIST-API] DELETE: Removing product', productId, 'for user', user.id);

    if (!productId) {
      console.log('[WISHLIST-API] DELETE: Missing productId');
      return NextResponse.json(
        { error: 'El ID del producto es requerido' },
        { status: 400 }
      );
    }

    // Verificar si el producto esta en favoritos del usuario (usando cliente scoped)
    const { data: existingItem, error: checkError } = await sb
      .from('wishlist')
      .select('id')
      .eq('user_id', user.id)
      .eq('product_id', productId)
      .maybeSingle();

    if (checkError) {
      console.error('[WISHLIST-API] DELETE: Error checking item:', checkError.code, checkError.message);
      return NextResponse.json(
        { error: 'Error al verificar favoritos', code: checkError.code },
        { status: 500 }
      );
    }

    if (!existingItem) {
      console.log('[WISHLIST-API] DELETE: Product not found in wishlist', productId);
      return NextResponse.json(
        { error: 'El producto no esta en favoritos' },
        { status: 404 }
      );
    }

    console.log('[WISHLIST-API] DELETE: Found wishlist item', existingItem.id, 'deleting...');

    // Eliminar de favoritos (usando cliente scoped para que RLS funcione)
    // Usamos tanto user_id como product_id para garantizar seguridad incluso sin RLS
    const { error } = await sb
      .from('wishlist')
      .delete()
      .eq('user_id', user.id)
      .eq('product_id', productId);

    if (error) {
      console.error('[WISHLIST-API] DELETE: Error removing item:', error.code, error.message);
      return NextResponse.json(
        { error: 'Error al eliminar de favoritos', code: error.code },
        { status: 500 }
      );
    }

    console.log('[WISHLIST-API] DELETE: Successfully removed product from wishlist:', productId);
    return NextResponse.json({
      success: true,
      message: 'Producto eliminado de favoritos correctamente'
    });

  } catch (error) {
    console.error('[WISHLIST-API] DELETE: Server error:', error);
    return NextResponse.json(
      { error: 'Error del servidor' },
      { status: 500 }
    );
  }
}
