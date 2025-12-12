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
  try {
    // Verificar autenticación
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const token = authHeader.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Token inválido' },
        { status: 401 }
      );
    }

    const { id: productId } = await params;

    if (!productId) {
      return NextResponse.json(
        { error: 'El ID del producto es requerido' },
        { status: 400 }
      );
    }

    // Verificar si el producto está en favoritos del usuario
    const { data: existingItem, error: checkError } = await supabase
      .from('wishlist')
      .select('id')
      .eq('user_id', user.id)
      .eq('product_id', productId)
      .single();

    if (checkError || !existingItem) {
      return NextResponse.json(
        { error: 'El producto no está en favoritos' },
        { status: 404 }
      );
    }

    // Eliminar de favoritos
    const { error } = await supabase
      .from('wishlist')
      .delete()
      .eq('user_id', user.id)
      .eq('product_id', productId);

    if (error) {
      console.error('Error removing from wishlist:', error);
      return NextResponse.json(
        { error: 'Error al eliminar de favoritos' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Producto eliminado de favoritos correctamente'
    });

  } catch (error) {
    console.error('Error in wishlist DELETE:', error);
    return NextResponse.json(
      { error: 'Error del servidor' },
      { status: 500 }
    );
  }
}