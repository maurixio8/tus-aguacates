/**
 * API Routes para gestión admin de Banner Messages B2B
 * "Tus Aguacates" - Panel de Administración
 */

import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * GET /api/admin/b2b/banner-messages
 * Obtiene lista de mensajes de banner B2B
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: messages, error } = await supabase
      .from('b2b_banner_messages')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching B2B banner messages:', error);
      return NextResponse.json(
        { success: false, error: { message: 'Error al obtener mensajes', code: 'DB_ERROR' } },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: messages || [],
    });
  } catch (error) {
    console.error('Error in admin B2B banner messages GET API:', error);
    return NextResponse.json(
      { success: false, error: { message: 'Error interno del servidor', code: 'INTERNAL_ERROR' } },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/b2b/banner-messages
 * Crea un nuevo mensaje de banner B2B
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = await request.json();

    if (!body.message) {
      return NextResponse.json(
        { success: false, error: { message: 'Mensaje es requerido', code: 'VALIDATION_ERROR' } },
        { status: 400 }
      );
    }

    const { data: message, error } = await supabase
      .from('b2b_banner_messages')
      .insert({
        message: body.message,
        message_type: body.message_type || 'info',
        is_active: body.is_active !== undefined ? body.is_active : true,
        start_date: body.start_date || null,
        end_date: body.end_date || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating B2B banner message:', error);
      return NextResponse.json(
        { success: false, error: { message: error.message, code: 'DB_ERROR' } },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: message,
    }, { status: 201 });
  } catch (error) {
    console.error('Error in admin B2B banner messages POST API:', error);
    return NextResponse.json(
      { success: false, error: { message: 'Error interno del servidor', code: 'INTERNAL_ERROR' } },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/b2b/banner-messages
 * Actualiza un mensaje de banner B2B
 */
export async function PATCH(request: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: { message: 'ID del mensaje es requerido', code: 'VALIDATION_ERROR' } },
        { status: 400 }
      );
    }

    const body = await request.json();

    const allowedFields = ['message', 'message_type', 'is_active', 'start_date', 'end_date'];

    const updateData: any = {};
    allowedFields.forEach(field => {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    });

    const { data: message, error } = await supabase
      .from('b2b_banner_messages')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating B2B banner message:', error);
      return NextResponse.json(
        { success: false, error: { message: error.message, code: 'DB_ERROR' } },
        { status: 400 }
      );
    }

    if (!message) {
      return NextResponse.json(
        { success: false, error: { message: 'Mensaje no encontrado', code: 'NOT_FOUND' } },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: message,
    });
  } catch (error) {
    console.error('Error in admin B2B banner messages PATCH API:', error);
    return NextResponse.json(
      { success: false, error: { message: 'Error interno del servidor', code: 'INTERNAL_ERROR' } },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/b2b/banner-messages
 * Elimina un mensaje de banner B2B
 */
export async function DELETE(request: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: { message: 'ID del mensaje es requerido', code: 'VALIDATION_ERROR' } },
        { status: 400 }
      );
    }

    const { data: message, error } = await supabase
      .from('b2b_banner_messages')
      .delete()
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error deleting B2B banner message:', error);
      return NextResponse.json(
        { success: false, error: { message: error.message, code: 'DB_ERROR' } },
        { status: 400 }
      );
    }

    if (!message) {
      return NextResponse.json(
        { success: false, error: { message: 'Mensaje no encontrado', code: 'NOT_FOUND' } },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { message: 'Mensaje eliminado correctamente' },
    });
  } catch (error) {
    console.error('Error in admin B2B banner messages DELETE API:', error);
    return NextResponse.json(
      { success: false, error: { message: 'Error interno del servidor', code: 'INTERNAL_ERROR' } },
      { status: 500 }
    );
  }
}
