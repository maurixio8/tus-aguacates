import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { createSupabaseRequestClient, extractBearerToken } from '@/lib/supabaseRequestClient';

export const dynamic = 'force-dynamic';

// GET - Obtener favoritos del usuario
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = extractBearerToken(authHeader);

    if (!token) {
      console.log('[WISHLIST-API] GET: No valid authorization header');
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    // Verificar que el token es valido
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      console.log('[WISHLIST-API] GET: Invalid token', authError?.message);
      return NextResponse.json(
        { error: 'Token invalido' },
        { status: 401 }
      );
    }

    console.log('[WISHLIST-API] GET: User authenticated:', user.id);

    // Crear cliente scoped al usuario para RLS
    const sb = createSupabaseRequestClient(token);

    const { data, error } = await sb
      .from('wishlist')
      .select('*, product:products(*)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[WISHLIST-API] GET: Error fetching wishlist:', error.code, error.message);
      return NextResponse.json(
        { error: 'Error al obtener favoritos', code: error.code },
        { status: 500 }
      );
    }

    console.log('[WISHLIST-API] GET: Returning', data?.length || 0, 'items');
    return NextResponse.json({
      success: true,
      data: data || []
    });

  } catch (error) {
    console.error('[WISHLIST-API] GET: Server error:', error);
    return NextResponse.json(
      { error: 'Error del servidor' },
      { status: 500 }
    );
  }
}

// POST - Agregar a favoritos
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = extractBearerToken(authHeader);

    if (!token) {
      console.log('[WISHLIST-API] POST: No valid authorization header');
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    // Verificar que el token es valido
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      console.log('[WISHLIST-API] POST: Invalid token', authError?.message);
      return NextResponse.json(
        { error: 'Token invalido' },
        { status: 401 }
      );
    }

    console.log('[WISHLIST-API] POST: User authenticated:', user.id);

    // Crear cliente scoped al usuario para RLS
    const sb = createSupabaseRequestClient(token);

    let body;
    try {
      body = await request.json();
    } catch {
      console.log('[WISHLIST-API] POST: Invalid JSON body');
      return NextResponse.json(
        { error: 'Cuerpo de la solicitud invalido' },
        { status: 400 }
      );
    }

    const { product_id } = body;

    if (!product_id) {
      console.log('[WISHLIST-API] POST: Missing product_id');
      return NextResponse.json(
        { error: 'El ID del producto es requerido' },
        { status: 400 }
      );
    }

    console.log('[WISHLIST-API] POST: Adding product', product_id, 'for user', user.id);

    // Verificar que el producto existe (usando cliente scoped)
    const { data: product, error: productError } = await sb
      .from('products')
      .select('id')
      .eq('id', product_id)
      .single();

    if (productError || !product) {
      console.log('[WISHLIST-API] POST: Product not found', product_id);
      return NextResponse.json(
        { error: 'Producto no encontrado' },
        { status: 404 }
      );
    }

    // Verificar si ya existe en wishlist del usuario (usando cliente scoped)
    const { data: existingItem, error: checkError } = await sb
      .from('wishlist')
      .select('id')
      .eq('user_id', user.id)
      .eq('product_id', product_id)
      .maybeSingle();

    if (checkError) {
      console.error('[WISHLIST-API] POST: Error checking existing item:', checkError.code, checkError.message);
      return NextResponse.json(
        { error: 'Error al verificar favoritos', code: checkError.code },
        { status: 500 }
      );
    }

    if (existingItem) {
      console.log('[WISHLIST-API] POST: Product already in wishlist', product_id);
      return NextResponse.json(
        { error: 'El producto ya esta en favoritos' },
        { status: 409 }
      );
    }

    // Insertar en wishlist (usando cliente scoped para que RLS funcione con auth.uid())
    const { data, error } = await sb
      .from('wishlist')
      .insert({
        user_id: user.id,
        product_id
      })
      .select('*, product:products(*)')
      .single();

    if (error) {
      console.error('[WISHLIST-API] POST: Error inserting wishlist item:', error.code, error.message);
      return NextResponse.json(
        { error: 'Error al agregar a favoritos', code: error.code, details: error.message },
        { status: 500 }
      );
    }

    console.log('[WISHLIST-API] POST: Successfully added product to wishlist:', data?.id);
    return NextResponse.json({
      success: true,
      data
    }, { status: 201 });

  } catch (error) {
    console.error('[WISHLIST-API] POST: Server error:', error);
    return NextResponse.json(
      { error: 'Error del servidor' },
      { status: 500 }
    );
  }
}
