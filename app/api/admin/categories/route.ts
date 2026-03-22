import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAdminRole } from '@/lib/auth-admin';

export const dynamic = 'force-dynamic';

// Create Supabase client with service role key for admin operations
function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase configuration');
  }

  return createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

// GET - List all categories
export async function GET(request: NextRequest) {
  try {
    const adminAccess = await requireAdminRole(request, 'viewer');
    if (adminAccess.response) {
      return adminAccess.response;
    }

    const supabase = getSupabaseClient();
    const { searchParams } = new URL(request.url);
    const includeInactive = searchParams.get('includeInactive') === 'true';

    let query = supabase
      .from('categories')
      .select('*')
      .order('sort_order', { ascending: true });

    if (!includeInactive) {
      query = query.eq('is_active', true);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching categories:', error);
      return NextResponse.json({ error: 'Error al cargar categorías', success: false }, { status: 500 });
    }

    return NextResponse.json({ success: true, categories: data || [] });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Error interno del servidor', success: false }, { status: 500 });
  }
}

// POST - Create new category
export async function POST(request: NextRequest) {
  try {
    const adminAccess = await requireAdminRole(request, 'admin');
    if (adminAccess.response) {
      return adminAccess.response;
    }

    const supabase = getSupabaseClient();
    const body = await request.json();
    const { name, slug, description, image_url, is_active = true, sort_order = 0 } = body;

    if (!name || !slug) {
      return NextResponse.json({ error: 'Nombre y slug son requeridos', success: false }, { status: 400 });
    }

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
      console.error('Error creating category:', error);
      return NextResponse.json({ error: `Error al crear categoría: ${error.message}`, success: false }, { status: 500 });
    }

    return NextResponse.json({ success: true, category: data }, { status: 201 });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Error interno del servidor', success: false }, { status: 500 });
  }
}

// PATCH - Update category
export async function PATCH(request: NextRequest) {
  try {
    const adminAccess = await requireAdminRole(request, 'admin');
    if (adminAccess.response) {
      return adminAccess.response;
    }

    const supabase = getSupabaseClient();
    const body = await request.json();
    const { id, name, slug, description, image_url, is_active, sort_order } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID de categoría requerido', success: false }, { status: 400 });
    }

    // Build update object with only provided fields
    const updates: any = { updated_at: new Date().toISOString() };
    if (name !== undefined) updates.name = name;
    if (slug !== undefined) updates.slug = slug;
    if (description !== undefined) updates.description = description;
    if (image_url !== undefined) updates.image_url = image_url;
    if (is_active !== undefined) updates.is_active = is_active;
    if (sort_order !== undefined) updates.sort_order = sort_order;

    console.log('Updating category:', { id, updates });

    const { data, error } = await supabase
      .from('categories')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating category:', error);
      return NextResponse.json({ error: `Error al actualizar categoría: ${error.message}`, success: false }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: 'Categoría no encontrada', success: false }, { status: 404 });
    }

    console.log('Category updated successfully:', data);
    return NextResponse.json({ success: true, category: data });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Error interno del servidor', success: false }, { status: 500 });
  }
}

// DELETE - Delete category
export async function DELETE(request: NextRequest) {
  try {
    const adminAccess = await requireAdminRole(request, 'super_admin');
    if (adminAccess.response) {
      return adminAccess.response;
    }

    const supabase = getSupabaseClient();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID de categoría requerido', success: false }, { status: 400 });
    }

    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting category:', error);
      return NextResponse.json({ error: `Error al eliminar categoría: ${error.message}`, success: false }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Categoría eliminada exitosamente' });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Error interno del servidor', success: false }, { status: 500 });
  }
}
