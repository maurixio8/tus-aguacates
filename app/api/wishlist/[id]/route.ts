import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// OPTIONS - Manejar solicitudes CORS
export async function OPTIONS(request: NextRequest) {
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
  console.log('🔍 [WISHLIST-API] DELETE request received');
  
  try {
    // Verificar autenticación
    const authHeader = request.headers.get('authorization');
    console.log('🔐 [WISHLIST-API] Auth header present:', !!authHeader);
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('❌ [WISHLIST-API] No valid authorization header in DELETE');
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const token = authHeader.split(' ')[1];
    console.log('🔑 [WISHLIST-API] Verifying token in DELETE...');
    
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      console.error('❌ [WISHLIST-API] Auth error in DELETE:', authError);
      return NextResponse.json(
        { error: 'Token inválido' },
        { status: 401 }
      );
    }

    console.log('✅ [WISHLIST-API] User authenticated in DELETE:', user.id);

    const { id: productId } = await params;
    console.log('🗑️ [WISHLIST-API] Deleting product from wishlist:', productId);

    if (!productId) {
      console.log('❌ [WISHLIST-API] No productId provided in DELETE');
      return NextResponse.json(
        { error: 'El ID del producto es requerido' },
        { status: 400 }
      );
    }

    console.log('🔍 [WISHLIST-API] Checking if product exists in wishlist:', productId);

    // Verificar si el producto está en favoritos del usuario
    const { data: existingItem, error: checkError } = await supabase
      .from('wishlist')
      .select('id')
      .eq('user_id', user.id)
      .eq('product_id', productId)
      .single();

    if (checkError || !existingItem) {
      console.log('❌ [WISHLIST-API] Product not found in wishlist:', checkError);
      return NextResponse.json(
        { error: 'El producto no está en favoritos' },
        { status: 404 }
      );
    }

    console.log('✅ [WISHLIST-API] Product found in wishlist, deleting...');

    // Eliminar de favoritos
    const { error } = await supabase
      .from('wishlist')
      .delete()
      .eq('user_id', user.id)
      .eq('product_id', productId);

    if (error) {
      console.error('❌ [WISHLIST-API] Error removing from wishlist:', error);
      return NextResponse.json(
        { error: 'Error al eliminar de favoritos' },
        { status: 500 }
      );
    }

    console.log('✅ [WISHLIST-API] Product removed from wishlist successfully:', productId);
    
    return NextResponse.json({
      success: true,
      message: 'Producto eliminado de favoritos correctamente'
    });

  } catch (error) {
    console.error('❌ [WISHLIST-API] Error in wishlist DELETE:', error);
    return NextResponse.json(
      { error: 'Error del servidor' },
      { status: 500 }
    );
  }
}