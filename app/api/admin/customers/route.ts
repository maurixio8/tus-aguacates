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

    // Consultar profiles con su email de auth.users y estadísticas de pedidos
    let query = supabase
      .from('profiles')
      .select(`
        id,
        full_name,
        phone,
        avatar_url,
        role,
        created_at,
        updated_at
      `, { count: 'exact' });

    // Solo clientes, no admins
    query = query.eq('role', 'customer');

    // Búsqueda por nombre o teléfono
    if (search) {
      query = query.or(`full_name.ilike.%${search}%,phone.ilike.%${search}%`);
    }

    // Ordenamiento
    query = query.order(sortBy, { ascending: sortOrder === 'asc' });

    // Paginación
    query = query.range((page - 1) * limit, page * limit - 1);

    const { data: profiles, error, count } = await query;

    if (error) {
      console.error('Error fetching customers:', error);
      return NextResponse.json(
        { error: 'Error al cargar clientes', details: error.message },
        { status: 500 }
      );
    }

    // Obtener clientes invitados únicos de guest_orders
    const { data: guestOrders } = await supabase
      .from('guest_orders')
      .select('guest_name, guest_email, guest_phone, guest_address, total_amount, created_at')
      .order('created_at', { ascending: false });

    // Agrupar clientes invitados por teléfono (clave única)
    const guestCustomersMap = new Map();
    (guestOrders || []).forEach((order) => {
      const key = order.guest_phone.trim();
      if (!guestCustomersMap.has(key)) {
        guestCustomersMap.set(key, {
          phone: order.guest_phone,
          name: order.guest_name,
          email: order.guest_email || null,
          address: order.guest_address,
          orders: [],
          created_at: order.created_at,
        });
      }
      guestCustomersMap.get(key).orders.push({
        total: order.total_amount,
        created_at: order.created_at,
      });
    });

    // Convertir clientes invitados a array con estadísticas
    const guestCustomers = Array.from(guestCustomersMap.values()).map((guest) => ({
      id: `guest-${guest.phone}`, // ID temporal para clientes invitados
      name: guest.name,
      phone: guest.phone,
      email: guest.email,
      address: guest.address,
      city: null,
      neighborhood: null,
      notes: 'Cliente invitado (sin cuenta)',
      total_orders: guest.orders.length,
      total_spent: guest.orders.reduce((sum: number, order: any) => sum + order.total, 0),
      last_order_date: guest.orders[0]?.created_at || null,
      is_active: true,
      created_at: guest.created_at,
      is_guest: true, // Flag para identificar clientes invitados
    }));

    // Obtener emails de auth.users y estadísticas de pedidos para perfiles registrados
    const enrichedProfiles = await Promise.all(
      (profiles || []).map(async (profile) => {
        // Obtener email de auth.users
        const { data: authUser } = await supabase.auth.admin.getUserById(profile.id);

        // Obtener estadísticas de pedidos registrados
        const { data: orders } = await supabase
          .from('orders')
          .select('total, created_at')
          .eq('user_id', profile.id)
          .order('created_at', { ascending: false });

        // Obtener pedidos invitados del mismo teléfono (antes de registrarse)
        let guestOrdersForProfile: any[] = [];
        if (profile.phone) {
          const { data: guestOrdersData } = await supabase
            .from('guest_orders')
            .select('total_amount, created_at')
            .eq('guest_phone', profile.phone);
          guestOrdersForProfile = guestOrdersData || [];
        }

        // Combinar pedidos registrados + pedidos invitados
        const allOrders = [
          ...(orders || []).map(o => ({ total: o.total, created_at: o.created_at })),
          ...guestOrdersForProfile.map(o => ({ total: o.total_amount, created_at: o.created_at })),
        ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

        const totalOrders = allOrders.length;
        const totalSpent = allOrders.reduce((sum: number, order: any) => sum + (order.total || 0), 0);
        const lastOrderDate = allOrders[0]?.created_at || null;

        // Obtener dirección principal del usuario
        const { data: addresses } = await supabase
          .from('addresses')
          .select('street_address, city')
          .eq('user_id', profile.id)
          .eq('is_default', true)
          .limit(1);

        return {
          id: profile.id,
          name: profile.full_name || 'Sin nombre',
          phone: profile.phone || 'Sin teléfono',
          email: authUser?.user?.email || null,
          address: addresses?.[0]?.street_address || null,
          city: addresses?.[0]?.city || null,
          neighborhood: null,
          notes: null,
          total_orders: totalOrders,
          total_spent: totalSpent,
          last_order_date: lastOrderDate,
          is_active: true,
          created_at: profile.created_at,
          is_guest: false,
        };
      })
    );

    // Filtrar clientes invitados que ya están registrados (mismo teléfono)
    const registeredPhones = new Set(
      enrichedProfiles
        .filter(p => p.phone && p.phone !== 'Sin teléfono')
        .map(p => p.phone.trim())
    );

    const uniqueGuestCustomers = guestCustomers.filter(
      (guest) => !registeredPhones.has(guest.phone.trim())
    );

    // Combinar clientes registrados + invitados únicos
    const allCustomers = [...enrichedProfiles, ...uniqueGuestCustomers];

    // Aplicar búsqueda a la lista combinada
    let filteredCustomers = allCustomers;
    if (search) {
      const searchLower = search.toLowerCase();
      filteredCustomers = allCustomers.filter(
        (customer) =>
          customer.name.toLowerCase().includes(searchLower) ||
          customer.phone.toLowerCase().includes(searchLower) ||
          (customer.email && customer.email.toLowerCase().includes(searchLower))
      );
    }

    // Aplicar paginación a la lista filtrada
    const totalFiltered = filteredCustomers.length;
    const paginatedCustomers = filteredCustomers.slice(
      (page - 1) * limit,
      page * limit
    );

    return NextResponse.json({
      success: true,
      data: paginatedCustomers,
      pagination: {
        page,
        limit,
        total: totalFiltered,
        totalPages: Math.ceil(totalFiltered / limit)
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

// POST - Crear nuevo cliente (crear usuario en auth y perfil)
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

    // Email es requerido para crear usuario en auth
    if (!body.email) {
      return NextResponse.json(
        { error: 'Email es requerido para crear un cliente' },
        { status: 400 }
      );
    }

    const supabase = createSupabaseClient();

    // Verificar si ya existe un cliente con ese teléfono
    const { data: existing } = await supabase
      .from('profiles')
      .select('id, full_name')
      .eq('phone', body.phone)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: `Ya existe un cliente con ese teléfono: ${existing.full_name}`, existingCustomer: existing },
        { status: 409 }
      );
    }

    // Crear usuario en auth.users con email y contraseña temporal
    const tempPassword = Math.random().toString(36).slice(-12) + 'Aa1!';
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: body.email,
      password: tempPassword,
      email_confirm: true, // Auto-confirmar email
      user_metadata: {
        full_name: body.name,
      }
    });

    if (authError) {
      console.error('Error creating auth user:', authError);
      return NextResponse.json(
        { error: 'Error al crear usuario', details: authError.message },
        { status: 500 }
      );
    }

    // Actualizar perfil con información adicional
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .update({
        phone: body.phone,
        full_name: body.name,
      })
      .eq('id', authData.user.id)
      .select()
      .single();

    if (profileError) {
      console.error('Error updating profile:', profileError);
      // Intentar eliminar el usuario creado
      await supabase.auth.admin.deleteUser(authData.user.id);
      return NextResponse.json(
        { error: 'Error al crear perfil de cliente', details: profileError.message },
        { status: 500 }
      );
    }

    // Si hay dirección, crearla en la tabla addresses
    if (body.address) {
      await supabase
        .from('addresses')
        .insert({
          user_id: authData.user.id,
          label: 'Principal',
          full_name: body.name,
          phone: body.phone,
          street_address: body.address,
          city: body.city || 'Bogotá',
          state: body.city || 'Bogotá',
          is_default: true,
        });
    }

    return NextResponse.json({
      success: true,
      data: {
        id: authData.user.id,
        name: body.name,
        phone: body.phone,
        email: body.email,
        created_at: authData.user.created_at,
      },
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

// PATCH - Actualizar cliente o convertir cliente invitado en registrado
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

    // Verificar si es un cliente invitado (ID empieza con 'guest-')
    if (customerId.startsWith('guest-')) {
      // Convertir cliente invitado en cliente registrado
      const phone = customerId.replace('guest-', '');

      if (!body.email) {
        return NextResponse.json(
          { error: 'Email es requerido para convertir cliente invitado en registrado' },
          { status: 400 }
        );
      }

      // Crear usuario en auth.users
      const tempPassword = Math.random().toString(36).slice(-12) + 'Aa1!';
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: body.email,
        password: tempPassword,
        email_confirm: true,
        user_metadata: {
          full_name: body.name,
        }
      });

      if (authError) {
        return NextResponse.json(
          { error: 'Error al crear cuenta de usuario', details: authError.message },
          { status: 500 }
        );
      }

      // Actualizar perfil
      await supabase
        .from('profiles')
        .update({
          full_name: body.name,
          phone: phone,
        })
        .eq('id', authData.user.id);

      // Crear dirección si se proporcionó
      if (body.address) {
        await supabase
          .from('addresses')
          .insert({
            user_id: authData.user.id,
            label: 'Principal',
            full_name: body.name,
            phone: phone,
            street_address: body.address,
            city: body.city || 'Bogotá',
            state: body.city || 'Bogotá',
            is_default: true,
          });
      }

      return NextResponse.json({
        success: true,
        data: { id: authData.user.id, converted: true },
        message: 'Cliente invitado convertido a cliente registrado'
      });
    }

    // Si se está actualizando el teléfono, verificar que no exista otro cliente con ese número
    if (body.phone) {
      const { data: existing } = await supabase
        .from('profiles')
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

    // Actualizar perfil
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .update({
        full_name: body.name,
        phone: body.phone,
      })
      .eq('id', customerId)
      .select()
      .single();

    if (profileError) {
      console.error('Error updating profile:', profileError);
      return NextResponse.json(
        { error: 'Error al actualizar perfil', details: profileError.message },
        { status: 500 }
      );
    }

    // Si se actualizó el email, actualizar en auth.users
    if (body.email) {
      await supabase.auth.admin.updateUserById(customerId, {
        email: body.email,
      });
    }

    // Actualizar o crear dirección si se proporcionó
    if (body.address) {
      // Buscar dirección principal existente
      const { data: existingAddress } = await supabase
        .from('addresses')
        .select('id')
        .eq('user_id', customerId)
        .eq('is_default', true)
        .single();

      if (existingAddress) {
        // Actualizar dirección existente
        await supabase
          .from('addresses')
          .update({
            street_address: body.address,
            city: body.city || 'Bogotá',
            state: body.city || 'Bogotá',
          })
          .eq('id', existingAddress.id);
      } else {
        // Crear nueva dirección
        await supabase
          .from('addresses')
          .insert({
            user_id: customerId,
            label: 'Principal',
            full_name: body.name,
            phone: body.phone,
            street_address: body.address,
            city: body.city || 'Bogotá',
            state: body.city || 'Bogotá',
            is_default: true,
          });
      }
    }

    return NextResponse.json({
      success: true,
      data: profileData,
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

// DELETE - Eliminar cliente (eliminar usuario de auth)
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

    // No permitir eliminar clientes invitados
    if (customerId.startsWith('guest-')) {
      return NextResponse.json(
        { error: 'No se puede eliminar un cliente invitado. Puedes editarlo para convertirlo en cliente registrado.' },
        { status: 400 }
      );
    }

    const supabase = createSupabaseClient();

    // Eliminar usuario de auth.users (esto también eliminará el perfil en cascade)
    const { error } = await supabase.auth.admin.deleteUser(customerId);

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
