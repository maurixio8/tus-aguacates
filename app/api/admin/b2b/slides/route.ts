/**
 * API Routes para gestión admin de Slides B2B
 * "Tus Aguacates" - Panel de Administración
 */

import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { requireAdminRole } from '@/lib/auth-admin';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * GET /api/admin/b2b/slides
 * Obtiene lista de slides B2B
 */
export async function GET(request: NextRequest) {
  try {
    const adminAccess = await requireAdminRole(request, 'viewer');
    if (adminAccess.response) {
      return adminAccess.response;
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: slides, error } = await supabase
      .from('b2b_slides')
      .select('*')
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('Error fetching B2B slides:', error);
      return NextResponse.json(
        { success: false, error: { message: 'Error al obtener slides', code: 'DB_ERROR' } },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: slides || [],
    });
  } catch (error) {
    console.error('Error in admin B2B slides GET API:', error);
    return NextResponse.json(
      { success: false, error: { message: 'Error interno del servidor', code: 'INTERNAL_ERROR' } },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/b2b/slides
 * Crea un nuevo slide B2B
 */
export async function POST(request: NextRequest) {
  try {
    const adminAccess = await requireAdminRole(request, 'admin');
    if (adminAccess.response) {
      return adminAccess.response;
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = await request.json();

    if (!body.title || !body.image_url) {
      return NextResponse.json(
        { success: false, error: { message: 'Título e imagen son requeridos', code: 'VALIDATION_ERROR' } },
        { status: 400 }
      );
    }

    const { data: slide, error } = await supabase
      .from('b2b_slides')
      .insert({
        title: body.title,
        description: body.description || null,
        image_url: body.image_url,
        link: body.link || null,
        sort_order: body.sort_order || 0,
        is_active: body.is_active !== undefined ? body.is_active : true,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating B2B slide:', error);
      return NextResponse.json(
        { success: false, error: { message: error.message, code: 'DB_ERROR' } },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: slide,
    }, { status: 201 });
  } catch (error) {
    console.error('Error in admin B2B slides POST API:', error);
    return NextResponse.json(
      { success: false, error: { message: 'Error interno del servidor', code: 'INTERNAL_ERROR' } },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/b2b/slides
 * Actualiza un slide B2B
 */
export async function PATCH(request: NextRequest) {
  try {
    const adminAccess = await requireAdminRole(request, 'admin');
    if (adminAccess.response) {
      return adminAccess.response;
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: { message: 'ID del slide es requerido', code: 'VALIDATION_ERROR' } },
        { status: 400 }
      );
    }

    const body = await request.json();

    const allowedFields = ['title', 'description', 'image_url', 'link', 'sort_order', 'is_active'];

    const updateData: any = {};
    allowedFields.forEach(field => {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    });

    const { data: slide, error } = await supabase
      .from('b2b_slides')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating B2B slide:', error);
      return NextResponse.json(
        { success: false, error: { message: error.message, code: 'DB_ERROR' } },
        { status: 400 }
      );
    }

    if (!slide) {
      return NextResponse.json(
        { success: false, error: { message: 'Slide no encontrado', code: 'NOT_FOUND' } },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: slide,
    });
  } catch (error) {
    console.error('Error in admin B2B slides PATCH API:', error);
    return NextResponse.json(
      { success: false, error: { message: 'Error interno del servidor', code: 'INTERNAL_ERROR' } },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/b2b/slides
 * Elimina un slide B2B
 */
export async function DELETE(request: NextRequest) {
  try {
    const adminAccess = await requireAdminRole(request, 'super_admin');
    if (adminAccess.response) {
      return adminAccess.response;
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: { message: 'ID del slide es requerido', code: 'VALIDATION_ERROR' } },
        { status: 400 }
      );
    }

    const { data: slide, error } = await supabase
      .from('b2b_slides')
      .delete()
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error deleting B2B slide:', error);
      return NextResponse.json(
        { success: false, error: { message: error.message, code: 'DB_ERROR' } },
        { status: 400 }
      );
    }

    if (!slide) {
      return NextResponse.json(
        { success: false, error: { message: 'Slide no encontrado', code: 'NOT_FOUND' } },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { message: 'Slide eliminado correctamente' },
    });
  } catch (error) {
    console.error('Error in admin B2B slides DELETE API:', error);
    return NextResponse.json(
      { success: false, error: { message: 'Error interno del servidor', code: 'INTERNAL_ERROR' } },
      { status: 500 }
    );
  }
}
