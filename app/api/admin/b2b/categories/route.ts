/**
 * API Routes para gestión admin de Categorías B2B
 * "Tus Aguacates" - Panel de Administración
 */

import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * GET /api/admin/b2b/categories
 * Obtiene lista de categorías B2B
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (id) {
      const { data: category, error } = await supabase
        .from('b2b_categories')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) {
        return NextResponse.json(
          { success: false, error: { message: error.message, code: 'DB_ERROR' } },
          { status: 500 }
        );
      }

      if (!category) {
        return NextResponse.json(
          { success: false, error: { message: 'Categoría no encontrada', code: 'NOT_FOUND' } },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        data: category,
      });
    }

    const { data: categories, error } = await supabase
      .from('b2b_categories')
      .select('*')
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('Error fetching B2B categories:', error);
      return NextResponse.json(
        { success: false, error: { message: 'Error al obtener categorías', code: 'DB_ERROR' } },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: categories || [],
    });
  } catch (error) {
    console.error('Error in admin B2B categories GET API:', error);
    return NextResponse.json(
      { success: false, error: { message: 'Error interno del servidor', code: 'INTERNAL_ERROR' } },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/b2b/categories
 * Crea una nueva categoría B2B
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = await request.json();

    if (!body.name) {
      return NextResponse.json(
        { success: false, error: { message: 'Nombre de categoría es requerido', code: 'VALIDATION_ERROR' } },
        { status: 400 }
      );
    }

    const { data: category, error } = await supabase
      .from('b2b_categories')
      .insert({
        name: body.name,
        slug: body.slug || body.name.toLowerCase().replace(/\s+/g, '-'),
        description: body.description || null,
        image_url: body.image_url || null,
        icon: body.icon || null,
        parent_id: body.parent_id || null,
        sort_order: body.sort_order || 0,
        is_active: body.is_active !== undefined ? body.is_active : true,
        metadata: body.metadata || {},
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating B2B category:', error);
      return NextResponse.json(
        { success: false, error: { message: error.message, code: 'DB_ERROR' } },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: category,
    }, { status: 201 });
  } catch (error) {
    console.error('Error in admin B2B categories POST API:', error);
    return NextResponse.json(
      { success: false, error: { message: 'Error interno del servidor', code: 'INTERNAL_ERROR' } },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/b2b/categories
 * Actualiza una categoría B2B
 */
export async function PATCH(request: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: { message: 'ID de la categoría es requerido', code: 'VALIDATION_ERROR' } },
        { status: 400 }
      );
    }

    const body = await request.json();

    const allowedFields = ['name', 'slug', 'description', 'image_url', 'icon', 'parent_id', 'sort_order', 'is_active', 'metadata'];

    const updateData: any = {};
    allowedFields.forEach(field => {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    });

    const { data: category, error } = await supabase
      .from('b2b_categories')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating B2B category:', error);
      return NextResponse.json(
        { success: false, error: { message: error.message, code: 'DB_ERROR' } },
        { status: 400 }
      );
    }

    if (!category) {
      return NextResponse.json(
        { success: false, error: { message: 'Categoría no encontrada', code: 'NOT_FOUND' } },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: category,
    });
  } catch (error) {
    console.error('Error in admin B2B categories PATCH API:', error);
    return NextResponse.json(
      { success: false, error: { message: 'Error interno del servidor', code: 'INTERNAL_ERROR' } },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/b2b/categories
 * Elimina una categoría B2B
 */
export async function DELETE(request: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: { message: 'ID de la categoría es requerido', code: 'VALIDATION_ERROR' } },
        { status: 400 }
      );
    }

    const { data: category, error } = await supabase
      .from('b2b_categories')
      .delete()
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error deleting B2B category:', error);
      return NextResponse.json(
        { success: false, error: { message: error.message, code: 'DB_ERROR' } },
        { status: 400 }
      );
    }

    if (!category) {
      return NextResponse.json(
        { success: false, error: { message: 'Categoría no encontrada', code: 'NOT_FOUND' } },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { message: 'Categoría eliminada correctamente' },
    });
  } catch (error) {
    console.error('Error in admin B2B categories DELETE API:', error);
    return NextResponse.json(
      { success: false, error: { message: 'Error interno del servidor', code: 'INTERNAL_ERROR' } },
      { status: 500 }
    );
  }
}
