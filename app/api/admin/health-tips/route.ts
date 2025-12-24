import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';
import type { CreateHealthTipRequest, TipStatus, TipCategory } from '@/lib/types/recipes';

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
    const decoded = jwt.verify(token, jwtSecret) as { id: string; type: string };

    if (decoded.type !== 'admin') {
      return { success: false, error: 'Token inválido' };
    }

    return { success: true, adminId: decoded.id };
  } catch {
    return { success: false, error: 'Token expirado o inválido' };
  }
}

// GET - List health tips
export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAdminAuth(request);
    if (!auth.success) {
      return NextResponse.json({ error: auth.error, success: false }, { status: 401 });
    }

    const supabase = getSupabaseClient();
    const { searchParams } = new URL(request.url);

    const page = parseInt(searchParams.get('page') || '1');
    const perPage = parseInt(searchParams.get('per_page') || '20');
    const status = searchParams.get('status') as TipStatus | null;
    const category = searchParams.get('category') as TipCategory | null;
    const search = searchParams.get('search');
    const featured = searchParams.get('featured');

    const offset = (page - 1) * perPage;

    let query = supabase
      .from('health_tips')
      .select('*', { count: 'exact' });

    if (status) {
      query = query.eq('status', status);
    }
    if (category) {
      query = query.eq('category', category);
    }
    if (featured === 'true') {
      query = query.eq('featured', true);
    }
    if (search) {
      query = query.or(`title_es.ilike.%${search}%,title_en.ilike.%${search}%,content_es.ilike.%${search}%`);
    }

    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + perPage - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching health tips:', error);
      return NextResponse.json({ error: 'Error al cargar tips', success: false }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      tips: data || [],
      total: count || 0,
      page,
      per_page: perPage
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Error interno del servidor', success: false }, { status: 500 });
  }
}

// POST - Create new health tip
export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAdminAuth(request);
    if (!auth.success) {
      return NextResponse.json({ error: auth.error, success: false }, { status: 401 });
    }

    const supabase = getSupabaseClient();
    const body: CreateHealthTipRequest = await request.json();

    if (!body.title_es || !body.content_es) {
      return NextResponse.json({ error: 'Título y contenido en español son requeridos', success: false }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('health_tips')
      .insert({
        title_es: body.title_es,
        title_en: body.title_en,
        content_es: body.content_es,
        content_en: body.content_en,
        category: body.category || 'general',
        tags: body.tags || [],
        related_product_id: body.related_product_id,
        related_recipe_id: body.related_recipe_id,
        icon: body.icon || 'lightbulb',
        color: body.color || 'verde-aguacate',
        status: 'draft',
        created_by: auth.adminId
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating health tip:', error);
      return NextResponse.json({ error: `Error al crear tip: ${error.message}`, success: false }, { status: 500 });
    }

    return NextResponse.json({ success: true, tip: data }, { status: 201 });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Error interno del servidor', success: false }, { status: 500 });
  }
}

// PATCH - Update health tip
export async function PATCH(request: NextRequest) {
  try {
    const auth = await verifyAdminAuth(request);
    if (!auth.success) {
      return NextResponse.json({ error: auth.error, success: false }, { status: 401 });
    }

    const supabase = getSupabaseClient();
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID de tip requerido', success: false }, { status: 400 });
    }

    // If publishing, set published_at
    if (updates.status === 'published') {
      updates.published_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('health_tips')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating health tip:', error);
      return NextResponse.json({ error: `Error al actualizar tip: ${error.message}`, success: false }, { status: 500 });
    }

    return NextResponse.json({ success: true, tip: data });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Error interno del servidor', success: false }, { status: 500 });
  }
}

// DELETE - Delete health tip
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
      return NextResponse.json({ error: 'ID de tip requerido', success: false }, { status: 400 });
    }

    const { error } = await supabase
      .from('health_tips')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting health tip:', error);
      return NextResponse.json({ error: `Error al eliminar tip: ${error.message}`, success: false }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Tip eliminado exitosamente' });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Error interno del servidor', success: false }, { status: 500 });
  }
}
