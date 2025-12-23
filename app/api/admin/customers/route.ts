import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseClient } from '@/lib/auth-admin';

export const dynamic = 'force-dynamic';

// GET - Listar clientes con búsqueda y paginación
// Ahora lee de TODAS las fuentes: customers, profiles, y guest_orders
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const sortBy = searchParams.get('sortBy') || 'created_at';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const source = searchParams.get('source') || 'all'; // 'all', 'customers', 'profiles', 'guests'

    const supabase = createSupabaseClient();

    let allCustomers: any[] = [];
    const phonesSeen = new Set<string>();

    // ========================================
    // 1. FUENTE PRINCIPAL: Tabla customers
    // ========================================
    if (source === 'all' || source === 'customers') {
      let customersQuery = supabase
        .from('customers')
        .select('*', { count: 'exact' });

      // Búsqueda
      if (search) {
        customersQuery = customersQuery.or(`name.ilike.%${search}%,phone.ilike.%${search}%,email.ilike.%${search}%`);
      }

      const { data: customersData, error: customersError } = await customersQuery;

      if (customersError) {
        console.log('⚠️ Tabla customers no existe o error:', customersError.message);
      } else if (customersData) {
        console.log(`✅ Encontrados ${customersData.length} clientes en tabla customers`);

        for (const customer of customersData) {
          const phoneKey = (customer.phone || '').trim().toLowerCase();
          if (phoneKey && !phonesSeen.has(phoneKey)) {
            phonesSeen.add(phoneKey);
            allCustomers.push({
              id: customer.id,
              name: customer.name,
              phone: customer.phone,
              email: customer.email || null,
              address: customer.address,
              neighborhood: customer.neighborhood,
              city: customer.city || 'Bogotá',
              notes: customer.notes,
              total_orders: customer.total_orders || 0,
              total_spent: parseFloat(customer.total_spent) || 0,
              last_order_date: customer.last_order_date,
              is_active: customer.is_active !== false,
              created_at: customer.created_at,
              is_guest: false,
              source: 'customers'
            });
          }
        }
      }
    }

    // ========================================
    // 2. FUENTE SECUNDARIA: Tabla profiles (usuarios registrados)
    // ========================================
    if (source === 'all' || source === 'profiles') {
      let profilesQuery = supabase
        .from('profiles')
        .select('*')
        .eq('role', 'customer');

      if (search) {
        profilesQuery = profilesQuery.or(`full_name.ilike.%${search}%,phone.ilike.%${search}%`);
      }

      const { data: profilesData, error: profilesError } = await profilesQuery;

      if (profilesError) {
        console.log('⚠️ Error en profiles:', profilesError.message);
      } else if (profilesData) {
        console.log(`✅ Encontrados ${profilesData.length} perfiles registrados`);

        for (const profile of profilesData) {
          const phoneKey = (profile.phone || '').trim().toLowerCase();

          // Solo agregar si no existe ya (por teléfono)
          if (!phoneKey || !phonesSeen.has(phoneKey)) {
            if (phoneKey) phonesSeen.add(phoneKey);

            // Obtener estadísticas de pedidos
            const { data: orders } = await supabase
              .from('orders')
              .select('total, created_at')
              .eq('user_id', profile.id);

            const totalOrders = orders?.length || 0;
            const totalSpent = orders?.reduce((sum: number, o: any) => sum + (parseFloat(o.total) || 0), 0) || 0;
            const lastOrderDate = orders?.[0]?.created_at || null;

            // Obtener email de auth.users
            let email = null;
            try {
              const { data: authUser } = await supabase.auth.admin.getUserById(profile.id);
              email = authUser?.user?.email || null;
            } catch (e) {
              // Ignorar errores de auth
            }

            // Obtener dirección
            const { data: addresses } = await supabase
              .from('addresses')
              .select('street_address, city, neighborhood')
              .eq('user_id', profile.id)
              .eq('is_default', true)
              .limit(1);

            allCustomers.push({
              id: profile.id,
              name: profile.full_name || 'Sin nombre',
              phone: profile.phone || 'Sin teléfono',
              email: email,
              address: addresses?.[0]?.street_address || null,
              neighborhood: addresses?.[0]?.neighborhood || null,
              city: addresses?.[0]?.city || 'Bogotá',
              notes: null,
              total_orders: totalOrders,
              total_spent: totalSpent,
              last_order_date: lastOrderDate,
              is_active: true,
              created_at: profile.created_at,
              is_guest: false,
              source: 'profiles'
            });
          }
        }
      }
    }

    // ========================================
    // 3. FUENTE TERCIARIA: guest_orders (clientes invitados)
    // ========================================
    if (source === 'all' || source === 'guests') {
      const { data: guestOrders, error: guestError } = await supabase
        .from('guest_orders')
        .select('guest_name, guest_email, guest_phone, guest_address, total_amount, created_at')
        .order('created_at', { ascending: false });

      if (guestError) {
        console.log('⚠️ Error en guest_orders:', guestError.message);
      } else if (guestOrders) {
        console.log(`✅ Encontrados ${guestOrders.length} pedidos de invitados`);

        // Agrupar por teléfono
        const guestMap = new Map<string, any>();

        for (const order of guestOrders) {
          const phoneKey = (order.guest_phone || '').trim().toLowerCase();
          if (!phoneKey) continue;

          // Solo procesar si no existe en otras fuentes
          if (phonesSeen.has(phoneKey)) continue;

          if (!guestMap.has(phoneKey)) {
            guestMap.set(phoneKey, {
              name: order.guest_name,
              phone: order.guest_phone,
              email: order.guest_email,
              address: order.guest_address,
              orders: [],
              created_at: order.created_at
            });
          }

          guestMap.get(phoneKey).orders.push({
            total: parseFloat(order.total_amount) || 0,
            created_at: order.created_at
          });
        }

        // Convertir a array
        for (const [phoneKey, guest] of guestMap) {
          phonesSeen.add(phoneKey);

          allCustomers.push({
            id: `guest-${guest.phone}`,
            name: guest.name,
            phone: guest.phone,
            email: guest.email || null,
            address: guest.address,
            neighborhood: null,
            city: 'Bogotá',
            notes: 'Cliente invitado (sin cuenta)',
            total_orders: guest.orders.length,
            total_spent: guest.orders.reduce((sum: number, o: any) => sum + o.total, 0),
            last_order_date: guest.orders[0]?.created_at || null,
            is_active: true,
            created_at: guest.created_at,
            is_guest: true,
            source: 'guest_orders'
          });
        }
      }
    }

    // ========================================
    // 4. FILTRAR Y ORDENAR
    // ========================================

    // Aplicar búsqueda adicional si es necesario
    if (search) {
      const searchLower = search.toLowerCase();
      allCustomers = allCustomers.filter(c =>
        c.name?.toLowerCase().includes(searchLower) ||
        c.phone?.toLowerCase().includes(searchLower) ||
        c.email?.toLowerCase().includes(searchLower)
      );
    }

    // Ordenar
    allCustomers.sort((a, b) => {
      let aVal = a[sortBy];
      let bVal = b[sortBy];

      if (sortBy === 'total_spent' || sortBy === 'total_orders') {
        aVal = parseFloat(aVal) || 0;
        bVal = parseFloat(bVal) || 0;
      }

      if (aVal === null || aVal === undefined) aVal = '';
      if (bVal === null || bVal === undefined) bVal = '';

      if (sortOrder === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });

    // Total antes de paginar
    const total = allCustomers.length;

    // Aplicar paginación
    const startIndex = (page - 1) * limit;
    const paginatedCustomers = allCustomers.slice(startIndex, startIndex + limit);

    console.log(`📊 Total clientes encontrados: ${total} (mostrando página ${page}, ${paginatedCustomers.length} items)`);

    return NextResponse.json({
      success: true,
      data: paginatedCustomers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      },
      sources: {
        customers: allCustomers.filter(c => c.source === 'customers').length,
        profiles: allCustomers.filter(c => c.source === 'profiles').length,
        guests: allCustomers.filter(c => c.source === 'guest_orders').length
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

    const supabase = createSupabaseClient();

    // Verificar si ya existe un cliente con ese teléfono en la tabla customers
    const { data: existingCustomer } = await supabase
      .from('customers')
      .select('id, name')
      .eq('phone', body.phone)
      .single();

    if (existingCustomer) {
      return NextResponse.json(
        { error: `Ya existe un cliente con ese teléfono: ${existingCustomer.name}`, existingCustomer },
        { status: 409 }
      );
    }

    // Crear cliente en la tabla customers
    const { data: newCustomer, error: insertError } = await supabase
      .from('customers')
      .insert({
        name: body.name,
        phone: body.phone,
        email: body.email || null,
        address: body.address || null,
        neighborhood: body.neighborhood || null,
        city: body.city || 'Bogotá',
        notes: body.notes || null,
        total_orders: 0,
        total_spent: 0,
        is_active: true
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating customer:', insertError);
      return NextResponse.json(
        { error: 'Error al crear cliente', details: insertError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: newCustomer,
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

    // Si es un cliente invitado (ID empieza con 'guest-')
    if (customerId.startsWith('guest-')) {
      const phone = customerId.replace('guest-', '');

      // Crear nuevo cliente en la tabla customers
      const { data: newCustomer, error: insertError } = await supabase
        .from('customers')
        .insert({
          name: body.name,
          phone: phone,
          email: body.email || null,
          address: body.address || null,
          neighborhood: body.neighborhood || null,
          city: body.city || 'Bogotá',
          notes: body.notes || null,
          is_active: true
        })
        .select()
        .single();

      if (insertError) {
        return NextResponse.json(
          { error: 'Error al convertir cliente invitado', details: insertError.message },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        data: newCustomer,
        message: 'Cliente invitado convertido exitosamente'
      });
    }

    // Actualizar cliente existente en tabla customers
    const updateData: Record<string, any> = {
      updated_at: new Date().toISOString()
    };

    if (body.name !== undefined) updateData.name = body.name;
    if (body.phone !== undefined) updateData.phone = body.phone;
    if (body.email !== undefined) updateData.email = body.email || null;
    if (body.address !== undefined) updateData.address = body.address || null;
    if (body.neighborhood !== undefined) updateData.neighborhood = body.neighborhood || null;
    if (body.city !== undefined) updateData.city = body.city || 'Bogotá';
    if (body.notes !== undefined) updateData.notes = body.notes || null;
    if (body.is_active !== undefined) updateData.is_active = body.is_active;

    const { data: updatedCustomer, error: updateError } = await supabase
      .from('customers')
      .update(updateData)
      .eq('id', customerId)
      .select()
      .single();

    if (updateError) {
      // Si no existe en customers, intentar en profiles
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: body.name,
          phone: body.phone,
          updated_at: new Date().toISOString()
        })
        .eq('id', customerId)
        .select()
        .single();

      if (profileError) {
        return NextResponse.json(
          { error: 'Error al actualizar cliente', details: updateError.message },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        data: profileData,
        message: 'Perfil actualizado exitosamente'
      });
    }

    return NextResponse.json({
      success: true,
      data: updatedCustomer,
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

// DELETE - Eliminar cliente
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

    // Intentar eliminar de tabla customers primero
    const { error: customersDeleteError } = await supabase
      .from('customers')
      .delete()
      .eq('id', customerId);

    if (customersDeleteError) {
      // Si no existe en customers, intentar en auth.users (que elimina profiles en cascade)
      const { error: authDeleteError } = await supabase.auth.admin.deleteUser(customerId);

      if (authDeleteError) {
        return NextResponse.json(
          { error: 'Error al eliminar cliente', details: authDeleteError.message },
          { status: 500 }
        );
      }
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
