import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

// Función para crear cliente de Supabase con credenciales anónimas
function createSupabaseClient() {
  // Intentar obtener las variables de entorno de diferentes formas
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  console.log('🔍 [DEBUG] Environment variables check:', {
    hasUrl: !!supabaseUrl,
    hasAnonKey: !!supabaseAnonKey,
    urlPrefix: supabaseUrl ? supabaseUrl.substring(0, 20) + '...' : 'null',
    keyPrefix: supabaseAnonKey ? supabaseAnonKey.substring(0, 20) + '...' : 'null',
    allEnvKeys: Object.keys(process.env).filter(k => k.includes('SUPABASE'))
  });

  // Verificar si las variables están definidas
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Missing Supabase credentials:', {
      hasUrl: !!supabaseUrl,
      hasAnonKey: !!supabaseAnonKey,
      envKeys: Object.keys(process.env).filter(k => k.includes('SUPABASE'))
    });
    
    // Intentar usar valores hardcoded como último recurso
    const fallbackUrl = 'https://gxqkmaaqoehydulksudj.supabase.co';
    const fallbackKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd4cWttYWFxb2VoeWR1bGtzdWRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI0NDI5NDQsImV4cCI6MjA3ODAxODk0NH0.XAR-ysQgt0ZkRZfIZx_DvpYMzmEMFsdAYK3EP1tc0mw';
    
    console.warn('⚠️ Using fallback Supabase credentials');
    
    return createClient(
      fallbackUrl,
      fallbackKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );
  }

  return createClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );
}

// GET - List all categories (admin puede ver todas, público solo activas)
export async function GET(request: NextRequest) {
  console.log('🔄 [API Categories] GET request received');
  console.log('🔍 [API Categories] Request headers:', Object.fromEntries(request.headers.entries()));

  try {
    const { searchParams } = new URL(request.url);
    const includeInactive = searchParams.get('includeInactive') === 'true';

    console.log('📡 [API Categories] Creating Supabase client...');
    const supabase = createSupabaseClient();
    console.log('✅ [API Categories] Supabase client created successfully');

    console.log('🔍 [API Categories] Querying categories table...');
    let query = supabase
      .from('categories')
      .select('id, name, slug, description, image_url, is_active, sort_order, created_at, updated_at');

    // Solo filtrar por is_active si no se solicita incluir inactivas
    if (!includeInactive) {
      query = query.eq('is_active', true);
    }

    query = query.order('sort_order', { ascending: true });

    const { data, error } = await query;

    console.log('📊 [API Categories] Query result:', {
      dataLength: data?.length || 0,
      error: error ? error.message : null
    });

    if (error) {
      console.error('❌ API: Error fetching categories:', error);
      return NextResponse.json(
        { error: 'Error al cargar categorías', success: false },
        { status: 500 }
      );
    }

    console.log('✅ [API Categories] Categories fetched successfully:', data?.length || 0);
    return NextResponse.json({
      success: true,
      categories: data || []
    });

  } catch (error) {
    console.error('❌ API: Unexpected error:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor', success: false },
      { status: 500 }
    );
  }
}

// POST - Create new category
export async function POST(request: NextRequest) {
  console.log('🔄 [API Categories] POST request received');

  try {
    const supabase = createSupabaseClient();
    const body = await request.json();

    const { name, slug, description, image_url, is_active = true, sort_order = 0 } = body;

    // Validar campos requeridos
    if (!name || !slug) {
      return NextResponse.json(
        { error: 'Nombre y slug son requeridos', success: false },
        { status: 400 }
      );
    }

    console.log('📝 [API Categories] Creating category:', { name, slug });

    const { data, error } = await supabase
      .from('categories')
      .insert({
        name,
        slug,
        description,
        image_url,
        is_active,
        sort_order,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('❌ API: Error creating category:', error);
      return NextResponse.json(
        { error: `Error al crear categoría: ${error.message}`, success: false },
        { status: 500 }
      );
    }

    console.log('✅ [API Categories] Category created successfully:', data);
    return NextResponse.json({
      success: true,
      category: data
    }, { status: 201 });

  } catch (error) {
    console.error('❌ API: Unexpected error:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor', success: false },
      { status: 500 }
    );
  }
}

// PATCH - Update category
export async function PATCH(request: NextRequest) {
  console.log('🔄 [API Categories] PATCH request received');

  try {
    const supabase = createSupabaseClient();
    const body = await request.json();

    const { id, name, slug, description, image_url, is_active, sort_order } = body;

    // Validar ID
    if (!id) {
      return NextResponse.json(
        { error: 'ID de categoría requerido', success: false },
        { status: 400 }
      );
    }

    console.log('📝 [API Categories] Updating category:', { id, name });

    // Construir objeto de actualización solo con campos proporcionados
    const updates: any = {
      updated_at: new Date().toISOString()
    };

    if (name !== undefined) updates.name = name;
    if (slug !== undefined) updates.slug = slug;
    if (description !== undefined) updates.description = description;
    if (image_url !== undefined) updates.image_url = image_url;
    if (is_active !== undefined) updates.is_active = is_active;
    if (sort_order !== undefined) updates.sort_order = sort_order;

    const { data, error } = await supabase
      .from('categories')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('❌ API: Error updating category:', error);
      return NextResponse.json(
        { error: `Error al actualizar categoría: ${error.message}`, success: false },
        { status: 500 }
      );
    }

    console.log('✅ [API Categories] Category updated successfully:', data);
    return NextResponse.json({
      success: true,
      category: data
    });

  } catch (error) {
    console.error('❌ API: Unexpected error:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor', success: false },
      { status: 500 }
    );
  }
}

// DELETE - Delete category
export async function DELETE(request: NextRequest) {
  console.log('🔄 [API Categories] DELETE request received');

  try {
    const supabase = createSupabaseClient();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    // Validar ID
    if (!id) {
      return NextResponse.json(
        { error: 'ID de categoría requerido', success: false },
        { status: 400 }
      );
    }

    console.log('🗑️ [API Categories] Deleting category:', id);

    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('❌ API: Error deleting category:', error);
      return NextResponse.json(
        { error: `Error al eliminar categoría: ${error.message}`, success: false },
        { status: 500 }
      );
    }

    console.log('✅ [API Categories] Category deleted successfully');
    return NextResponse.json({
      success: true,
      message: 'Categoría eliminada exitosamente'
    });

  } catch (error) {
    console.error('❌ API: Unexpected error:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor', success: false },
      { status: 500 }
    );
  }
}
