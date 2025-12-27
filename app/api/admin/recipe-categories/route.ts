import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';

export const dynamic = 'force-dynamic';

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

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

async function verifyAdminAuth(request: NextRequest): Promise<{ success: boolean; adminId?: string; error?: string }> {
  try {
    const token = request.cookies.get('admin-token')?.value;

    if (!token) {
      return { success: false, error: 'No autenticado' };
    }

    const jwtSecret = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
    const decoded = jwt.verify(token, jwtSecret) as any;

    if (decoded.type !== 'admin') {
      return { success: false, error: 'Token inválido' };
    }

    return { success: true, adminId: decoded.id };
  } catch (error) {
    return { success: false, error: 'Token expirado o inválido' };
  }
}

// GET - List all recipe categories
export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    const { searchParams } = new URL(request.url);
    const includeInactive = searchParams.get('includeInactive') === 'true';

    let query = supabase
      .from('recipe_categories')
      .select('*')
      .order('sort_order', { ascending: true });

    if (!includeInactive) {
      query = query.eq('is_active', true);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: 'Error al cargar categorías', success: false }, { status: 500 });
    }

    return NextResponse.json({ success: true, categories: data || [] });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Error interno del servidor', success: false }, { status: 500 });
  }
}

// POST - Create new recipe category
export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAdminAuth(request);
    if (!auth.success) {
      return NextResponse.json({ error: auth.error, success: false }, { status: 401 });
    }

    const supabase = getSupabaseClient();
    const body = await request.json();
    const { name, slug, description, icon, color, image_url, is_active = true, sort_order = 0 } = body;

    if (!name || !slug) {
      return NextResponse.json({ error: 'Nombre y slug son requeridos', success: false }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('recipe_categories')
      .insert({
        name,
        slug,
        description,
        icon,
        color,
        image_url,
        is_active,
        sort_order,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: `Error al crear categoría: ${error.message}`, success: false }, { status: 500 });
    }

    return NextResponse.json({ success: true, category: data }, { status: 201 });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Error interno del servidor', success: false }, { status: 500 });
  }
}

// PATCH - Update recipe category
export async function PATCH(request: NextRequest) {
  try {
    const auth = await verifyAdminAuth(request);
    if (!auth.success) {
      return NextResponse.json({ error: auth.error, success: false }, { status: 401 });
    }

    const supabase = getSupabaseClient();
    const body = await request.json();
    const { id, name, slug, description, icon, color, image_url, is_active, sort_order } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID de categoría requerido', success: false }, { status: 400 });
    }

    const updates: any = { updated_at: new Date().toISOString() };
    if (name !== undefined) updates.name = name;
    if (slug !== undefined) updates.slug = slug;
    if (description !== undefined) updates.description = description;
    if (icon !== undefined) updates.icon = icon;
    if (color !== undefined) updates.color = color;
    if (image_url !== undefined) updates.image_url = image_url;
    if (is_active !== undefined) updates.is_active = is_active;
    if (sort_order !== undefined) updates.sort_order = sort_order;

    const { data, error } = await supabase
      .from('recipe_categories')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: `Error al actualizar categoría: ${error.message}`, success: false }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: 'Categoría no encontrada', success: false }, { status: 404 });
    }

    return NextResponse.json({ success: true, category: data });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Error interno del servidor', success: false }, { status: 500 });
  }
}

// DELETE - Delete recipe category
export async function DELETE(request: NextRequest) {
  try {
    const auth = await verifyAdminAuth(request);
    if (!auth.success) {
      return NextResponse.json({ error: auth.error, success: false }, { status: 401 });
    }

    const supabase = getSupabaseClient();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID de categoría requerido', success: false }, { status: 400 });
    }

    const { error } = await supabase
      .from('recipe_categories')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: `Error al eliminar categoría: ${error.message}`, success: false }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Categoría eliminada exitosamente' });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Error interno del servidor', success: false }, { status: 500 });
  }
}
