import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseClient } from '@/lib/auth-admin';

export const dynamic = 'force-dynamic';

// GET - Listar clientes con búsqueda y paginación
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const sortBy = searchParams.get('sortBy') || 'created_at';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    const supabase = createSupabaseClient();

    let query = supabase
      .from('customers')
      .select('*', { count: 'exact' });

    // Búsqueda por nombre, teléfono o email
    if (search) {
      query = query.or(`name.ilike.%${search}%,phone.ilike.%${search}%,email.ilike.%${search}%`);
    }

    // Ordenamiento
    query = query.order(sortBy, { ascending: sortOrder === 'asc' });

    // Paginación
    query = query.range((page - 1) * limit, page * limit - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching customers:', error);
      return NextResponse.json(
        { error: 'Error al cargar clientes', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    });

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// POST - Crear nuevo cliente
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validar campos requeridos
    if (!body.name || !body.phone) {
      return NextResponse.json(
        { error: 'Nombre y teléfono son requeridos' },
        { status: 400 }
      );
    }

    const supabase = createSupabaseClient();

    // Verificar si ya existe un cliente con ese teléfono
    const { data: existing } = await supabase
      .from('customers')
      .select('id, name')
      .eq('phone', body.phone)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: `Ya existe un cliente con ese teléfono: ${existing.name}`, existingCustomer: existing },
        { status: 409 }
      );
    }

    // Crear cliente
    const { data, error } = await supabase
      .from('customers')
      .insert({
        name: body.name,
        phone: body.phone,
        email: body.email || null,
        address: body.address || null,
        neighborhood: body.neighborhood || null,
        city: body.city || 'Bogotá',
        notes: body.notes || null,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating customer:', error);
      return NextResponse.json(
        { error: 'Error al crear cliente', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data,
      message: 'Cliente creado exitosamente'
    }, { status: 201 });

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// PATCH - Actualizar cliente
export async function PATCH(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get('id');

    if (!customerId) {
      return NextResponse.json(
        { error: 'ID de cliente requerido' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const supabase = createSupabaseClient();

    // Si se está actualizando el teléfono, verificar que no exista otro cliente con ese número
    if (body.phone) {
      const { data: existing } = await supabase
        .from('customers')
        .select('id')
        .eq('phone', body.phone)
        .neq('id', customerId)
        .single();

      if (existing) {
        return NextResponse.json(
          { error: 'Ya existe otro cliente con ese teléfono' },
          { status: 409 }
        );
      }
    }

    const { data, error } = await supabase
      .from('customers')
      .update({
        ...body,
        updated_at: new Date().toISOString()
      })
      .eq('id', customerId)
      .select()
      .single();

    if (error) {
      console.error('Error updating customer:', error);
      return NextResponse.json(
        { error: 'Error al actualizar cliente', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data,
      message: 'Cliente actualizado exitosamente'
    });

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar cliente (soft delete)
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get('id');

    if (!customerId) {
      return NextResponse.json(
        { error: 'ID de cliente requerido' },
        { status: 400 }
      );
    }

    const supabase = createSupabaseClient();

    // Soft delete - marcar como inactivo
    const { error } = await supabase
      .from('customers')
      .update({
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', customerId);

    if (error) {
      console.error('Error deleting customer:', error);
      return NextResponse.json(
        { error: 'Error al eliminar cliente', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Cliente eliminado exitosamente'
    });

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
