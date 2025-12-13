import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { createSupabaseRequestClient, extractBearerToken } from '@/lib/supabaseRequestClient';
import { getProducts } from '@/lib/productStorage';

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

    // Primero obtenemos los items del wishlist
    const { data: wishlistItems, error: wishlistError } = await sb
      .from('wishlist')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (wishlistError) {
      console.error('[WISHLIST-API] GET: Error fetching wishlist:', wishlistError.code, wishlistError.message);
      return NextResponse.json(
        { error: 'Error al obtener favoritos', code: wishlistError.code },
        { status: 500 }
      );
    }

    // Si no hay items, retornamos array vacío
    if (!wishlistItems || wishlistItems.length === 0) {
      console.log('[WISHLIST-API] GET: No items found');
      return NextResponse.json({
        success: true,
        data: []
      });
    }

    // Obtenemos los IDs de productos
    const productIds = wishlistItems.map(item => item.product_id);

    // Obtenemos los productos desde productStorage (carga del JSON)
    let products = [];
    try {
      const allProducts = await getProducts();
      products = allProducts.filter(p => productIds.includes(p.id));
      console.log('[WISHLIST-API] GET: Loaded', products.length, 'products from productStorage');
    } catch (error) {
      console.error('[WISHLIST-API] GET: Error loading products from storage:', error);
      // Continuar sin product data
    }

    // Combinamos wishlist items con product data
    const wishlistWithProducts = wishlistItems.map(item => ({
      ...item,
      product: products.find(p => p.id === item.product_id) || null
    }));

    console.log('[WISHLIST-API] GET: Returning', wishlistWithProducts.length, 'items with product data');
    return NextResponse.json({
      success: true,
      data: wishlistWithProducts
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

    // Verificar que el producto existe (opcional - permitir productos locales)
    const { data: product, error: productError } = await sb
      .from('products')
      .select('id')
      .eq('id', product_id)
      .maybeSingle();

    if (productError && productError.code !== 'PGRST116') {
      // Solo loguear error si no es "no rows returned"
      console.log('[WISHLIST-API] POST: Error checking product:', productError.message);
    }

    if (!product) {
      console.log('[WISHLIST-API] POST: Product not in Supabase, but allowing anyway:', product_id);
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
    const { data: newItem, error } = await sb
      .from('wishlist')
      .insert({
        user_id: user.id,
        product_id
      })
      .select('*')
      .single();

    if (error) {
      console.error('[WISHLIST-API] POST: Error inserting wishlist item:', error.code, error.message);
      return NextResponse.json(
        { error: 'Error al agregar a favoritos', code: error.code, details: error.message },
        { status: 500 }
      );
    }

    // Obtener los datos del producto desde productStorage (carga del JSON)
    let productData = null;
    try {
      const allProducts = await getProducts();
      productData = allProducts.find(p => p.id === product_id) || null;
      console.log('[WISHLIST-API] POST: Product data loaded from storage:', productData ? 'found' : 'not found');
    } catch (error) {
      console.error('[WISHLIST-API] POST: Error loading product from storage:', error);
    }

    // Combinar datos
    const itemWithProduct = {
      ...newItem,
      product: productData
    };

    console.log('[WISHLIST-API] POST: Successfully added product to wishlist:', newItem?.id);
    return NextResponse.json({
      success: true,
      data: itemWithProduct
    }, { status: 201 });

  } catch (error) {
    console.error('[WISHLIST-API] POST: Server error:', error);
    return NextResponse.json(
      { error: 'Error del servidor' },
      { status: 500 }
    );
  }
}
