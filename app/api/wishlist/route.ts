import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// OPTIONS - Manejar solicitudes CORS
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization, Cookie, Set-Cookie',
      'Access-Control-Allow-Credentials': 'true',
    },
  });
}

// GET - Obtener todos los favoritos del usuario
export async function GET(request: NextRequest) {
  console.log('🔍 [WISHLIST-API] GET request received');
  
  try {
    // Verificar autenticación
    const authHeader = request.headers.get('authorization');
    console.log('🔐 [WISHLIST-API] Auth header present:', !!authHeader);
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('❌ [WISHLIST-API] No valid authorization header');
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const token = authHeader.split(' ')[1];
    console.log('🔑 [WISHLIST-API] Verifying token...');
    
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      console.error('❌ [WISHLIST-API] Auth error:', authError);
      return NextResponse.json(
        { error: 'Token inválido' },
        { status: 401 }
      );
    }

    console.log('✅ [WISHLIST-API] User authenticated:', user.id);

    // Obtener favoritos del usuario
    console.log('📊 [WISHLIST-API] Fetching wishlist for user:', user.id);
    const { data, error } = await supabase
      .from('wishlist')
      .select(`
        *,
        product:products(*)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ [WISHLIST-API] Error fetching wishlist:', error);
      return NextResponse.json(
        { error: 'Error al obtener favoritos' },
        { status: 500 }
      );
    }

    console.log('✅ [WISHLIST-API] Wishlist fetched successfully:', data?.length || 0, 'items');
    
    return NextResponse.json({
      success: true,
      data: data || []
    });

  } catch (error) {
    console.error('❌ [WISHLIST-API] Error in wishlist GET:', error);
    return NextResponse.json(
      { error: 'Error del servidor' },
      { status: 500 }
    );
  }
}

// POST - Agregar un producto a favoritos
export async function POST(request: NextRequest) {
  console.log('🔍 [WISHLIST-API] POST request received');
  
  try {
    // Verificar autenticación
    const authHeader = request.headers.get('authorization');
    console.log('🔐 [WISHLIST-API] Auth header present:', !!authHeader);
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('❌ [WISHLIST-API] No valid authorization header in POST');
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const token = authHeader.split(' ')[1];
    console.log('🔑 [WISHLIST-API] Verifying token in POST...');
    
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      console.error('❌ [WISHLIST-API] Auth error in POST:', authError);
      return NextResponse.json(
        { error: 'Token inválido' },
        { status: 401 }
      );
    }

    console.log('✅ [WISHLIST-API] User authenticated in POST:', user.id);

    // Obtener datos del request
    const body = await request.json();
    console.log('📝 [WISHLIST-API] Request body:', body);
    
    const { product_id } = body;

    if (!product_id) {
      console.log('❌ [WISHLIST-API] No product_id provided');
      return NextResponse.json(
        { error: 'El ID del producto es requerido' },
        { status: 400 }
      );
    }

    console.log('🔍 [WISHLIST-API] Checking if product exists:', product_id);
    
    // Verificar que el producto existe
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('id')
      .eq('id', product_id)
      .single();

    if (productError || !product) {
      console.error('❌ [WISHLIST-API] Product not found:', productError);
      return NextResponse.json(
        { error: 'Producto no encontrado' },
        { status: 404 }
      );
    }

    console.log('✅ [WISHLIST-API] Product exists, checking if already in wishlist');

    // Verificar si ya está en favoritos
    const { data: existingItem } = await supabase
      .from('wishlist')
      .select('id')
      .eq('user_id', user.id)
      .eq('product_id', product_id)
      .single();

    if (existingItem) {
      console.log('⚠️ [WISHLIST-API] Product already in wishlist:', product_id);
      return NextResponse.json(
        { error: 'El producto ya está en favoritos' },
        { status: 409 }
      );
    }

    console.log('📝 [WISHLIST-API] Adding product to wishlist:', product_id);

    // Agregar a favoritos
    const { data, error } = await supabase
      .from('wishlist')
      .insert({
        user_id: user.id,
        product_id
      })
      .select(`
        *,
        product:products(*)
      `)
      .single();

    if (error) {
      console.error('❌ [WISHLIST-API] Error adding to wishlist:', error);
      return NextResponse.json(
        { error: 'Error al agregar a favoritos' },
        { status: 500 }
      );
    }

    console.log('✅ [WISHLIST-API] Product added to wishlist successfully:', data);
    
    return NextResponse.json({
      success: true,
      data
    });

  } catch (error) {
    console.error('❌ [WISHLIST-API] Error in wishlist POST:', error);
    return NextResponse.json(
      { error: 'Error del servidor' },
      { status: 500 }
    );
  }
}